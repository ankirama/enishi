import type { Metadata } from 'next';
import { computeScore, InvalidNameError } from '@/lib/scoring';
import { Brand } from '@/components/shared/Brand';
import { HomeForm } from '@/components/form/HomeForm';
import { HeroSection } from '@/components/result/HeroSection';
import { ScoresSection } from '@/components/result/ScoresSection';
import { ActionsSection } from '@/components/result/ActionsSection';
import { AIText } from '@/components/result/AIText';

interface SearchParams {
  a?: string;
  b?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

function ThinDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto"
      style={{
        width: 1,
        height: 80,
        background: 'linear-gradient(180deg, transparent, var(--color-accent), transparent)',
        opacity: 0.4,
      }}
    />
  );
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { a, b } = await searchParams;
  if (!a || !b) {
    return {
      title: 'Enishi — la concordance des prénoms',
      description: 'Calcule la compatibilité poétique entre deux prénoms.',
    };
  }
  try {
    const result = computeScore(a, b);
    const title = `${result.inputs.a} & ${result.inputs.b} — ${result.percentage}% — Enishi`;
    const ogUrl = `/og?a=${encodeURIComponent(result.inputs.a)}&b=${encodeURIComponent(result.inputs.b)}`;
    return {
      title,
      description: `${result.tagline.charAt(0).toUpperCase()}${result.tagline.slice(1)} entre ${result.inputs.a} et ${result.inputs.b}.`,
      openGraph: { title, images: [{ url: ogUrl, width: 1200, height: 630 }] },
      twitter: { card: 'summary_large_image', title, images: [ogUrl] },
    };
  } catch {
    return { title: 'Enishi' };
  }
}

export default async function Page({ searchParams }: PageProps) {
  const { a, b } = await searchParams;

  if (!a || !b) {
    return (
      <main>
        <Brand />
        <HomeForm />
      </main>
    );
  }

  let result;
  try {
    result = computeScore(a, b);
  } catch (err) {
    if (err instanceof InvalidNameError) {
      return (
        <main>
          <Brand showBackLink />
          <p className="text-center mt-32 italic" style={{ fontFamily: 'var(--font-accent)' }}>
            Un des prénoms n’est pas valide. Reviens à la <a href="/" className="underline">page d’accueil</a>.
          </p>
        </main>
      );
    }
    throw err;
  }

  return (
    <main>
      <Brand showBackLink />
      <HeroSection
        a={result.inputs.a}
        b={result.inputs.b}
        percentage={result.percentage}
        tagline={result.tagline}
      />
      <ThinDivider />
      <section className="text-center" style={{ padding: '70px 40px 90px' }}>
        <div
          className="text-sm uppercase tracking-[0.25em] mb-9 italic"
          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-accent)' }}
        >
          le mot des nombres
        </div>
        <AIText a={result.inputs.a} b={result.inputs.b} />
      </section>
      <ThinDivider />
      <ScoresSection scores={result.subScores} />
      <ThinDivider />
      <ActionsSection />
    </main>
  );
}
