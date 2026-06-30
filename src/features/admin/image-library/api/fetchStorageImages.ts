"use server";

import { supabaseAdmin } from "@/shared/api/supabase-admin";
import { checkAdminAuth } from "@/features/admin/actions";
import type { StorageImage, StorageFileItem } from "@/shared/lib/types";

// Yardımcı fonksiyon: Klasörleri özyinelemeli olarak tarar
async function listAllFiles(path: string = ''): Promise<StorageFileItem[]> {
  const { data, error } = await supabaseAdmin.storage
    .from('menu-images')
    .list(path, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error || !data) {
    console.error(`Görseller getirilirken hata oluştu (${path}):`, error);
    return [];
  }

  const allFiles: StorageFileItem[] = [];
  for (const item of data) {
    // Supabase JS'te klasörlerin id veya metadata'sı null olur.
    if (!item.id && !item.metadata) {
      if (item.name !== '.emptyFolderPlaceholder') {
        const subPath = path ? `${path}/${item.name}` : item.name;
        const subFiles = await listAllFiles(subPath);
        allFiles.push(...subFiles);
      }
    } else {
      allFiles.push({
        name: item.name,
        id: item.id,
        metadata: item.metadata,
        created_at: item.created_at,
        updated_at: item.updated_at,
        folderPath: path
      });
    }
  }

  return allFiles;
}

export async function fetchStorageImagesAction(): Promise<StorageImage[]> {
  const isAuth = await checkAdminAuth();
  if (!isAuth) {
    throw new Error("Unauthorized");
  }

  const allFiles = await listAllFiles();

  // Sadece imaj dosyalarını filtrele
  const files = allFiles.filter(file => 
    file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/)
  );

  const images: StorageImage[] = files.map(file => {
    const fullPath = file.folderPath ? `${file.folderPath}/${file.name}` : file.name;
    const { data: urlData } = supabaseAdmin.storage
      .from('menu-images')
      .getPublicUrl(fullPath);
      
    return {
      name: file.name,
      url: urlData.publicUrl,
      created_at: file.created_at || new Date().toISOString(),
    };
  });

  // Klasörlerden bağımsız şekilde genel bir tarihe göre sıralama (en yeni en üstte)
  images.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return images;
}

export async function deleteStorageImageAction(urls: string | string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const isAuth = await checkAdminAuth();
    if (!isAuth) {
      throw new Error("Unauthorized");
    }

    const urlArray = Array.isArray(urls) ? urls : [urls];
    if (urlArray.length === 0) return { success: true };

    const paths = urlArray.map(url => {
      const urlParts = url.split('/menu-images/');
      if (urlParts.length !== 2) throw new Error("Geçersiz görsel URL'si: " + url);
      return urlParts[1];
    });

    const { error } = await supabaseAdmin.storage.from('menu-images').remove(paths);
    
    if (error) {
      console.error("Görseller silinemedi:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu" };
  }
}

