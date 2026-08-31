# 🚀 ROUTE_INTEL: SYNAPSE
> **Next-Gen Route Intelligence, Combinatorial Optimization & Autonomous Fleet Metaverse**

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-Native-00e5ff.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

**ROUTE_INTEL: SYNAPSE** is a portfolio-defining, production-grade combinatorial optimization platform and interactive logistics metaverse. It elevates the classic Travelling Salesperson Problem (TSP) into an unprecedented visual laboratory combining exact dynamic programming, nature-inspired heuristics, 3D WebGL physics, generative musical sonification, real-world OpenStreetMap routing, and human-vs-AI puzzle duels.

---

## ⚡ Core Features

### 1. 🧪 2D Optimization Lab
- Multi-threaded background solving via **HTML5 Web Workers** (0 FPS drops).
- Interactive canvas with node drag-and-drop, double-click to add cities, and vehicle particle trail simulation.
- Comprehensive algorithm suite:
  - 🏆 **Held-Karp Exact DP** ($O(N^2 \cdot 2^N)$ bitmask state transitions for exact mathematical optimum)
  - 📐 **Christofides Algorithm** ($1.5\times$ approximation on metric graphs)
  - 🔄 **2-Opt & 3-Opt Local Search** (iterative edge uncrossing)
  - 🌡️ **Simulated Annealing** (Metropolis thermal cooling)
  - 🧬 **Genetic Algorithm** (OX1 crossover, inversion mutation, elitism)
  - 🐜 **Ant Colony Optimization (ACO)** (pheromone matrix swarm intelligence)

### 2. ⚔️ 4-Way "Battle Royale" Arena
- 4 solvers race simultaneously on identical node graphs.
- Live leaderboard tracking rank, distance, solve time (ms), and optimality gap against the 1st place winner.
- Real-time multi-line convergence loss curves.

### 3. 🧠 "Human vs. Machine" Daily Duel (Wordle of Optimization)
- Daily procedural seeded puzzle generated via Mulberry32 PRNG.
- Interactive mouse/touch route weaver with real-time guide lines.
- Mathematical optimality grading: **S+ (Perfection 👑)**, **S (Master 🥇)**, **A**, **B**, **C**.
- 1-Click Clipboard Share with formatted emoji cards (`🟩🟩🟩🟩🟩🟩🟩🟩🟨`).

### 4. 🚁 3D Isometric Studio & Flying Sidekick Drone-Truck Tandem (FSTSP)
- 3D isometric city grid with depth-sorted skyscrapers and rooftop delivery helipads.
- Autonomous aerial quadcopter drone docking on mother truck roof, launching for express deliveries, and rendezvousing downstream.
- Chaos Monkey incident generator (roadblocks, VIP rush orders, storms) forcing real-time dynamic re-routing.
- Multi-camera switcher: **3D God View**, **Drone FPV**, **Truck Chase Cam**.

### 5. 🗺️ Real-World GIS & Fleet Logistics
- Leaflet + OpenStreetMap dark CartoDB tiles with worldwide landmark presets (New York, Paris, Tokyo, London).
- Worldwide address geocoding search via Nominatim API.
- Turn-by-turn road routing via **OSRM (Open Source Routing Machine)**.
- Multi-Van Capacitated VRP (CVRP) fleet simulation with diesel fuel and $\text{CO}_2$ emissions calculations.

### 6. 🎵 Generative Web Audio Synthesizer (The Sound of Optimization)
- 100% native Web Audio API spatial frequency mapping across **Cyberpunk Minor**, **Pentatonic**, and **Synthwave** scales.
- Dynamic plucks, 2-Opt crystalline swap arpeggios, and 4-note victory fanfares.

### 7. 📦 Benchmark & Export Studio
- Preloaded standard TSPLIB benchmarks (`berlin52`, `eil51`).
- Export to **GeoJSON**, **CSV**, and **Shareable compressed URL state links**.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/route-intel-synapse.git

# Navigate into directory
cd TSP

# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Build for production
npm run build
```

---

## 🛡️ License

MIT License © 2026. Built with precision and passion for combinatorial algorithms.
