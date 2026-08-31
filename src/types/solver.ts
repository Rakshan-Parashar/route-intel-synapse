import { CityNode } from './graph.ts';

export type AlgorithmType =
  | 'nearest-neighbor'
  | 'two-opt'
  | 'three-opt'
  | 'christofides'
  | 'simulated-annealing'
  | 'genetic-algorithm'
  | 'ant-colony'
  | 'held-karp'
  | 'branch-and-bound'
  | 'slime-mold';

export interface AlgorithmMetadata {
  id: AlgorithmType;
  name: string;
  category: 'Exact' | 'Heuristic' | 'Metaheuristic' | 'Bio-Inspired';
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  color: string;
  badge: string;
}

export interface SolverParams {
  algorithm: AlgorithmType;
  nodes: CityNode[];
  depotIndex?: number;
  // Metaheuristic params
  maxIterations?: number;
  populationSize?: number;
  mutationRate?: number;
  coolingRate?: number;
  initialTemperature?: number;
  antCount?: number;
  evaporationRate?: number;
}

export interface SolverYieldEvent {
  algorithm: AlgorithmType;
  iteration: number;
  currentTour: number[];
  bestTour: number[];
  bestDistance: number;
  temperature?: number;
  pheromones?: number[][];
  populationDiversity?: number;
  metrics?: {
    swaps?: number;
    evaluations?: number;
    generations?: number;
    iterations?: number;
  };
  done: boolean;
  executionTimeMs: number;
}
