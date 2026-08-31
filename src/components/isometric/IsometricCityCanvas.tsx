import React, { useRef, useEffect, useCallback } from 'react';
import { CityNode } from '../../types/graph.ts';
import { DroneState, TruckState, ChaosIncident, IsometricBuilding } from '../../types/vrp.ts';

interface IsometricCityCanvasProps {
  nodes: CityNode[];
  truckRoute: number[];
  truck: TruckState;
  drone: DroneState;
  incidents: ChaosIncident[];
  buildings: IsometricBuilding[];
  cameraMode: 'isometric' | 'drone-fpv' | 'truck-cam';
}

export const IsometricCityCanvas: React.FC<IsometricCityCanvasProps> = ({
  nodes,
  truckRoute,
  truck,
  drone,
  incidents,
  buildings,
  cameraMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Isometric 3D Projection Math
  const toIso = useCallback(
    (x: number, y: number, z = 0, centerX: number, centerY: number) => {
      // 30 degree isometric angle
      const cos30 = 0.866;
      const sin30 = 0.5;

      let offsetX = 0;
      let offsetY = 0;

      // Adjust camera focus if in Drone FPV or Truck Cam mode
      if (cameraMode === 'drone-fpv') {
        offsetX = -(drone.x - 400) * 0.7;
        offsetY = -(drone.y - 250) * 0.7;
      } else if (cameraMode === 'truck-cam') {
        offsetX = -(truck.x - 400) * 0.7;
        offsetY = -(truck.y - 250) * 0.7;
      }

      const isoX = (x - y) * cos30 + centerX + offsetX;
      const isoY = (x + y) * sin30 - z + centerY + offsetY;

      return { x: isoX, y: isoY };
    },
    [cameraMode, drone.x, drone.y, truck.x, truck.y]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Auto-sync canvas internal pixel dimensions with its container
    if (canvas.parentElement) {
      const parentW = canvas.parentElement.clientWidth;
      const parentH = canvas.parentElement.clientHeight;
      if (parentW > 0 && parentH > 0 && (canvas.width !== parentW || canvas.height !== parentH)) {
        canvas.width = parentW;
        canvas.height = parentH;
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height * 0.28;

    // 1. Draw 3D Isometric Ground Grid
    const gridSize = 8;
    const cellSize = 70;
    ctx.strokeStyle = 'rgba(30, 33, 48, 0.7)';
    ctx.lineWidth = 1;

    for (let i = -gridSize; i <= gridSize; i++) {
      const p1 = toIso(i * cellSize, -gridSize * cellSize, 0, cx, cy);
      const p2 = toIso(i * cellSize, gridSize * cellSize, 0, cx, cy);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const q1 = toIso(-gridSize * cellSize, i * cellSize, 0, cx, cy);
      const q2 = toIso(gridSize * cellSize, i * cellSize, 0, cx, cy);
      ctx.beginPath();
      ctx.moveTo(q1.x, q1.y);
      ctx.lineTo(q2.x, q2.y);
      ctx.stroke();
    }

    // 2. Draw Truck Ground Planned Route (Cyan dashed line on ground)
    if (truckRoute.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < truckRoute.length - 1; i++) {
        const a = nodes[truckRoute[i]];
        const b = nodes[truckRoute[i + 1]];
        if (a && b) {
          const pa = toIso(a.x - 400, a.y - 250, 0, cx, cy);
          const pb = toIso(b.x - 400, b.y - 250, 0, cx, cy);
          if (i === 0) ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
        }
      }
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw 3D Isometric Buildings (Depth-sorted)
    const sortedBuildings = [...buildings].sort((a, b) => a.x + a.y - (b.x + b.y));

    sortedBuildings.forEach((b) => {
      const w = b.width;
      const d = b.depth;
      const h = b.height;
      const bx = b.x - 400;
      const by = b.y - 250;

      // Building corners in isometric space
      const p1 = toIso(bx + w, by, 0, cx, cy);
      const p2 = toIso(bx + w, by + d, 0, cx, cy);
      const p3 = toIso(bx, by + d, 0, cx, cy);

      const t0 = toIso(bx, by, h, cx, cy);
      const t1 = toIso(bx + w, by, h, cx, cy);
      const t2 = toIso(bx + w, by + d, h, cx, cy);
      const t3 = toIso(bx, by + d, h, cx, cy);

      // Left Face
      ctx.fillStyle = '#0e111a';
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
      ctx.stroke();

      // Right Face
      ctx.fillStyle = '#141824';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.stroke();

      // Top Roof Face
      ctx.fillStyle = b.hasHelipad ? '#1b2234' : '#181e2e';
      ctx.beginPath();
      ctx.moveTo(t0.x, t0.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = b.hasHelipad ? '#00e5ff' : 'rgba(0, 229, 255, 0.3)';
      ctx.lineWidth = b.hasHelipad ? 1.5 : 1;
      ctx.stroke();

      // Draw Helipad 'H' on delivery rooftop
      if (b.hasHelipad) {
        const roofCenter = toIso(bx + w / 2, by + d / 2, h, cx, cy);
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 9px Space Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', roofCenter.x, roofCenter.y);
      }
    });

    // 4. Draw Incidents (Traffic Jams 🚧, Storms ⚡)
    incidents.forEach((inc) => {
      if (!inc.active || !inc.location) return;
      const pos = toIso(inc.location.x - 400, inc.location.y - 250, 0, cx, cy);

      // Pulsing Incident Ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = inc.type === 'traffic-jam' ? '#ffaa00' : '#ff3d71';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = inc.type === 'traffic-jam' ? '#ffaa00' : '#ff3d71';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(inc.type === 'traffic-jam' ? '🚧' : '🚨', pos.x, pos.y);
    });

    // 5. Draw Ground Delivery Truck
    const tPos = toIso(truck.x - 400, truck.y - 250, 0, cx, cy);
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(tPos.x, tPos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Truck Label
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 9px Space Mono';
    ctx.textAlign = 'center';
    ctx.fillText('TRUCK (DOCK)', tPos.x, tPos.y + 16);

    // 6. Draw Autonomous Aerial Drone
    // Drone Shadow on ground
    const dShadow = toIso(drone.x - 400, drone.y - 250, 0, cx, cy);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(dShadow.x, dShadow.y, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drone Altitude Tether Line
    const dPos = toIso(drone.x - 400, drone.y - 250, drone.altitude, cx, cy);
    ctx.strokeStyle = 'rgba(255, 61, 113, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(dShadow.x, dShadow.y);
    ctx.lineTo(dPos.x, dPos.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Drone Body (Quadcopter 4 Rotors)
    ctx.fillStyle = '#ff3d71';
    ctx.beginPath();
    ctx.arc(dPos.x, dPos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4 Rotors
    const rOffset = 8;
    [
      { x: -rOffset, y: -rOffset },
      { x: rOffset, y: -rOffset },
      { x: -rOffset, y: rOffset },
      { x: rOffset, y: rOffset },
    ].forEach((r) => {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(dPos.x + r.x, dPos.y + r.y, 3, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Drone Status HUD
    ctx.fillStyle = '#ff3d71';
    ctx.font = 'bold 9px Space Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`DRONE (${Math.round(drone.battery)}% 🔋)`, dPos.x, dPos.y - 12);
  }, [nodes, truckRoute, truck, drone, incidents, buildings, toIso]);

  // Canvas Resize Listener
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      draw();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-4 left-4 pointer-events-none text-[11px] text-muted tracking-wider uppercase bg-surface/80 border border-border px-3 py-1.5 rounded backdrop-blur">
        3D Isometric View · Truck + Drone Autonomous Tandem (FSTSP)
      </div>
    </div>
  );
};
