import type { SubScores } from './types';

const WEIGHTS = {
  resonance: 0.35,
  harmony: 0.25,
  cadence: 0.20,
  numerology: 0.20,
} as const;

export function aggregate(s: SubScores): number {
  const v =
    WEIGHTS.resonance * s.resonance +
    WEIGHTS.harmony * s.harmony +
    WEIGHTS.cadence * s.cadence +
    WEIGHTS.numerology * s.numerology;
  return Math.round(v);
}
