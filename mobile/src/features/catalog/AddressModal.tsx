import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, MapPin, Navigation } from 'lucide-react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale } from '@/shared/lib/types';
import * as Location from 'expo-location';

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  locale?: Locale;
}

const DEFAULT_COORD = { lat: 41.0422, lng: 29.0060 }; // Beşiktaş, İstanbul, default map center

export const AddressModal: React.FC<AddressModalProps> = ({ visible, onClose, locale = "tr" }) => {
  const t = dictionaries[locale];
  const { deliveryAddress, setDeliveryAddress } = useCatalog();
  const [region, setRegion] = useState<Region>({
    latitude: deliveryAddress?.latitude || DEFAULT_COORD.lat,
    longitude: deliveryAddress?.longitude || DEFAULT_COORD.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [title, setTitle] = useState(deliveryAddress?.title || '');
  const [addressDesc, setAddressDesc] = useState(deliveryAddress?.address || '');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (visible) {
      if (deliveryAddress) {
        setRegion({
          latitude: deliveryAddress.latitude,
          longitude: deliveryAddress.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setTitle(deliveryAddress.title);
        setAddressDesc(deliveryAddress.address);
      } else {
        setRegion({
          latitude: DEFAULT_COORD.lat,
          longitude: DEFAULT_COORD.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setTitle('');
        setAddressDesc('');
      }
    }
  }, [visible, deliveryAddress]);

  const geocodeAddress = async () => {
    if (!addressDesc.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressDesc)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setRegion({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
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
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
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
      shortAddress: addressDesc.trim() ? addressDesc.split(',')[0] : t.chooseLocationOnMap,
      latitude: region.latitude,
      longitude: region.longitude,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable style={{ flex: 1 }} onPress={onClose}  />
          
          <View className="bg-white rounded-t-3xl h-[85%] overflow-hidden shadow-2xl flex-col">
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-zinc-100">
              <Text className="text-lg font-black text-zinc-900">{t.deliveryAddress}</Text>
              <Pressable onPress={onClose} className="bg-zinc-100 p-2 rounded-full">
                <X size={20} color="#52525b" />
              </Pressable>
            </View>
            
            <View className="flex-[0.6] relative">
              <MapView
                style={{ flex: 1 }}
                region={region}
                onRegionChangeComplete={(r) => setRegion(r)}
              />
              <View className="absolute top-1/2 left-1/2 -ml-4 -mt-8 pointer-events-none">
                <MapPin size={32} color="#fb4824" fill="#fb4824" />
              </View>
              <Pressable 
                className={`absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg ${isLocating ? 'opacity-50' : 'opacity-100'}`}
                onPress={handleLocate}
                disabled={isLocating}
              >
                <Navigation size={24} color="#fb4824" />
              </Pressable>
            </View>

            <ScrollView className="flex-[0.4] p-6 bg-white border-t border-zinc-100">
              <Text className="text-sm font-bold text-zinc-700 mb-2">Adres Başlığı</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-900 mb-4"
                placeholder="Ev, İş vb."
                value={title}
                onChangeText={setTitle}
              />

              <Text className="text-sm font-bold text-zinc-700 mb-2">Açık Adres</Text>
              <TextInput
                className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-zinc-900 mb-6 h-20"
                placeholder="Mahalle, sokak, bina no..."
                multiline
                textAlignVertical="top"
                value={addressDesc}
                onChangeText={setAddressDesc}
                onBlur={geocodeAddress}
              />
              <View className="h-20" />
            </ScrollView>

            <SafeAreaView edges={['bottom']} className="p-4 bg-white border-t border-zinc-100 absolute bottom-0 w-full">
              <Pressable 
                className="bg-[#fb4824] rounded-xl py-4 items-center shadow-sm"
                onPress={handleSave}
              >
                <Text className="text-white font-bold text-lg">Bu Konumu Onayla</Text>
              </Pressable>
            </SafeAreaView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
