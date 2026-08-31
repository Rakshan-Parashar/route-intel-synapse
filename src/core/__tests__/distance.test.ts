import { describe, it, expect } from 'vitest';
import { euclideanDistance, manhattanDistance, calculateTourDistance, isTourValid } from '../distance.ts';
import { buildDistanceMatrix, generateCirclePoints } from '../matrix.ts';

describe('Geometry & Distance Core', () => {
  it('calculates Euclidean distance correctly (3-4-5 right triangle)', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 3, y: 4 };
    expect(euclideanDistance(a, b)).toBe(5);
  });

  it('calculates Manhattan distance correctly', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 3, y: 4 };
    expect(manhattanDistance(a, b)).toBe(7);
  });

  it('builds a symmetric distance matrix with 0 on diagonal', () => {
    const nodes = [
      { id: 0, name: 'A', x: 0, y: 0 },
      { id: 1, name: 'B', x: 0, y: 10 },
      { id: 2, name: 'C', x: 10, y: 0 },
    ];
    const matrix = buildDistanceMatrix(nodes, 'euclidean');

    expect(matrix[0][0]).toBe(0);
    expect(matrix[1][1]).toBe(0);
    expect(matrix[2][2]).toBe(0);

    expect(matrix[0][1]).toBe(10);
    expect(matrix[1][0]).toBe(10); // Symmetry

    expect(matrix[0][2]).toBe(10);
    expect(matrix[2][0]).toBe(10);
  });

  it('calculates tour length accurately', () => {
    const nodes = [
      { id: 0, name: 'A', x: 0, y: 0 },
      { id: 1, name: 'B', x: 0, y: 10 },
      { id: 2, name: 'C', x: 10, y: 10 },
      { id: 3, name: 'D', x: 10, y: 0 },
    ];
    const matrix = buildDistanceMatrix(nodes);
    // Square perimeter: 10 + 10 + 10 + 10 = 40
    const tour = [0, 1, 2, 3, 0];

    expect(calculateTourDistance(tour, matrix)).toBe(40);
    expect(isTourValid(tour, 4)).toBe(true);
  });

  it('detects invalid tours', () => {
    // Missing node 3
    expect(isTourValid([0, 1, 2, 0], 4)).toBe(false);
    // Doesn't loop back to start
    expect(isTourValid([0, 1, 2, 3, 1], 4)).toBe(false);
  });

  it('generates circular points correctly', () => {
    const circle = generateCirclePoints(4, 100, 100, 50);
    expect(circle.length).toBe(4);
    expect(circle[0].x).toBeCloseTo(150);
    expect(circle[0].y).toBeCloseTo(100);
  });
});
