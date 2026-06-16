"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, HelpCircle, MapPin, Search, ShoppingCart, SlidersHorizontal, Trash2 } from "lucide-react";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Address, Locale, Order, Store, ThemeName } from "@/shared/lib/types";
import { formatMoney, formatNumber, uid } from "@/shared/lib/format";
import { getCartTotals, findProduct, getItemUnitPrice } from "@/features/order/cart";
import { buildOrderTimeline, themeIcons, themes } from "@/features/catalog/appConfig";
import { useCatalog } from "./CatalogContext";
import { geocodeAddress } from "@/features/tracking/geo";
import { useState, useEffect } from "react";

const AddressPickerMap = dynamic(() => import("@/features/tracking/AddressPickerMap"), { ssr: false });
const TrackingExperience = dynamic(() => import("@/features/tracking/TrackingExperience"), { ssr: false });

export function CatalogLayout({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const t = dictionaries[locale];
  const {
    deliveryAddress, setDeliveryAddress,
    addressModalOpen, setAddressModalOpen,
    query, setQuery,
    speed,
    cart, setCart,
    checkoutOpen, setCheckoutOpen,
    infoOpen, setInfoOpen,
    order, setOrder,
    stores, setStores
  } = useCatalog();

  const pathname = usePathname();
  const router = useRouter();

  // Determine current theme based on path
  let currentTheme: ThemeName = "sunset";
  if (pathname.includes("/shop")) currentTheme = "grape";
  else if (pathname.includes("/market")) currentTheme = "mint";

  const themeColor = themes[currentTheme];
  const totals = getCartTotals(stores, cart);
  const firstStore = stores.find((store) => store.id === cart[0]?.storeId) ?? stores[0];

  function saveDeliveryAddress(address: Address) {
    window.localStorage.setItem("deliveryAddress", JSON.stringify(address));
    setDeliveryAddress(address);
    setAddressModalOpen(false);
  }

  function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deliveryAddress) {
      setAddressModalOpen(true);
      return;
    }
    const data = new FormData(event.currentTarget);
    const now = Date.now();
    const addressCoordinate: [number, number] = [deliveryAddress.latitude, deliveryAddress.longitude];

    const { handoffAt, deliveringAt, deliveredAt } = buildOrderTimeline(now, speed);

    setOrder({
      id: uid("order"),
      customerName: String(data.get("name") || "Demo"),
      phone: String(data.get("phone") || ""),
      addressText: `${deliveryAddress.title}: ${deliveryAddress.address}`,
      note: String(data.get("note") || ""),
      addressCoordinate,
      storeCoordinate: firstStore.coordinate,
      courierStartCoordinate: firstStore.coordinate,
      speed,
      status: "confirmed",
      placedAt: now,
      handoffAt,
      deliveringAt,
      deliveredAt,
      items: cart
    });
    setCheckoutOpen(false);
  }

  if (order) {
    return (
      <TrackingExperience
        locale={locale}
        order={order}
        totals={totals}
        stores={stores}
        onBack={() => setOrder(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7ef] text-zinc-950" style={{ "--accent": themeColor } as React.CSSProperties}>
      <header className="sticky top-0 z-30 bg-[var(--accent)] px-4 pb-4 pt-3 text-white shadow-lg shadow-black/10 transition-colors duration-300">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr_1fr] lg:items-center">
            <div>
              <Link href={`/${locale}`} >
                <img className="w-50 object-contain" src="/images/doppapp-logo.webp?v=5" alt={t.appName} />
              </Link>
            </div>
            <button
              className="flex items-center gap-3 rounded-lg bg-white/14 px-3 py-2 text-left"
              onClick={() => setAddressModalOpen(true)}
            >
              <MapPin size={18} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold opacity-80">{t.deliveryAddress}</span>
                <span className="block truncate text-sm font-black">{deliveryAddress ? `${deliveryAddress.title} · ${deliveryAddress.address}` : t.addressRequired}</span>
              </span>
              <span className="shrink-0 text-xs font-black underline">{t.changeAddress}</span>
            </button>
            <div className="flex items-center justify-start gap-2 lg:justify-end">
              <button className="relative flex h-10 items-center gap-2 rounded-lg bg-white/18 px-3 font-black" onClick={() => setCheckoutOpen(true)} aria-label={t.cart}>
                <ShoppingCart size={18} />
                <span className="text-sm">{t.cart}</span>
                {cart.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-[var(--accent)]">{cart.length}</span>}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr_1fr] lg:items-center">
            <div className="flex gap-2">
              <Link href={`/${locale}/shop`} aria-label="shop" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 shadow-sm" style={{ background: themes["grape"] }}>
                {(() => { const Icon = themeIcons["grape"]; return <Icon size={18} className="text-white" />; })()}
              </Link>
              <Link href={`/${locale}/food`} aria-label="food" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 shadow-sm" style={{ background: themes["sunset"] }}>
                {(() => { const Icon = themeIcons["sunset"]; return <Icon size={18} className="text-white" />; })()}
              </Link>
              <Link href={`/${locale}/market`} aria-label="market" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 shadow-sm" style={{ background: themes["mint"] }}>
                {(() => { const Icon = themeIcons["mint"]; return <Icon size={18} className="text-white" />; })()}
              </Link>
            </div>
            <label className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-zinc-900">
              <Search size={18} className="text-zinc-500" />
              <input className="w-full bg-transparent outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
            </label>
            <div className="flex justify-start gap-2 lg:justify-end">
              <Link className="grid h-9 w-9 place-items-center rounded-full bg-white/18" href={pathname.replace(`/${locale}`, `/${locale === "tr" ? "en" : "tr"}`)} aria-label="language">
                <span className="font-bold text-xs">{locale === "tr" ? "EN" : "TR"}</span>
              </Link>
              <Link className="grid h-9 w-9 place-items-center rounded-full bg-white/18" href={`/${locale}/admin`} aria-label={t.admin}>
                <SlidersHorizontal size={18} />
              </Link>
              <button className="grid h-9 w-9 place-items-center rounded-full bg-white/18" onClick={() => setInfoOpen(true)} aria-label={t.info}>
                <HelpCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {children}

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[var(--accent)]">{t.total}</p>
            <p className="text-2xl font-black">{formatMoney(totals.total, locale)}</p>
          </div>
          <button disabled={!cart.length} className="flex min-h-14 items-center gap-2 rounded-lg bg-[var(--accent)] px-8 font-black text-white disabled:opacity-45" onClick={() => setCheckoutOpen(true)}>
            <Check size={18} /> {t.order}
          </button>
        </div>
      </footer>

      {checkoutOpen && (
        <div className="fixed inset-0 z-40 bg-black/35 p-4">
          <form onSubmit={createOrder} className="mx-auto max-h-[92vh] max-w-lg overflow-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">{t.checkout}</h3>
              <button type="button" onClick={() => setCheckoutOpen(false)} className="h-9 w-9 rounded-full bg-zinc-100">×</button>
            </div>
            <div className="mt-4 space-y-3">
              {cart.length === 0 && <p className="rounded-lg bg-zinc-50 p-4 text-zinc-500">{t.emptyCart}</p>}
              {cart.map((cartItem) => {
                const item = findProduct(stores, cartItem);
                return item ? (
                  <div key={cartItem.id} className="flex items-center justify-between rounded-lg border border-black/10 p-3">
                    <div>
                      <p className="font-bold">{item.name[locale]} × {cartItem.quantity}</p>
                      <p className="text-sm text-zinc-500">{formatMoney(getItemUnitPrice(item, cartItem), locale)}</p>
                    </div>
                    <button type="button" onClick={() => setCart((current) => current.filter((candidate) => candidate.id !== cartItem.id))} className="text-zinc-400"><Trash2 size={18} /></button>
                  </div>
                ) : null;
              })}
              <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                <p>{t.deliveryFee}: {formatMoney(totals.deliveryFee, locale)}</p>
                <p>{t.savedCalories}: {formatNumber(totals.calories, locale)} kcal</p>
                <strong>{t.total}: {formatMoney(totals.total, locale)}</strong>
              </div>
              <input className="w-full rounded-lg border border-black/10 p-3" name="name" placeholder={t.customerName} required />
              <input className="w-full rounded-lg border border-black/10 p-3" name="phone" placeholder={t.phone} />
              <div className="rounded-lg border border-black/10 p-3 text-sm">
                <p className="font-black">{t.deliveryAddress}</p>
                <p className="mt-1 text-zinc-600">{deliveryAddress ? `${deliveryAddress.title} · ${deliveryAddress.address}` : t.addressRequired}</p>
                <button className="mt-2 text-sm font-black text-[var(--accent)]" type="button" onClick={() => setAddressModalOpen(true)}>{t.changeAddress}</button>
              </div>
              <input className="w-full rounded-lg border border-black/10 p-3" name="note" placeholder={t.note} />
              <button disabled={!cart.length} className="w-full rounded-lg bg-[var(--accent)] py-4 font-black text-white disabled:opacity-45">{t.demoOrder}</button>
            </div>
          </form>
        </div>
      )}

      {infoOpen && (
        <div className="fixed inset-0 z-40 bg-black/35 p-4">
          <div className="mx-auto max-h-[92vh] max-w-lg overflow-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">{t.appName}</h3>
              <button onClick={() => setInfoOpen(false)} className="h-9 w-9 rounded-full bg-zinc-100">×</button>
            </div>
            <p className="mt-4 text-zinc-700">{t.tagline}</p>
            <div className="mt-4 space-y-3 text-sm text-zinc-600">
              <p>
                🍽️{" "}
                {locale === "tr"
                  ? "Gerçekmiş gibi hissettiren sahte restoran deneyimi — menüler, sipariş akışı ve seçimler tamamen simüle edilir."
                  : "A fake restaurant experience that feels real — menus, ordering flow, and choices are fully simulated."}
              </p>

              <p>
                🛒{" "}
                {locale === "tr"
                  ? "Sepet ve sipariş süreci gerçek ödeme olmadan çalışır, sadece deneyim ve etkileşim odaklıdır."
                  : "Cart and ordering work without any real payment — purely for experience and interaction."}
              </p>

              <p>
                🔥{" "}
                {locale === "tr"
                  ? "Dopamin odaklı etkileşimlerle açlık hissini bastırır, kalori almadan tatmin hissi sunar."
                  : "Dopamine-driven interactions that reduce cravings and simulate satisfaction without calories."}
              </p>
            </div>
          </div>
        </div>
      )}

      {addressModalOpen && (
        <AddressModal
          initialAddress={deliveryAddress}
          locale={locale}
          onCancel={deliveryAddress ? () => setAddressModalOpen(false) : undefined}
          onSave={saveDeliveryAddress}
        />
      )}
    </main>
  );
}

function AddressModal({
  initialAddress,
  locale,
  onCancel,
  onSave
}: {
  initialAddress: Address | null;
  locale: Locale;
  onCancel?: () => void;
  onSave: (address: Address) => void;
}) {
  const t = dictionaries[locale];
  const [title, setTitle] = useState(initialAddress?.title ?? t.home);
  const [address, setAddress] = useState(initialAddress?.address ?? "");
  const [coordinate, setCoordinate] = useState<[number, number]>(
    initialAddress ? [initialAddress.latitude, initialAddress.longitude] : [39.9208, 32.8541]
  );
  const [mapOpen, setMapOpen] = useState(Boolean(initialAddress));
  const [message, setMessage] = useState("");

  async function findOnMap() {
    setMessage("");
    if (address.trim()) {
      const result = await geocodeAddress(address);
      if (result) {
        setCoordinate(result);
        setMessage(t.addressFound);
      } else {
        setMessage(t.addressMissing);
      }
    }
    setMapOpen(true);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      id: initialAddress?.id ?? uid("address"),
      title: title.trim(),
      address: address.trim(),
      latitude: coordinate[0],
      longitude: coordinate[1]
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/45 p-4">
      <form onSubmit={submit} className="mx-auto max-h-[94vh] max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--accent)]">{t.deliveryAddress}</p>
            <h3 className="text-2xl font-black">{t.addressModalTitle}</h3>
            <p className="mt-1 text-sm text-zinc-500">{t.addressModalHint}</p>
          </div>
          {onCancel && <button type="button" onClick={onCancel} className="h-9 w-9 rounded-full bg-zinc-100">×</button>}
        </div>
        <div className="mt-5 grid gap-3">
          <input className="w-full rounded-lg border border-black/10 p-3" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.addressTitle} required />
          <textarea className="min-h-24 w-full rounded-lg border border-black/10 p-3" value={address} onChange={(event) => setAddress(event.target.value)} placeholder={t.addressDescription} required />
          <button className="rounded-lg border border-black/10 px-4 py-3 font-black" type="button" onClick={findOnMap}>{t.pickFromMap}</button>
          {message && <p className="text-sm font-bold text-[var(--accent)]">{message}</p>}
          {mapOpen && (
            <div className="space-y-2">
              <AddressPickerMap value={coordinate} onChange={setCoordinate} />
              <p className="text-xs font-medium text-zinc-500">
                {coordinate[0].toFixed(5)}, {coordinate[1].toFixed(5)}
              </p>
            </div>
          )}
          <button disabled={!mapOpen} className="rounded-lg bg-[var(--accent)] py-4 font-black text-white disabled:opacity-45">
            {t.saveAddress}
          </button>
        </div>
      </form>
    </div>
  );
}
