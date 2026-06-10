"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";

type TrackingMapProps = {
  restaurant: [number, number];
  address: [number, number];
  courier?: [number, number];
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
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const destinationIcon = L.divIcon({
  className: "destination-marker",
  html: "<span>⌂</span>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(points, { padding: [36, 36], maxZoom: 14 });
  }, [map, points]);

  return null;
}

export default function TrackingMap({ restaurant, address, courier }: TrackingMapProps) {
  const points = useMemo(() => [restaurant, address] as [number, number][], [restaurant, address]);

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
      <FitBounds points={points} />
      <Polyline positions={points} pathOptions={{ color: "#ff5a2a", weight: 5, opacity: 0.7 }} />
      <Marker position={restaurant} icon={restaurantIcon} />
      <Marker position={address} icon={destinationIcon} />
      {courier && <Marker position={courier} icon={courierIcon} />}
    </MapContainer>
  );
}
