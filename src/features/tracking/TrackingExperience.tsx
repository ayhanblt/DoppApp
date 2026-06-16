"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, Order, Store } from "@/shared/lib/types";
import { formatMoney, formatNumber } from "@/shared/lib/format";
import { findProduct } from "@/features/order/cart";
import { getCartTotals } from "@/features/order/cart";
import { getRoute, interpolateAlongRoute } from "@/features/tracking/geo";

const TrackingMap = dynamic(() => import("@/features/tracking/TrackingMap"), { ssr: false });
const CelebrationPopup = dynamic(() => import("@/features/tracking/CelebrationPopup"), { ssr: false });

export default function TrackingExperience({
  locale,
  order,
  totals,
  stores,
  onBack
}: {
  locale: Locale;
  order: Order;
  totals: ReturnType<typeof getCartTotals>;
  stores: Store[];
  onBack: () => void;
}) {
  const t = dictionaries[locale];
  const [now, setNow] = useState(Date.now());
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [displayRoute, setDisplayRoute] = useState<[number, number][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRoute(order.courierStartCoordinate, order.addressCoordinate).then((route) => {
      if (!cancelled) setDisplayRoute(route);
    });
    return () => { cancelled = true; };
  }, [order.courierStartCoordinate, order.addressCoordinate]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const status = now < order.placedAt + 2000
    ? "confirmed"
    : now < order.handoffAt
      ? "preparing"
      : now < order.deliveringAt
        ? "handoff"
        : now < order.deliveredAt
          ? "delivering"
          : "delivered";

  useEffect(() => {
    if (status === "delivered" && !celebrationShown) {
      const timer = setTimeout(() => {
        setShowCelebration(true);
        setCelebrationShown(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, celebrationShown]);

  const courierStartTime = order.handoffAt;
  const rawProgress = (now - courierStartTime) / (order.deliveredAt - courierStartTime);
  const progress = Math.min(1, Math.max(0, rawProgress));

  const isCourierMoving = status === "handoff" || status === "delivering" || status === "delivered";

  const courier = isCourierMoving
    ? displayRoute && displayRoute.length > 1
      ? interpolateAlongRoute(displayRoute, status === "delivered" ? 1 : progress)
      : order.courierStartCoordinate
    : undefined;

  return (
    <main className="min-h-screen bg-[#fff7ef] p-4 text-zinc-950">
      <section className="mx-auto max-w-7xl py-6">
        <button onClick={onBack} className="mb-4 rounded-lg bg-white px-4 py-2 font-bold shadow-sm">{t.backToApp}</button>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-orange-600">{t.orderConfirmed}</p>
              <h1 className="text-2xl font-black">{t.liveTracking}</h1>
              <p className="text-sm text-zinc-500">{order.addressText}</p>
            </div>
            <div className="rounded-lg bg-orange-50 px-4 py-3 text-right">
              <p className="text-sm text-zinc-500">{t.savedCalories}</p>
              <strong>{formatNumber(totals.calories, locale)} kcal</strong>
            </div>
          </div>
          <div className="mt-5">
            <TrackingMap
              restaurant={order.courierStartCoordinate}
              address={order.addressCoordinate}
              courier={courier}
              routePoints={displayRoute ?? undefined}
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {(["confirmed", "preparing", "handoff", "delivering", "delivered"] as const).map((step) => (
              <div key={step} className={`rounded-lg border p-3 text-sm font-bold ${step === status ? "border-orange-500 bg-orange-50 text-orange-700" : "border-black/10 text-zinc-500"}`}>
                {t.status[step]}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-500">{t.noRealDelivery} {t.mapCredit}</p>
          <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm">
            {order.items.map((cartItem) => {
              const item = findProduct(stores, cartItem);
              return item ? <p key={cartItem.id}>{item.name[locale]} × {cartItem.quantity}</p> : null;
            })}
          </div>
        </div>
      </section>

      {showCelebration && (
        <CelebrationPopup
          locale={locale}
          calories={totals.calories}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </main>
  );
}
