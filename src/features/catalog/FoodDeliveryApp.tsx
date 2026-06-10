"use client";

/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, HelpCircle, Languages, MapPin, Minus, Plus, Search, ShoppingCart, SlidersHorizontal, Trash2 } from "lucide-react";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Address, CartItem, CartSelection, DeliverySpeed, Locale, MenuItem, Order, Restaurant, ThemeName } from "@/shared/lib/types";
import { formatMoney, formatNumber, uid } from "@/shared/lib/format";
import { getCartTotals, findMenuItem, getItemUnitPrice } from "@/features/order/cart";
import { coordinateDistanceKm, createCourierStartCoordinate, geocodeAddress, interpolateRoute } from "@/features/tracking/geo";
import { getRestaurantsAroundAddress, getRestaurantsOnRoadsAroundAddress, getStoredRestaurants } from "@/features/catalog/data";

const TrackingMap = dynamic(() => import("@/features/tracking/TrackingMap"), { ssr: false });
const AddressPickerMap = dynamic(() => import("@/features/tracking/AddressPickerMap"), { ssr: false });

const themes: Record<ThemeName, string> = {
  grape: "#8b5cf6",
  sunset: "#ff5a2a",
  ocean: "#2563eb",
  mint: "#10b981"
};

type ActiveItem = { restaurant: Restaurant; item: MenuItem };

export function FoodDeliveryApp({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const [restaurants, setRestaurants] = useState<Restaurant[]>(getStoredRestaurants);
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("sunset");
  const [query, setQuery] = useState("");
  const [speed, setSpeed] = useState<DeliverySpeed>("rabbit");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [selections, setSelections] = useState<CartSelection>({});
  const [quantity, setQuantity] = useState(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => {
    let mounted = true;
    const rawAddress = window.localStorage.getItem("deliveryAddress");
    if (!rawAddress) {
      setAddressModalOpen(true);
      return () => {
        mounted = false;
      };
    }

    try {
      const storedAddress = JSON.parse(rawAddress) as Address;
      setDeliveryAddress(storedAddress);
      const center: [number, number] = [storedAddress.latitude, storedAddress.longitude];
      setRestaurants(getRestaurantsAroundAddress(center));
      getRestaurantsOnRoadsAroundAddress(center).then((roadRestaurants) => {
        if (mounted) setRestaurants(roadRestaurants);
      });
    } catch {
      window.localStorage.removeItem("deliveryAddress");
      setAddressModalOpen(true);
    }

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase(locale);
    return restaurants.filter((restaurant) => {
      const haystack = [
        restaurant.name[locale],
        restaurant.category[locale],
        ...restaurant.menu.flatMap((item) => [item.name[locale], item.description[locale]])
      ].join(" ").toLocaleLowerCase(locale);
      return haystack.includes(normalized);
    });
  }, [locale, query, restaurants]);

  const totals = getCartTotals(restaurants, cart);
  const themeColor = themes[theme];
  const firstRestaurant = restaurants.find((restaurant) => restaurant.id === cart[0]?.restaurantId) ?? restaurants[0];

  function openItem(restaurant: Restaurant, item: MenuItem) {
    const initial: CartSelection = {};
    item.optionGroups?.forEach((group) => {
      initial[group.id] = group.required ? [group.options[0].id] : [];
    });
    setSelections(initial);
    setQuantity(1);
    setActiveItem({ restaurant, item });
  }

  function toggleSelection(groupId: string, optionId: string, multiple?: boolean) {
    setSelections((current) => {
      const selected = current[groupId] ?? [];
      return {
        ...current,
        [groupId]: multiple
          ? selected.includes(optionId)
            ? selected.filter((id) => id !== optionId)
            : [...selected, optionId]
          : [optionId]
      };
    });
  }

  function addActiveItem() {
    if (!activeItem) return;
    setCart((current) => [
      ...current,
      {
        id: uid("cart"),
        restaurantId: activeItem.restaurant.id,
        itemId: activeItem.item.id,
        quantity,
        selections
      }
    ]);
    setActiveItem(null);
  }

  function saveDeliveryAddress(address: Address) {
    const center: [number, number] = [address.latitude, address.longitude];
    window.localStorage.setItem("deliveryAddress", JSON.stringify(address));
    setDeliveryAddress(address);
    setRestaurants(getRestaurantsAroundAddress(center));
    getRestaurantsOnRoadsAroundAddress(center).then(setRestaurants);
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
    const restaurantDistanceKm = coordinateDistanceKm(firstRestaurant.coordinate, addressCoordinate);
    const duration = Math.round((speed === "rabbit" ? 65000 : 130000) + restaurantDistanceKm * (speed === "rabbit" ? 18000 : 32000));
    const courierStartCoordinate = createCourierStartCoordinate(firstRestaurant.coordinate, firstRestaurant.id.length + cart.length);
    setOrder({
      id: uid("order"),
      customerName: String(data.get("name") || "Demo"),
      phone: String(data.get("phone") || ""),
      addressText: `${deliveryAddress.title}: ${deliveryAddress.address}`,
      note: String(data.get("note") || ""),
      addressCoordinate,
      restaurantCoordinate: firstRestaurant.coordinate,
      courierStartCoordinate,
      speed,
      status: "confirmed",
      placedAt: now,
      handoffAt: now + 40000,
      deliveredAt: now + duration,
      items: cart
    });
    setCheckoutOpen(false);
  }

  function resetAll() {
    setCart([]);
    setOrder(null);
    setQuery("");
  }

  if (order) {
    return (
      <TrackingExperience
        locale={locale}
        order={order}
        totals={totals}
        restaurants={restaurants}
        onBack={() => setOrder(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7ef] text-zinc-950" style={{ "--accent": themeColor } as React.CSSProperties}>
      <header className="sticky top-0 z-30 bg-[var(--accent)] px-4 pb-4 pt-3 text-white shadow-lg shadow-black/10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr_1fr] lg:items-center">
            <div>
              <Link href={`/${locale}`} className="text-2xl font-black leading-none">{t.appName}</Link>
              <p className="mt-1 text-xs font-semibold opacity-85 sm:text-sm">{t.tagline}</p>
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
              <a className="rounded-lg bg-white/14 px-3 py-2 text-sm font-black" href="#restaurants">{t.restaurants}</a>
              <button className="relative flex h-10 items-center gap-2 rounded-lg bg-white/18 px-3 font-black" onClick={() => setCheckoutOpen(true)} aria-label={t.cart}>
                <ShoppingCart size={18} />
                <span className="text-sm">{t.cart}</span>
                {cart.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-[var(--accent)]">{cart.length}</span>}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr_1fr] lg:items-center">
            <div className="flex gap-2">
              {(Object.keys(themes) as ThemeName[]).map((name) => (
                <button key={name} aria-label={name} className="h-9 w-9 rounded-full border border-white/30 shadow-sm" style={{ background: themes[name] }} onClick={() => setTheme(name)} />
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-zinc-900">
              <Search size={18} className="text-zinc-500" />
              <input className="w-full bg-transparent outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
            </label>
            <div className="flex justify-start gap-2 lg:justify-end">
            <Link className="grid h-9 w-9 place-items-center rounded-full bg-white/18" href={`/${locale === "tr" ? "en" : "tr"}`} aria-label="language">
              <Languages size={18} />
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

      <section className="border-b border-orange-200 bg-white/70 px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold">{t.deliveryType}</p>
            <div className="grid grid-cols-2 gap-2">
            {(["rabbit", "turtle"] as DeliverySpeed[]).map((mode) => (
              <button
                key={mode}
                className={`rounded-lg border px-3 py-2 text-left ${speed === mode ? "border-[var(--accent)] bg-white shadow-md" : "border-black/10 bg-white/70"}`}
                onClick={() => setSpeed(mode)}
              >
                <span className="flex items-center gap-2 font-black">
                  <span className="text-xl" aria-hidden="true">{mode === "rabbit" ? "🐇" : "🐢"}</span>
                  {t[mode]}
                </span>
                <span className="text-xs text-zinc-500">{t[`${mode}Hint`]}</span>
              </button>
            ))}
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500">🚧 {t.demoNotice}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4">
        <div id="restaurants" className="mt-3 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black">{filtered.length} {t.restaurants} 🍴</h2>
            <p className="text-sm text-zinc-500">{t.chooseItems}</p>
          </div>
          <button className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-zinc-600 shadow-sm" onClick={resetAll}>{t.reset}</button>
        </div>

        <div className="mt-4 grid gap-4 pb-28 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((restaurant) => (
            <article key={restaurant.id} className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-black/5 bg-gradient-to-r from-orange-50 to-white p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{restaurant.emoji}</span>
                  <div>
                    {restaurant.badge && <span className="rounded-full bg-[var(--accent)]/10 px-2 py-1 text-xs font-bold text-[var(--accent)]">{restaurant.badge[locale]}</span>}
                    <h3 className="mt-1 text-lg font-black">{restaurant.name[locale]}</h3>
                    <p className="text-sm text-zinc-500">{restaurant.category[locale]} · ★ {restaurant.rating} · {formatNumber(restaurant.reviews, locale)}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-zinc-600">
                  <p>⏱ {restaurant.eta} dk</p>
                  <p>🏍 {formatMoney(restaurant.deliveryFee, locale)}</p>
                </div>
              </div>
              <div className="space-y-3 p-4">
                {restaurant.menu.map((item) => (
                  <div key={item.id} className="grid grid-cols-[80px_1fr] gap-3 rounded-lg border border-black/10 p-3">
                    <img className="h-20 w-20 rounded-md object-cover" src={item.image} alt={item.name[locale]} />
                    <div className="min-w-0">
                      <h4 className="font-black">{item.name[locale]}</h4>
                      <p className="text-sm text-zinc-500">{item.description[locale]}</p>
                      <p className="mt-1 text-sm font-bold text-emerald-700">🔥 {formatNumber(item.calories, locale)} kcal</p>
                      {item.optionGroups && <p className="mt-1 text-xs text-[var(--accent)]">{t.optionsAvailable} ›</p>}
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-3">
                      <strong>{formatMoney(item.price, locale)}</strong>
                      <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-black text-white" onClick={() => openItem(restaurant, item)}>{t.add}</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

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

      {activeItem && (
        <div className="fixed inset-0 z-40 bg-black/35 p-4">
          <div className="mx-auto max-h-[92vh] max-w-lg overflow-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex gap-4">
              <img className="h-24 w-24 rounded-lg object-cover" src={activeItem.item.image} alt="" />
              <div className="flex-1">
                <h3 className="text-xl font-black">{activeItem.item.name[locale]}</h3>
                <p className="text-sm text-zinc-500">{activeItem.item.description[locale]}</p>
              </div>
              <button onClick={() => setActiveItem(null)} className="h-9 w-9 rounded-full bg-zinc-100">×</button>
            </div>
            <div className="mt-5 space-y-4">
              {activeItem.item.optionGroups?.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 font-black">{group.label[locale]} {group.required && <span className="text-xs text-[var(--accent)]">{t.required}</span>}</p>
                  <div className="grid gap-2">
                    {group.options.map((option) => {
                      const selected = selections[group.id]?.includes(option.id);
                      return (
                        <button key={option.id} className={`flex items-center justify-between rounded-lg border p-3 text-left ${selected ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-black/10"}`} onClick={() => toggleSelection(group.id, option.id, group.multiple)}>
                          <span className="font-bold">{option.label[locale]}</span>
                          <span className="text-sm text-zinc-500">{option.priceDelta === 0 ? "0" : formatMoney(option.priceDelta, locale)} {selected && "✓"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="font-black">{t.quantity}</span>
                <div className="flex items-center gap-3">
                  <button className="grid h-9 w-9 place-items-center rounded-full bg-white" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button>
                  <strong>{quantity}</strong>
                  <button className="grid h-9 w-9 place-items-center rounded-full bg-white" onClick={() => setQuantity((value) => value + 1)}><Plus size={16} /></button>
                </div>
              </div>
              <button className="w-full rounded-lg bg-[var(--accent)] py-4 font-black text-white" onClick={addActiveItem}>
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

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
                const item = findMenuItem(restaurants, cartItem);
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
              <h3 className="text-xl font-black">{t.appName} 🍱</h3>
              <button onClick={() => setInfoOpen(false)} className="h-9 w-9 rounded-full bg-zinc-100">×</button>
            </div>
            <p className="mt-4 text-zinc-700">{t.tagline}</p>
            <div className="mt-4 space-y-3 text-sm text-zinc-600">
              <p>🍽️ {locale === "tr" ? "Sahte restoranlar, gerçekçi menüler ve opsiyonlar." : "Fake restaurants, realistic menus, and options."}</p>
              <p>🛒 {locale === "tr" ? "Sepet ve demo sipariş akışı ödeme almadan çalışır." : "Cart and demo checkout run without payment."}</p>
              <p>🗺️ {locale === "tr" ? "Takip ekranı ücretsiz OpenStreetMap haritası kullanır." : "Tracking uses the free OpenStreetMap map layer."}</p>
              <p>🔥 {locale === "tr" ? "Sipariş sonunda yemediğin kaloriler hesaplanır." : "Calories you did not consume are calculated."}</p>
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

function TrackingExperience({ locale, order, totals, restaurants, onBack }: { locale: Locale; order: Order; totals: ReturnType<typeof getCartTotals>; restaurants: Restaurant[]; onBack: () => void }) {
  const t = dictionaries[locale];
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const status = now < order.placedAt + 18000 ? "confirmed" : now < order.handoffAt ? "preparing" : now < order.handoffAt + 10000 ? "handoff" : now < order.deliveredAt ? "delivering" : "delivered";
  const progress = status === "delivering" || status === "delivered" ? (now - order.handoffAt) / (order.deliveredAt - order.handoffAt) : 0;
  const courier = status === "delivering" || status === "delivered"
    ? interpolateRoute(order.courierStartCoordinate, order.addressCoordinate, status === "delivered" ? 1 : progress)
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
            <TrackingMap restaurant={order.restaurantCoordinate} address={order.addressCoordinate} courier={courier} />
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
              const item = findMenuItem(restaurants, cartItem);
              return item ? <p key={cartItem.id}>{item.name[locale]} × {cartItem.quantity}</p> : null;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
