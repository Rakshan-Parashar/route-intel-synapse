import { CityNode } from '../types/graph.ts';
import { haversineDistance } from './distance.ts';

export interface OSRMRouteResult {
  polyline: [number, number][]; // [lat, lng] coordinates
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Fetches real driving turn-by-turn road polylines from the free Open Source Routing Machine (OSRM) API.
 * Falls back to straight-line interpolation if offline or request fails.
 */
export async function fetchOSRMRoute(start: CityNode, end: CityNode): Promise<OSRMRouteResult> {
  if (start.lat === undefined || start.lng === undefined || end.lat === undefined || end.lng === undefined) {
    return {
      polyline: [
        [start.lat ?? 0, start.lng ?? 0],
        [end.lat ?? 0, end.lng ?? 0],
      ],
      distanceMeters: 0,
      durationSeconds: 0,
    };
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`OSRM HTTP error ${response.status}`);

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );

      return {
        polyline: coords,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
      };
    }
  } catch {
    // Fallback: Haversine straight line
  }

  const distKm = haversineDistance(start.lat, start.lng, end.lat, end.lng);
  return {
    polyline: [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ],
    distanceMeters: distKm * 1000,
    durationSeconds: (distKm / 40) * 3600, // 40 km/h avg city speed
  };
}

/**
 * Geocodes city/address queries using the free Nominatim OpenStreetMap API.
 */
export async function searchAddressOSM(query: string): Promise<{ name: string; lat: number; lng: number }[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: { display_name: string; lat: string; lon: string }) => ({
      name: item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
