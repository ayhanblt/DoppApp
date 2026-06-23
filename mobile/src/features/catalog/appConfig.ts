import type { ThemeName, DeliveryTimeConfig, DeliverySpeedsConfig } from "@/shared/lib/types";

export const DEFAULT_DELIVERY_TIMES: DeliveryTimeConfig = {
  shop: { min: 60, max: 180 },
  market: { min: 60, max: 180 },
  food: { min: 60, max: 120 },
};

// ─────────────────────────────────────────────
//  Tema renkleri
// ─────────────────────────────────────────────
// export const themes: Record<ThemeName, string> = {
//   grape: "#8b5cf6",
//   sunset: "#ff5a2a",
//   mint: "#10b981"
// };

import {
  ShoppingBag,
  Utensils,
  Store,
} from "lucide-react-native";

export const themes: Record<ThemeName, string> = {
  grape: "#8b5cf6",
  sunset: "#ff5a2a",
  mint: "#10b981",
};

export const themeIcons = {
  grape: ShoppingBag,
  sunset: Utensils,
  mint: Store,
} as const;

// ─────────────────────────────────────────────
//  Sabit adım süreleri (ms)
// ─────────────────────────────────────────────
export const DELIVERY_STEPS = {
  /** "Sipariş onaylandı" adımının süresi */
  confirmedDuration: 2000,
  /** "Restoran hazırlıyor" adımının süresi */
  preparingDuration: 8000,
  /**
   * Kurye adrese varmadan kaç ms önce "delivering" statusüne geçilir.
   * handoff statusü = toplam kurye hareketi - bu süre
   */
  deliveringLeadMs: 3000,
} as const;

// ─────────────────────────────────────────────
//  Hız bazında kurye hareket süresi (ms)
//  1 km mesafe kaç ms sürer?
// ─────────────────────────────────────────────
export const DEFAULT_DELIVERY_SPEEDS: DeliverySpeedsConfig = {
  rabbit: {
    baseMs: 0,
    kmMultiplierMs: 36000, // 0.6 dk/km = 36000 ms
  },
  turtle: {
    baseMs: 0,
    kmMultiplierMs: 66000, // 1.1 dk/km = 66000 ms
  },
};

// ─────────────────────────────────────────────
//  Türetilmiş hesaplamalar
// ─────────────────────────────────────────────

/** Kurye hareket süresini hıza göre döner */
export function getCourierMovementDuration(speed: "rabbit" | "turtle", distanceKm: number = 0, speedsConfig?: DeliverySpeedsConfig): number {
  const speeds = speedsConfig || DEFAULT_DELIVERY_SPEEDS;
  return speeds[speed].baseMs + (distanceKm * speeds[speed].kmMultiplierMs);
}

/**
 * Sipariş için tüm timestamp'leri tek yerden hesaplar.
 *
 * Timeline:
 *   placedAt ──[confirmedDuration]──► handoffAt (kurye hareketi başlar)
 *             ──[movementMs - deliveringLeadMs]──► deliveringAt
 *             ──[deliveringLeadMs]──► deliveredAt
 */
export function buildOrderTimeline(
  placedAt: number,
  speed: "rabbit" | "turtle",
  distanceKm: number = 0,
  totalTimeMs?: number,
  speedsConfig?: DeliverySpeedsConfig
): {
  handoffAt: number;
  deliveringAt: number;
  deliveredAt: number;
} {
  const { confirmedDuration, preparingDuration, deliveringLeadMs } = DELIVERY_STEPS;
  const movementMs = totalTimeMs ? Math.max(0, totalTimeMs - confirmedDuration - preparingDuration) : getCourierMovementDuration(speed, distanceKm, speedsConfig);

  const handoffAt    = placedAt + confirmedDuration + preparingDuration;
  const deliveredAt  = handoffAt + movementMs;
  const deliveringAt = deliveredAt - deliveringLeadMs;

  return { handoffAt, deliveringAt, deliveredAt };
}
