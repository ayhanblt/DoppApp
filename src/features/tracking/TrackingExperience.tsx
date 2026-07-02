"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, Order, Store } from "@/shared/lib/types";
import { formatMoney, formatNumber } from "@/shared/lib/format";
import { findProduct } from "@/features/order/cart";
import { getCartTotals } from "@/features/order/cart";
import { getRoute, interpolateAlongRoute, coordinateDistanceKm } from "@/features/tracking/geo";
import { ArrowLeft, Info, Gift, X, Share2, Rocket, Link2, Check } from "lucide-react";
import ReceiptShareModal from "./ReceiptShareModal";

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
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [displayRoute, setDisplayRoute] = useState<[number, number][] | null>(null);
  const [savingsModalOpen, setSavingsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [fastForward, setFastForward] = useState(false);



  const handleShareClick = () => {
    const items = order.items.map(item => {
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
      total: formatMoney(totals.total, locale),
      items
    });

    setReceiptUrl(`/api/receipt?data=${encodeURIComponent(data)}`);
    setShareModalOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    const waypoints = order.routeWaypoints || [order.courierStartCoordinate, order.addressCoordinate];
    getRoute(waypoints).then((route) => {
      if (!cancelled) setDisplayRoute(route);
    });
    return () => { cancelled = true; };
  }, [order.routeWaypoints, order.courierStartCoordinate, order.addressCoordinate]);

  useEffect(() => {
    let offset = 0;
    const duration = order.deliveredAt - order.placedAt;
    const timer = window.setInterval(() => {
      if (fastForward) {
        // Add 5% of total duration every 100ms so it finishes in 2 seconds
        offset += duration * 0.05;
      }
      setNow(Date.now() + offset);
    }, 100);
    return () => window.clearInterval(timer);
  }, [fastForward, order.deliveredAt, order.placedAt]);

  const status = now < order.placedAt + 2000 // Confirmed duration
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
        setCelebrationOpen(true);
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

  const timeLeftMs = Math.max(0, order.deliveredAt - now);
  const minsLeft = Math.floor(timeLeftMs / 60000);
  const secsLeft = Math.floor((timeLeftMs % 60000) / 1000);
  const timeLeftFormatted = `${minsLeft}:${secsLeft.toString().padStart(2, '0')}`;

  const uniqueStores = Array.from(new Set(order.items.map(item => item.storeId)))
    .map(id => stores.find(s => s.id === id))
    .filter((s): s is Store => !!s)
    .sort((a, b) => {
      if (!order.routeWaypoints) return 0;
      const idxA = order.routeWaypoints.findIndex(wp => wp[0] === a.coordinate[0] && wp[1] === a.coordinate[1]);
      const idxB = order.routeWaypoints.findIndex(wp => wp[0] === b.coordinate[0] && wp[1] === b.coordinate[1]);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

  const storeDistances = useMemo(() => {
    let cumulative = 0;
    const waypoints = order.routeWaypoints || [order.courierStartCoordinate, order.addressCoordinate];
    const distances: number[] = [0];
    for (let i = 0; i < waypoints.length - 2; i++) {
      cumulative += coordinateDistanceKm(waypoints[i], waypoints[i+1]);
      distances.push(cumulative);
    }
    let totalDist = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDist += coordinateDistanceKm(waypoints[i], waypoints[i+1]);
    }
    totalDist = totalDist || 1;
    return uniqueStores.map((_, i) => distances[i] / totalDist);
  }, [uniqueStores, order.routeWaypoints, order.courierStartCoordinate, order.addressCoordinate]);

  const getStoreTooltipText = (storeId: string) => {
    const itemsInStore = order.items.filter(i => i.storeId === storeId);
    return itemsInStore.map(item => {
      const p = stores.find(s => s.id === storeId)?.menu.find(p => p.id === item.itemId);
      return p ? `${p.name[locale]} x${item.quantity}` : "";
    }).filter(Boolean).join(", ");
  };

  return (
    <main className="min-h-screen bg-[#fff7ef] p-4 text-zinc-950">
      <section className="mx-auto max-w-7xl py-6 pb-24">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onBack} className="h-10 sm:h-11 px-3 sm:px-4 flex items-center justify-center gap-1 rounded-lg bg-white font-bold shadow-sm text-sm sm:text-base">
            <ArrowLeft size={20} className="-ml-1" />
            <span className="hidden sm:inline">{t.backToApp}</span>
          </button>
          <button onClick={() => setSavingsModalOpen(true)} className="h-10 sm:h-11 px-3 sm:px-4 flex items-center justify-center gap-2 rounded-lg bg-white font-bold shadow-sm transition-colors hover:bg-zinc-50">
            <Gift size={20} className="text-[var(--accent)]" />
            <span className="text-sm font-bold">{t.yourSavings}</span>
          </button>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-orange-600">{t.orderConfirmed}</p>
              <h1 className="text-2xl font-black">{t.liveTracking}</h1>
              <p className="text-sm text-zinc-500">{order.addressText}</p>
            </div>

            {(status === "preparing" || status === "handoff" || status === "delivering") && !fastForward && (
              <div className="flex items-stretch gap-2 w-full sm:w-auto mt-2 sm:mt-0 h-[44px]">
                <div className="flex flex-col items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-2 sm:px-3 h-full min-w-[90px]">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 leading-tight text-center">{t.timeRemainingToDeliver}</span>
                  <span className="font-mono text-sm font-bold leading-none text-orange-600 mt-0.5">{timeLeftFormatted}</span>
                </div>
                <button
                  onClick={() => setFastForward(true)}
                  className="flex h-full flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 sm:px-4 font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 whitespace-nowrap"
                >
                  <Rocket size={16} className="shrink-0" />
                  <span className="text-sm">{t.deliverNow}</span>
                </button>
              </div>
            )}
          </div>
          <div className="mt-5">
            <TrackingMap
              stores={uniqueStores.map((s, idx) => ({ 
                coordinate: s.coordinate, 
                type: s.type,
                visited: status === "delivered" || ((status === "handoff" || status === "delivering") && progress >= storeDistances[idx]),
                name: s.name[locale],
                tooltipText: getStoreTooltipText(s.id),
                logo: s.logo
              }))}
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
          <div className="mt-4 text-xs italic text-gray-500 flex items-start">
            <Info size={12} className="mr-1 mt-0.5" />
            <span >{t.noRealDelivery}</span>
          </div>
          <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm">
            {order.items.map((cartItem) => {
              const item = findProduct(stores, cartItem);
              return item ? <p key={cartItem.id}>{item.name[locale]} × {cartItem.quantity}</p> : null;
            })}
          </div>
        </div>
      </section>

      {savingsModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative">
            <button onClick={() => setSavingsModalOpen(false)} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200">
              <X size={18} />
            </button>
            <h3 className="mb-4 text-xl font-black">{t.orderSummary}</h3>

            <div className="mb-4 space-y-2 rounded-xl bg-zinc-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">{t.amount}</span>
                <span className="font-bold">{formatMoney(totals.total, locale)}</span>
              </div>
              {totals.calories > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">{t.calories}</span>
                  <span className="font-bold">{formatNumber(totals.calories, locale)} kcal</span>
                </div>
              )}
            </div>

            <p className="mb-6 text-center text-sm italic text-zinc-500">
              {t.savingsSummary(
                formatMoney(totals.total, locale),
                totals.calories > 0 ? formatNumber(totals.calories, locale) : ""
              )}
            </p>

            <button onClick={() => setSavingsModalOpen(false)} className="w-full rounded-xl bg-[var(--accent)] py-3 font-bold text-white">
              {t.awesome}
            </button>
          </div>
        </div>
      )}

      {celebrationOpen && (
        <CelebrationPopup
          locale={locale}
          calories={totals.calories}
          totalPrice={totals.total}
          cart={order?.items || []}
          onClose={() => setCelebrationOpen(false)}
        />
      )}

      {shareModalOpen && (
        <ReceiptShareModal imageUrl={receiptUrl} onClose={() => setShareModalOpen(false)} />
      )}

      {status === "delivered" && celebrationShown && !celebrationOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-zinc-200 flex justify-center z-40">
          <div className="w-full max-w-md flex items-center gap-2">
            <button
              onClick={handleShareClick}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-black text-white hover:opacity-90 shadow-md transition-all bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              {t.shareOrder}
              <Share2 size={18} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
