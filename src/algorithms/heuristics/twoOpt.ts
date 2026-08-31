import { calculateTourDistance } from '../../core/distance.ts';
import { SolverYieldEvent } from '../../types/solver.ts';

/**
 * 2-Opt Local Search optimization algorithm.
 * Iteratively uncrosses overlapping edges by reversing path segments.
 */
export function solveTwoOpt(
  initialTour: number[],
  matrix: number[][],
  maxIterations = 2000,
  onYield?: (event: Partial<SolverYieldEvent>) => void
): { tour: number[]; distance: number; iterations: number } {
  let currentTour = [...initialTour];
  const n = currentTour.length - 1; // excluding return to depot
  let bestDist = calculateTourDistance(currentTour, matrix);
  let improved = true;
  let iteration = 0;
  let swapCount = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        // Delta calculation: distance change if we reverse segment i..k
        const a = currentTour[i - 1];
        const b = currentTour[i];
        const c = currentTour[k];
        const d = currentTour[k + 1];

        const oldDist = matrix[a][b] + matrix[c][d];
        const newDist = matrix[a][c] + matrix[b][d];

        if (newDist < oldDist - 1e-6) {
          // Perform 2-opt swap: reverse array slice from i to k
          const segment = currentTour.slice(i, k + 1).reverse();
          currentTour = [
            ...currentTour.slice(0, i),
            ...segment,
            ...currentTour.slice(k + 1),
          ];

          bestDist = calculateTourDistance(currentTour, matrix);
          improved = true;
          swapCount++;

          if (onYield) {
            onYield({
              iteration,
              currentTour: [...currentTour],
              bestTour: [...currentTour],
              bestDistance: bestDist,
              metrics: { swaps: swapCount, iterations: iteration },
              done: false,
            });
          }
          break;
        }
      }
      if (improved) break;
    }
  }

  return { tour: currentTour, distance: bestDist, iterations: iteration };
}
