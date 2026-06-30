"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { getCroppedImg, Area } from '@/shared/lib/cropUtils';
import type { ImageCropperModalProps } from "@/shared/lib/types";
import { useScrollLock } from "@/shared/hooks/useScrollLock";

export function ImageCropperModal({ imageSrc, onCropDone, onCancel }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useScrollLock();

  useEffect(() => {
    setMounted(true);
    
    return () => {
      setMounted(false);
    };
  }, []);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropDone(croppedBlob);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-image-crop flex items-center justify-center bg-black/80 animate-in fade-in duration-200 p-4 sm:p-6">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] max-h-[800px] min-h-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 shrink-0">
          <h3 className="font-black text-lg">Görseli Kırp</h3>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 min-h-0 w-full bg-zinc-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            restrictPosition={false} // Kullanıcının görsel dışına çıkarak beyaz boşluk oluşturmasına izin verir
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            classes={{
              containerClassName: "h-full w-full",
            }}
          />
        </div>

        {/* Controls & Footer */}
        <div className="p-4 bg-white border-t border-black/10 flex flex-col gap-4 shrink-0">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-zinc-700">Yakınlaştırma</label>
            <input
              type="range"
              value={zoom}
              min={0.1}
              max={3}
              step={0.05}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 font-bold text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleCrop}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2 font-black text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50"
            >
              {isProcessing ? "İşleniyor..." : <><Check size={18} /> Kırp ve Yükle</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
