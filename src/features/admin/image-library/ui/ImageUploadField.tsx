"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Library } from "lucide-react";
import Image from "next/image";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, ImageUploadFieldProps } from "@/shared/lib/types";
import { uploadMenuImageAction } from "@/features/admin/actions";
import { ImageCropperModal } from "./ImageCropperModal";
import { ImageLibraryModal } from "./ImageLibraryModal";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

export function ImageUploadField({ locale, value, onChange, slugName }: ImageUploadFieldProps) {
  const t = dictionaries[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [cropperOpen, setCropperOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

  // Dosya bilgisayardan seçildiğinde çalışır
  async function handleFileSelection(file: File) {
    const url = URL.createObjectURL(file);
    setSelectedFileUrl(url);
    setCropperOpen(true);
  }

  // Kırpma işlemi bittikten sonra (blob) doğrudan Supabase'e yükler
  async function handleCroppedUpload(croppedBlob: Blob) {
    setCropperOpen(false);
    setSelectedFileUrl(null);
    setUploading(true);
    setError("");

    try {
      const ext = "jpg";
      const filename = `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const fileToUpload = new File([croppedBlob], filename, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", fileToUpload);
      if (slugName) formData.append("slug", slugName);
      
      const result = await uploadMenuImageAction(formData);
      if (!result) throw new Error("upload_failed");
      onChange(result.url);
    } catch {
      setError(t.imageUploadFailed);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-bold">{t.itemImage}</p>
      <div className="mt-2 flex flex-wrap items-start gap-3">
        <Image
          width={160}
          height={160}
          className="h-20 w-20 rounded-lg border border-black/10 object-cover"
          src={value || FALLBACK_IMAGE}
          alt=""
        />
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFileSelection(file);
              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold disabled:opacity-50 hover:bg-zinc-50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {t.uploadImage}
            </button>
            <button
              type="button"
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold disabled:opacity-50 hover:bg-zinc-50 transition-colors"
              onClick={() => setLibraryOpen(true)}
            >
              <Library size={16} />
              Kütüphaneden Seç
            </button>
          </div>
          
          {value && (
            <p className="break-all text-xs text-zinc-500">{value}</p>
          )}
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
        </div>
      </div>

      {cropperOpen && selectedFileUrl && (
        <ImageCropperModal
          imageSrc={selectedFileUrl}
          onCropDone={handleCroppedUpload}
          onCancel={() => {
            setCropperOpen(false);
            setSelectedFileUrl(null);
          }}
        />
      )}

      {libraryOpen && (
        <ImageLibraryModal
          onSelect={(url) => {
            onChange(url);
            setLibraryOpen(false);
          }}
          onRecrop={async (url) => {
            setLibraryOpen(false);
            try {
              // Görseli Blob olarak çekip ObjectURL oluşturuyoruz ki canvas CORS hatası vermesin
              const response = await fetch(url);
              const blob = await response.blob();
              const objectUrl = URL.createObjectURL(blob);
              setSelectedFileUrl(objectUrl);
              setCropperOpen(true);
            } catch (error) {
              console.error("Görsel kırpma için yüklenemedi:", error);
              setError("Görsel kırpma için yüklenemedi.");
            }
          }}
          onCancel={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}

export { FALLBACK_IMAGE };
