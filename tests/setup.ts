import { vi } from 'vitest';
import RedisMock from 'ioredis-mock';

// Replace the ioredis singleton with the in-memory mock for tests
vi.mock('@/lib/cache/client', () => {
  const client = new RedisMock();
  return { getRedis: () => client };
});

// Provide minimal env stubs so lib/env doesn't blow up if imported
process.env.ANTHROPIC_API_KEY ??= 'sk-ant-test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.SITE_URL ??= 'http://localhost:3000';
