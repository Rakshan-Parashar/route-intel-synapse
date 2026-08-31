import React, { useRef, useEffect } from 'react';
import { CityNode } from '../../types/graph.ts';
import { AlgorithmMetadata } from '../../types/solver.ts';

interface ArenaCanvasProps {
  nodes: CityNode[];
  route: number[];
  distance: number;
  timeMs: number;
  iteration: number;
  metadata: AlgorithmMetadata;
  isRunning: boolean;
  isWinner?: boolean;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  nodes,
  route,
  distance,
  timeMs,
  metadata,
  isRunning,
  isWinner,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Compute scale and bounding box to center nodes
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });

    const pad = 24;
    const graphW = Math.max(1, maxX - minX);
    const graphH = Math.max(1, maxY - minY);
    const scaleX = (canvas.width - pad * 2) / graphW;
    const scaleY = (canvas.height - pad * 2) / graphH;
    const scale = Math.min(scaleX, scaleY);

    const transform = (p: { x: number; y: number }) => ({
      x: pad + (p.x - minX) * scale,
      y: pad + (p.y - minY) * scale,
    });

    // Draw route lines
    if (route.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < route.length - 1; i++) {
        const a = nodes[route[i]];
        const b = nodes[route[i + 1]];
        if (a && b) {
          const pa = transform(a);
          const pb = transform(b);
          if (i === 0) ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
        }
      }
      ctx.strokeStyle = metadata.color;
      ctx.lineWidth = isWinner ? 2.5 : 1.8;
      ctx.stroke();
    }

    // Draw nodes
    nodes.forEach((n, idx) => {
      const p = transform(n);
      const isDepot = idx === 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, isDepot ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isDepot ? '#39ff14' : metadata.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [nodes, route, metadata, isWinner]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`flex flex-col h-full bg-surface rounded-lg border overflow-hidden transition-all ${
      isWinner ? 'border-neon-green shadow-neon-green/40 ring-1 ring-neon-green/50' : 'border-border'
    }`}>
      {/* Mini Card Header */}
      <div className="px-3 py-2 border-b border-border bg-panel flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metadata.color }} />
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              {metadata.name}
              {isWinner && <span className="text-[9px] bg-neon-green/20 text-neon-green px-1 py-0.2 rounded font-bold">1ST PLACE</span>}
            </div>
            <div className="text-[9px] text-muted">{metadata.category} · {metadata.timeComplexity}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold font-display text-neon-cyan">
            {distance > 0 ? Math.round(distance) : '—'} <span className="text-[9px] text-muted">px</span>
          </div>
          <div className="text-[9px] text-neon-amber font-mono">
            {timeMs > 0 ? `${timeMs.toFixed(1)}ms` : (isRunning ? 'Solving...' : 'Ready')}
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 relative min-h-[140px] bg-background">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
