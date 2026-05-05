import './globals.css';
import type { Metadata } from 'next';

// Module-level metadata runs at build time too; we can't call env() here
// (that would force ANTHROPIC_API_KEY/REDIS_URL to be set during `next build`).
// SITE_URL (no NEXT_PUBLIC_ prefix) is read at server runtime, NOT inlined at build —
// so the same image works for any deployment URL. Fallback to localhost is harmless.
export const metadata: Metadata = {
  title: 'Enishi — la concordance des prénoms',
  description: 'Calcule la compatibilité poétique entre deux prénoms.',
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
