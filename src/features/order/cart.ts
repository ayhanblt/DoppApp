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
    return item ? sum + item.calories * cartItem.quantity : sum;
  }, 0);

  return { subtotal, deliveryFee, total: subtotal + deliveryFee, calories };
}
