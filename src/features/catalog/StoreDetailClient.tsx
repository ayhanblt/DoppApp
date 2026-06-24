"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Minus, Star, Clock, MessageCircle, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { formatMoney, formatNumber, uid } from "@/shared/lib/format";
import type { CartSelection, Locale, Product, Store } from "@/shared/lib/types";
import { useCatalog } from "./CatalogContext";
import { supabase } from "@/shared/api/supabase";
import { useRouter } from "next/navigation";

type ActiveItem = { store: Store; item: Product };

export function StoreDetailClient({ locale, storeId }: { locale: Locale; storeId: string }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const { stores, setStores, setCart } = useCatalog();

  const store = stores.find((s) => s.id === storeId);

  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [selections, setSelections] = useState<CartSelection>({});
  const [quantity, setQuantity] = useState(1);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [selectedFeaturedLabel, setSelectedFeaturedLabel] = useState<string | null>(null);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEnlargedImage(null);
        setActiveItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!store) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-zinc-500">Mağaza bulunamadı veya yükleniyor...</p>
      </div>
    );
  }

  const getCategoryName = (item: Product, locale: Locale) => {
    if (locale === 'tr' && item.section_label_tr) return item.section_label_tr;
    if (locale === 'en' && item.section_label_en) return item.section_label_en;
    if (item.product_categories) {
      return locale === 'tr' ? item.product_categories.name_tr : item.product_categories.name_en;
    }
    return "";
  };

  const featuredLabels = Array.from(new Set(
    store.menu.map(item => getCategoryName(item, locale)).filter(Boolean) as string[]
  )).sort();

  const storeMenu = selectedFeaturedLabel
    ? store.menu.filter(item => getCategoryName(item, locale) === selectedFeaturedLabel)
    : store.menu;

  const featuredItems = storeMenu.filter(item => locale === 'tr' ? item.section_label_tr : item.section_label_en);
  const regularItems = storeMenu.filter(item => !(locale === 'tr' ? item.section_label_tr : item.section_label_en));
  const displayedItems = [...featuredItems, ...regularItems];

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

  const getActiveItemTotalPrice = () => {
    if (!activeItem) return 0;
    let base = activeItem.item.price;
    activeItem.item.optionGroups?.forEach((g) => {
      const selectedIds = selections[g.id] || [];
      selectedIds.forEach((id) => {
        const opt = g.options.find((o) => o.id === id);
        if (opt) base += opt.priceDelta;
      });
    });
    return base * quantity;
  };

  const submitReview = async () => {
    if (!store || !reviewName.trim() || !reviewText.trim()) return;
    setIsSubmittingReview(true);

    const newReview = {
      author: reviewName.trim(),
      rating: reviewRating,
      comment: reviewText.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    const oldReviews = store.reviews_data || [];
    const updatedReviews = [newReview, ...oldReviews];
    const newRating = ((Number(store.rating || 5) * oldReviews.length) + reviewRating) / (oldReviews.length + 1) || reviewRating;

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          reviews_data: updatedReviews,
          reviews: updatedReviews.length,
          rating: newRating
        })
        .eq('id', store.id);

      if (error) throw error;

      const updatedStore = {
        ...store,
        reviews_data: updatedReviews,
        reviews: updatedReviews.length,
        rating: newRating
      };
      setStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));

      setReviewName("");
      setReviewRating(5);
      setReviewText("");
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Yorum gönderilirken bir hata oluştu.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf5f1]">
      <div className="bg-white border-b border-black/5">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-8">
          
          {/* Mobile Top Bar: Back Button + Logo + Title */}
          <div className="flex md:hidden items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex shrink-0">
              <Image width={128} height={128} className="h-12 w-12 rounded-full border border-black/10 object-cover shadow-sm" src={store.logo || "https://placehold.co/100x100.webp?text=Logo"} alt={store.name[locale]} />
            </div>
            <h1 className="text-xl font-black text-zinc-900 truncate flex-1">{store.name[locale]}</h1>
            {store.badge && (
              <span className="shrink-0 rounded-md bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                {store.badge[locale]}
              </span>
            )}
          </div>

          <div className="flex flex-row items-start gap-4">
            {/* Desktop Back Button */}
            <button
              onClick={() => router.back()}
              className="hidden md:flex mt-1 h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex flex-row flex-1 items-start gap-4 min-w-0">
              <div className="hidden md:flex shrink-0">
                <Image width={128} height={128} className="h-16 w-16 md:h-24 md:w-24 rounded-full border border-black/10 object-cover shadow-sm" src={store.logo || "https://placehold.co/100x100.webp?text=Logo"} alt={store.name[locale]} />
              </div>
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="hidden md:flex items-center gap-2">
                  <h1 className="text-3xl font-black text-zinc-900">{store.name[locale]}</h1>
                  {store.badge && (
                    <span className="shrink-0 rounded-md bg-[var(--accent)]/10 px-2 py-1 text-[10px] md:text-xs font-black uppercase tracking-wider text-[var(--accent)]">
                      {store.badge[locale]}
                    </span>
                  )}
                </div>
                <div className="mt-1 md:mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-zinc-600">
                  <span className="text-amber-500 flex items-center gap-1"><Star size={14} fill="currentColor" /> {Number(store.rating).toFixed(1)}</span>
                  <span>·</span>
                  <span>{formatNumber(store.reviews, locale)} {t.reviews}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-[var(--accent)]" /> {store.eta}</span>
                  {store.store_categories && (
                    <>
                      <span>·</span>
                      <span>{store.store_categories[locale === "tr" ? "name_tr" : "name_en"]}</span>
                    </>
                  )}
                </div>
                {store.description && store.description[locale] && store.description[locale] !== "null" && store.description[locale].trim() !== "" && (
                  <p className="mt-3 text-sm text-zinc-500 leading-relaxed max-w-3xl">
                    {store.description[locale]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          <div className="w-full lg:w-64 shrink-0">
            <div className="sticky top-24">
              <h3 className="font-black text-lg mb-4 text-zinc-900">Kategoriler</h3>
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                <button
                  onClick={() => setSelectedFeaturedLabel(null)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold text-left transition-colors border ${!selectedFeaturedLabel
                    ? "bg-[var(--accent)] text-white border-transparent shadow-sm"
                    : "bg-white text-zinc-600 hover:bg-zinc-50 border-black/10"
                    }`}
                >
                  Tüm Ürünler
                </button>
                {featuredLabels.map(label => (
                  <button
                    key={label}
                    onClick={() => setSelectedFeaturedLabel(label)}
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold text-left transition-colors border ${selectedFeaturedLabel === label
                      ? "bg-[var(--accent)] text-white border-transparent shadow-sm"
                      : "bg-white text-zinc-600 hover:bg-zinc-50 border-black/10"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-black mb-6">{selectedFeaturedLabel || "Tüm Ürünler"}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {displayedItems.map((item) => {
                const label = locale === 'tr' ? item.section_label_tr : item.section_label_en;
                const isFeatured = !!label;
                const sectionColor = item.section_color || '#f97316';

                return (
                  <div
                    key={item.id}
                    className="relative flex flex-col bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden transition-all hover:shadow-md cursor-pointer group"
                    onClick={() => openItem(store, item)}
                  >
                    {isFeatured && (
                      <span className="absolute top-2 right-2 z-10 flex rounded-full px-2.5 py-1 text-[10px] leading-none font-black uppercase tracking-wider text-white shadow-sm items-center gap-1" style={{ backgroundColor: sectionColor }}>
                        <Star className="inline-flex" size={12} fill="white" strokeWidth={1} />
                        <span className="pt-[1px]">{label}</span>
                      </span>
                    )}
                    <div className="aspect-square w-full relative overflow-hidden bg-zinc-50">
                      <Image
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        src={item.image}
                        alt={item.name[locale]}
                        sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
                      />
                    </div>

                    <div className="flex flex-col flex-1 p-4">
                      <div className="flex-1">
                        <h4 className="line-clamp-2 font-black text-lg leading-tight group-hover:underline text-zinc-900">{item.name[locale]}</h4>
                        <div className="line-clamp-2 text-sm text-zinc-500 mt-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          <ReactMarkdown
                            components={{
                              ul: (props) => <ul className="list-disc pl-4" {...props} />,
                              ol: (props) => <ol className="list-decimal pl-4" {...props} />,
                              p: (props) => <span {...props} />,
                            }}
                          >
                            {item.description[locale]}
                          </ReactMarkdown>
                        </div>
                        {(item.calories || 0) > 0 && <p className="mt-2 text-sm font-bold text-emerald-700">🔥 {formatNumber(item.calories || 0, locale)} kcal</p>}
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-2">
                        <strong className="text-xl font-black text-[var(--accent)]">{formatMoney(item.price, locale)}</strong>
                        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-black text-white hover:bg-zinc-800 transition-colors shadow-sm">{t.add}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><MessageCircle size={24} className="text-[var(--accent)]" /> {t.reviews}</h3>

              {store.reviews_data && store.reviews_data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {store.reviews_data.map((review, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-zinc-50 border border-black/5">
                      <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-[var(--accent)] to-orange-400 flex items-center justify-center text-white font-black text-xl shadow-sm">
                        {review.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-zinc-900">{review.author.split(' ').map(w => w.charAt(0).toUpperCase() + '*'.repeat(Math.max(0, w.length - 1))).join(' ')}</span>
                          <span className="text-amber-500 text-sm font-black flex tracking-wider">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={i < review.rating ? 0 : 1} />
                            ))}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 italic py-4">Henüz yorum yapılmamış.</p>
              )}

              <div className="mt-8 border-t border-black/5 pt-8 max-w-2xl">
                <h4 className="font-black text-lg mb-4">Yorum Yap</h4>
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    className="rounded-xl border border-black/10 p-3 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                  />
                  <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-black/10">
                    <span className="font-bold text-zinc-700">Puan:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`text-2xl focus:outline-none transition-transform hover:scale-110 ${star <= reviewRating ? 'text-amber-500' : 'text-zinc-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Yorumunuz..."
                    className="rounded-xl border border-black/10 p-3 h-24 resize-none bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  ></textarea>
                  <button
                    className="rounded-xl bg-[var(--accent)] text-white font-black py-3 px-6 hover:bg-[var(--accent)]/90 disabled:opacity-50 transition-colors shadow-sm self-start"
                    disabled={isSubmittingReview || !reviewName.trim() || !reviewText.trim()}
                    onClick={submitReview}
                  >
                    {isSubmittingReview ? "Gönderiliyor..." : "Yorumu Gönder"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 md:p-8 animate-in fade-in duration-200" onClick={() => setActiveItem(null)}>
          <div className="flex w-full min-h-[50vh] md:min-h-[400px] max-h-[92vh] max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl md:flex-row" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex shrink-0 items-center justify-center bg-zinc-50 py-8 md:w-1/2 md:p-8">
              <div className="relative aspect-square w-56 md:w-full max-w-[360px] p-4 md:p-8">
                <div className="relative h-full w-full">
                  <Image
                    fill
                    className="cursor-pointer object-contain transition-opacity hover:opacity-90 mix-blend-multiply"
                    src={activeItem.item.image}
                    alt=""
                    onClick={() => setEnlargedImage(activeItem.item.image)}
                    sizes="(max-width: 768px) 224px, 400px"
                  />
                </div>
              </div>
              <button onClick={() => setActiveItem(null)} className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 md:hidden font-bold shadow-sm">×</button>
            </div>
            <div className="relative flex flex-1 flex-col overflow-auto p-5 md:p-8">
              <button onClick={() => setActiveItem(null)} className="absolute right-5 top-5 hidden h-9 w-9 items-center justify-center rounded-full bg-zinc-100 md:flex font-bold hover:bg-zinc-200">×</button>
              <div className="pr-2 md:pr-8">
                <h3 className="text-2xl font-black">{activeItem.item.name[locale]}</h3>
                <div className="mt-2 text-sm text-zinc-500">
                  <ReactMarkdown
                    components={{
                      ul: (props) => <ul className="list-disc pl-4 mt-2" {...props} />,
                      ol: (props) => <ol className="list-decimal pl-4 mt-2" {...props} />,
                      p: (props) => <p className="mb-2" {...props} />
                    }}
                  >{activeItem.item.description[locale]}</ReactMarkdown>
                </div>
                {(activeItem.item.calories || 0) > 0 && (
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
                          <button key={option.id} className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${selected ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-black/10 hover:border-black/20"}`} onClick={() => toggleSelection(group.id, option.id, group.multiple)}>
                            <span className="font-bold">{option.label[locale]}</span>
                            <div className="flex items-center gap-2 text-sm text-zinc-500 whitespace-nowrap">
                              {option.priceDelta !== 0 && (
                                <span>{option.priceDelta > 0 ? "+ " : "- "}{formatMoney(Math.abs(option.priceDelta), locale)}</span>
                              )}
                              {selected && <span className="text-[var(--accent)] font-bold">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                  <div className="flex flex-col">
                    <span className="font-black text-lg">{formatMoney(getActiveItemTotalPrice(), locale)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm border border-black/5 hover:bg-zinc-50 transition-colors" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button>
                    <strong>{quantity}</strong>
                    <button className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm border border-black/5 hover:bg-zinc-50 transition-colors" onClick={() => setQuantity((value) => value + 1)}><Plus size={16} /></button>
                  </div>
                </div>
                <button className="w-full rounded-lg bg-[var(--accent)] py-4 font-black text-white hover:opacity-90 transition-opacity shadow-md" onClick={addActiveItem}>
                  {t.add}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {enlargedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setEnlargedImage(null)}>
          <button onClick={() => setEnlargedImage(null)} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white transition-colors hover:bg-white/20 md:right-8 md:top-8" aria-label={t.close}>×</button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Image width={1200} height={1200} src={enlargedImage} alt="" className="max-h-[90vh] w-auto max-w-full rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
