"use server";

import { supabaseAdmin } from "@/shared/api/supabase-admin";
import { cookies } from "next/headers";
import type { Store, StoreCategory, ProductCategory, GlobalConfig } from "@/shared/lib/types";

// --- AUTHENTICATION ---

export async function loginAdmin(password: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('config')
    .select('data')
    .eq('id', 'admin_credentials')
    .single();

  if (error || !data) {
    console.error("Admin credentials not found or error:", error);
    return false;
  }

  const validPassword = data.data.password;
  if (password === validPassword) {
    const cookieStore = await cookies();
    cookieStore.set('doppapp_admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    return true;
  }
  return false;
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('doppapp_admin_session')?.value === 'true';
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('doppapp_admin_session');
}

// --- DATA MUTATIONS ---

async function verifyAuth() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) throw new Error("Unauthorized");
}

export async function saveStoreToSupabaseAction(store: Store): Promise<boolean> {
  await verifyAuth();
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

  const { error: storeError } = await supabaseAdmin.from('stores').upsert(storeRow);
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
    const { error: productsError } = await supabaseAdmin.from('products').upsert(productRows);
    if (productsError) {
      console.error("Products upsert error:", productsError);
      return false;
    }
  }

  return true;
}

export async function deleteStoreFromSupabaseAction(id: string): Promise<boolean> {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('stores').delete().eq('id', id);
  if (error) console.error("Delete store error:", error);
  return !error;
}

export async function updateConfigAction(newConfig: GlobalConfig): Promise<boolean> {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('config').update({ data: newConfig }).eq('id', 'global');
  if (error) console.error("Update config error:", error);
  return !error;
}

export async function addStoreCategoryAction(category: StoreCategory): Promise<boolean> {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('store_categories').insert(category);
  if (error) console.error("Add store category error:", error);
  return !error;
}

export async function updateStoreCategoryAction(id: string, updates: Partial<StoreCategory>): Promise<boolean> {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('store_categories').update(updates).eq('id', id);
  if (error) console.error("Update store category error:", error);
  return !error;
}

export async function deleteStoreCategoryAction(id: string): Promise<boolean> {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('store_categories').delete().eq('id', id);
  if (error) console.error("Delete store category error:", error);
  return !error;
}

export async function addProductCategoryAction(category: ProductCategory): Promise<boolean> {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('product_categories').insert(category);
  if (error) console.error("Add product category error:", error);
  return !error;
}

export async function updateProductCategoryAction(id: string, updates: Partial<ProductCategory>): Promise<boolean> {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('product_categories').update(updates).eq('id', id);
  if (error) console.error("Update product category error:", error);
  return !error;
}

export async function deleteProductCategoryAction(id: string): Promise<boolean> {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('product_categories').delete().eq('id', id);
  if (error) console.error("Delete product category error:", error);
  return !error;
}

export async function uploadMenuImageAction(formData: FormData): Promise<{ url: string, filename: string } | null> {
  await verifyAuth();
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file uploaded");

  const ext = file.name.split('.').pop() || "jpg";
  const filename = `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { data, error } = await supabaseAdmin.storage
    .from('menu-images')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('menu-images')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    filename: filename
  };
}
