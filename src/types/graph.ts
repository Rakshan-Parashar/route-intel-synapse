export interface Point2D {
  x: number;
  y: number;
}

export interface CityNode {
  id: number;
  name: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  demand?: number; // For CVRP
  timeWindow?: [number, number]; // [startMin, endMin] For VRPTW
}

export interface TourResult {
  route: number[]; // Array of City IDs (including start depot at 0 and end depot)
  totalDistance: number;
  executionTimeMs: number;
  iterations: number;
  history?: { iteration: number; distance: number }[];
}

export type DistanceMetric = 'euclidean' | 'manhattan' | 'haversine';
