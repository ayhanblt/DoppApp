import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { View, Text } from 'react-native';
import { Globe, Info, MessageSquare } from 'lucide-react-native';
import { useCatalog } from '@/features/catalog/CatalogContext';

function CustomDrawerContent(props: any) {
  const { locale, setLocale, setInfoOpen, setFeedbackOpen } = useCatalog();
  const t = dictionaries[locale];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, backgroundColor: '#fff' }}>
      <View className="p-6 pb-4 border-b border-zinc-100">
        <View className="bg-accent w-12 h-12 rounded-xl items-center justify-center shadow-sm mb-3">
          <Text className="text-white font-black text-2xl">D</Text>
        </View>
        <Text className="text-xl font-black text-zinc-900">DoppApp</Text>
        <Text className="text-sm text-zinc-500">Cross-Platform Sandbox</Text>
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
          label={t.info}
          icon={({ color, size }) => <Info color={color} size={size} />}
          onPress={() => {
            setInfoOpen(true);
            props.navigation.closeDrawer();
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
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: '#fff7ef',
        drawerActiveTintColor: '#fb4824',
        drawerInactiveTintColor: '#52525b',
        drawerLabelStyle: {
          fontFamily: 'System',
          fontWeight: '700',
        }
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Katalog",
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          drawerLabel: "Hakkımızda",
        }}
      />
    </Drawer>
  );
}
