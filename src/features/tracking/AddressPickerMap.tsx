"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";

type AddressPickerMapProps = {
  value: [number, number];
  onChange: (coordinate: [number, number]) => void;
};

const addressIcon = L.divIcon({
  className: "destination-marker",
  html: "<span>⌂</span>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
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
