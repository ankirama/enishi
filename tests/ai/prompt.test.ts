import { describe, it, expect } from 'vitest';
import { buildPrompt } from '@/lib/ai/prompt';
import type { ScoreResult } from '@/lib/scoring/types';

const sample: ScoreResult = {
  percentage: 78,
  subScores: { resonance: 82, harmony: 71, cadence: 65, numerology: 88 },
  tagline: 'affinité affirmée',
  inputs: { a: 'Hélène', b: 'Julien' },
  normalized: { a: 'helene', b: 'julien' },
};

describe('buildPrompt', () => {
  it('uses original-case names in the user message', () => {
    const { user } = buildPrompt(sample);
    expect(user).toContain('Hélène');
    expect(user).toContain('Julien');
  });

  it('includes the percentage and the tagline', () => {
    const { user } = buildPrompt(sample);
    expect(user).toContain('78');
    expect(user).toContain('affinité affirmée');
  });

  it('includes all four sub-scores by name and value', () => {
    const { user } = buildPrompt(sample);
    expect(user).toMatch(/Résonance.*82/);
    expect(user).toMatch(/Harmonie.*71/);
    expect(user).toMatch(/Cadence.*65/);
    expect(user).toMatch(/Empreinte numérologique.*88/);
  });

  it('produces a non-empty system prompt', () => {
    const { system } = buildPrompt(sample);
    expect(system.length).toBeGreaterThan(50);
  });
});
