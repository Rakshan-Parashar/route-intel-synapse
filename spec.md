# Technical Specification: ROUTE_INTEL: SYNAPSE

## 1. Assumptions

```
ASSUMPTIONS:
1. Target platform is modern web browsers (Chrome, Firefox, Safari, Edge) supporting Web Workers and Web Audio API.
2. Real-world map mode uses OpenStreetMap + OSRM public API (100% free, requiring zero paid API keys like Google Maps).
3. Web Audio synthesis is 100% native (Web Audio API) with zero heavy external audio sample files.
4. Heavy algorithmic solving runs in dedicated Web Worker threads to ensure 60 FPS smooth rendering.
5. Production build will be a static PWA deployable to Vercel, Netlify, or GitHub Pages with single-command CI/CD.
```

---

## 2. Objective & Scope

Transform the college single-file TSP visualizer into **ROUTE_INTEL: SYNAPSE** — a world-first, production-grade Route Optimization & Fleet Intelligence platform featuring:
- **Comprehensive Algorithm Engine**: Exact (Held-Karp, Branch & Bound), Approximations (Christofides), Heuristics (2-Opt/3-Opt), Metaheuristics (Genetic, Ant Colony, Simulated Annealing), and Bio-Solvers (Slime Mold *Physarum*).
- **Human vs. Machine Daily Duel**: Wordle-style procedural daily puzzle with real-time AI racing and optimality scoring.
- **Generative Sound of Optimization**: Native Web Audio polyphony sonifying route untangling and convergence.
- **Dual Visualizer**: Cyberpunk 2D Canvas + 3D Isometric WebGL city grid with Truck & Autonomous Drone Tandem (FSTSP).
- **Real-World GIS Logistics**: OpenStreetMap + OSRM real street networks + Multi-Vehicle CVRP.

---

## 3. Technology Stack & Dependencies

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime & Framework** | React + TypeScript + Vite | React 18+, TS 5+, Vite 5+ | Blazing-fast reactive UI and type-safe architecture |
| **Styling & UI** | TailwindCSS + Lucide Icons | Tailwind 3+, `lucide-react` | Cyberpunk dark theme, glassmorphism, responsive UI |
| **Worker Threads** | Native Web Workers | Native HTML5 | Multi-threaded solver execution with 0 FPS drops |
| **Audio Engine** | Native Web Audio API | Native HTML5 | Real-time generative polyphonic synthesizer & sound effects |
| **GIS & Real Maps** | Leaflet + React-Leaflet | Leaflet 1.9+ | OpenStreetMap tiles & real street polylines (0 API keys needed) |
| **Routing API** | OSRM (Open Source Routing Machine) | REST API | Real road matrix and turn-by-turn road routes |
| **Charts & Metrics** | Canvas / Lightweight SVG | Native | Real-time loss/convergence curves & telemetry graphs |
| **PWA & Offline** | `vite-plugin-pwa` | Latest | Offline installable desktop & mobile app |

---

## 4. Commands

```bash
# Install dependencies
npm install

# Start local dev server (default: http://localhost:5173)
npm run dev

# Run TypeScript type check
npm run typecheck

# Run test suite
npm test

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 5. Project Structure

```
TSP/
├── index.html                   # HTML entry point with Space Mono & Syne fonts
├── package.json                 # Project configuration and dependencies
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration with PWA plugin
├── tailwind.config.js           # Tailwind config with custom neon color tokens
├── spec.md                      # This living specification document
├── tasks/
│   ├── plan.md                  # High-level architecture plan
│   └── todo.md                  # Vertical-slice task checklist
└── src/
    ├── main.tsx                 # React entry mount
    ├── App.tsx                  # Root application shell & mode switcher
    ├── types/                   # TypeScript interfaces & data contracts
    │   ├── graph.ts             # City, Point2D, LatLng, Matrix types
    │   ├── solver.ts            # Algorithm types, Yield events, Solver configs
    │   ├── audio.ts             # Sound synthesizer scale & note definitions
    │   └── vrp.ts               # Fleet, Vehicle, Drone, Capacity types
    ├── core/                    # Pure algorithmic & mathematical logic
    │   ├── distance.ts          # Euclidean, Haversine, Manhattan distance
    │   ├── matrix.ts            # Distance matrix generator
    │   └── benchmarks.ts        # TSPLIB parser & preset loader (berlin52, eil51)
    ├── workers/                 # Web Workers for asynchronous solving
    │   ├── solver.worker.ts     # Multi-threaded algorithm worker
    │   └── solverDispatcher.ts  # Worker bridge with message passing
    ├── algorithms/              # Solvers with step-by-step yield hooks
    │   ├── exact/               # Held-Karp, Branch & Bound, Brute-Force
    │   ├── heuristics/          # Nearest Neighbor, 2-Opt, 3-Opt, Christofides
    │   ├── metaheuristics/      # Genetic Algorithm, Simulated Annealing, ACO
    │   └── bio/                 # Physarum Slime Mold & Elastic Net
    ├── audio/                   # Web Audio synthesizer engine
    │   ├── synthEngine.ts       # Oscillator bank, filters, envelope generators
    │   └── soundEffects.ts      # Swap chimes, temperature glissando, victory chords
    ├── components/              # UI Components
    │   ├── canvas/              # 2D Canvas visualizer & interactive node editor
    │   ├── arena/               # Split-screen 2-way & 4-way solver race arena
    │   ├── duel/                # Human vs Machine Daily Puzzle game view
    │   ├── gis/                 # Leaflet OpenStreetMap real-world routing view
    │   ├── isometric/           # 3D Isometric truck & drone simulation
    │   ├── telemetry/           # Real-time convergence charts, CO2 & cost stats
    │   ├── controls/            # Play/Pause, speed slider, timeline scrubber
    │   └── common/              # Buttons, Modals, Navbar, Status pills
    └── utils/                   # Helpers (URL compression, GeoJSON/CSV export)
```

---

## 6. Code Style & Architecture Conventions

- **Immutable Data Structures**: Pure functions for distance calculation and matrix operations.
- **Worker Step Yielding**: Every algorithm implements an asynchronous generator or step dispatcher that yields intermediate routes:
```typescript
export interface SolverYieldEvent {
  iteration: number;
  currentTour: number[];
  bestTour: number[];
  bestDistance: number;
  temperature?: number;      // For Simulated Annealing
  pheromones?: number[][];    // For Ant Colony
  populationBest?: number[]; // For Genetic Algorithm
  done: boolean;
}
```
- **Zero Heavy External Assets**: SVGs, audio synths, and city pins are generated programmatically in code.

---

## 7. Testing Strategy

- **Unit Tests (`vitest`)**:
  - Distance metrics (Euclidean, Haversine Great-Circle).
  - Exact solver correctness: Verify Held-Karp matches Brute-Force for $N \le 8$.
  - Benchmark verification: Verify Christofides achieves $< 1.5\times$ optimal on `eil51`.
  - Matrix symmetry and triangle inequality checks.
- **Integration Tests**:
  - Web Worker message passing and yield events.
  - OSRM API response parsing and fallback to Euclidean when offline.
- **Performance Budget**:
  - 60 FPS animation loop with $\ge 500$ nodes.
  - Zero UI lockup during 10,000-generation Genetic Algorithm execution.

---

## 8. Boundaries

- **Always**:
  - Run algorithms in Web Workers to prevent UI freezing.
  - Maintain mobile & touch responsiveness for manual puzzle solving.
  - Keep audio default volume balanced with a 1-click global mute button.
  - Fall back gracefully to Euclidean routing if external OSRM API is unreachable.
- **Ask First**:
  - Adding third-party libraries over $>100\text{KB}$.
  - Changing the core solver interface contracts.
- **Never**:
  - Rely on paid API keys (e.g. Google Maps API keys).
  - Run heavy CPU loops on the main UI thread.
  - Auto-play loud sound without user interaction.

---

## 9. Success Criteria

1. **Algorithm Breadth**: At least 7 distinct algorithms (Held-Karp, Branch & Bound, Christofides, 2-Opt, Genetic Algorithm, Ant Colony, Simulated Annealing) running with step-by-step visual animation.
2. **Battle Arena**: 4 algorithms can race simultaneously on the same graph with live comparative metrics.
3. **Interactive Game**: Working "Human vs. Machine" duel with daily seed, timer, interactive edge drawing, and % optimality score.
4. **Sonification**: Musical polyphony smoothly playing tones matching node positions and harmony on route improvements.
5. **Real-World GIS**: OpenStreetMap displays real road routes via OSRM turn-by-turn geometry.
6. **Deployability**: Builds cleanly with 0 TypeScript errors and runs offline as a PWA.
