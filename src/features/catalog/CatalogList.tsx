"use client";

import { useMemo, useState } from "react";
import { Clock, Bike, Minus, Plus } from "lucide-react";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { CartSelection, Locale, Product, Store, StoreType } from "@/shared/lib/types";
import { formatMoney, formatNumber, uid } from "@/shared/lib/format";
import { useCatalog } from "./CatalogContext";

type ActiveItem = { store: Store; item: Product };

export function CatalogList({ locale, storeType }: { locale: Locale; storeType: StoreType }) {
  const t = dictionaries[locale];
  const { stores, query, setQuery, setCart, cart, setOrder } = useCatalog();

  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [selections, setSelections] = useState<CartSelection>({});
  const [quantity, setQuantity] = useState(1);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase(locale);
    return stores.filter((store) => {
      if (store.type !== storeType) return false;

      const haystack = [
        store.name[locale],
        store.category[locale],
        ...store.menu.flatMap((item) => [item.name[locale], item.description[locale]])
      ].join(" ").toLocaleLowerCase(locale);
      return haystack.includes(normalized);
    });
  }, [locale, query, stores, storeType]);

  function openItem(store: Store, item: Product) {
    const initial: CartSelection = {};
    item.optionGroups?.forEach((group) => {
      initial[group.id] = group.required ? [group.options[0].id] : [];
    });
    setSelections(initial);
    setQuantity(1);
    setActiveItem({ store, item });
  }

  function toggleSelection(groupId: string, optionId: string, multiple?: boolean) {
    setSelections((current) => {
      const selected = current[groupId] ?? [];
      return {
        ...current,
        [groupId]: multiple
          ? selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId]
          : [optionId]
      };
    });
  }

  function addActiveItem() {
    if (!activeItem) return;
    setCart((current) => [
      ...current,
      {
        id: uid("cart"),
        storeId: activeItem.store.id,
        itemId: activeItem.item.id,
        quantity,
        selections
      }
    ]);
    setActiveItem(null);
  }

  function resetAll() {
    setCart([]);
    setOrder(null);
    setQuery("");
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div id="stores" className="mt-3 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black">{filtered.length} {storeType === "food" ? t.restaurants : "Mağazalar"} 🍴</h2>
          <p className="text-sm text-zinc-500">{t.chooseItems}</p>
        </div>
        <button className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-zinc-600 shadow-sm" onClick={resetAll}>{t.reset}</button>
      </div>

      <div className="mt-4 grid gap-4 pb-28 md:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((store) => (
          <article key={store.id} className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/5 bg-gradient-to-r from-orange-50 to-white p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <img className="h-12 w-12 shrink-0 rounded-full border border-black/10 object-cover" src={store.logo || "https://placehold.co/100x100.webp?text=Logo"} alt="" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black leading-tight">
                    {store.name[locale]}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
                    <span className="truncate">{store.category[locale]} · ★ {Number(store.rating).toFixed(1)} · {formatNumber(store.reviews, locale)}</span>
                    {store.badge && <span className="shrink-0 rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">{store.badge[locale]}</span>}
                  </p>
                </div>
              </div>
              <div className="ml-3 shrink-0 text-right text-sm text-zinc-600">
                <p className="flex items-center justify-end gap-1"><Clock size={14} /> {store.eta} {t.min} </p>
                <p className="flex items-center justify-end gap-1"><Bike size={14} /> {store.deliveryFee ? formatMoney(store.deliveryFee, locale) : t.free}</p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              {store.menu.map((item) => (
                <div key={item.id} className="grid grid-cols-[80px_1fr] gap-3 rounded-lg border border-black/10 p-3">
                  <img 
                    className="h-20 w-20 rounded-md object-cover cursor-pointer transition-transform hover:scale-105" 
                    src={item.image} 
                    alt={item.name[locale]} 
                    onClick={() => setEnlargedImage(item.image)}
                  />
                  <div className="min-w-0">
                    <h4 className="font-black">{item.name[locale]}</h4>
                    <p className="text-sm text-zinc-500">{item.description[locale]}</p>
                    {item.calories > 0 && <p className="mt-1 text-sm font-bold text-emerald-700">🔥 {formatNumber(item.calories, locale)} kcal</p>}
                    {item.optionGroups && item.optionGroups.length > 0 && <p className="mt-1 text-xs text-[var(--accent)]">{t.optionsAvailable} ›</p>}
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-3">
                    <strong>{formatMoney(item.price, locale)}</strong>
                    <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-black text-white" onClick={() => openItem(store, item)}>{t.add}</button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-h-[92vh] max-w-lg overflow-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex gap-4">
              <img className="h-24 w-24 rounded-lg object-cover" src={activeItem.item.image} alt="" />
              <div className="flex-1">
                <h3 className="text-xl font-black">{activeItem.item.name[locale]}</h3>
                <p className="text-sm text-zinc-500">{activeItem.item.description[locale]}</p>
                {activeItem.store.type === "food" && activeItem.item.calories > 0 && (
                  <p className="mt-1 text-sm font-bold text-emerald-700">🔥 {formatNumber(activeItem.item.calories, locale)} kcal</p>
                )}
              </div>
              <button onClick={() => setActiveItem(null)} className="h-9 w-9 rounded-full bg-zinc-100">×</button>
            </div>
            <div className="mt-5 space-y-4">
              {activeItem.item.optionGroups?.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 font-black">{group.label[locale]} {group.required && <span className="text-xs text-[var(--accent)]">{t.required}</span>}</p>
                  <div className="grid gap-2">
                    {group.options.map((option) => {
                      const selected = selections[group.id]?.includes(option.id);
                      return (
                        <button key={option.id} className={`flex items-center justify-between rounded-lg border p-3 text-left ${selected ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-black/10"}`} onClick={() => toggleSelection(group.id, option.id, group.multiple)}>
                          <span className="font-bold">{option.label[locale]}</span>
                          <span className="text-sm text-zinc-500">{option.priceDelta === 0 ? "0" : formatMoney(option.priceDelta, locale)} {selected && "✓"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="font-black">{t.quantity}</span>
                <div className="flex items-center gap-3">
                  <button className="grid h-9 w-9 place-items-center rounded-full bg-white" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button>
                  <strong>{quantity}</strong>
                  <button className="grid h-9 w-9 place-items-center rounded-full bg-white" onClick={() => setQuantity((value) => value + 1)}><Plus size={16} /></button>
                </div>
              </div>
              <button className="w-full rounded-lg bg-[var(--accent)] py-4 font-black text-white" onClick={addActiveItem}>
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {enlargedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <button 
            onClick={() => setEnlargedImage(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white transition-colors hover:bg-white/20 md:right-8 md:top-8"
            aria-label={t.close}
          >
            ×
          </button>
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img src={enlargedImage} alt="" className="max-h-[80vh] w-full rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </section>
  );
}
