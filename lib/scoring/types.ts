export type SubScoreKey = 'resonance' | 'harmony' | 'cadence' | 'numerology';

export interface SubScores {
  resonance: number;   // 0-100
  harmony: number;     // 0-100
  cadence: number;     // 0-100
  numerology: number;  // 0-100
}

export interface ScoreResult {
  percentage: number;       // 0-100, integer
  subScores: SubScores;
  tagline: string;
  inputs: { a: string; b: string };          // raw inputs as provided
  normalized: { a: string; b: string };      // post-normalization
}
