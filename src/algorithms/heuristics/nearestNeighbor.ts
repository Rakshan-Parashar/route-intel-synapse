import { calculateTourDistance } from '../../core/distance.ts';
import { SolverYieldEvent } from '../../types/solver.ts';

/**
 * Nearest Neighbor Heuristic solver.
 * Complexity: O(N^2)
 */
export function solveNearestNeighbor(
  matrix: number[][],
  startNode = 0,
  onYield?: (event: Partial<SolverYieldEvent>) => void
): { tour: number[]; distance: number } {
  const n = matrix.length;
  if (n <= 1) return { tour: [0, 0], distance: 0 };

  const unvisited = new Set<number>();
  for (let i = 0; i < n; i++) {
    if (i !== startNode) unvisited.add(i);
  }

  const tour: number[] = [startNode];
  let current = startNode;
  let step = 0;

  while (unvisited.size > 0) {
    let nearest = -1;
    let minDist = Infinity;

    for (const candidate of unvisited) {
      const dist = matrix[current][candidate];
      if (dist < minDist) {
        minDist = dist;
        nearest = candidate;
      }
    }

    tour.push(nearest);
    unvisited.delete(nearest);
    current = nearest;
    step++;

    if (onYield && step % 1 === 0) {
      const partialTour = [...tour, startNode];
      onYield({
        iteration: step,
        currentTour: partialTour,
        bestTour: partialTour,
        bestDistance: calculateTourDistance(partialTour, matrix),
        done: false,
      });
    }
  }

  tour.push(startNode);
  const totalDistance = calculateTourDistance(tour, matrix);

  return { tour, distance: totalDistance };
}
