import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from 'expo-router/drawer';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { View, Text, Image } from 'react-native';
import { Globe, Info, MessageSquare } from 'lucide-react-native';
import { useCatalog } from '@/features/catalog/CatalogContext';

function CustomDrawerContent(props: any) {
  const { locale, setLocale, setInfoOpen, setFeedbackOpen } = useCatalog();
  const t = dictionaries[locale];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, backgroundColor: '#fff' }}>
      <View className="p-6 pb-4 border-b border-zinc-100 flex flex-col items-center justify-center">
        <View className="mb-3">
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 48, height: 48, tintColor: '#fb4824' }}
            resizeMode="contain"
          />
        </View>
        <Text className="text-xl font-black text-zinc-900">DoppApp</Text>
        <Text className="text-sm text-zinc-500 mt-1">{t.welcomeTagline}</Text>
      </View>

      <View className="flex-1 pt-2">
        <DrawerItemList {...props} />

        <DrawerItem
          label={locale === "tr" ? t.langEn : t.langTr}
          icon={({ color, size }) => <Globe color={color} size={size} />}
          onPress={() => {
            setLocale(locale === "tr" ? "en" : "tr");
          }}
          labelStyle={{ fontFamily: 'System', fontWeight: '600' }}
        />

        <DrawerItem
          label={t.sendFeedback}
          icon={({ color, size }) => <MessageSquare color={color} size={size} />}
          onPress={() => {
            setFeedbackOpen(true);
            props.navigation.closeDrawer();
          }}
          labelStyle={{ fontFamily: 'System', fontWeight: '600' }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const { locale } = useCatalog();
  const t = dictionaries[locale];

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#fff7ef',
        drawerActiveTintColor: '#fb4824',
        drawerInactiveTintColor: '#52525b',
        drawerPosition: 'right',
        drawerLabelStyle: {
          fontFamily: 'System',
          fontWeight: '600',
        }
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: t.catalog,
          drawerIcon: ({ color, size }) => <Image source={require('../../assets/icon.png')} style={{ width: size * 0.9, height: size * 0.9, tintColor: color }} resizeMode="contain" />
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          drawerLabel: t.about,
          drawerIcon: ({ color, size }) => <Info color={color} size={size} />
        }}
      />
    </Drawer>
  );
}
