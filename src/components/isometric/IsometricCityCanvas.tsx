import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  onAddBuilding?: (worldX: number, worldY: number) => void;
}

export const IsometricCityCanvas: React.FC<IsometricCityCanvasProps> = ({
  nodes,
  truckRoute,
  truck,
  drone,
  incidents,
  buildings,
  cameraMode,
  onAddBuilding,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Orbit Camera State (Mouse Drag & Zoom)
  const [yaw, setYaw] = useState<number>(30); // Horizontal angle in degrees
  const [pitch, setPitch] = useState<number>(30); // Vertical angle in degrees
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Projection with Custom Orbit Yaw, Pitch, and Zoom
  const toIso = useCallback(
    (x: number, y: number, z = 0, centerX: number, centerY: number) => {
      const radYaw = (yaw * Math.PI) / 180;
      const radPitch = (pitch * Math.PI) / 180;

      // Rotate around Z axis (Yaw)
      const rotX = x * Math.cos(radYaw) - y * Math.sin(radYaw);
      const rotY = x * Math.sin(radYaw) + y * Math.cos(radYaw);

      // Project onto 2D screen with Pitch
      let offsetX = 0;
      let offsetY = 0;

      if (cameraMode === 'drone-fpv') {
        offsetX = -(drone.x - 400) * 0.7 * zoom;
        offsetY = -(drone.y - 250) * 0.7 * zoom;
      } else if (cameraMode === 'truck-cam') {
        offsetX = -(truck.x - 400) * 0.7 * zoom;
        offsetY = -(truck.y - 250) * 0.7 * zoom;
      }

      const isoX = (rotX - rotY) * Math.cos(radPitch) * zoom + centerX + offsetX;
      const isoY = (rotX + rotY) * Math.sin(radPitch) * zoom - z * zoom + centerY + offsetY;

      return { x: isoX, y: isoY };
    },
    [yaw, pitch, zoom, cameraMode, drone.x, drone.y, truck.x, truck.y]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    const cy = canvas.height * 0.45;

    // 1. Draw 3D Ground Grid
    const gridSize = 9;
    const cellSize = 65;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
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

    // 2. Draw Truck Ground Planned Route (Cyan dashed line)
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
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 2.5 * zoom;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw 3D Buildings (Depth sorted)
    const sortedBuildings = [...buildings].sort((a, b) => a.x + a.y - (b.x + b.y));

    sortedBuildings.forEach((b) => {
      const w = b.width;
      const d = b.depth;
      const h = b.height;
      const bx = b.x - 400;
      const by = b.y - 250;

      const p1 = toIso(bx + w, by, 0, cx, cy);
      const p2 = toIso(bx + w, by + d, 0, cx, cy);
      const p3 = toIso(bx, by + d, 0, cx, cy);

      const t0 = toIso(bx, by, h, cx, cy);
      const t1 = toIso(bx + w, by, h, cx, cy);
      const t2 = toIso(bx + w, by + d, h, cx, cy);
      const t3 = toIso(bx, by + d, h, cx, cy);

      // Left Face
      ctx.fillStyle = '#0b0f19';
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.stroke();

      // Right Face
      ctx.fillStyle = '#131929';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.stroke();

      // Top Roof Face
      ctx.fillStyle = b.hasHelipad ? '#1e293b' : '#151d2f';
      ctx.beginPath();
      ctx.moveTo(t0.x, t0.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = b.hasHelipad ? '#00e5ff' : 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = b.hasHelipad ? 2 : 1;
      ctx.stroke();

      // Draw Helipad 'H'
      if (b.hasHelipad) {
        const roofCenter = toIso(bx + w / 2, by + d / 2, h, cx, cy);
        ctx.fillStyle = '#00e5ff';
        ctx.font = `bold ${Math.round(10 * zoom)}px Space Mono`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', roofCenter.x, roofCenter.y);
      }
    });

    // 4. Draw Incidents (Traffic Jam / Roadblocks)
    incidents.forEach((inc) => {
      if (!inc.active || !inc.location) return;
      const pos = toIso(inc.location.x - 400, inc.location.y - 250, 0, cx, cy);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 16 * zoom, 0, Math.PI * 2);
      ctx.strokeStyle = inc.type === 'traffic-jam' ? '#ffaa00' : '#ff3d71';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = inc.type === 'traffic-jam' ? '#ffaa00' : '#ff3d71';
      ctx.font = `bold ${Math.round(12 * zoom)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(inc.type === 'traffic-jam' ? '🚧' : '🚨', pos.x, pos.y);
    });

    // 5. Draw Ground Truck
    const tPos = toIso(truck.x - 400, truck.y - 250, 0, cx, cy);
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(tPos.x, tPos.y, 9 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#00e5ff';
    ctx.font = `bold ${Math.round(10 * zoom)}px Space Mono`;
    ctx.textAlign = 'center';
    ctx.fillText('TRUCK (MOTHER DOCK)', tPos.x, tPos.y + 18 * zoom);

    // 6. Draw Aerial Quadcopter Drone
    const dShadow = toIso(drone.x - 400, drone.y - 250, 0, cx, cy);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(dShadow.x, dShadow.y, 12 * zoom, 6 * zoom, 0, 0, Math.PI * 2);
    ctx.fill();

    const dPos = toIso(drone.x - 400, drone.y - 250, drone.altitude, cx, cy);

    // Altitude laser line
    ctx.strokeStyle = 'rgba(255, 61, 113, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(dShadow.x, dShadow.y);
    ctx.lineTo(dPos.x, dPos.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Drone Body
    ctx.fillStyle = '#ff3d71';
    ctx.beginPath();
    ctx.arc(dPos.x, dPos.y, 7 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4 Rotors
    const rOffset = 10 * zoom;
    [
      { x: -rOffset, y: -rOffset },
      { x: rOffset, y: -rOffset },
      { x: -rOffset, y: rOffset },
      { x: rOffset, y: rOffset },
    ].forEach((r) => {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(dPos.x + r.x, dPos.y + r.y, 3.5 * zoom, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Drone HUD
    ctx.fillStyle = '#ff3d71';
    ctx.font = `bold ${Math.round(9 * zoom)}px Space Mono`;
    ctx.textAlign = 'center';
    ctx.fillText(`DRONE (${Math.round(drone.battery)}% 🔋)`, dPos.x, dPos.y - 14 * zoom);
  }, [nodes, truckRoute, truck, drone, incidents, buildings, zoom, toIso]);

  // Mouse Drag Orbit Event Listeners
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setYaw((prev) => (prev + dx * 0.5) % 360);
    setPitch((prev) => Math.max(15, Math.min(75, prev + dy * 0.3)));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.6, Math.min(2.2, prev - e.deltaY * 0.001)));
  };

  // Click on Ground to Build Skyscraper
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.shiftKey && onAddBuilding) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      onAddBuilding(clickX, clickY);
    }
  };

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative w-full h-full bg-background overflow-hidden select-none cursor-grab active:cursor-grabbing">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="w-full h-full block"
      />
      <div className="absolute top-4 left-4 pointer-events-none text-[11px] text-muted tracking-wider uppercase bg-surface/80 border border-border px-3 py-1.5 rounded backdrop-blur flex items-center gap-2">
        <span>🖱️ Drag Mouse to 360° Orbit · Scroll Wheel to Zoom · Shift+Click to Build</span>
      </div>

      {/* Orbit Reset Button */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => {
            setYaw(30);
            setPitch(30);
            setZoom(1.0);
          }}
          className="px-2.5 py-1 bg-surface border border-border text-xs text-muted hover:text-slate-200 rounded font-bold"
        >
          Reset Camera
        </button>
      </div>
    </div>
  );
};
