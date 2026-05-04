import { describe, it, expect } from 'vitest';
import { cacheKey } from '@/lib/cache/key';

describe('cacheKey', () => {
  it('is symmetric (order-independent)', () => {
    expect(cacheKey('Marie', 'Paul')).toBe(cacheKey('Paul', 'Marie'));
  });

  it('is invariant under accent and case normalization', () => {
    expect(cacheKey('Hélène', 'Julien')).toBe(cacheKey('helene', 'JULIEN'));
  });

  it('returns a hex string of 16 chars prefixed with enishi:result:', () => {
    const key = cacheKey('Marie', 'Paul');
    expect(key).toMatch(/^enishi:result:[a-f0-9]{16}$/);
  });

  it('produces different keys for different name pairs', () => {
    expect(cacheKey('Marie', 'Paul')).not.toBe(cacheKey('Marie', 'Pierre'));
  });
});
