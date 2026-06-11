export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) return null;
  const [result] = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!result) return null;
  return [Number(result.lat), Number(result.lon)];
}

export function interpolateRoute(from: [number, number], to: [number, number], progress: number): [number, number] {
  const clamped = Math.min(1, Math.max(0, progress));
  return [
    from[0] + (to[0] - from[0]) * clamped,
    from[1] + (to[1] - from[1]) * clamped
  ];
}

export function coordinateDistanceKm(from: [number, number], to: [number, number]) {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to[0] - from[0]);
  const dLng = toRad(to[1] - from[1]);
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function offsetCoordinate(center: [number, number], distanceKm: number, bearingDegrees: number): [number, number] {
  const earthRadiusKm = 6371;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const lat1 = (center[0] * Math.PI) / 180;
  const lng1 = (center[1] * Math.PI) / 180;
  const ratio = distanceKm / earthRadiusKm;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(ratio) + Math.cos(lat1) * Math.sin(ratio) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(ratio) * Math.cos(lat1),
      Math.cos(ratio) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [Number(((lat2 * 180) / Math.PI).toFixed(6)), Number(((lng2 * 180) / Math.PI).toFixed(6))];
}

export function createCourierStartCoordinate(restaurant: [number, number], seed = 0): [number, number] {
  return offsetCoordinate(restaurant, 0.08 + (seed % 7) * 0.025, (seed * 73) % 360);
}

export async function snapCoordinateToRoad(coordinate: [number, number]): Promise<[number, number] | null> {
  const params = new URLSearchParams({ number: "1" });
  const response = await fetch(
    `https://router.project-osrm.org/nearest/v1/driving/${coordinate[1]},${coordinate[0]}?${params.toString()}`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) return null;
  const result = (await response.json()) as {
    waypoints?: Array<{ location?: [number, number] }>;
  };
  const location = result.waypoints?.[0]?.location;
  if (!location) return null;

  return [Number(location[1].toFixed(6)), Number(location[0].toFixed(6))];
}
