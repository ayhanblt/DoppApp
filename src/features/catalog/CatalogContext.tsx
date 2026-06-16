"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Address, CartItem, DeliverySpeed, Order, Store } from "@/shared/lib/types";
import { getStoredStores, getStoresAroundAddress, getStoresOnRoadsAroundAddress } from "@/features/catalog/data";

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
  order: Order | null;
  setOrder: (order: Order | null) => void;
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
};

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [speed, setSpeed] = useState<DeliverySpeed>("rabbit");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [stores, setStores] = useState<Store[]>(getStoredStores);

  useEffect(() => {
    let mounted = true;
    const rawAddress = window.localStorage.getItem("deliveryAddress");
    if (!rawAddress) {
      setAddressModalOpen(true);
      return () => { mounted = false; };
    }

    try {
      const storedAddress = JSON.parse(rawAddress) as Address;
      setDeliveryAddress(storedAddress);
      const center: [number, number] = [storedAddress.latitude, storedAddress.longitude];
      setStores(getStoresAroundAddress(center));
      getStoresOnRoadsAroundAddress(center).then((roadStores) => {
        if (mounted) setStores(roadStores);
      });
    } catch {
      window.localStorage.removeItem("deliveryAddress");
      setAddressModalOpen(true);
    }
    return () => { mounted = false; };
  }, []);

  const value = {
    deliveryAddress,
    setDeliveryAddress,
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
    order,
    setOrder,
    stores,
    setStores
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
