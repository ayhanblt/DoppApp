import React from 'react';
import { View, Modal, ScrollView, Pressable } from 'react-native';
import { Text } from '@/shared/ui/Text';
import { X } from 'lucide-react-native';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale } from '@/shared/lib/types';
import { useCatalog } from '@/features/catalog/CatalogContext';

interface InfoModalProps {
  locale?: Locale;
}

export const InfoModal: React.FC<InfoModalProps> = ({ locale = "tr" }) => {
  const { infoOpen, setInfoOpen } = useCatalog();
  const t = dictionaries[locale];

  return (
    <Modal
      visible={infoOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setInfoOpen(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable style={{ flex: 1 }} onPress={() => setInfoOpen(false)}  />

        <View className="bg-white rounded-t-3xl max-h-[80%] shadow-2xl p-6">
          <View className="flex-row items-center justify-between border-b border-zinc-100 pb-4 mb-4">
            <Text className="text-xl font-black text-zinc-900">{t.appName || "DoppApp"}</Text>
            <Pressable onPress={() => setInfoOpen(false)} className="bg-zinc-100 p-2 rounded-full">
              <X size={20} color="#52525b" />
            </Pressable>
          </View>

          <ScrollView className="mb-6">
            <Text className="text-base text-zinc-700 leading-relaxed font-bold mb-4">
              {t.tagline || "Modern sandbox delivery simulation"}
            </Text>

            <View className="gap-4">
              <View className="flex-row items-start gap-3">
                <Text className="text-lg">🍽️</Text>
                <Text className="flex-1 text-sm text-zinc-600 leading-normal">
                  {t.infoDesc1}
                </Text>
              </View>

              <View className="flex-row items-start gap-3">
                <Text className="text-lg">🛒</Text>
                <Text className="flex-1 text-sm text-zinc-600 leading-normal">
                  {t.infoDesc2}
                </Text>
              </View>

              <View className="flex-row items-start gap-3">
                <Text className="text-lg">🔥</Text>
                <Text className="flex-1 text-sm text-zinc-600 leading-normal">
                  {t.infoDesc3}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
