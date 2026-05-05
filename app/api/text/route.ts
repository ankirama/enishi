import { NextRequest } from 'next/server';
import { computeScore, InvalidNameError } from '@/lib/scoring';
import { getCachedResult, setCachedResult } from '@/lib/cache/store';
import { checkIpRateLimit, type RateLimitOutcome } from '@/lib/ratelimit/ip';
import { checkGlobalDailyLimit } from '@/lib/ratelimit/global';
import { defaultGenerator } from '@/lib/ai';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest, trustProxy: boolean): string {
  if (!trustProxy) {
    // Without a trusted proxy, XFF/X-Real-IP can be spoofed by the client.
    // Fall back to a single shared bucket so misconfigured deployments fail
    // closed (everyone shares one rate limit) instead of failing open.
    return 'no-trusted-proxy';
  }
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0];
    if (first) return first.trim();
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export async function POST(req: NextRequest) {
  let body: { a?: string; b?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { a, b } = body;
  if (typeof a !== 'string' || typeof b !== 'string') {
    return Response.json({ error: 'missing_names' }, { status: 400 });
  }

  let result;
  try {
    result = computeScore(a, b);
  } catch (err) {
    if (err instanceof InvalidNameError) {
      return Response.json({ error: 'invalid_name', which: err.which }, { status: 422 });
    }
    throw err;
  }

  // Cache hit → serve cached text immediately. If Redis is down, treat as miss.
  let cached: Awaited<ReturnType<typeof getCachedResult>> = null;
  try {
    cached = await getCachedResult(a, b);
  } catch (err) {
    console.error('[api/text] cache lookup failed, treating as miss', err);
  }
  if (cached) {
    return new Response(cached.aiText, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Enishi-Cache': 'hit' },
    });
  }

  // Cache miss → enforce rate limits before paying for an AI call.
  // If Redis is down, fail closed (503) for cost control.
  const cfg = env();
  const ip = clientIp(req, cfg.TRUSTED_PROXY);

  let ipCheck: RateLimitOutcome;
  let globalCheck: RateLimitOutcome;
  try {
    ipCheck = await checkIpRateLimit(ip, cfg.RATE_LIMIT_PER_IP_HOURLY);
    globalCheck = await checkGlobalDailyLimit(cfg.GLOBAL_DAILY_LIMIT);
  } catch (err) {
    console.error('[api/text] rate-limit check failed, refusing request', err);
    return Response.json(
      { error: 'rate_limit_unavailable' },
      { status: 503, headers: { 'Retry-After': '30' } }
    );
  }

  if (!ipCheck.allowed) {
    return Response.json(
      { error: 'rate_limit_ip', resetAt: ipCheck.resetAt },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((ipCheck.resetAt - Date.now()) / 1000)),
          'X-Enishi-Rate-Limit': 'ip',
        },
      }
    );
  }

  if (!globalCheck.allowed) {
    return Response.json(
      { error: 'rate_limit_global', resetAt: globalCheck.resetAt },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((globalCheck.resetAt - Date.now()) / 1000)),
          'X-Enishi-Rate-Limit': 'global',
        },
      }
    );
  }

  // Stream from Claude
  const generation = await defaultGenerator().generate(result, { abortSignal: req.signal });

  let buffer = '';
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of generation.textStream) {
          buffer += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
        await setCachedResult(a, b, {
          percentage: result.percentage,
          subScores: result.subScores,
          tagline: result.tagline,
          aiText: buffer,
          generatedAt: Date.now(),
        });
      } catch (err) {
        console.error('[api/text] stream error', err);
        controller.error(err);
      }
    },
  });

  return new Response(responseStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Enishi-Cache': 'miss' },
  });
}
