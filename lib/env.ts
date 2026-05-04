import { z } from 'zod';

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  REDIS_URL: z.string().regex(/^redis(s)?:\/\//, 'REDIS_URL must start with redis:// or rediss://'),
  RATE_LIMIT_PER_IP_HOURLY: z.coerce.number().int().positive().default(10),
  GLOBAL_DAILY_LIMIT: z.coerce.number().int().positive().default(500),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

let cached: Env | null = null;
export function env(): Env {
  if (!cached) cached = parseEnv();
  return cached;
}
