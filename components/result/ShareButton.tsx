'use client';
import { useState } from 'react';

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      const url = typeof window === 'undefined' ? '' : window.location.href;
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled share or clipboard blocked — silent
    }
  }

  return (
    <button
      onClick={handleClick}
      className="px-6 py-3 rounded-xl font-medium"
      style={{ background: 'var(--color-ink)', color: 'var(--color-cream)' }}
    >
      {copied ? 'Lien copié ✓' : 'Partager ce résultat ↗'}
    </button>
  );
}
