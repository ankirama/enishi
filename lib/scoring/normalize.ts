const VALID_CHARS = /^[\p{L}\s\-']+$/u;

export function isValidInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 50) return false;
  return VALID_CHARS.test(trimmed);
}

export function normalize(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
