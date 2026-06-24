import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Dimensions, Share, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { Locale } from '@/shared/lib/types';
import { ArrowLeft, Rocket, Share2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { getCartTotals, findProduct } from '@/features/order/cart';
import { getRoute, interpolateAlongRoute } from '@/features/tracking/geo';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { CelebrationModal } from '@/features/tracking/CelebrationModal';
import { ReceiptShareModal } from '@/features/tracking/ReceiptShareModal';

export default function TrackingScreen() {
  const router = useRouter();
  const { order, setOrder, stores, locale } = useCatalog();
  const t = dictionaries[locale];

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <Text className="text-zinc-500 font-medium">{t.noActiveOrder}</Text>
        <Pressable onPress={() => router.replace('/')} className="mt-4 px-6 py-3 bg-accent rounded-xl">
          <Text className="text-white font-bold">{t.backToApp}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totals = useMemo(() => getCartTotals(stores, order.items), [stores, order.items]);

  const [now, setNow] = useState(Date.now());
  const [displayRoute, setDisplayRoute] = useState<[number, number][] | null>(null);
  const [fastForward, setFastForward] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    getRoute(order.courierStartCoordinate, order.addressCoordinate).then((route) => {
      if (!cancelled) setDisplayRoute(route);
    });
    return () => { cancelled = true; };
  }, [order.courierStartCoordinate, order.addressCoordinate]);

  useEffect(() => {
    let offset = 0;
    const duration = order.deliveredAt - order.placedAt;
    const timer = setInterval(() => {
      if (fastForward) {
        offset += duration * 0.05;
      }
      setNow(Date.now() + offset);
    }, 100);
    return () => clearInterval(timer);
  }, [fastForward, order.deliveredAt, order.placedAt]);

  const status = now < order.placedAt + 2000 
    ? "confirmed"
    : now < order.handoffAt
      ? "preparing"
      : now < order.deliveringAt
        ? "handoff"
        : now < order.deliveredAt
          ? "delivering"
          : "delivered";

  useEffect(() => {
    if (status === "delivered" && !celebrationShown) {
      const timer = setTimeout(() => {
        setCelebrationOpen(true);
        setCelebrationShown(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, celebrationShown]);

  const handleShareClick = async () => {
    const items = order.items.map(item => {
      const store = stores.find(s => s.id === item.storeId);
      const product = store?.menu.find(p => p.id === item.itemId);
      return {
        name: product ? product.name[locale] : t.itemFallback,
        qty: item.quantity,
        image: product?.image
      };
    });

    const data = JSON.stringify({
      locale,
      total: formatMoney(totals.total, locale),
      items
    });

    const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "https://doppapp.com";
    setReceiptUrl(`${webUrl}/api/receipt?data=${encodeURIComponent(data)}`);
    setReceiptModalOpen(true);
  };

  const courierStartTime = order.handoffAt;
  const rawProgress = (now - courierStartTime) / (order.deliveredAt - courierStartTime);
  const progress = Math.min(1, Math.max(0, rawProgress));

  const isCourierMoving = status === "handoff" || status === "delivering" || status === "delivered";

  const courier = isCourierMoving
    ? displayRoute && displayRoute.length > 1
      ? interpolateAlongRoute(displayRoute, status === "delivered" ? 1 : progress)
      : order.courierStartCoordinate
    : undefined;

  const timeLeftMs = Math.max(0, order.deliveredAt - now);
  const minsLeft = Math.floor(timeLeftMs / 60000);
  const secsLeft = Math.floor((timeLeftMs % 60000) / 1000);
  const timeLeftFormatted = `${minsLeft}:${secsLeft.toString().padStart(2, '0')}`;

  const mapRegion = useMemo(() => {
    return {
      latitude: (order.storeCoordinate[0] + order.addressCoordinate[0]) / 2,
      longitude: (order.storeCoordinate[1] + order.addressCoordinate[1]) / 2,
      latitudeDelta: Math.abs(order.storeCoordinate[0] - order.addressCoordinate[0]) * 2 + 0.01,
      longitudeDelta: Math.abs(order.storeCoordinate[1] - order.addressCoordinate[1]) * 2 + 0.01,
    };
  }, [order.storeCoordinate, order.addressCoordinate]);

  return (
    <SafeAreaView className="flex-1 bg-background relative">
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-black/5">
        <Pressable 
          onPress={() => {
            setOrder(null);
            router.replace('/');
          }} 
          className="flex-row items-center"
        >
          <ArrowLeft size={20} color="#09090b" className="mr-2" />
          <Text className="font-bold">{t.backToApp}</Text>
        </Pressable>
      </View>

      <View className="flex-1">
        <MapView
          style={{ width: '100%', height: '50%' }}
          initialRegion={mapRegion}
        >
          {displayRoute && (
            <Polyline
              coordinates={displayRoute.map(coord => ({ latitude: coord[0], longitude: coord[1] }))}
              strokeColor="#f97316" // orange-500
              strokeWidth={4}
            />
          )}
          
          <Marker
            coordinate={{ latitude: order.storeCoordinate[0], longitude: order.storeCoordinate[1] }}
            title={locale === 'tr' ? "Restoran" : "Restaurant"}
            pinColor="blue"
          />

          <Marker
            coordinate={{ latitude: order.addressCoordinate[0], longitude: order.addressCoordinate[1] }}
            title={t.deliveryAddress}
            pinColor="green"
          />

          {courier && (
            <Marker
              coordinate={{ latitude: courier[0], longitude: courier[1] }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View className="bg-white p-2 rounded-full shadow-lg border border-black/10">
                <Text className="text-xl">🛵</Text>
              </View>
            </Marker>
          )}
        </MapView>

        <View className="flex-1 bg-white p-4 pb-20">
          <View className="flex-row items-start justify-between mb-4">
            <View>
              <Text className="text-sm font-bold text-orange-600">{t.orderConfirmed}</Text>
              <Text className="text-2xl font-black">{t.liveTracking}</Text>
              <Text className="text-sm text-zinc-500">{order.addressText}</Text>
            </View>

            <View className="items-end">
              {(status === "preparing" || status === "handoff" || status === "delivering") && (
                <View className="bg-zinc-100 px-3 py-2 rounded-xl mb-2 items-center">
                  <Text className="text-zinc-500 font-bold text-[10px] uppercase">{t.remainingTime}</Text>
                  <Text className="text-zinc-900 font-black text-sm">{timeLeftFormatted}</Text>
                </View>
              )}
              {(status === "preparing" || status === "handoff" || status === "delivering") && !fastForward && (
                <Pressable
                  onPress={() => setFastForward(true)}
                  className="bg-emerald-600 px-3 py-2 rounded-xl items-center flex-row shadow-sm"
                >
                  <Rocket size={14} color="white" className="mr-1" />
                  <Text className="text-white font-black text-xs uppercase">{t.fastForwardBtn}</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {(["confirmed", "preparing", "handoff", "delivering", "delivered"] as const).map((step) => (
              <View
                key={step}
                className={`rounded-lg border px-2 py-1 ${
                  step === status 
                    ? "border-orange-500 bg-orange-50" 
                    : "border-black/10"
                }`}
              >
                <Text className={`text-xs font-bold ${
                  step === status ? "text-orange-700" : "text-zinc-500"
                }`}>
                  {t.status[step]}
                </Text>
              </View>
            ))}
          </View>

          <View className="bg-zinc-50 p-3 rounded-xl">
            {order.items.map((cartItem) => {
              const item = findProduct(stores, cartItem);
              return item ? (
                <Text key={cartItem.id} className="text-sm font-medium mb-1">
                  {item.name[locale]} × {cartItem.quantity}
                </Text>
              ) : null;
            })}
          </View>

        </View>
      </View>

      {status === "delivered" && celebrationShown && !celebrationOpen && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-zinc-100 items-center pb-8">
          <Pressable
            onPress={handleShareClick}
            className="w-full max-w-sm flex-row items-center justify-center bg-accent py-4 rounded-xl shadow-sm"
          >
            <Text className="text-white font-black mr-2">{t.shareReceipt}</Text>
            <Share2 size={18} color="white" />
          </Pressable>
        </View>
      )}

      <CelebrationModal 
        locale={locale} 
        calories={totals.calories} 
        totalPrice={totals.total} 
        cart={order.items} 
        visible={celebrationOpen} 
        onClose={() => setCelebrationOpen(false)} 
        onShareRequest={() => {
          setCelebrationOpen(false);
          handleShareClick();
        }}
      />

      <ReceiptShareModal 
        locale={locale} 
        imageUrl={receiptUrl} 
        visible={receiptModalOpen} 
        onClose={() => setReceiptModalOpen(false)} 
      />
    </SafeAreaView>
  );
}
