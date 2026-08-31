import { CityNode } from '../types/graph.ts';

export interface TSPLIBBenchmark {
  name: string;
  optimalDistance: number;
  description: string;
  nodes: CityNode[];
}

/**
 * Famous Berlin52 Benchmark (52 Locations in Berlin).
 * Known exact global optimum = 7542.
 */
export const BERLIN52_NODES: [number, number][] = [
  [565, 575], [25, 185], [345, 750], [945, 685], [845, 655],
  [880, 660], [25, 230], [525, 1000], [580, 1175], [650, 1130],
  [1605, 620], [1220, 580], [1465, 200], [1530, 5], [845, 680],
  [725, 370], [145, 665], [415, 635], [510, 875], [560, 365],
  [300, 465], [520, 585], [480, 415], [835, 625], [975, 580],
  [1215, 245], [1320, 315], [1250, 400], [660, 180], [410, 250],
  [420, 555], [575, 665], [1150, 1160], [700, 580], [685, 595],
  [750, 420], [420, 310], [455, 320], [535, 425], [675, 80],
  [700, 500], [980, 400], [1000, 380], [1050, 330], [1070, 340],
  [1100, 300], [1200, 260], [1280, 350], [1300, 450], [1350, 500],
  [1400, 550], [1450, 600]
];

/**
 * Eil51 Benchmark (51 cities). Known exact global optimum = 426.
 */
export const EIL51_NODES: [number, number][] = [
  [37, 52], [49, 49], [52, 64], [20, 26], [40, 30],
  [21, 47], [17, 63], [31, 62], [52, 33], [51, 21],
  [42, 41], [31, 32], [5, 25], [12, 42], [36, 16],
  [52, 41], [27, 23], [17, 33], [13, 13], [57, 58],
  [62, 42], [42, 57], [16, 57], [8, 52], [7, 38],
  [27, 68], [30, 48], [43, 67], [58, 48], [58, 27],
  [37, 69], [38, 46], [46, 10], [61, 33], [62, 63],
  [63, 69], [32, 22], [45, 35], [59, 15], [5, 6],
  [10, 17], [21, 10], [5, 64], [30, 15], [39, 10],
  [32, 39], [25, 32], [25, 55], [48, 28], [56, 37], [30, 40]
];

/**
 * Normalizes coordinate array into canvas screen bounds.
 */
export function normalizeCoordinates(coords: [number, number][], targetWidth = 760, targetHeight = 440, pad = 50): CityNode[] {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  coords.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);
  const scaleX = (targetWidth - pad * 2) / rangeX;
  const scaleY = (targetHeight - pad * 2) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  return coords.map(([x, y], idx) => ({
    id: idx,
    name: idx === 0 ? 'DEPOT' : `City ${idx}`,
    x: pad + (x - minX) * scale,
    y: pad + (y - minY) * scale,
    demand: (idx % 6) + 2,
  }));
}

export const TSPLIB_BENCHMARKS: Record<string, TSPLIBBenchmark> = {
  berlin52: {
    name: 'TSPLIB berlin52',
    optimalDistance: 7542,
    description: '52 locations across Berlin. Historical standard TSP benchmark.',
    nodes: normalizeCoordinates(BERLIN52_NODES),
  },
  eil51: {
    name: 'TSPLIB eil51',
    optimalDistance: 426,
    description: '51-city clustered problem with known global optimum.',
    nodes: normalizeCoordinates(EIL51_NODES),
  },
};
