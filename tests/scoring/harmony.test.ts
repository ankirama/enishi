import { describe, it, expect } from 'vitest';
import { harmonyScore } from '@/lib/scoring/harmony';

describe('harmonyScore (vowel-ratio proximity)', () => {
  it('is 100 when both have identical vowel ratios', () => {
    // 'paul' (4 letters, 2 vowels [a,u] => 0.5) vs 'sara' (4 letters, 2 vowels [a,a] => 0.5)
    expect(harmonyScore('paul', 'sara')).toBe(100);
  });

  it('is 0 when one has only vowels and the other has only consonants', () => {
    expect(harmonyScore('aeio', 'bcdf')).toBe(0);
  });

  it('counts y as vowel', () => {
    // 'yves' (4 letters, vowels [y,e] => 0.5) vs 'paul' (0.5)
    expect(harmonyScore('yves', 'paul')).toBe(100);
  });

  it('ignores hyphens and apostrophes for letter count', () => {
    // 'jean-pierre' letters = j,e,a,n,p,i,e,r,r,e → 10 letters, 5 vowels (e,a,i,e,e) → 0.5
    // 'paul' → 0.5 → 100
    expect(harmonyScore('jean-pierre', 'paul')).toBe(100);
  });

  it('returns 0 when both names contain no letters', () => {
    expect(harmonyScore('---', "'")).toBe(0);
  });

  it('returns rounded integer', () => {
    expect(Number.isInteger(harmonyScore('marie', 'paul'))).toBe(true);
  });
});
