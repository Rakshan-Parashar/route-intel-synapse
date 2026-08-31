import { globalSynth, MusicalScale } from './synthEngine.ts';
import { CityNode } from '../types/graph.ts';

export const soundEffects = {
  setMuted: (muted: boolean) => {
    globalSynth.setMuted(muted);
  },

  setScale: (scale: MusicalScale) => {
    globalSynth.setScale(scale);
  },

  onCityVisit: (node: CityNode, canvasWidth = 800, canvasHeight = 500) => {
    const normX = Math.max(0, Math.min(1, node.x / Math.max(1, canvasWidth)));
    const normY = Math.max(0, Math.min(1, node.y / Math.max(1, canvasHeight)));
    globalSynth.playNodePluck(node.id, normX, normY, node.id === 0 ? 'sawtooth' : 'triangle');
  },

  onRouteImprovement: (delta = 10) => {
    globalSynth.playSwapImprovement(delta);
  },

  onVictory: () => {
    globalSynth.playVictoryFanfare();
  },
};
