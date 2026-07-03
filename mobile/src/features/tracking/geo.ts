export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "DoppApp/1.0 (contact@doppapp.com)"
    }
  });

  if (!response.ok) return null;
  const [result] = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!result) return null;
  return [Number(result.lat), Number(result.lon)];
}

type GeocodeResult = {
  full: string;
  short: string;
};

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: "json",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "DoppApp/1.0 (contact@doppapp.com)"
    }
  });

  if (!response.ok) return null;
  const result = await response.json();
  if (!result || !result.address) return null;

  const addr = result.address;
  const district = addr.city_district || addr.town || addr.county || addr.suburb || "";
  const city = addr.city || addr.province || addr.state || "";

  const shortArr = [];
  if (district) shortArr.push(district);
  if (city && city !== district) shortArr.push(city);

  return {
    full: result.display_name || "",
    short: shortArr.join(", ") || result.display_name || ""
  };
}

export function interpolateRoute(from: [number, number], to: [number, number], progress: number): [number, number] {
  const clamped = Math.min(1, Math.max(0, progress));
  return [
    from[0] + (to[0] - from[0]) * clamped,
    from[1] + (to[1] - from[1]) * clamped
  ];
}

/**
 * OSRM'den gerçek yol rotasını çeker.
 * Dönüş: sıralı [lat, lng] koordinat dizisi veya hata durumunda null.
 */
export async function getRoute(
  waypoints: [number, number][]
): Promise<[number, number][] | null> {
  if (waypoints.length < 2) return null;
  const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    coordsStr +
    `?overview=full&geometries=geojson&annotations=true`;

  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      routes?: Array<{
        geometry: { coordinates: Array<[number, number]> };
      }>;
    };

    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords || coords.length === 0) return null;

    // OSRM [lng, lat] döner → biz [lat, lng] kullanıyoruz
    return coords.map(([lng, lat]) => [
      Number(lat.toFixed(6)),
      Number(lng.toFixed(6)),
    ]);
  } catch (error) {
    console.error("OSRM Route Network Error:", error);
    return null;
  }
}

/**
 * OSRM /trip API'sini kullanarak verilen koordinatların (Mağazalar + Ev)
 * en kısa karayolu ziyaret sırasını (Traveling Salesperson) ve gerçek mesafesini hesaplar.
 * @param waypoints İlk N-1 koordinat mağazalar, SON koordinat her zaman teslimat adresi (Ev).
 */
export async function getOptimizedTrip(
  waypoints: [number, number][]
): Promise<{
  optimizedWaypoints: [number, number][];
  distanceKm: number;
} | null> {
  if (waypoints.length < 2) return null;

  // Koordinatları lng,lat formatına çevir
  const coordsStr = waypoints.map(wp => `${wp[1]},${wp[0]}`).join(';');

  // source=any: Nereden başladığı önemli değil, en uygun yerden başlasın.
  // destination=last: Rota KESİNLİKLE son verdiğimiz koordinatta (Ev) bitmeli.
  const url = `https://router.project-osrm.org/trip/v1/driving/${coordsStr}?source=any&destination=last&roundtrip=false`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "DoppApp/1.0 (contact@doppapp.com)"
      }
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (data.code !== "Ok" || !data.waypoints || !data.trips || data.trips.length === 0) return null;

    const trip = data.trips[0];
    const optimizedWaypoints: [number, number][] = data.waypoints.map((wp: { waypoint_index: number }) => waypoints[wp.waypoint_index]);

    return {
      optimizedWaypoints,
      distanceKm: trip.distance / 1000 // Metre -> Kilometre
    };
  } catch (error) {
    console.error("OSRM Network Error:", error);
    return null; // Ağa ulaşılamazsa fallback mantığını tetiklemesi için null dön
  }
}

/**
 * Gerçek rota üzerinde toplam mesafe hesaplar (km).
 */
export function routeTotalDistance(route: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    total += coordinateDistanceKm(route[i - 1], route[i]);
  }
  return total;
}

/**
 * Rota üzerinde progress (0–1) değerine karşılık gelen koordinatı döner.
 * Kurye animasyonu için düz çizgi yerine yolları takip eder.
 */
export function interpolateAlongRoute(
  route: [number, number][],
  progress: number
): [number, number] {
  if (route.length === 0) return [0, 0];
  if (route.length === 1) return route[0];

  const clamped = Math.min(1, Math.max(0, progress));
  const total = routeTotalDistance(route);
  const target = total * clamped;

  let accumulated = 0;
  for (let i = 1; i < route.length; i++) {
    const segDist = coordinateDistanceKm(route[i - 1], route[i]);
    if (accumulated + segDist >= target) {
      const segProgress = segDist === 0 ? 0 : (target - accumulated) / segDist;
      return [
        route[i - 1][0] + (route[i][0] - route[i - 1][0]) * segProgress,
        route[i - 1][1] + (route[i][1] - route[i - 1][1]) * segProgress,
      ];
    }
    accumulated += segDist;
  }

  return route[route.length - 1];
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
