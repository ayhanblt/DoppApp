"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale } from "@/shared/lib/types";
import { uploadMenuImage } from "@/features/admin/uploadMenuImage";
import { useImageCache } from "@/features/admin/useImageCache";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

type ImageUploadFieldProps = {
  locale: Locale;
  value: string;
  onChange: (url: string) => void;
};

export function ImageUploadField({ locale, value, onChange }: ImageUploadFieldProps) {
  const t = dictionaries[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const { entries, addEntry } = useImageCache();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const result = await uploadMenuImage(file);
      onChange(result.url);
      addEntry({ url: result.url, filename: result.filename, uploadedAt: Date.now() });
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
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold disabled:opacity-50"
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {t.uploadImage}
          </button>
          {value && (
            <p className="break-all text-xs text-zinc-500">{value}</p>
          )}
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          {entries.length > 0 && (
            <div>
              <p className="text-xs font-bold text-zinc-500">
                {t.recentUploads}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {entries.slice(0, 6).map((entry) => (
                  <button
                    key={entry.url}
                    type="button"
                    className={`overflow-hidden rounded-md border ${value === entry.url ? "border-orange-600 ring-2 ring-orange-600/30" : "border-black/10"}`}
                    onClick={() => onChange(entry.url)}
                  >
                    <Image width={96} height={96} className="h-12 w-12 object-cover" src={entry.url} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { FALLBACK_IMAGE };
