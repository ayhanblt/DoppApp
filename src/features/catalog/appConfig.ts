import type { ThemeName } from "@/shared/lib/types";

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
  Hamburger,
  Milk,
} from "lucide-react";

export const themes: Record<ThemeName, string> = {
  grape: "#8b5cf6",
  sunset: "#ff5a2a",
  mint: "#10b981",
};

export const themeIcons = {
  grape: ShoppingBag,
  sunset: Hamburger,
  mint: Milk,
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
//  Değiştirmek istersen sadece buraya dokun.
// ─────────────────────────────────────────────
export const DELIVERY_SPEEDS = {
  rabbit: {
    /** Toplam kurye hareket süresi (ms) — mesafeden bağımsız */
    movementMs: 10000,
  },
  turtle: {
    movementMs: 18000,
  },
} as const;

// ─────────────────────────────────────────────
//  Türetilmiş hesaplamalar
// ─────────────────────────────────────────────

/** Kurye hareket süresini hıza göre döner */
export function getCourierMovementDuration(speed: "rabbit" | "turtle"): number {
  return DELIVERY_SPEEDS[speed].movementMs;
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
  speed: "rabbit" | "turtle"
): {
  handoffAt: number;
  deliveringAt: number;
  deliveredAt: number;
} {
  const { confirmedDuration, preparingDuration, deliveringLeadMs } = DELIVERY_STEPS;
  const movementMs = getCourierMovementDuration(speed);

  const handoffAt    = placedAt + confirmedDuration + preparingDuration;
  const deliveredAt  = handoffAt + movementMs;
  const deliveringAt = deliveredAt - deliveringLeadMs;

  return { handoffAt, deliveringAt, deliveredAt };
}
