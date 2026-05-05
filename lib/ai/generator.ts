import type { ScoreResult } from '@/lib/scoring/types';

export interface TextGenerationResult {
  /** Async iterable of text chunks as they arrive from the model. */
  textStream: AsyncIterable<string>;
  /** Resolves with the full concatenated text once the stream completes. */
  fullText: Promise<string>;
}

export interface GenerateOptions {
  abortSignal?: AbortSignal;
}

export interface TextGenerator {
  generate(result: ScoreResult, options?: GenerateOptions): Promise<TextGenerationResult>;
}
