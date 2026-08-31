import { SolverParams, SolverYieldEvent } from '../types/solver.ts';
import { buildDistanceMatrix } from '../core/matrix.ts';
import { solveNearestNeighbor } from '../algorithms/heuristics/nearestNeighbor.ts';
import { solveTwoOpt } from '../algorithms/heuristics/twoOpt.ts';
import { solveChristofides } from '../algorithms/heuristics/christofides.ts';
import { solveHeldKarp } from '../algorithms/exact/heldKarp.ts';
import { solveSimulatedAnnealing } from '../algorithms/metaheuristics/simulatedAnnealing.ts';
import { solveGeneticAlgorithm } from '../algorithms/metaheuristics/geneticAlgorithm.ts';
import { solveAntColony } from '../algorithms/metaheuristics/antColony.ts';

self.onmessage = (e: MessageEvent<SolverParams>) => {
  const params = e.data;
  const startTime = performance.now();
  const matrix = buildDistanceMatrix(params.nodes);
  const depot = params.depotIndex ?? 0;

  const emitYield = (partial: Partial<SolverYieldEvent>) => {
    const elapsed = performance.now() - startTime;
    self.postMessage({
      algorithm: params.algorithm,
      executionTimeMs: elapsed,
      ...partial,
    } as SolverYieldEvent);
  };

  try {
    switch (params.algorithm) {
      case 'nearest-neighbor': {
        const result = solveNearestNeighbor(matrix, depot, (y) => emitYield(y));
        emitYield({
          iteration: params.nodes.length,
          currentTour: result.tour,
          bestTour: result.tour,
          bestDistance: result.distance,
          done: true,
        });
        break;
      }

      case 'two-opt': {
        const init = solveNearestNeighbor(matrix, depot);
        emitYield({
          iteration: 0,
          currentTour: init.tour,
          bestTour: init.tour,
          bestDistance: init.distance,
          done: false,
        });

        const result = solveTwoOpt(init.tour, matrix, params.maxIterations ?? 3000, (y) => emitYield(y));
        emitYield({
          iteration: result.iterations,
          currentTour: result.tour,
          bestTour: result.tour,
          bestDistance: result.distance,
          done: true,
        });
        break;
      }

      case 'christofides': {
        const result = solveChristofides(matrix, depot, (y) => emitYield(y));
        emitYield({
          iteration: 1,
          currentTour: result.tour,
          bestTour: result.tour,
          bestDistance: result.distance,
          done: true,
        });
        break;
      }

      case 'held-karp': {
        if (params.nodes.length > 22) {
          throw new Error('Held-Karp exact solver is restricted to N <= 22 nodes due to O(2^N) memory limits.');
        }
        const result = solveHeldKarp(matrix, depot, (y) => emitYield(y));
        emitYield({
          iteration: params.nodes.length,
          currentTour: result.tour,
          bestTour: result.tour,
          bestDistance: result.distance,
          done: true,
        });
        break;
      }

      case 'simulated-annealing': {
        const init = solveNearestNeighbor(matrix, depot);
        const result = solveSimulatedAnnealing(
          init.tour,
          matrix,
          {
            initialTemp: params.initialTemperature ?? 1000,
            coolingRate: params.coolingRate ?? 0.996,
            maxIterations: params.maxIterations ?? 4000,
          },
          (y) => emitYield(y)
        );
        emitYield({
          iteration: result.iterations,
          currentTour: result.tour,
          bestTour: result.tour,
          bestDistance: result.distance,
          done: true,
        });
        break;
      }

      case 'genetic-algorithm': {
        const result = solveGeneticAlgorithm(
          matrix,
          depot,
          {
            populationSize: params.populationSize ?? 60,
            generations: params.maxIterations ?? 200,
            mutationRate: params.mutationRate ?? 0.15,
          },
          (y) => emitYield(y)
        );
        emitYield({
          iteration: result.generations,
          currentTour: result.tour,
          bestTour: result.tour,
          bestDistance: result.distance,
          done: true,
        });
        break;
      }

      case 'ant-colony': {
        const result = solveAntColony(
          matrix,
          depot,
          {
            antCount: params.antCount ?? Math.min(30, Math.max(10, params.nodes.length)),
            iterations: params.maxIterations ?? 80,
            evaporationRate: params.evaporationRate ?? 0.1,
          },
          (y) => emitYield(y)
        );
        emitYield({
          iteration: result.iterations,
          currentTour: result.tour,
          bestTour: result.tour,
          bestDistance: result.distance,
          pheromones: result.pheromones,
          done: true,
        });
        break;
      }

      default: {
        const result = solveNearestNeighbor(matrix, depot);
        emitYield({
          iteration: params.nodes.length,
          currentTour: result.tour,
          bestTour: result.tour,
          bestDistance: result.distance,
          done: true,
        });
        break;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({
      algorithm: params.algorithm,
      error: message,
      done: true,
      executionTimeMs: performance.now() - startTime,
    });
  }
};
