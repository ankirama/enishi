function letterSet(s: string): Set<string> {
  const out = new Set<string>();
  for (const ch of s) {
    if (/\p{L}/u.test(ch)) out.add(ch);
  }
  return out;
}

export function resonanceScore(a: string, b: string): number {
  const A = letterSet(a);
  const B = letterSet(b);
  if (A.size === 0 && B.size === 0) return 100;

  const intersection = new Set<string>();
  for (const ch of A) if (B.has(ch)) intersection.add(ch);

  const union = new Set<string>([...A, ...B]);
  if (union.size === 0) return 0;

  return Math.round((intersection.size / union.size) * 100);
}
