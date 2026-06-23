import React from 'react';
import { View, TouchableOpacity, Text, TextInput, Image } from 'react-native';
import { MapPin, ShoppingCart, Menu, Search } from 'lucide-react-native';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale } from '@/shared/lib/types';
import { DoppAppLogo } from '@/shared/ui/DoppAppLogo';
import { useRouter } from 'expo-router';


import { themes } from '@/features/catalog/appConfig';

interface MobileHeaderProps {
  onAddressPress: () => void;
  onMenuPress: () => void;
  storeType?: 'shop' | 'food' | 'market';
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onAddressPress, onMenuPress, storeType = 'shop' }) => {
  const locale: Locale = "tr";
  const t = dictionaries[locale];
  const { deliveryAddress, cart, query, setQuery } = useCatalog();
  const router = useRouter();

  // Map storeType to theme name
  const themeName = storeType === 'shop' ? 'grape' : storeType === 'food' ? 'sunset' : 'mint';
  const bgColor = themes[themeName];

  return (
    <View className="px-4 py-3" style={{ backgroundColor: bgColor }}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2 flex-1">
          <TouchableOpacity 
            className="bg-white w-10 h-10 rounded-xl items-center justify-center border border-black/5 shadow-sm"
            onPress={onMenuPress}
          >
            <Menu size={20} color="#09090b" />
          </TouchableOpacity>
          <View className="h-10 px-2 items-center justify-center">
             <DoppAppLogo width={100} height={28} color="#fb4824" />
          </View>
          <TouchableOpacity 
            className="flex-row items-center bg-white rounded-lg p-2 border border-black/5 shadow-sm flex-1"
            onPress={onAddressPress}
          >
            <MapPin size={16} color="#fb4824" />
            <View className="ml-2 flex-1">
              <Text className="text-[10px] text-zinc-500 font-medium leading-tight">{t.deliveryAddress}</Text>
              <Text className="text-xs font-bold text-zinc-900 leading-tight" numberOfLines={1}>
                {deliveryAddress?.shortAddress || t.addressMissing}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row items-center gap-2 ml-3">
          <TouchableOpacity 
            className="bg-white w-10 h-10 rounded-full items-center justify-center border border-black/5 shadow-sm relative"
            onPress={() => router.push('/cart')}
          >
            <ShoppingCart size={18} color="#09090b" />
            {cart.length > 0 && (
              <View className="absolute -top-1 -right-1 bg-accent w-4 h-4 rounded-full items-center justify-center">
                <Text className="text-[10px] font-bold text-white">{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center bg-white rounded-xl border border-black/5 px-3 py-2 shadow-sm mb-2">
        <Search size={18} color="#a1a1aa" />
        <TextInput
          className="flex-1 ml-2 text-sm text-zinc-900"
          placeholder={t.searchPlaceholderShop}
          placeholderTextColor="#a1a1aa"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
};
