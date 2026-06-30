"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Loader2, Check, Search, RefreshCw, Trash2, List } from 'lucide-react';
import { useImageLibrary } from '../hooks/useImageLibrary';
import type { StorageImage, ImageLibraryModalProps } from "@/shared/lib/types";
import { useScrollLock } from "@/shared/hooks/useScrollLock";

export function ImageLibraryModal({ onSelect, onRecrop, onCancel }: ImageLibraryModalProps) {
  const { images, loading, error, reload, deleteImage } = useImageLibrary();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useScrollLock();

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleImages = filteredImages.slice(0, visibleCount);
  const hasMore = visibleCount < filteredImages.length;

  const modalContent = (
    <div className="fixed inset-0 z-image-lib flex items-center justify-center bg-black/80 animate-in fade-in duration-200 p-4 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] max-h-[800px]">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-black/10 shrink-0 bg-white">
          <h3 className="font-black text-lg whitespace-nowrap">Görsel Kütüphanesi</h3>

          <button
            onClick={() => setVisibleCount(images.length)}
            disabled={loading || visibleCount >= images.length}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-[var(--accent)] transition-colors disabled:opacity-50"
            title="Tümünü Göster"
          >
            <List size={18} />
          </button>

          <div className="flex-1 max-w-sm relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Görsel ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(24); // Aramada sayfalamayı sıfırla
              }}
              className="w-full pl-9 pr-4 py-2 bg-zinc-100 border-transparent focus:bg-white focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 rounded-lg text-sm transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={reload}
              disabled={loading}
              className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-50"
              title="Görselleri Yenile"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onCancel} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Library Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-zinc-50">
          {loading && images.length === 0 ? (
            <div className="flex h-full items-center justify-center flex-col gap-3">
              <Loader2 className="animate-spin text-zinc-400" size={32} />
              <p className="text-zinc-500 text-sm font-bold">Görseller Yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center flex-col gap-3 text-red-500">
              <p className="font-bold">{error}</p>
              <button onClick={reload} className="px-4 py-2 bg-red-100 rounded-lg font-bold hover:bg-red-200">Tekrar Dene</button>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-zinc-500 font-bold">
              {searchQuery ? "Aramanıza uygun görsel bulunamadı." : "Kütüphanede görsel bulunamadı."}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {visibleImages.map((img) => {
                  const isSelected = selectedUrls.includes(img.url);
                  return (
                  <button
                    key={img.url}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedUrls(prev => prev.filter(u => u !== img.url));
                      } else {
                        setSelectedUrls(prev => [...prev, img.url]);
                      }
                    }}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${isSelected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 scale-95' : 'border-transparent hover:border-black/20'
                      }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 16vw"
                      unoptimized
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[var(--accent)]/10 flex items-center justify-center">
                        <div className="bg-[var(--accent)] text-white rounded-full p-1 shadow-md">
                          <Check size={20} />
                        </div>
                      </div>
                    )}
                  </button>
                  );
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center pb-4">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 24)}
                    className="px-6 py-2 bg-white border border-black/10 rounded-full font-bold text-sm hover:bg-zinc-50 hover:shadow-sm transition-all"
                  >
                    Daha Fazla Göster ({filteredImages.length - visibleCount})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedUrls.length > 0 && (
          <div className="p-4 border-t border-black/10 shrink-0 flex items-center justify-between bg-zinc-50 rounded-b-xl gap-2">
            <button
              onClick={async () => {
                if (window.confirm(`${selectedUrls.length > 1 ? selectedUrls.length + ' görseli' : 'Görseli'} tamamen silmek istediğinize emin misiniz? (Kullanılan ürünler etkilenebilir)`)) {
                  setIsDeleting(true);
                  const ok = await deleteImage(selectedUrls);
                  if (ok) setSelectedUrls([]);
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 font-bold disabled:opacity-50 transition-colors"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              <span className="hidden sm:inline">Sil {selectedUrls.length > 1 ? `(${selectedUrls.length})` : ''}</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onRecrop(selectedUrls[0])}
                disabled={selectedUrls.length > 1}
                className="px-6 py-2 border-2 border-zinc-200 rounded-lg font-bold hover:bg-zinc-100 transition-colors disabled:opacity-50"
              >
                Kırp
              </button>
              <button
                onClick={() => onSelect(selectedUrls[0])}
                disabled={selectedUrls.length > 1}
                className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg font-bold shadow-md hover:brightness-105 transition-all disabled:opacity-50 disabled:hover:brightness-100"
              >
                Seç
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
