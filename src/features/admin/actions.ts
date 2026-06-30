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
  const rawSlug = formData.get('slug') as string | null;
  const oldFileUrl = formData.get('oldFileUrl') as string | null;
  if (!file) throw new Error("No file uploaded");

  // Delete the old file if it exists, to keep bucket clean
  if (oldFileUrl) {
    const urlParts = oldFileUrl.split('/menu-images/');
    if (urlParts.length === 2) {
      await supabaseAdmin.storage.from('menu-images').remove([urlParts[1]]);
    }
  }

  const ext = file.name.split('.').pop() || "jpg";
  
  let cleanSlug = "upload";
  if (rawSlug) {
    cleanSlug = rawSlug.toLowerCase()
      .replace(/[^a-z0-9ğüşöçİĞÜŞÖÇ]+/g, '-') // Allow turkish chars initially or just strip
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]+/g, '-') // final clean
      .replace(/(^-|-$)+/g, '');
    if (!cleanSlug) cleanSlug = "upload";
  }

  const filename = `${cleanSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

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

export async function sendPushNotificationAction(payload: { title_tr: string, message_tr: string, title_en: string, message_en: string, route?: string }) {
  await verifyAuth();
  
  try {
    const { data: devices, error: dbError } = await supabaseAdmin
      .from('device_tokens')
      .select('push_token, language');

    if (dbError) throw dbError;
    
    if (!devices || devices.length === 0) {
      // Log to database even if zero devices
      await supabaseAdmin.from('push_notification_logs').insert({
        title_tr: payload.title_tr,
        message_tr: payload.message_tr,
        title_en: payload.title_en,
        message_en: payload.message_en,
        route: payload.route || null,
        success_count: 0,
        error_count: 0
      });
      return { success: true, data: { success: 0, failed: 0, total: 0 } };
    }

    const messages = devices.map((device) => {
      const isEn = device.language === 'en';
      return {
        to: device.push_token,
        sound: 'default',
        title: isEn ? payload.title_en : payload.title_tr,
        body: isEn ? payload.message_en : payload.message_tr,
        data: { route: payload.route || '' },
      };
    });

    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let successCount = 0;
    let failureCount = 0;

    for (const chunk of chunks) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
        
        const result = await response.json();
        
        if (result.data) {
           result.data.forEach((ticket: { status: string; id?: string; message?: string; details?: Record<string, unknown> }) => {
             if (ticket.status === 'ok') {
               successCount++;
             } else {
               failureCount++;
               console.error('Expo Push Error:', ticket);
             }
           });
        }
      } catch (err) {
        console.error('Failed to send chunk:', err);
        failureCount += chunk.length;
      }
    }

    // Log to database
    await supabaseAdmin.from('push_notification_logs').insert({
      title_tr: payload.title_tr,
      message_tr: payload.message_tr,
      title_en: payload.title_en,
      message_en: payload.message_en,
      route: payload.route || null,
      success_count: successCount,
      error_count: failureCount
    });

    return { success: true, data: { success: successCount, failed: failureCount, total: messages.length } };

  } catch (error: unknown) {
    console.error("Push notification action error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" };
  }
}

export async function getPushNotificationLogsAction() {
  await verifyAuth();
  
  const { data, error } = await supabaseAdmin
    .from('push_notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to fetch push logs:", error);
    return [];
  }

  return data;
}
