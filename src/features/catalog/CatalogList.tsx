"use client";

import { useMemo, useState } from "react";
import { Clock, Bike, Minus, Plus, Filter, Star } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
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
  const [selectedFeaturedLabel, setSelectedFeaturedLabel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recommended" | "rating_desc" | "rating_asc" | "deliveryFee_asc" | "deliveryFee_desc" | "eta_asc">("recommended");
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  const featuredLabels = useMemo(() => {
    const labels = new Set<string>();
    stores.forEach(store => {
      if (store.type !== storeType) return;
      store.menu.forEach(item => {
        const label = locale === 'tr' ? item.section_label_tr : item.section_label_en;
        if (label) labels.add(label);
      });
    });
    return Array.from(labels).sort();
  }, [stores, storeType, locale]);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase(locale);
    const result = stores.filter((store) => {
      if (store.type !== storeType) return false;

      if (selectedFeaturedLabel) {
        const hasFeaturedItem = store.menu.some(item => {
          const label = locale === 'tr' ? item.section_label_tr : item.section_label_en;
          return label === selectedFeaturedLabel;
        });
        if (!hasFeaturedItem) return false;
      }

      const haystack = [
        store.name[locale],
        store.store_categories ? store.store_categories[locale === "tr" ? "name_tr" : "name_en"] : store.category_id,
        ...store.menu.map(m => m.name[locale]),
        ...store.menu.map(m => m.product_categories?.[locale === "tr" ? "name_tr" : "name_en"] || "")
      ].join(" ").toLocaleLowerCase(locale);

      return haystack.includes(normalized);
    });

    switch (sortBy) {
      case "rating_desc": result.sort((a, b) => b.rating - a.rating); break;
      case "rating_asc": result.sort((a, b) => a.rating - b.rating); break;
      case "deliveryFee_asc": result.sort((a, b) => a.deliveryFee - b.deliveryFee); break;
      case "deliveryFee_desc": result.sort((a, b) => b.deliveryFee - a.deliveryFee); break;
      case "eta_asc": result.sort((a, b) => parseInt(a.eta) - parseInt(b.eta)); break;
    }

    return result;
  }, [locale, query, stores, storeType, selectedFeaturedLabel, sortBy]);

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
    setSelectedFeaturedLabel(null);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <div id="stores" className="mt-3 flex items-center justify-between gap-4">
        <div className="shrink-0">
          <h2 className="text-2xl font-black">{filtered.length} {storeType === "food" ? t.restaurants : "Mağazalar"} 🍴</h2>
          <p className="text-sm text-zinc-500">{t.chooseItems}</p>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 overflow-x-auto no-scrollbar pl-2 py-1">
          {featuredLabels.map(label => (
            <button
              key={label}
              onClick={() => setSelectedFeaturedLabel(current => current === label ? null : label)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors border ${
                selectedFeaturedLabel === label 
                  ? "bg-zinc-800 text-white border-transparent" 
                  : "bg-white text-zinc-600 hover:bg-zinc-50 border-black/10"
              }`}
            >
              {label}
            </button>
          ))}
          <button onClick={() => setIsSortModalOpen(true)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm border border-black/10 ml-1 hover:bg-zinc-50 transition-colors" aria-label="Filtrele">
            <Filter size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 pb-28 md:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((store) => (
          <article key={store.id} className="flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between border-b border-[var(--accent)]/10 bg-[var(--accent)]/5 p-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Image width={96} height={96} className="h-12 w-12 shrink-0 rounded-full border border-black/10 object-cover" src={store.logo || "https://placehold.co/100x100.webp?text=Logo"} alt="" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black leading-tight">
                    {store.name[locale]}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
                    <span className="truncate">{store.store_categories ? store.store_categories[locale === "tr" ? "name_tr" : "name_en"] : store.category_id} · ★ {Number(store.rating).toFixed(1)} · {formatNumber(store.reviews, locale)}</span>
                    {store.badge && <span className="shrink-0 rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">{store.badge[locale]}</span>}
                  </p>
                </div>
              </div>
              <div className="ml-3 shrink-0 text-right text-sm text-zinc-600">
                <p className="flex items-center justify-end gap-1"><Clock size={14} /> {store.eta} {t.min} </p>
                <p className="flex items-center justify-end gap-1"><Bike size={14} /> {store.deliveryFee ? formatMoney(store.deliveryFee, locale) : t.free}</p>
              </div>
            </div>
            <div className="flex flex-col px-5 pb-5 h-[500px] overflow-y-auto custom-scrollbar">
              {(() => {
                const storeMenu = selectedFeaturedLabel
                  ? store.menu.filter(item => (locale === 'tr' ? item.section_label_tr : item.section_label_en) === selectedFeaturedLabel)
                  : store.menu;

                const featuredItems = storeMenu.filter(item => locale === 'tr' ? item.section_label_tr : item.section_label_en);
                const regularItems = storeMenu.filter(item => !(locale === 'tr' ? item.section_label_tr : item.section_label_en));
                const allItems = [...featuredItems, ...regularItems];

                return (
                  <div className="flex flex-col mt-2">
                    {allItems.map((item) => {
                      const label = locale === 'tr' ? item.section_label_tr : item.section_label_en;
                      const isFeatured = !!label;
                      const sectionColor = item.section_color || '#f97316';

                      return (
                        <div key={item.id} className={`relative flex flex-col gap-2 py-4 border-b ${isFeatured ? 'px-3 -mx-3 rounded-xl border mb-1 mt-2 shadow-sm' : 'border-black/5'}`} style={isFeatured ? { backgroundColor: `${sectionColor}15`, borderColor: `${sectionColor}30` } : undefined}>
                          {isFeatured && (
                            <span className="absolute -top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] leading-none font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1" style={{ backgroundColor: sectionColor }}>
                              <Star className="inline-flex" size={12} fill="white" strokeWidth={1} />
                              <span className="pt-[1px]">{label}</span>
                            </span>
                          )}
                          <div className={`grid grid-cols-[64px_1fr] gap-3 ${isFeatured ? 'mt-2' : ''}`}>
                            <Image
                              width={160}
                              height={160}
                              className="h-16 w-16 rounded-md object-cover cursor-pointer transition-transform hover:scale-105"
                              src={item.image}
                              alt={item.name[locale]}
                              onClick={() => setEnlargedImage(item.image)}
                            />
                            <div className="min-w-0">
                              <h4 className="line-clamp-1 cursor-pointer font-black hover:underline" onClick={() => openItem(store, item)}>{item.name[locale]}</h4>
                              <div className="line-clamp-2 text-sm text-zinc-500">
                                <ReactMarkdown
                                  components={{
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4" {...props} />,
                                    p: ({ node, ...props }) => <span {...props} />,
                                  }}
                                >
                                  {item.description[locale]}
                                </ReactMarkdown>
                              </div>
                              {(item.calories || 0) > 0 && <p className="mt-1 text-sm font-bold text-emerald-700">🔥 {formatNumber(item.calories || 0, locale)} kcal</p>}
                              {item.optionGroups && item.optionGroups.length > 0 && <p className="mt-1 text-xs text-[var(--accent)]">{t.optionsAvailable} ›</p>}
                            </div>
                          </div>
                          <div className="mt-1 flex items-end justify-between gap-2">
                            <strong>{formatMoney(item.price, locale)}</strong>
                            <button className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-black text-white hover:opacity-90" onClick={() => openItem(store, item)}>{t.add}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </article>
        ))}
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 md:p-8">
          <div className="flex w-full min-h-[50vh] md:min-h-[500px] max-h-[92vh] max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl md:flex-row">

            <div className="relative h-64 shrink-0 bg-zinc-100 md:h-auto md:w-1/2">
              <Image
                fill
                className="cursor-pointer object-cover transition-opacity hover:opacity-90"
                src={activeItem.item.image}
                alt=""
                onClick={() => setEnlargedImage(activeItem.item.image)}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <button onClick={() => setActiveItem(null)} className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 md:hidden">×</button>
            </div>

            <div className="relative flex flex-1 flex-col overflow-auto p-5 md:p-8">
              <button onClick={() => setActiveItem(null)} className="absolute right-5 top-5 hidden h-9 w-9 items-center justify-center rounded-full bg-zinc-100 md:flex">×</button>

              <div className="pr-2 md:pr-8">
                <h3 className="text-2xl font-black">{activeItem.item.name[locale]}</h3>
                <div className="mt-2 text-sm text-zinc-500">
                  <ReactMarkdown
                    components={{
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 mt-2" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mt-2" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-2" {...props} />
                    }}
                  >{activeItem.item.description[locale]}</ReactMarkdown>
                </div>
                {activeItem.store.type === "food" && (activeItem.item.calories || 0) > 0 && (
                  <p className="mt-3 text-sm font-bold text-emerald-700">🔥 {formatNumber(activeItem.item.calories || 0, locale)} kcal</p>
                )}
              </div>

              <div className="mt-6 space-y-4">
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
        </div>
      )}

      {enlargedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-2xl font-bold text-black transition-colors hover:bg-black/10 md:right-8 md:top-8"
            aria-label={t.close}
          >
            ×
          </button>
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Image width={1200} height={1200} src={enlargedImage} alt="" className="max-h-[80vh] w-full rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {isSortModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={() => setIsSortModalOpen(false)}>
          <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black">Sırala</h3>
              <button onClick={() => setIsSortModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-600 hover:bg-zinc-200">×</button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { id: "recommended", label: "Önerilenler" },
                { id: "rating_desc", label: "Puan (Yüksekten Düşüğe)" },
                { id: "rating_asc", label: "Puan (Düşükten Yükseğe)" },
                { id: "deliveryFee_asc", label: "Teslimat Ücreti (Düşükten Yükseğe)" },
                { id: "deliveryFee_desc", label: "Teslimat Ücreti (Yüksekten Düşüğe)" },
                { id: "eta_asc", label: "Tahmini Süre (En Hızlı)" },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id as Parameters<typeof setSortBy>[0]); setIsSortModalOpen(false); }}
                  className={`flex items-center justify-between rounded-lg p-3 text-left font-semibold transition-colors ${sortBy === opt.id ? 'bg-orange-50 text-orange-700' : 'hover:bg-zinc-50 text-zinc-700'}`}
                >
                  {opt.label}
                  {sortBy === opt.id && <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
