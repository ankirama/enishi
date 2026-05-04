import type { SubScores } from '@/lib/scoring/types';

interface ScoresSectionProps {
  scores: SubScores;
}

const LABELS: Array<{ key: keyof SubScores; label: string }> = [
  { key: 'resonance', label: 'Résonance des lettres' },
  { key: 'harmony', label: 'Harmonie vocalique' },
  { key: 'cadence', label: 'Cadence' },
  { key: 'numerology', label: 'Empreinte numérologique' },
];

export function ScoresSection({ scores }: ScoresSectionProps) {
  return (
    <section className="max-w-3xl mx-auto px-10" style={{ padding: '70px 40px 90px' }}>
      <div
        className="text-center text-sm uppercase tracking-[0.25em] mb-12 italic"
        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-accent)' }}
      >
        la décomposition
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-9">
        {LABELS.map(({ key, label }) => (
          <div key={key}>
            <div
              className="text-xs uppercase tracking-[0.12em] mb-3 font-medium"
              style={{ color: 'var(--color-muted)' }}
            >
              {label}
            </div>
            <div className="flex items-baseline gap-4">
              <div
                className="flex-1 h-[5px] rounded-full overflow-hidden"
                style={{ background: 'var(--color-accent-soft)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${scores[key]}%`, background: 'var(--color-accent)' }}
                />
              </div>
              <span
                className="text-2xl italic"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
              >
                {scores[key]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
