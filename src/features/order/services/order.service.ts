import { supabase } from "@/shared/api/supabase";
import { getAgentCart, clearAgentCart } from "./cart.service";
import { fetchStoresFromSupabase, fetchConfigFromSupabase } from "@/features/catalog/data";
import { getCartDeliveryTimeMinutes, getCartTotals } from "../cart";
import { DEFAULT_DELIVERY_SPEEDS, DEFAULT_DELIVERY_TIMES } from "@/features/catalog/appConfig";
import { getOptimizedTrip, coordinateDistanceKm, offsetCoordinate } from "@/features/tracking/geo";
import { buildOrderTimeline } from "@/features/catalog/appConfig";
import type { Store, Order } from "@/shared/lib/types";

// Generate a random ID
function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function createOrder(sessionId: string) {
  const cart = getAgentCart(sessionId);
  if (!cart || cart.length === 0) {
    throw new Error("Cart is empty");
  }

  const stores = await fetchStoresFromSupabase();
  const config = await fetchConfigFromSupabase();

  // Default address for AI agents if they don't specify one
  const defaultAddress = {
    title: "AI Test Location",
    address: "Şişli / İstanbul",
    latitude: 41.0603,
    longitude: 28.9877
  };
  const addressCoordinate: [number, number] = [defaultAddress.latitude, defaultAddress.longitude];

  const targetTimeSeconds = getCartDeliveryTimeMinutes(stores, cart, config?.delivery_times || DEFAULT_DELIVERY_TIMES);
  const speeds = config?.delivery_speeds || DEFAULT_DELIVERY_SPEEDS;
  const speed = "rabbit";

  const uniqueStoreIds = Array.from(new Set(cart.map(item => item.storeId)));
  const uniqueStores = uniqueStoreIds.map(id => stores.find(s => s.id === id)).filter((s): s is Store => !!s);

  let actualDistanceKm = 0;
  const waypoints: [number, number][] = [];
  let courierStartCoordinate = addressCoordinate;

  if (uniqueStores.length > 0) {
    const inputWaypoints = [...uniqueStores.map(s => s.coordinate), addressCoordinate];
    const trip = await getOptimizedTrip(inputWaypoints);

    if (trip) {
      waypoints.push(...trip.optimizedWaypoints);
      actualDistanceKm = trip.distanceKm;
      courierStartCoordinate = waypoints[0];
    } else {
      courierStartCoordinate = uniqueStores[0].coordinate;
      waypoints.push(courierStartCoordinate, addressCoordinate);
      actualDistanceKm = coordinateDistanceKm(courierStartCoordinate, addressCoordinate);
    }
  } else {
    courierStartCoordinate = offsetCoordinate(addressCoordinate, 1, 180);
    actualDistanceKm = coordinateDistanceKm(courierStartCoordinate, addressCoordinate);
    waypoints.push(courierStartCoordinate);
    waypoints.push(addressCoordinate);
  }

  const actualMovementMs = actualDistanceKm * speeds[speed].kmMultiplierMs;
  const actualTotalTimeMs = 2000 + 8000 + actualMovementMs;
  const now = Date.now();

  const { handoffAt, deliveringAt, deliveredAt } = buildOrderTimeline(now, speed, actualDistanceKm, actualTotalTimeMs, speeds);
  
  const totals = getCartTotals(stores, cart);
  const orderId = generateId("order");

  const newOrder: Order = {
    id: orderId,
    customerName: "AI Assistant",
    phone: "",
    addressText: `${defaultAddress.title}: ${defaultAddress.address}`,
    note: "Created by AI via WebMCP",
    addressCoordinate,
    storeCoordinate: courierStartCoordinate,
    courierStartCoordinate,
    routeWaypoints: waypoints,
    speed,
    status: "confirmed",
    placedAt: now,
    handoffAt,
    deliveringAt,
    deliveredAt,
    items: cart,
    created_at: new Date().toISOString(),
    total: totals.total
  };

  const { error } = await supabase.from("orders").insert({
    id: orderId,
    status: "confirmed",
    cart: cart,
    customer: {
      name: newOrder.customerName,
      phone: newOrder.phone,
      address: newOrder.addressText
    },
    total: totals.total,
    created_at: newOrder.created_at,
    placed_at: newOrder.placedAt,
    handoff_at: newOrder.handoffAt,
    delivering_at: newOrder.deliveringAt,
    delivered_at: newOrder.deliveredAt,
    speed: newOrder.speed,
    store_coordinate: newOrder.storeCoordinate,
    courier_start_coordinate: newOrder.courierStartCoordinate,
    route_waypoints: newOrder.routeWaypoints,
    address_coordinate: newOrder.addressCoordinate,
  });

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  clearAgentCart(sessionId);
  return newOrder;
}
