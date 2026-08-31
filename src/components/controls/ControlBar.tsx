import React from 'react';
import { Play, Pause, RotateCcw, Shuffle, Cpu } from 'lucide-react';
import { AlgorithmType } from '../../types/solver.ts';

interface ControlBarProps {
  algorithm: AlgorithmType;
  onAlgorithmChange: (algo: AlgorithmType) => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onReset: () => void;
  onRegenerate: (type: 'random' | 'clustered' | 'circle') => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  cityCount: number;
  onCityCountChange: (count: number) => void;
  onSolve: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  algorithm,
  onAlgorithmChange,
  isSimulating,
  onToggleSimulate,
  onReset,
  onRegenerate,
  speed,
  onSpeedChange,
  cityCount,
  onCityCountChange,
  onSolve,
}) => {
  return (
    <div className="bg-panel border-t border-border px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Algorithm Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-muted text-xs uppercase font-bold">
          <Cpu size={14} className="text-neon-cyan" />
          <span>Solver</span>
        </div>
        <select
          value={algorithm}
          onChange={(e) => {
            onAlgorithmChange(e.target.value as AlgorithmType);
          }}
          className="bg-surface border border-border text-neon-cyan font-bold text-xs px-3 py-1.5 rounded outline-none focus:border-neon-cyan transition-colors"
        >
          <option value="nearest-neighbor">Nearest Neighbor — O(N²)</option>
          <option value="two-opt">2-Opt Local Search — Fast Heuristic</option>
          <option value="christofides">Christofides — 1.5x Metric Bound</option>
          <option value="held-karp">Held-Karp — Exact DP (Optimal)</option>
          <option value="simulated-annealing">Simulated Annealing — Physics Cooling</option>
          <option value="genetic-algorithm">Genetic Algorithm — Darwinian Evolution</option>
          <option value="ant-colony">Ant Colony (ACO) — Pheromone Swarm</option>
        </select>
        <button
          onClick={onSolve}
          className="px-3 py-1.5 bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan text-xs font-bold rounded hover:bg-neon-cyan/20 transition-all"
        >
          RECALCULATE
        </button>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSimulate}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            isSimulating
              ? 'bg-neon-amber text-black hover:bg-neon-amber/90 shadow-lg'
              : 'bg-neon-cyan text-black hover:bg-neon-cyan/90 shadow-neon-cyan'
          }`}
        >
          {isSimulating ? <Pause size={14} /> : <Play size={14} />}
          <span>{isSimulating ? 'PAUSE' : 'START SIMULATION'}</span>
        </button>

        <button
          onClick={onReset}
          className="p-2 bg-surface border border-border text-muted hover:text-slate-200 hover:border-slate-500 rounded transition-colors"
          title="Reset Vehicle to Depot"
        >
          <RotateCcw size={14} />
        </button>

        {/* Speed Multipliers */}
        <div className="flex items-center bg-surface border border-border rounded p-0.5 ml-2">
          {[0.5, 1, 2, 4, 8].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 text-[11px] font-bold rounded ${
                speed === s
                  ? 'bg-neon-cyan text-black'
                  : 'text-muted hover:text-slate-200'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Generator & Nodes Config */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted uppercase font-bold">Cities</span>
          <input
            type="number"
            min={3}
            max={50}
            value={cityCount}
            onChange={(e) => onCityCountChange(Math.max(3, Math.min(50, parseInt(e.target.value) || 3)))}
            className="w-14 bg-surface border border-border text-center text-xs py-1 rounded text-neon-cyan font-bold outline-none focus:border-neon-cyan"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onRegenerate('random')}
            className="px-2.5 py-1.5 bg-surface border border-border text-xs text-muted hover:text-slate-200 hover:border-slate-500 rounded flex items-center gap-1 transition-colors"
            title="Random Distribution"
          >
            <Shuffle size={12} />
            <span>Random</span>
          </button>
          <button
            onClick={() => onRegenerate('clustered')}
            className="px-2.5 py-1.5 bg-surface border border-border text-xs text-muted hover:text-slate-200 hover:border-slate-500 rounded transition-colors"
            title="Clustered Metro Distribution"
          >
            Clusters
          </button>
          <button
            onClick={() => onRegenerate('circle')}
            className="px-2.5 py-1.5 bg-surface border border-border text-xs text-muted hover:text-slate-200 hover:border-slate-500 rounded transition-colors"
            title="Circular Distribution"
          >
            Circle
          </button>
        </div>
      </div>
    </div>
  );
};
