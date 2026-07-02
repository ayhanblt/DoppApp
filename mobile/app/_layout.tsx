// @ts-ignore
import '../global.css';
import { Stack } from 'expo-router';
import { CatalogProvider, useCatalog } from '@/features/catalog/CatalogContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useEffect, useState } from 'react';
import { View, Text, Image, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { usePushNotifications } from '@/features/notifications/usePushNotifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();



function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  const { locale } = useCatalog();
  const t = dictionaries[locale];

  const scale = useSharedValue(1);
  const logoOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  const bgOpacity = useSharedValue(1);

  useEffect(() => {

    if (Platform.OS === 'android') {
      NavigationBar.setHidden(true);
    }

    // Native splash'i gizle, devral.
    SplashScreen.hideAsync();

    textOpacity.value = withDelay(
      300,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
    );

    scale.value = withDelay(
      600,
      withTiming(40, { duration: 600, easing: Easing.in(Easing.exp) })
    );

    logoOpacity.value = withDelay(
      900,
      withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
    );

    bgOpacity.value = withDelay(
      1000,
      withTiming(0, { duration: 400, easing: Easing.linear })
    );

    // Animasyonların toplam süresi 1400ms (1000ms delay + 400ms süre).
    const timeout = setTimeout(() => {
      onFinish();
    }, 1400);

    return () => clearTimeout(timeout);
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Animated.View style={[{
      flex: 1,
      backgroundColor: '#fb4824',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
    }, bgStyle]}>
      <Animated.Image
        source={require('../assets/icon.png')}
        style={[{ width: 140, height: 140, tintColor: '#ffffff' }, logoStyle]}
        resizeMode="contain"
      />
      <Animated.Text style={[{
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        textAlign: 'center',
        paddingHorizontal: 32
      }, textStyle]}>
        {t.welcomeTagline}
      </Animated.Text>
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

  // Splash bittiğinde uygulamanın geri kalanında navigasyon çubuğunu tekrar göster
  useEffect(() => {
    if (!splashVisible && Platform.OS === 'android') {
      NavigationBar.setHidden(false);
    }
  }, [splashVisible]);

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
