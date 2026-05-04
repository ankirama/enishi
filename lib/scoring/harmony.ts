const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

function vowelRatio(s: string): { ratio: number; letters: number } {
  let total = 0;
  let vowels = 0;
  for (const ch of s) {
    if (/\p{L}/u.test(ch)) {
      total++;
      if (VOWELS.has(ch)) vowels++;
    }
  }
  return { ratio: total === 0 ? 0 : vowels / total, letters: total };
}

export function harmonyScore(a: string, b: string): number {
  const ra = vowelRatio(a);
  const rb = vowelRatio(b);
  if (ra.letters === 0 || rb.letters === 0) return 0;
  const distance = Math.abs(ra.ratio - rb.ratio);
  return Math.round((1 - distance) * 100);
}
