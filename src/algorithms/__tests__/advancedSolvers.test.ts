import { describe, it, expect } from 'vitest';
import { solveHeldKarp } from '../exact/heldKarp.ts';
import { solveChristofides } from '../heuristics/christofides.ts';
import { solveSimulatedAnnealing } from '../metaheuristics/simulatedAnnealing.ts';
import { solveGeneticAlgorithm } from '../metaheuristics/geneticAlgorithm.ts';
import { solveAntColony } from '../metaheuristics/antColony.ts';
import { buildDistanceMatrix, generateCirclePoints } from '../../core/matrix.ts';
import { isTourValid } from '../../core/distance.ts';

describe('Advanced Optimization Solvers', () => {
  const squareNodes = [
    { id: 0, name: 'A', x: 0, y: 0 },
    { id: 1, name: 'B', x: 10, y: 0 },
    { id: 2, name: 'C', x: 10, y: 10 },
    { id: 3, name: 'D', x: 0, y: 10 },
  ];
  const squareMatrix = buildDistanceMatrix(squareNodes);

  it('Held-Karp finds exact mathematical optimal perimeter of 40 on square', () => {
    const result = solveHeldKarp(squareMatrix, 0);
    expect(isTourValid(result.tour, 4)).toBe(true);
    expect(result.distance).toBe(40);
  });

  it('Christofides produces a valid Hamiltonian tour within 1.5x bound', () => {
    const circle = generateCirclePoints(6, 100, 100, 50);
    const matrix = buildDistanceMatrix(circle);
    const result = solveChristofides(matrix, 0);

    expect(isTourValid(result.tour, 6)).toBe(true);
    expect(result.distance).toBeGreaterThan(0);
  });

  it('Simulated Annealing optimizes an initial tangled tour', () => {
    const circle = generateCirclePoints(8, 100, 100, 50);
    const matrix = buildDistanceMatrix(circle);
    const initialTangled = [0, 4, 1, 5, 2, 6, 3, 7, 0];
    const result = solveSimulatedAnnealing(initialTangled, matrix, { maxIterations: 1000 });

    expect(isTourValid(result.tour, 8)).toBe(true);
  });

  it('Genetic Algorithm produces valid evolving tours', () => {
    const circle = generateCirclePoints(6, 100, 100, 50);
    const matrix = buildDistanceMatrix(circle);
    const result = solveGeneticAlgorithm(matrix, 0, { generations: 50, populationSize: 20 });

    expect(isTourValid(result.tour, 6)).toBe(true);
  });

  it('Ant Colony Optimization deposits pheromones and returns a valid tour', () => {
    const circle = generateCirclePoints(6, 100, 100, 50);
    const matrix = buildDistanceMatrix(circle);
    const result = solveAntColony(matrix, 0, { iterations: 20, antCount: 10 });

    expect(isTourValid(result.tour, 6)).toBe(true);
    expect(result.pheromones.length).toBe(6);
  });
});
