import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, Image, Alert, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { themes } from '@/features/catalog/appConfig';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { formatMoney, formatNumber, uid } from '@/shared/lib/format';
import { Locale, Product, Store, CartSelection } from '@/shared/lib/types';
import { Star, Clock, ArrowLeft, MessageSquare, Plus, Minus, ShoppingCart } from 'lucide-react-native';
import { supabase } from '@/shared/api/supabase';
import { ProductModal } from '@/features/catalog/ProductModal';
import { MarkdownText } from '@/shared/ui/MarkdownText';

export default function StoreDetailScreen() {
  const { id, productId } = useLocalSearchParams<{ id: string; productId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stores, setStores, locale, setCart, cart } = useCatalog();
  const t = dictionaries[locale];

  const store = useMemo(() => stores.find((s) => s.id === id), [stores, id]);

  const [activeItem, setActiveItem] = useState<{ store: Store; item: Product } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSectionLabel, setSelectedSectionLabel] = useState<string | null>(null);

  useEffect(() => {
    if (productId && store) {
      const item = store.menu.find((m) => m.id === productId);
      if (item) {
        setActiveItem({ store, item });
      }
    }
  }, [productId, store]);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  if (!store) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#fb4824" />
        <Text className="mt-4 text-zinc-500">{t.storeNotFound}</Text>
      </SafeAreaView>
    );
  }

  const getCategoryName = (item: Product, loc: Locale) => {
    if (item.product_categories) {
      return loc === 'tr' ? item.product_categories.name_tr : item.product_categories.name_en;
    }
    return "";
  };

  const sidebarCategories = Array.from(new Set(
    store.menu.map(item => getCategoryName(item, locale)).filter(Boolean) as string[]
  )).sort();

  const storeMenuFilteredByCategory = selectedCategory
    ? store.menu.filter(item => getCategoryName(item, locale) === selectedCategory)
    : store.menu;

  const sectionLabelsAvailable = Array.from(new Set(
    storeMenuFilteredByCategory.map(item => locale === 'tr' ? item.section_label_tr : item.section_label_en).filter(Boolean) as string[]
  )).sort();

  const storeMenu = selectedSectionLabel
    ? storeMenuFilteredByCategory.filter(item => (locale === 'tr' ? item.section_label_tr : item.section_label_en) === selectedSectionLabel)
    : storeMenuFilteredByCategory;

  const featuredItems = storeMenu.filter(item => locale === 'tr' ? item.section_label_tr : item.section_label_en);
  const regularItems = storeMenu.filter(item => !(locale === 'tr' ? item.section_label_tr : item.section_label_en));
  const displayedItems = [...featuredItems, ...regularItems];

  const handleAddCart = (quantity: number, selections: CartSelection) => {
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

      const updatedStore: Store = {
        ...store,
        reviews_data: updatedReviews,
        reviews: updatedReviews.length,
        rating: newRating
      };

      setStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
      Alert.alert(t.success, t.reviewSubmitted);

      setReviewName("");
      setReviewRating(5);
      setReviewText("");
    } catch (err) {
      console.error("Error submitting review:", err);
      Alert.alert(t.error, t.reviewError);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fbf5f1]" edges={['top', 'left', 'right']}>
      {/* HEADER BAR */}
      <View className="px-4 py-3 bg-white border-b border-black/5 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="flex-row items-center">
          <ArrowLeft size={20} color="#09090b" />
          <Text className="ml-2 font-bold text-zinc-900">{t.backToApp}</Text>
        </Pressable>
        <Text className="text-sm font-black text-accent uppercase">{store.store_categories?.[locale === "tr" ? "name_tr" : "name_en"] || ""}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: cart.length > 0 ? 100 : 32 }} keyboardShouldPersistTaps="handled">
          {/* STORE INFO CARD */}
          <View className="bg-white p-5 border-b border-black/5">
            <View className="flex-row items-start gap-4">
              <Image
                source={{ uri: store.logo || "https://placehold.co/100x100.webp?text=Logo" }}
                className="h-16 w-16 md:h-20 md:w-20 rounded-full border border-black/10 object-cover shadow-sm bg-zinc-50"
              />
              <View className="flex-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="text-xl font-black text-zinc-900 leading-tight">{store.name[locale]}</Text>
                  {store.badge && (
                    <View className="rounded bg-accent/10 px-1.5 py-0.5">
                      <Text className="text-[10px] font-black uppercase text-accent">{store.badge[locale]}</Text>
                    </View>
                  )}
                </View>
                <View className="mt-2 flex-row flex-wrap items-center gap-2">
                  <View className="flex-row items-center gap-0.5">
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text className="text-xs font-bold text-amber-500">{Number(store.rating).toFixed(1)}</Text>
                  </View>
                  <Text className="text-xs text-zinc-400">·</Text>
                  <Text className="text-xs text-zinc-500 font-medium">{formatNumber(store.reviews, locale)} {t.reviews}</Text>
                  <Text className="text-xs text-zinc-400">·</Text>
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#fb4824" />
                    <Text className="text-xs font-bold text-zinc-700">{store.eta}</Text>
                  </View>
                </View>
                {store.description && store.description[locale] !== "null" && store.description[locale]?.trim() !== "" && (
                  <Text className="mt-3 text-xs text-zinc-500 leading-relaxed">{store.description[locale]}</Text>
                )}
              </View>
            </View>
          </View>

          {/* CATEGORY SELECTOR (HORIZONTAL SCROLL) */}
          <View className="bg-white border-b border-black/5 py-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 flex-row">
              <Pressable
                onPress={() => {
                  setSelectedCategory(null);
                  setSelectedSectionLabel(null);
                }}
                className={`rounded-lg px-4 py-2 border mr-2 ${!selectedCategory ? "bg-accent border-transparent shadow-sm" : "bg-white border-black/10 shadow-none"}`}
              >
                <Text className={`text-xs font-bold ${!selectedCategory ? "text-white" : "text-zinc-600"}`}>
                  {t.allProducts}
                </Text>
              </Pressable>
              {sidebarCategories.map(label => (
                <Pressable
                  key={label}
                  onPress={() => {
                    setSelectedCategory(label);
                    setSelectedSectionLabel(null);
                  }}
                  className={`rounded-lg px-4 py-2 border mr-2 ${selectedCategory === label ? "bg-accent border-transparent shadow-sm" : "bg-white border-black/10 shadow-none"}`}
                >
                  <Text className={`text-xs font-bold ${selectedCategory === label ? "text-white" : "text-zinc-600"}`}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* PRODUCT LIST */}
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4 flex-wrap gap-2">
              <Text className="text-lg font-black text-zinc-900">{selectedCategory || t.allProducts}</Text>
              {sectionLabelsAvailable.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {sectionLabelsAvailable.map(label => (
                    <Pressable
                      key={label}
                      onPress={() => setSelectedSectionLabel(current => current === label ? null : label)}
                      className={`rounded-full px-3 py-1.5 border mr-2 ${selectedSectionLabel === label ? "bg-zinc-800 border-transparent shadow-sm" : "bg-white border-black/10 shadow-none"}`}
                    >
                      <Text className={`text-[11px] font-bold ${selectedSectionLabel === label ? "text-white" : "text-zinc-600"}`}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
            <View className="gap-3">
              {displayedItems.map((item) => {
                const label = locale === 'tr' ? item.section_label_tr : item.section_label_en;
                const isFeatured = !!label;
                const sectionColor = item.section_color || '#f97316';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setActiveItem({ store, item })}
                    className={`bg-white rounded-2xl border border-black/5 p-4 flex-col `}
                    style={isFeatured ? { backgroundColor: `${sectionColor}10`, borderColor: `${sectionColor}20` } : undefined}
                  >
                    {isFeatured && (
                      <View className="self-start rounded-full px-2 py-0.5 mb-2" style={{ backgroundColor: sectionColor }}>
                        <Text className="text-[9px] font-black uppercase text-white">★ {label}</Text>
                      </View>
                    )}
                    <View className="flex-row">
                      <View className="flex-1 mr-4">
                        <Text className="text-base font-black text-zinc-900 leading-tight" numberOfLines={1}>{item.name[locale]}</Text>
                        <Text className="mt-1.5 text-[13px] text-zinc-500 leading-tight" numberOfLines={2}>
                          {item.description[locale].replace(/(\*\*|[-*]\s)/g, '').replace(/\n/g, ' ')}
                        </Text>
                        {(item.calories || 0) > 0 && (
                          <Text className="mt-2 text-xs font-bold text-emerald-700">🔥 {formatNumber(item.calories || 0, locale)} kcal</Text>
                        )}
                        <Text className="text-base font-black text-accent mt-3">{formatMoney(item.price, locale)}</Text>
                      </View>
                      <Image
                        source={{ uri: item.image }}
                        className="w-24 h-24 rounded-xl border border-black/5 bg-zinc-50 object-cover"
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* REVIEWS & RATINGS */}
          <View className="bg-white p-5 border-t border-b border-black/5 mt-4">
            <Text className="text-lg font-black text-zinc-900 mb-4 flex-row items-center gap-2">
              <MessageSquare size={18} color="#fb4824" /> {t.reviews}
            </Text>

            {store.reviews_data && store.reviews_data.length > 0 ? (
              <View className="gap-4">
                {store.reviews_data.map((review, idx) => (
                  <View key={idx} className="flex-row gap-3 border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                    <View className="h-10 w-10 shrink-0 rounded-full bg-accent items-center justify-center shadow-sm">
                      <Text className="text-white font-black text-lg">{review.author.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="font-bold text-sm text-zinc-900">
                          {review.author.split(' ').map(w => w.charAt(0).toUpperCase() + '*'.repeat(Math.max(0, w.length - 1))).join(' ')}
                        </Text>
                        <View className="flex-row">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} color={i < review.rating ? "#f59e0b" : "#e4e4e7"} fill={i < review.rating ? "#f59e0b" : "none"} />
                          ))}
                        </View>
                      </View>
                      <Text className="text-sm text-zinc-600 leading-normal">{review.comment}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-zinc-400 italic py-4">{t.noReviewsYet}</Text>
            )}

            {/* ADD REVIEW FORM */}
            <View className="mt-8 border-t border-zinc-100 pt-6">
              <Text className="font-black text-base mb-4">{t.addReview}</Text>
              <View className="gap-3">
                <TextInput
                  placeholder={t.fullName}
                  placeholderTextColor="#a1a1aa"
                  value={reviewName}
                  onChangeText={setReviewName}
                  className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 bg-zinc-50"
                />
                <View className="flex-row items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <Text className="font-bold text-zinc-700 text-sm">{t.rating}</Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Pressable
                        key={star}
                        onPress={() => setReviewRating(star)}
                        className="px-1"
                      >
                        <Text className={`text-2xl ${star <= reviewRating ? 'text-amber-500' : 'text-zinc-300'}`}>★</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <TextInput
                  placeholder={t.yourReview}
                  placeholderTextColor="#a1a1aa"
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="w-full rounded-xl border border-zinc-300 p-3 text-sm text-zinc-900 bg-zinc-50 h-20"
                />
                <Pressable
                  onPress={submitReview}
                  disabled={isSubmittingReview || !reviewName.trim() || !reviewText.trim()}
                  className={`rounded-xl py-3.5 items-center justify-center ${isSubmittingReview || !reviewName.trim() || !reviewText.trim() ? "bg-accent/50 shadow-none" : "bg-accent shadow-sm"}`}
                >
                  <Text className="text-white font-black text-base">
                    {isSubmittingReview ? t.submitting : t.submitReview}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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

      {cart.length > 0 && (
        <View className="absolute left-4 right-4" style={{ bottom: Math.max(insets.bottom + 16, 32) }}>
          <Pressable
            onPress={() => router.push('/cart')}
            style={{ backgroundColor: themes[store.type === 'shop' ? 'grape' : store.type === 'food' ? 'sunset' : 'mint'] }}
            className="rounded-2xl flex-row items-center justify-between p-4 shadow-xl"
          >
            <View className="flex-row items-center">
              <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center mr-3">
                <ShoppingCart size={20} color="#ffffff" />
              </View>
              <View>
                <Text className="text-white font-bold text-sm">Sepetim</Text>
                <Text className="text-white/80 text-xs">{cart.length} Ürün</Text>
              </View>
            </View>
            <Text className="text-white font-black text-lg">
              {formatMoney(
                cart.reduce((sum, ci) => sum + (store.menu.find(m => m.id === ci.itemId)?.price || 0) * ci.quantity, 0),
                locale
              )}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
