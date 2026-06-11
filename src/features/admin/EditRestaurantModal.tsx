"use client";

import { Save } from "lucide-react";
import { AdminInput } from "@/features/admin/AdminInput";
import { AdminModal } from "@/features/admin/AdminModal";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, Restaurant } from "@/shared/lib/types";

type EditRestaurantModalProps = {
  locale: Locale;
  restaurant: Restaurant;
  onClose: () => void;
  onSave: (restaurant: Restaurant) => void;
};

export function EditRestaurantModal({ locale, restaurant, onClose, onSave }: EditRestaurantModalProps) {
  const t = dictionaries[locale];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      ...restaurant,
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
    <AdminModal locale={locale} title={t.editRestaurant} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <AdminInput name="nameTr" label="TR ad" defaultValue={restaurant.name.tr} required />
        <AdminInput name="nameEn" label="EN name" defaultValue={restaurant.name.en} required />
        <AdminInput name="categoryTr" label="TR kategori" defaultValue={restaurant.category.tr} required />
        <AdminInput name="categoryEn" label="EN category" defaultValue={restaurant.category.en} required />
        <AdminInput name="emoji" label="Emoji" defaultValue={restaurant.emoji} />
        <AdminInput name="badgeTr" label="TR rozet" defaultValue={restaurant.badge?.tr ?? ""} />
        <AdminInput name="badgeEn" label="EN badge" defaultValue={restaurant.badge?.en ?? ""} />
        <AdminInput name="rating" label={locale === "tr" ? "Puan" : "Rating"} type="number" step="0.1" defaultValue={restaurant.rating} />
        <AdminInput name="reviews" label={locale === "tr" ? "Yorum sayısı" : "Review count"} type="number" defaultValue={restaurant.reviews} />
        <AdminInput name="eta" label="ETA" defaultValue={restaurant.eta} />
        <AdminInput name="deliveryFee" label={locale === "tr" ? "Teslimat ücreti" : "Delivery fee"} type="number" defaultValue={restaurant.deliveryFee} />
        <AdminInput name="lat" label="Latitude" type="number" step="0.0001" defaultValue={restaurant.coordinate[0]} />
        <AdminInput name="lng" label="Longitude" type="number" step="0.0001" defaultValue={restaurant.coordinate[1]} />
        <button type="submit" className="sm:col-span-2 mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
          <Save size={18} /> {t.saveChanges}
        </button>
      </form>
    </AdminModal>
  );
}
