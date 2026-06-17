"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, ArrowLeft } from "lucide-react";
import { EditStoreModal } from "@/features/admin/EditStoreModal";
import { EditProductsModal } from "@/features/admin/EditProductsModal";
import { AddStoreForm } from "@/features/admin/AddStoreForm";
import { AddItemForm } from "@/features/admin/AddItemForm";
import { CategoryManager } from "@/features/admin/CategoryManager";
import { StoreList } from "@/features/admin/StoreList";
import { AdminInput } from "@/features/admin/AdminInput";
import { fetchStoresFromSupabase, saveStoreToSupabase, deleteStoreFromSupabase, fetchConfigFromSupabase, saveConfigToSupabase } from "@/features/catalog/data";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { uid } from "@/shared/lib/format";
import type { StoreCategory, ProductCategory, Locale, MenuOptionGroup, Store, StoreType, GlobalConfig, Product } from "@/shared/lib/types";

export function AdminPanel({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");

  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [activeTab, setActiveTab] = useState<StoreType | "all">("all");
  const [adminMode, setAdminMode] = useState<"stores" | "categories">("stores");

  const loadData = async () => {
    const [dbStores, dbConfig, dbStoreCats, dbProdCats] = await Promise.all([
      fetchStoresFromSupabase(),
      fetchConfigFromSupabase(),
      import('@/features/catalog/data').then(m => m.fetchStoreCategories()),
      import('@/features/catalog/data').then(m => m.fetchProductCategories())
    ]);
    const sortedStores = dbStores.sort((a, b) => a.name.tr.localeCompare(b.name.tr));
    setStores(sortedStores);
    if (sortedStores.length > 0) setSelectedStore(sortedStores[0].id);
    setConfig(dbConfig);
    setStoreCategories(dbStoreCats);
    setProductCategories(dbProdCats);
  };

  useEffect(() => {
    loadData();
  }, []);
  const [message, setMessage] = useState("");
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editingItemsStore, setEditingItemsStore] = useState<Store | null>(null);

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
    ).sort((a, b) => a.name.tr.localeCompare(b.name.tr));
    setStores(nextStores);
    const success = await saveStoreToSupabase(updated);
    if (!success) {
      alert("Veritabanına kaydedilirken bir hata oluştu! Lütfen konsolu (F12) kontrol edin.");
      // Revert state if failed
      setStores(stores);
      return;
    }
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

  async function addStore(next: Omit<Store, "id" | "menu">) {
    const fullStore: Store = { ...next, id: uid("store"), menu: [] };
    const nextStores = [...stores, fullStore].sort((a, b) => a.name.tr.localeCompare(b.name.tr));
    setStores(nextStores);
    setSelectedStore(fullStore.id);
    await saveStoreToSupabase(fullStore);
    setMessage(t.addedToDb);
  }

  async function deleteStore(id: string, name: string) {
    if (!confirm(`"${name}" mağazasını tamamen silmek istediğinize emin misiniz?`)) return;
    setStores(stores.filter(s => s.id !== id));
    await deleteStoreFromSupabase(id);
    setMessage("Mağaza başarıyla silindi.");
  }

  const selectedStoreObj = stores.find(s => s.id === selectedStore);

  async function addItem(storeId: string, itemData: Omit<Product, "id">) {
    const nextStores = stores.map((store) => {
      if (store.id !== storeId) return store;
      return {
        ...store,
        menu: [
          ...store.menu,
          { id: uid("item"), ...itemData }
        ]
      };
    });
    setStores(nextStores);
    const targetStore = nextStores.find(s => s.id === storeId);
    if (targetStore) await saveStoreToSupabase(targetStore);
    setMessage(t.itemAddedToDb);
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


        <div className="mt-4 flex gap-2 border-b border-black/10 pb-4">
          <button className={`px-4 py-2 font-bold ${adminMode === 'stores' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-zinc-500'}`} onClick={() => setAdminMode('stores')}>Mağazalar & Ürünler</button>
          <button className={`px-4 py-2 font-bold ${adminMode === 'categories' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-zinc-500'}`} onClick={() => setAdminMode('categories')}>Kategori Yönetimi</button>
        </div>

        {adminMode === 'stores' ? (
          <>
            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <AddStoreForm locale={locale} storeCategories={storeCategories} onAddStore={addStore} />
              <AddItemForm locale={locale} stores={stores} storeCategories={storeCategories} productCategories={productCategories} activeTab={activeTab} selectedStore={selectedStore} setSelectedStore={setSelectedStore} onAddItem={addItem} />
            </div>

            {message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 font-bold text-emerald-700">{message}</p>}

            <StoreList 
              locale={locale} 
              stores={stores} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onEditStore={setEditingStore} 
              onEditItems={setEditingItemsStore} 
              onDeleteStore={deleteStore} 
            />
          </>
        ) : (
          <CategoryManager 
            storeCategories={storeCategories}
            productCategories={productCategories}
            onRefresh={loadData}
          />
        )}

        {editingStore && (
          <EditStoreModal
            locale={locale}
            store={editingStore}
            storeCategories={storeCategories}
            onClose={() => setEditingStore(null)}
            onSave={updateStore}
          />
        )}

        {editingItemsStore && (
          <EditProductsModal
            locale={locale}
            store={editingItemsStore}
            productCategories={productCategories}
            onClose={() => setEditingItemsStore(null)}
            onSave={(updated: Store) => updateStore(updated, true)}
          />
        )}
      </section>
    </main>
  );
}
