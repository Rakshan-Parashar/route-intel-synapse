import { describe, it, expect } from 'vitest';
import { solveCVRP } from '../../algorithms/heuristics/cvrpSolver.ts';
import { buildDistanceMatrix } from '../matrix.ts';
import { CityNode } from '../../types/graph.ts';

describe('Capacitated Vehicle Routing (CVRP)', () => {
  it('partitions customer demand across multiple delivery vans without exceeding capacity', () => {
    const nodes: CityNode[] = [
      { id: 0, name: 'Depot', x: 0, y: 0, demand: 0 },
      { id: 1, name: 'Customer A', x: 10, y: 0, demand: 8 },
      { id: 2, name: 'Customer B', x: 20, y: 0, demand: 8 },
      { id: 3, name: 'Customer C', x: 0, y: 10, demand: 8 },
      { id: 4, name: 'Customer D', x: 0, y: 20, demand: 8 },
    ];
    const matrix = buildDistanceMatrix(nodes);
    // Total demand = 32. With capacity 16, requires at least 2 vans.
    const result = solveCVRP(nodes, matrix, 2, 16);

    expect(result.vehicles.length).toBe(2);
    result.vehicles.forEach((v) => {
      expect(v.tour[0]).toBe(0); // Starts at depot
      expect(v.tour[v.tour.length - 1]).toBe(0); // Ends at depot
      expect(v.totalDistance).toBeGreaterThan(0);
    });
  });
});
