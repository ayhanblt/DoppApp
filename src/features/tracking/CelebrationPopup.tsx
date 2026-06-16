"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { X } from "lucide-react";
import { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { formatMoney, formatNumber } from "@/shared/lib/format";

type CelebrationPopupProps = {
  locale: Locale;
  calories: number;
  totalPrice: number;
  onClose: () => void;
};

export default function CelebrationPopup({ locale, calories, totalPrice, onClose }: CelebrationPopupProps) {
  const t = dictionaries[locale];

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="relative rounded-2xl bg-white p-6 text-center shadow-2xl max-w-sm w-full">
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

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-[var(--accent)] py-3 font-bold text-white hover:opacity-90"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
