import { calculateTourDistance } from '../../core/distance.ts';
import { SolverYieldEvent } from '../../types/solver.ts';

/**
 * Held-Karp Algorithm (Exact TSP using Dynamic Programming with Bitmask).
 * Complexity: O(n^2 * 2^n), optimal for N <= 22.
 */
export function solveHeldKarp(
  matrix: number[][],
  startNode = 0,
  onYield?: (event: Partial<SolverYieldEvent>) => void
): { tour: number[]; distance: number; executionTimeMs: number } {
  const startTime = performance.now();
  const n = matrix.length;

  if (n <= 1) {
    return { tour: [0, 0], distance: 0, executionTimeMs: 0 };
  }

  // Safety guard for maximum bitmask size
  if (n > 23) {
    throw new Error('Held-Karp exact solver is limited to N <= 23 due to exponential memory constraints.');
  }

  // memo[mask][u] = minimum distance to visit set represented by bitmask ending at u
  const numStates = 1 << n;
  const memo: Float64Array[] = Array.from({ length: numStates }, () =>
    new Float64Array(n).fill(Infinity)
  );
  const parent: Int8Array[] = Array.from({ length: numStates }, () =>
    new Int8Array(n).fill(-1)
  );

  // Base cases: distance from startNode to node i
  for (let i = 0; i < n; i++) {
    if (i !== startNode) {
      memo[(1 << startNode) | (1 << i)][i] = matrix[startNode][i];
      parent[(1 << startNode) | (1 << i)][i] = startNode;
    }
  }

  // DP Transitions
  let step = 0;
  for (let size = 3; size <= n; size++) {
    // Generate all subsets of size `size` containing startNode
    for (let mask = 0; mask < numStates; mask++) {
      if ((mask & (1 << startNode)) === 0) continue;
      if (countBits(mask) !== size) continue;

      step++;
      for (let last = 0; last < n; last++) {
        if (last === startNode || (mask & (1 << last)) === 0) continue;

        const prevMask = mask ^ (1 << last);
        let minCost = Infinity;
        let bestParent = -1;

        for (let prev = 0; prev < n; prev++) {
          if (prev === last || (prevMask & (1 << prev)) === 0) continue;

          const cost = memo[prevMask][prev] + matrix[prev][last];
          if (cost < minCost) {
            minCost = cost;
            bestParent = prev;
          }
        }

        memo[mask][last] = minCost;
        parent[mask][last] = bestParent;
      }
    }

    if (onYield && step % 100 === 0) {
      onYield({
        iteration: size,
        done: false,
      });
    }
  }

  // Connect the last node back to startNode
  const fullMask = numStates - 1;
  let minTourDist = Infinity;
  let lastNode = -1;

  for (let i = 0; i < n; i++) {
    if (i !== startNode) {
      const tourCost = memo[fullMask][i] + matrix[i][startNode];
      if (tourCost < minTourDist) {
        minTourDist = tourCost;
        lastNode = i;
      }
    }
  }

  // Reconstruct optimal tour path
  const optimalTour: number[] = [startNode];
  let currMask = fullMask;
  let currNode = lastNode;

  const reversePath: number[] = [];
  while (currNode !== -1 && currNode !== startNode) {
    reversePath.push(currNode);
    const p = parent[currMask][currNode];
    currMask = currMask ^ (1 << currNode);
    currNode = p;
  }

  reversePath.reverse();
  optimalTour.push(...reversePath, startNode);

  const totalDist = calculateTourDistance(optimalTour, matrix);
  const elapsed = performance.now() - startTime;

  return { tour: optimalTour, distance: totalDist, executionTimeMs: elapsed };
}

function countBits(n: number): number {
  let count = 0;
  let val = n;
  while (val > 0) {
    val &= val - 1;
    count++;
  }
  return count;
}
