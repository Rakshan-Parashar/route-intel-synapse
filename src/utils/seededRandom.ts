import { CityNode } from '../types/graph.ts';

/**
 * Deterministic Pseudo-Random Number Generator (PRNG) using Mulberry32.
 */
export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a numerical seed based on the current calendar date (YYYYMMDD).
 */
export function getDailySeed(offsetDays = 0): { seed: number; dateString: string; puzzleNumber: number } {
  const now = new Date();
  if (offsetDays !== 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  const epoch = new Date(2026, 0, 1).getTime();
  const puzzleNumber = Math.max(1, Math.floor((now.getTime() - epoch) / (1000 * 60 * 60 * 24)));
  const seed = parseInt(`${year}${month}${day}`, 10);

  return { seed, dateString, puzzleNumber };
}

/**
 * Generates a deterministic daily city graph using the day's seed.
 */
export function generateDailyPuzzleNodes(seed: number, count = 10, width = 760, height = 480, padding = 60): CityNode[] {
  const rng = mulberry32(seed);
  const safeW = width - padding * 2;
  const safeH = height - padding * 2;
  const nodes: CityNode[] = [];

  for (let i = 0; i < count; i++) {
    nodes.push({
      id: i,
      name: i === 0 ? 'DEPOT' : String.fromCharCode(64 + i),
      x: padding + rng() * safeW,
      y: padding + rng() * safeH,
      demand: Math.floor(rng() * 6) + 1,
    });
  }

  return nodes;
}
