import { calculateTourDistance } from '../../core/distance.ts';
import { SolverYieldEvent } from '../../types/solver.ts';

/**
 * Ant Colony Optimization (ACO) Solver for TSP.
 * Simulates artificial ants depositing pheromones on favorable edge paths.
 */
export function solveAntColony(
  matrix: number[][],
  startNode = 0,
  options: {
    antCount?: number;
    iterations?: number;
    alpha?: number; // Pheromone importance
    beta?: number;  // Heuristic distance importance
    evaporationRate?: number; // rho
    q?: number;     // Pheromone deposit factor
  } = {},
  onYield?: (event: Partial<SolverYieldEvent>) => void
): { tour: number[]; distance: number; iterations: number; pheromones: number[][] } {
  const n = matrix.length;
  const antCount = options.antCount ?? Math.min(30, Math.max(10, n));
  const maxIterations = options.iterations ?? 80;
  const alpha = options.alpha ?? 1.0;
  const beta = options.beta ?? 3.0;
  const rho = options.evaporationRate ?? 0.1;
  const Q = options.q ?? 100;

  if (n <= 2) {
    const tour = n === 2 ? [0, 1, 0] : [0, 0];
    const d = calculateTourDistance(tour, matrix);
    return { tour, distance: d, iterations: 0, pheromones: [] };
  }

  // 1. Initialize Pheromone matrix tau with small uniform values
  const initPheromone = 1.0 / (n * 10);
  const pheromones: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(initPheromone)
  );

  let bestTour: number[] = [];
  let bestDist = Infinity;

  // 2. Iteration Loop
  for (let iter = 1; iter <= maxIterations; iter++) {
    const antTours: number[][] = [];
    const antDistances: number[] = [];

    for (let ant = 0; ant < antCount; ant++) {
      const tour = [startNode];
      const visited = new Set<number>([startNode]);
      let current = startNode;

      while (visited.size < n) {
        // Calculate transition probabilities to unvisited cities
        const unvisited: number[] = [];
        const probabilities: number[] = [];
        let sum = 0;

        for (let next = 0; next < n; next++) {
          if (!visited.has(next)) {
            unvisited.push(next);
            const tau = Math.pow(Math.max(1e-6, pheromones[current][next]), alpha);
            const eta = Math.pow(1.0 / Math.max(1e-4, matrix[current][next]), beta);
            const prob = tau * eta;
            probabilities.push(prob);
            sum += prob;
          }
        }

        // Roulette wheel selection
        let selected = unvisited[0];
        if (sum > 0) {
          let rand = Math.random() * sum;
          for (let i = 0; i < unvisited.length; i++) {
            rand -= probabilities[i];
            if (rand <= 0) {
              selected = unvisited[i];
              break;
            }
          }
        }

        tour.push(selected);
        visited.add(selected);
        current = selected;
      }

      tour.push(startNode);
      const d = calculateTourDistance(tour, matrix);
      antTours.push(tour);
      antDistances.push(d);

      if (d < bestDist) {
        bestDist = d;
        bestTour = [...tour];
      }
    }

    // 3. Pheromone Evaporation
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        pheromones[i][j] *= (1 - rho);
      }
    }

    // 4. Pheromone Deposition by Ants
    for (let ant = 0; ant < antCount; ant++) {
      const tour = antTours[ant];
      const dist = antDistances[ant];
      const deposit = Q / dist;

      for (let i = 0; i < tour.length - 1; i++) {
        const u = tour[i];
        const v = tour[i + 1];
        pheromones[u][v] += deposit;
        pheromones[v][u] += deposit;
      }
    }

    if (onYield && iter % 4 === 0) {
      onYield({
        iteration: iter,
        currentTour: [...bestTour],
        bestTour: [...bestTour],
        bestDistance: bestDist,
        pheromones: pheromones.map((row) => [...row]),
        metrics: { iterations: iter, evaluations: iter * antCount },
        done: false,
      });
    }
  }

  return { tour: bestTour, distance: bestDist, iterations: maxIterations, pheromones };
}
