import { describe, it, expect, beforeEach } from 'vitest';
import { checkGlobalDailyLimit } from '@/lib/ratelimit/global';
import { getRedis } from '@/lib/cache/client';

describe('checkGlobalDailyLimit', () => {
  beforeEach(async () => {
    await getRedis().flushall();
  });

  it('allows up to N then blocks across the whole site', async () => {
    for (let i = 1; i <= 3; i++) {
      const r = await checkGlobalDailyLimit(3);
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkGlobalDailyLimit(3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
