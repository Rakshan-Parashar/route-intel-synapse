import React, { useState, useEffect, useCallback } from 'react';
import { DailyDuelCanvas } from './DailyDuelCanvas.tsx';
import { DuelScoreModal } from './DuelScoreModal.tsx';
import { CityNode } from '../../types/graph.ts';
import { getDailySeed, generateDailyPuzzleNodes } from '../../utils/seededRandom.ts';
import { buildDistanceMatrix } from '../../core/matrix.ts';
import { calculateTourDistance } from '../../core/distance.ts';
import { solveHeldKarp } from '../../algorithms/exact/heldKarp.ts';
import { solveGeneticAlgorithm } from '../../algorithms/metaheuristics/geneticAlgorithm.ts';
import { soundEffects } from '../../audio/soundEffects.ts';
import { Sparkles, Undo2, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight, Brain } from 'lucide-react';

export const DailyDuelView: React.FC = () => {
  const [dayOffset, setDayOffset] = useState<number>(0);
  const { seed, dateString, puzzleNumber } = getDailySeed(dayOffset);

  const [nodes, setNodes] = useState<CityNode[]>(() => generateDailyPuzzleNodes(seed, 10));
  const [userRoute, setUserRoute] = useState<number[]>([0]); // starts at depot
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);

  // Background AI & Optimal calculations
  const [optimalDist, setOptimalDist] = useState<number>(0);
  const [aiDist, setAiDist] = useState<number>(0);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Compute Optimal & AI benchmarks on node set load
  const computeBenchmarks = useCallback((puzzleNodes: CityNode[]) => {
    const matrix = buildDistanceMatrix(puzzleNodes);
    try {
      // Held-Karp exact for <= 15 nodes
      const optimal = solveHeldKarp(matrix, 0);
      setOptimalDist(optimal.distance);

      // AI Challenger (Genetic Algorithm)
      const aiResult = solveGeneticAlgorithm(matrix, 0, { generations: 100, populationSize: 40 });
      setAiDist(aiResult.distance);
    } catch {
      // Fallback
      setOptimalDist(1000);
      setAiDist(1050);
    }
  }, []);

  // Reset when seed changes
  useEffect(() => {
    const newNodes = generateDailyPuzzleNodes(seed, 10);
    setNodes(newNodes);
    setUserRoute([0]);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setShowScoreModal(false);
    computeBenchmarks(newNodes);
  }, [seed, computeBenchmarks]);

  // Add node to route
  const handleAddNode = (nodeId: number) => {
    if (userRoute.length === 0) {
      setUserRoute([nodeId]);
      if (nodes[nodeId]) soundEffects.onCityVisit(nodes[nodeId]);
      return;
    }

    const last = userRoute[userRoute.length - 1];
    if (last === nodeId) return;

    // Check if adding depot at the end to finish
    if (nodeId === 0 && userRoute.length >= nodes.length) {
      const finishedRoute = [...userRoute, 0];
      setUserRoute(finishedRoute);
      setIsTimerRunning(false);
      setShowScoreModal(true);
      soundEffects.onVictory();
      return;
    }

    // Don't add already visited non-depot nodes
    if (userRoute.includes(nodeId) && nodeId !== 0) return;

    if (nodes[nodeId]) soundEffects.onCityVisit(nodes[nodeId]);
    const next = [...userRoute, nodeId];
    setUserRoute(next);

    // Auto complete if all nodes visited and depot is added
    if (next.length === nodes.length + 1 && next[next.length - 1] === 0) {
      setIsTimerRunning(false);
      setShowScoreModal(true);
      soundEffects.onVictory();
    }
  };

  const handleUndo = () => {
    if (userRoute.length > 1) {
      setUserRoute((prev) => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setUserRoute([0]);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setShowScoreModal(false);
  };

  const handleAutoComplete = () => {
    if (userRoute.length >= nodes.length && userRoute[userRoute.length - 1] !== 0) {
      const finished = [...userRoute, 0];
      setUserRoute(finished);
      setIsTimerRunning(false);
      setShowScoreModal(true);
    }
  };

  // Distance calculation
  const matrix = buildDistanceMatrix(nodes);
  const currentUserDist = calculateTourDistance(userRoute, matrix);
  const isComplete = userRoute.length === nodes.length + 1 && userRoute[userRoute.length - 1] === 0;

  // Optimality Score
  const score = optimalDist > 0 ? Math.max(0, 100 - ((currentUserDist - optimalDist) / optimalDist) * 100) : 0;
  const unvisitedCount = Math.max(0, nodes.length - new Set(userRoute).size);

  return (
    <div className="flex-1 flex flex-col h-full bg-background select-none overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-border bg-panel px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-neon-green/10 border border-neon-green flex items-center justify-center shadow-neon-green">
            <Sparkles size={16} className="text-neon-green" />
          </div>
          <div>
            <div className="font-display font-extrabold text-sm text-slate-100 flex items-center gap-2">
              HUMAN VS MACHINE <span className="text-neon-green font-bold">DAILY DUEL</span>
              <span className="text-[10px] bg-neon-green/20 text-neon-green px-2 py-0.5 rounded font-mono border border-neon-green/30">
                #{puzzleNumber}
              </span>
            </div>
            <div className="text-[10px] text-muted">{dateString} · Connect all cities back to Depot</div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-surface border border-border px-2 py-1 rounded">
          <button
            onClick={() => setDayOffset((prev) => prev - 1)}
            className="p-1 text-muted hover:text-slate-200"
            title="Previous Day Puzzle"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-mono text-slate-300 px-1">Puzzle #{puzzleNumber}</span>
          <button
            onClick={() => setDayOffset((prev) => Math.min(0, prev + 1))}
            disabled={dayOffset >= 0}
            className="p-1 text-muted hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next Day Puzzle"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Canvas & Side Dashboard */}
      <div className="flex-1 flex overflow-hidden">
        {/* Interactive Canvas */}
        <div className="flex-1 h-full relative">
          <DailyDuelCanvas
            nodes={nodes}
            userRoute={userRoute}
            onAddNodeToRoute={handleAddNode}
            isComplete={isComplete}
          />
        </div>

        {/* Side Game Telemetry */}
        <div className="w-80 h-full bg-panel border-l border-border flex flex-col p-4 overflow-y-auto">
          {/* Timer & Progress */}
          <div className="bg-surface border border-border rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center text-xs text-muted font-bold uppercase mb-1">
              <span>Time Elapsed</span>
              <span className="text-neon-amber font-mono text-sm">{timerSeconds.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted font-bold uppercase">
              <span>Remaining Stops</span>
              <span className={`font-mono font-bold ${unvisitedCount === 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
                {unvisitedCount === 0 ? 'READY TO CLOSE DEPOT' : `${unvisitedCount} cities`}
              </span>
            </div>
          </div>

          {/* Current Distance vs AI */}
          <div className="space-y-3 mb-4">
            <div className="bg-surface p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted uppercase font-bold mb-1">Your Route Distance</div>
              <div className="text-xl font-bold font-display text-neon-cyan leading-none">
                {Math.round(currentUserDist)} <span className="text-xs text-muted font-normal">px</span>
              </div>
            </div>

            <div className="bg-surface p-3 rounded-lg border border-border flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted uppercase font-bold flex items-center gap-1">
                  <Brain size={12} className="text-neon-pink" />
                  <span>Genetic AI Target</span>
                </div>
                <div className="text-base font-bold font-mono text-neon-pink">
                  {Math.round(aiDist)} px
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-muted uppercase font-bold">Optimal (Held-Karp)</div>
                <div className="text-sm font-bold font-mono text-neon-green">
                  {Math.round(optimalDist)} px
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mb-4">
            {unvisitedCount === 0 && !isComplete && (
              <button
                onClick={handleAutoComplete}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neon-green text-black font-bold text-xs uppercase rounded shadow-neon-green animate-bounce"
              >
                <CheckCircle2 size={14} />
                <span>RETURN TO DEPOT & SUBMIT</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={userRoute.length <= 1 || isComplete}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-surface border border-border text-xs text-slate-300 hover:text-white rounded disabled:opacity-40"
              >
                <Undo2 size={13} />
                <span>Undo</span>
              </button>

              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-surface border border-border text-xs text-slate-300 hover:text-white rounded"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* User Route Waypoints */}
          <div className="flex-1 flex flex-col min-h-0">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider mb-2 block">
              Drawn Path ({userRoute.length} steps)
            </span>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-48">
              {userRoute.map((cityId, idx) => {
                const node = nodes[cityId];
                return (
                  <div
                    key={idx}
                    className="px-2.5 py-1 rounded bg-surface border border-border/70 text-xs flex justify-between text-slate-300"
                  >
                    <span>{idx + 1}. {node?.name}</span>
                    <span className="text-[10px] text-muted">Node #{cityId}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {showScoreModal && (
        <DuelScoreModal
          puzzleNumber={puzzleNumber}
          dateString={dateString}
          optimalityScore={score}
          userDistance={currentUserDist}
          optimalDistance={optimalDist}
          aiDistance={aiDist}
          timeSeconds={timerSeconds}
          onClose={() => setShowScoreModal(false)}
          onPlayAgain={() => {
            setDayOffset((prev) => prev - 1);
          }}
        />
      )}
    </div>
  );
};
