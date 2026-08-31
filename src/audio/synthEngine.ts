/**
 * Generative Web Audio Synthesizer for Spatial Optimization Sonification.
 * 100% browser native Web Audio API with zero external dependencies.
 */

export type MusicalScale = 'cyberpunk-minor' | 'pentatonic' | 'synthwave';

export const SCALES: Record<MusicalScale, number[]> = {
  // Frequencies in Hz across 2 octaves
  'cyberpunk-minor': [
    220.00, // A3
    246.94, // B3
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.00, // G4
    440.00, // A4
    493.88, // B4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
  ],
  'pentatonic': [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50 // C6
  ],
  'synthwave': [
    174.61, // F3
    207.65, // Ab3
    233.08, // Bb3
    261.63, // C4
    311.13, // Eb4
    349.23, // F4
    415.30, // Ab4
    466.16, // Bb4
    523.25, // C5
    622.25, // Eb5
    698.46, // F5
  ]
};

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isMuted: boolean = true;
  private currentScale: MusicalScale = 'cyberpunk-minor';

  constructor() {
    // Lazy AudioContext initialization on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Compressor to prevent distortion on polyphony
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain) {
      if (!muted) this.initContext();
      return;
    }

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.45, now + 0.05);
  }

  public setScale(scale: MusicalScale) {
    this.currentScale = scale;
  }

  /**
   * Plays a resonant plucked synth note for a city based on its (x, y) coordinates.
   */
  public playNodePluck(nodeIndex: number, normX = 0.5, normY = 0.5, type: OscillatorType = 'triangle') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.compressor) return;

    const scale = SCALES[this.currentScale];
    const freq = scale[nodeIndex % scale.length];
    const now = this.ctx.currentTime;

    // Oscillator
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    // Dynamic Lowpass Filter based on Y position (height)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800 + (1 - normY) * 3200, now);
    filter.Q.setValueAtTime(4, now);

    // Stereo Panner based on X position
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, (normX - 0.5) * 1.8)), now);
    }

    // Gain ADSR Envelope
    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.35, now + 0.015); // Attack
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45); // Decay & Release

    // Routing
    if (panner) {
      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(panner);
      panner.connect(this.compressor);
    } else {
      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.compressor);
    }

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Plays a high-frequency ascending crystalline chime on route improvement (2-Opt swap).
   */
  public playSwapImprovement(improvementAmount = 10) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.compressor) return;

    const now = this.ctx.currentTime;
    const baseFreq = 650 + Math.min(800, improvementAmount * 15);

    [0, 0.04, 0.08].forEach((delay, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * (1 + idx * 0.25), now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.2, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

      osc.connect(gain);
      gain.connect(this.compressor!);

      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    });
  }

  /**
   * Triumphant 4-note victory chord resolving into mathematical harmony.
   */
  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.compressor) return;

    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major Triad + Octave (C5, E5, G5, C6)

    chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.28, now + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.compressor!);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 1.3);
    });
  }
}

export const globalSynth = new SynthEngine();
