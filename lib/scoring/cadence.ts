function letterCount(s: string): number {
  let n = 0;
  for (const ch of s) if (/\p{L}/u.test(ch)) n++;
  return n;
}

export function cadenceScore(a: string, b: string): number {
  const la = letterCount(a);
  const lb = letterCount(b);
  const max = Math.max(la, lb);
  if (max === 0) return 0;
  if (la === 0 || lb === 0) return 0;
  const distance = Math.abs(la - lb) / max;
  return Math.round((1 - distance) * 100);
}
