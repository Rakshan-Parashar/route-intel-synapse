import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CityNode } from '../../types/graph.ts';

interface DailyDuelCanvasProps {
  nodes: CityNode[];
  userRoute: number[];
  aiRoute?: number[];
  showAiPath?: boolean;
  onAddNodeToRoute: (nodeId: number) => void;
  isComplete: boolean;
}

export const DailyDuelCanvas: React.FC<DailyDuelCanvasProps> = ({
  nodes,
  userRoute,
  aiRoute = [],
  showAiPath = false,
  onAddNodeToRoute,
  isComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

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

    // 1. Draw AI Opponent's Route (if revealed or active)
    if (showAiPath && aiRoute && aiRoute.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < aiRoute.length - 1; i++) {
        const a = nodes[aiRoute[i]];
        const b = nodes[aiRoute[i + 1]];
        if (a && b) {
          if (i === 0) ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
      ctx.strokeStyle = 'rgba(255, 61, 113, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Draw User's Active Route Segments
    if (userRoute.length > 1) {
      for (let i = 0; i < userRoute.length - 1; i++) {
        const a = nodes[userRoute[i]];
        const b = nodes[userRoute[i + 1]];
        if (a && b) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          // Outer Glow
          ctx.strokeStyle = isComplete ? 'rgba(57, 255, 20, 0.25)' : 'rgba(0, 229, 255, 0.25)';
          ctx.lineWidth = 8;
          ctx.stroke();
          // Crisp line
          ctx.strokeStyle = isComplete ? '#39ff14' : '#00e5ff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Step numbering along edge
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          ctx.fillStyle = '#0a0c10';
          ctx.beginPath();
          ctx.arc(midX, midY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1e2130';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#00e5ff';
          ctx.font = 'bold 9px Space Mono';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), midX, midY);
        }
      }
    }

    // 2. Draw Live Guide Line from last visited node to cursor
    if (!isComplete && userRoute.length > 0 && mousePos) {
      const lastNodeId = userRoute[userRoute.length - 1];
      const lastNode = nodes[lastNodeId];
      if (lastNode) {
        ctx.beginPath();
        ctx.moveTo(lastNode.x, lastNode.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 3. Draw City Nodes
    nodes.forEach((node) => {
      const isDepot = node.id === 0;
      const visitedIdx = userRoute.indexOf(node.id);
      const isVisited = visitedIdx !== -1 && !(isDepot && visitedIdx === 0 && userRoute.length > 1 && userRoute[userRoute.length - 1] !== 0);
      const isCurrentHead = userRoute.length > 0 && userRoute[userRoute.length - 1] === node.id;
      const isHovered = hoveredNodeId === node.id;

      // Glow halo
      const radius = isDepot ? 22 : 16;
      const halo = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius + (isHovered ? 6 : 2));
      if (isDepot) {
        halo.addColorStop(0, 'rgba(57, 255, 20, 0.35)');
        halo.addColorStop(1, 'rgba(57, 255, 20, 0)');
      } else {
        halo.addColorStop(0, isVisited ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 61, 113, 0.35)');
        halo.addColorStop(1, 'rgba(255, 61, 113, 0)');
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (isHovered ? 6 : 2), 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // Circle Body
      const nodeR = isDepot ? 10 : isCurrentHead || isHovered ? 9 : 7;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = isDepot ? '#39ff14' : isVisited ? '#00e5ff' : '#ff3d71';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isHovered || isCurrentHead ? 2 : 1;
      ctx.stroke();

      // Node Label
      ctx.font = isDepot ? 'bold 11px Space Mono' : '10px Space Mono';
      ctx.fillStyle = isVisited ? '#00e5ff' : '#e8eaf0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(node.name, node.x, node.y - nodeR - 4);
    });
  }, [nodes, userRoute, mousePos, hoveredNodeId, isComplete]);

  // Handle Resize
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

  const getNodeAtPos = (x: number, y: number): number | null => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dist = Math.hypot(n.x - x, n.y - y);
      if (dist <= 20) return n.id;
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
    const hitId = getNodeAtPos(x, y);
    setHoveredNodeId(hitId);
    canvas.style.cursor = hitId !== null ? 'pointer' : 'crosshair';
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isComplete) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hitId = getNodeAtPos(x, y);
    if (hitId !== null) {
      onAddNodeToRoute(hitId);
    }
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setMousePos(null)}
      />
    </div>
  );
};
