import { describe, it, expect } from 'vitest';
import { solveNearestNeighbor } from '../heuristics/nearestNeighbor.ts';
import { solveTwoOpt } from '../heuristics/twoOpt.ts';
import { buildDistanceMatrix, generateCirclePoints } from '../../core/matrix.ts';
import { isTourValid } from '../../core/distance.ts';

describe('Heuristic Solvers', () => {
  it('Nearest Neighbor produces a valid tour', () => {
    const nodes = [
      { id: 0, name: 'A', x: 0, y: 0 },
      { id: 1, name: 'B', x: 10, y: 0 },
      { id: 2, name: 'C', x: 10, y: 10 },
      { id: 3, name: 'D', x: 0, y: 10 },
    ];
    const matrix = buildDistanceMatrix(nodes);
    const result = solveNearestNeighbor(matrix, 0);

    expect(isTourValid(result.tour, 4)).toBe(true);
    expect(result.distance).toBe(40);
  });

  it('2-Opt uncrosses a tangled tour on a circle', () => {
    // 8 points on a circle: a tangled initial tour should be optimized by 2-Opt
    const nodes = generateCirclePoints(8, 200, 200, 100);
    const matrix = buildDistanceMatrix(nodes);

    // Deliberately tangled tour
    const tangledTour = [0, 4, 1, 5, 2, 6, 3, 7, 0];
    const initialDist = solveNearestNeighbor(matrix, 0).distance;
    const result = solveTwoOpt(tangledTour, matrix);

    expect(isTourValid(result.tour, 8)).toBe(true);
    expect(result.distance).toBeLessThanOrEqual(initialDist + 1e-4);
  });
});
