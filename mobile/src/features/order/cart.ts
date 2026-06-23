import type { CartItem, Product, Store } from "@/shared/lib/types";

export function findProduct(stores: Store[], cartItem: CartItem): Product | undefined {
  return stores
    .find((store) => store.id === cartItem.storeId)
    ?.menu.find((item) => item.id === cartItem.itemId);
}

export function getItemUnitPrice(item: Product, cartItem: CartItem) {
  const optionDelta = item.optionGroups?.reduce((total, group) => {
    const selected = cartItem.selections[group.id] ?? [];
    const delta = selected.reduce((sum, optionId) => {
      const option = group.options.find((candidate) => candidate.id === optionId);
      return sum + (option?.priceDelta ?? 0);
    }, 0);

    return total + delta;
  }, 0);

  return item.price + (optionDelta ?? 0);
}

export function getCartTotals(stores: Store[], cart: CartItem[]) {
  const subtotal = cart.reduce((sum, cartItem) => {
    const item = findProduct(stores, cartItem);
    return item ? sum + getItemUnitPrice(item, cartItem) * cartItem.quantity : sum;
  }, 0);

  const deliveryFee = cart.reduce((maxFee, cartItem) => {
    const store = stores.find((candidate) => candidate.id === cartItem.storeId);
    return Math.max(maxFee, store?.deliveryFee ?? 0);
  }, 0);

  const calories = cart.reduce((sum, cartItem) => {
    const item = findProduct(stores, cartItem);
    return item ? sum + (item.calories || 0) * cartItem.quantity : sum;
  }, 0);

  return { subtotal, deliveryFee, total: subtotal + deliveryFee, calories };
}

import { DEFAULT_DELIVERY_TIMES } from "@/features/catalog/appConfig";
import type { DeliveryTimeConfig } from "@/shared/lib/types";

export function getCartDeliveryTimeMinutes(
  stores: Store[], 
  cart: CartItem[], 
  deliveryTimes: DeliveryTimeConfig = DEFAULT_DELIVERY_TIMES
): number {
  if (cart.length === 0) return 0;

  const itemTimes: number[] = [];

  cart.forEach((cartItem) => {
    const store = stores.find((s) => s.id === cartItem.storeId);
    if (store) {
      const type = store.type;
      const config = deliveryTimes[type] || DEFAULT_DELIVERY_TIMES[type] || { min: 1, max: 3 };
      
      // Calculate a random time between min and max (inclusive) with 1 decimal precision
      // e.g. between 1.0 and 3.0
      const min = config.min;
      const max = config.max;
      const randomTime = min + Math.random() * (max - min);
      const timeForType = Math.round(randomTime * 10) / 10;
      
      for (let i = 0; i < cartItem.quantity; i++) {
        itemTimes.push(timeForType);
      }
    }
  });

  if (itemTimes.length === 0) return 0;

  itemTimes.sort((a, b) => b - a);
  const maxTime = itemTimes[0];
  const remainingTimes = itemTimes.slice(1);
  const sumRemaining = remainingTimes.reduce((sum, t) => sum + t, 0);

  return maxTime + sumRemaining * 0.75;
}
