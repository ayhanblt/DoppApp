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
