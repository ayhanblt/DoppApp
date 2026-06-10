"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { seedRestaurants } from "@/features/catalog/data";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, Restaurant } from "@/shared/lib/types";
import { uid } from "@/shared/lib/format";

export function AdminPanel({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    if (typeof window === "undefined") return seedRestaurants;
    const raw = window.localStorage.getItem("doppapp-restaurants");
    return raw ? (JSON.parse(raw) as Restaurant[]) : seedRestaurants;
  });
  const [selectedRestaurant, setSelectedRestaurant] = useState(seedRestaurants[0].id);
  const [message, setMessage] = useState("");

  function save(restaurantsToSave = restaurants) {
    window.localStorage.setItem("doppapp-restaurants", JSON.stringify(restaurantsToSave));
    setMessage(locale === "tr" ? "Taslak kaydedildi." : "Draft saved.");
  }

  function addRestaurant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Restaurant = {
      id: uid("restaurant"),
      name: { tr: String(data.get("nameTr")), en: String(data.get("nameEn")) },
      category: { tr: String(data.get("categoryTr")), en: String(data.get("categoryEn")) },
      emoji: String(data.get("emoji") || "🍽️"),
      badge: { tr: String(data.get("badgeTr") || ""), en: String(data.get("badgeEn") || "") },
      rating: Number(data.get("rating") || 4.7),
      reviews: Number(data.get("reviews") || 100),
      eta: String(data.get("eta") || "20-30"),
      deliveryFee: Number(data.get("deliveryFee") || 60),
      coordinate: [Number(data.get("lat") || 41.037), Number(data.get("lng") || 28.985)],
      menu: []
    };
    const nextRestaurants = [...restaurants, next];
    setRestaurants(nextRestaurants);
    setSelectedRestaurant(next.id);
    save(nextRestaurants);
    event.currentTarget.reset();
  }

  function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextRestaurants = restaurants.map((restaurant) => {
      if (restaurant.id !== selectedRestaurant) return restaurant;
      return {
        ...restaurant,
        menu: [
          ...restaurant.menu,
          {
            id: uid("item"),
            name: { tr: String(data.get("nameTr")), en: String(data.get("nameEn")) },
            description: { tr: String(data.get("descriptionTr")), en: String(data.get("descriptionEn")) },
            price: Number(data.get("price") || 0),
            calories: Number(data.get("calories") || 0),
            image: String(data.get("image") || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80")
          }
        ]
      };
    });
    setRestaurants(nextRestaurants);
    save(nextRestaurants);
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-4 text-zinc-950">
      <section className="mx-auto max-w-5xl py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-orange-600">{t.admin}</p>
            <h1 className="text-3xl font-black">{t.menuAdmin}</h1>
            <p className="mt-1 max-w-2xl text-zinc-600">{t.adminHint}</p>
          </div>
          <Link className="rounded-lg bg-zinc-950 px-4 py-3 font-bold text-white" href={`/${locale}`}>
            {t.backToApp}
          </Link>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <form onSubmit={addRestaurant} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Plus size={20} /> {t.addRestaurant}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="nameTr" label="TR ad" required />
              <Input name="nameEn" label="EN name" required />
              <Input name="categoryTr" label="TR kategori" required />
              <Input name="categoryEn" label="EN category" required />
              <Input name="emoji" label="Emoji" />
              <Input name="badgeTr" label="TR rozet" />
              <Input name="badgeEn" label="EN badge" />
              <Input name="rating" label="Puan" type="number" step="0.1" />
              <Input name="reviews" label="Yorum sayısı" type="number" />
              <Input name="eta" label="ETA dk" />
              <Input name="deliveryFee" label="Teslimat ücreti" type="number" />
              <Input name="lat" label="Latitude" type="number" step="0.0001" />
              <Input name="lng" label="Longitude" type="number" step="0.0001" />
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
              <Save size={18} /> {t.saveDraft}
            </button>
          </form>

          <form onSubmit={addItem} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Plus size={20} /> {t.addItem}</h2>
            <label className="mb-3 block text-sm font-bold">
              Restoran
              <select className="mt-1 w-full rounded-lg border border-black/10 p-3" value={selectedRestaurant} onChange={(event) => setSelectedRestaurant(event.target.value)}>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>{restaurant.name[locale]}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="nameTr" label="TR ürün" required />
              <Input name="nameEn" label="EN item" required />
              <Input name="descriptionTr" label="TR açıklama" required />
              <Input name="descriptionEn" label="EN description" required />
              <Input name="price" label="Fiyat" type="number" required />
              <Input name="calories" label="Kalori" type="number" required />
              <Input name="image" label="Görsel URL" />
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
              <Save size={18} /> {t.saveDraft}
            </button>
          </form>
        </div>

        {message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 font-bold text-emerald-700">{message}</p>}

        <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">{restaurants.length} restoran</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="rounded-lg border border-black/10 p-4">
                <p className="text-2xl">{restaurant.emoji}</p>
                <h3 className="font-black">{restaurant.name[locale]}</h3>
                <p className="text-sm text-zinc-500">{restaurant.category[locale]} · {restaurant.menu.length} ürün</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input className="mt-1 w-full rounded-lg border border-black/10 p-3 font-normal" {...props} />
    </label>
  );
}
