"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "doppapp-image-cache";
const MAX_ENTRIES = 50;

export type CachedImage = {
  url: string;
  filename: string;
  uploadedAt: number;
};

function readCache(): CachedImage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CachedImage[]) : [];
  } catch {
    return [];
  }
}

function writeCache(entries: CachedImage[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function useImageCache() {
  const [entries, setEntries] = useState<CachedImage[]>([]);

  useEffect(() => {
    setEntries(readCache());
  }, []);

  const addEntry = useCallback((entry: CachedImage) => {
    setEntries((current) => {
      const next = [entry, ...current.filter((item) => item.url !== entry.url)].slice(0, MAX_ENTRIES);
      writeCache(next);
      return next;
    });
  }, []);

  return { entries, addEntry };
}
