import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CityNode } from '../../types/graph.ts';

interface SimulationCanvasProps {
  nodes: CityNode[];
  route: number[];
  routeIndex: number;
  vehiclePos: { x: number; y: number };
  vehicleAngle: number;
  trail: { x: number; y: number }[];
  onNodeMove?: (id: number, x: number, y: number) => void;
  onAddNode?: (x: number, y: number) => void;
  onSelectNode?: (id: number | null) => void;
  isSimulating: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  nodes,
  route,
  routeIndex,
  vehiclePos,
  vehicleAngle,
  trail,
  onNodeMove,
  onAddNode,
  onSelectNode,
  isSimulating,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<number | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  // SVGs for Truck and City Pins
  const truckImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const truckImg = new Image();
    const truckSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 36" fill="none"><rect x="2" y="6" width="38" height="22" rx="3" fill="#00e5ff" opacity="0.95"/><rect x="40" y="10" width="20" height="18" rx="3" fill="#00b0ff"/><rect x="46" y="13" width="10" height="9" rx="2" fill="#0a0c10" opacity="0.8"/><rect x="59" y="19" width="4" height="5" rx="1" fill="#ffffaa" opacity="0.95"/><circle cx="12" cy="30" r="5" fill="#1e2130" stroke="#00e5ff" stroke-width="1.5"/><circle cx="12" cy="30" r="2" fill="#00e5ff"/><circle cx="28" cy="30" r="5" fill="#1e2130" stroke="#00e5ff" stroke-width="1.5"/><circle cx="28" cy="30" r="2" fill="#00e5ff"/><circle cx="52" cy="30" r="5" fill="#1e2130" stroke="#00b0ff" stroke-width="1.5"/><circle cx="52" cy="30" r="2" fill="#00b0ff"/><rect x="4" y="14" width="34" height="3" rx="1" fill="#fff" opacity="0.2"/></svg>`;
    truckImg.src = 'data:image/svg+xml;base64,' + btoa(truckSVG);
    truckImgRef.current = truckImg;
  }, []);

  // Render loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Planned Route Lines (Dashed cyan)
    if (route.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < route.length - 1; i++) {
        const a = nodes[route[i]];
        const b = nodes[route[i + 1]];
        if (a && b) {
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Draw Visited Segments with Neon Glow
    if (routeIndex > 0 && route.length > 1) {
      for (let i = 0; i < routeIndex; i++) {
        const a = nodes[route[i]];
        const b = nodes[route[i + 1]];
        if (a && b) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          // Wide glow
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
          ctx.lineWidth = 8;
          ctx.stroke();
          // Crisp core
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      // Active vehicle segment connecting current city to vehicle
      if (routeIndex < route.length - 1) {
        const a = nodes[route[routeIndex]];
        if (a) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(vehiclePos.x, vehiclePos.y);
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.9)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
    }

    // 3. Draw Vehicle Particle Trail
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 4. Draw City Nodes
    nodes.forEach((node, idx) => {
      const isDepot = idx === 0;
      const isVisited = routeIndex > 0 && route.indexOf(node.id) < routeIndex;
      const isHovered = hoveredNodeId === node.id;
      const isDragged = draggedNodeId === node.id;

      // Glow halo
      const radius = isDepot ? 22 : 16;
      const halo = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius + (isHovered ? 8 : 4));
      if (isDepot) {
        halo.addColorStop(0, 'rgba(57, 255, 20, 0.35)');
        halo.addColorStop(1, 'rgba(57, 255, 20, 0)');
      } else {
        halo.addColorStop(0, isVisited ? 'rgba(255, 61, 113, 0.1)' : 'rgba(255, 61, 113, 0.35)');
        halo.addColorStop(1, 'rgba(255, 61, 113, 0)');
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (isHovered ? 8 : 4), 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // Pin Body Circle
      ctx.beginPath();
      const nodeRadius = isDepot ? 9 : (isHovered || isDragged ? 8 : 6.5);
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = isDepot ? '#39ff14' : isVisited ? 'rgba(255, 61, 113, 0.4)' : '#ff3d71';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      // Label Text
      ctx.font = isDepot ? 'bold 11px Space Mono' : '10px Space Mono';
      ctx.fillStyle = isVisited ? 'rgba(232, 234, 240, 0.4)' : '#e8eaf0';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y - nodeRadius - 4);
    });

    // 5. Draw Vehicle
    if (isSimulating || routeIndex > 0) {
      const vx = vehiclePos.x;
      const vy = vehiclePos.y;
      const tw = 44;
      const th = 24;

      // Glow halo
      const grad = ctx.createRadialGradient(vx, vy, 0, vx, vy, 24);
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
      grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.beginPath();
      ctx.arc(vx, vy, 24, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw rotated truck
      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(vehicleAngle);
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;

      if (truckImgRef.current && truckImgRef.current.complete) {
        ctx.drawImage(truckImgRef.current, -tw / 2, -th / 2, tw, th);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }, [nodes, route, routeIndex, vehiclePos, vehicleAngle, trail, hoveredNodeId, draggedNodeId, isSimulating]);

  // Canvas resize listener
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

  // Mouse Interaction handlers
  const getNodeAtPos = (x: number, y: number): number | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dist = Math.hypot(n.x - x, n.y - y);
      if (dist <= 18) return n.id;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hitId = getNodeAtPos(x, y);
    if (hitId !== null) {
      setDraggedNodeId(hitId);
      onSelectNode?.(hitId);
    } else {
      // Double click or normal click on empty space can add node
      if (e.detail === 2 && onAddNode) {
        onAddNode(x, y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNodeId !== null && onNodeMove) {
      onNodeMove(draggedNodeId, x, y);
    } else {
      const hitId = getNodeAtPos(x, y);
      setHoveredNodeId(hitId);
      canvas.style.cursor = hitId !== null ? 'grab' : 'crosshair';
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute top-4 left-4 pointer-events-none text-[11px] text-muted tracking-wider uppercase bg-surface/80 border border-border px-3 py-1.5 rounded backdrop-blur">
        Drag nodes to reposition · Double-click empty canvas to add city
      </div>
    </div>
  );
};
