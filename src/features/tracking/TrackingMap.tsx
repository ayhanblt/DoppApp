"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { getRoute } from "./geo";
import { renderToStaticMarkup } from "react-dom/server";
import { House, Package, ShoppingBag } from "lucide-react";

type TrackingMapProps = {
  restaurant: [number, number];
  address: [number, number];
  courier?: [number, number];
  /** Önceden hesaplanmış tam rota (restoran → adres).
   *  Geçilirse iç fetch atlanır — animasyon tutarlı kalır. */
  routePoints?: [number, number][];
};

const restaurantIcon = L.divIcon({
  className: "bg-transparent",
  html: renderToStaticMarkup(
    <div className="flex items-center justify-center drop-shadow-md w-12 h-12">
      <div className="flex h-8 w-8 items-center justify-center rounded-full rounded-br-none rotate-45 bg-zinc-800 border-1 border-white text-white">
        <div className="-rotate-45 flex items-center justify-center">
          <ShoppingBag size={16} strokeWidth={2} />
        </div>
      </div>
    </div>
  ),
  iconSize: [48, 48],
  iconAnchor: [24, 48]
});

const courierIcon = L.divIcon({
  className: "bg-transparent",
  html: renderToStaticMarkup(
    <div className="flex items-center justify-center drop-shadow-md w-14 h-14">
      <div className="flex h-10 w-10 items-center justify-center rounded-full rounded-br-none rotate-45 bg-[#fb4824] border-1 border-white text-white">
        <div className="-rotate-45 flex items-center justify-center">
          <Package size={18} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  ),
  iconSize: [56, 56],
  iconAnchor: [28, 56]
});

const destinationIcon = L.divIcon({
  className: "bg-transparent",
  html: renderToStaticMarkup(
    <div className="flex items-center justify-center drop-shadow-md w-12 h-12">
      <div className="flex h-8 w-8 items-center justify-center rounded-full rounded-br-none rotate-45 bg-emerald-500 border-1 border-white text-white">
        <div className="-rotate-45 flex items-center justify-center">
          <House size={16} strokeWidth={2} />
        </div>
      </div>
    </div>
  ),
  iconSize: [48, 48],
  iconAnchor: [24, 48]
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(points, { padding: [36, 36], maxZoom: 14 });
  }, [map, points]);

  return null;
}

export default function TrackingMap({ restaurant, address, courier, routePoints: externalRoute }: TrackingMapProps) {
  // Dışarıdan rota gelmezse kendi fetch eder (geriye dönük uyumluluk)
  const [internalRoute, setInternalRoute] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalRoute) return; // dışarıdan verildi, fetch etme
    let cancelled = false;
    setLoading(true);
    getRoute(restaurant, address).then((route) => {
      if (cancelled) return;
      setInternalRoute(route);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [restaurant, address, externalRoute]);

  const route = externalRoute ?? internalRoute;

  // FitBounds: rota varsa tüm noktaları kullan, yoksa sadece uç noktaları
  const boundsPoints = useMemo<[number, number][]>(
    () => (route && route.length > 1 ? route : [restaurant, address]),
    [route, restaurant, address]
  );

  return (
    <MapContainer
      center={courier ?? restaurant}
      zoom={13}
      className="h-[360px] w-full overflow-hidden rounded-lg border border-black/10"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={boundsPoints} />

      {/* Rota yüklenirken fallback kesik çizgi */}
      {loading && !route && (
        <Polyline
          positions={[restaurant, address]}
          pathOptions={{ color: "#ccc", weight: 3, opacity: 0.5, dashArray: "4 8" }}
        />
      )}

      {/* Gerçek yol rotası (restoran → adres) */}
      {route && (
        <Polyline
          positions={route}
          pathOptions={{ color: "#ff5a2a", weight: 5, opacity: 0.75 }}
        />
      )}

      <Marker position={restaurant} icon={restaurantIcon} />
      <Marker position={address} icon={destinationIcon} />
      {courier && <Marker position={courier} icon={courierIcon} />}
    </MapContainer>
  );
}
