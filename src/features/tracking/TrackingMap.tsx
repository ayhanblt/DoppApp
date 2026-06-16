"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { getRoute } from "./geo";

type TrackingMapProps = {
  restaurant: [number, number];
  address: [number, number];
  courier?: [number, number];
  /** Önceden hesaplanmış tam rota (restoran → adres).
   *  Geçilirse iç fetch atlanır — animasyon tutarlı kalır. */
  routePoints?: [number, number][];
};

const restaurantIcon = L.divIcon({
  className: "restaurant-marker",
  html: "<span>🍽</span>",
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const courierIcon = L.divIcon({
  className: "courier-marker",
  html: "<span>🏍</span>",
  // iconUrl: "/location.png",
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const destinationIcon = L.icon({
  className: "destination-marker",
  // html: "<span>⌂</span>",
 
  iconUrl: "/images/icons/location.svg",
  iconSize: [35, 35],
  iconAnchor: [20, 35]
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
