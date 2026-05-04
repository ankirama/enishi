import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { buildPrompt } from './prompt';
import type { TextGenerator, TextGenerationResult } from './generator';
import type { ScoreResult } from '@/lib/scoring/types';

const MODEL_ID = 'claude-haiku-4-5-20251001';

export class ClaudeTextGenerator implements TextGenerator {
  async generate(result: ScoreResult): Promise<TextGenerationResult> {
    const { system, user } = buildPrompt(result);

    const stream = streamText({
      model: anthropic(MODEL_ID),
      system,
      prompt: user,
      maxTokens: 350,
      temperature: 0.85,
    });

    return {
      textStream: stream.textStream,
      fullText: stream.text,
    };
  }
}
