import { createHash } from 'node:crypto';
import { normalize } from '@/lib/scoring/normalize';

export function cacheKey(a: string, b: string): string {
  const pair = [normalize(a), normalize(b)].sort();
  const hash = createHash('sha256').update(pair.join('|')).digest('hex').slice(0, 16);
  return `enishi:result:${hash}`;
}
