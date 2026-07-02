import React, { useState, useRef } from "react";
import { View, Text, Image, Modal, Pressable, Animated, StyleSheet, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { CartSelection, Locale, Product, Store } from "@/shared/lib/types";
import { formatMoney, formatNumber, uid } from "@/shared/lib/format";
import { Plus, Minus, X } from "lucide-react-native";
import { MarkdownText } from "@/shared/ui/MarkdownText";
import { LinearGradient } from "expo-linear-gradient";

type ProductModalProps = {
  locale: Locale;
  store: Store;
  item: Product;
  visible: boolean;
  onClose: () => void;
  onAdd: (quantity: number, selections: CartSelection) => void;
};

export function ProductModal({ locale, store, item, visible, onClose, onAdd }: ProductModalProps) {
  const t = dictionaries[locale];
  const insets = useSafeAreaInsets();

  const [selections, setSelections] = useState<CartSelection>(() => {
    const initial: CartSelection = {};
    item.optionGroups?.forEach((group) => {
      // Do not auto-select required options. Force the user to choose.
      initial[group.id] = [];
    });
    return initial;
  });

  const [quantity, setQuantity] = useState(1);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const groupLayouts = useRef<Record<string, number>>({});

  const [errorGroupId, setErrorGroupId] = useState<string | null>(null);
  const [buttonText, setButtonText] = useState<string>(t.add);

  // As the user scrolls (up to 150px), the black overlay goes from 0 to 0.8 opacity
  const overlayOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 0.8],
    extrapolate: 'clamp',
  });

  const toggleSelection = (groupId: string, optionId: string, multiple?: boolean) => {
    if (errorGroupId === groupId) {
      setErrorGroupId(null);
    }
    setSelections((current) => {
      const selected = current[groupId] ?? [];
      return {
        ...current,
        [groupId]: multiple
          ? selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId]
          : [optionId],
      };
    });
  };

  const getActiveItemTotalPrice = () => {
    let total = item.price;
    item.optionGroups?.forEach((group) => {
      const selectedIds = selections[group.id] || [];
      selectedIds.forEach((id) => {
        const option = group.options.find((o) => o.id === id);
        if (option) total += option.priceDelta;
      });
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    let missingGroupId = null;

    // Check for required groups
    if (item.optionGroups) {
      for (const group of item.optionGroups) {
        if (group.required && (!selections[group.id] || selections[group.id].length === 0)) {
          missingGroupId = group.id;
          break;
        }
      }
    }

    if (missingGroupId) {
      setErrorGroupId(missingGroupId);

      // Temporary button text
      setButtonText(locale === 'tr' ? "Zorunlu seçimleri yapın" : "Make required selections");
      setTimeout(() => setButtonText(t.add), 2500);

      // Scroll to the error group
      const targetY = groupLayouts.current[missingGroupId] || 0;
      // Offset by roughly the spacer height to ensure it's visible
      scrollViewRef.current?.scrollTo({ y: targetY + 200, animated: true });
      return;
    }

    onAdd(quantity, selections);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-black rounded-t-[32px] h-[90%] overflow-hidden">
          {/* Absolute Fixed Hero Image */}
          <View className="absolute top-0 w-full aspect-square bg-zinc-100 z-0">
            <Image
              source={{ uri: item.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {/* Subtle top gradient for close button legibility */}
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'transparent']}
              className="absolute top-0 w-full h-24"
            />
            {/* Animated Dark Overlay */}
            <Animated.View
              style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: overlayOpacity }]}
            />
          </View>

          {/* Fixed Close Button */}
          <Pressable
            onPress={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 items-center justify-center border border-white/20 z-20"
          >
            <X color="white" size={20} strokeWidth={3} />
          </Pressable>

          {/* Scrolling Content */}
          <Animated.ScrollView
            ref={scrollViewRef as any}
            className="flex-1 z-10"
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            contentContainerStyle={{ flexGrow: 1 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false } // Opacity is supported by native driver, but false guarantees tracking reliability
            )}
          >
            {/* Transparent Spacer matches image height */}
            <View className="w-full aspect-square" style={{ marginBottom: -32 }} />

            {/* White Content Card (Fills remaining space without forcing scroll) */}
            <View className="bg-white rounded-t-[32px] px-6 pt-8 pb-8 shadow-sm flex-1">
              <Text className="text-2xl font-black text-zinc-900">{item.name[locale]}</Text>
              <MarkdownText content={item.description[locale]} style={{ marginTop: 8 }} />

              {(item.calories || 0) > 0 && (
                <Text className="text-sm font-bold text-emerald-700 mt-3">
                  🔥 {formatNumber(item.calories || 0, locale)} kcal
                </Text>
              )}

              <View className="mt-6">
                {item.optionGroups?.map((group) => (
                  <View
                    key={group.id}
                    className={`mb-6 p-4 -mx-4 rounded-3xl border-2 ${errorGroupId === group.id ? "border-red-500 bg-red-50" : "border-transparent"}`}
                    onLayout={(e) => {
                      groupLayouts.current[group.id] = e.nativeEvent.layout.y;
                    }}
                  >
                    <View className="flex-row items-center mb-3">
                      <Text className={`font-black text-lg ${errorGroupId === group.id ? "text-red-600" : "text-zinc-900"}`}>{group.label[locale]}</Text>
                      {group.required && (
                        <Text className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${errorGroupId === group.id ? "text-white bg-red-500" : "text-accent bg-accent/10"}`}>
                          {t.required}
                        </Text>
                      )}
                    </View>

                    <View className="gap-2">
                      {group.options.map((option) => {
                        const isSelected = selections[group.id]?.includes(option.id);
                        return (
                          <Pressable
                            key={option.id}
                            onPress={() => toggleSelection(group.id, option.id, group.multiple)}
                            className={`flex-row items-center justify-between p-4 rounded-xl border-2 ${isSelected ? "border-accent bg-accent/5" : "border-zinc-200"
                              }`}
                          >
                            <Text className="font-bold text-zinc-700">{option.label[locale]}</Text>
                            <View className="flex-row items-center gap-2">
                              {option.priceDelta !== 0 && (
                                <Text className="text-sm font-bold text-zinc-500" numberOfLines={1}>
                                  {option.priceDelta > 0 ? "+ " : "- "}{formatMoney(Math.abs(option.priceDelta), locale)}
                                </Text>
                              )}
                              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? "border-accent bg-accent" : "border-zinc-300"
                                }`}>
                                {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.ScrollView>

          {/* Bottom Add to Cart Bar */}
          <View
            className="bg-white border-t border-zinc-100 shadow-2xl z-20"
            style={{ paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16 }}
          >
            <View className="p-4" style={{ paddingBottom: Platform.OS === 'ios' ? 8 : 0 }}>
              <View className="flex-row items-center justify-between mb-3 bg-zinc-50 p-3 rounded-2xl">
                <Text className="text-2xl font-black text-zinc-900">
                  {formatMoney(getActiveItemTotalPrice(), locale)}
                </Text>
                <View className="flex-row items-center gap-4">
                  <Pressable
                    onPress={() => setQuantity((v) => Math.max(1, v - 1))}
                    className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-black/5"
                  >
                    <Minus size={20} color="#09090b" />
                  </Pressable>
                  <Text className="text-xl font-black">{quantity}</Text>
                  <Pressable
                    onPress={() => setQuantity((v) => v + 1)}
                    className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-black/5"
                  >
                    <Plus size={20} color="#09090b" />
                  </Pressable>
                </View>
              </View>
              <Pressable
                onPress={handleAddToCart}
                className={`w-full py-3.5 rounded-xl items-center ${errorGroupId ? "bg-red-500" : "bg-accent"}`}
              >
                <Text adjustsFontSizeToFit numberOfLines={1} className="text-white font-black text-lg">{buttonText}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
