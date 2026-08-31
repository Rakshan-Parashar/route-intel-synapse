import { calculateTourDistance } from '../../core/distance.ts';
import { SolverYieldEvent } from '../../types/solver.ts';

/**
 * Genetic Algorithm Solver for TSP.
 * Implements Ordered Crossover (OX1), Inversion Mutation, and Elitism.
 */
export function solveGeneticAlgorithm(
  matrix: number[][],
  startNode = 0,
  options: {
    populationSize?: number;
    generations?: number;
    mutationRate?: number;
    tournamentSize?: number;
  } = {},
  onYield?: (event: Partial<SolverYieldEvent>) => void
): { tour: number[]; distance: number; generations: number } {
  const n = matrix.length;
  const popSize = options.populationSize ?? 60;
  const maxGenerations = options.generations ?? 200;
  const mutationRate = options.mutationRate ?? 0.15;
  const tournamentSize = options.tournamentSize ?? 5;

  if (n <= 2) {
    const tour = n === 2 ? [0, 1, 0] : [0, 0];
    return { tour, distance: calculateTourDistance(tour, matrix), generations: 0 };
  }

  // Base list of cities excluding start depot
  const cities: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i !== startNode) cities.push(i);
  }

  // 1. Initialize random population
  let population: number[][] = [];
  for (let i = 0; i < popSize; i++) {
    const chromosome = shuffleArray([...cities]);
    population.push(chromosome);
  }

  const getDistance = (chromosome: number[]): number => {
    const fullTour = [startNode, ...chromosome, startNode];
    return calculateTourDistance(fullTour, matrix);
  };

  let bestChromosome = population[0];
  let bestDist = getDistance(bestChromosome);

  for (const chrom of population) {
    const d = getDistance(chrom);
    if (d < bestDist) {
      bestDist = d;
      bestChromosome = [...chrom];
    }
  }

  // 2. Evolution Loop
  for (let gen = 1; gen <= maxGenerations; gen++) {
    const nextPopulation: number[][] = [];

    // Elitism: Preserve top 2 individuals
    population.sort((a, b) => getDistance(a) - getDistance(b));
    nextPopulation.push([...population[0]]);
    nextPopulation.push([...population[1]]);

    if (getDistance(population[0]) < bestDist) {
      bestDist = getDistance(population[0]);
      bestChromosome = [...population[0]];
    }

    while (nextPopulation.length < popSize) {
      const parentA = tournamentSelect(population, tournamentSize, getDistance);
      const parentB = tournamentSelect(population, tournamentSize, getDistance);

      let child = orderedCrossover(parentA, parentB);

      if (Math.random() < mutationRate) {
        child = mutateInversion(child);
      }

      nextPopulation.push(child);
    }

    population = nextPopulation;

    if (onYield && gen % 5 === 0) {
      const fullBest = [startNode, ...bestChromosome, startNode];
      onYield({
        iteration: gen,
        currentTour: fullBest,
        bestTour: fullBest,
        bestDistance: bestDist,
        metrics: { generations: gen, evaluations: gen * popSize },
        done: false,
      });
    }
  }

  const optimalTour = [startNode, ...bestChromosome, startNode];
  return { tour: optimalTour, distance: bestDist, generations: maxGenerations };
}

function shuffleArray(arr: number[]): number[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function tournamentSelect(
  population: number[][],
  size: number,
  fitnessFn: (chrom: number[]) => number
): number[] {
  let best = population[Math.floor(Math.random() * population.length)];
  let bestScore = fitnessFn(best);

  for (let i = 1; i < size; i++) {
    const candidate = population[Math.floor(Math.random() * population.length)];
    const score = fitnessFn(candidate);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

// Order 1 Crossover (OX1)
function orderedCrossover(p1: number[], p2: number[]): number[] {
  const len = p1.length;
  const start = Math.floor(Math.random() * (len - 1));
  const end = start + 1 + Math.floor(Math.random() * (len - start));

  const child: (number | null)[] = new Array(len).fill(null);
  const segment = new Set<number>();

  for (let i = start; i < end; i++) {
    child[i] = p1[i];
    segment.add(p1[i]);
  }

  let p2Idx = 0;
  for (let i = 0; i < len; i++) {
    if (child[i] === null) {
      while (p2Idx < p2.length && segment.has(p2[p2Idx])) {
        p2Idx++;
      }
      if (p2Idx < p2.length) {
        child[i] = p2[p2Idx];
        p2Idx++;
      }
    }
  }

  return child as number[];
}

// Inversion mutation
function mutateInversion(chromosome: number[]): number[] {
  const c = [...chromosome];
  const i = Math.floor(Math.random() * c.length);
  const j = Math.floor(Math.random() * c.length);
  const start = Math.min(i, j);
  const end = Math.max(i, j);

  const segment = c.slice(start, end + 1).reverse();
  c.splice(start, segment.length, ...segment);
  return c;
}
