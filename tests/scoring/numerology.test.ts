import { describe, it, expect } from 'vitest';
import { digitalRoot, letterSum, numerologyScore } from '@/lib/scoring/numerology';

describe('digitalRoot', () => {
  it('returns single digit for any positive integer', () => {
    expect(digitalRoot(1)).toBe(1);
    expect(digitalRoot(9)).toBe(9);
    expect(digitalRoot(10)).toBe(1);
    expect(digitalRoot(38)).toBe(2);
    expect(digitalRoot(99)).toBe(9);
  });

  it('returns 9 for 0 (numerology convention)', () => {
    expect(digitalRoot(0)).toBe(9);
  });
});

describe('letterSum (A=1...Z=26)', () => {
  it('sums alphabet positions of letters only', () => {
    expect(letterSum('paul')).toBe(50);
    expect(letterSum('a')).toBe(1);
    expect(letterSum('z')).toBe(26);
  });

  it('skips non-letters', () => {
    expect(letterSum('jean-pierre')).toBe(letterSum('jeanpierre'));
  });

  it('returns 0 for empty input', () => {
    expect(letterSum('')).toBe(0);
  });
});

describe('numerologyScore', () => {
  it('is 100 when both digital roots are equal', () => {
    expect(numerologyScore('a', 'j')).toBe(100);
  });

  it('decreases with distance between digital roots (max 8)', () => {
    expect(numerologyScore('a', 'i')).toBe(0);
  });

  it('returns rounded integer', () => {
    expect(Number.isInteger(numerologyScore('paul', 'maria'))).toBe(true);
  });

  it('is symmetric', () => {
    expect(numerologyScore('paul', 'maria')).toBe(numerologyScore('maria', 'paul'));
  });
});
