"use client";

import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { X } from "lucide-react";
import { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";

type CelebrationPopupProps = {
  locale: Locale;
  calories: number;
  onClose: () => void;
};

export default function CelebrationPopup({ locale, calories, onClose }: CelebrationPopupProps) {
  const t = dictionaries[locale];
  const [confetti, setConfetti] = useState(true);

  // Confetti'yi 3 saniye sonra kapat
  useEffect(() => {
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      {confetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      <div className="relative rounded-2xl bg-white p-8 text-center shadow-2xl max-w-sm">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        >
          <X size={18} />
        </button>

        <div className="text-5xl mb-4">🎉</div>

        <h2 className="text-3xl font-black text-orange-600 mb-3">{t.celebration}</h2>

        <p className="text-lg text-zinc-700 mb-6">
          {calories.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} {t.caloriesSaved}
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-[var(--accent)] py-3 font-bold text-white hover:opacity-90"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
