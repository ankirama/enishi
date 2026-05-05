import './globals.css';
import type { Metadata } from 'next';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Enishi — la concordance des prénoms',
  description: 'Calcule la compatibilité poétique entre deux prénoms.',
  metadataBase: new URL(env().NEXT_PUBLIC_SITE_URL),
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
