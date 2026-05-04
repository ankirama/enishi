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
  await getRedis().set(cacheKey(a, b), JSON.stringify(value));
}
