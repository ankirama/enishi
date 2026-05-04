import { describe, it, expect } from 'vitest';
import { cadenceScore } from '@/lib/scoring/cadence';

describe('cadenceScore (length proximity)', () => {
  it('is 100 for equal-length names', () => {
    expect(cadenceScore('paul', 'mary')).toBe(100);
  });

  it('decreases with length difference', () => {
    // 'bo' (2) vs 'maximilien' (10): diff 8 / max 10 = 0.8 → 20
    expect(cadenceScore('bo', 'maximilien')).toBe(20);
  });

  it('counts only letters (no hyphens, no apostrophes)', () => {
    // 'jean-pierre' = 10 letters; 'samantha' = 8; diff 2 / 10 = 0.2 → 80
    expect(cadenceScore('jean-pierre', 'samantha')).toBe(80);
  });

  it('returns 0 if both have zero letters', () => {
    expect(cadenceScore('-', "'")).toBe(0);
  });

  it('returns 0 if one has zero letters', () => {
    expect(cadenceScore('marie', "-")).toBe(0);
  });

  it('returns rounded integer', () => {
    expect(Number.isInteger(cadenceScore('bo', 'maximilien'))).toBe(true);
  });
});
