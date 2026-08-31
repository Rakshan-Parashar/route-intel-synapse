import { calculateTourDistance } from '../../core/distance.ts';
import { SolverYieldEvent } from '../../types/solver.ts';

/**
 * Simulated Annealing Metaheuristic.
 * Uses Metropolis acceptance criterion: P = exp(-delta / T)
 */
export function solveSimulatedAnnealing(
  initialTour: number[],
  matrix: number[][],
  options: {
    initialTemp?: number;
    coolingRate?: number;
    maxIterations?: number;
  } = {},
  onYield?: (event: Partial<SolverYieldEvent>) => void
): { tour: number[]; distance: number; iterations: number } {
  let currentTour = [...initialTour];
  let bestTour = [...initialTour];
  let currentDist = calculateTourDistance(currentTour, matrix);
  let bestDist = currentDist;

  const initialTemp = options.initialTemp ?? 1000;
  const coolingRate = options.coolingRate ?? 0.995;
  const maxIterations = options.maxIterations ?? 4000;

  let temperature = initialTemp;
  const n = currentTour.length - 1; // city count

  for (let iter = 1; iter <= maxIterations; iter++) {
    // Generate neighbor tour by reversing random subsegment or swapping two nodes
    const i = 1 + Math.floor(Math.random() * (n - 2));
    const j = i + 1 + Math.floor(Math.random() * (n - i - 1));

    // Reverse segment i..j (2-opt neighbor)
    const neighbor = [
      ...currentTour.slice(0, i),
      ...currentTour.slice(i, j + 1).reverse(),
      ...currentTour.slice(j + 1),
    ];

    const neighborDist = calculateTourDistance(neighbor, matrix);
    const delta = neighborDist - currentDist;

    // Metropolis criterion
    if (delta < 0 || Math.random() < Math.exp(-delta / Math.max(1e-5, temperature))) {
      currentTour = neighbor;
      currentDist = neighborDist;

      if (currentDist < bestDist) {
        bestDist = currentDist;
        bestTour = [...currentTour];
      }
    }

    temperature *= coolingRate;

    if (onYield && iter % 25 === 0) {
      onYield({
        iteration: iter,
        currentTour: [...currentTour],
        bestTour: [...bestTour],
        bestDistance: bestDist,
        temperature,
        metrics: { iterations: iter },
        done: false,
      });
    }

    if (temperature < 1e-4) break;
  }

  return { tour: bestTour, distance: bestDist, iterations: maxIterations };
}
