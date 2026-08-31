import { describe, it, expect } from 'vitest';
import { TSPLIB_BENCHMARKS } from '../benchmarks.ts';
import { exportToGeoJSON, exportToCSV } from '../../utils/exportTools.ts';

describe('TSPLIB Benchmarks & Export Tools', () => {
  it('loads berlin52 and eil51 benchmarks with valid node counts', () => {
    expect(TSPLIB_BENCHMARKS.berlin52.nodes.length).toBe(52);
    expect(TSPLIB_BENCHMARKS.berlin52.optimalDistance).toBe(7542);

    expect(TSPLIB_BENCHMARKS.eil51.nodes.length).toBe(51);
    expect(TSPLIB_BENCHMARKS.eil51.optimalDistance).toBe(426);
  });

  it('exports valid GeoJSON feature collection string', () => {
    const nodes = [
      { id: 0, name: 'A', x: 10, y: 10, lng: 2.3, lat: 48.8 },
      { id: 1, name: 'B', x: 20, y: 20, lng: 2.4, lat: 48.9 },
    ];
    const geoJsonStr = exportToGeoJSON(nodes, [0, 1, 0]);
    const parsed = JSON.parse(geoJsonStr);

    expect(parsed.type).toBe('FeatureCollection');
    expect(parsed.features.length).toBe(3); // 2 Points + 1 LineString
  });

  it('exports valid CSV formatted string with headers', () => {
    const nodes = [
      { id: 0, name: 'Depot', x: 0, y: 0, demand: 0 },
      { id: 1, name: 'City 1', x: 10, y: 10, demand: 5 },
    ];
    const csv = exportToCSV(nodes, [0, 1, 0], 40);

    expect(csv).toContain('Step,City_ID,City_Name');
    expect(csv).toContain('Total_Distance_px,40.00');
  });
});
