import { FilRouge } from './FilRouge';

interface HeroSectionProps {
  a: string;
  b: string;
  percentage: number;
  tagline: string;
}

export function HeroSection({ a, b, percentage, tagline }: HeroSectionProps) {
  return (
    <section className="text-center px-10" style={{ padding: '90px 40px 110px' }}>
      <div
        className="text-sm tracking-[0.28em] uppercase mb-7"
        style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-accent)', fontStyle: 'italic' }}
      >
        concordance révélée
      </div>

      <div
        className="flex items-center justify-center gap-6 text-5xl md:text-6xl"
        style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
      >
        <span>{a}</span>
        <FilRouge />
        <span>{b}</span>
      </div>

      <div
        className="mt-14 leading-none tracking-tight"
        style={{ fontFamily: 'var(--font-display)', fontSize: 'min(220px, 30vw)' }}
      >
        {percentage}
        <span
          className="align-top italic ml-2"
          style={{ color: 'var(--color-accent)', fontSize: 'min(84px, 12vw)' }}
        >
          %
        </span>
      </div>

      <div
        className="mt-6 text-2xl italic"
        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-accent)' }}
      >
        {tagline}
      </div>
    </section>
  );
}
