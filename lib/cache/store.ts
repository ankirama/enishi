import { getRedis } from './client';
import { cacheKey } from './key';
import type { SubScores } from '@/lib/scoring/types';

export interface CachedResult {
  percentage: number;
  subScores: SubScores;
  tagline: string;
  aiText: string;
  generatedAt: number;
}

const MAX_AI_TEXT_LENGTH = 5000; // chars; ~750 words, well above the 80-150 word target

export async function getCachedResult(a: string, b: string): Promise<CachedResult | null> {
  const raw = await getRedis().get(cacheKey(a, b));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedResult;
  } catch {
    return null;
  }
}

export async function setCachedResult(a: string, b: string, value: CachedResult): Promise<void> {
  if (value.aiText.length > MAX_AI_TEXT_LENGTH) {
    console.warn(
      `[cache] refusing to store oversized aiText (${value.aiText.length} chars > ${MAX_AI_TEXT_LENGTH}); skipping cache write`
    );
    return;
  }
  await getRedis().set(cacheKey(a, b), JSON.stringify(value));
}
