import { CityNode } from '../types/graph.ts';

/**
 * Encodes node coordinates into a compressed URL hash.
 */
export function encodeRouteToURL(nodes: CityNode[]): string {
  const simplified = nodes.map((n) => [Math.round(n.x), Math.round(n.y)]);
  const json = JSON.stringify(simplified);
  const base64 = btoa(json);
  return `${window.location.origin}${window.location.pathname}#nodes=${base64}`;
}

/**
 * Decodes URL hash back into CityNode array.
 */
export function decodeRouteFromURL(): CityNode[] | null {
  try {
    const hash = window.location.hash;
    if (!hash.includes('nodes=')) return null;
    const base64 = hash.split('nodes=')[1];
    const json = atob(base64);
    const coords: [number, number][] = JSON.parse(json);
    return coords.map(([x, y], idx) => ({
      id: idx,
      name: idx === 0 ? 'DEPOT' : String.fromCharCode(64 + idx),
      x,
      y,
      demand: (idx % 6) + 2,
    }));
  } catch {
    return null;
  }
}

/**
 * Exports route as GeoJSON FeatureCollection.
 */
export function exportToGeoJSON(nodes: CityNode[], route: number[]): string {
  const points = nodes.map((n) => ({
    type: 'Feature',
    properties: { id: n.id, name: n.name, demand: n.demand },
    geometry: {
      type: 'Point',
      coordinates: [n.lng ?? n.x, n.lat ?? n.y],
    },
  }));

  const lineCoords = route.map((id) => [nodes[id]?.lng ?? nodes[id]?.x, nodes[id]?.lat ?? nodes[id]?.y]);

  const geoJson = {
    type: 'FeatureCollection',
    features: [
      ...points,
      {
        type: 'Feature',
        properties: { name: 'Optimized Route' },
        geometry: {
          type: 'LineString',
          coordinates: lineCoords,
        },
      },
    ],
  };

  return JSON.stringify(geoJson, null, 2);
}

/**
 * Exports itinerary to CSV.
 */
export function exportToCSV(nodes: CityNode[], route: number[], totalDistance: number): string {
  let csv = 'Step,City_ID,City_Name,Coord_X,Coord_Y,Demand_Pkgs\n';
  route.forEach((id, step) => {
    const n = nodes[id];
    if (n) {
      csv += `${step + 1},${n.id},"${n.name}",${n.x.toFixed(1)},${n.y.toFixed(1)},${n.demand ?? 0}\n`;
    }
  });
  csv += `\nTotal_Distance_px,${totalDistance.toFixed(2)}\n`;
  return csv;
}

/**
 * Downloads a string content as a client-side file.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
