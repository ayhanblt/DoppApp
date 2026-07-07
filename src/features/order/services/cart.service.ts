import type { CartItem } from "@/shared/lib/types";

// In a real production app on serverless, this should be in Redis/Supabase.
// For WebMCP (long-lived SSE connection or dev mode), we use global memory.
const globalCartStore = globalThis as unknown as {
  agentCarts: Map<string, CartItem[]>;
};

if (!globalCartStore.agentCarts) {
  globalCartStore.agentCarts = new Map<string, CartItem[]>();
}

export function getAgentCart(sessionId: string): CartItem[] {
  return globalCartStore.agentCarts.get(sessionId) || [];
}

export function saveAgentCart(sessionId: string, cart: CartItem[]) {
  globalCartStore.agentCarts.set(sessionId, cart);
}

export function clearAgentCart(sessionId: string) {
  globalCartStore.agentCarts.delete(sessionId);
}

export function addToCart(
  sessionId: string, 
  storeId: string, 
  itemId: string, 
  quantity: number = 1, 
  selections: Record<string, string[]> = {}
) {
  const cart = getAgentCart(sessionId);
  
  const existingItemIndex = cart.findIndex(
    (item) => 
      item.storeId === storeId && 
      item.itemId === itemId && 
      JSON.stringify(item.selections) === JSON.stringify(selections)
  );

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({ id: Math.random().toString(36).substring(2, 11), storeId, itemId, quantity, selections });
  }

  saveAgentCart(sessionId, cart);
  return cart;
}

export function removeFromCart(sessionId: string, storeId: string, itemId: string) {
  let cart = getAgentCart(sessionId);
  cart = cart.filter(item => !(item.storeId === storeId && item.itemId === itemId));
  saveAgentCart(sessionId, cart);
  return cart;
}

export function updateCart(sessionId: string, storeId: string, itemId: string, quantity: number) {
  const cart = getAgentCart(sessionId);
  const existingItemIndex = cart.findIndex(
    (item) => item.storeId === storeId && item.itemId === itemId
  );

  if (existingItemIndex > -1) {
    if (quantity <= 0) {
      cart.splice(existingItemIndex, 1);
    } else {
      cart[existingItemIndex].quantity = quantity;
    }
  }

  saveAgentCart(sessionId, cart);
  return cart;
}
