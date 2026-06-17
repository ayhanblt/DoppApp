import type { Store, GlobalConfig, StoreCategory, ProductCategory } from "@/shared/lib/types";
import { coordinateDistanceKm, offsetCoordinate, snapCoordinateToRoad } from "@/features/tracking/geo";





import { supabase } from "@/shared/api/supabase";

export async function fetchConfigFromSupabase(): Promise<GlobalConfig | null> {
  const { data, error } = await supabase.from("config").select("data").eq("id", "global").single();
  if (error || !data) {
    console.error("Config fetch error", error);
    return null;
  }
  return data.data as GlobalConfig;
}

export async function saveConfigToSupabase(config: GlobalConfig): Promise<boolean> {
  const { error } = await supabase.from("config").upsert({ id: "global", data: config });
  if (error) {
    console.error("Config save error", error);
    return false;
  }
  return true;
}

export async function fetchStoreCategories() {
  const { data, error } = await supabase.from('store_categories').select('*').order('sort_order');
  if (error) console.error("Store categories fetch error", error);
  return data || [];
}

export async function fetchProductCategories() {
  const { data, error } = await supabase.from('product_categories').select('*').order('sort_order');
  if (error) console.error("Product categories fetch error", error);
  return data || [];
}

export async function addStoreCategory(category: StoreCategory) {
  const { error } = await supabase.from('store_categories').insert(category);
  return !error;
}

export async function updateStoreCategory(id: string, updates: Partial<StoreCategory>) {
  const { error } = await supabase.from('store_categories').update(updates).eq('id', id);
  return !error;
}

export async function deleteStoreCategory(id: string) {
  const { error } = await supabase.from('store_categories').delete().eq('id', id);
  return !error;
}

export async function addProductCategory(category: ProductCategory) {
  const { error } = await supabase.from('product_categories').insert(category);
  return !error;
}

export async function updateProductCategory(id: string, updates: Partial<ProductCategory>) {
  const { error } = await supabase.from('product_categories').update(updates).eq('id', id);
  return !error;
}

export async function deleteProductCategory(id: string) {
  const { error } = await supabase.from('product_categories').delete().eq('id', id);
  return !error;
}

export async function fetchStoresFromSupabase(): Promise<Store[]> {
  const { data: storesData, error: storesError } = await supabase.from('stores').select('*, store_categories(id, name_tr, name_en)');
  const { data: productsData, error: productsError } = await supabase.from('products').select('*, product_categories(id, name_tr, name_en)').order('product_category_id');

  if (storesError || productsError) {
    console.error("Supabase fetch error", storesError, productsError);
    return [];
  }

  if (!storesData || storesData.length === 0) {
    return [];
  }

  return storesData.map((store) => ({
    ...store,
    name: { tr: store.name_tr, en: store.name_en },
    description: { tr: store.description_tr || "", en: store.description_en || "" },
    category_id: store.category_id,
    store_categories: store.store_categories,
    badge: store.badge_tr ? { tr: store.badge_tr, en: store.badge_en || "" } : undefined,
    reviews: store.reviews,
    eta: store.eta,
    coordinate: store.coordinates,
    menu: productsData ? productsData.filter((p) => p.store_id === store.id).map((p) => ({
      ...p,
      name: { tr: p.name_tr, en: p.name_en },
      description: { tr: p.description_tr || "", en: p.description_en || "" },
      optionGroups: p.option_groups,
      product_category_id: p.product_category_id,
      section_label_tr: p.section_label_tr,
      section_label_en: p.section_label_en,
      section_color: p.section_color,
      product_categories: p.product_categories // For COALESCE logic in UI
    })) : []
  })) as Store[];
}

export async function saveStoreToSupabase(store: Store) {
  const storeRow = {
    id: store.id,
    type: store.type,
    name_tr: store.name.tr,
    name_en: store.name.en,
    description_tr: store.description?.tr || "",
    description_en: store.description?.en || "",
    category_id: store.category_id,
    logo: store.logo || "",
    badge_tr: store.badge?.tr || null,
    badge_en: store.badge?.en || null,
    rating: store.rating,
    reviews: store.reviews,
    eta: store.eta,
    delivery_fee: store.deliveryFee,
    coordinates: store.coordinate
  };

  const { error: storeError } = await supabase.from('stores').upsert(storeRow);
  if (storeError) {
    console.error("Store upsert error:", storeError);
    return false;
  }

  const productRows = store.menu.map((p) => ({
    id: p.id,
    store_id: store.id,
    name_tr: p.name.tr,
    name_en: p.name.en,
    description_tr: p.description.tr,
    description_en: p.description.en,
    price: p.price,
    image: p.image,
    calories: p.calories,
    option_groups: p.optionGroups || [],
    product_category_id: p.product_category_id,
    section_label_tr: p.section_label_tr || null,
    section_label_en: p.section_label_en || null,
    section_color: p.section_color || null
  }));

  if (productRows.length > 0) {
    const { error: productsError } = await supabase.from('products').upsert(productRows);
    if (productsError) {
      console.error("Products upsert error:", productsError);
      return false;
    }
  }

  return true;
}

export async function deleteStoreFromSupabase(storeId: string): Promise<boolean> {
  const { error } = await supabase.from('stores').delete().eq('id', storeId);
  if (error) {
    console.error("Store delete error", error);
    return false;
  }
  return true;
}

export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) {
    console.error("Product delete error", error);
    return false;
  }
  return true;
}

function storeSeed(id: string) {
  return id.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function getStoresAroundAddressSync(center: [number, number], dbStores: Store[]) {
  return dbStores.map((store, index) => {
    const seed = storeSeed(store.id);
    const distanceKm = 0.5 + ((seed * 37 + index * 53) % 450) / 100;
    const bearing = (seed * 29 + index * 47) % 360;

    return {
      ...store,
      coordinate: offsetCoordinate(center, distanceKm, bearing)
    };
  });
}

export async function getStoresOnRoadsAroundAddress(center: [number, number], dbStores: Store[]) {
  const candidates = getStoresAroundAddressSync(center, dbStores);
  const snapped = await Promise.all(
    candidates.map(async (store) => {
      const roadCoordinate = await snapCoordinateToRoad(store.coordinate).catch(() => null);
      if (!roadCoordinate) return store;

      const distanceKm = coordinateDistanceKm(center, roadCoordinate);
      if (distanceKm < 0.5 || distanceKm > 5) return store;

      return {
        ...store,
        coordinate: roadCoordinate
      };
    })
  );

  return snapped;
}
