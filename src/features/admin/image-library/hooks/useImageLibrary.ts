import { useState, useEffect } from 'react';
import { fetchStorageImagesAction } from '../api/fetchStorageImages';
import type { StorageImage } from "@/shared/lib/types";

// Module-level cache: Browser tab açık kaldığı sürece veriyi hafızada tutar.
let globalImageCache: StorageImage[] | null = null;
let fetchPromise: Promise<StorageImage[]> | null = null;

export function useImageLibrary() {
  const [images, setImages] = useState<StorageImage[]>(globalImageCache || []);
  const [loading, setLoading] = useState(!globalImageCache);
  const [error, setError] = useState("");

  const loadImages = async (forceRefresh = false) => {
    if (!forceRefresh && globalImageCache) {
      setImages(globalImageCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Eğer halihazırda devam eden bir istek varsa tekrar başlatma, onu bekle.
      // forceRefresh true ise yeni istek başlat.
      if (!fetchPromise || forceRefresh) {
        fetchPromise = fetchStorageImagesAction();
      }
      const data = await fetchPromise;
      globalImageCache = data;
      setImages(data);
    } catch (err) {
      console.error("Görseller yüklenemedi:", err);
      setError("Görseller yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!globalImageCache) {
      loadImages();
    }
  }, []);

  const deleteImage = async (urls: string | string[]) => {
    const { deleteStorageImageAction } = await import('../api/fetchStorageImages');
    const res = await deleteStorageImageAction(urls);
    if (res.success) {
      const urlArray = Array.isArray(urls) ? urls : [urls];
      const newImages = images.filter(img => !urlArray.includes(img.url));
      setImages(newImages);
      globalImageCache = newImages; // Update cache
      return true;
    } else {
      alert("Silinirken hata oluştu: " + res.error);
      return false;
    }
  };

  return {
    images,
    loading,
    error,
    reload: () => loadImages(true),
    deleteImage
  };
}
