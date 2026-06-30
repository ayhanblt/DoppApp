import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import { useCatalog } from '@/features/catalog/CatalogContext';
import { dictionaries } from '@/shared/i18n/dictionaries';

export default function FAQScreen() {
  const router = useRouter();
  const { locale } = useCatalog();
  const t = dictionaries[locale];

  return (
    <SafeAreaView className="flex-1 bg-zinc-50">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-zinc-100">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center rounded-full bg-zinc-50"
        >
          <ArrowLeft color="#18181b" size={24} />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-black text-zinc-900 mr-10">
          {t.faqTitle}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 items-center mb-6">
          <View className="w-16 h-16 bg-[#fff7ef] rounded-2xl items-center justify-center mb-4">
            <HelpCircle size={32} color="#fb4824" />
          </View>
          <Text className="text-xl font-black text-center text-zinc-900 mb-2">
            {t.faqTitle}
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
          {t.faqList.map((item, index) => (
            <View 
              key={index} 
              className={`py-5 ${index !== t.faqList.length - 1 ? 'border-b border-zinc-100' : ''}`}
            >
              <Text className="text-lg font-bold text-zinc-900 mb-2">{item.q}</Text>
              <Text className="text-base text-zinc-600 leading-6">{item.a}</Text>
            </View>
          ))}
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
