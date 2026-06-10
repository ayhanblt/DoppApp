import type { CartItem, MenuItem, Restaurant } from "@/shared/lib/types";

export function findMenuItem(restaurants: Restaurant[], cartItem: CartItem): MenuItem | undefined {
  return restaurants
    .find((restaurant) => restaurant.id === cartItem.restaurantId)
    ?.menu.find((item) => item.id === cartItem.itemId);
}

export function getItemUnitPrice(item: MenuItem, cartItem: CartItem) {
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

export function getCartTotals(restaurants: Restaurant[], cart: CartItem[]) {
  const subtotal = cart.reduce((sum, cartItem) => {
    const item = findMenuItem(restaurants, cartItem);
    return item ? sum + getItemUnitPrice(item, cartItem) * cartItem.quantity : sum;
  }, 0);

  const deliveryFee = cart.reduce((maxFee, cartItem) => {
    const restaurant = restaurants.find((candidate) => candidate.id === cartItem.restaurantId);
    return Math.max(maxFee, restaurant?.deliveryFee ?? 0);
  }, 0);

  const calories = cart.reduce((sum, cartItem) => {
    const item = findMenuItem(restaurants, cartItem);
    return item ? sum + item.calories * cartItem.quantity : sum;
  }, 0);

  return { subtotal, deliveryFee, total: subtotal + deliveryFee, calories };
}
