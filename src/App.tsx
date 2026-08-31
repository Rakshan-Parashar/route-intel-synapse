import { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationCanvas } from './components/canvas/SimulationCanvas.tsx';
import { MetricsPanel } from './components/telemetry/MetricsPanel.tsx';
import { ControlBar } from './components/controls/ControlBar.tsx';
import { BattleArena } from './components/arena/BattleArena.tsx';
import { DailyDuelView } from './components/duel/DailyDuelView.tsx';
import { IsometricStudioView } from './components/isometric/IsometricStudioView.tsx';
import { RealWorldMapView } from './components/gis/RealWorldMapView.tsx';
import { ExportModal } from './components/common/ExportModal.tsx';
import { CityNode } from './types/graph.ts';
import { AlgorithmType, SolverYieldEvent } from './types/solver.ts';
import { generateRandomPoints, generateClusteredPoints, generateCirclePoints } from './core/matrix.ts';
import { decodeRouteFromURL } from './utils/exportTools.ts';
import { SolverDispatcher } from './workers/solverDispatcher.ts';
import { soundEffects } from './audio/soundEffects.ts';
import { Boxes, Swords, Compass, Activity, Volume2, VolumeX, Sparkles, Share2 } from 'lucide-react';

export default function App() {
  // State
  const [nodes, setNodes] = useState<CityNode[]>(() => {
    const fromUrl = decodeRouteFromURL();
    return fromUrl && fromUrl.length >= 3 ? fromUrl : generateRandomPoints(8, 800, 500);
  });
  const [route, setRoute] = useState<number[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [coveredDistance, setCoveredDistance] = useState<number>(0);
  const [routeIndex, setRouteIndex] = useState<number>(0);
  const [vehiclePos, setVehiclePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [vehicleAngle, setVehicleAngle] = useState<number>(0);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('nearest-neighbor');
  const [speed, setSpeed] = useState<number>(2);
  const [cityCount, setCityCount] = useState<number>(8);
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'paused'>('idle');
  const [activeTab, setActiveTab] = useState<'canvas' | 'arena' | 'duel' | 'isometric' | 'gis'>('canvas');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const dispatcherRef = useRef<SolverDispatcher>(new SolverDispatcher());
  const animFrameRef = useRef<number | null>(null);

  // Recompute route when nodes or algorithm change
  const solveRoute = useCallback(() => {
    if (nodes.length < 2) return;
    setStatus('running');

    dispatcherRef.current.start(
      {
        algorithm,
        nodes,
        depotIndex: 0,
      },
      (event: SolverYieldEvent) => {
        setRoute(event.bestTour);
        setTotalDistance(event.bestDistance);
        setExecutionTimeMs(event.executionTimeMs);

        if (event.done) {
          setStatus('idle');
        }
      }
    );
  }, [algorithm, nodes]);

  // Initial solve and depot reset
  useEffect(() => {
    if (nodes.length > 0) {
      setVehiclePos({ x: nodes[0].x, y: nodes[0].y });
      solveRoute();
    }
  }, [nodes, solveRoute]);

  // Node Dragging Handler
  const handleNodeMove = (id: number, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );
  };

  // Add Node on Canvas Double Click
  const handleAddNode = (x: number, y: number) => {
    if (nodes.length >= 50) return;
    const newId = nodes.length;
    const newNode: CityNode = {
      id: newId,
      name: String.fromCharCode(64 + newId <= 90 ? 64 + newId : 65 + (newId % 26)),
      x,
      y,
      demand: Math.floor(Math.random() * 8) + 1,
    };
    setNodes((prev) => [...prev, newNode]);
    setCityCount((prev) => prev + 1);
  };

  // Regenerate City Layouts
  const handleRegenerate = (type: 'random' | 'clustered' | 'circle') => {
    handleReset();
    let newNodes: CityNode[] = [];
    if (type === 'clustered') {
      newNodes = generateClusteredPoints(cityCount, 3, 900, 600);
    } else if (type === 'circle') {
      newNodes = generateCirclePoints(cityCount, 450, 300, 220);
    } else {
      newNodes = generateRandomPoints(cityCount, 900, 600);
    }
    setNodes(newNodes);
  };

  // Reset Simulation
  const handleReset = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsSimulating(false);
    setRouteIndex(0);
    setCoveredDistance(0);
    setTrail([]);
    if (nodes.length > 0) {
      setVehiclePos({ x: nodes[0].x, y: nodes[0].y });
    }
    setStatus('idle');
  };

  // Simulation Animation Loop (Vehicle Movement)
  useEffect(() => {
    if (!isSimulating || route.length < 2 || routeIndex >= route.length - 1) {
      if (routeIndex >= route.length - 1 && isSimulating) {
        setIsSimulating(false);
        setStatus('completed');
      }
      return;
    }

    const stepSimulation = () => {
      const targetNodeId = route[routeIndex + 1];
      const target = nodes[targetNodeId];
      if (!target) return;

      const dx = target.x - vehiclePos.x;
      const dy = target.y - vehiclePos.y;
      const dist = Math.hypot(dx, dy);

      // Rotate vehicle heading towards target
      if (dist > 1) {
        const targetAngle = Math.atan2(dy, dx);
        let diff = targetAngle - vehicleAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        setVehicleAngle((prev) => prev + diff * 0.18);
      }

      if (dist <= speed * 1.5) {
        // Arrived at target waypoint
        soundEffects.onCityVisit(target);
        setCoveredDistance((prev) => prev + dist);
        setVehiclePos({ x: target.x, y: target.y });
        setTrail((prev) => [...prev, { x: target.x, y: target.y }]);
        setRouteIndex((prev) => {
          const nextIdx = prev + 1;
          if (nextIdx >= route.length - 1) {
            soundEffects.onVictory();
          }
          return nextIdx;
        });
      } else {
        const moveStep = speed * 1.5;
        const newX = vehiclePos.x + (moveStep * dx) / dist;
        const newY = vehiclePos.y + (moveStep * dy) / dist;
        setCoveredDistance((prev) => prev + moveStep);
        setVehiclePos({ x: newX, y: newY });
        setTrail((prev) => {
          const nextTrail = [...prev, { x: newX, y: newY }];
          return nextTrail.length > 70 ? nextTrail.slice(-70) : nextTrail;
        });
      }

      animFrameRef.current = requestAnimationFrame(stepSimulation);
    };

    animFrameRef.current = requestAnimationFrame(stepSimulation);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating, route, routeIndex, vehiclePos, speed, nodes, vehicleAngle]);

  const toggleSimulation = () => {
    if (routeIndex >= route.length - 1) {
      handleReset();
    }
    setIsSimulating((prev) => {
      const next = !prev;
      setStatus(next ? 'running' : 'paused');
      return next;
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border bg-panel/90 backdrop-blur px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-neon-cyan/10 border border-neon-cyan flex items-center justify-center shadow-neon-cyan">
            <Boxes size={18} className="text-neon-cyan" />
          </div>
          <div>
            <div className="font-display font-extrabold text-base tracking-wider flex items-center gap-1.5">
              ROUTE_INTEL <span className="text-neon-cyan font-bold">SYNAPSE</span>
              <span className="text-[9px] bg-neon-cyan/20 text-neon-cyan px-1.5 py-0.5 rounded border border-neon-cyan/30">
                PRO v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-surface border border-border rounded-md p-1">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded transition-all ${
              activeTab === 'canvas'
                ? 'bg-neon-cyan text-black shadow-neon-cyan'
                : 'text-muted hover:text-slate-200'
            }`}
          >
            <Activity size={13} />
            <span>2D Lab</span>
          </button>
          <button
            onClick={() => setActiveTab('arena')}
            className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded transition-all ${
              activeTab === 'arena'
                ? 'bg-neon-pink text-white shadow-neon-pink'
                : 'text-muted hover:text-slate-200'
            }`}
          >
            <Swords size={13} />
            <span>Battle Arena</span>
            <span className="text-[8px] bg-neon-pink/30 px-1 rounded text-white">P2</span>
          </button>
          <button
            onClick={() => setActiveTab('duel')}
            className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded transition-all ${
              activeTab === 'duel'
                ? 'bg-neon-green text-black shadow-neon-green'
                : 'text-muted hover:text-slate-200'
            }`}
          >
            <Sparkles size={13} />
            <span>Human vs AI</span>
          </button>
          <button
            onClick={() => setActiveTab('isometric')}
            className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded transition-all ${
              activeTab === 'isometric'
                ? 'bg-neon-purple text-white shadow-lg'
                : 'text-muted hover:text-slate-200'
            }`}
          >
            <Boxes size={13} />
            <span>3D Studio</span>
            <span className="text-[8px] bg-neon-purple/40 px-1 rounded text-white">FSTSP</span>
          </button>
          <button
            onClick={() => setActiveTab('gis')}
            className={`flex items-center gap-2 px-3 py-1 text-xs font-bold rounded transition-all ${
              activeTab === 'gis'
                ? 'bg-neon-amber text-black'
                : 'text-muted hover:text-slate-200'
            }`}
          >
            <Compass size={13} />
            <span>Real GIS</span>
            <span className="text-[8px] bg-neon-amber/30 px-1 rounded text-black">P6</span>
          </button>
        </div>

        {/* Sound, Share & Status Header Icons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 rounded border border-border bg-surface text-muted hover:text-neon-cyan hover:border-neon-cyan/40 text-xs flex items-center gap-1.5 transition-colors"
            title="Export & Benchmarks Studio"
          >
            <Share2 size={15} />
            <span className="text-[10px] font-bold uppercase">Export</span>
          </button>

          <button
            onClick={() => {
              setAudioEnabled((prev) => {
                const next = !prev;
                soundEffects.setMuted(!next);
                return next;
              });
            }}
            className={`p-2 rounded border text-xs flex items-center gap-1.5 transition-colors ${
              audioEnabled
                ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan'
                : 'border-border bg-surface text-muted hover:text-slate-200'
            }`}
            title="Toggle Web Audio Synthesizer"
          >
            {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="text-[10px] font-bold uppercase">{audioEnabled ? 'Synth ON' : 'Muted'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'arena' ? (
          <BattleArena />
        ) : activeTab === 'duel' ? (
          <DailyDuelView />
        ) : activeTab === 'isometric' ? (
          <IsometricStudioView />
        ) : activeTab === 'gis' ? (
          <RealWorldMapView />
        ) : (
          <>
            {/* Canvas / Viewport */}
            <div className="flex-1 h-full relative">
              <SimulationCanvas
                nodes={nodes}
                route={route}
                routeIndex={routeIndex}
                vehiclePos={vehiclePos}
                vehicleAngle={vehicleAngle}
                trail={trail}
                onNodeMove={handleNodeMove}
                onAddNode={handleAddNode}
                isSimulating={isSimulating}
              />
            </div>

            {/* Telemetry Sidebar */}
            <div className="w-80 h-full flex-shrink-0">
              <MetricsPanel
                totalDistance={totalDistance}
                coveredDistance={coveredDistance}
                nodes={nodes}
                route={route}
                routeIndex={routeIndex}
                executionTimeMs={executionTimeMs}
                selectedAlgorithm={algorithm}
                status={status}
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom Control Bar only in 2D Canvas mode */}
      {activeTab === 'canvas' && (
        <ControlBar
          algorithm={algorithm}
          onAlgorithmChange={(algo) => {
            setAlgorithm(algo);
            handleReset();
          }}
          isSimulating={isSimulating}
          onToggleSimulate={toggleSimulation}
          onReset={handleReset}
          onRegenerate={handleRegenerate}
          speed={speed}
          onSpeedChange={setSpeed}
          cityCount={cityCount}
          onCityCountChange={(count) => {
            setCityCount(count);
            handleReset();
            setNodes(generateRandomPoints(count, 900, 600));
          }}
          onSolve={solveRoute}
        />
      )}

      {/* Export & Benchmark Modal */}
      {showExportModal && (
        <ExportModal
          nodes={nodes}
          route={route}
          totalDistance={totalDistance}
          onClose={() => setShowExportModal(false)}
          onLoadBenchmark={(benchNodes) => {
            handleReset();
            setNodes(benchNodes);
            setCityCount(benchNodes.length);
          }}
        />
      )}
    </div>
  );
}
