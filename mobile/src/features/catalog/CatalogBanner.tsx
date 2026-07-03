import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { StoreType, Locale, Product } from "@/shared/lib/types";
import { useCatalog } from "./CatalogContext";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { bannerThemeConfig } from "./appConfig";
import { NoCreditCardIcon } from "@/shared/ui/icons/NoCreditCardIcon";
import { InfinityIcon } from "@/shared/ui/icons/InfinityIcon";
import { ShareReceiptIcon } from "@/shared/ui/icons/ShareReceiptIcon";
import { useRouter } from "expo-router";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const mulberry32 = (a: number) => {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const AnimatedCard = ({
  product,
  index,
  currentIndex,
  total,
  locale,
  router,
}: {
  product: Product & { storeId: string };
  index: number;
  currentIndex: number;
  total: number;
  locale: Locale;
  router: any;
}) => {
  const offset = (index - currentIndex + total) % total;
  const isLeaving = offset === total - 1;

  const targetScale = 1 - offset * 0.12;
  const targetX = isLeaving ? 100 : offset * 8;
  const targetY = offset * -12;
  const targetOpacity = isLeaving ? 0 : 1 - offset * 0.25;
  const targetRotate = offset === 0 ? 0 : (offset % 2 === 0 ? offset * 4 : offset * -4);
  const targetZIndex = total - offset;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withTiming(targetX, { duration: 200, easing: Easing.inOut(Easing.ease) }) },
        { translateY: withTiming(targetY, { duration: 200, easing: Easing.inOut(Easing.ease) }) },
        { scale: withTiming(targetScale, { duration: 200, easing: Easing.inOut(Easing.ease) }) },
        { rotate: withTiming(`${targetRotate}deg`, { duration: 200, easing: Easing.inOut(Easing.ease) }) },
      ],
      opacity: withTiming(targetOpacity, { duration: 200 }),
      zIndex: targetZIndex,
    };
  }, [offset, isLeaving, targetScale, targetX, targetY, targetOpacity, targetRotate, targetZIndex]);

  return (
    <AnimatedPressable
      onPress={() => {
        if (offset === 0) {
          router.push(`/store/${product.storeId}?productId=${product.id}`);
        }
      }}
      style={[
        {
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "white",
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          transformOrigin: "bottom center" as any, // Not perfectly supported in all RN versions, but helps conceptually
        },
        animatedStyle,
      ]}
    >
      <Image source={{ uri: product.image || "https://placehold.co/400x400.webp" }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, paddingTop: 48 }}
      >
        <Text className="text-white font-bold text-xs drop-shadow-md" numberOfLines={1}>
          {product.name[locale]}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
};

export function CatalogBanner({ storeType, locale }: { storeType: StoreType; locale: Locale }) {
  const { stores } = useCatalog();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const dict = dictionaries[locale];
  const t = dict.catalogBanner;
  const themeConfig = bannerThemeConfig[storeType];

  const badgeText = storeType === "food" ? t.foodBadge : storeType === "market" ? t.marketBadge : t.shopBadge;

  const dailyProducts = useMemo(() => {
    const relevantStores = stores.filter((s) => s.type === storeType);
    const allProducts: (Product & { storeId: string })[] = [];
    relevantStores.forEach((s) => {
      s.menu.forEach((item) => {
        allProducts.push({ ...item, storeId: s.id });
      });
    });

    if (allProducts.length === 0) return [];

    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + storeType.length;
    const rng = mulberry32(seed);

    const shuffled = [...allProducts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(4, shuffled.length));
  }, [stores, storeType]);

  useEffect(() => {
    if (dailyProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev - 1 + dailyProducts.length) % dailyProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [dailyProducts.length]);

  if (dailyProducts.length === 0) return null;

  return (
    <View className="w-full rounded-2xl overflow-hidden shadow-lg flex-col p-4 mb-5">
      <LinearGradient
        colors={themeConfig.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Top Section */}
      <View className="flex-row justify-between w-full relative z-10">
        {/* Left Text Column */}
        <View className="flex-1 pr-3 justify-center">
          <Text className="text-[24px] font-bold text-white leading-tight mb-2 shadow-sm tracking-tight">
            {t.mainTitle}
          </Text>
          <Text className="text-[10px] text-white/85 font-medium leading-tight">
            {t.mainDesc(storeType)}
          </Text>
        </View>

        {/* Right Animation Column */}
        <View className="w-[140px] items-center justify-center p-2 min-h-[140px] mr-1">
          <View className="relative w-[120px] h-[120px] mt-2">
            {/* Badge */}
            <View className="absolute -top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-700/90 rounded-full px-3 py-1 shadow-sm border border-white/20">
              <Text className="text-white text-[7px] font-bold uppercase tracking-wider">{badgeText}</Text>
            </View>

            {dailyProducts.map((p, i) => (
              <AnimatedCard
                key={p.id}
                product={p}
                index={i}
                currentIndex={currentIndex}
                total={dailyProducts.length}
                locale={locale}
                router={router}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Bottom Section: Feature Cards */}
      <View className="flex-row justify-between mt-5 z-10 w-full gap-2">
        {/* Feature 1 */}
        <View className="flex-1 items-center justify-start text-center p-2">
          <View className="flex-col items-center justify-center mb-1">
            <NoCreditCardIcon size={64} color="#fff1f2" style={{ marginBottom: 4 }} />
            <Text className="font-bold text-[11px] text-orange-50 text-center leading-tight shadow-sm">
              {t.feature1Title}
            </Text>
          </View>
        </View>

        {/* Feature 2 */}
        <View className="flex-1 items-center justify-start text-center p-2">
          <View className="flex-col items-center justify-center mb-1">
            <InfinityIcon size={64} color="#fff1f2" style={{ marginBottom: 4 }} />
            <Text className="font-bold text-[11px] text-orange-50 text-center leading-tight shadow-sm">
              {t.feature2Title}
            </Text>
          </View>
        </View>

        {/* Feature 3 */}
        <View className="flex-1 items-center justify-start text-center p-2">
          <View className="flex-col items-center justify-center mb-1">
            <ShareReceiptIcon size={64} color="#fff1f2" style={{ marginBottom: 4 }} />
            <Text className="font-bold text-[11px] text-orange-50 text-center leading-tight shadow-sm">
              {t.feature3Title}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
