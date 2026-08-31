import React from 'react';

interface HistoryPoint {
  iteration: number;
  distance: number;
}

interface SolverCurve {
  id: string;
  name: string;
  color: string;
  history: HistoryPoint[];
}

interface ConvergenceChartProps {
  curves: SolverCurve[];
}

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({ curves }) => {
  // Collect min and max values to normalize chart coordinates
  let minD = Infinity, maxD = -Infinity, maxIter = 1;

  curves.forEach((c) => {
    c.history.forEach((p) => {
      if (p.distance < minD) minD = p.distance;
      if (p.distance > maxD) maxD = p.distance;
      if (p.iteration > maxIter) maxIter = p.iteration;
    });
  });

  if (minD === Infinity || maxD === -Infinity) {
    minD = 0;
    maxD = 1000;
  }

  const rangeD = Math.max(1, maxD - minD);
  const width = 480;
  const height = 110;
  const pad = 16;

  const toX = (iter: number) => pad + (iter / maxIter) * (width - pad * 2);
  const toY = (dist: number) => height - pad - ((dist - minD) / rangeD) * (height - pad * 2);

  return (
    <div className="bg-panel border border-border rounded-lg p-3 select-none">
      <div className="flex items-center justify-between text-[10px] text-muted uppercase font-bold mb-1.5">
        <span>Real-Time Convergence (Distance vs Iterations)</span>
        <span>Best: {minD !== Infinity ? Math.round(minD) : '—'} px</span>
      </div>

      <div className="relative w-full h-[110px] bg-surface rounded border border-border/60 overflow-hidden">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1={pad} y1={pad} x2={width - pad} y2={pad} stroke="#1e2130" strokeDasharray="3,3" />
          <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="#1e2130" strokeDasharray="3,3" />
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#1e2130" />

          {/* Curves */}
          {curves.map((curve) => {
            if (curve.history.length < 2) return null;
            const pointsStr = curve.history
              .map((p) => `${toX(p.iteration)},${toY(p.distance)}`)
              .join(' ');

            return (
              <polyline
                key={curve.id}
                points={pointsStr}
                fill="none"
                stroke={curve.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px]">
        {curves.map((c) => (
          <div key={c.id} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="text-slate-300">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
