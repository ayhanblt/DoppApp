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
      name: { tr: String(data.get("nameTr")), en: String(data.get("nameEn")) },
      category: { tr: String(data.get("categoryTr")), en: String(data.get("categoryEn")) },
      emoji: String(data.get("emoji") || "🍽️"),
      badge: { tr: String(data.get("badgeTr") || ""), en: String(data.get("badgeEn") || "") },
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
        <AdminInput name="nameTr" label="TR ad" defaultValue={store.name.tr} required />
        <AdminInput name="nameEn" label="EN name" defaultValue={store.name.en} required />
        <AdminInput name="categoryTr" label="TR kategori" defaultValue={store.category.tr} required />
        <AdminInput name="categoryEn" label="EN category" defaultValue={store.category.en} required />
        <AdminInput name="emoji" label="Emoji" defaultValue={store.emoji} />
        <AdminInput name="badgeTr" label="TR rozet" defaultValue={store.badge?.tr ?? ""} />
        <AdminInput name="badgeEn" label="EN badge" defaultValue={store.badge?.en ?? ""} />
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
