import React from 'react';
import { Route, Navigation, Zap, Clock, ShieldCheck, Flame } from 'lucide-react';
import { CityNode } from '../../types/graph.ts';
import { AlgorithmType } from '../../types/solver.ts';

interface MetricsPanelProps {
  totalDistance: number;
  coveredDistance: number;
  nodes: CityNode[];
  route: number[];
  routeIndex: number;
  executionTimeMs: number;
  selectedAlgorithm: AlgorithmType;
  status: 'idle' | 'running' | 'completed' | 'paused';
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  totalDistance,
  coveredDistance,
  nodes,
  route,
  routeIndex,
  executionTimeMs,
  selectedAlgorithm,
  status,
}) => {
  const pct = totalDistance > 0 ? Math.min(100, (coveredDistance / totalDistance) * 100) : 0;

  // Real-world logistics telemetry calculations
  const estimatedFuelLiters = (totalDistance * 0.08).toFixed(1);
  const estimatedCO2Kg = (totalDistance * 0.21).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-panel border-l border-border select-none overflow-y-auto">
      {/* Header Status */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-muted font-bold block">Telemetry</span>
          <span className="text-[10px] text-neon-cyan uppercase font-mono">{selectedAlgorithm}</span>
        </div>
        <div className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
          status === 'running' ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 animate-pulse' :
          status === 'completed' ? 'bg-neon-green/10 text-neon-green border-neon-green/30' :
          status === 'paused' ? 'bg-neon-amber/10 text-neon-amber border-neon-amber/30' :
          'bg-surface text-muted border-border'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            status === 'running' ? 'bg-neon-cyan shadow-neon-cyan' :
            status === 'completed' ? 'bg-neon-green shadow-neon-green' :
            'bg-muted'
          }`} />
          {status}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="p-4 border-b border-border grid grid-cols-2 gap-3">
        <div className="bg-surface p-3 rounded border border-border">
          <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-bold mb-1">
            <Route size={12} className="text-neon-cyan" />
            <span>Total Distance</span>
          </div>
          <div className="text-xl font-bold font-display text-neon-cyan leading-none">
            {totalDistance > 0 ? Math.round(totalDistance) : '—'}
            <span className="text-xs text-muted font-normal ml-1">px</span>
          </div>
        </div>

        <div className="bg-surface p-3 rounded border border-border">
          <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-bold mb-1">
            <Navigation size={12} className="text-neon-green" />
            <span>Covered</span>
          </div>
          <div className="text-xl font-bold font-display text-neon-green leading-none">
            {Math.round(coveredDistance)}
            <span className="text-xs text-muted font-normal ml-1">px</span>
          </div>
        </div>

        <div className="bg-surface p-3 rounded border border-border">
          <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-bold mb-1">
            <Zap size={12} className="text-neon-pink" />
            <span>Cities</span>
          </div>
          <div className="text-xl font-bold font-display text-neon-pink leading-none">
            {nodes.length}
          </div>
        </div>

        <div className="bg-surface p-3 rounded border border-border">
          <div className="flex items-center gap-1.5 text-muted text-[10px] uppercase font-bold mb-1">
            <Clock size={12} className="text-neon-amber" />
            <span>Solve Time</span>
          </div>
          <div className="text-xl font-bold font-display text-neon-amber leading-none">
            {executionTimeMs > 0 ? `${executionTimeMs.toFixed(1)}ms` : '—'}
          </div>
        </div>
      </div>

      {/* Simulation Progress Bar */}
      <div className="px-4 py-3 border-b border-border bg-surface/40">
        <div className="flex justify-between text-[10px] text-muted uppercase font-bold mb-1.5">
          <span>Route Completion</span>
          <span className="text-neon-cyan">{Math.round(pct)}%</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-green rounded-full transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Fleet & Carbon Telemetry */}
      <div className="p-4 border-b border-border">
        <span className="text-[10px] uppercase tracking-widest text-muted font-bold block mb-2.5">
          Logistics Impact
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-surface p-2.5 rounded border border-border flex items-center gap-2">
            <Flame size={14} className="text-neon-amber" />
            <div>
              <div className="text-slate-200 font-bold">{estimatedFuelLiters} L</div>
              <div className="text-[9px] text-muted uppercase">Fuel Used</div>
            </div>
          </div>
          <div className="bg-surface p-2.5 rounded border border-border flex items-center gap-2">
            <ShieldCheck size={14} className="text-neon-green" />
            <div>
              <div className="text-slate-200 font-bold">{estimatedCO2Kg} kg</div>
              <div className="text-[9px] text-muted uppercase">CO₂ Footprint</div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Order List */}
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <span className="text-[10px] uppercase tracking-widest text-muted font-bold block mb-2">
          Route Itinerary ({route.length} stops)
        </span>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-52">
          {route.map((cityId, index) => {
            const isCurrent = index === routeIndex;
            const isDone = index < routeIndex;
            const node = nodes[cityId];
            const name = node ? (node.id === 0 ? 'DEPOT' : node.name) : `Node ${cityId}`;

            return (
              <div
                key={`${cityId}-${index}`}
                className={`px-3 py-1.5 rounded border text-xs flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan font-bold shadow-neon-cyan'
                    : isDone
                    ? 'border-border/40 bg-surface/30 text-muted opacity-60'
                    : 'border-border bg-surface text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCurrent
                        ? 'bg-neon-cyan shadow-neon-cyan'
                        : isDone
                        ? 'bg-neon-green'
                        : 'bg-muted'
                    }`}
                  />
                  <span>
                    {index + 1}. {name}
                  </span>
                </div>
                {node?.demand && (
                  <span className="text-[10px] text-muted font-mono">{node.demand} pkgs</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
