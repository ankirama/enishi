import { z } from 'zod';

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  REDIS_URL: z.string().regex(/^redis(s)?:\/\//, 'REDIS_URL must start with redis:// or rediss://'),
  RATE_LIMIT_PER_IP_HOURLY: z.coerce.number().int().positive().default(10),
  GLOBAL_DAILY_LIMIT: z.coerce.number().int().positive().default(500),
  TRUSTED_PROXY: z
    .string()
    .toLowerCase()
    .transform((v) => v === 'true' || v === '1' || v === 'yes')
    .default('false'),
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
let warned = false;
export function env(): Env {
  if (!cached) cached = parseEnv();
  if (!warned && !cached.TRUSTED_PROXY && process.env.NODE_ENV === 'production') {
    console.warn(
      '[enishi] TRUSTED_PROXY is false. All anonymous requests share a single rate-limit bucket. ' +
        'Set TRUSTED_PROXY=true once you have a reverse proxy (Caddy/Traefik/nginx) terminating TLS and forwarding X-Forwarded-For.'
    );
    warned = true;
  }
  return cached;
}
