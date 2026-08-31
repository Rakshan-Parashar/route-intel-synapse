import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CityNode } from '../../types/graph.ts';
import { AlgorithmMetadata, AlgorithmType, SolverYieldEvent } from '../../types/solver.ts';
import { ArenaCanvas } from './ArenaCanvas.tsx';
import { ConvergenceChart } from './ConvergenceChart.tsx';
import { SolverDispatcher } from '../../workers/solverDispatcher.ts';
import { Swords, Shuffle, Trophy, Circle, Move, Sparkles } from 'lucide-react';
import { generateRandomPoints, generateClusteredPoints, generateCirclePoints } from '../../core/matrix.ts';

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
  const [nodes, setNodes] = useState<CityNode[]>(() => generateRandomPoints(12, 700, 360));
  const [isBattling, setIsBattling] = useState<boolean>(false);
  const [predictedWinner, setPredictedWinner] = useState<AlgorithmType | null>(null);
  const [predictionOutcome, setPredictionOutcome] = useState<'pending' | 'won' | 'lost' | null>(null);

  // Dragging node on interactive master canvas
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const masterCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    setPredictionOutcome(predictedWinner ? 'pending' : null);

    const resetStates: Record<AlgorithmType, SolverState> = {
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
    };
    setSolverStates(resetStates);

    let completedCount = 0;

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
            const current = prev[solver.id] || { history: [] };
            const newHistory = [...current.history, { iteration: event.iteration, distance: event.bestDistance }];
            return {
              ...prev,
              [solver.id]: {
                route: event.bestTour,
                distance: event.bestDistance,
                timeMs: Math.round(event.executionTimeMs),
                iteration: event.iteration,
                done: Boolean(event.done),
                history: newHistory.length > 40 ? newHistory.slice(-40) : newHistory,
              },
            };
          });

          if (event.done) {
            completedCount++;
            if (completedCount >= ARENA_SOLVERS.length) {
              setIsBattling(false);
            }
          }
        }
      );
    });
  }, [nodes, predictedWinner]);

  // Master Graph Canvas Interactive Renderer
  useEffect(() => {
    const canvas = masterCanvasRef.current;
    if (!canvas) return;

    if (canvas.parentElement) {
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(30, 33, 48, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw nodes
    nodes.forEach((n, idx) => {
      const isDepot = idx === 0;
      const isDragging = draggingNodeId === n.id;

      // Glow halo
      const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, isDepot ? 18 : 12);
      halo.addColorStop(0, isDepot ? 'rgba(57, 255, 20, 0.4)' : 'rgba(0, 229, 255, 0.4)');
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isDepot ? 18 : 12, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(n.x, n.y, isDepot ? 8 : isDragging ? 7 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = isDepot ? '#39ff14' : '#00e5ff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = isDepot ? '#39ff14' : '#e8eaf0';
      ctx.font = 'bold 9px Space Mono';
      ctx.textAlign = 'center';
      ctx.fillText(isDepot ? 'DEPOT' : String(n.id), n.x, n.y - 10);
    });
  }, [nodes, draggingNodeId]);

  // Master Canvas Mouse Interaction (Click to add, drag to move)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = masterCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (Math.hypot(n.x - x, n.y - y) <= 16) {
        setDraggingNodeId(n.id);
        return;
      }
    }

    // Clicked empty space: add new node (up to 20)
    if (nodes.length < 20) {
      const newId = nodes.length;
      const newNode: CityNode = {
        id: newId,
        name: `Node ${newId}`,
        x,
        y,
        demand: (newId % 6) + 2,
      };
      setNodes((prev) => [...prev, newNode]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingNodeId === null) return;
    const canvas = masterCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(15, Math.min(canvas.width - 15, e.clientX - rect.left));
    const y = Math.max(15, Math.min(canvas.height - 15, e.clientY - rect.top));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x, y } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Determine Leader / Winner
  const activeSolvers = ARENA_SOLVERS.map((s) => ({
    ...s,
    state: solverStates[s.id],
  }));

  const completedSolvers = activeSolvers.filter((s) => s.state.distance > 0);
  const bestDistance = completedSolvers.length > 0 ? Math.min(...completedSolvers.map((s) => s.state.distance)) : 0;
  const winnerSolver = activeSolvers.find((s) => s.state.distance === bestDistance && s.state.distance > 0);

  // Check prediction when all finished
  useEffect(() => {
    if (!isBattling && completedSolvers.length === 4 && predictedWinner && winnerSolver) {
      if (winnerSolver.id === predictedWinner) {
        setPredictionOutcome('won');
      } else {
        setPredictionOutcome('lost');
      }
    }
  }, [isBattling, completedSolvers.length, predictedWinner, winnerSolver]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background p-4 overflow-y-auto select-none gap-4">
      {/* Top Controls Header */}
      <div className="bg-panel border border-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neon-pink/10 border border-neon-pink flex items-center justify-center shadow-neon-pink">
            <Swords size={22} className="text-neon-pink" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base text-slate-100 flex items-center gap-2">
              ALGORITHM BATTLE ARENA <span className="text-neon-pink font-bold">4-WAY ROYALE</span>
            </h1>
            <p className="text-[11px] text-muted">
              Click canvas to place dots · Drag to move · Bet on winner & race!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Quick Shape Presets */}
          <div className="flex bg-surface border border-border rounded p-0.5">
            <button
              onClick={() => setNodes(generateRandomPoints(nodes.length, 700, 360))}
              className="px-2.5 py-1 text-xs text-muted hover:text-slate-200 font-bold rounded flex items-center gap-1"
              title="Random Scatter"
            >
              <Shuffle size={12} />
              <span>Random</span>
            </button>
            <button
              onClick={() => setNodes(generateClusteredPoints(nodes.length, 3, 700, 360))}
              className="px-2.5 py-1 text-xs text-muted hover:text-slate-200 font-bold rounded flex items-center gap-1"
              title="Clustered"
            >
              <Circle size={12} />
              <span>Clusters</span>
            </button>
            <button
              onClick={() => setNodes(generateCirclePoints(nodes.length, 350, 180, 140))}
              className="px-2.5 py-1 text-xs text-muted hover:text-slate-200 font-bold rounded flex items-center gap-1"
              title="Circle Ring"
            >
              <Circle size={12} />
              <span>Circle</span>
            </button>
          </div>

          <button
            onClick={startBattle}
            disabled={isBattling}
            className={`flex items-center gap-2 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
              isBattling
                ? 'bg-muted text-black cursor-not-allowed opacity-50'
                : 'bg-neon-pink text-white hover:bg-neon-pink/90 shadow-neon-pink'
            }`}
          >
            <Swords size={14} />
            <span>{isBattling ? 'RACING...' : 'LAUNCH 4-WAY BATTLE'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Master Graph Editor Canvas & Prediction Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Master Click & Drag Canvas */}
        <div className="lg:col-span-2 bg-panel border border-border rounded-xl p-3 flex flex-col h-60 relative">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-border/50 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Move size={13} className="text-neon-cyan" />
              <span>Shared Graph Editor ({nodes.length} Dots)</span>
            </span>
            <span className="text-[10px] text-muted">Click empty space to add · Drag dots to reshape</span>
          </div>
          <div className="flex-1 relative w-full h-full bg-surface/50 rounded overflow-hidden cursor-crosshair">
            <canvas
              ref={masterCanvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* Winner Prediction Betting Card */}
        <div className="bg-panel border border-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 uppercase tracking-wider mb-2">
              <Trophy size={14} className="text-neon-amber" />
              <span>Predict The Winner 🥇</span>
            </div>
            <p className="text-[11px] text-muted mb-3">
              Pick the solver you think will finish with the shortest tour distance:
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {ARENA_SOLVERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPredictedWinner(s.id)}
                  className={`p-2 rounded text-xs font-bold border text-left transition-all ${
                    predictedWinner === s.id
                      ? 'border-neon-amber bg-neon-amber/10 text-neon-amber shadow-lg'
                      : 'border-border bg-surface text-muted hover:text-slate-200'
                  }`}
                >
                  <div className="truncate">{s.name.split(' ')[0]}</div>
                  <div className="text-[9px] font-normal opacity-70">{s.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prediction Outcome Banner */}
          {predictionOutcome === 'won' && (
            <div className="p-2.5 rounded bg-neon-green/10 border border-neon-green text-neon-green text-xs font-bold flex items-center gap-2 animate-bounce">
              <Sparkles size={16} />
              <span>🎉 Correct! Your predicted solver won the race!</span>
            </div>
          )}
          {predictionOutcome === 'lost' && (
            <div className="p-2 rounded bg-neon-pink/10 border border-neon-pink text-neon-pink text-xs font-bold">
              Runner up! The optimal solver took 1st place.
            </div>
          )}
        </div>
      </div>

      {/* 4-Way Arena Quad Canvases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {ARENA_SOLVERS.map((solver) => {
          const state = solverStates[solver.id];
          const isWinner = winnerSolver?.id === solver.id && state.distance > 0;

          return (
            <ArenaCanvas
              key={solver.id}
              nodes={nodes}
              route={state.route}
              distance={state.distance}
              timeMs={state.timeMs}
              iteration={state.iteration}
              metadata={solver}
              isRunning={isBattling}
              isWinner={isWinner}
            />
          );
        })}
      </div>

      {/* Live Convergence Chart */}
      <div className="bg-panel border border-border p-4 rounded-xl">
        <h3 className="font-bold text-xs uppercase text-muted tracking-wider mb-2">
          Real-Time Convergence Loss Graph (Distance vs Iteration)
        </h3>
        <ConvergenceChart
          curves={ARENA_SOLVERS.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            history: solverStates[s.id].history,
          }))}
        />
      </div>
    </div>
  );
};
