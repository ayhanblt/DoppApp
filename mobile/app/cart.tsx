import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Modal, TextInput, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { formatMoney } from '@/shared/lib/format';
import { Locale } from '@/shared/lib/types';
import { ArrowLeft, Trash2, MapPin, Save, FolderDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { dictionaries } from '@/shared/i18n/dictionaries';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen() {
  const router = useRouter();
  const { cart, setCart, stores, locale } = useCatalog();
  const t = dictionaries[locale];

  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [saveCartName, setSaveCartName] = useState("");
  const [savedCarts, setSavedCarts] = useState<Array<{ name: string; items: typeof cart }>>([]);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null);

  const openRestorePrompt = async () => {
    const saved = await AsyncStorage.getItem("doppapp_saved_carts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedCarts(parsed);
          setSelectedCartIndex(0);
          setShowRestorePrompt(true);
        } else {
          Alert.alert(t.infoAlert, t.noSavedCart);
        }
      } catch (e) {
        Alert.alert(t.error, t.errorReadingCarts);
      }
    } else {
      Alert.alert(t.infoAlert, t.noSavedCart);
    }
  };

  const handleRestoreCart = () => {
    if (selectedCartIndex === null) return;
    const cartToRestore = savedCarts[selectedCartIndex];
    if (cartToRestore && cartToRestore.items) {
      setCart(cartToRestore.items);
      setShowRestorePrompt(false);
      Alert.alert(t.success, t.cartRestored(cartToRestore.name));
    }
  };

  const handleSaveCart = async () => {
    if (!saveCartName.trim()) return;
    const newCart = {
      name: saveCartName,
      items: cart
    };

    let existingCarts = [];
    const saved = await AsyncStorage.getItem("doppapp_saved_carts");
    if (saved) {
      try {
        existingCarts = JSON.parse(saved);
        if (!Array.isArray(existingCarts)) existingCarts = [];
      } catch (e) {
        existingCarts = [];
      }
    }

    existingCarts.push(newCart);
    await AsyncStorage.setItem("doppapp_saved_carts", JSON.stringify(existingCarts));

    setShowSavePrompt(false);
    setSaveCartName("");
    Alert.alert(t.success, t.cartSaved(saveCartName));
  };

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

  const handleRemove = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const total = getCartTotal();

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center p-4 border-b border-black/5 bg-white">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#09090b" />
          </Pressable>
          <Text className="text-xl font-black">{t.cart}</Text>
        </View>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-zinc-500 font-medium text-center">{t.emptyCart}</Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-full bg-accent/10"
          >
            <Text className="text-accent font-bold">Geri Dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center p-4 border-b border-black/5 bg-white">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#09090b" />
        </Pressable>
        <Text className="text-xl font-black">{t.cart}</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {cart.map((cartItem) => {
          const store = stores.find((s) => s.id === cartItem.storeId);
          const product = store?.menu.find((p) => p.id === cartItem.itemId);
          if (!store || !product) return null;

          let itemTotal = product.price;
          const optionsText: string[] = [];

          product.optionGroups?.forEach((group) => {
            const selectedIds = cartItem.selections[group.id] || [];
            selectedIds.forEach((id) => {
              const opt = group.options.find((o) => o.id === id);
              if (opt) {
                itemTotal += opt.priceDelta;
                optionsText.push(opt.label[locale]);
              }
            });
          });

          return (
            <View key={cartItem.id} className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-black/5 flex-row">
              <Image source={{ uri: product.image }} className="w-16 h-16 rounded-lg bg-zinc-100 mr-3" />
              <View className="flex-1">
                <Text className="font-bold text-zinc-900" numberOfLines={1}>{product.name[locale]}</Text>
                {optionsText.length > 0 && (
                  <Text className="text-xs text-zinc-500 mt-1" numberOfLines={2}>
                    {optionsText.join(', ')}
                  </Text>
                )}
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="font-black text-accent">
                    {cartItem.quantity}x {formatMoney(itemTotal, locale)}
                  </Text>
                  <Pressable onPress={() => handleRemove(cartItem.id)} className="p-1">
                    <Trash2 size={16} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        <View className="bg-white p-4 rounded-xl mt-4 shadow-sm border border-black/5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-zinc-500">{t.subtotal}</Text>
            <Text className="font-bold">{formatMoney(total, locale)}</Text>
          </View>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-zinc-500">{t.deliveryFee}</Text>
            <Text className="font-bold text-emerald-600">{t.free}</Text>
          </View>
          <View className="border-t border-black/5 pt-4 flex-row items-center justify-between">
            <Text className="font-black text-lg">{t.total}</Text>
            <Text className="font-black text-2xl text-accent">{formatMoney(total, locale)}</Text>
          </View>
        </View>

        {/* SAVE & RESTORE BUTTONS */}
        <View className="flex-row items-center justify-center gap-4 py-4 mt-2 mb-6">
          <Pressable
            onPress={() => setShowSavePrompt(true)}
            className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-black/10 shadow-sm"
          >
            <Save size={16} color="#fb4824" />
            <Text className="text-xs font-black text-zinc-700">{t.saveCart}</Text>
          </Pressable>
          <Text className="text-zinc-300">|</Text>
          <Pressable
            onPress={openRestorePrompt}
            className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-black/10 shadow-sm"
          >
            <FolderDown size={16} color="#fb4824" />
            <Text className="text-xs font-black text-zinc-700">{t.restore}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-black/5">
        <Pressable
          onPress={() => router.push('/checkout')}
          className="w-full bg-accent py-4 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Text className="text-white font-black text-lg">{t.checkout}</Text>
          <ArrowLeft size={20} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
        </Pressable>
      </View>

      {/* SAVE CART MODAL */}
      <Modal
        visible={showSavePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSavePrompt(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40 p-4">
          <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-zinc-100">
            <Text className="text-lg font-black text-zinc-800 mb-2">
              {t.saveCart}
            </Text>
            <Text className="text-xs text-zinc-500 mb-4">
              {t.enterCartName}
            </Text>
            <TextInput
              value={saveCartName}
              onChangeText={setSaveCartName}
              placeholder={t.egDinner}
              placeholderTextColor="#a1a1aa"
              className="w-full rounded-xl border border-zinc-200 p-3 mb-4 text-sm text-zinc-950 bg-zinc-50 font-bold"
              autoFocus
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowSavePrompt(false)}
                className="flex-1 rounded-xl bg-zinc-100 py-3 items-center"
              >
                <Text className="font-bold text-zinc-700">{t.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveCart}
                disabled={!saveCartName.trim()}
                className="flex-1 rounded-xl bg-accent py-3 items-center disabled:opacity-50"
              >
                <Text className="font-bold text-white">{t.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* RESTORE CART MODAL */}
      <Modal
        visible={showRestorePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRestorePrompt(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40 p-4">
          <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-zinc-100">
            <Text className="text-lg font-black text-zinc-800 mb-2">
              {t.restoreCart}
            </Text>
            <Text className="text-xs text-zinc-500 mb-4">
              {t.selectCartToRestore}
            </Text>
            
            <ScrollView className="max-h-40 border border-zinc-200 rounded-xl mb-4 bg-zinc-50">
              {savedCarts.map((c, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedCartIndex(idx)}
                  className={`p-3 border-b border-zinc-100 flex-row justify-between items-center ${selectedCartIndex === idx ? 'bg-accent/10' : ''}`}
                >
                  <Text className={`text-sm ${selectedCartIndex === idx ? 'font-bold text-accent' : 'text-zinc-700'}`}>{c.name}</Text>
                  <Text className="text-xs text-zinc-400">({c.items.length} {t.itemCount})</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowRestorePrompt(false)}
                className="flex-1 rounded-xl bg-zinc-100 py-3 items-center"
              >
                <Text className="font-bold text-zinc-700">{t.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleRestoreCart}
                disabled={selectedCartIndex === null}
                className="flex-1 rounded-xl bg-accent py-3 items-center disabled:opacity-50"
              >
                <Text className="font-bold text-white">{t.restore}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
