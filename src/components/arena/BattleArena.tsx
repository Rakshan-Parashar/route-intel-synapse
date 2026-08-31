import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CityNode } from '../../types/graph.ts';
import { AlgorithmMetadata, AlgorithmType, SolverYieldEvent } from '../../types/solver.ts';
import { ArenaCanvas } from './ArenaCanvas.tsx';
import { ConvergenceChart } from './ConvergenceChart.tsx';
import { SolverDispatcher } from '../../workers/solverDispatcher.ts';
import { Swords, Shuffle, Trophy } from 'lucide-react';
import { generateRandomPoints, generateClusteredPoints } from '../../core/matrix.ts';

const ARENA_SOLVERS: AlgorithmMetadata[] = [
  {
    id: 'held-karp',
    name: 'Held-Karp (Exact DP)',
    category: 'Exact',
    timeComplexity: 'O(N²·2ᴺ)',
    spaceComplexity: 'O(N·2ᴺ)',
    description: 'Guarantees mathematically optimal tour via bitmask dynamic programming.',
    color: '#39ff14',
    badge: 'OPTIMAL',
  },
  {
    id: 'christofides',
    name: 'Christofides (1.5x)',
    category: 'Heuristic',
    timeComplexity: 'O(N³)',
    spaceComplexity: 'O(N²)',
    description: 'MST + Minimum Weight Perfect Matching + Eulerian Shortcutting.',
    color: '#00e5ff',
    badge: 'APPROX',
  },
  {
    id: 'genetic-algorithm',
    name: 'Genetic Algorithm',
    category: 'Metaheuristic',
    timeComplexity: 'O(G·P·N)',
    spaceComplexity: 'O(P·N)',
    description: 'Simulates Darwinian natural selection with OX1 crossover and mutation.',
    color: '#ff3d71',
    badge: 'BIO',
  },
  {
    id: 'ant-colony',
    name: 'Ant Colony (ACO)',
    category: 'Metaheuristic',
    timeComplexity: 'O(I·A·N²)',
    spaceComplexity: 'O(N²)',
    description: 'Swarm intelligence with pheromone deposition and evaporation.',
    color: '#ffaa00',
    badge: 'SWARM',
  },
];

interface SolverState {
  route: number[];
  distance: number;
  timeMs: number;
  iteration: number;
  done: boolean;
  history: { iteration: number; distance: number }[];
}

export const BattleArena: React.FC = () => {
  const [nodeCount, setNodeCount] = useState<number>(14);
  const [nodes, setNodes] = useState<CityNode[]>(() => generateRandomPoints(14, 800, 500));
  const [isBattling, setIsBattling] = useState<boolean>(false);

  const [solverStates, setSolverStates] = useState<Record<AlgorithmType, SolverState>>({
    'held-karp': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'christofides': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'genetic-algorithm': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'ant-colony': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'nearest-neighbor': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'two-opt': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'three-opt': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'simulated-annealing': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'branch-and-bound': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
    'slime-mold': { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] },
  });

  const dispatchersRef = useRef<SolverDispatcher[]>([
    new SolverDispatcher(),
    new SolverDispatcher(),
    new SolverDispatcher(),
    new SolverDispatcher(),
  ]);

  const startBattle = useCallback(() => {
    setIsBattling(true);

    // Reset states
    const initialStates = { ...solverStates };
    ARENA_SOLVERS.forEach((s) => {
      initialStates[s.id] = { route: [], distance: 0, timeMs: 0, iteration: 0, done: false, history: [] };
    });
    setSolverStates(initialStates);

    ARENA_SOLVERS.forEach((solver, index) => {
      const dispatcher = dispatchersRef.current[index];
      dispatcher.start(
        {
          algorithm: solver.id,
          nodes,
          depotIndex: 0,
          maxIterations: solver.id === 'genetic-algorithm' ? 120 : solver.id === 'ant-colony' ? 60 : 3000,
        },
        (event: SolverYieldEvent) => {
          setSolverStates((prev) => {
            const current = prev[solver.id];
            const newHistory = [...current.history, { iteration: event.iteration, distance: event.bestDistance }];
            return {
              ...prev,
              [solver.id]: {
                route: event.bestTour,
                distance: event.bestDistance,
                timeMs: event.executionTimeMs,
                iteration: event.iteration,
                done: event.done,
                history: newHistory.length > 50 ? newHistory.slice(-50) : newHistory,
              },
            };
          });
        }
      );
    });
  }, [nodes, solverStates]);

  const handleRegenerate = (type: 'random' | 'clustered') => {
    dispatchersRef.current.forEach((d) => d.terminate());
    setIsBattling(false);
    const newNodes = type === 'clustered' ? generateClusteredPoints(nodeCount, 3, 800, 500) : generateRandomPoints(nodeCount, 800, 500);
    setNodes(newNodes);
  };

  // Determine winner
  const activeSolvers = ARENA_SOLVERS.map((s) => ({
    ...s,
    state: solverStates[s.id],
  }));

  const completedSolvers = activeSolvers.filter((s) => s.state.distance > 0);
  const bestDistance = completedSolvers.length > 0 ? Math.min(...completedSolvers.map((s) => s.state.distance)) : 0;

  // Cleanup workers on unmount
  useEffect(() => {
    return () => {
      dispatchersRef.current.forEach((d) => d.terminate());
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background p-5 overflow-y-auto select-none">
      {/* Arena Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-panel border border-border p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neon-pink/10 border border-neon-pink flex items-center justify-center shadow-neon-pink">
            <Swords size={22} className="text-neon-pink" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg text-slate-100 flex items-center gap-2">
              ALGORITHM ARENA <span className="text-neon-pink font-bold">BATTLE ROYALE</span>
            </h1>
            <p className="text-xs text-muted">
              Simultaneous 4-way multi-threaded race on identical city graph
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted uppercase font-bold">Cities</span>
            <input
              type="number"
              min={4}
              max={20}
              value={nodeCount}
              onChange={(e) => {
                const count = Math.max(4, Math.min(20, parseInt(e.target.value) || 4));
                setNodeCount(count);
                setNodes(generateRandomPoints(count, 800, 500));
              }}
              className="w-14 bg-surface border border-border text-center text-xs py-1 rounded text-neon-pink font-bold outline-none"
            />
          </div>

          <button
            onClick={() => handleRegenerate('random')}
            className="px-3 py-1.5 bg-surface border border-border text-xs text-muted hover:text-slate-200 rounded flex items-center gap-1.5"
          >
            <Shuffle size={13} />
            <span>New Graph</span>
          </button>

          <button
            onClick={startBattle}
            className="flex items-center gap-2 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider bg-neon-pink text-white hover:bg-neon-pink/90 shadow-neon-pink transition-all"
          >
            <Swords size={14} />
            <span>LAUNCH 4-WAY BATTLE</span>
          </button>
        </div>
      </div>

      {/* 4-Way Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4 min-h-[260px]">
        {ARENA_SOLVERS.map((solver) => {
          const state = solverStates[solver.id];
          const isWinner = bestDistance > 0 && state.distance === bestDistance;

          return (
            <ArenaCanvas
              key={solver.id}
              nodes={nodes}
              route={state.route}
              distance={state.distance}
              timeMs={state.timeMs}
              iteration={state.iteration}
              metadata={solver}
              isRunning={isBattling && !state.done}
              isWinner={isWinner}
            />
          );
        })}
      </div>

      {/* Bottom Telemetry: Convergence Chart & Live Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Convergence Multi-Line Graph */}
        <div className="lg:col-span-2">
          <ConvergenceChart
            curves={ARENA_SOLVERS.map((s) => ({
              id: s.id,
              name: s.name,
              color: s.color,
              history: solverStates[s.id].history,
            }))}
          />
        </div>

        {/* Live Leaderboard Table */}
        <div className="bg-panel border border-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-3">
              <Trophy size={14} className="text-neon-amber" />
              <span>Live Leaderboard</span>
            </div>

            <div className="space-y-2">
              {[...activeSolvers]
                .sort((a, b) => (a.state.distance || 99999) - (b.state.distance || 99999))
                .map((solver, rank) => {
                  const dist = solver.state.distance;
                  const gap = bestDistance > 0 && dist > 0 ? (((dist - bestDistance) / bestDistance) * 100).toFixed(1) : '0.0';

                  return (
                    <div
                      key={solver.id}
                      className="flex items-center justify-between p-2 rounded bg-surface border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-muted w-4">#{rank + 1}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: solver.color }} />
                        <span className="font-bold text-slate-200">{solver.name}</span>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-neon-cyan">{dist > 0 ? Math.round(dist) : '—'} px</div>
                        <div className="text-[10px] text-muted">
                          {rank === 0 ? '🏆 Best' : `+${gap}% gap`}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
