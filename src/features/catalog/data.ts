import type { Store } from "@/shared/lib/types";
import { coordinateDistanceKm, offsetCoordinate, snapCoordinateToRoad } from "@/features/tracking/geo";





import { supabase } from "@/shared/api/supabase";

export async function fetchStoresFromSupabase(): Promise<Store[]> {
  const { data: storesData, error: storesError } = await supabase.from('stores').select('*');
  const { data: productsData, error: productsError } = await supabase.from('products').select('*');

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
    category: { tr: store.category_tr, en: store.category_en },
    badge: store.badge_tr ? { tr: store.badge_tr, en: store.badge_en || "" } : undefined,
    reviews: store.reviews,
    eta: store.eta,
    coordinate: store.coordinates,
    menu: productsData ? productsData.filter((p) => p.store_id === store.id).map((p) => ({
      ...p,
      name: { tr: p.name_tr, en: p.name_en },
      description: { tr: p.description_tr, en: p.description_en },
      optionGroups: p.option_groups
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
    category_tr: store.category.tr,
    category_en: store.category.en,
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
    option_groups: p.optionGroups || []
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
