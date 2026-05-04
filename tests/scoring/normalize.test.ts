import { describe, it, expect } from 'vitest';
import { normalize, isValidInput } from '@/lib/scoring/normalize';

describe('normalize', () => {
  it('strips diacritics', () => {
    expect(normalize('Hélène')).toBe('helene');
    expect(normalize('José')).toBe('jose');
    expect(normalize('Renée')).toBe('renee');
  });

  it('lowercases', () => {
    expect(normalize('MARIE')).toBe('marie');
    expect(normalize('Paul')).toBe('paul');
  });

  it('preserves hyphens and apostrophes', () => {
    expect(normalize('Jean-Pierre')).toBe('jean-pierre');
    expect(normalize("M'hamed")).toBe("m'hamed");
  });

  it('strips surrounding whitespace', () => {
    expect(normalize('  Anna  ')).toBe('anna');
  });
});

describe('isValidInput', () => {
  it('accepts letters with accents', () => {
    expect(isValidInput('Hélène')).toBe(true);
    expect(isValidInput('Marie')).toBe(true);
  });

  it('accepts hyphens, apostrophes, spaces', () => {
    expect(isValidInput('Jean-Pierre')).toBe(true);
    expect(isValidInput("M'hamed")).toBe(true);
    expect(isValidInput('Anna Maria')).toBe(true);
  });

  it('rejects empty after trim', () => {
    expect(isValidInput('')).toBe(false);
    expect(isValidInput('   ')).toBe(false);
  });

  it('rejects digits and symbols', () => {
    expect(isValidInput('Marie123')).toBe(false);
    expect(isValidInput('Paul!')).toBe(false);
    expect(isValidInput('@anna')).toBe(false);
  });

  it('rejects strings longer than 50 chars', () => {
    expect(isValidInput('a'.repeat(51))).toBe(false);
    expect(isValidInput('a'.repeat(50))).toBe(true);
  });
});
