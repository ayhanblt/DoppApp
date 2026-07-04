import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, Pressable, Platform, KeyboardAvoidingView, ScrollView, TextInput, StyleSheet, Keyboard, useWindowDimensions } from 'react-native';
import { Text } from '@/shared/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Home, Navigation } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale } from '@/shared/lib/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { reverseGeocode } from '@/features/tracking/geo';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  locale?: Locale;
}

const DEFAULT_COORD = { lat: 41.0603, lng: 28.9877 }; // Şişli, İstanbul, default map center

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose, locale = "tr" }) => {
  const t = dictionaries[locale];
  const { deliveryAddress, setDeliveryAddress } = useCatalog();
  const webViewRef = useRef<WebView>(null);
  const [initialMapCoord, setInitialMapCoord] = useState(deliveryAddress ? { lat: deliveryAddress.latitude, lng: deliveryAddress.longitude } : DEFAULT_COORD);
  const [isLocating, setIsLocating] = useState(false);
  
  const [region, setRegion] = useState({
    latitude: initialMapCoord.lat,
    longitude: initialMapCoord.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [title, setTitle] = useState(deliveryAddress?.title || '');
  const [addressDesc, setAddressDesc] = useState(deliveryAddress?.address || '');
  const [shortAddressDesc, setShortAddressDesc] = useState(deliveryAddress?.shortAddress || '');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      if (deliveryAddress) {
        const coord = { lat: deliveryAddress.latitude, lng: deliveryAddress.longitude };
        setRegion({ latitude: coord.lat, longitude: coord.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        setInitialMapCoord(coord);
        webViewRef.current?.injectJavaScript(`if(window.map) map.setView([${coord.lat}, ${coord.lng}], 15); true;`);
        setTitle(deliveryAddress.title);
        setAddressDesc(deliveryAddress.address);
        setShortAddressDesc(deliveryAddress.shortAddress || '');
      } else {
        setRegion({ latitude: DEFAULT_COORD.lat, longitude: DEFAULT_COORD.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        setInitialMapCoord(DEFAULT_COORD);
        webViewRef.current?.injectJavaScript(`if(window.map) map.setView([${DEFAULT_COORD.lat}, ${DEFAULT_COORD.lng}], 15); true;`);
        setTitle('');
        setAddressDesc('');
      }
    }
  }, [visible, deliveryAddress]);

  const geocodeAddress = async () => {
    if (!addressDesc.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressDesc)}`, {
        headers: {
          'User-Agent': 'DoppApp/1.0'
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        webViewRef.current?.injectJavaScript(`if(window.map) map.setView([${lat}, ${lng}], 15); true;`);
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }
  };

  const handleLocate = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      webViewRef.current?.injectJavaScript(`if(window.map) map.setView([${lat}, ${lng}], 15); true;`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLocating(false);
    }
  };



  const handleSave = () => {
    setDeliveryAddress({
      ...deliveryAddress,
      id: deliveryAddress?.id || "custom",
      title: title.trim() || t.other,
      address: addressDesc.trim() || t.chooseLocationOnMap,
      shortAddress: shortAddressDesc.trim() || (addressDesc.trim() ? addressDesc.split(',')[0] : t.chooseLocationOnMap),
      latitude: region.latitude,
      longitude: region.longitude,
    });
    onClose();
  };

  const content = (
    <View className="flex-1 justify-end bg-black/50">
      <Pressable className="absolute inset-0" onPress={onClose} />
      
      <SafeAreaView edges={['bottom']} className="bg-white rounded-t-3xl overflow-hidden max-h-[90%] w-full flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 w-full"
        >
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center justify-between border-b border-zinc-100">
            <Text className="text-lg font-black text-zinc-900">{t.deliveryAddress}</Text>
            <Pressable onPress={onClose} className="bg-zinc-100 p-2 rounded-full">
              <X size={20} color="#52525b" />
            </Pressable>
          </View>
          
          {/* Map - Klavye açıkken 100px, kapalıyken 250px */}
          <View className="relative shrink-0 w-full" style={{ height: isKeyboardVisible ? 100 : 250 }}>
            <WebView
              ref={webViewRef}
              style={{ width: '100%', height: '100%' }}
              source={{ html: `
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
                  </style>
                </head>
                <body>
                  <div id="map"></div>
                  <script>
                    window.map = L.map('map', {
                      zoomControl: false,
                      attributionControl: false
                    }).setView([${initialMapCoord.lat}, ${initialMapCoord.lng}], 15);
                    
                    L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                      maxZoom: 19,
                    }).addTo(window.map);

                    window.map.on('moveend', function() {
                      setTimeout(function() {
                        var center = window.map.getCenter();
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({ lat: center.lat, lng: center.lng }));
                        }
                      }, 50);
                    });
                  </script>
                </body>
                </html>
              ` }}
              onMessage={async (event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.lat && data.lng) {
                    setRegion(prev => ({ ...prev, latitude: data.lat, longitude: data.lng }));
                    const addr = await reverseGeocode(data.lat, data.lng);
                    if (addr && addr.full) {
                      setAddressDesc(addr.full);
                      setShortAddressDesc(addr.short);
                    } else {
                      // Fallback to coordinates if API fails, so we know the message arrived
                      const coordStr = `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`;
                      setAddressDesc(coordStr);
                      setShortAddressDesc(coordStr);
                    }
                  }
                } catch (e) {
                  console.error("WebView onMessage error:", e);
                }
              }}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              overScrollMode="never"
              bounces={false}
            />
            
            {/* Sadece harita büyükken markerı normal boyutunda göster, küçükken gizle (ya da çok küçük göster) */}
            {!isKeyboardVisible && (
              <>
                <View className="absolute top-1/2 left-1/2 -ml-5 -mt-10 pointer-events-none items-center justify-center shadow-md">
                  <View className="h-10 w-10 items-center justify-center rounded-full rounded-br-none rotate-45 bg-[#fb4824] border-2 border-white">
                    <View className="-rotate-45 items-center justify-center">
                      <Home size={20} color="white" strokeWidth={2.5} />
                    </View>
                  </View>
                </View>
                <Pressable 
                  className={`absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg ${isLocating ? 'opacity-50' : 'opacity-100'}`}
                  onPress={handleLocate}
                  disabled={isLocating}
                >
                  <Navigation size={24} color="#fb4824" />
                </Pressable>
              </>
            )}
            
            {isKeyboardVisible && (
               <View className="absolute top-1/2 left-1/2 -ml-3 -mt-3 pointer-events-none items-center justify-center">
                 <View className="h-6 w-6 rounded-full bg-[#fb4824] border-2 border-white" />
               </View>
            )}
          </View>

          {/* Inputs & Button */}
          <ScrollView className="flex-1 w-full" keyboardShouldPersistTaps="handled">
            <View className="p-6 pb-2">
              <Text className="text-sm font-bold text-zinc-700 mb-2">Adres Başlığı</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-900 mb-4"
                placeholder="Ev, İş vb."
                value={title}
                onChangeText={setTitle}
              />

              <Text className="text-sm font-bold text-zinc-700 mb-2">Açık Adres</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-900 h-20"
                placeholder="Mahalle, sokak, bina no..."
                multiline
                textAlignVertical="top"
                value={addressDesc}
                onChangeText={setAddressDesc}
                onBlur={geocodeAddress}
              />
            </View>

            {/* Product Modal stili butonu (ScrollView içinde) */}
            <View className="px-6 py-4 w-full">
              <Pressable 
                className="w-full bg-[#fb4824] py-4 rounded-xl items-center"
                onPress={handleSave}
              >
                <Text className="text-white font-black text-lg flex-shrink-1" numberOfLines={1}>{t.confirmLocation}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
};
