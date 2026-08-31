import { CityNode, DistanceMetric } from '../types/graph.ts';
import { euclideanDistance, haversineDistance, manhattanDistance } from './distance.ts';

/**
 * Builds an N x N Distance Matrix from a list of City nodes.
 */
export function buildDistanceMatrix(nodes: CityNode[], metric: DistanceMetric = 'euclidean'): number[][] {
  const n = nodes.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let dist = 0;
      if (metric === 'haversine' && nodes[i].lat !== undefined && nodes[i].lng !== undefined && nodes[j].lat !== undefined && nodes[j].lng !== undefined) {
        dist = haversineDistance(nodes[i].lat!, nodes[i].lng!, nodes[j].lat!, nodes[j].lng!);
      } else if (metric === 'manhattan') {
        dist = manhattanDistance(nodes[i], nodes[j]);
      } else {
        dist = euclideanDistance(nodes[i], nodes[j]);
      }

      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }

  return matrix;
}

/**
 * Procedurally generates random 2D city nodes
 */
export function generateRandomPoints(count: number, width: number, height: number, padding = 60): CityNode[] {
  const nodes: CityNode[] = [];
  const safeW = Math.max(100, width - padding * 2);
  const safeH = Math.max(100, height - padding * 2);

  for (let i = 0; i < count; i++) {
    nodes.push({
      id: i,
      name: i === 0 ? 'DEPOT' : String.fromCharCode(64 + i <= 90 ? 64 + i : 65 + (i % 26)),
      x: padding + Math.random() * safeW,
      y: padding + Math.random() * safeH,
      demand: Math.floor(Math.random() * 10) + 1,
    });
  }

  return nodes;
}

/**
 * Generates clustered distribution of points (representing metro hubs and satellites)
 */
export function generateClusteredPoints(count: number, clusterCount = 3, width: number, height: number, padding = 60): CityNode[] {
  const nodes: CityNode[] = [];
  const safeW = width - padding * 2;
  const safeH = height - padding * 2;

  const clusterCenters: { x: number; y: number }[] = [];
  for (let c = 0; c < clusterCount; c++) {
    clusterCenters.push({
      x: padding + Math.random() * safeW,
      y: padding + Math.random() * safeH,
    });
  }

  for (let i = 0; i < count; i++) {
    const center = i === 0 ? { x: width * 0.5, y: height * 0.5 } : clusterCenters[i % clusterCount];
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(width, height) * 0.15;

    nodes.push({
      id: i,
      name: i === 0 ? 'DEPOT' : String.fromCharCode(64 + i <= 90 ? 64 + i : 65 + (i % 26)),
      x: Math.max(padding, Math.min(width - padding, center.x + Math.cos(angle) * radius)),
      y: Math.max(padding, Math.min(height - padding, center.y + Math.sin(angle) * radius)),
      demand: Math.floor(Math.random() * 8) + 1,
    });
  }

  return nodes;
}

/**
 * Generates circular distribution of points
 */
export function generateCirclePoints(count: number, centerX: number, centerY: number, radius: number): CityNode[] {
  const nodes: CityNode[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    nodes.push({
      id: i,
      name: i === 0 ? 'DEPOT' : String.fromCharCode(64 + i <= 90 ? 64 + i : 65 + (i % 26)),
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      demand: 5,
    });
  }
  return nodes;
}
