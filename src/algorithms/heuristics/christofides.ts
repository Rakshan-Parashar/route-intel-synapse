import { calculateTourDistance } from '../../core/distance.ts';
import { SolverYieldEvent } from '../../types/solver.ts';

/**
 * Christofides Algorithm for Metric TSP (1.5-Approximation).
 * 1. Build Minimum Spanning Tree (MST).
 * 2. Find set O of odd-degree vertices.
 * 3. Find minimum weight perfect matching on O.
 * 4. Combine MST + Matching into an Eulerian multigraph.
 * 5. Find Eulerian circuit and shortcut to form Hamiltonian cycle.
 */
export function solveChristofides(
  matrix: number[][],
  startNode = 0,
  onYield?: (event: Partial<SolverYieldEvent>) => void
): { tour: number[]; distance: number; executionTimeMs: number } {
  const startTime = performance.now();
  const n = matrix.length;

  if (n <= 1) return { tour: [0, 0], distance: 0, executionTimeMs: 0 };
  if (n === 2) return { tour: [0, 1, 0], distance: matrix[0][1] * 2, executionTimeMs: 0 };

  // Step 1: Minimum Spanning Tree via Prim's Algorithm
  const mstAdj: number[][] = Array.from({ length: n }, () => []);
  const inMST = new Array<boolean>(n).fill(false);
  const minEdge = new Array<number>(n).fill(Infinity);
  const parent = new Array<number>(n).fill(-1);

  minEdge[0] = 0;

  for (let step = 0; step < n; step++) {
    let u = -1;
    let minCost = Infinity;

    for (let i = 0; i < n; i++) {
      if (!inMST[i] && minEdge[i] < minCost) {
        minCost = minEdge[i];
        u = i;
      }
    }

    if (u === -1) break;
    inMST[u] = true;

    if (parent[u] !== -1) {
      mstAdj[u].push(parent[u]);
      mstAdj[parent[u]].push(u);
    }

    for (let v = 0; v < n; v++) {
      if (!inMST[v] && matrix[u][v] < minEdge[v]) {
        minEdge[v] = matrix[u][v];
        parent[v] = u;
      }
    }
  }

  // Step 2: Find odd-degree vertices in MST
  const oddVertices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (mstAdj[i].length % 2 !== 0) {
      oddVertices.push(i);
    }
  }

  // Step 3: Minimum Weight Matching on odd vertices (Greedy heuristic matching)
  const matched = new Set<number>();
  const matchingEdges: [number, number][] = [];
  const oddNodes = [...oddVertices];

  while (oddNodes.length > matched.size) {
    let bestU = -1, bestV = -1, minD = Infinity;

    for (const u of oddNodes) {
      if (matched.has(u)) continue;
      for (const v of oddNodes) {
        if (u === v || matched.has(v)) continue;
        if (matrix[u][v] < minD) {
          minD = matrix[u][v];
          bestU = u;
          bestV = v;
        }
      }
    }

    if (bestU !== -1 && bestV !== -1) {
      matched.add(bestU);
      matched.add(bestV);
      matchingEdges.push([bestU, bestV]);
    } else {
      break;
    }
  }

  // Step 4: Combine MST + Matching into multigraph adjacency
  const multigraph: number[][] = Array.from({ length: n }, () => []);
  for (let u = 0; u < n; u++) {
    for (const v of mstAdj[u]) {
      multigraph[u].push(v);
    }
  }
  for (const [u, v] of matchingEdges) {
    multigraph[u].push(v);
    multigraph[v].push(u);
  }

  // Step 5: Eulerian Tour (Hierholzer's algorithm)
  const tempGraph: number[][] = multigraph.map((row) => [...row]);
  const stack: number[] = [startNode];
  const eulerianCircuit: number[] = [];

  while (stack.length > 0) {
    const curr = stack[stack.length - 1];
    if (tempGraph[curr].length > 0) {
      const next = tempGraph[curr].pop()!;
      // Remove back edge
      const backIdx = tempGraph[next].indexOf(curr);
      if (backIdx !== -1) tempGraph[next].splice(backIdx, 1);
      stack.push(next);
    } else {
      eulerianCircuit.push(stack.pop()!);
    }
  }

  // Step 6: Shortcut Eulerian Tour to form Hamiltonian cycle
  const visited = new Set<number>();
  const tour: number[] = [];

  for (const node of eulerianCircuit.reverse()) {
    if (!visited.has(node)) {
      visited.add(node);
      tour.push(node);
    }
  }
  tour.push(startNode);

  const totalDist = calculateTourDistance(tour, matrix);
  const elapsed = performance.now() - startTime;

  if (onYield) {
    onYield({
      iteration: 1,
      currentTour: tour,
      bestTour: tour,
      bestDistance: totalDist,
      done: true,
      executionTimeMs: elapsed,
    });
  }

  return { tour, distance: totalDist, executionTimeMs: elapsed };
}
