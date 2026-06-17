"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Check, HelpCircle, MapPin, Search, ShoppingCart, SlidersHorizontal, Trash2, Crosshair, Rabbit, Turtle } from "lucide-react";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Address, Locale, Order, Store, ThemeName } from "@/shared/lib/types";
import { formatMoney, formatNumber, uid } from "@/shared/lib/format";
import { getCartTotals, findProduct, getItemUnitPrice } from "@/features/order/cart";
import { buildOrderTimeline, themeIcons, themes } from "@/features/catalog/appConfig";
import { useCatalog } from "./CatalogContext";
import { geocodeAddress, reverseGeocode } from "@/features/tracking/geo";
import { useState, useEffect } from "react";

const AddressPickerMap = dynamic(() => import("@/features/tracking/AddressPickerMap"), { ssr: false });
const TrackingExperience = dynamic(() => import("@/features/tracking/TrackingExperience"), { ssr: false });

export function CatalogLayout({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const t = dictionaries[locale];
  const {
    deliveryAddress, setDeliveryAddress,
    addressModalOpen, setAddressModalOpen,
    query, setQuery,
    speed, setSpeed,
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

  let searchPlaceholder = t.searchPlaceholderFood;
  if (currentTheme === "grape") searchPlaceholder = t.searchPlaceholderShop;
  else if (currentTheme === "mint") searchPlaceholder = t.searchPlaceholderMarket;

  useEffect(() => {
    setQuery("");
  }, [currentTheme, setQuery]);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      note: "",
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
          {/* Mobile: Row 1 - Logo & Cart | Desktop: Same row */}
          <div className="flex items-center justify-between lg:grid lg:grid-cols-[1fr_1.2fr_1fr]">
            <Link href={`/${locale}`} >
              <Image width={320} height={160} className="w-28 lg:w-40 object-contain" src="/images/doppapp-logo.webp?v=5" alt={t.appName} priority />
            </Link>

            <div className="hidden lg:block w-full">
              <button
                className="flex w-full items-center gap-3 rounded-lg bg-white/14 px-3 py-2 text-left"
                onClick={() => setAddressModalOpen(true)}
              >
                <MapPin size={18} className="shrink-0" />
                <span className="flex min-w-0 flex-1 items-center justify-start gap-2">
                  <span className="shrink-0 text-xs font-semibold opacity-80">{t.deliveryAddress}:</span>
                  <span className="truncate text-sm font-black text-left">{deliveryAddress ? `${deliveryAddress.title}${deliveryAddress.shortAddress ? ` · ${deliveryAddress.shortAddress}` : ""}` : t.addressRequired}</span>
                </span>
                <span className="shrink-0 text-xs font-black underline">{t.changeAddress}</span>
              </button>
            </div>

            <div className="flex items-center justify-end">
              <button className="relative flex h-10 items-center gap-2 rounded-lg bg-white/18 px-3 font-black" onClick={() => setCheckoutOpen(true)} aria-label={t.cart}>
                <ShoppingCart size={18} />
                <span className="text-sm">{t.cart}</span>
                {cart.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs text-[var(--accent)]">{cart.length}</span>}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col lg:grid lg:grid-cols-[1fr_1.2fr_1fr] lg:items-center lg:gap-3">

            <div className="w-full order-1 lg:order-2 flex items-center gap-2">
              {/* Mobile Address Button - Hidden on Desktop */}
              <button
                className="flex shrink-0 max-w-[30%] items-center justify-center gap-1.5 rounded-lg bg-white/14 px-3 py-2 text-left lg:hidden"
                onClick={() => setAddressModalOpen(true)}
              >
                <MapPin size={16} className="shrink-0" />
                <span className="truncate text-sm font-black">{deliveryAddress ? `${deliveryAddress.title}${deliveryAddress.shortAddress ? ` · ${deliveryAddress.shortAddress}` : ""}` : t.addressRequired}</span>
              </button>

              <label className="flex flex-1 items-center gap-2 rounded-lg bg-white px-3 py-2 text-zinc-900 shadow-sm">
                <Search size={16} className="shrink-0 text-zinc-500" />
                <input className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />
              </label>
            </div>

            {/* Mobile: Row 4 - Categories & Info | Desktop: Left & Right Columns via contents */}
            <div className={`order-2 flex items-center justify-between lg:contents transition-all duration-300 overflow-hidden ${isScrolled ? "max-h-0 opacity-0 mt-0" : "max-h-20 opacity-100 mt-3 lg:mt-0"}`}>
              {/* Categories */}
              <div className="flex gap-2 lg:order-1">
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

              {/* Language & Info */}
              <div className="flex gap-2 lg:order-3 lg:justify-end">
                <Link className="grid h-9 w-9 place-items-center rounded-full bg-white/18" href={pathname.replace(`/${locale}`, `/${locale === "tr" ? "en" : "tr"}`)} aria-label="language">
                  <span className="font-bold text-xs">{locale === "tr" ? t.langEn : t.langTr}</span>
                </Link>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-white/18" onClick={() => setInfoOpen(true)} aria-label={t.info}>
                  <HelpCircle size={18} />
                </button>
              </div>
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
                <p>{t.deliveryFee}: {totals.deliveryFee === 0 ? t.free : formatMoney(totals.deliveryFee, locale)}</p>
                <strong>{t.total}: {formatMoney(totals.total, locale)}</strong>
              </div>
              <input className="w-full rounded-lg border border-black/10 p-3" name="name" placeholder={t.customerName} required />
              <input className="w-full rounded-lg border border-black/10 p-3" name="phone" placeholder={t.phone} />
              <div className="rounded-lg border border-black/10 p-3 text-sm">
                <p className="font-black">{t.deliveryAddress}</p>
                <p className="mt-1 text-zinc-600">{deliveryAddress ? `${deliveryAddress.title} · ${deliveryAddress.address}` : t.addressRequired}</p>
                <button className="mt-2 text-sm font-black text-[var(--accent)]" type="button" onClick={() => setAddressModalOpen(true)}>{t.changeAddress}</button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSpeed("rabbit")}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 transition-colors ${speed === "rabbit" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-black/10 text-zinc-500 hover:bg-zinc-50"}`}
                >
                  <Rabbit size={24} />
                  <span className="text-sm font-bold">{locale === 'tr' ? 'Tavşan Hızı' : 'Rabbit Speed'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpeed("turtle")}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 transition-colors ${speed === "turtle" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-black/10 text-zinc-500 hover:bg-zinc-50"}`}
                >
                  <Turtle size={24} />
                  <span className="text-sm font-bold">{locale === 'tr' ? 'Kaplumbağa' : 'Turtle Speed'}</span>
                </button>
              </div>
              <button disabled={!cart.length} className="w-full rounded-lg bg-[var(--accent)] py-4 font-black text-white disabled:opacity-45 shadow-md hover:shadow-lg transition-shadow">{t.demoOrder}</button>
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
  const [mapOpen, setMapOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  function findMyLocation() {
    if (!("geolocation" in navigator)) {
      setMessage(t.addressMissing);
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinate([lat, lng]);
        setMapOpen(true);

        try {
          const addressData = await reverseGeocode(lat, lng);
          if (addressData) {
            setAddress(addressData.full);
            setMessage("");
          }
        } catch (err) {}
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);

        // IP tabanlı konum servisine fallback (GeoJS)
        fetch("https://get.geojs.io/v1/ip/geo.json")
          .then(res => res.json())
          .then(async (data) => {
            const lat = Number(data.latitude);
            const lng = Number(data.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              setCoordinate([lat, lng]);
              setMapOpen(true);
              const addressData = await reverseGeocode(lat, lng);
              const finalFull = addressData?.full || `${data.city || ""}, ${data.region || ""}, ${data.country || ""}`.trim();
              setAddress(finalFull);
              setMessage(t.approxLocationUsed);
            } else {
              throw new Error("Invalid IP location data");
            }
            setIsLocating(false);
          })
          .catch(() => {
            if (error.code === 1) {
              setMessage(t.locationDenied);
            } else if (error.code === 2) {
              setMessage(t.locationUnavailable);
            } else {
              setMessage(t.addressMissing);
            }
            setIsLocating(false);
          });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

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

  const handleMapChange = async (newCoord: [number, number]) => {
    setCoordinate(newCoord);
    try {
      const addressData = await reverseGeocode(newCoord[0], newCoord[1]);
      if (addressData) {
        setAddress(addressData.full);
      }
    } catch (err) {}
  };

  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    let finalShort = "";
    const finalFull = address.trim();
    try {
      const addressData = await reverseGeocode(coordinate[0], coordinate[1]);
      if (addressData) {
        finalShort = addressData.short;
        // Eğer kullanıcı manuel olarak textarea'yı silip sadece kapı no falan yazmışsa,
        // ya da IP konumu kalmışsa, emin olmak için submit anında da adresi harmanlıyoruz.
        // Ancak kullanıcının yazdığı notu (örn: Kat 5) kaybetmemek için, 
        // eğer textarea adresi harita adresinden farklıysa, ikisini birleştiriyoruz.
        if (addressData.full !== address.trim()) {
           // IP adresi gibi jenerik şeyleri ayıklamak zor, bu yüzden basitçe:
           // Eğer address "Turkey" falan içeriyorsa muhtemelen eski IP adresidir, 
           // ama biz yine de güvenli tarafta kalıp, harita adresini başa ekleyelim,
           // kullanıcının yazdığını sona parantez/tire ile ekleyelim.
           // Ya da handleMapChange ile zaten textarea güncelleneceği için, 
           // kullanıcı pini sürükleyince adres otomatik dolacak. 
           // Kullanıcı sonrasında "Kat 2" eklerse, addressData.full ile eşleşmeyecek.
           // O yüzden submit anında *sadece shortAddress* çekmek daha güvenli!
           // Çünkü handleMapChange zaten textarea'yı güncelliyor.
        }
      }
    } catch(err) {}

    onSave({
      id: initialAddress?.id ?? uid("address"),
      title: title.trim(),
      address: finalFull,
      shortAddress: finalShort,
      latitude: coordinate[0],
      longitude: coordinate[1]
    });
    setIsSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-4">
      <form onSubmit={submit} className="w-full max-h-[94vh] max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-2xl">
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
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg border border-black/10 px-4 py-3 font-black" type="button" onClick={findOnMap}>{t.pickFromMap}</button>
            <button
              className={`flex items-center justify-center rounded-lg bg-zinc-100 px-4 py-3 text-zinc-700 transition-colors hover:bg-zinc-200 ${isLocating ? 'animate-pulse' : ''}`}
              type="button"
              onClick={findMyLocation}
              disabled={isLocating}
              aria-label={t.useCurrentLocation}
            >
              <Crosshair size={18} />
            </button>
          </div>
          {message && <p className="text-sm font-bold text-[var(--accent)]">{message}</p>}
          {mapOpen && (
            <div className="space-y-2">
              <AddressPickerMap value={coordinate} onChange={handleMapChange} />
            </div>
          )}
          <button disabled={!mapOpen || isSaving} className="rounded-lg bg-[var(--accent)] py-4 font-black text-white disabled:opacity-45">
            {isSaving ? "..." : t.saveAddress}
          </button>
        </div>
      </form>
    </div>
  );
}
