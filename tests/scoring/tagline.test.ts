import { describe, it, expect } from 'vitest';
import { tagline } from '@/lib/scoring/tagline';

describe('tagline', () => {
  it('returns the right band per spec', () => {
    expect(tagline(0)).toBe('écho lointain');
    expect(tagline(15)).toBe('écho lointain');
    expect(tagline(29)).toBe('écho lointain');
    expect(tagline(30)).toBe('affinité naissante');
    expect(tagline(49)).toBe('affinité naissante');
    expect(tagline(50)).toBe('concordance discrète');
    expect(tagline(69)).toBe('concordance discrète');
    expect(tagline(70)).toBe('affinité affirmée');
    expect(tagline(84)).toBe('affinité affirmée');
    expect(tagline(85)).toBe('résonance forte');
    expect(tagline(94)).toBe('résonance forte');
    expect(tagline(95)).toBe('harmonie rare');
    expect(tagline(100)).toBe('harmonie rare');
  });
});
