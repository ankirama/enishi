import { getRedis } from '@/lib/cache/client';

export interface RateLimitOutcome {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

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
