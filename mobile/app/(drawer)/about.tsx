import React from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale } from '@/shared/lib/types';
import { ChevronLeft, MapPin, Search, Send, Store } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useCatalog } from '@/features/catalog/CatalogContext';

export default function AboutScreen() {
  const { locale } = useCatalog();
  const t = dictionaries[locale];
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 py-3 bg-white border-b border-black/5 flex-row items-center relative">
        <Pressable
          className="absolute left-4 z-10 w-10 h-10 items-center justify-center"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#09090b" />
        </Pressable>
        <Text className="flex-1 text-center font-black text-lg text-zinc-900">{t.about}</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="items-center mb-8 mt-4">
          <View className="bg-accent w-24 h-24 rounded-3xl items-center justify-center shadow-lg mb-4">
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 64, height: 64, tintColor: '#fff' }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-black text-zinc-900">{t.aboutTitle}</Text>
          <Text className="text-zinc-500 font-medium text-base mt-1">DoppApp</Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 mb-6 space-y-6">
          <Text className="text-zinc-700 text-base leading-relaxed">
            <Text className="font-bold text-zinc-900">DoppApp</Text> {t.aboutP1}
          </Text>

          <Text className="text-zinc-700 text-base leading-relaxed mt-4">
            {t.aboutP2}
          </Text>

          <View className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 gap-4 mt-4">
            <View className="flex-row items-start gap-3">
              <MapPin size={20} color="#fb4824" className="mt-0.5" />
              <Text className="flex-1 text-zinc-700 text-sm leading-relaxed">{t.aboutBullet1}</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Search size={20} color="#fb4824" className="mt-0.5" />
              <Text className="flex-1 text-zinc-700 text-sm leading-relaxed">{t.aboutBullet2}</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Send size={20} color="#fb4824" className="mt-0.5" />
              <Text className="flex-1 text-zinc-700 text-sm leading-relaxed">{t.aboutBullet3}</Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Store size={20} color="#fb4824" className="mt-0.5" />
              <Text className="flex-1 text-zinc-700 text-sm leading-relaxed">{t.aboutBullet4}</Text>
            </View>
          </View>

          <Text className="text-zinc-700 text-base leading-relaxed mt-4">
            {t.aboutP3}
          </Text>

          <View className="mt-6 p-4 bg-accent rounded-xl">
            <Text className="text-white font-bold text-center text-base">{t.aboutHaveFun}</Text>
          </View>
        </View>

        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
