"use client";

import { useState, useEffect } from "react";
import { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { ShoppingBag, MapPin } from "lucide-react";

type LandingModalProps = {
  locale: Locale;
  onClose: (defaultLocation?: boolean) => void;
};

export function LandingModal({ locale, onClose }: LandingModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already seen this modal
    const hasSeen = localStorage.getItem("hasSeenLanding");
    if (!hasSeen) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = (defaultLocation: boolean = false) => {
    localStorage.setItem("hasSeenLanding", "true");
    setIsVisible(false);
    onClose(defaultLocation);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        handleClose(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => handleClose(true)}>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-[var(--accent)] to-orange-400 flex items-center justify-center shadow-lg text-white">
          <ShoppingBag size={48} />
        </div>
        
        <h2 className="text-3xl font-black mb-3">DoppApp&apos;e Hoş Geldin!</h2>
        <p className="text-zinc-600 mb-8 font-medium">Hayalindekileri sepetine ekle ve siparişini ver, paylaş.</p>

        <div className="flex w-full items-center justify-between gap-4 mt-2">
          <button
            onClick={() => handleClose(false)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 py-3 font-bold text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
          >
            <MapPin size={18} />
            Konumunu Seç
          </button>
          
          <button
            onClick={() => handleClose(true)}
            className="flex-1 rounded-xl bg-gradient-to-r from-[var(--accent)] to-orange-500 py-3.5 font-black text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            Hemen Başla
          </button>
        </div>
      </div>
    </div>
  );
}
