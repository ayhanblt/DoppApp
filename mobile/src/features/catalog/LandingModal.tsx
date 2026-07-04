import React, { useState, useEffect } from "react";
import { View, Modal, Image, Pressable } from 'react-native';
import { Text } from '@/shared/ui/Text';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { MapPin, Rocket } from "lucide-react-native";
import { DoppAppLogoTek } from "@/shared/ui/DoppAppLogoTek";
import { useModalSwipeGesture } from "@/shared/hooks/useModalSwipeGesture";

type LandingModalProps = {
  locale: Locale;
  onClose: (defaultLocation?: boolean) => void;
};

export function LandingModal({ locale, onClose }: LandingModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const t = dictionaries[locale];

  useEffect(() => {
    AsyncStorage.getItem("hasSeenLanding").then((hasSeen) => {
      if (!hasSeen) {
        // Wait for the Custom Splash Screen to finish (2000ms hold + 500ms fade)
        setTimeout(() => setIsVisible(true), 2500);
      }
    });
  }, []);

  const handleClose = async (defaultLocation: boolean = false) => {
    await AsyncStorage.setItem("hasSeenLanding", "true");
    setIsVisible(false);
    onClose(defaultLocation);
  };

  const panResponder = useModalSwipeGesture(isVisible, () => handleClose(false));

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={() => handleClose(false)}>
      <View {...panResponder.panHandlers} className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="w-full max-w-sm rounded-3xl bg-white p-8 items-center shadow-lg">
          <View className="mb-6 h-28 w-28 rounded-3xl bg-zinc-100 items-center justify-center border border-black/5">
            <DoppAppLogoTek width={64} height={64} />
          </View>

          <Text className="text-3xl font-black mb-3 text-center">{t.welcomeTitle}</Text>
          <Text className="text-zinc-600 mb-8 font-medium text-center">{t.welcomeDesc}</Text>

          <View className="w-full flex-col gap-4">
            <Pressable
              onPress={() => handleClose(false)}
              className="w-full flex-row items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 py-4 bg-white"
            >
              <MapPin size={18} color="#52525b" />
              <Text className="font-bold text-zinc-600">{t.pickLocation}</Text>
            </Pressable>

            <Pressable
              onPress={() => handleClose(true)}
              className="w-full flex-row items-center justify-center gap-2 rounded-xl py-4 bg-accent"
            >
              <Text className="font-black text-white">{t.startNow}</Text>
              <Rocket size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
