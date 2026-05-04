import { describe, it, expect, beforeEach } from 'vitest';
import { checkIpRateLimit } from '@/lib/ratelimit/ip';
import { getRedis } from '@/lib/cache/client';

describe('checkIpRateLimit', () => {
  beforeEach(async () => {
    await getRedis().flushall();
  });

  it('allows up to N requests per IP per hour and blocks the next', async () => {
    const ip = '1.2.3.4';
    for (let i = 1; i <= 5; i++) {
      const r = await checkIpRateLimit(ip, 5);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(5 - i);
    }
    const blocked = await checkIpRateLimit(ip, 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(typeof blocked.resetAt).toBe('number');
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it('isolates different IPs', async () => {
    await checkIpRateLimit('1.1.1.1', 1);
    const blocked = await checkIpRateLimit('1.1.1.1', 1);
    expect(blocked.allowed).toBe(false);

    const fresh = await checkIpRateLimit('2.2.2.2', 1);
    expect(fresh.allowed).toBe(true);
  });
});
