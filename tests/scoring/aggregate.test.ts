import { describe, it, expect } from 'vitest';
import { aggregate } from '@/lib/scoring/aggregate';
import { computeScore } from '@/lib/scoring';

describe('aggregate', () => {
  it('applies weights 0.35/0.25/0.20/0.20 and rounds', () => {
    const result = aggregate({ resonance: 100, harmony: 100, cadence: 100, numerology: 100 });
    expect(result).toBe(100);
  });

  it('respects weighting (resonance dominates)', () => {
    expect(aggregate({ resonance: 100, harmony: 0, cadence: 0, numerology: 0 })).toBe(35);
    expect(aggregate({ resonance: 0, harmony: 100, cadence: 0, numerology: 0 })).toBe(25);
    expect(aggregate({ resonance: 0, harmony: 0, cadence: 100, numerology: 0 })).toBe(20);
    expect(aggregate({ resonance: 0, harmony: 0, cadence: 0, numerology: 100 })).toBe(20);
  });

  it('returns integer in [0, 100]', () => {
    const r = aggregate({ resonance: 73, harmony: 51, cadence: 88, numerology: 12 });
    expect(Number.isInteger(r)).toBe(true);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
  });
});

describe('computeScore (public API)', () => {
  it('returns deterministic result for the same inputs', () => {
    const r1 = computeScore('Hélène', 'Julien');
    const r2 = computeScore('Hélène', 'Julien');
    expect(r1).toEqual(r2);
  });

  it('is invariant to accent normalization', () => {
    const r1 = computeScore('Hélène', 'Julien');
    const r2 = computeScore('Helene', 'Julien');
    expect(r1.percentage).toBe(r2.percentage);
    expect(r1.subScores).toEqual(r2.subScores);
  });

  it('is symmetric on percentage and subScores', () => {
    const r1 = computeScore('Marie', 'Paul');
    const r2 = computeScore('Paul', 'Marie');
    expect(r1.percentage).toBe(r2.percentage);
    expect(r1.subScores).toEqual(r2.subScores);
  });

  it('throws on invalid input', () => {
    expect(() => computeScore('Marie123', 'Paul')).toThrow();
    expect(() => computeScore('', 'Paul')).toThrow();
    expect(() => computeScore('Marie', 'a'.repeat(51))).toThrow();
  });

  it('preserves the original inputs in the result', () => {
    const r = computeScore('Hélène', 'Julien');
    expect(r.inputs).toEqual({ a: 'Hélène', b: 'Julien' });
    expect(r.normalized).toEqual({ a: 'helene', b: 'julien' });
  });

  it('produces a tagline matching the percentage', () => {
    const r = computeScore('Marie', 'Marie');
    expect(r.percentage).toBeGreaterThanOrEqual(95);
    expect(r.tagline).toBe('harmonie rare');
  });
});
