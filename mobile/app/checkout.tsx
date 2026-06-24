import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { formatMoney } from '@/shared/lib/format';
import { Locale } from '@/shared/lib/types';
import { ArrowLeft, MapPin, Rabbit, Turtle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { getCartTotals, getCartDeliveryTimeMinutes } from '@/features/order/cart';
import { uid } from '@/shared/lib/format';
import { buildOrderTimeline, DEFAULT_DELIVERY_SPEEDS } from '@/features/catalog/appConfig';
import { offsetCoordinate } from '@/features/tracking/geo';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, setCart, stores, deliveryAddress, config, setOrder, locale } = useCatalog();
  const t = dictionaries[locale];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [speed, setSpeed] = useState<'rabbit' | 'turtle'>('rabbit');

  const totals = getCartTotals(stores, cart);

  const handleCheckout = () => {
    if (!deliveryAddress) {
      Alert.alert(locale === 'tr' ? "Hata" : "Error", t.addressRequired);
      return;
    }
    
    if (cart.length === 0) return;

    const now = Date.now();
    const addressCoordinate: [number, number] = [deliveryAddress.latitude, deliveryAddress.longitude];

    const targetTimeMins = getCartDeliveryTimeMinutes(stores, cart, config?.delivery_times);
    const targetTimeMs = targetTimeMins * 60 * 1000;
    const speeds = config?.delivery_speeds || DEFAULT_DELIVERY_SPEEDS;
    
    const targetMovementMs = Math.max(0, targetTimeMs - 2000 - 8000);
    const distanceKm = targetMovementMs / speeds["rabbit"].kmMultiplierMs;

    const actualMovementMs = distanceKm * speeds[speed].kmMultiplierMs;
    const actualTotalTimeMs = 2000 + 8000 + actualMovementMs;

    const courierStartCoordinate = offsetCoordinate(addressCoordinate, distanceKm, 45);

    const { handoffAt, deliveringAt, deliveredAt } = buildOrderTimeline(now, speed, distanceKm, actualTotalTimeMs, speeds);

    setOrder({
      id: uid("order"),
      customerName: name || "Demo",
      phone: phone || "",
      addressText: `${deliveryAddress.title}: ${deliveryAddress.address}`,
      note: "",
      addressCoordinate,
      storeCoordinate: courierStartCoordinate,
      courierStartCoordinate: courierStartCoordinate,
      speed,
      status: "confirmed",
      placedAt: now,
      handoffAt,
      deliveringAt,
      deliveredAt,
      items: cart
    });
    
    // Empty cart and navigate to tracking
    setCart([]);
    router.replace('/tracking');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center p-4 border-b border-black/5 bg-white">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#09090b" />
        </Pressable>
        <Text className="text-xl font-black">{t.checkout}</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-4 rounded-xl shadow-sm border border-black/5 mb-4">
          <Text className="font-bold mb-4">{t.orderSummary}</Text>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-zinc-500">{t.subtotal}</Text>
            <Text className="font-bold">{formatMoney(totals.subtotal, locale)}</Text>
          </View>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-zinc-500">{t.deliveryFee}</Text>
            <Text className="font-bold text-emerald-600">{totals.deliveryFee === 0 ? t.free : formatMoney(totals.deliveryFee, locale)}</Text>
          </View>
          <View className="border-t border-black/5 pt-4 flex-row items-center justify-between">
            <Text className="font-black text-lg">{t.total}</Text>
            <Text className="font-black text-2xl text-accent">{formatMoney(totals.total, locale)}</Text>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm border border-black/5 mb-4">
          <Text className="font-bold mb-4">{locale === 'tr' ? 'Teslimat Bilgileri' : 'Delivery Details'}</Text>
          
          <TextInput
            className="w-full rounded-lg border border-black/10 p-3 mb-3 bg-zinc-50 font-bold"
            placeholder={t.customerName}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#a1a1aa"
          />
          <TextInput
            className="w-full rounded-lg border border-black/10 p-3 mb-4 bg-zinc-50 font-bold"
            placeholder={t.phone}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#a1a1aa"
          />

          <View className="rounded-lg border border-black/10 p-3 mb-4">
            <View className="flex-row items-center mb-1">
              <MapPin size={16} color="#09090b" />
              <Text className="font-black ml-2">{t.deliveryAddress}</Text>
            </View>
            <Text className="mt-1 text-zinc-600 font-bold">
              {deliveryAddress ? `${deliveryAddress.title} · ${deliveryAddress.address}` : t.addressRequired}
            </Text>
          </View>

          <Text className="font-bold mb-3">{t.deliverySpeed}</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSpeed("rabbit")}
              className={`flex-1 items-center justify-center p-3 rounded-xl border-2 ${
                speed === "rabbit" ? "border-orange-500 bg-orange-50" : "border-black/10 bg-white"
              }`}
            >
              <Rabbit size={24} color={speed === "rabbit" ? "#f97316" : "#71717a"} />
              <Text className={`mt-2 font-bold ${speed === "rabbit" ? "text-orange-700" : "text-zinc-500"}`}>
                {t.rabbit}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSpeed("turtle")}
              className={`flex-1 items-center justify-center p-3 rounded-xl border-2 ${
                speed === "turtle" ? "border-emerald-500 bg-emerald-50" : "border-black/10 bg-white"
              }`}
            >
              <Turtle size={24} color={speed === "turtle" ? "#10b981" : "#71717a"} />
              <Text className={`mt-2 font-bold ${speed === "turtle" ? "text-emerald-700" : "text-zinc-500"}`}>
                {t.turtle}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-black/5">
        <Pressable
          onPress={handleCheckout}
          className="w-full bg-accent py-4 rounded-xl items-center"
        >
          <Text className="text-white font-black text-lg">{t.demoOrder}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
