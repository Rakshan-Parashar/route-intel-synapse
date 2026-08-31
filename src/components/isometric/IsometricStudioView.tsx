import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IsometricCityCanvas } from './IsometricCityCanvas.tsx';
import { ChaosEngineControls } from './ChaosEngineControls.tsx';
import { CityNode } from '../../types/graph.ts';
import { TruckState, DroneState, ChaosIncident, IsometricBuilding } from '../../types/vrp.ts';
import { generateRandomPoints } from '../../core/matrix.ts';
import { solveNearestNeighbor } from '../../algorithms/heuristics/nearestNeighbor.ts';
import { buildDistanceMatrix } from '../../core/matrix.ts';
import { Boxes, Play, Pause, RotateCcw } from 'lucide-react';

export const IsometricStudioView: React.FC = () => {
  const [nodes] = useState<CityNode[]>(() => generateRandomPoints(10, 800, 500));
  const [truckRoute, setTruckRoute] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'isometric' | 'drone-fpv' | 'truck-cam'>('isometric');

  const [truck, setTruck] = useState<TruckState>({
    x: 400,
    y: 250,
    angle: 0,
    currentRouteIndex: 0,
    isBlocked: false,
    payloadCapacity: 50,
    currentPayload: 30,
  });

  const [drone, setDrone] = useState<DroneState>({
    id: 'DRONE-01',
    x: 400,
    y: 250,
    altitude: 0,
    battery: 100,
    status: 'docked',
    assignedNodeId: null,
    targetPos: null,
  });

  const [incidents, setIncidents] = useState<ChaosIncident[]>([]);
  const [buildings, setBuildings] = useState<IsometricBuilding[]>([]);

  // Generate 3D procedural buildings matching city nodes
  const generateCityBuildings = useCallback((cityNodes: CityNode[]) => {
    const list: IsometricBuilding[] = [];
    cityNodes.forEach((n, idx) => {
      list.push({
        id: idx,
        x: n.x - 20,
        y: n.y - 20,
        width: 40,
        depth: 40,
        height: idx === 0 ? 25 : 35 + (idx * 14) % 90,
        color: idx === 0 ? '#39ff14' : '#00e5ff',
        hasHelipad: idx % 2 === 1,
        cityNode: n,
      });
    });
    setBuildings(list);
  }, []);

  // Compute Initial Truck Route
  const recomputeRoute = useCallback(() => {
    if (nodes.length < 2) return;
    const matrix = buildDistanceMatrix(nodes);
    const result = solveNearestNeighbor(matrix, 0);
    setTruckRoute(result.tour);
  }, [nodes]);

  useEffect(() => {
    generateCityBuildings(nodes);
    recomputeRoute();
    if (nodes.length > 0) {
      setTruck((prev) => ({ ...prev, x: nodes[0].x, y: nodes[0].y, currentRouteIndex: 0 }));
      setDrone((prev) => ({ ...prev, x: nodes[0].x, y: nodes[0].y, altitude: 0, status: 'docked' }));
    }
  }, [nodes, generateCityBuildings, recomputeRoute]);

  // Main 3D Simulation Loop
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isSimulating || truckRoute.length < 2) return;

    const tick = () => {
      // 1. Truck Update
      setTruck((prev) => {
        if (prev.currentRouteIndex >= truckRoute.length - 1) return prev;
        const targetId = truckRoute[prev.currentRouteIndex + 1];
        const target = nodes[targetId];
        if (!target) return prev;

        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const dist = Math.hypot(dx, dy);
        const speed = 1.6;

        if (dist <= speed) {
          return {
            ...prev,
            x: target.x,
            y: target.y,
            currentRouteIndex: prev.currentRouteIndex + 1,
          };
        } else {
          return {
            ...prev,
            x: prev.x + (speed * dx) / dist,
            y: prev.y + (speed * dy) / dist,
            angle: Math.atan2(dy, dx),
          };
        }
      });

      // 2. Autonomous Drone Tandem Update
      setDrone((prev) => {
        let next = { ...prev };

        // If docked, decide if it should launch to deliver to next helipad
        if (next.status === 'docked') {
          next.x = truck.x;
          next.y = truck.y;
          next.altitude = 0;
          // Slowly recharge battery when docked on truck roof
          next.battery = Math.min(100, next.battery + 0.1);

          // Launch if drone has > 40% battery and target is available
          if (next.battery > 40 && truck.currentRouteIndex < truckRoute.length - 2) {
            const nextStop = nodes[truckRoute[truck.currentRouteIndex + 2]];
            if (nextStop) {
              next.status = 'flying';
              next.targetPos = { x: nextStop.x, y: nextStop.y, altitude: 65 };
            }
          }
        } else if (next.status === 'flying' && next.targetPos) {
          // Fly towards rooftop helipad
          const dx = next.targetPos.x - next.x;
          const dy = next.targetPos.y - next.y;
          const dist = Math.hypot(dx, dy);
          const speed = 3.2; // Drone flies faster than ground truck

          next.altitude = Math.min(next.targetPos.altitude, next.altitude + 1.5);
          next.battery = Math.max(0, next.battery - 0.08); // battery drain

          if (dist <= speed) {
            next.status = 'returning';
            next.targetPos = null;
          } else {
            next.x += (speed * dx) / dist;
            next.y += (speed * dy) / dist;
          }
        } else if (next.status === 'returning') {
          // Rendezvous back with moving truck
          const dx = truck.x - next.x;
          const dy = truck.y - next.y;
          const dist = Math.hypot(dx, dy);
          const speed = 3.5;

          next.battery = Math.max(0, next.battery - 0.08);

          if (dist <= speed) {
            next.status = 'docked';
            next.x = truck.x;
            next.y = truck.y;
            next.altitude = 0;
          } else {
            next.x += (speed * dx) / dist;
            next.y += (speed * dy) / dist;
            next.altitude = Math.max(10, next.altitude - 0.5);
          }
        }

        return next;
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSimulating, truckRoute, nodes, truck.x, truck.y, truck.currentRouteIndex]);

  // Chaos Incidents Trigger Handler
  const handleTriggerIncident = (type: 'traffic-jam' | 'rush-order' | 'storm-warning' | 'battery-warning') => {
    const newInc: ChaosIncident = {
      id: String(Date.now()),
      type,
      title:
        type === 'traffic-jam'
          ? 'Roadblock Incident Detected'
          : type === 'rush-order'
          ? 'Emergency VIP Drone Dispatch'
          : type === 'storm-warning'
          ? 'Thunderstorm: Drones Grounded'
          : 'Low Battery Alert',
      location: { x: truck.x + (Math.random() - 0.5) * 100, y: truck.y + (Math.random() - 0.5) * 100 },
      durationMs: 8000,
      active: true,
      createdAt: Date.now(),
    };

    setIncidents((prev) => [...prev, newInc]);

    // Handle instant re-routing on incident
    if (type === 'rush-order') {
      // Dispatches drone immediately
      const randomStop = nodes[Math.floor(Math.random() * nodes.length)];
      setDrone((prev) => ({
        ...prev,
        status: 'flying',
        targetPos: { x: randomStop.x, y: randomStop.y, altitude: 75 },
      }));
    } else if (type === 'traffic-jam') {
      // Reroute truck around roadblock
      setTruck((prev) => ({ ...prev, isBlocked: true }));
      setTimeout(() => setTruck((prev) => ({ ...prev, isBlocked: false })), 4000);
    }
  };

  const handleReset = () => {
    if (nodes.length > 0) {
      setTruck({
        x: nodes[0].x,
        y: nodes[0].y,
        angle: 0,
        currentRouteIndex: 0,
        isBlocked: false,
        payloadCapacity: 50,
        currentPayload: 30,
      });
      setDrone({
        id: 'DRONE-01',
        x: nodes[0].x,
        y: nodes[0].y,
        altitude: 0,
        battery: 100,
        status: 'docked',
        assignedNodeId: null,
        targetPos: null,
      });
      setIncidents([]);
      setIsSimulating(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background select-none overflow-hidden">
      {/* Top Studio Header */}
      <div className="h-14 border-b border-border bg-panel px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-neon-cyan/10 border border-neon-cyan flex items-center justify-center shadow-neon-cyan">
            <Boxes size={16} className="text-neon-cyan" />
          </div>
          <div>
            <div className="font-display font-extrabold text-sm text-slate-100 flex items-center gap-2">
              3D CYBERPUNK METAVERSE <span className="text-neon-cyan font-bold">FSTSP STUDIO</span>
            </div>
            <div className="text-[10px] text-muted">Truck + Aerial Quadcopter Autonomous Flying Sidekick Simulation</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulating((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
              isSimulating ? 'bg-neon-amber text-black' : 'bg-neon-cyan text-black shadow-neon-cyan'
            }`}
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} />}
            <span>{isSimulating ? 'Pause 3D' : 'Resume 3D'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 bg-surface border border-border text-muted hover:text-slate-200 rounded"
            title="Reset Simulation"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <IsometricCityCanvas
          nodes={nodes}
          truckRoute={truckRoute}
          truck={truck}
          drone={drone}
          incidents={incidents}
          buildings={buildings}
          cameraMode={cameraMode}
        />
      </div>

      {/* Chaos Engine Bottom Bar */}
      <ChaosEngineControls
        incidents={incidents}
        onTriggerIncident={handleTriggerIncident}
        cameraMode={cameraMode}
        onCameraChange={setCameraMode}
        droneBattery={drone.battery}
      />
    </div>
  );
};
