import React, { useState } from "react";
import { View, Text, Image, Modal, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { CartSelection, Locale, Product, Store } from "@/shared/lib/types";
import { formatMoney, formatNumber, uid } from "@/shared/lib/format";
import { Plus, Minus, X } from "lucide-react-native";

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
  
  const [selections, setSelections] = useState<CartSelection>(() => {
    const initial: CartSelection = {};
    item.optionGroups?.forEach((group) => {
      initial[group.id] = group.required ? [group.options[0].id] : [];
    });
    return initial;
  });
  
  const [quantity, setQuantity] = useState(1);

  const toggleSelection = (groupId: string, optionId: string, multiple?: boolean) => {
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
    let base = item.price;
    item.optionGroups?.forEach((g) => {
      const selectedIds = selections[g.id] || [];
      selectedIds.forEach((id) => {
        const opt = g.options.find((o) => o.id === id);
        if (opt) base += opt.priceDelta;
      });
    });
    return base * quantity;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <SafeAreaView className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl h-[85%] overflow-hidden">
            <View className="relative">
              <Image source={{ uri: item.image }} className="w-full h-64 object-cover" />
              <Pressable
                onPress={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
              >
                <X color="white" size={24} />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-5">
              <Text className="text-2xl font-black text-zinc-900">{item.name[locale]}</Text>
              <Text className="text-sm text-zinc-500 mt-2 leading-5">
                {item.description[locale]}
              </Text>
              
              {(item.calories || 0) > 0 && (
                <Text className="text-sm font-bold text-emerald-700 mt-3">
                  🔥 {formatNumber(item.calories || 0, locale)} kcal
                </Text>
              )}

              <View className="mt-6">
                {item.optionGroups?.map((group) => (
                  <View key={group.id} className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Text className="font-black text-lg text-zinc-900">{group.label[locale]}</Text>
                      {group.required && (
                        <Text className="ml-2 text-xs font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-full">
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
                            className={`flex-row items-center justify-between p-4 rounded-xl border-2 ${
                              isSelected ? "border-accent bg-accent/5" : "border-zinc-200"
                            }`}
                          >
                            <Text className="font-bold text-zinc-700">{option.label[locale]}</Text>
                            <View className="flex-row items-center gap-2">
                              {option.priceDelta !== 0 && (
                                <Text className="text-sm font-bold text-zinc-500" numberOfLines={1}>
                                  {option.priceDelta > 0 ? "+ " : "- "}{formatMoney(Math.abs(option.priceDelta), locale)}
                                </Text>
                              )}
                              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                                isSelected ? "border-accent bg-accent" : "border-zinc-300"
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
            </ScrollView>

            <View className="p-5 bg-white border-t border-zinc-100 shadow-2xl">
              <View className="flex-row items-center justify-between mb-4 bg-zinc-50 p-4 rounded-2xl">
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
                onPress={() => onAdd(quantity, selections)}
                className="w-full bg-accent py-4 rounded-xl items-center"
              >
                <Text className="text-white font-black text-lg">{t.add}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
