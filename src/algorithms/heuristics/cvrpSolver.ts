import { CityNode } from '../../types/graph.ts';
import { calculateTourDistance } from '../../core/distance.ts';

export interface VehicleTour {
  vehicleId: number;
  vehicleName: string;
  color: string;
  tour: number[]; // Sequence of node IDs
  totalDistance: number;
  totalDemand: number;
  capacity: number;
}

const VEHICLE_COLORS = ['#00e5ff', '#ff3d71', '#39ff14', '#ffaa00', '#b537f2'];

/**
 * Solves Capacitated Vehicle Routing Problem (CVRP) using Clarke-Wright Savings / Greedy Cluster heuristic.
 */
export function solveCVRP(
  nodes: CityNode[],
  matrix: number[][],
  vehicleCount = 2,
  vehicleCapacity = 25
): { vehicles: VehicleTour[]; totalFleetDistance: number } {
  const n = nodes.length;
  if (n <= 1) return { vehicles: [], totalFleetDistance: 0 };

  const depot = 0;
  const unassigned = new Set<number>();
  for (let i = 1; i < n; i++) unassigned.add(i);

  const vehicleTours: VehicleTour[] = [];

  for (let v = 0; v < vehicleCount; v++) {
    const route: number[] = [depot];
    let currentCapacity = 0;
    let current = depot;

    while (unassigned.size > 0) {
      // Find nearest neighbor that fits within remaining cargo capacity
      let bestCandidate = -1;
      let minDistance = Infinity;

      for (const candidate of unassigned) {
        const demand = nodes[candidate].demand ?? 4;
        if (currentCapacity + demand <= vehicleCapacity) {
          const d = matrix[current][candidate];
          if (d < minDistance) {
            minDistance = d;
            bestCandidate = candidate;
          }
        }
      }

      if (bestCandidate !== -1) {
        route.push(bestCandidate);
        currentCapacity += nodes[bestCandidate].demand ?? 4;
        unassigned.delete(bestCandidate);
        current = bestCandidate;
      } else {
        // Vehicle is full, return to depot
        break;
      }
    }

    route.push(depot);
    const dist = calculateTourDistance(route, matrix);

    vehicleTours.push({
      vehicleId: v + 1,
      vehicleName: `Van #${v + 1}`,
      color: VEHICLE_COLORS[v % VEHICLE_COLORS.length],
      tour: route,
      totalDistance: dist,
      totalDemand: currentCapacity,
      capacity: vehicleCapacity,
    });

    if (unassigned.size === 0) break;
  }

  // If there are still unassigned nodes (not enough vehicles), append to last vehicle
  if (unassigned.size > 0 && vehicleTours.length > 0) {
    const last = vehicleTours[vehicleTours.length - 1];
    const remaining = Array.from(unassigned);
    // Insert before final return to depot
    last.tour.splice(last.tour.length - 1, 0, ...remaining);
    last.totalDistance = calculateTourDistance(last.tour, matrix);
    last.totalDemand += remaining.reduce((acc, id) => acc + (nodes[id].demand ?? 4), 0);
  }

  const totalFleetDistance = vehicleTours.reduce((acc, v) => acc + v.totalDistance, 0);

  return { vehicles: vehicleTours, totalFleetDistance };
}
