import { getRedis } from '@/lib/cache/client';
import type { RateLimitOutcome } from './ip';

const DAY_SECONDS = 86_400;

function todayKey(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `enishi:rl:global:${yyyy}-${mm}-${dd}`;
}

function tomorrowMidnightUtc(): number {
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return t.getTime();
}

export async function checkGlobalDailyLimit(limit: number): Promise<RateLimitOutcome> {
  const redis = getRedis();
  const key = todayKey();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, DAY_SECONDS);
  }
  const resetAt = tomorrowMidnightUtc();
  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  return { allowed: true, remaining: limit - count, resetAt };
}
