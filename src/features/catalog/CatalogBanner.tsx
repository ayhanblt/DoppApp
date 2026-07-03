"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StoreType, Locale, Product } from "@/shared/lib/types";
import { useCatalog } from "./CatalogContext";
import Image from "next/image";
import { ShoppingBag, Share2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { bannerThemeConfig } from "./appConfig";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { InfinityIcon } from "@/shared/lib/ui/icons/InfinityIcon";
import { NoCreditCardIcon } from "@/shared/lib/ui/icons/NoCreditCardIcon";
import { ShareReceiptIcon } from "@/shared/lib/ui/icons/ShareReceiptIcon";

// Pseudo random generator for daily consistency
const mulberry32 = (a: number) => {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};


export function CatalogBanner({ storeType, locale }: { storeType: StoreType; locale: Locale }) {
  const { stores } = useCatalog();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const dict = dictionaries[locale];

  const themeConfig = bannerThemeConfig[storeType];
  const t = dict.catalogBanner;
  const badgeText = storeType === 'food' ? t.foodBadge : storeType === 'market' ? t.marketBadge : t.shopBadge;

  const dailyProducts = useMemo(() => {
    const relevantStores = stores.filter((s) => s.type === storeType);
    const allProducts: (Product & { storeId: string })[] = [];
    relevantStores.forEach((s) => {
      s.menu.forEach(item => {
        allProducts.push({ ...item, storeId: s.id });
      });
    });

    if (allProducts.length === 0) return [];

    // Daily seed based on current date
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate() +
      storeType.length;
    const rng = mulberry32(seed);

    // Shuffle using Fisher-Yates
    const shuffled = [...allProducts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(4, shuffled.length));
  }, [stores, storeType]);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (dailyProducts.length <= 1) return;
    const interval = setInterval(() => {
      // Önceki yöne geri dönüyoruz: Kart arkadan öne geliyor
      setCurrentIndex((prev) => (prev - 1 + dailyProducts.length) % dailyProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [dailyProducts.length]);

  if (!mounted || dailyProducts.length === 0) return null;

  return (
    <div className={`w-full rounded-2xl ${themeConfig.bg} ${themeConfig.text} overflow-hidden shadow-lg flex flex-col p-4 md:p-8 relative my-4`}>

      {/* Top Section: Text & Stacked Cards */}
      <div className="flex flex-row items-center justify-between w-full">

        {/* Left Column (Content) */}
        <div className="flex-1 pr-4 z-10 flex flex-col justify-center">
          <h2 className="text-[1.5rem] leading-tight md:text-[3rem] font-bold md:leading-tight tracking-tight mb-2 md:mb-4 drop-shadow-sm">
            {t.mainTitle}
          </h2>
          <p className="text-[10px] text-white/85 md:text-base font-medium opacity-90 drop-shadow-sm max-w-xl">
            {t.mainDesc(storeType)}
          </p>
        </div>

        {/* Right Column (Animation) */}
        <div className="w-[45%] md:w-[40%] flex-shrink-0 flex items-center justify-center p-2 min-h-[140px] md:min-h-[220px]">
          <div className="relative w-[130px] h-[130px] md:w-[240px] md:h-[240px] mt-2 md:mt-0">
            {/* Single Badge outside the animation loop */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/40 backdrop-blur-md text-white text-[9px] md:text-xs font-bold uppercase px-4 py-1.5 rounded-full whitespace-nowrap shadow-md border border-white/20 pointer-events-none">
              {badgeText}
            </div>

            {dailyProducts.map((p, i) => {
              const offset = (i - currentIndex + dailyProducts.length) % dailyProducts.length;

              // Kartı yana kaydırıp saklamak için
              const isLeaving = offset === dailyProducts.length - 1;

              return (
                <motion.div
                  key={p.id}
                  initial={false}
                  animate={{
                    scale: 1 - offset * 0.05,
                    x: isLeaving ? 80 : offset * 15,
                    y: offset * 1,
                    opacity: isLeaving ? 0 : 1 - offset * 0.4,
                    zIndex: dailyProducts.length - offset,
                    rotate: offset % 7 === 0 ? offset * 1 : offset * -7
                  }}
                  transition={{
                    type: "tween",
                    duration: 0.2,
                    ease: "easeInOut"
                  }}
                  onClick={() => offset === 0 && router.push(`/${locale}/store/${p.storeId}?productId=${p.id}`)}
                  className={`absolute inset-0 bg-white rounded-2xl shadow-2xl border border-black/5 flex flex-col overflow-hidden origin-bottom ${offset === 0 ? 'cursor-pointer hover:brightness-105 transition-all' : ''}`}
                >
                  <Image
                    src={p.image || "https://placehold.co/400x400.webp"}
                    alt={p.name[locale]}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 130px, 240px"
                  />

                  {/* Gradient overlay for text readability */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent pt-12">
                    <h5 className="text-white font-bold text-xs md:text-base truncate drop-shadow-md">
                      {p.name[locale]}
                    </h5>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Section: Feature Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 w-full mt-4 md:mt-8 z-10 relative">
        <motion.div whileHover={{ scale: 1.02, y: -2 }} className={`flex flex-col items-center justify-start text-center p-2 md:p-4 text-orange-50`}>
          <NoCreditCardIcon className="w-16 h-16 md:w-[86px] md:h-[86px] mx-auto mb-1.5 md:mb-2 drop-shadow-sm" />
          <h4 className="font-bold text-xs md:text-xl leading-tight drop-shadow-md">{t.feature1Title}</h4>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} className={`flex flex-col items-center justify-start text-center p-2 md:p-4 text-orange-50`}>
          <InfinityIcon className="w-16 h-16 md:w-[86px] md:h-[86px] mx-auto mb-1.5 md:mb-2 drop-shadow-sm" />
          <h4 className="font-bold text-xs md:text-xl leading-tight drop-shadow-md">{t.feature2Title}</h4>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} className={`flex flex-col items-center justify-start text-center p-2 md:p-4 text-orange-50`}>
          <ShareReceiptIcon className="w-16 h-16 md:w-[86px] md:h-[86px] mx-auto mb-1.5 md:mb-2 drop-shadow-sm" />
          <h4 className="font-bold text-xs md:text-xl leading-tight drop-shadow-md">{t.feature3Title}</h4>
        </motion.div>
      </div>

    </div>
  );
}
