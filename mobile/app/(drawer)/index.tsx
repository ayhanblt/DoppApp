import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CatalogList } from '@/features/catalog/CatalogList';
import { LandingModal } from '@/features/catalog/LandingModal';
import { FeedbackModal } from '@/features/catalog/FeedbackModal';
import { InfoModal } from '@/features/catalog/InfoModal';
import { ShoppingCart, ShoppingBag, Utensils, Store } from 'lucide-react-native';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { formatMoney } from '@/shared/lib/format';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { useRouter, useNavigation } from 'expo-router';
import { MobileHeader } from '@/features/catalog/MobileHeader';
import { AddressModal } from '@/features/catalog/AddressModal';
import { themes } from '@/features/catalog/appConfig';

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const [storeType, setStoreType] = useState<"shop" | "food" | "market">("shop");
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const { cart, stores, setDeliveryAddress, locale } = useCatalog();
  const t = dictionaries[locale];
  const router = useRouter();
  const navigation = useNavigation();

  const getCartTotal = () => {
    return cart.reduce((total, cartItem) => {
      const store = stores.find((s) => s.id === cartItem.storeId);
      if (!store) return total;
      const product = store.menu.find((p) => p.id === cartItem.itemId);
      if (!product) return total;

      let itemTotal = product.price;
      product.optionGroups?.forEach((group) => {
        const selectedIds = cartItem.selections[group.id] || [];
        selectedIds.forEach((id) => {
          const opt = group.options.find((o) => o.id === id);
          if (opt) itemTotal += opt.priceDelta;
        });
      });

      return total + itemTotal * cartItem.quantity;
    }, 0);
  };

  const total = getCartTotal();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <LandingModal
        locale={locale}
        onClose={(defaultLocation) => {
          if (defaultLocation) {
            setDeliveryAddress({
              id: "default",
              title: "Ev",
              shortAddress: "Şişli",
              address: "Şişli, İstanbul, Türkiye",
              latitude: 41.0603,
              longitude: 28.9877,
            });
          } else {
            setAddressModalOpen(true);
          }
        }}
      />
      <AddressModal
        visible={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        locale={locale}
      />
      <FeedbackModal locale={locale} />
      <InfoModal locale={locale} />

      <MobileHeader
        onAddressPress={() => setAddressModalOpen(true)}
        onMenuPress={() => { (navigation as any).openDrawer?.(); }}
        storeType={storeType}
      />

      {/* TABS */}
      {/* TABS */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: themes[storeType === 'shop' ? 'grape' : storeType === 'food' ? 'sunset' : 'mint']
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Shop Tab */}
          <Pressable
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                gap: 6,
                borderRadius: 8,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
              },
              storeType === 'shop'
                ? {
                  backgroundColor: themes.grape,
                  borderColor: themes.grape,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 1.5,
                  elevation: 2
                }
                : { backgroundColor: '#fae8ff', borderColor: '#f5d0fe' } // fuchsia-100, fuchsia-200
            ]}
            onPress={() => setStoreType('shop')}
          >
            <ShoppingBag size={16} color={storeType === 'shop' ? 'white' : themes.grape} />
            <Text className="font-bold text-xs" style={{ color: storeType === 'shop' ? 'white' : themes.grape }}>{t.shop}</Text>
          </Pressable>

          {/* Food Tab */}
          <Pressable
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                gap: 6,
                borderRadius: 8,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
              },
              storeType === 'food'
                ? {
                  backgroundColor: themes.sunset,
                  borderColor: themes.sunset,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 1.5,
                  elevation: 2
                }
                : { backgroundColor: '#ffedd5', borderColor: '#fed7aa' } // orange-100, orange-200
            ]}
            onPress={() => setStoreType('food')}
          >
            <Utensils size={16} color={storeType === 'food' ? 'white' : themes.sunset} />
            <Text className="font-bold text-xs" style={{ color: storeType === 'food' ? 'white' : themes.sunset }}>{t.food}</Text>
          </Pressable>

          {/* Market Tab */}
          <Pressable
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                gap: 6,
                borderRadius: 8,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
              },
              storeType === 'market'
                ? {
                  backgroundColor: themes.mint,
                  borderColor: themes.mint,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 1.5,
                  elevation: 2
                }
                : { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' } // emerald-100, emerald-200
            ]}
            onPress={() => setStoreType('market')}
          >
            <Store size={16} color={storeType === 'market' ? 'white' : themes.mint} />
            <Text className="font-bold text-xs" style={{ color: storeType === 'market' ? 'white' : themes.mint }}>{t.market}</Text>
          </Pressable>
        </View>
      </View>

      <CatalogList locale={locale} storeType={storeType} />

      {cart.length > 0 && (
        <View className="absolute left-4 right-4" style={{ bottom: Math.max(insets.bottom + 16, 32) }}>
          <Pressable
            onPress={() => router.push('/cart')}
            style={{ backgroundColor: themes[storeType === 'shop' ? 'grape' : storeType === 'food' ? 'sunset' : 'mint'] }}
            className="rounded-2xl flex-row items-center justify-between p-4 shadow-xl"
          >
            <View className="flex-row items-center">
              <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center mr-3">
                <ShoppingCart size={20} color="#ffffff" />
              </View>
              <View>
                <Text className="text-white font-bold text-sm">Sepetim</Text>
                <Text className="text-white/80 text-xs">{cart.length} Ürün</Text>
              </View>
            </View>
            <Text className="text-white font-black text-lg">
              {formatMoney(total, locale)}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
