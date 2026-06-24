import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { X, Share2 } from 'lucide-react-native';
import { Locale, CartItem } from '@/shared/lib/types';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { formatMoney, formatNumber } from '@/shared/lib/format';

interface CelebrationModalProps {
  locale: Locale;
  calories: number;
  totalPrice: number;
  cart: CartItem[];
  visible: boolean;
  onClose: () => void;
  onShareRequest: () => void;
}

export function CelebrationModal({ locale, calories, totalPrice, cart, visible, onClose, onShareRequest }: CelebrationModalProps) {
  const t = dictionaries[locale];
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      scale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} onPress={onClose}  />
        
        <Animated.View style={[animatedStyle]} className="bg-white rounded-3xl p-6 w-full max-w-sm items-center shadow-2xl">
          <Pressable onPress={onClose} className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-full z-10">
            <X size={20} color="#52525b" />
          </Pressable>

          {visible && (
            <ConfettiCannon
              count={200}
              origin={{x: -10, y: 0}}
              autoStart={true}
              fadeOut={true}
            />
          )}

          <Text style={{ fontSize: 64 }} className="mt-4 mb-2">🎉</Text>
          <Text className="text-3xl font-black text-accent mb-2 text-center">{t.celebration}</Text>
          <Text className="text-zinc-600 mb-6 text-center">{t.orderDelivered}</Text>

          <View className="w-full bg-zinc-50 rounded-xl p-4 mb-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-zinc-600">{t.amount}</Text>
              <Text className="font-bold">{formatMoney(totalPrice, locale)}</Text>
            </View>
            {calories > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-zinc-600">{t.calories}</Text>
                <Text className="font-bold">{formatNumber(calories, locale)} kcal</Text>
              </View>
            )}
          </View>

          <Text className="text-center text-sm italic text-zinc-500 mb-6">
            {t.savingsSummary(
              formatMoney(totalPrice, locale),
              calories > 0 ? formatNumber(calories, locale) : ""
            )}
          </Text>

          <Pressable
            onPress={onShareRequest}
            className="w-full flex-row items-center justify-center bg-accent py-4 rounded-xl shadow-sm mb-3"
          >
            <Text className="text-white font-black mr-2">Siparişini Paylaş</Text>
            <Share2 size={18} color="white" />
          </Pressable>

          <Pressable
            onPress={onClose}
            className="w-full py-4 bg-zinc-100 rounded-xl items-center"
          >
            <Text className="text-zinc-700 font-bold">{t.close}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
