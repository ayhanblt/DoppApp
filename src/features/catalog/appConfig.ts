import type { ThemeName } from "@/shared/lib/types";

/**
 * Merkezi uygulama konfigürasyonu
 * 
 * Timeline:
 * 1. confirmed: 2000ms (sabit)
 * 2. preparing: 8000ms (sabit)
 * 3. handoff: (SPEED_DELIVERY_MS - DELIVERING_DURATION) 
 * 4. delivering: 3000ms (son 3 saniye)
 * 5. delivered: kurye adresa vardığında
 */

// Tema renkleri
export const THEMES: Record<ThemeName, string> = {
  grape: "#8b5cf6",
  sunset: "#ff5a2a",
  ocean: "#2563eb",
  mint: "#10b981"
};

// Sabit adım süreleri (milisaniye)
export const DELIVERY_STEPS = {
  confirmedDuration: 2000,    // Sipariş onaylandı
  preparingDuration: 8000,    // Restoran hazırlıyor
  deliveringDuration: 3000    // Son 3 saniye delivering
} as const;

// Hız bazında toplam teslimat süresi (restoran → adres, mesafeye göre değişken)
// Formül: baseMs + (distanceKm × kmMultiplierMs)
export const DELIVERY_SPEEDS = {
  rabbit: {
    totalMs: 10000,  // Tavşan: toplam 10 saniye
    baseMs: 10000,
    kmMultiplierMs: 0  // Mesafe eklentisi: 0 (sabit hız)
  },
  turtle: {
    totalMs: 16000,  // Kaplumbağa: toplam 16 saniye
    baseMs: 16000,
    kmMultiplierMs: 0  // Mesafe eklentisi: 0 (sabit hız)
  }
} as const;

/**
 * Kurye hareket süresi hesapla
 * @param speed 'rabbit' | 'turtle'
 * @param distanceKm Restoran-adres mesafesi (km)
 * @returns Toplam hareket süresi (ms)
 */
export function calculateCourierMovementDuration(
  speed: "rabbit" | "turtle",
  distanceKm: number
): number {
  const config = DELIVERY_SPEEDS[speed];
  return Math.round(config.baseMs + distanceKm * config.kmMultiplierMs);
}

/**
 * Handoff süresi hesapla (kurye hareketi - son 3s delivering)
 * @param courierMovementDuration Toplam kurye hareket süresi
 * @returns Handoff stepi süresi (ms)
 */
export function calculateHandoffDuration(courierMovementDuration: number): number {
  return courierMovementDuration - DELIVERY_STEPS.deliveringDuration;
}

/**
 * Toplam teslim süresi hesapla
 * confirmed + preparing + handoff + movement
 */
export function calculateTotalDeliveryTime(courierMovementDuration: number): number {
  return (
    DELIVERY_STEPS.confirmedDuration +
    DELIVERY_STEPS.preparingDuration +
    courierMovementDuration
  );
}
