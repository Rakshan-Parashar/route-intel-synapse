import { CityNode } from './graph.ts';

export type IncidentType = 'traffic-jam' | 'rush-order' | 'storm-warning' | 'battery-warning';

export interface ChaosIncident {
  id: string;
  type: IncidentType;
  title: string;
  location?: { x: number; y: number };
  affectedNodeId?: number;
  durationMs: number;
  active: boolean;
  createdAt: number;
}

export interface DroneState {
  id: string;
  x: number;
  y: number;
  altitude: number;
  battery: number; // 0 to 100%
  status: 'docked' | 'flying' | 'delivering' | 'returning' | 'charging';
  assignedNodeId: number | null;
  targetPos: { x: number; y: number; altitude: number } | null;
}

export interface TruckState {
  x: number;
  y: number;
  angle: number;
  currentRouteIndex: number;
  isBlocked: boolean;
  payloadCapacity: number;
  currentPayload: number;
}

export interface IsometricBuilding {
  id: number;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number; // Z altitude
  color: string;
  hasHelipad: boolean;
  cityNode?: CityNode;
}
