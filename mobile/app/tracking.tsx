import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, Dimensions, Share, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { formatMoney, formatNumber } from '@/shared/lib/format';
import { Locale, Order } from '@/shared/lib/types';
import { ArrowLeft, Rocket, Share2, Link2, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { getCartTotals, findProduct } from '@/features/order/cart';
import { getRoute, interpolateAlongRoute, coordinateDistanceKm } from '@/features/tracking/geo';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CelebrationModal } from '@/features/tracking/CelebrationModal';
import { ReceiptShareModal } from '@/features/tracking/ReceiptShareModal';
import { supabase } from '@/shared/api/supabase';

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

  return <TrackingScreenInner order={order} />;
}

function TrackingScreenInner({ order }: { order: Order }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOrder, stores, locale } = useCatalog();
  const t = dictionaries[locale];

  const totals = useMemo(() => getCartTotals(stores, order.items), [stores, order.items]);

  const [now, setNow] = useState(Date.now());
  const [displayRoute, setDisplayRoute] = useState<[number, number][] | null>(null);
  const [fastForward, setFastForward] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [shortId, setShortId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const waypoints = order.routeWaypoints || [order.storeCoordinate, order.addressCoordinate];
    getRoute(waypoints).then((route) => {
      if (!cancelled) setDisplayRoute(route);
    });
    return () => { cancelled = true; };
  }, [order.routeWaypoints, order.storeCoordinate, order.addressCoordinate]);

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

  useEffect(() => {
    if (status === "delivered" && !shortId) {
      const items = order.items.map(item => {
        const store = stores.find(s => s.id === item.storeId);
        const product = store?.menu.find(p => p.id === item.itemId);
        return {
          name: product ? product.name[locale] : t.itemFallback,
          qty: item.quantity,
          image: product?.image
        };
      });

      const dataObj = {
        locale,
        total: formatMoney(totals.total, locale),
        items
      };

      supabase.from('shared_receipts')
        .insert({ data: dataObj })
        .select('id')
        .single()
        .then(({ data, error }) => {
          if (data?.id) {
            setShortId(data.id);
          } else if (error) {
            console.error("Supabase insert error pre-generating shortId:", error);
          }
        });
    }
  }, [status, order, stores, locale, totals, shortId]);

  const handleCopyDirectLink = async () => {
    const webUrl = process.env.EXPO_PUBLIC_WEB_URL || "https://doppapp.com";

    if (shortId) {
      await Clipboard.setStringAsync(`${webUrl}/share?id=${shortId}`);
    } else {
      const items = order.items.map(item => {
        const store = stores.find(s => s.id === item.storeId);
        const product = store?.menu.find(p => p.id === item.itemId);
        return {
          name: product ? product.name[locale] : t.itemFallback,
          qty: item.quantity,
          image: product?.image
        };
      });
      const dataString = encodeURIComponent(JSON.stringify({
        locale,
        total: formatMoney(totals.total, locale),
        items
      }));
      await Clipboard.setStringAsync(`${webUrl}/share?data=${dataString}`);
    }

    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  const uniqueStores = useMemo(() => {
    return Array.from(new Set(order.items.map(item => item.storeId)))
      .map(id => stores.find(s => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .sort((a, b) => {
        if (!order.routeWaypoints) return 0;
        const idxA = order.routeWaypoints.findIndex(wp => wp[0] === a.coordinate[0] && wp[1] === a.coordinate[1]);
        const idxB = order.routeWaypoints.findIndex(wp => wp[0] === b.coordinate[0] && wp[1] === b.coordinate[1]);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });
  }, [order.items, stores, order.routeWaypoints]);

  const storeDistances = useMemo(() => {
    let cumulative = 0;
    const waypoints = order.routeWaypoints || [order.storeCoordinate, order.addressCoordinate];
    const distances: number[] = [0];

    // Calculate cumulative distance to each store in the route
    for (let i = 0; i < waypoints.length - 2; i++) {
      cumulative += coordinateDistanceKm(waypoints[i], waypoints[i + 1]);
      distances.push(cumulative);
    }

    let totalDist = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDist += coordinateDistanceKm(waypoints[i], waypoints[i + 1]);
    }
    totalDist = totalDist || 1;

    return uniqueStores.map((_, i) => distances[i] / totalDist);
  }, [uniqueStores, order.routeWaypoints, order.storeCoordinate, order.addressCoordinate]);

  const getStoreTooltipText = (storeId: string) => {
    const itemsInStore = order.items.filter(i => i.storeId === storeId);
    return itemsInStore.map(item => {
      const p = stores.find(s => s.id === storeId)?.menu.find(p => p.id === item.itemId);
      return p ? `${p.name[locale]} x${item.quantity}` : "";
    }).filter(Boolean).join(", ");
  };

  useEffect(() => {
    if (mapReady && displayRoute && order) {
      const storesData = uniqueStores.map((s, idx) => ({
        coordinate: s.coordinate,
        type: s.type,
        visited: status === "delivered" || ((status === "handoff" || status === "delivering") && progress >= storeDistances[idx]),
        name: s.name[locale],
        tooltipText: getStoreTooltipText(s.id),
      }));

      webViewRef.current?.injectJavaScript(`
        if (window.initMap) {
          window.initMap(
            ${JSON.stringify(storesData)},
            ${JSON.stringify(order.addressCoordinate)},
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
    if (mapReady) {
      uniqueStores.forEach((_, idx) => {
        const visited = status === "delivered" || ((status === "handoff" || status === "delivering") && progress >= storeDistances[idx]);
        webViewRef.current?.injectJavaScript(`
          if (window.updateStoreStatus) {
            window.updateStoreStatus(${idx}, ${visited});
          }
          true;
        `);
      });
    }
  }, [mapReady, status, progress, storeDistances]);

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
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package-icon lucide-package"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/></svg>                 </div>
               </div>
             </div>\`,
      iconSize: [56, 56],
      iconAnchor: [28, 56]
    });
    
    function getStoreIcon(type, visited) {
      var color = visited ? '#27272a' : (type === 'shop' ? '#7c3aed' : (type === 'food' ? '#f97316' : '#10b981'));
      var innerSvg = visited 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
      return L.divIcon({
        className: 'bg-transparent',
        html: \`<div style="display:flex; align-items:center; justify-content:center; width:48px; height:48px; filter:drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));">
                 <div style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9999px; border-bottom-right-radius:0; transform:rotate(45deg); background-color:\${color}; border:1px solid white; color:white;">
                   <div style="transform:rotate(-45deg); display:flex; align-items:center; justify-content:center;">
                     \${innerSvg}
                   </div>
                 </div>
               </div>\`,
        iconSize: [48, 48],
        iconAnchor: [24, 48]
      });
    }
    
    var homeIcon = L.divIcon({
      className: 'bg-transparent',
      html: \`<div style="display:flex; align-items:center; justify-content:center; width:48px; height:48px; filter:drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06));">
               <div style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9999px; border-bottom-right-radius:0; transform:rotate(45deg); background-color:#3b82f6; border:1px solid white; color:white;">
                 <div style="transform:rotate(-45deg); display:flex; align-items:center; justify-content:center;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                 </div>
               </div>
             </div>\`,
      iconSize: [48, 48],
      iconAnchor: [24, 48]
    });

    window.initMap = function(storesData, addressCoord, routeCoords, sw, ne) {
      if (window.storeMarkers) {
        window.storeMarkers.forEach(m => window.map.removeLayer(m));
      }
      window.storeMarkers = [];
      if (window.addressMarker) window.map.removeLayer(window.addressMarker);
      if (window.routePolyline) window.map.removeLayer(window.routePolyline);
      
      window.map.fitBounds([sw, ne], { padding: [20, 20] });
      
      storesData.forEach(s => {
        const marker = L.marker([s.coordinate[0], s.coordinate[1]], {icon: getStoreIcon(s.type, s.visited)}).addTo(window.map);
        marker.storeData = s;
        if (s.name || s.tooltipText) {
          marker.bindPopup(\`
            <div style="padding:4px; max-width:200px; font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
              <strong style="display:block; font-size:14px; margin-bottom:2px;">\${s.name}</strong>
              <span style="font-size:12px; color:#71717a; line-height:1.2;">\${s.tooltipText}</span>
            </div>
          \`);
        }
        window.storeMarkers.push(marker);
      });
      window.addressMarker = L.marker([addressCoord[0], addressCoord[1]], {icon: homeIcon}).addTo(window.map);
      
      if (routeCoords && routeCoords.length > 0) {
        window.routePolyline = L.polyline(routeCoords, { color: '#f97316', weight: 4 }).addTo(window.map);
      }
    };
    
    window.updateStoreStatus = function(idx, visited) {
      if (window.storeMarkers && window.storeMarkers[idx]) {
        var marker = window.storeMarkers[idx];
        var sData = marker.storeData;
        marker.setIcon(getStoreIcon(sData.type, visited));
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
                className={`rounded-lg border px-2 py-1 ${step === status
                  ? "border-orange-500 bg-orange-50"
                  : "border-black/10"
                  }`}
              >
                <Text className={`text-xs font-bold ${step === status ? "text-orange-700" : "text-zinc-500"
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
          className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-white/90 border-t border-zinc-100 flex-row justify-center items-center gap-2"
          style={{ paddingBottom: Math.max(32, insets.bottom + 16) }}
        >
          <Pressable
            onPress={handleShareClick}
            className="flex-1 max-w-sm flex-row items-center justify-center bg-accent py-4 rounded-xl shadow-sm"
          >
            <Text className="text-white font-black mr-2">{t.shareReceipt}</Text>
            <Share2 size={18} color="white" />
          </Pressable>
          <Pressable
            onPress={handleCopyDirectLink}
            className="h-[52px] w-[52px] bg-white border-2 border-zinc-200 rounded-xl items-center justify-center"
          >
            {copiedLink ? <Check size={20} color="#10b981" /> : <Link2 size={20} color="#52525b" />}
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
        imageUrl={receiptUrl}
        visible={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />
    </SafeAreaView>
  );
}
