import { describe, it, expect, beforeEach } from 'vitest';
import { getCachedResult, setCachedResult } from '@/lib/cache/store';
import { getRedis } from '@/lib/cache/client';

const sample = {
  percentage: 78,
  subScores: { resonance: 82, harmony: 71, cadence: 65, numerology: 88 },
  tagline: 'affinité affirmée',
  aiText: 'Texte poétique de test...',
  generatedAt: 1700000000000,
};

describe('cache store', () => {
  beforeEach(async () => {
    await getRedis().flushall();
  });

  it('returns null on miss', async () => {
    expect(await getCachedResult('Marie', 'Paul')).toBeNull();
  });

  it('round-trips a result', async () => {
    await setCachedResult('Marie', 'Paul', sample);
    const got = await getCachedResult('Marie', 'Paul');
    expect(got).toEqual(sample);
  });

  it('is order-insensitive', async () => {
    await setCachedResult('Marie', 'Paul', sample);
    expect(await getCachedResult('Paul', 'Marie')).toEqual(sample);
  });

  it('refuses to cache oversized aiText (>5000 chars)', async () => {
    const oversized = { ...sample, aiText: 'a'.repeat(5001) };
    await setCachedResult('Marie', 'Paul', oversized);
    expect(await getCachedResult('Marie', 'Paul')).toBeNull();
  });
});
