// @ts-ignore
import '../global.css';
import { Stack } from 'expo-router';
import { CatalogProvider, useCatalog } from '@/features/catalog/CatalogContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useEffect, useState } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { usePushNotifications } from '@/features/notifications/usePushNotifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  const [opacity] = useState(new Animated.Value(1));
  const { locale } = useCatalog();
  const t = dictionaries[locale];

  useEffect(() => {
    SplashScreen.hideAsync();

    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2000);
  }, [opacity, onFinish]);

  return (
    <Animated.View style={{
      flex: 1,
      backgroundColor: '#fb4824',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      opacity,
    }}>
      <Image
        source={require('../assets/icon.png')}
        style={{ width: 140, height: 140, tintColor: '#ffffff' }}
        resizeMode="contain"
      />
      <Text style={{
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        textAlign: 'center',
        paddingHorizontal: 32
      }}>
        {t.welcomeTagline}
      </Text>
    </Animated.View>
  );
}

function PushNotificationInitializer() {
  const { locale } = useCatalog();
  usePushNotifications(locale);
  return null;
}

export default function RootLayout() {
  const [splashVisible, setSplashVisible] = useState(true);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CatalogProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(drawer)" />
              <Stack.Screen name="cart" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="tracking" />
              <Stack.Screen name="store/[id]" />
            </Stack>
            <PushNotificationInitializer />
            {splashVisible && <CustomSplashScreen onFinish={() => setSplashVisible(false)} />}
          </View>
        </CatalogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
