'use client';
import { useEffect, useState } from 'react';
import { AITextSkeleton } from './AITextSkeleton';

interface AITextProps {
  a: string;
  b: string;
  initialText?: string;
}

type FetchState =
  | { kind: 'loading'; text: string }
  | { kind: 'done'; text: string }
  | { kind: 'error'; reason: 'rate_limit_ip' | 'rate_limit_global' | 'failed'; resetAt?: number };

const ERROR_COPY: Record<Extract<FetchState, { kind: 'error' }>['reason'], string> = {
  rate_limit_ip: 'Trop de destins explorés, reviens dans une heure.',
  rate_limit_global: 'Le scribe se repose ce soir, reviens demain.',
  failed: 'Le scribe est momentanément silencieux, mais les nombres parlent d’eux-mêmes.',
};

export function AIText({ a, b, initialText }: AITextProps) {
  const [state, setState] = useState<FetchState>(
    initialText !== undefined
      ? { kind: 'done', text: initialText }
      : { kind: 'loading', text: '' }
  );

  useEffect(() => {
    if (initialText !== undefined) return; // Already have the text from cache, skip fetch

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/text', {
          method: 'POST',
          body: JSON.stringify({ a, b }),
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 429) {
            const data = (await res.json().catch(() => null)) as
              | { error?: 'rate_limit_ip' | 'rate_limit_global'; resetAt?: number }
              | null;
            const reason = data?.error === 'rate_limit_global' ? 'rate_limit_global' : 'rate_limit_ip';
            setState({ kind: 'error', reason, resetAt: data?.resetAt });
            return;
          }
          setState({ kind: 'error', reason: 'failed' });
          return;
        }

        if (!res.body) {
          setState({ kind: 'error', reason: 'failed' });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setState({ kind: 'loading', text: acc });
        }
        acc += decoder.decode();
        setState({ kind: 'done', text: acc });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState({ kind: 'error', reason: 'failed' });
      }
    })();

    return () => controller.abort();
  }, [a, b, initialText]);

  if (state.kind === 'error') {
    return (
      <p
        className="max-w-2xl mx-auto text-center italic"
        style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-muted)', fontSize: 19 }}
      >
        {ERROR_COPY[state.reason]}
      </p>
    );
  }

  if (state.kind === 'loading' && state.text.length === 0) {
    return <AITextSkeleton />;
  }

  return (
    <p
      className="max-w-2xl mx-auto text-center"
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 300,
        fontSize: 21,
        lineHeight: 1.75,
        color: 'var(--color-ink-soft)',
      }}
    >
      {state.text}
    </p>
  );
}
