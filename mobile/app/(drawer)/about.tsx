import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale } from '@/shared/lib/types';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useCatalog } from '@/features/catalog/CatalogContext';

export default function AboutScreen() {
  const { locale } = useCatalog();
  const t = dictionaries[locale];
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 py-3 bg-white border-b border-black/5 flex-row items-center relative">
        <TouchableOpacity 
          className="absolute left-4 z-10 w-10 h-10 items-center justify-center"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#09090b" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-black text-lg text-zinc-900">{t.about}</Text>
      </View>
      
      <ScrollView className="flex-1 p-6">
        <View className="items-center mb-8 mt-4">
          <View className="bg-accent w-24 h-24 rounded-3xl items-center justify-center shadow-lg mb-4">
            <Text className="text-white font-black text-5xl">D</Text>
          </View>
          <Text className="text-3xl font-black text-zinc-900">DoppApp</Text>
          <Text className="text-zinc-500 font-medium text-base mt-1">Cross-Platform Delivery Simulator</Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 mb-6">
          <Text className="text-zinc-700 text-base leading-relaxed">
            DoppApp, modern web (Next.js 15) ve mobil (React Native/Expo) teknolojilerini bir araya getiren interaktif bir deneme (sandbox) uygulamasıdır. 
            Gerçek bir e-ticaret uygulaması gibi davranır ancak ödeme alınmaz; amaç baştan sona sipariş verme, kurye hızını ayarlama ve harita üzerinde gerçek zamanlı takip deneyimini yaşatmaktır.
          </Text>
        </View>

        <View className="gap-3">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-black/5 flex-row items-center">
            <Text className="text-xl mr-3">🚀</Text>
            <View>
              <Text className="font-bold text-zinc-900">Cross Platform</Text>
              <Text className="text-xs text-zinc-500">React Native & Expo Router</Text>
            </View>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm border border-black/5 flex-row items-center">
            <Text className="text-xl mr-3">🎨</Text>
            <View>
              <Text className="font-bold text-zinc-900">NativeWind v4</Text>
              <Text className="text-xs text-zinc-500">Tailwind CSS for React Native</Text>
            </View>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm border border-black/5 flex-row items-center">
            <Text className="text-xl mr-3">⚡</Text>
            <View>
              <Text className="font-bold text-zinc-900">Supabase</Text>
              <Text className="text-xs text-zinc-500">PostgreSQL & Realtime</Text>
            </View>
          </View>
        </View>
        
        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
