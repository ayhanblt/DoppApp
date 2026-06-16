"use client";

import { Save } from "lucide-react";
import { AdminInput } from "@/features/admin/AdminInput";
import { AdminModal } from "@/features/admin/AdminModal";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, Store, StoreType } from "@/shared/lib/types";

type EditStoreModalProps = {
  locale: Locale;
  store: Store;
  onClose: () => void;
  onSave: (store: Store) => void;
};

export function EditStoreModal({ locale, store, onClose, onSave }: EditStoreModalProps) {
  const t = dictionaries[locale];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      ...store,
      type: String(data.get("type")) as StoreType,
      name: { tr: String(data.get("name_tr")), en: String(data.get("name_en")) },
      description: { tr: String(data.get("description_tr")), en: String(data.get("description_en")) },
      category: { tr: String(data.get("category_tr")), en: String(data.get("category_en")) },
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
          <select name="type" className="mt-1 w-full rounded-lg border border-black/10 p-3" defaultValue={store.type}>
            <option value="shop">Shop (Giyim, Elektronik vs.)</option>
            <option value="food">Food (Yemek)</option>
            <option value="market">Market</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
          <AdminInput name="name_tr" label="İsim (TR)" defaultValue={store.name.tr} required />
          <AdminInput name="name_en" label="Name (EN)" defaultValue={store.name.en} required />
          <AdminInput name="description_tr" label="Açıklama (TR)" defaultValue={store.description?.tr} />
          <AdminInput name="description_en" label="Description (EN)" defaultValue={store.description?.en} />
          <AdminInput name="category_tr" label="Kategori (TR)" defaultValue={store.category.tr} required />
          <AdminInput name="category_en" label="Category (EN)" defaultValue={store.category.en} required />
          <AdminInput name="badge_tr" label="Rozet (TR)" defaultValue={store.badge?.tr} />
          <AdminInput name="badge_en" label="Badge (EN)" defaultValue={store.badge?.en} />
        </div>
        <AdminInput name="logo" label="Logo URL" defaultValue={store.logo} />
        <AdminInput name="rating" label={locale === "tr" ? "Puan" : "Rating"} type="number" step="0.1" defaultValue={store.rating} />
        <AdminInput name="reviews" label={locale === "tr" ? "Yorum sayısı" : "Review count"} type="number" defaultValue={store.reviews} />
        <AdminInput name="eta" label="ETA" defaultValue={store.eta} />
        <AdminInput name="deliveryFee" label={locale === "tr" ? "Teslimat ücreti" : "Delivery fee"} type="number" defaultValue={store.deliveryFee} />
        <AdminInput name="lat" label="Latitude" type="number" step="0.0001" defaultValue={store.coordinate[0]} />
        <AdminInput name="lng" label="Longitude" type="number" step="0.0001" defaultValue={store.coordinate[1]} />
        <button type="submit" className="sm:col-span-2 mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
          <Save size={18} /> {t.saveChanges}
        </button>
      </form>
    </AdminModal>
  );
}
