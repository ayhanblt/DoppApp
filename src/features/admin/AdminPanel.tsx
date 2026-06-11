"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Pencil, Plus, Save } from "lucide-react";
import { AdminInput } from "@/features/admin/AdminInput";
import { EditMenuItemsModal } from "@/features/admin/EditMenuItemsModal";
import { EditRestaurantModal } from "@/features/admin/EditRestaurantModal";
import { FALLBACK_IMAGE, ImageUploadField } from "@/features/admin/ImageUploadField";
import { OptionGroupsEditor } from "@/features/admin/OptionGroupsEditor";
import { seedRestaurants } from "@/features/catalog/data";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, MenuOptionGroup, Restaurant } from "@/shared/lib/types";
import { uid } from "@/shared/lib/format";

export function AdminPanel({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    if (typeof window === "undefined") return seedRestaurants;
    const raw = window.localStorage.getItem("doppapp-restaurants");
    return raw ? (JSON.parse(raw) as Restaurant[]) : seedRestaurants;
  });
  const [selectedRestaurant, setSelectedRestaurant] = useState(seedRestaurants[0].id);
  const [message, setMessage] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemOptionGroups, setItemOptionGroups] = useState<MenuOptionGroup[] | undefined>();
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [editingItemsRestaurant, setEditingItemsRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    setIsAuthenticated(window.localStorage.getItem("adminAuth") === "true");
    setAuthReady(true);
  }, []);

  function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("username") === "admin" && data.get("password") === "1234") {
      window.localStorage.setItem("adminAuth", "true");
      setIsAuthenticated(true);
      setLoginError("");
      return;
    }
    setLoginError(t.invalidLogin);
  }

  function logout() {
    window.localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
  }

  function updateRestaurant(updated: Restaurant, closeItemsModal = false) {
    const nextRestaurants = restaurants.map((restaurant) =>
      restaurant.id === updated.id ? updated : restaurant
    );
    setRestaurants(nextRestaurants);
    save(nextRestaurants);
    setEditingRestaurant(null);
    if (closeItemsModal) {
      setEditingItemsRestaurant(null);
    } else {
      setEditingItemsRestaurant((current) =>
        current?.id === updated.id ? updated : current
      );
    }
  }

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
            image: itemImage || FALLBACK_IMAGE,
            ...(itemOptionGroups?.length ? { optionGroups: itemOptionGroups } : {})
          }
        ]
      };
    });
    setRestaurants(nextRestaurants);
    save(nextRestaurants);
    setItemImage("");
    setItemOptionGroups(undefined);
    event.currentTarget.reset();
  }

  if (!authReady) {
    return <main className="min-h-screen bg-zinc-50 p-4" />;
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 p-4 text-zinc-950">
        <form onSubmit={login} className="w-full max-w-sm rounded-lg bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-orange-600">{t.admin}</p>
          <h1 className="mt-1 text-3xl font-black">{t.adminLogin}</h1>
          <div className="mt-5 grid gap-3">
            <AdminInput name="username" label={t.username} required />
            <AdminInput name="password" label={t.password} type="password" required />
            {loginError && <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{loginError}</p>}
            <button className="rounded-lg bg-orange-600 py-3 font-black text-white">{t.login}</button>
            <Link className="text-center text-sm font-bold text-zinc-500" href={`/${locale}`}>
              {t.backToApp}
            </Link>
          </div>
        </form>
      </main>
    );
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
          <div className="flex gap-2">
            <Link className="rounded-lg bg-zinc-950 px-4 py-3 font-bold text-white" href={`/${locale}`}>
              {t.backToApp}
            </Link>
            <button className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 font-bold" onClick={logout}>
              <LogOut size={18} /> {t.logout}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <form onSubmit={addRestaurant} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Plus size={20} /> {t.addRestaurant}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput name="nameTr" label="TR ad" required />
              <AdminInput name="nameEn" label="EN name" required />
              <AdminInput name="categoryTr" label="TR kategori" required />
              <AdminInput name="categoryEn" label="EN category" required />
              <AdminInput name="emoji" label="Emoji" />
              <AdminInput name="badgeTr" label="TR rozet" />
              <AdminInput name="badgeEn" label="EN badge" />
              <AdminInput name="rating" label="Puan" type="number" step="0.1" />
              <AdminInput name="reviews" label="Yorum sayısı" type="number" />
              <AdminInput name="eta" label="ETA dk" />
              <AdminInput name="deliveryFee" label="Teslimat ücreti" type="number" />
              <AdminInput name="lat" label="Latitude" type="number" step="0.0001" />
              <AdminInput name="lng" label="Longitude" type="number" step="0.0001" />
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
              <AdminInput name="nameTr" label="TR ürün" required />
              <AdminInput name="nameEn" label="EN item" required />
              <AdminInput name="descriptionTr" label="TR açıklama" required />
              <AdminInput name="descriptionEn" label="EN description" required />
              <AdminInput name="price" label="Fiyat" type="number" required />
              <AdminInput name="calories" label="Kalori" type="number" required />
              <ImageUploadField locale={locale} value={itemImage} onChange={setItemImage} />
            </div>
            <OptionGroupsEditor locale={locale} value={itemOptionGroups} onChange={setItemOptionGroups} />
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
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-2xl">{restaurant.emoji}</p>
                    <h3 className="font-black">{restaurant.name[locale]}</h3>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold"
                    onClick={() => setEditingRestaurant(restaurant)}
                  >
                    <Pencil size={14} /> {t.edit}
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                  <span>{restaurant.category[locale]} · {restaurant.menu.length} {locale === "tr" ? "ürün" : "items"}</span>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg border border-black/10 px-2 py-1 text-xs font-bold text-zinc-700"
                    onClick={() => setEditingItemsRestaurant(restaurant)}
                  >
                    <Pencil size={12} /> {t.edit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingRestaurant && (
          <EditRestaurantModal
            locale={locale}
            restaurant={editingRestaurant}
            onClose={() => setEditingRestaurant(null)}
            onSave={updateRestaurant}
          />
        )}

        {editingItemsRestaurant && (
          <EditMenuItemsModal
            locale={locale}
            restaurant={editingItemsRestaurant}
            onClose={() => setEditingItemsRestaurant(null)}
            onSave={(updated) => updateRestaurant(updated, true)}
          />
        )}
      </section>
    </main>
  );
}
