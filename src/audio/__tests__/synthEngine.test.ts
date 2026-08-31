import { describe, it, expect } from 'vitest';
import { SCALES, SynthEngine } from '../synthEngine.ts';

describe('Web Audio Synth Engine', () => {
  it('contains valid harmonic scale frequency maps', () => {
    expect(SCALES['cyberpunk-minor'].length).toBeGreaterThan(5);
    expect(SCALES['pentatonic'].length).toBeGreaterThan(5);
    expect(SCALES['synthwave'].length).toBeGreaterThan(5);

    // Verify frequencies are positive numbers
    SCALES['cyberpunk-minor'].forEach((freq) => {
      expect(freq).toBeGreaterThan(50);
      expect(freq).toBeLessThan(2000);
    });
  });

  it('instantiates SynthEngine cleanly without errors', () => {
    const synth = new SynthEngine();
    expect(synth).toBeDefined();

    // Default muted behavior prevents background context auto-play
    synth.setMuted(true);
    synth.setScale('pentatonic');
  });
});
