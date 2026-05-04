import Link from 'next/link';

interface BrandProps {
  showBackLink?: boolean;
}

export function Brand({ showBackLink = false }: BrandProps) {
  return (
    <header className="flex items-center justify-between px-10 py-8">
      <Link
        href="/"
        className="text-sm font-semibold tracking-[0.14em] uppercase"
        style={{ color: 'var(--color-accent)' }}
      >
        Enishi
      </Link>
      {showBackLink ? (
        <Link href="/" className="text-sm" style={{ color: 'var(--color-muted)' }}>
          ↶ Recommencer
        </Link>
      ) : null}
    </header>
  );
}
