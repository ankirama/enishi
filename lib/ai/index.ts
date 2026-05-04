import { ClaudeTextGenerator } from './claude';
import type { TextGenerator } from './generator';

export type { TextGenerator, TextGenerationResult } from './generator';

let cached: TextGenerator | null = null;
export function defaultGenerator(): TextGenerator {
  if (!cached) cached = new ClaudeTextGenerator();
  return cached;
}
