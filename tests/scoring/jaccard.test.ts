import { describe, it, expect } from 'vitest';
import { resonanceScore } from '@/lib/scoring/jaccard';

describe('resonanceScore (Jaccard on letter sets)', () => {
  it('is 100 for identical names', () => {
    expect(resonanceScore('marie', 'marie')).toBe(100);
  });

  it('is 0 for fully disjoint letter sets', () => {
    expect(resonanceScore('abc', 'xyz')).toBe(0);
  });

  it('computes Jaccard correctly on a known case', () => {
    // 'paul' = {p,a,u,l}; 'maria' = {m,a,r,i}; ∩ = {a} (1); ∪ = 7 → 1/7 ≈ 14.286
    expect(resonanceScore('paul', 'maria')).toBe(Math.round((1 / 7) * 100));
  });

  it('treats hyphens, apostrophes, spaces as non-letters (skipped)', () => {
    // 'jean-pierre' letters = {j,e,a,n,p,i,r}; 'jean' = {j,e,a,n}; ∩ = 4; ∪ = 7
    expect(resonanceScore('jean-pierre', 'jean')).toBe(Math.round((4 / 7) * 100));
  });

  it('returns rounded integer', () => {
    expect(Number.isInteger(resonanceScore('paul', 'maria'))).toBe(true);
  });
});
