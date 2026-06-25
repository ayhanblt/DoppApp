import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CelebrationModal } from '@/features/tracking/CelebrationModal';
import { ReceiptShareModal } from '@/features/tracking/ReceiptShareModal';

export default function TrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRoute(order.storeCoordinate, order.addressCoordinate).then((route) => {
      if (!cancelled) setDisplayRoute(route);
    });
    return () => { cancelled = true; };
  }, [order.storeCoordinate, order.addressCoordinate]);

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
      : order.storeCoordinate
    : undefined;

  const timeLeftMs = Math.max(0, order.deliveredAt - now);
  const minsLeft = Math.floor(timeLeftMs / 60000);
  const secsLeft = Math.floor((timeLeftMs % 60000) / 1000);
  const timeLeftFormatted = `${minsLeft}:${secsLeft.toString().padStart(2, '0')}`;

  const mapRegion = useMemo(() => {
    return {
      sw: [
        Math.min(order.storeCoordinate[0], order.addressCoordinate[0]) - 0.005,
        Math.min(order.storeCoordinate[1], order.addressCoordinate[1]) - 0.005
      ],
      ne: [
        Math.max(order.storeCoordinate[0], order.addressCoordinate[0]) + 0.005,
        Math.max(order.storeCoordinate[1], order.addressCoordinate[1]) + 0.005
      ]
    };
  }, [order.storeCoordinate, order.addressCoordinate]);

  useEffect(() => {
    if (mapReady && displayRoute && order) {
      webViewRef.current?.injectJavaScript(`
        if (window.initMap) {
          window.initMap(
            ${order.storeCoordinate[0]}, ${order.storeCoordinate[1]},
            ${order.addressCoordinate[0]}, ${order.addressCoordinate[1]},
            ${JSON.stringify(displayRoute)},
            ${JSON.stringify(mapRegion.sw)},
            ${JSON.stringify(mapRegion.ne)}
          );
        }
        true;
      `);
    }
  }, [mapReady, displayRoute, order, mapRegion]);

  useEffect(() => {
    if (mapReady && courier) {
      webViewRef.current?.injectJavaScript(`
        if (window.updateCourier) {
          window.updateCourier(${courier[0]}, ${courier[1]});
        }
        true;
      `);
    }
  }, [mapReady, courier]);

  const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; }
    html, body, #map { height: 100%; width: 100%; }
    .leaflet-control-attribution { display: none; }
    .courier-marker {
      background: white;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    window.map = L.map('map', { zoomControl: false, attributionControl: false }).setView([0,0], 2);
    L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(window.map);
    
    var courierIcon = L.divIcon({
      className: 'bg-transparent',
      html: \`<div style="display:flex; align-items:center; justify-content:center; width:56px; height:56px; filter:drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));">
               <div style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:9999px; border-bottom-right-radius:0; transform:rotate(45deg); background-color:#fb4824; border:1px solid white; color:white;">
                 <div style="transform:rotate(-45deg); display:flex; align-items:center; justify-content:center;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7-4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                 </div>
               </div>
             </div>\`,
      iconSize: [56, 56],
      iconAnchor: [28, 48]
    });
    
    var blueIcon = L.divIcon({
      className: 'bg-transparent',
      html: \`<div style="display:flex; align-items:center; justify-content:center; width:48px; height:48px; filter:drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));">
               <div style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9999px; border-bottom-right-radius:0; transform:rotate(45deg); background-color:#27272a; border:1px solid white; color:white;">
                 <div style="transform:rotate(-45deg); display:flex; align-items:center; justify-content:center;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                 </div>
               </div>
             </div>\`,
      iconSize: [48, 48],
      iconAnchor: [24, 40]
    });
    
    var greenIcon = L.divIcon({
      className: 'bg-transparent',
      html: \`<div style="display:flex; align-items:center; justify-content:center; width:48px; height:48px; filter:drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));">
               <div style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9999px; border-bottom-right-radius:0; transform:rotate(45deg); background-color:#10b981; border:1px solid white; color:white;">
                 <div style="transform:rotate(-45deg); display:flex; align-items:center; justify-content:center;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                 </div>
               </div>
             </div>\`,
      iconSize: [48, 48],
      iconAnchor: [24, 40]
    });

    window.initMap = function(storeLat, storeLng, addressLat, addressLng, routeCoords, sw, ne) {
      if (window.storeMarker) window.map.removeLayer(window.storeMarker);
      if (window.addressMarker) window.map.removeLayer(window.addressMarker);
      if (window.routePolyline) window.map.removeLayer(window.routePolyline);
      
      window.map.fitBounds([sw, ne], { padding: [20, 20] });
      
      window.storeMarker = L.marker([storeLat, storeLng], {icon: blueIcon}).addTo(window.map);
      window.addressMarker = L.marker([addressLat, addressLng], {icon: greenIcon}).addTo(window.map);
      
      if (routeCoords && routeCoords.length > 0) {
        window.routePolyline = L.polyline(routeCoords, { color: '#f97316', weight: 4 }).addTo(window.map);
      }
    };
    
    window.updateCourier = function(lat, lng) {
      if (!window.courierMarker) {
        window.courierMarker = L.marker([lat, lng], { icon: courierIcon }).addTo(window.map);
      } else {
        window.courierMarker.setLatLng([lat, lng]);
      }
    };
    
    setTimeout(function() {
      window.ReactNativeWebView.postMessage('ready');
    }, 100);
  </script>
</body>
</html>
  `;

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
        <WebView
          ref={webViewRef}
          style={{ width: '100%', height: '50%' }}
          source={{ html: LEAFLET_HTML }}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'ready') {
              setMapReady(true);
            }
          }}
          scrollEnabled={false}
          bounces={false}
        />

        <View className="flex-1 bg-white p-4 pb-20">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-bold text-orange-600">{t.orderConfirmed}</Text>
              <Text className="text-2xl font-black">{t.liveTracking}</Text>
              <Text className="text-sm text-zinc-500" numberOfLines={1}>{order.addressText}</Text>
            </View>

            <View className="items-end shrink-0">
              {(status === "preparing" || status === "handoff" || status === "delivering") && (
                <View className="bg-zinc-100 px-3 py-2 rounded-xl mb-2 items-center w-36">
                  <Text className="text-zinc-500 font-bold text-[10px]">{t.remainingTime.toLocaleUpperCase(locale)}</Text>
                  <Text className="text-zinc-900 font-black text-sm">{timeLeftFormatted}</Text>
                </View>
              )}
              {(status === "preparing" || status === "handoff" || status === "delivering") && !fastForward && (
                <Pressable
                  onPress={() => setFastForward(true)}
                  className="bg-emerald-600 px-3 py-2 rounded-xl items-center justify-center flex-row shadow-sm w-36 gap-1"
                >
                  <Rocket size={14} color="white" />
                  <Text className="text-white font-black text-xs">{t.fastForwardBtn.toLocaleUpperCase(locale)}</Text>
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
        <View 
          className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-zinc-100 items-center"
          style={{ paddingBottom: Math.max(16, insets.bottom) }}
        >
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
