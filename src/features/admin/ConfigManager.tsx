"use client";

import { useState } from "react";
import { saveConfigToSupabase } from "@/features/catalog/data";
import type { GlobalConfig, DeliveryTimeConfig } from "@/shared/lib/types";
import { Save } from "lucide-react";
import { DEFAULT_DELIVERY_TIMES, DEFAULT_DELIVERY_SPEEDS } from "@/features/catalog/appConfig";

export function ConfigManager({ config, onRefresh }: { config: GlobalConfig | null; onRefresh: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [times, setTimes] = useState<DeliveryTimeConfig>(
    config?.delivery_times || DEFAULT_DELIVERY_TIMES
  );

  const [speeds, setSpeeds] = useState(
    config?.delivery_speeds || DEFAULT_DELIVERY_SPEEDS
  );

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    
    const newConfig: GlobalConfig = {
      ...(config || {}),
      delivery_times: times,
      delivery_speeds: speeds
    };

    const success = await saveConfigToSupabase(newConfig);
    if (success) {
      setMessage("Ayarlar başarıyla kaydedildi!");
      onRefresh();
    } else {
      setMessage("Kaydedilirken hata oluştu!");
    }
    setIsSaving(false);
  };

  const updateTime = (type: keyof DeliveryTimeConfig, field: "min" | "max", val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setTimes(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: num
      }
    }));
  };

  return (
    <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-black">Teslimat Süreleri Konfigürasyonu (Saniye)</h2>
      <p className="mb-6 text-sm text-zinc-600">
        Bu süreler, sistemdeki gerçek teslimat animasyon süresini ve harita mesafesini belirler.
      </p>

      {message && (
        <div className={`mb-4 rounded-lg p-3 text-sm font-bold ${message.includes("hata") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {(['shop', 'market', 'food'] as const).map(type => (
          <div key={type} className="rounded-lg border border-black/10 bg-zinc-50 p-4">
            <h3 className="mb-3 font-bold capitalize text-orange-600">{type} Kategorisi</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-bold text-zinc-500">Min Saniye</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-black/10 p-2 text-sm focus:border-orange-500 focus:outline-none"
                  value={times[type].min}
                  onChange={(e) => updateTime(type, 'min', e.target.value)}
                />
              </div>
              <span className="mt-5 text-zinc-400">-</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-bold text-zinc-500">Max Saniye</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-black/10 p-2 text-sm focus:border-orange-500 focus:outline-none"
                  value={times[type].max}
                  onChange={(e) => updateTime(type, 'max', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-black/10 pt-6">
        <h2 className="mb-4 text-xl font-black">Kurye Hızları (dk / km)</h2>
        <p className="mb-6 text-sm text-zinc-600">
          Kuryenin 1 km mesafeyi kaç dakikada kat edeceğini belirler.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {(['rabbit', 'turtle'] as const).map(type => (
            <div key={type} className="rounded-lg border border-black/10 bg-zinc-50 p-4">
              <h3 className="mb-3 font-bold capitalize text-emerald-600">
                {type === 'rabbit' ? 'Tavşan Hızı' : 'Kaplumbağa Hızı'}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-bold text-zinc-500">dk / km</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="w-full rounded-md border border-black/10 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                    value={speeds[type].kmMultiplierMs / 60000}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setSpeeds(prev => ({
                          ...prev,
                          [type]: {
                            ...prev[type],
                            kmMultiplierMs: Math.round(val * 60000)
                          }
                        }));
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        <Save size={18} />
        {isSaving ? "Kaydediliyor..." : "Ayarları Kaydet"}
      </button>
    </div>
  );
}
