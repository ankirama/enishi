export function tagline(percentage: number): string {
  if (percentage <= 29) return 'écho lointain';
  if (percentage <= 49) return 'affinité naissante';
  if (percentage <= 69) return 'concordance discrète';
  if (percentage <= 84) return 'affinité affirmée';
  if (percentage <= 94) return 'résonance forte';
  return 'harmonie rare';
}
