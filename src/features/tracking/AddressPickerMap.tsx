"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Home, MapPin } from "lucide-react";

type AddressPickerMapProps = {
  value: [number, number];
  onChange: (coordinate: [number, number]) => void;
};

const addressIcon = L.divIcon({
  className: "bg-transparent",
  html: renderToStaticMarkup(
    <div className="flex items-center justify-center drop-shadow-md w-12 h-12">
      <div className="flex h-7 w-7 items-center justify-center rounded-full rounded-br-none rotate-45 bg-[#fb4824] border-1 border-white text-white">
        <div className="-rotate-45 flex items-center justify-center">
          <Home size={16} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  ),
  iconSize: [48, 48],
  iconAnchor: [24, 47]
});

function Recenter({ coordinate }: { coordinate: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(coordinate, map.getZoom());
  }, [coordinate, map]);

  return null;
}

function ClickHandler({ onChange }: { onChange: (coordinate: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onChange([Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6))]);
    }
  });

  return null;
}

export default function AddressPickerMap({ value, onChange }: AddressPickerMapProps) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (!marker) return;
        const next = marker.getLatLng();
        onChange([Number(next.lat.toFixed(6)), Number(next.lng.toFixed(6))]);
      }
    }),
    [onChange]
  );

  return (
    <MapContainer center={value} zoom={14} className="h-[320px] w-full overflow-hidden rounded-lg border border-black/10" scrollWheelZoom>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Recenter coordinate={value} />
      <ClickHandler onChange={onChange} />
      <Marker draggable eventHandlers={eventHandlers} icon={addressIcon} position={value} ref={markerRef} />
    </MapContainer>
  );
}
