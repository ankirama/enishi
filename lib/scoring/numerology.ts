const A_CODE = 'a'.charCodeAt(0);

export function letterSum(s: string): number {
  let sum = 0;
  for (const ch of s) {
    if (/[a-z]/.test(ch)) sum += ch.charCodeAt(0) - A_CODE + 1;
  }
  return sum;
}

export function digitalRoot(n: number): number {
  if (n === 0) return 9;
  const m = n % 9;
  return m === 0 ? 9 : m;
}

export function numerologyScore(a: string, b: string): number {
  const ra = digitalRoot(letterSum(a));
  const rb = digitalRoot(letterSum(b));
  const distance = Math.abs(ra - rb);
  return Math.round((1 - distance / 8) * 100);
}
