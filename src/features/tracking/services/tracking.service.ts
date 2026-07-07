import { supabase } from "@/shared/api/supabase";
import type { Order } from "@/shared/lib/types";
import { interpolateAlongRoute } from "../geo";

export async function trackOrder(orderId: string) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  
  if (error || !data) {
    throw new Error(`Order not found: ${error?.message || 'Unknown error'}`);
  }

  // Cast Supabase row to Order type
  const order: Order = {
    id: data.id,
    customerName: data.customer?.name || "",
    phone: data.customer?.phone || "",
    addressText: data.customer?.address || "",
    note: "",
    status: data.status,
    placedAt: data.placed_at,
    handoffAt: data.handoff_at,
    deliveringAt: data.delivering_at,
    deliveredAt: data.delivered_at,
    speed: data.speed,
    storeCoordinate: data.store_coordinate || [0,0],
    courierStartCoordinate: data.courier_start_coordinate || [0,0],
    routeWaypoints: data.route_waypoints || [],
    addressCoordinate: data.address_coordinate || [0,0],
    items: data.cart || [],
    created_at: data.created_at,
    total: data.total || 0,
  };

  const now = Date.now();
  const rawProgress = (now - order.placedAt) / (order.deliveredAt - order.placedAt);
  const overallProgressPercent = Math.min(1, Math.max(0, rawProgress)) * 100;

  // Status mapping
  let statusText = "Bekliyor";
  if (order.status === 'delivered') statusText = "Teslim Edildi";
  else if (now < order.handoffAt) statusText = "Hazırlanıyor";
  else if (now < order.deliveringAt) statusText = "Kuryeye Teslim Edildi";
  else if (now < order.deliveredAt) statusText = "Yolda";
  else statusText = "Teslim Edildi (Sistem Bekliyor)";

  // Estimate current coordinate
  let currentCoordinate = order.courierStartCoordinate;
  if (order.routeWaypoints && order.routeWaypoints.length > 0) {
    if (now >= order.deliveredAt || order.status === 'delivered') {
      currentCoordinate = order.addressCoordinate;
    } else if (now > order.deliveringAt && now < order.deliveredAt) {
      const travelDuration = order.deliveredAt - order.deliveringAt;
      const elapsedTravel = now - order.deliveringAt;
      const travelRatio = Math.max(0, Math.min(1, elapsedTravel / travelDuration));
      
      currentCoordinate = interpolateAlongRoute(order.routeWaypoints, travelRatio);
    }
  }

  return {
    orderId: order.id,
    status: order.status,
    statusText,
    overallProgressPercent: Math.round(overallProgressPercent),
    estimatedDeliveryTime: new Date(order.deliveredAt).toISOString(),
    currentCoordinate,
    destinationCoordinate: order.addressCoordinate
  };
}
