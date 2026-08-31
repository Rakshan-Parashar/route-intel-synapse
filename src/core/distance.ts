import { Point2D } from '../types/graph.ts';

/**
 * Standard 2D Euclidean Distance
 */
export function euclideanDistance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Manhattan (Taxicab / Grid) Distance
 */
export function manhattanDistance(a: Point2D, b: Point2D): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Haversine Great-Circle Distance on Earth's Sphere in Kilometers
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the total round-trip tour distance using a distance matrix.
 */
export function calculateTourDistance(tour: number[], matrix: number[][]): number {
  if (!tour || tour.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < tour.length - 1; i++) {
    const from = tour[i];
    const to = tour[i + 1];
    total += matrix[from][to];
  }
  return total;
}

/**
 * Validates if a tour is a valid Hamiltonian cycle visiting all nodes exactly once and returning to start.
 */
export function isTourValid(tour: number[], expectedNodeCount: number): boolean {
  if (tour.length !== expectedNodeCount + 1) return false;
  if (tour[0] !== tour[tour.length - 1]) return false;

  const visited = new Set<number>();
  for (let i = 0; i < tour.length - 1; i++) {
    const node = tour[i];
    if (node < 0 || node >= expectedNodeCount || visited.has(node)) {
      return false;
    }
    visited.add(node);
  }
  return visited.size === expectedNodeCount;
}
