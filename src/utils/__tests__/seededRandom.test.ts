import { describe, it, expect } from 'vitest';
import { getDailySeed, generateDailyPuzzleNodes } from '../seededRandom.ts';

describe('Seeded Daily Puzzle Generator', () => {
  it('generates consistent date strings and numerical seeds', () => {
    const daily1 = getDailySeed(0);
    const daily2 = getDailySeed(0);

    expect(daily1.seed).toBe(daily2.seed);
    expect(daily1.dateString).toBe(daily2.dateString);
    expect(daily1.puzzleNumber).toBe(daily2.puzzleNumber);
  });

  it('generates deterministic node coordinates for the same seed', () => {
    const nodesA = generateDailyPuzzleNodes(20260831, 10);
    const nodesB = generateDailyPuzzleNodes(20260831, 10);

    expect(nodesA.length).toBe(10);
    expect(nodesA[0].x).toBe(nodesB[0].x);
    expect(nodesA[0].y).toBe(nodesB[0].y);
    expect(nodesA[5].x).toBe(nodesB[5].x);
    expect(nodesA[5].y).toBe(nodesB[5].y);
  });

  it('generates different layouts for different seeds', () => {
    const nodes1 = generateDailyPuzzleNodes(11111, 8);
    const nodes2 = generateDailyPuzzleNodes(99999, 8);

    expect(nodes1[1].x).not.toBe(nodes2[1].x);
  });
});
