"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Pencil, Plus, Save, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { AdminInput } from "@/features/admin/AdminInput";
import { EditProductsModal } from "@/features/admin/EditProductsModal";
import { EditStoreModal } from "@/features/admin/EditStoreModal";
import { FALLBACK_IMAGE, ImageUploadField } from "@/features/admin/ImageUploadField";
import { OptionGroupsEditor } from "@/features/admin/OptionGroupsEditor";
import { fetchStoresFromSupabase, saveStoreToSupabase } from "@/features/catalog/data";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, MenuOptionGroup, Store, StoreType, ProductType } from "@/shared/lib/types";
import { uid } from "@/shared/lib/format";

export function AdminPanel({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");

  useEffect(() => {
    async function load() {
      const dbStores = await fetchStoresFromSupabase();
      setStores(dbStores);
      if (dbStores.length > 0) setSelectedStore(dbStores[0].id);
    }
    load();
  }, []);
  const [message, setMessage] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [itemOptionGroups, setItemOptionGroups] = useState<MenuOptionGroup[] | undefined>();
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editingItemsStore, setEditingItemsStore] = useState<Store | null>(null);

  const [newStoreLogo, setNewStoreLogo] = useState("");

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

  async function updateStore(updated: Store, closeItemsModal = false) {
    const nextStores = stores.map((store) =>
      store.id === updated.id ? updated : store
    );
    setStores(nextStores);
    await saveStoreToSupabase(updated);
    setMessage(t.savedToDb);
    setEditingStore(null);
    if (closeItemsModal) {
      setEditingItemsStore(null);
    } else {
      setEditingItemsStore((current) =>
        current?.id === updated.id ? updated : current
      );
    }
  }

  async function addStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Store = {
      id: uid("store"),
      type: String(data.get("type")) as StoreType,
      name: { tr: String(data.get("name_tr")), en: String(data.get("name_en")) },
      description: { tr: String(data.get("desc_tr")), en: String(data.get("desc_en")) },
      category: { tr: String(data.get("cat_tr")), en: String(data.get("cat_en")) },
      logo: String(data.get("logo") || "https://placehold.co/100x100.webp?text=Logo"),
      badge: data.get("badge_tr") ? { tr: String(data.get("badge_tr")), en: String(data.get("badge_en")) } : undefined,
      rating: Number(data.get("rating") || 4.7),
      reviews: Number(data.get("reviews") || 100),
      eta: String(data.get("eta") || "20-30"),
      deliveryFee: Number(data.get("deliveryFee") || 60),
      coordinate: [Number(data.get("lat") || 41.037), Number(data.get("lng") || 28.985)],
      menu: []
    };
    const nextStores = [...stores, next];
    setStores(nextStores);
    setSelectedStore(next.id);
    await saveStoreToSupabase(next);
    setMessage(t.addedToDb);
    event.currentTarget.reset();
  }

  const selectedStoreObj = stores.find(s => s.id === selectedStore);

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextStores = stores.map((store) => {
      if (store.id !== selectedStore) return store;
      return {
        ...store,
        menu: [
          ...store.menu,
          {
            id: uid("item"),
            ...(data.get("productType") ? { productType: String(data.get("productType")) as ProductType } : {}),
            name: { tr: String(data.get("name")), en: String(data.get("name")) },
            description: { tr: String(data.get("description")), en: String(data.get("description")) },
            price: Number(data.get("price") || 0),
            calories: Number(data.get("calories") || 0),
            image: itemImage || FALLBACK_IMAGE,
            ...(itemOptionGroups?.length ? { optionGroups: itemOptionGroups } : {})
          }
        ]
      };
    });
    setStores(nextStores);
    const targetStore = nextStores.find(s => s.id === selectedStore);
    if (targetStore) await saveStoreToSupabase(targetStore);
    setMessage(t.itemAddedToDb);
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
          <form onSubmit={addStore} className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Plus size={20} /> {t.addStore}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              
              <label className="block text-sm font-bold sm:col-span-2">
                Mağaza Tipi
                <select name="type" className="mt-1 w-full rounded-lg border border-black/10 p-3" defaultValue="food">
                  <option value="shop">Shop (Giyim, Elektronik vs.)</option>
                  <option value="food">Food (Yemek)</option>
                  <option value="market">Market</option>
                </select>
              </label>
              
              {selectedStoreObj?.type === "shop" && (
                <label className="block text-sm font-bold sm:col-span-2">
                  Ürün Tipi
                  <select name="productType" className="mt-1 w-full rounded-lg border border-black/10 p-3">
                    <option value="">Seçiniz</option>
                    <option value="clothing">Giyim</option>
                    <option value="electronics">Elektronik</option>
                    <option value="other">Diğer</option>
                  </select>
                </label>
              )}
              <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
                <AdminInput name="name_tr" label="İsim (TR)" required />
                <AdminInput name="name_en" label="Name (EN)" required />
                <AdminInput name="desc_tr" label="Açıklama (TR)" />
                <AdminInput name="desc_en" label="Description (EN)" />
                <AdminInput name="cat_tr" label="Kategori (TR)" required />
                <AdminInput name="cat_en" label="Category (EN)" required />
                <AdminInput name="badge_tr" label="Rozet (TR)" />
                <AdminInput name="badge_en" label="Badge (EN)" />
              </div>
              
              <div className="sm:col-span-2">
                <input type="hidden" name="logo" value={newStoreLogo} />
                <ImageUploadField locale={locale} value={newStoreLogo} onChange={setNewStoreLogo} />
              </div>

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
              <select className="mt-1 w-full rounded-lg border border-black/10 p-3" value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name.tr}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              
              {selectedStoreObj?.type === "shop" && (
                <label className="block text-sm font-bold sm:col-span-2">
                  Ürün Tipi
                  <select name="productType" className="mt-1 w-full rounded-lg border border-black/10 p-3">
                    <option value="">Seçiniz</option>
                    <option value="clothing">Giyim</option>
                    <option value="electronics">Elektronik</option>
                    <option value="other">Diğer</option>
                  </select>
                </label>
              )}
              <AdminInput name="name" label="Ürün Adı" required />
              <AdminInput name="description" label="Açıklama" required />
              <AdminInput name="price" label="Fiyat (TL)" type="number" required />
              {selectedStoreObj?.type === "shop" ? null : (
                <AdminInput name="calories" label="Kalori" type="number" />
              )}
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
          <h2 className="text-xl font-black">{stores.length} restoran</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {stores.map((store) => (
              <div key={store.id} className="rounded-lg border border-black/10 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Image width={80} height={80} className="h-10 w-10 rounded-lg object-cover border border-black/10" src={store.logo || "https://placehold.co/100x100.webp?text=Logo"} alt="" />
                    <h3 className="font-black">{store.name.tr}</h3>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold"
                    onClick={() => setEditingStore(store)}
                  >
                    <Pencil size={14} /> {t.edit}
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                  <span>{store.category.tr} · ★ {Number(store.rating).toFixed(1)} · {store.menu.length} {t.itemCount}</span>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg border border-black/10 px-2 py-1 text-xs font-bold text-zinc-700"
                    onClick={() => setEditingItemsStore(store)}
                  >
                    <Pencil size={12} /> {t.edit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingStore && (
          <EditStoreModal
            locale={locale}
            store={editingStore}
            onClose={() => setEditingStore(null)}
            onSave={updateStore}
          />
        )}

        {editingItemsStore && (
          <EditProductsModal
            locale={locale}
            store={editingItemsStore}
            onClose={() => setEditingItemsStore(null)}
            onSave={(updated) => updateStore(updated, true)}
          />
        )}
      </section>
    </main>
  );
}
