import { isValidInput, normalize } from './normalize';
import { resonanceScore } from './jaccard';
import { harmonyScore } from './harmony';
import { cadenceScore } from './cadence';
import { numerologyScore } from './numerology';
import { aggregate } from './aggregate';
import { tagline } from './tagline';
import type { ScoreResult } from './types';

export type { ScoreResult, SubScores, SubScoreKey } from './types';

export class InvalidNameError extends Error {
  constructor(public readonly which: 'a' | 'b', public readonly value: string) {
    super(`Invalid name input for ${which}: ${JSON.stringify(value)}`);
    this.name = 'InvalidNameError';
  }
}

export function computeScore(a: string, b: string): ScoreResult {
  if (!isValidInput(a)) throw new InvalidNameError('a', a);
  if (!isValidInput(b)) throw new InvalidNameError('b', b);

  const na = normalize(a);
  const nb = normalize(b);

  const subScores = {
    resonance: resonanceScore(na, nb),
    harmony: harmonyScore(na, nb),
    cadence: cadenceScore(na, nb),
    numerology: numerologyScore(na, nb),
  };

  const percentage = aggregate(subScores);

  return {
    percentage,
    subScores,
    tagline: tagline(percentage),
    inputs: { a: a.trim(), b: b.trim() },
    normalized: { a: na, b: nb },
  };
}
