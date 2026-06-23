import React, { useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, ScrollView } from "react-native";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { CartSelection, Locale, Product, Store, StoreType } from "@/shared/lib/types";
import { formatMoney, formatNumber } from "@/shared/lib/format";
import { useCatalog } from "./CatalogContext";
import { useRouter } from "expo-router";
import { Filter, Star, Clock } from "lucide-react-native";
import { ProductModal } from "./ProductModal";
import { uid } from "@/shared/lib/format";

export function CatalogList({ locale, storeType }: { locale: Locale; storeType: StoreType }) {
  const t = dictionaries[locale];
  const { stores, query, setCart } = useCatalog();
  const router = useRouter();

  const [selectedFeaturedLabel, setSelectedFeaturedLabel] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<{ store: Store; item: Product } | null>(null);

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
    return stores.filter((store) => {
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
  }, [locale, query, stores, storeType, selectedFeaturedLabel]);

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
        <TouchableOpacity 
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
        </TouchableOpacity>

        <View className="p-4">
          {displayedItems.map((product) => {
            const label = locale === "tr" ? product.section_label_tr : product.section_label_en;
            return (
              <TouchableOpacity
                key={product.id}
                onPress={() => setActiveItem({ store, item: product })}
                className="flex-row items-center justify-between py-3 border-b border-black/5"
              >
                <View className="flex-1 mr-3">
                  {label && (
                    <Text className="text-[10px] font-black uppercase text-accent mb-1">{label}</Text>
                  )}
                  <Text className="text-sm font-bold text-zinc-900 mb-1" numberOfLines={1}>
                    {product.name[locale]}
                  </Text>
                  <Text className="text-xs text-zinc-500" numberOfLines={2}>
                    {product.description[locale]}
                  </Text>
                  <Text className="text-sm font-bold mt-2">{formatMoney(product.price, locale)}</Text>
                </View>
                <Image
                  source={{ uri: product.image }}
                  className="w-20 h-20 rounded-lg bg-zinc-100"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-xl font-black text-zinc-900">
            {filtered.length} {storeType === "food" ? t.restaurants : "Mağaza"}
          </Text>
          <Text className="text-sm text-zinc-500">{t.chooseItems}</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center border border-black/10 shadow-sm">
          <Filter size={18} color="#52525b" />
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {featuredLabels.map((label) => (
            <TouchableOpacity
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
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderStore}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
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
    </View>
  );
}
