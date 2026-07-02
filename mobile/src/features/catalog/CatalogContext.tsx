"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Address, CartItem, DeliverySpeed, Order, Store, GlobalConfig, Locale } from "../../shared/lib/types";
import { fetchStoresFromSupabase, getStoresAroundAddressSync, getStoresOnRoadsAroundAddress, fetchConfigFromSupabase } from "@/features/catalog/data";

type CatalogContextType = {
  deliveryAddress: Address | null;
  setDeliveryAddress: (address: Address | null) => void;
  addressModalOpen: boolean;
  setAddressModalOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  speed: DeliverySpeed;
  setSpeed: (speed: DeliverySpeed) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
  infoOpen: boolean;
  setInfoOpen: (open: boolean) => void;
  feedbackOpen: boolean;
  setFeedbackOpen: (open: boolean) => void;
  order: Order | null;
  setOrder: (order: Order | null) => void;
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
  config: GlobalConfig | null;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isLoading: boolean;
};

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("tr");
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [speed, setSpeed] = useState<DeliverySpeed>("rabbit");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [dbStores, setDbStores] = useState<Store[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchStoresFromSupabase().then((res) => {
      if (mounted) {
        setDbStores(res);
        if (res.length === 0) setIsLoading(false);
      }
    });
    fetchConfigFromSupabase().then((res) => {
      if (mounted) setConfig(res);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (dbStores.length === 0) return;

    async function initStores() {
      const rawAddress = await AsyncStorage.getItem("deliveryAddress");
      if (!rawAddress) {
        if (mounted) {
          setStores(dbStores);
          setIsLoading(false);
        }
        return;
      }

      let storedAddress: Address;
      try {
        storedAddress = JSON.parse(rawAddress) as Address;
      } catch {
        await AsyncStorage.removeItem("deliveryAddress");
        if (mounted) {
          setStores(dbStores);
          setIsLoading(false);
        }
        return;
      }

      setDeliveryAddress(storedAddress);
      const center: [number, number] = [storedAddress.latitude, storedAddress.longitude];

      if (mounted) setStores(getStoresAroundAddressSync(center, dbStores, config));

      try {
        const roadStores = await getStoresOnRoadsAroundAddress(center, dbStores, config);
        if (mounted) setStores(roadStores);
      } catch (err) {
        console.error("OSRM API Hatası:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initStores();

    return () => { mounted = false; };
  }, [dbStores, config, deliveryAddress?.latitude, deliveryAddress?.longitude]);

  useEffect(() => {
    AsyncStorage.getItem("locale").then((savedLocale) => {
      if (savedLocale === "tr" || savedLocale === "en") {
        setLocale(savedLocale as Locale);
      }
    });
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    AsyncStorage.setItem("locale", newLocale);
  };

  const handleSetDeliveryAddress = (address: Address | null) => {
    setDeliveryAddress(address);
    if (address) {
      AsyncStorage.setItem("deliveryAddress", JSON.stringify(address));
    } else {
      AsyncStorage.removeItem("deliveryAddress");
    }
  };

  const value = {
    deliveryAddress,
    setDeliveryAddress: handleSetDeliveryAddress,
    addressModalOpen,
    setAddressModalOpen,
    query,
    setQuery,
    speed,
    setSpeed,
    cart,
    setCart,
    checkoutOpen,
    setCheckoutOpen,
    infoOpen,
    setInfoOpen,
    feedbackOpen,
    setFeedbackOpen,
    order,
    setOrder,
    stores,
    setStores,
    config,
    locale,
    setLocale: handleSetLocale,
    isLoading
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return context;
}
