"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { X, Share2 } from "lucide-react";
import { Locale, CartItem } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { formatMoney, formatNumber } from "@/shared/lib/format";
import ReceiptShareModal from "./ReceiptShareModal";
import { useCatalog } from "@/features/catalog/CatalogContext";

type CelebrationPopupProps = {
  locale: Locale;
  calories: number;
  totalPrice: number;
  cart: CartItem[];
  onClose: () => void;
};

export default function CelebrationPopup({ locale, calories, totalPrice, cart, onClose }: CelebrationPopupProps) {
  const t = dictionaries[locale];
  const { stores } = useCatalog();
  const [showShareModal, setShowShareModal] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showShareModal) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showShareModal]);

  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        zIndex: 9999,
        colors: ['#fb4824', '#ffffff', '#22c55e']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        zIndex: 9999,
        colors: ['#fb4824', '#ffffff', '#22c55e']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  const handleShareClick = () => {
    // Generate data for the receipt API
    const items = cart.map(item => {
      const store = stores.find(s => s.id === item.storeId);
      const product = store?.menu.find(p => p.id === item.itemId);
      return {
        name: product ? product.name[locale] : "Ürün",
        qty: item.quantity,
        image: product?.image
      };
    });
    
    const data = JSON.stringify({
      locale,
      total: formatMoney(totalPrice, locale),
      items
    });
    
    setReceiptUrl(`/api/receipt?data=${encodeURIComponent(data)}`);
    setShowShareModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="relative rounded-2xl bg-white p-6 text-center shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        >
          <X size={18} />
        </button>

        <div className="text-5xl mb-4 mt-2">🎉</div>

        <h2 className="text-3xl font-black text-[var(--accent)] mb-2">{t.celebration}</h2>
        <p className="text-zinc-600 mb-6">{t.orderDelivered}</p>

        <div className="mb-6 space-y-2 rounded-xl bg-zinc-50 p-4 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600">{t.amount}</span>
            <span className="font-bold">{formatMoney(totalPrice, locale)}</span>
          </div>
          {calories > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">{t.calories}</span>
              <span className="font-bold">{formatNumber(calories, locale)} kcal</span>
            </div>
          )}
        </div>

        <p className="mb-6 text-center text-sm italic text-zinc-500">
          {t.savingsSummary(
            formatMoney(totalPrice, locale),
            calories > 0 ? formatNumber(calories, locale) : ""
          )}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleShareClick}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-black text-white hover:opacity-90 shadow-md transition-all bg-gradient-to-r from-violet-600 to-indigo-600"
          >
            Siparişini Paylaş
            <Share2 size={18} />
          </button>

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-zinc-100 py-3 font-bold text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
    {showShareModal && (
      <ReceiptShareModal locale={locale} imageUrl={receiptUrl} onClose={() => setShowShareModal(false)} />
    )}
    </>
  );
}
