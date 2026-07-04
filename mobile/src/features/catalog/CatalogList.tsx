import React, { useMemo, useState } from "react";
import { View, Image, FlatList, ScrollView, Pressable, Modal } from 'react-native';
import { Text } from '@/shared/ui/Text';
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { CartSelection, Locale, Product, Store, StoreType } from "@/shared/lib/types";
import { formatMoney, formatNumber } from "@/shared/lib/format";
import { useCatalog } from "./CatalogContext";
import { useRouter } from "expo-router";
import { Filter, Star, Clock } from "lucide-react-native";
import { ProductModal } from "./ProductModal";
import { CatalogBanner } from "./CatalogBanner";
import { uid } from "@/shared/lib/format";

export function CatalogList({ locale, storeType }: { locale: Locale; storeType: StoreType }) {
  const t = dictionaries[locale];
  const { stores, query, isLoading, setCart } = useCatalog();
  const router = useRouter();

  const [selectedLabels, setSelectedLabels] = useState<Record<string, string | null>>({});
  const selectedFeaturedLabel = selectedLabels[storeType] || null;
  const setSelectedFeaturedLabel = (labelOrUpdater: string | null | ((prev: string | null) => string | null)) => {
    setSelectedLabels((prev) => {
      const current = prev[storeType] || null;
      const nextLabel = typeof labelOrUpdater === 'function' ? labelOrUpdater(current) : labelOrUpdater;
      return { ...prev, [storeType]: nextLabel };
    });
  };
  const [activeItem, setActiveItem] = useState<{ store: Store; item: Product } | null>(null);
  const [sortBy, setSortBy] = useState<"recommended" | "rating_desc" | "rating_asc" | "deliveryFee_asc" | "deliveryFee_desc" | "eta_asc">("recommended");
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  const featuredLabels = useMemo(() => {
    const labels = new Set<string>();
    stores.forEach((store) => {
      if (store.type !== storeType) return;
      store.menu.forEach((item) => {
        const label = locale === "tr" ? item.section_label_tr : item.section_label_en;
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
        const hasFeaturedItem = store.menu.some((item) => {
          const label = locale === "tr" ? item.section_label_tr : item.section_label_en;
          return label === selectedFeaturedLabel;
        });
        if (!hasFeaturedItem) return false;
      }

      const haystack = [
        store.name[locale],
        store.store_categories ? store.store_categories[locale === "tr" ? "name_tr" : "name_en"] : store.category_id,
        ...store.menu.map((m) => m.name[locale]),
        ...store.menu.map((m) => m.product_categories?.[locale === "tr" ? "name_tr" : "name_en"] || ""),
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

  const handleAddCart = (quantity: number, selections: CartSelection) => {
    if (!activeItem) return;
    setCart((current) => [
      ...current,
      {
        id: uid("cart"),
        storeId: activeItem.store.id,
        itemId: activeItem.item.id,
        quantity,
        selections,
      },
    ]);
    setActiveItem(null);
  };

  const renderStore = ({ item: store }: { item: Store }) => {
    const storeMenu = selectedFeaturedLabel
      ? store.menu.filter(
          (i) => (locale === "tr" ? i.section_label_tr : i.section_label_en) === selectedFeaturedLabel
        )
      : store.menu;

    const featuredItems = storeMenu.filter((i) => (locale === "tr" ? i.section_label_tr : i.section_label_en));
    const regularItems = storeMenu.filter((i) => !(locale === "tr" ? i.section_label_tr : i.section_label_en));
    const displayedItems = [...featuredItems, ...regularItems].slice(0, 3);

    return (
      <View className="mb-4 bg-white rounded-xl border border-black/10 overflow-hidden shadow-sm">
        <Pressable 
          onPress={() => router.push(`/store/${store.id}`)}
          className="flex-row items-center p-4 bg-accent/5 border-b border-accent/10"
        >
          <Image
            source={{ uri: store.logo || "https://placehold.co/100x100.webp" }}
            className="w-12 h-12 rounded-full border border-black/10 mr-3 bg-zinc-50"
          />
          <View className="flex-1">
            <Text className="text-lg font-black text-zinc-900" numberOfLines={1}>
              {store.name[locale]}
            </Text>
            <Text className="text-xs text-zinc-500 mt-1">
              <Star size={10} color="#f59e0b" fill="#f59e0b" /> {Number(store.rating).toFixed(1)} •{" "}
              {formatNumber(store.reviews, locale)} {t.reviews}
            </Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#fb4824" />
              <Text className="text-xs font-bold text-zinc-700">{store.eta}</Text>
            </View>
            <Text className="text-[10px] font-black text-accent mt-1">
              {t.seeAllItems ? t.seeAllItems(store.menu.length) : t.seeAll} ›
            </Text>
          </View>
        </Pressable>

        <View className="p-4">
          {displayedItems.map((product) => {
            const label = locale === "tr" ? product.section_label_tr : product.section_label_en;
            return (
              <Pressable
                key={product.id}
                onPress={() => setActiveItem({ store, item: product })}
                className="flex-col py-3 border-b border-black/5"
              >
                {label && (
                  <View className="self-start rounded-full px-2 py-0.5 mb-2 flex-row items-center gap-1" style={{ backgroundColor: product.section_color || '#f97316' }}>
                    <Star size={10} color="#fff" fill="#fff" />
                    <Text className="text-[9px] font-black uppercase text-white tracking-wider" numberOfLines={1}>{label}</Text>
                  </View>
                )}
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-bold text-zinc-900 mb-1" numberOfLines={1}>
                      {product.name[locale]}
                    </Text>
                    <Text className="text-xs text-zinc-500 h-8" numberOfLines={2}>
                      {product.description[locale]}
                    </Text>
                    <Text className="text-sm font-bold mt-2">{formatMoney(product.price, locale)}</Text>
                  </View>
                  <Image
                    source={{ uri: product.image }}
                    className="w-20 h-20 rounded-lg bg-zinc-100"
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <FlatList
        data={isLoading ? [1, 2, 3] as any : filtered}
        keyExtractor={(item, index) => isLoading ? `skeleton-${index}` : item.id}
        renderItem={isLoading ? () => (
          <View className="bg-white rounded-xl mb-4 overflow-hidden border border-black/10">
             <View className="flex-row items-center p-4 border-b border-black/5 bg-zinc-50 h-24">
                <View className="w-12 h-12 rounded-full bg-zinc-200 animate-pulse mr-3" />
                <View className="flex-1">
                  <View className="h-5 bg-zinc-200 rounded w-3/4 mb-2 animate-pulse" />
                  <View className="h-4 bg-zinc-200 rounded w-1/2 animate-pulse" />
                </View>
             </View>
             <View className="p-4 flex-col gap-4">
                <View className="flex-row items-center">
                  <View className="flex-1 mr-4">
                    <View className="h-4 bg-zinc-200 rounded w-full mb-2 animate-pulse" />
                    <View className="h-4 bg-zinc-200 rounded w-2/3 animate-pulse" />
                  </View>
                  <View className="w-20 h-20 bg-zinc-200 rounded-lg animate-pulse" />
                </View>
                <View className="flex-row items-center">
                  <View className="flex-1 mr-4">
                    <View className="h-4 bg-zinc-200 rounded w-full mb-2 animate-pulse" />
                    <View className="h-4 bg-zinc-200 rounded w-2/3 animate-pulse" />
                  </View>
                  <View className="w-20 h-20 bg-zinc-200 rounded-lg animate-pulse" />
                </View>
             </View>
          </View>
        ) : renderStore}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <CatalogBanner storeType={storeType} locale={locale} />
            <View className="flex-row items-center mb-4 gap-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 mr-1">
                {featuredLabels.map((label) => (
                  <Pressable
                    key={label}
                    onPress={() => setSelectedFeaturedLabel((curr) => (curr === label ? null : label))}
                    className={`px-4 py-2 rounded-full mr-2 border ${
                      selectedFeaturedLabel === label
                        ? "bg-zinc-800 border-zinc-800"
                        : "bg-white border-black/10"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        selectedFeaturedLabel === label ? "text-white" : "text-zinc-600"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable 
                onPress={() => setIsSortModalOpen(true)}
                className="w-10 h-10 shrink-0 rounded-full bg-white items-center justify-center border border-black/10 shadow-sm"
              >
                <Filter size={18} color="#52525b" />
              </Pressable>
            </View>
          </>
        }
      />

      {activeItem && (
        <ProductModal
          locale={locale}
          store={activeItem.store}
          item={activeItem.item}
          visible={!!activeItem}
          onClose={() => setActiveItem(null)}
          onAdd={handleAddCart}
        />
      )}

      {/* Sort Modal */}
      <Modal visible={isSortModalOpen} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setIsSortModalOpen(false)}>
          <Pressable 
            onPress={(e) => e.stopPropagation()} 
            className="bg-white rounded-t-3xl p-6 pb-12 shadow-xl"
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-black text-zinc-900">Sırala</Text>
              <Pressable onPress={() => setIsSortModalOpen(false)} className="bg-zinc-100 p-2 rounded-full">
                <Text className="text-zinc-600 font-bold px-1">X</Text>
              </Pressable>
            </View>
            <View className="flex-col gap-2">
              {[
                { id: "recommended", label: "Önerilenler" },
                { id: "rating_desc", label: "Puan (Yüksekten Düşüğe)" },
                { id: "rating_asc", label: "Puan (Düşükten Yükseğe)" },
                { id: "deliveryFee_asc", label: "Teslimat Ücreti (Düşükten Yükseğe)" },
                { id: "deliveryFee_desc", label: "Teslimat Ücreti (Yüksekten Düşüğe)" },
                { id: "eta_asc", label: "Tahmini Süre (En Hızlı)" },
              ].map(opt => (
                <Pressable
                  key={opt.id}
                  onPress={() => { setSortBy(opt.id as any); setIsSortModalOpen(false); }}
                  className={`flex-row items-center justify-between p-4 rounded-xl ${sortBy === opt.id ? 'bg-orange-50' : 'bg-zinc-50'}`}
                >
                  <Text className={`font-semibold ${sortBy === opt.id ? 'text-orange-700' : 'text-zinc-700'}`}>{opt.label}</Text>
                  {sortBy === opt.id && <View className="w-3 h-3 rounded-full bg-orange-600" />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
