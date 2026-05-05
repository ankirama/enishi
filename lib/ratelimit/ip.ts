import { getRedis } from '@/lib/cache/client';

export interface RateLimitOutcome {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Per-IP rate limit using a FIXED window (not sliding).
 *
 * A user can technically burn `limit` requests at HH:59:30 and another `limit` at
 * (HH+1):00:30 — i.e., 2*limit in one minute around the boundary. For the v1 MVP
 * this is acceptable; the global daily limit (lib/ratelimit/global.ts) provides a
 * hard cost ceiling regardless. Switch to a sorted-set sliding window if burstiness
 * becomes a real problem in production.
 */
const WINDOW_SECONDS = 3600;

export async function checkIpRateLimit(ip: string, limit: number): Promise<RateLimitOutcome> {
  const redis = getRedis();
  const bucket = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `enishi:rl:ip:${ip}:${bucket}`;
  const resetAt = (bucket + 1) * WINDOW_SECONDS * 1000;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  return { allowed: true, remaining: limit - count, resetAt };
}
