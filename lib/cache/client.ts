import Redis, { type Redis as RedisClient } from 'ioredis';
import { env } from '@/lib/env';

declare global {
  // eslint-disable-next-line no-var
  var __enishi_redis: RedisClient | undefined;
}

export function getRedis(): RedisClient {
  if (!globalThis.__enishi_redis) {
    globalThis.__enishi_redis = new Redis(env().REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });

    globalThis.__enishi_redis.on('error', (err) => {
      console.error('[redis] error', err.message);
    });
  }
  return globalThis.__enishi_redis;
}
