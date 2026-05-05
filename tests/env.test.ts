import { describe, it, expect } from 'vitest';
import { parseEnv } from '@/lib/env';

describe('parseEnv', () => {
  const baseValid = {
    ANTHROPIC_API_KEY: 'sk-ant-test',
    REDIS_URL: 'redis://localhost:6379',
    SITE_URL: 'https://enishi.fr',
  };

  it('accepts the base config and applies defaults', () => {
    const env = parseEnv(baseValid);
    expect(env.RATE_LIMIT_PER_IP_HOURLY).toBe(10);
    expect(env.GLOBAL_DAILY_LIMIT).toBe(500);
  });

  it('respects explicit numeric overrides', () => {
    const env = parseEnv({ ...baseValid, RATE_LIMIT_PER_IP_HOURLY: '25', GLOBAL_DAILY_LIMIT: '2000' });
    expect(env.RATE_LIMIT_PER_IP_HOURLY).toBe(25);
    expect(env.GLOBAL_DAILY_LIMIT).toBe(2000);
  });

  it('throws when ANTHROPIC_API_KEY is missing', () => {
    const { ANTHROPIC_API_KEY: _omit, ...rest } = baseValid;
    expect(() => parseEnv(rest)).toThrow();
  });

  it('throws when REDIS_URL is malformed', () => {
    expect(() => parseEnv({ ...baseValid, REDIS_URL: 'not-a-url' })).toThrow();
  });

  it('TRUSTED_PROXY parses booleanish strings', () => {
    expect(parseEnv({ ...baseValid, TRUSTED_PROXY: 'true' }).TRUSTED_PROXY).toBe(true);
    expect(parseEnv({ ...baseValid, TRUSTED_PROXY: '1' }).TRUSTED_PROXY).toBe(true);
    expect(parseEnv({ ...baseValid, TRUSTED_PROXY: 'no' }).TRUSTED_PROXY).toBe(false);
    expect(parseEnv(baseValid).TRUSTED_PROXY).toBe(false); // default
  });
});
