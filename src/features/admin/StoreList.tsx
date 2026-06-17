import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import type { Locale, Store, StoreType } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";

interface StoreListProps {
  locale: Locale;
  stores: Store[];
  activeTab: StoreType | "all";
  setActiveTab: (tab: StoreType | "all") => void;
  onEditStore: (store: Store) => void;
  onEditItems: (store: Store) => void;
  onDeleteStore: (id: string, name: string) => Promise<void>;
}

export function StoreList({ locale, stores, activeTab, setActiveTab, onEditStore, onEditItems, onDeleteStore }: StoreListProps) {
  const t = dictionaries[locale];
  const filteredStores = stores.filter(s => activeTab === "all" || s.type === activeTab);

  return (
    <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-4 flex gap-2">
        {["all", "shop", "food", "market"].map(tab => (
          <button 
            key={tab} 
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${activeTab === tab ? 'bg-orange-600 text-white' : 'bg-zinc-100 text-zinc-600'}`} 
            onClick={() => setActiveTab(tab as StoreType | "all")}
          >
            {tab === 'all' ? 'Tümü' : tab.toUpperCase()}
          </button>
        ))}
      </div>
      <h2 className="text-xl font-black">{filteredStores.length} restoran</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {filteredStores.map((store) => (
          <div key={store.id} className="rounded-lg border border-black/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Image width={80} height={80} className="h-10 w-10 rounded-lg object-cover border border-black/10" src={store.logo || "https://placehold.co/100x100.webp?text=Logo"} alt="" />
                <h3 className="font-black">{store.name.tr}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-zinc-600 hover:bg-zinc-50"
                  title={t.edit}
                  onClick={() => onEditStore(store)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  title="Sil"
                  onClick={() => onDeleteStore(store.id, store.name.tr)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span>{store.store_categories ? store.store_categories[locale === "tr" ? "name_tr" : "name_en"] : store.category_id} · ★ {Number(store.rating).toFixed(1)} · {store.menu.length} {t.itemCount}</span>
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg border border-black/10 px-2 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                onClick={() => onEditItems(store)}
              >
                <Pencil size={12} /> {t.edit}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
