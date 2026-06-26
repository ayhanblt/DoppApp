import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type * as NotificationsType from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/shared/api/supabase';
import { useRouter } from 'expo-router';

import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: any = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn("expo-notifications load failed", e);
  }
}

const DEVICE_ID_KEY = '@dopp_device_id';

export function usePushNotifications(locale: string = 'tr') {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<NotificationsType.Notification | undefined>(undefined);
  const notificationListener = useRef<NotificationsType.EventSubscription | undefined>(undefined);
  const responseListener = useRef<NotificationsType.EventSubscription | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (isExpoGo) {
      console.log('Push notifications are not supported in Expo Go (SDK 53+).');
      return;
    }

    registerForPushNotificationsAsync()
      .then(async (token) => {
        if (token) {
          setExpoPushToken(token);
          await registerDeviceToSupabase(token, locale);
        }
      })
      .catch((error) => console.log('Push Token Error:', error));

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification: NotificationsType.Notification) => {
        setNotification(notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: NotificationsType.NotificationResponse) => {
        const data = response.notification.request.content.data;
        if (data?.route) {
          try {
            router.push(data.route as any);
          } catch (e) {
            console.error("Routing error:", e);
          }
        }
      });
    } catch (e) {
      console.warn("Error adding notification listeners", e);
    }

    return () => {
      if (notificationListener.current) {
        try { Notifications.removeNotificationSubscription(notificationListener.current); } catch(e){}
      }
      if (responseListener.current) {
        try { Notifications.removeNotificationSubscription(responseListener.current); } catch(e){}
      }
    };
  }, [locale]);

  return { expoPushToken, notification };
}

async function registerDeviceToSupabase(pushToken: string, locale: string) {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    const { error } = await supabase.rpc('register_device', {
      p_device_id: deviceId,
      p_push_token: pushToken,
      p_platform: Platform.OS,
      p_language: locale
    });

    if (error) {
      console.error("Supabase register_device RPC error:", error);
    }
  } catch (e) {
    console.error("registerDeviceToSupabase exception:", e);
  }
}

async function registerForPushNotificationsAsync() {
  let token;

  if (!Notifications) return undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
      if (!projectId) {
        console.error("No projectId found in app.json for EAS.");
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      })).data;
    } catch (e) {
      console.error(e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
