import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
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
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setInfoOpen(false)} activeOpacity={1} />

        <View className="bg-white rounded-t-3xl max-h-[80%] shadow-2xl p-6">
          <View className="flex-row items-center justify-between border-b border-zinc-100 pb-4 mb-4">
            <Text className="text-xl font-black text-zinc-900">{t.appName || "DoppApp"}</Text>
            <TouchableOpacity onPress={() => setInfoOpen(false)} className="bg-zinc-100 p-2 rounded-full">
              <X size={20} color="#52525b" />
            </TouchableOpacity>
          </View>

          <ScrollView className="mb-6">
            <Text className="text-base text-zinc-700 leading-relaxed font-bold mb-4">
              {t.tagline || "Modern sandbox delivery simulation"}
            </Text>

            <View className="gap-4">
              <View className="flex-row items-start gap-3">
                <Text className="text-lg">🍽️</Text>
                <Text className="flex-1 text-sm text-zinc-600 leading-normal">
                  {locale === "tr"
                    ? "Gerçekmiş gibi hissettiren sahte restoran deneyimi — menüler, sipariş akışı ve seçimler tamamen simüle edilir."
                    : "A fake restaurant experience that feels real — menus, ordering flow, and choices are fully simulated."}
                </Text>
              </View>

              <View className="flex-row items-start gap-3">
                <Text className="text-lg">🛒</Text>
                <Text className="flex-1 text-sm text-zinc-600 leading-normal">
                  {locale === "tr"
                    ? "Sepet ve sipariş süreci gerçek ödeme olmadan çalışır, sadece deneyim ve etkileşim odaklıdır."
                    : "Cart and ordering work without any real payment — purely for experience and interaction."}
                </Text>
              </View>

              <View className="flex-row items-start gap-3">
                <Text className="text-lg">🔥</Text>
                <Text className="flex-1 text-sm text-zinc-600 leading-normal">
                  {locale === "tr"
                    ? "Dopamin odaklı etkileşimlerle açlık hissini bastırır, kalori almadan tatmin hissi sunar."
                    : "Dopamine-driven interactions that reduce cravings and simulate satisfaction without calories."}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
