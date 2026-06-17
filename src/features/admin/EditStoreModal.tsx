"use client";

import { Save } from "lucide-react";
import { AdminInput, AdminTextarea, AdminLangTabs } from "@/features/admin/AdminInput";
import { AdminModal } from "@/features/admin/AdminModal";
import { useState } from "react";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { Locale, Store, StoreType, StoreCategory } from "@/shared/lib/types";

type EditStoreModalProps = {
  locale: Locale;
  store: Store;
  storeCategories: StoreCategory[];
  onClose: () => void;
  onSave: (store: Store) => void;
};

export function EditStoreModal({ locale, store, storeCategories, onClose, onSave }: EditStoreModalProps) {
  const t = dictionaries[locale];
  const [logo, setLogo] = useState(store.logo);
  const [storeType, setStoreType] = useState<StoreType>(store.type);
  const [lang, setLang] = useState<"tr"|"en">("tr");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      ...store,
      type: storeType,
      name: { tr: String(data.get("name_tr")), en: String(data.get("name_en")) },
      description: { tr: String(data.get("description_tr")), en: String(data.get("description_en")) },
      category_id: String(data.get("categoryId")),
      logo: String(data.get("logo") || "https://placehold.co/100x100.webp?text=Logo"),
      badge: data.get("badge_tr") ? { tr: String(data.get("badge_tr")), en: String(data.get("badge_en")) } : undefined,
      rating: Number(data.get("rating") || 4.7),
      reviews: Number(data.get("reviews") || 100),
      eta: String(data.get("eta") || "20-30"),
      deliveryFee: Number(data.get("deliveryFee") || 60),
      coordinate: [Number(data.get("lat") || 41.037), Number(data.get("lng") || 28.985)]
    });
  }

  return (
    <AdminModal locale={locale} title={t.editStore} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">

        <label className="block text-sm font-bold sm:col-span-2">
          Mağaza Tipi
          <select name="type" className="mt-1 w-full rounded-lg border border-black/10 p-3 h-[46px]" value={storeType} onChange={e => setStoreType(e.target.value as StoreType)}>
            <option value="shop">Shop (Giyim, Elektronik vs.)</option>
            <option value="food">Food (Yemek)</option>
            <option value="market">Market</option>
          </select>
        </label>
        <AdminLangTabs active={lang} onChange={setLang} />
        <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
          <div className={lang === "tr" ? "sm:col-span-2 space-y-4" : "hidden"}>
            <AdminInput name="name_tr" label="İsim" defaultValue={store.name.tr} required={lang === "tr"} />
            <AdminTextarea name="desc_tr" label="Açıklama" defaultValue={store.description?.tr} />
          </div>
          <div className={lang === "en" ? "sm:col-span-2 space-y-4" : "hidden"}>
            <AdminInput name="name_en" label="Name" defaultValue={store.name.en} required={lang === "en"} />
            <AdminTextarea name="desc_en" label="Description" defaultValue={store.description?.en} />
          </div>
          <label className="block text-sm font-bold sm:col-span-2">
            Kategori
            <select name="categoryId" className="mt-1 w-full rounded-lg border border-black/10 p-3 h-[46px]" defaultValue={store.category_id || ""} required>
              <option value="">Seçiniz</option>
              {storeCategories.filter(c => c.type === storeType).map(c => <option key={c.id} value={c.id}>{c.name_tr} ({c.name_en})</option>)}
            </select>
          </label>
          <div className={lang === "tr" ? "sm:col-span-2 space-y-4" : "hidden"}>
            <AdminInput name="badge_tr" label="Rozet" defaultValue={store.badge?.tr} />
          </div>
          <div className={lang === "en" ? "sm:col-span-2 space-y-4" : "hidden"}>
            <AdminInput name="badge_en" label="Badge" defaultValue={store.badge?.en} />
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <input type="hidden" name="logo" value={logo} />
          <ImageUploadField locale={locale} value={logo} onChange={setLogo} />
        </div>

        <AdminInput name="rating" label={t.rating} type="number" step="0.1" defaultValue={store.rating} />
        <AdminInput name="reviews" label={t.reviewCount} type="number" defaultValue={store.reviews} />
        <AdminInput name="eta" label="ETA" defaultValue={store.eta} />
        <AdminInput name="deliveryFee" label={t.deliveryFee} type="number" defaultValue={store.deliveryFee} />
        <AdminInput name="lat" label="Latitude" type="number" step="0.0001" defaultValue={store.coordinate[0]} />
        <AdminInput name="lng" label="Longitude" type="number" step="0.0001" defaultValue={store.coordinate[1]} />
        <button type="submit" className="sm:col-span-2 mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
          <Save size={18} /> {t.saveChanges}
        </button>
      </form>
    </AdminModal>
  );
}
