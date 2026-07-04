import React, { useState } from 'react';
import { View, TextInput, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Text } from '@/shared/ui/Text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { formatMoney } from '@/shared/lib/format';
import { Locale, Store, Order } from '@/shared/lib/types';
import { ArrowLeft, MapPin, Rabbit, Turtle } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { dictionaries } from '@/shared/i18n/dictionaries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCartTotals, getCartDeliveryTimeMinutes } from '@/features/order/cart';
import { uid } from '@/shared/lib/format';
import { buildOrderTimeline, DEFAULT_DELIVERY_SPEEDS } from '@/features/catalog/appConfig';
import { coordinateDistanceKm, getOptimizedTrip, offsetCoordinate } from '@/features/tracking/geo';
import { supabase } from '@/shared/api/supabase';
import { AddressModal } from '@/features/catalog/AddressModal';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, setCart, stores, deliveryAddress, config, setOrder, locale } = useCatalog();
  const t = dictionaries[locale];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [speed, setSpeed] = useState<'rabbit' | 'turtle'>('rabbit');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = getCartTotals(stores, cart);

  const handleCheckout = async () => {
    if (isSubmitting) return;

    if (!deliveryAddress) {
      Toast.show({ type: 'error', text1: t.error, text2: t.addressRequired, position: 'bottom' });
      return;
    }

    if (cart.length === 0) return;

    setIsSubmitting(true);

    const now = Date.now();
    const addressCoordinate: [number, number] = [deliveryAddress.latitude, deliveryAddress.longitude];

    const targetTimeSecs = getCartDeliveryTimeMinutes(stores, cart, config?.delivery_times);
    const targetTimeMs = targetTimeSecs * 1000;
    const speeds = config?.delivery_speeds || DEFAULT_DELIVERY_SPEEDS;

    const uniqueStoreIds = Array.from(new Set(cart.map(item => item.storeId)));
    const uniqueStores = uniqueStoreIds.map(id => stores.find(s => s.id === id)).filter((s): s is Store => !!s);

    // En uzaktan en yakına sıralama (Sadece Fallback için)
    uniqueStores.sort((a, b) => coordinateDistanceKm(b.coordinate, addressCoordinate) - coordinateDistanceKm(a.coordinate, addressCoordinate));

    let courierStartCoordinate = uniqueStores.length > 0 ? uniqueStores[0].coordinate : offsetCoordinate(addressCoordinate, 1, 180);

    let actualDistanceKm = 0;
    const waypoints: [number, number][] = [];

    if (uniqueStores.length > 0) {
      const inputWaypoints = [...uniqueStores.map(s => s.coordinate), addressCoordinate];
      const trip = await getOptimizedTrip(inputWaypoints);

      if (trip) {
        waypoints.push(...trip.optimizedWaypoints);
        actualDistanceKm = trip.distanceKm;
        courierStartCoordinate = waypoints[0];
      } else {
        // Fallback
        courierStartCoordinate = uniqueStores[0].coordinate;
        waypoints.push(courierStartCoordinate, addressCoordinate);
        actualDistanceKm = coordinateDistanceKm(courierStartCoordinate, addressCoordinate);
      }
    } else {
      actualDistanceKm = coordinateDistanceKm(courierStartCoordinate, addressCoordinate);
      waypoints.push(courierStartCoordinate);
      waypoints.push(addressCoordinate);
    }

    const actualMovementMs = actualDistanceKm * speeds[speed].kmMultiplierMs;
    const actualTotalTimeMs = 2000 + 8000 + actualMovementMs;

    const { handoffAt, deliveringAt, deliveredAt } = buildOrderTimeline(now, speed, actualDistanceKm, actualTotalTimeMs, speeds);

    const storeCoord = courierStartCoordinate;
    const orderId = uid("order");

    const newOrder: Order = {
      id: orderId,
      customerName: name || "Demo",
      phone: phone || "",
      addressText: `${deliveryAddress.title}: ${deliveryAddress.shortAddress}`,
      note: "",
      addressCoordinate,
      storeCoordinate: storeCoord,
      courierStartCoordinate: courierStartCoordinate,
      routeWaypoints: waypoints,
      speed,
      status: "confirmed",
      placedAt: now,
      handoffAt,
      deliveringAt,
      deliveredAt,
      items: cart,
      created_at: new Date().toISOString(),
      total: totals.total
    };

    setOrder(newOrder);

    // Supabase kaydı
    const saveOrder = async () => {
      const { error } = await supabase.from("orders").insert({
        id: orderId,
        status: "confirmed",
        cart: cart,
        customer: {
          name: newOrder.customerName,
          phone: newOrder.phone,
          address: newOrder.addressText
        },
        total: totals.total,
        delivery_speed: speed,
        restaurant_coordinate: courierStartCoordinate, // Geriye dönük uyumluluk
        destination_coordinate: addressCoordinate,
        courier_start_coordinate: courierStartCoordinate,
        route_waypoints: waypoints,
        platform: "mobile"
      });
      if (error) {
        console.error("Order insert error:", error);
      } else {
        try {
          const stored = await AsyncStorage.getItem("doppapp_orders");
          const ordersArr = stored ? JSON.parse(stored) : [];
          ordersArr.push(orderId);
          await AsyncStorage.setItem("doppapp_orders", JSON.stringify(ordersArr));
        } catch (e) {
          console.error("AsyncStorage error:", e);
        }
      }
    };
    await saveOrder(); // wait for the save order explicitly before navigating

    // Empty cart and navigate to tracking
    setCart([]);
    setIsSubmitting(false);
    router.replace('/tracking');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center p-4 border-b border-black/5 bg-white">
        <Pressable onPress={() => router.back()} className="mr-3 active:opacity-70">
          <ArrowLeft size={24} color="#09090b" />
        </Pressable>
        <Text className="text-xl font-black">{t.checkout}</Text>
      </View>

      <ScrollView
        className="flex-1 p-4"
        keyboardShouldPersistTaps="handled"
      >
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
          <Text className="font-bold mb-4">{t.deliveryDetails}</Text>

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
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <MapPin size={16} color="#09090b" />
                <Text className="font-black ml-2">{t.deliveryAddress}</Text>
              </View>
              <Pressable onPress={() => setAddressModalOpen(true)}>
                <Text className="text-accent font-bold text-xs">{t.changeAddress}</Text>
              </Pressable>
            </View>
            <Text className="mt-1 text-zinc-600 font-bold">
              {deliveryAddress ? `${deliveryAddress.title} · ${deliveryAddress.shortAddress}` : t.addressRequired}
            </Text>
          </View>

          <Text className="font-bold mb-3">{t.deliverySpeed}</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSpeed("rabbit")}
              className={`flex-1 items-center justify-center p-3 rounded-xl border-2 active:opacity-70 ${speed === "rabbit" ? "border-orange-500 bg-orange-50" : "border-black/10 bg-white"
                }`}
            >
              <Rabbit size={24} color={speed === "rabbit" ? "#f97316" : "#71717a"} />
              <Text className={`mt-2 font-bold ${speed === "rabbit" ? "text-orange-700" : "text-zinc-500"}`}>
                {t.rabbit}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSpeed("turtle")}
              className={`flex-1 items-center justify-center p-3 rounded-xl border-2 active:opacity-70 ${speed === "turtle" ? "border-emerald-500 bg-emerald-50" : "border-black/10 bg-white"
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

      <View
        className="p-4 bg-white border-t border-black/5"
      >
        <Pressable
          onPress={handleCheckout}
          disabled={isSubmitting}
          className={`w-full py-4 rounded-xl items-center flex-row justify-center active:opacity-80 ${isSubmitting ? "bg-zinc-400" : "bg-accent"}`}
        >
          {isSubmitting && <ActivityIndicator color="#ffffff" className="mr-2" />}
          <Text numberOfLines={1} className="text-white font-black text-lg flex-shrink-1">
            {isSubmitting ? t.submitting : t.demoOrder}
          </Text>
        </Pressable>
      </View>

      <AddressModal
        visible={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        locale={locale}
      />
    </SafeAreaView>
  );
}
