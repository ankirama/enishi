# Enishi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `enishi.fr` — a single-page web app that computes a deterministic compatibility score between two French first names and renders a streamed, AI-generated poetic explanation. Self-hosted via Docker Compose.

**Architecture:** Next.js 15 App Router with React Server Components for instant math rendering, plus a small client component that consumes a streaming `/api/text` route for the AI text (true token-by-token typewriter effect). Redis (self-hosted in compose) for both result caching and rate limiting. Anthropic Claude Haiku 4.5 via the Vercel AI SDK.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind v4, Vitest (unit), Playwright (E2E), `ai` + `@ai-sdk/anthropic` (streaming), `ioredis` (cache + rate limit), `zod` (env validation), Docker + Docker Compose.

---

## Spec Reference

This plan implements the design spec at [`docs/superpowers/specs/2026-05-05-enishi-design.md`](../specs/2026-05-05-enishi-design.md). When in doubt about a behavior, the spec is authoritative.

## File Structure

The plan creates the following layout. Each file has one clear responsibility; tests live alongside the module they test.

```
enishi/
├── app/
│   ├── layout.tsx                           # fonts, base metadata
│   ├── page.tsx                             # form OR result based on searchParams
│   ├── globals.css                          # Tailwind + design tokens
│   ├── api/text/route.ts                    # POST → cache → Claude streaming
│   └── og/route.tsx                         # dynamic 1200×630 OG image
├── components/
│   ├── shared/Brand.tsx                     # Enishi wordmark + back link
│   ├── form/HomeForm.tsx                    # client form, validation, navigation
│   ├── form/NameInput.tsx                   # one input with sanitization
│   ├── form/SubmitButton.tsx                # disabled state aware
│   └── result/
│       ├── HeroSection.tsx                  # %, names, tagline, fil rouge
│       ├── ScoresSection.tsx                # 4 sub-scores with bars
│       ├── ActionsSection.tsx               # share + new pair
│       ├── ShareButton.tsx                  # client, copies link
│       ├── FilRouge.tsx                     # animated red thread
│       ├── AIText.tsx                       # client, streams from /api/text
│       └── AITextSkeleton.tsx               # placeholder during stream
├── lib/
│   ├── env.ts                               # zod-validated process.env
│   ├── scoring/
│   │   ├── normalize.ts                     # NFD + diacritics strip
│   │   ├── jaccard.ts                       # résonance des lettres
│   │   ├── harmony.ts                       # harmonie vocalique
│   │   ├── cadence.ts                       # proximité de longueur
│   │   ├── numerology.ts                    # racine numérique
│   │   ├── tagline.ts                       # qualitative label
│   │   ├── aggregate.ts                     # weighted final score
│   │   ├── types.ts                         # shared types
│   │   └── index.ts                         # public computeScore() API
│   ├── ai/
│   │   ├── prompt.ts                        # builds the Claude prompt
│   │   ├── generator.ts                     # TextGenerator interface
│   │   ├── claude.ts                        # Claude implementation via AI SDK
│   │   └── index.ts                         # default singleton
│   ├── cache/
│   │   ├── client.ts                        # ioredis singleton
│   │   ├── key.ts                           # SHA-256 of sorted normalized names
│   │   └── store.ts                         # typed get/set of CachedResult
│   ├── ratelimit/
│   │   ├── ip.ts                            # per-IP hourly window
│   │   └── global.ts                        # global daily counter
│   └── og/image.tsx                         # Satori-renderable OG component
├── tests/
│   ├── scoring/                             # one .test.ts per scoring module
│   ├── cache/                               # key + store tests
│   ├── ratelimit/                           # ip + global tests
│   └── e2e/flow.spec.ts                     # Playwright happy path
├── docker/
│   ├── Dockerfile                           # multi-stage with Next.js standalone
│   └── docker-compose.yml                   # app + redis with persistent volume
├── .env.example
├── .gitignore
├── .dockerignore
├── next.config.ts                           # output: 'standalone'
├── tsconfig.json
├── postcss.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── package.json
└── README.md
```

---

## Phase 0 — Repo bootstrap

### Task 0: Initialize git and feature branch

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Confirm CWD and current state**

```bash
pwd
ls -la
```

Expected: empty project directory at `names_compatibility/`.

- [ ] **Step 2: Initialize git on `main`**

```bash
git init -b main
git status
```

Expected: empty repo on `main`, untracked `docs/` and `.superpowers/` visible.

- [ ] **Step 3: Create `.gitignore`**

Write `.gitignore`:

```gitignore
# dependencies
node_modules/
.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions

# testing
coverage/
playwright-report/
test-results/
.vitest-cache/

# next.js
.next/
out/
build/
next-env.d.ts

# production
*.tsbuildinfo

# env files
.env
.env*.local

# brainstorm artefacts
.superpowers/

# misc
.DS_Store
*.pem
.idea/
.vscode/
```

- [ ] **Step 4: First commit (spec + ignore)**

```bash
git add .gitignore docs/
git commit -m "chore: initialize repo with design spec"
```

- [ ] **Step 5: Create feature branch**

```bash
git checkout -b feat/enishi-mvp
git status
```

Expected: clean working tree on `feat/enishi-mvp`.

---

## Phase 1 — Project scaffold

### Task 1: Bootstrap Next.js 15 + TypeScript

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`

- [ ] **Step 1: Run create-next-app non-interactively**

```bash
npx create-next-app@latest . \
  --typescript --tailwind --app --no-src-dir \
  --import-alias "@/*" --no-eslint --use-npm --turbopack --yes
```

Expected: scaffold installed, `node_modules/` populated, default `app/page.tsx` exists.

- [ ] **Step 2: Verify dev server boots**

```bash
npm run dev &
SERVER_PID=$!
sleep 8
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
kill $SERVER_PID
```

Expected: `200`. Then `wait` to ensure the process exits.

- [ ] **Step 3: Configure `next.config.ts` for standalone output**

Replace `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@ai-sdk/react', 'ioredis'],
  },
  async headers() {
    return [
      {
        source: '/og',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Tighten `tsconfig.json` to strict mode**

In `tsconfig.json`, ensure `compilerOptions` contains:

```json
"strict": true,
"noUncheckedIndexedAccess": true,
"noImplicitOverride": true,
"forceConsistentCasingInFileNames": true
```

- [ ] **Step 5: Commit scaffold**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 with TypeScript strict and standalone output"
```

---

### Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install streaming, AI, cache, env packages**

```bash
npm install ai@^4 @ai-sdk/anthropic@^1 @ai-sdk/react@^1 ioredis@^5 zod@^3
```

- [ ] **Step 2: Install dev tooling**

```bash
npm install -D vitest@^2 @vitest/ui@^2 @playwright/test@^1 @types/node \
  ioredis-mock@^8 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6
```

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install --with-deps chromium
```

Expected: chromium downloaded.

- [ ] **Step 4: Add scripts to `package.json`**

In `package.json`'s `"scripts"`, replace with:

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 5: Verify install + typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install ai-sdk, ioredis, zod, vitest, playwright"
```

---

### Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 2: Create empty `tests/setup.ts`**

```ts
// Reserved for global test setup (Redis mock, env stubs, etc.)
```

- [ ] **Step 3: Smoke test — write a sanity test**

Create `tests/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run it**

```bash
npm test
```

Expected: 1 passed.

- [ ] **Step 5: Delete sanity test**

```bash
rm tests/sanity.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json
git commit -m "chore: configure vitest with @ alias and node env"
```

---

### Task 4: Configure Tailwind v4 with design tokens

**Files:**
- Modify: `app/globals.css`, `postcss.config.mjs`

- [ ] **Step 1: Verify create-next-app installed Tailwind v4**

```bash
npm ls tailwindcss
```

Expected: a `4.x` version. If a `3.x` version is present, run:

```bash
npm uninstall tailwindcss
npm install -D tailwindcss@^4 @tailwindcss/postcss@^4
```

And ensure `postcss.config.mjs` reads:

```js
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
```

- [ ] **Step 2: Replace `app/globals.css` with the design tokens**

```css
@import "tailwindcss";

@theme {
  --font-display: 'DM Serif Display', 'Georgia', serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-accent: 'Cormorant Garamond', 'Times New Roman', serif;

  --color-cream: #FBF5F2;
  --color-blush: #F5E6E1;
  --color-ink: #2b2733;
  --color-ink-soft: #4a4452;
  --color-muted: #9b8590;
  --color-accent: #b56a7a;
  --color-accent-soft: rgba(181, 106, 122, 0.18);
}

html, body { background: var(--color-cream); color: var(--color-ink); }

body {
  font-family: var(--font-body);
  background: linear-gradient(180deg, var(--color-cream) 0%, var(--color-blush) 60%, var(--color-cream) 100%);
  background-attachment: fixed;
  min-height: 100vh;
}

::selection { background: var(--color-accent); color: var(--color-cream); }

/* Skeleton fade animation for AI text loading */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.65; }
}
.skeleton-line {
  background: var(--color-accent-soft);
  border-radius: 4px;
  animation: skeleton-pulse 1.6s ease-in-out infinite;
}

/* Fil rouge stroke draw animation */
@keyframes draw-thread {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}
.fil-rouge-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: draw-thread 800ms cubic-bezier(0.4, 0, 0.2, 1) 200ms forwards;
}
```

- [ ] **Step 3: Add Google Fonts import in `app/layout.tsx`**

Replace `app/layout.tsx`:

```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enishi — la concordance des prénoms',
  description: 'Calcule la compatibilité poétique entre deux prénoms.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
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
```

- [ ] **Step 4: Verify dev server still boots and styles load**

```bash
npm run dev &
SERVER_PID=$!
sleep 8
curl -s http://localhost:3000 | grep -q "DM+Serif+Display" && echo "fonts linked" || echo "MISSING"
kill $SERVER_PID
```

Expected: `fonts linked`.

- [ ] **Step 5: Replace default `app/page.tsx` with placeholder**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-2xl" style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic' }}>
        Enishi — bientôt.
      </p>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/ postcss.config.mjs package.json package-lock.json
git commit -m "feat(ui): apply Enishi design tokens, fonts, and placeholder home"
```

---

## Phase 2 — Scoring (TDD)

All scoring modules are pure functions. Each task: write failing test → implement → green → commit. No I/O, no dependencies between modules at this phase.

### Task 5: `lib/scoring/types.ts`

**Files:**
- Create: `lib/scoring/types.ts`

- [ ] **Step 1: Write the types**

```ts
export type SubScoreKey = 'resonance' | 'harmony' | 'cadence' | 'numerology';

export interface SubScores {
  resonance: number;   // 0-100
  harmony: number;     // 0-100
  cadence: number;     // 0-100
  numerology: number;  // 0-100
}

export interface ScoreResult {
  percentage: number;       // 0-100, integer
  subScores: SubScores;
  tagline: string;
  inputs: { a: string; b: string };          // raw inputs as provided
  normalized: { a: string; b: string };      // post-normalization
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add lib/scoring/types.ts
git commit -m "feat(scoring): define ScoreResult and SubScores types"
```

---

### Task 6: `lib/scoring/normalize.ts`

**Files:**
- Create: `tests/scoring/normalize.test.ts`, `lib/scoring/normalize.ts`

- [ ] **Step 1: Write the failing test**

`tests/scoring/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalize, isValidInput } from '@/lib/scoring/normalize';

describe('normalize', () => {
  it('strips diacritics', () => {
    expect(normalize('Hélène')).toBe('helene');
    expect(normalize('José')).toBe('jose');
    expect(normalize('Renée')).toBe('renee');
  });

  it('lowercases', () => {
    expect(normalize('MARIE')).toBe('marie');
    expect(normalize('Paul')).toBe('paul');
  });

  it('preserves hyphens and apostrophes', () => {
    expect(normalize('Jean-Pierre')).toBe('jean-pierre');
    expect(normalize("M'hamed")).toBe("m'hamed");
  });

  it('strips surrounding whitespace', () => {
    expect(normalize('  Anna  ')).toBe('anna');
  });
});

describe('isValidInput', () => {
  it('accepts letters with accents', () => {
    expect(isValidInput('Hélène')).toBe(true);
    expect(isValidInput('Marie')).toBe(true);
  });

  it('accepts hyphens, apostrophes, spaces', () => {
    expect(isValidInput('Jean-Pierre')).toBe(true);
    expect(isValidInput("M'hamed")).toBe(true);
    expect(isValidInput('Anna Maria')).toBe(true);
  });

  it('rejects empty after trim', () => {
    expect(isValidInput('')).toBe(false);
    expect(isValidInput('   ')).toBe(false);
  });

  it('rejects digits and symbols', () => {
    expect(isValidInput('Marie123')).toBe(false);
    expect(isValidInput('Paul!')).toBe(false);
    expect(isValidInput('@anna')).toBe(false);
  });

  it('rejects strings longer than 50 chars', () => {
    expect(isValidInput('a'.repeat(51))).toBe(false);
    expect(isValidInput('a'.repeat(50))).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify failure**

```bash
npm test -- tests/scoring/normalize.test.ts
```

Expected: failures (module not found).

- [ ] **Step 3: Implement**

`lib/scoring/normalize.ts`:

```ts
const VALID_CHARS = /^[\p{L}\s\-']+$/u;

export function isValidInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 50) return false;
  return VALID_CHARS.test(trimmed);
}

export function normalize(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test -- tests/scoring/normalize.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/scoring/normalize.ts tests/scoring/normalize.test.ts
git commit -m "feat(scoring): normalize names with NFD diacritic strip and validate input"
```

---

### Task 7: `lib/scoring/jaccard.ts` (résonance)

**Files:**
- Create: `tests/scoring/jaccard.test.ts`, `lib/scoring/jaccard.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { resonanceScore } from '@/lib/scoring/jaccard';

describe('resonanceScore (Jaccard on letter sets)', () => {
  it('is 100 for identical names', () => {
    expect(resonanceScore('marie', 'marie')).toBe(100);
  });

  it('is 0 for fully disjoint letter sets', () => {
    // letters of 'abc' = {a,b,c}; 'xyz' = {x,y,z}; intersection = 0
    expect(resonanceScore('abc', 'xyz')).toBe(0);
  });

  it('computes Jaccard correctly on a known case', () => {
    // 'paul' = {p,a,u,l}; 'maria' = {m,a,r,i}; ∩ = {a} (1); ∪ = 7 → 1/7 ≈ 14.286
    expect(resonanceScore('paul', 'maria')).toBe(Math.round((1 / 7) * 100));
  });

  it('treats hyphens, apostrophes, spaces as non-letters (skipped)', () => {
    // Only count actual letters
    expect(resonanceScore('jean-pierre', 'jean')).toBe(
      // 'jean-pierre' letters = {j,e,a,n,p,i,r}; 'jean' = {j,e,a,n}; ∩ = 4; ∪ = 7
      Math.round((4 / 7) * 100)
    );
  });

  it('returns rounded integer', () => {
    expect(Number.isInteger(resonanceScore('paul', 'maria'))).toBe(true);
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/scoring/jaccard.test.ts
```

Expected: failures.

- [ ] **Step 3: Implement**

`lib/scoring/jaccard.ts`:

```ts
function letterSet(s: string): Set<string> {
  const out = new Set<string>();
  for (const ch of s) {
    if (/\p{L}/u.test(ch)) out.add(ch);
  }
  return out;
}

export function resonanceScore(a: string, b: string): number {
  const A = letterSet(a);
  const B = letterSet(b);
  if (A.size === 0 && B.size === 0) return 100;

  const intersection = new Set<string>();
  for (const ch of A) if (B.has(ch)) intersection.add(ch);

  const union = new Set<string>([...A, ...B]);
  if (union.size === 0) return 0;

  return Math.round((intersection.size / union.size) * 100);
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/scoring/jaccard.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/scoring/jaccard.ts tests/scoring/jaccard.test.ts
git commit -m "feat(scoring): add resonance score via Jaccard on letter sets"
```

---

### Task 8: `lib/scoring/harmony.ts` (harmonie vocalique)

**Files:**
- Create: `tests/scoring/harmony.test.ts`, `lib/scoring/harmony.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { harmonyScore } from '@/lib/scoring/harmony';

describe('harmonyScore (vowel-ratio proximity)', () => {
  it('is 100 when both have identical vowel ratios', () => {
    // 'paul' (4 letters, 2 vowels [a,u] => 0.5) vs 'sara' (4 letters, 2 vowels [a,a] => 0.5)
    expect(harmonyScore('paul', 'sara')).toBe(100);
  });

  it('is 0 when one has only vowels and the other has only consonants', () => {
    expect(harmonyScore('aeio', 'bcdf')).toBe(0);
  });

  it('counts y as vowel', () => {
    // 'yves' (4 letters, vowels [y,e] => 0.5) vs 'paul' (0.5)
    expect(harmonyScore('yves', 'paul')).toBe(100);
  });

  it('ignores hyphens and apostrophes for letter count', () => {
    // 'jean-pierre' letters = j,e,a,n,p,i,e,r,r,e → 10 letters, 5 vowels (e,a,i,e,e) → 0.5
    // 'paul' → 0.5 → 100
    expect(harmonyScore('jean-pierre', 'paul')).toBe(100);
  });

  it('returns 0 when both names contain no letters', () => {
    expect(harmonyScore('---', "'")).toBe(0);
  });

  it('returns rounded integer', () => {
    expect(Number.isInteger(harmonyScore('marie', 'paul'))).toBe(true);
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/scoring/harmony.test.ts
```

- [ ] **Step 3: Implement**

`lib/scoring/harmony.ts`:

```ts
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

function vowelRatio(s: string): { ratio: number; letters: number } {
  let total = 0;
  let vowels = 0;
  for (const ch of s) {
    if (/\p{L}/u.test(ch)) {
      total++;
      if (VOWELS.has(ch)) vowels++;
    }
  }
  return { ratio: total === 0 ? 0 : vowels / total, letters: total };
}

export function harmonyScore(a: string, b: string): number {
  const ra = vowelRatio(a);
  const rb = vowelRatio(b);
  if (ra.letters === 0 || rb.letters === 0) return 0;
  const distance = Math.abs(ra.ratio - rb.ratio); // 0..1
  return Math.round((1 - distance) * 100);
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/scoring/harmony.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/scoring/harmony.ts tests/scoring/harmony.test.ts
git commit -m "feat(scoring): add harmony score from vowel-ratio proximity"
```

---

### Task 9: `lib/scoring/cadence.ts`

**Files:**
- Create: `tests/scoring/cadence.test.ts`, `lib/scoring/cadence.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { cadenceScore } from '@/lib/scoring/cadence';

describe('cadenceScore (length proximity)', () => {
  it('is 100 for equal-length names', () => {
    expect(cadenceScore('paul', 'mary')).toBe(100); // both 4 letters
  });

  it('decreases with length difference', () => {
    // 'bo' (2) vs 'maximilien' (10): diff 8 / max 10 = 0.8 → 20
    expect(cadenceScore('bo', 'maximilien')).toBe(20);
  });

  it('counts only letters (no hyphens, no apostrophes)', () => {
    // 'jean-pierre' = 10 letters; 'samantha' = 8; diff 2 / 10 = 0.2 → 80
    expect(cadenceScore('jean-pierre', 'samantha')).toBe(80);
  });

  it('returns 0 if both have zero letters', () => {
    expect(cadenceScore('-', "'")).toBe(0);
  });

  it('returns 0 if one has zero letters', () => {
    expect(cadenceScore('marie', "-")).toBe(0);
  });

  it('returns rounded integer', () => {
    expect(Number.isInteger(cadenceScore('bo', 'maximilien'))).toBe(true);
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/scoring/cadence.test.ts
```

- [ ] **Step 3: Implement**

`lib/scoring/cadence.ts`:

```ts
function letterCount(s: string): number {
  let n = 0;
  for (const ch of s) if (/\p{L}/u.test(ch)) n++;
  return n;
}

export function cadenceScore(a: string, b: string): number {
  const la = letterCount(a);
  const lb = letterCount(b);
  const max = Math.max(la, lb);
  if (max === 0) return 0;
  if (la === 0 || lb === 0) return 0;
  const distance = Math.abs(la - lb) / max; // 0..1
  return Math.round((1 - distance) * 100);
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/scoring/cadence.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/scoring/cadence.ts tests/scoring/cadence.test.ts
git commit -m "feat(scoring): add cadence score from letter-length proximity"
```

---

### Task 10: `lib/scoring/numerology.ts`

**Files:**
- Create: `tests/scoring/numerology.test.ts`, `lib/scoring/numerology.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { digitalRoot, letterSum, numerologyScore } from '@/lib/scoring/numerology';

describe('digitalRoot', () => {
  it('returns single digit for any positive integer', () => {
    expect(digitalRoot(1)).toBe(1);
    expect(digitalRoot(9)).toBe(9);
    expect(digitalRoot(10)).toBe(1);
    expect(digitalRoot(38)).toBe(2); // 3+8=11 → 1+1=2
    expect(digitalRoot(99)).toBe(9); // 9+9=18 → 1+8=9
  });

  it('returns 9 for 0 (numerology convention)', () => {
    expect(digitalRoot(0)).toBe(9);
  });
});

describe('letterSum (A=1...Z=26)', () => {
  it('sums alphabet positions of letters only', () => {
    // 'paul' = 16+1+21+12 = 50
    expect(letterSum('paul')).toBe(50);
    // 'a' = 1, 'z' = 26
    expect(letterSum('a')).toBe(1);
    expect(letterSum('z')).toBe(26);
  });

  it('skips non-letters', () => {
    expect(letterSum('jean-pierre')).toBe(letterSum('jeanpierre'));
  });

  it('returns 0 for empty input', () => {
    expect(letterSum('')).toBe(0);
  });
});

describe('numerologyScore', () => {
  it('is 100 when both digital roots are equal', () => {
    // 'paul' (50 → 5) vs 'mary' (13+1+18+25=57 → 12 → 3): different
    // For equal: 'paul' (root 5) vs 'a' (1) ... need a name pair with same root
    // 'a'(1) vs 'j'(10→1) → both root 1 → distance 0 → 100
    expect(numerologyScore('a', 'j')).toBe(100);
  });

  it('decreases with distance between digital roots (max 8)', () => {
    // root 1 vs root 9 → distance 8 → score 0
    expect(numerologyScore('a', 'i')).toBe(0); // 'a' = 1, 'i' = 9
  });

  it('returns rounded integer', () => {
    expect(Number.isInteger(numerologyScore('paul', 'maria'))).toBe(true);
  });

  it('is symmetric', () => {
    expect(numerologyScore('paul', 'maria')).toBe(numerologyScore('maria', 'paul'));
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/scoring/numerology.test.ts
```

- [ ] **Step 3: Implement**

`lib/scoring/numerology.ts`:

```ts
const A_CODE = 'a'.charCodeAt(0);

export function letterSum(s: string): number {
  let sum = 0;
  for (const ch of s) {
    if (/[a-z]/.test(ch)) sum += ch.charCodeAt(0) - A_CODE + 1;
  }
  return sum;
}

export function digitalRoot(n: number): number {
  if (n === 0) return 9;
  const m = n % 9;
  return m === 0 ? 9 : m;
}

export function numerologyScore(a: string, b: string): number {
  const ra = digitalRoot(letterSum(a));
  const rb = digitalRoot(letterSum(b));
  const distance = Math.abs(ra - rb); // 0..8
  return Math.round((1 - distance / 8) * 100);
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/scoring/numerology.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/scoring/numerology.ts tests/scoring/numerology.test.ts
git commit -m "feat(scoring): add numerology score with digital root reduction"
```

---

### Task 11: `lib/scoring/tagline.ts`

**Files:**
- Create: `tests/scoring/tagline.test.ts`, `lib/scoring/tagline.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { tagline } from '@/lib/scoring/tagline';

describe('tagline', () => {
  it('returns the right band per spec', () => {
    expect(tagline(0)).toBe('écho lointain');
    expect(tagline(15)).toBe('écho lointain');
    expect(tagline(29)).toBe('écho lointain');
    expect(tagline(30)).toBe('affinité naissante');
    expect(tagline(49)).toBe('affinité naissante');
    expect(tagline(50)).toBe('concordance discrète');
    expect(tagline(69)).toBe('concordance discrète');
    expect(tagline(70)).toBe('affinité affirmée');
    expect(tagline(84)).toBe('affinité affirmée');
    expect(tagline(85)).toBe('résonance forte');
    expect(tagline(94)).toBe('résonance forte');
    expect(tagline(95)).toBe('harmonie rare');
    expect(tagline(100)).toBe('harmonie rare');
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/scoring/tagline.test.ts
```

- [ ] **Step 3: Implement**

`lib/scoring/tagline.ts`:

```ts
export function tagline(percentage: number): string {
  if (percentage <= 29) return 'écho lointain';
  if (percentage <= 49) return 'affinité naissante';
  if (percentage <= 69) return 'concordance discrète';
  if (percentage <= 84) return 'affinité affirmée';
  if (percentage <= 94) return 'résonance forte';
  return 'harmonie rare';
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/scoring/tagline.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/scoring/tagline.ts tests/scoring/tagline.test.ts
git commit -m "feat(scoring): add qualitative tagline from percentage band"
```

---

### Task 12: `lib/scoring/aggregate.ts` and public API

**Files:**
- Create: `tests/scoring/aggregate.test.ts`, `lib/scoring/aggregate.ts`, `lib/scoring/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { aggregate } from '@/lib/scoring/aggregate';
import { computeScore } from '@/lib/scoring';

describe('aggregate', () => {
  it('applies weights 0.35/0.25/0.20/0.20 and rounds', () => {
    const result = aggregate({ resonance: 100, harmony: 100, cadence: 100, numerology: 100 });
    expect(result).toBe(100);
  });

  it('respects weighting (resonance dominates)', () => {
    // resonance=100, others=0 → 0.35 * 100 = 35
    expect(aggregate({ resonance: 100, harmony: 0, cadence: 0, numerology: 0 })).toBe(35);
    // harmony=100, others=0 → 0.25 * 100 = 25
    expect(aggregate({ resonance: 0, harmony: 100, cadence: 0, numerology: 0 })).toBe(25);
    // cadence=100 → 20
    expect(aggregate({ resonance: 0, harmony: 0, cadence: 100, numerology: 0 })).toBe(20);
    // numerology=100 → 20
    expect(aggregate({ resonance: 0, harmony: 0, cadence: 0, numerology: 100 })).toBe(20);
  });

  it('returns integer in [0, 100]', () => {
    const r = aggregate({ resonance: 73, harmony: 51, cadence: 88, numerology: 12 });
    expect(Number.isInteger(r)).toBe(true);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
  });
});

describe('computeScore (public API)', () => {
  it('returns deterministic result for the same inputs', () => {
    const r1 = computeScore('Hélène', 'Julien');
    const r2 = computeScore('Hélène', 'Julien');
    expect(r1).toEqual(r2);
  });

  it('is invariant to accent normalization', () => {
    const r1 = computeScore('Hélène', 'Julien');
    const r2 = computeScore('Helene', 'Julien');
    expect(r1.percentage).toBe(r2.percentage);
    expect(r1.subScores).toEqual(r2.subScores);
  });

  it('is symmetric on percentage and subScores', () => {
    const r1 = computeScore('Marie', 'Paul');
    const r2 = computeScore('Paul', 'Marie');
    expect(r1.percentage).toBe(r2.percentage);
    expect(r1.subScores).toEqual(r2.subScores);
  });

  it('throws on invalid input', () => {
    expect(() => computeScore('Marie123', 'Paul')).toThrow();
    expect(() => computeScore('', 'Paul')).toThrow();
    expect(() => computeScore('Marie', 'a'.repeat(51))).toThrow();
  });

  it('preserves the original inputs in the result', () => {
    const r = computeScore('Hélène', 'Julien');
    expect(r.inputs).toEqual({ a: 'Hélène', b: 'Julien' });
    expect(r.normalized).toEqual({ a: 'helene', b: 'julien' });
  });

  it('produces a tagline matching the percentage', () => {
    const r = computeScore('Marie', 'Marie');
    expect(r.percentage).toBeGreaterThanOrEqual(95);
    expect(r.tagline).toBe('harmonie rare');
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/scoring/aggregate.test.ts
```

- [ ] **Step 3: Implement aggregate**

`lib/scoring/aggregate.ts`:

```ts
import type { SubScores } from './types';

const WEIGHTS = {
  resonance: 0.35,
  harmony: 0.25,
  cadence: 0.20,
  numerology: 0.20,
} as const;

export function aggregate(s: SubScores): number {
  const v =
    WEIGHTS.resonance * s.resonance +
    WEIGHTS.harmony * s.harmony +
    WEIGHTS.cadence * s.cadence +
    WEIGHTS.numerology * s.numerology;
  return Math.round(v);
}
```

- [ ] **Step 4: Implement public API**

`lib/scoring/index.ts`:

```ts
import { isValidInput, normalize } from './normalize';
import { resonanceScore } from './jaccard';
import { harmonyScore } from './harmony';
import { cadenceScore } from './cadence';
import { numerologyScore } from './numerology';
import { aggregate } from './aggregate';
import { tagline } from './tagline';
import type { ScoreResult } from './types';

export type { ScoreResult, SubScores, SubScoreKey } from './types';

export class InvalidNameError extends Error {
  constructor(public readonly name: 'a' | 'b', public readonly value: string) {
    super(`Invalid name input for ${name}: ${JSON.stringify(value)}`);
    this.name = 'InvalidNameError';
  }
}

export function computeScore(a: string, b: string): ScoreResult {
  if (!isValidInput(a)) throw new InvalidNameError('a', a);
  if (!isValidInput(b)) throw new InvalidNameError('b', b);

  const na = normalize(a);
  const nb = normalize(b);

  const subScores = {
    resonance: resonanceScore(na, nb),
    harmony: harmonyScore(na, nb),
    cadence: cadenceScore(na, nb),
    numerology: numerologyScore(na, nb),
  };

  const percentage = aggregate(subScores);

  return {
    percentage,
    subScores,
    tagline: tagline(percentage),
    inputs: { a: a.trim(), b: b.trim() },
    normalized: { a: na, b: nb },
  };
}
```

- [ ] **Step 5: Verify pass**

```bash
npm test -- tests/scoring/
```

Expected: every scoring test passes.

- [ ] **Step 6: Commit**

```bash
git add lib/scoring/aggregate.ts lib/scoring/index.ts tests/scoring/aggregate.test.ts
git commit -m "feat(scoring): aggregate sub-scores and expose computeScore public API"
```

---

## Phase 3 — Env, cache, rate limit

### Task 13: `lib/env.ts` (zod-validated env)

**Files:**
- Create: `lib/env.ts`, `tests/env.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { parseEnv } from '@/lib/env';

describe('parseEnv', () => {
  const baseValid = {
    ANTHROPIC_API_KEY: 'sk-ant-test',
    REDIS_URL: 'redis://localhost:6379',
    NEXT_PUBLIC_SITE_URL: 'https://enishi.fr',
  };

  it('accepts the base config and applies defaults', () => {
    const env = parseEnv(baseValid);
    expect(env.RATE_LIMIT_PER_IP_HOURLY).toBe(10);
    expect(env.GLOBAL_DAILY_LIMIT).toBe(500);
  });

  it('respects explicit numeric overrides', () => {
    const env = parseEnv({ ...baseValid, RATE_LIMIT_PER_IP_HOURLY: '25', GLOBAL_DAILY_LIMIT: '2000' });
    expect(env.RATE_LIMIT_PER_IP_HOURLY).toBe(25);
    expect(env.GLOBAL_DAILY_LIMIT).toBe(2000);
  });

  it('throws when ANTHROPIC_API_KEY is missing', () => {
    const { ANTHROPIC_API_KEY: _, ...rest } = baseValid;
    expect(() => parseEnv(rest)).toThrow();
  });

  it('throws when REDIS_URL is malformed', () => {
    expect(() => parseEnv({ ...baseValid, REDIS_URL: 'not-a-url' })).toThrow();
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/env.test.ts
```

- [ ] **Step 3: Implement**

`lib/env.ts`:

```ts
import { z } from 'zod';

const schema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  REDIS_URL: z.string().regex(/^redis(s)?:\/\//, 'REDIS_URL must start with redis:// or rediss://'),
  RATE_LIMIT_PER_IP_HOURLY: z.coerce.number().int().positive().default(10),
  GLOBAL_DAILY_LIMIT: z.coerce.number().int().positive().default(500),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

let cached: Env | null = null;
export function env(): Env {
  if (!cached) cached = parseEnv();
  return cached;
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/env.test.ts
```

- [ ] **Step 5: Create `.env.example`**

```bash
cat > .env.example <<'EOF'
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Cache & rate limit storage
REDIS_URL=redis://redis:6379

# Per-IP rate limit (new generations / hour). Default: 10
RATE_LIMIT_PER_IP_HOURLY=10

# Global daily AI generation cap (cost ceiling). Default: 500
GLOBAL_DAILY_LIMIT=500

# Public site URL (used for OG image absolute URLs and metadata)
NEXT_PUBLIC_SITE_URL=https://enishi.fr
EOF
```

- [ ] **Step 6: Commit**

```bash
git add lib/env.ts tests/env.test.ts .env.example
git commit -m "feat(env): zod-validated env with rate limit defaults"
```

---

### Task 14: `lib/cache/key.ts`

**Files:**
- Create: `tests/cache/key.test.ts`, `lib/cache/key.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { cacheKey } from '@/lib/cache/key';

describe('cacheKey', () => {
  it('is symmetric (order-independent)', () => {
    expect(cacheKey('Marie', 'Paul')).toBe(cacheKey('Paul', 'Marie'));
  });

  it('is invariant under accent and case normalization', () => {
    expect(cacheKey('Hélène', 'Julien')).toBe(cacheKey('helene', 'JULIEN'));
  });

  it('returns a hex string of 16 chars prefixed with enishi:result:', () => {
    const key = cacheKey('Marie', 'Paul');
    expect(key).toMatch(/^enishi:result:[a-f0-9]{16}$/);
  });

  it('produces different keys for different name pairs', () => {
    expect(cacheKey('Marie', 'Paul')).not.toBe(cacheKey('Marie', 'Pierre'));
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/cache/key.test.ts
```

- [ ] **Step 3: Implement**

`lib/cache/key.ts`:

```ts
import { createHash } from 'node:crypto';
import { normalize } from '@/lib/scoring/normalize';

export function cacheKey(a: string, b: string): string {
  const pair = [normalize(a), normalize(b)].sort();
  const hash = createHash('sha256').update(pair.join('|')).digest('hex').slice(0, 16);
  return `enishi:result:${hash}`;
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/cache/key.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/cache/key.ts tests/cache/key.test.ts
git commit -m "feat(cache): SHA-256 key from sorted normalized name pair"
```

---

### Task 15: `lib/cache/client.ts` (ioredis singleton)

**Files:**
- Create: `lib/cache/client.ts`

- [ ] **Step 1: Implement singleton**

`lib/cache/client.ts`:

```ts
import Redis, { type Redis as RedisClient } from 'ioredis';
import { env } from '@/lib/env';

declare global {
  // eslint-disable-next-line no-var
  var __enishi_redis: RedisClient | undefined;
}

export function getRedis(): RedisClient {
  if (!globalThis.__enishi_redis) {
    globalThis.__enishi_redis = new Redis(env().REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    globalThis.__enishi_redis.on('error', (err) => {
      console.error('[redis] error', err.message);
    });
  }
  return globalThis.__enishi_redis;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add lib/cache/client.ts
git commit -m "feat(cache): ioredis singleton across hot reloads"
```

---

### Task 16: `lib/cache/store.ts` (typed get/set)

**Files:**
- Create: `tests/cache/store.test.ts`, `lib/cache/store.ts`, `tests/setup.ts` (modify)

- [ ] **Step 1: Wire `ioredis-mock` into test setup**

Replace `tests/setup.ts`:

```ts
import { vi } from 'vitest';
import RedisMock from 'ioredis-mock';

// Replace the ioredis singleton with the in-memory mock for tests
vi.mock('@/lib/cache/client', () => {
  const client = new RedisMock();
  return { getRedis: () => client };
});

// Provide minimal env stubs so lib/env doesn't blow up if imported
process.env.ANTHROPIC_API_KEY ??= 'sk-ant-test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000';
```

- [ ] **Step 2: Write the failing test**

`tests/cache/store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getCachedResult, setCachedResult } from '@/lib/cache/store';
import { getRedis } from '@/lib/cache/client';

const sample = {
  percentage: 78,
  subScores: { resonance: 82, harmony: 71, cadence: 65, numerology: 88 },
  tagline: 'affinité affirmée',
  aiText: 'Texte poétique de test...',
  generatedAt: 1700000000000,
};

describe('cache store', () => {
  beforeEach(async () => {
    await getRedis().flushall();
  });

  it('returns null on miss', async () => {
    expect(await getCachedResult('Marie', 'Paul')).toBeNull();
  });

  it('round-trips a result', async () => {
    await setCachedResult('Marie', 'Paul', sample);
    const got = await getCachedResult('Marie', 'Paul');
    expect(got).toEqual(sample);
  });

  it('is order-insensitive', async () => {
    await setCachedResult('Marie', 'Paul', sample);
    expect(await getCachedResult('Paul', 'Marie')).toEqual(sample);
  });
});
```

- [ ] **Step 3: Verify failure**

```bash
npm test -- tests/cache/store.test.ts
```

- [ ] **Step 4: Implement**

`lib/cache/store.ts`:

```ts
import { getRedis } from './client';
import { cacheKey } from './key';
import type { SubScores } from '@/lib/scoring/types';

export interface CachedResult {
  percentage: number;
  subScores: SubScores;
  tagline: string;
  aiText: string;
  generatedAt: number;
}

export async function getCachedResult(a: string, b: string): Promise<CachedResult | null> {
  const raw = await getRedis().get(cacheKey(a, b));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedResult;
  } catch {
    return null;
  }
}

export async function setCachedResult(a: string, b: string, value: CachedResult): Promise<void> {
  await getRedis().set(cacheKey(a, b), JSON.stringify(value));
}
```

- [ ] **Step 5: Verify pass**

```bash
npm test -- tests/cache/
```

- [ ] **Step 6: Commit**

```bash
git add lib/cache/store.ts tests/cache/store.test.ts tests/setup.ts
git commit -m "feat(cache): typed store with ioredis-mock-backed tests"
```

---

### Task 17: `lib/ratelimit/ip.ts`

**Files:**
- Create: `tests/ratelimit/ip.test.ts`, `lib/ratelimit/ip.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { checkIpRateLimit } from '@/lib/ratelimit/ip';
import { getRedis } from '@/lib/cache/client';

describe('checkIpRateLimit', () => {
  beforeEach(async () => {
    await getRedis().flushall();
  });

  it('allows up to N requests per IP per hour and blocks the next', async () => {
    const ip = '1.2.3.4';
    for (let i = 1; i <= 5; i++) {
      const r = await checkIpRateLimit(ip, 5);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(5 - i);
    }
    const blocked = await checkIpRateLimit(ip, 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(typeof blocked.resetAt).toBe('number');
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it('isolates different IPs', async () => {
    await checkIpRateLimit('1.1.1.1', 1);
    const blocked = await checkIpRateLimit('1.1.1.1', 1);
    expect(blocked.allowed).toBe(false);

    const fresh = await checkIpRateLimit('2.2.2.2', 1);
    expect(fresh.allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/ratelimit/ip.test.ts
```

- [ ] **Step 3: Implement**

`lib/ratelimit/ip.ts`:

```ts
import { getRedis } from '@/lib/cache/client';

export interface RateLimitOutcome {
  allowed: boolean;
  remaining: number;
  resetAt: number; // ms timestamp
}

const WINDOW_SECONDS = 3600;

export async function checkIpRateLimit(ip: string, limit: number): Promise<RateLimitOutcome> {
  const redis = getRedis();
  const bucket = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `enishi:rl:ip:${ip}:${bucket}`;
  const resetAt = (bucket + 1) * WINDOW_SECONDS * 1000;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  return { allowed: true, remaining: limit - count, resetAt };
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/ratelimit/ip.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ratelimit/ip.ts tests/ratelimit/ip.test.ts
git commit -m "feat(ratelimit): per-IP fixed-window hourly limit"
```

---

### Task 18: `lib/ratelimit/global.ts`

**Files:**
- Create: `tests/ratelimit/global.test.ts`, `lib/ratelimit/global.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { checkGlobalDailyLimit } from '@/lib/ratelimit/global';
import { getRedis } from '@/lib/cache/client';

describe('checkGlobalDailyLimit', () => {
  beforeEach(async () => {
    await getRedis().flushall();
  });

  it('allows up to N then blocks across the whole site', async () => {
    for (let i = 1; i <= 3; i++) {
      const r = await checkGlobalDailyLimit(3);
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkGlobalDailyLimit(3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/ratelimit/global.test.ts
```

- [ ] **Step 3: Implement**

`lib/ratelimit/global.ts`:

```ts
import { getRedis } from '@/lib/cache/client';
import type { RateLimitOutcome } from './ip';

const DAY_SECONDS = 86_400;

function todayKey(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `enishi:rl:global:${yyyy}-${mm}-${dd}`;
}

function tomorrowMidnightUtc(): number {
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return t.getTime();
}

export async function checkGlobalDailyLimit(limit: number): Promise<RateLimitOutcome> {
  const redis = getRedis();
  const key = todayKey();
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, DAY_SECONDS);
  }
  const resetAt = tomorrowMidnightUtc();
  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }
  return { allowed: true, remaining: limit - count, resetAt };
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/ratelimit/global.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ratelimit/global.ts tests/ratelimit/global.test.ts
git commit -m "feat(ratelimit): global daily counter with UTC midnight reset"
```

---

## Phase 4 — AI generation

### Task 19: `lib/ai/prompt.ts`

**Files:**
- Create: `tests/ai/prompt.test.ts`, `lib/ai/prompt.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { buildPrompt } from '@/lib/ai/prompt';
import type { ScoreResult } from '@/lib/scoring/types';

const sample: ScoreResult = {
  percentage: 78,
  subScores: { resonance: 82, harmony: 71, cadence: 65, numerology: 88 },
  tagline: 'affinité affirmée',
  inputs: { a: 'Hélène', b: 'Julien' },
  normalized: { a: 'helene', b: 'julien' },
};

describe('buildPrompt', () => {
  it('uses original-case names in the user message', () => {
    const { user } = buildPrompt(sample);
    expect(user).toContain('Hélène');
    expect(user).toContain('Julien');
  });

  it('includes the percentage and the tagline', () => {
    const { user } = buildPrompt(sample);
    expect(user).toContain('78');
    expect(user).toContain('affinité affirmée');
  });

  it('includes all four sub-scores by name and value', () => {
    const { user } = buildPrompt(sample);
    expect(user).toMatch(/résonance.*82/i);
    expect(user).toMatch(/harmonie.*71/i);
    expect(user).toMatch(/cadence.*65/i);
    expect(user).toMatch(/numérologie.*88/i);
  });

  it('produces a non-empty system prompt', () => {
    const { system } = buildPrompt(sample);
    expect(system.length).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/ai/prompt.test.ts
```

- [ ] **Step 3: Implement**

`lib/ai/prompt.ts`:

```ts
import type { ScoreResult } from '@/lib/scoring/types';

export interface BuiltPrompt {
  system: string;
  user: string;
}

const SYSTEM = `Tu es un narrateur poétique français, à la manière d'un essayiste discret.
Tu écris en français soutenu, registre littéraire, sans cliché de site de rencontre, sans emoji, sans liste, sans titre.
Tu produis UN SEUL paragraphe fluide de 80 à 150 mots.
Ne mentionne ni "algorithme", ni "calcul", ni "pourcentage" — exprime la concordance par les images.
Si les noms sont identiques, joue avec l'idée du miroir, de la gémellité, sans tomber dans le narcissisme caricatural.`;

export function buildPrompt(result: ScoreResult): BuiltPrompt {
  const { inputs, percentage, tagline, subScores } = result;

  const user = `Deux prénoms : ${inputs.a} et ${inputs.b}.

Concordance globale : ${percentage}/100 (« ${tagline} »).

Décomposition :
- Résonance des lettres : ${subScores.resonance}/100
- Harmonie vocalique : ${subScores.harmony}/100
- Cadence : ${subScores.cadence}/100
- Empreinte numérologique : ${subScores.numerology}/100

Écris un seul paragraphe poétique en français qui raconte cette concordance.
Appuie-toi subtilement sur les sous-scores remarquables (les plus hauts comme les plus bas) pour donner du relief, sans jamais citer leurs noms ni leurs chiffres.
80 à 150 mots, un seul paragraphe.`;

  return { system: SYSTEM, user };
}
```

- [ ] **Step 4: Verify pass**

```bash
npm test -- tests/ai/prompt.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/prompt.ts tests/ai/prompt.test.ts
git commit -m "feat(ai): build structured prompt from ScoreResult"
```

---

### Task 20: `lib/ai/generator.ts` interface + `lib/ai/claude.ts` implementation

**Files:**
- Create: `lib/ai/generator.ts`, `lib/ai/claude.ts`, `lib/ai/index.ts`

- [ ] **Step 1: Define the interface**

`lib/ai/generator.ts`:

```ts
import type { ScoreResult } from '@/lib/scoring/types';

export interface TextGenerationResult {
  /** Async iterable of text chunks as they arrive from the model. */
  textStream: AsyncIterable<string>;
  /** Resolves with the full concatenated text once the stream completes. */
  fullText: Promise<string>;
}

export interface TextGenerator {
  generate(result: ScoreResult): Promise<TextGenerationResult>;
}
```

- [ ] **Step 2: Implement Claude via the AI SDK**

`lib/ai/claude.ts`:

```ts
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
      maxTokens: 350, // ~150 mots avec marge
      temperature: 0.85,
    });

    return {
      textStream: stream.textStream,
      fullText: stream.text,
    };
  }
}
```

- [ ] **Step 3: Default singleton**

`lib/ai/index.ts`:

```ts
import { ClaudeTextGenerator } from './claude';
import type { TextGenerator } from './generator';

export type { TextGenerator, TextGenerationResult } from './generator';

let cached: TextGenerator | null = null;
export function defaultGenerator(): TextGenerator {
  if (!cached) cached = new ClaudeTextGenerator();
  return cached;
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/
git commit -m "feat(ai): TextGenerator interface and Claude streaming implementation"
```

---

## Phase 5 — API routes

### Task 21: `app/api/text/route.ts` — streaming endpoint with cache + rate limit

**Files:**
- Create: `app/api/text/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest } from 'next/server';
import { computeScore, InvalidNameError } from '@/lib/scoring';
import { getCachedResult, setCachedResult } from '@/lib/cache/store';
import { checkIpRateLimit } from '@/lib/ratelimit/ip';
import { checkGlobalDailyLimit } from '@/lib/ratelimit/global';
import { defaultGenerator } from '@/lib/ai';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export async function POST(req: NextRequest) {
  let body: { a?: string; b?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { a, b } = body;
  if (typeof a !== 'string' || typeof b !== 'string') {
    return Response.json({ error: 'missing_names' }, { status: 400 });
  }

  let result;
  try {
    result = computeScore(a, b);
  } catch (err) {
    if (err instanceof InvalidNameError) {
      return Response.json({ error: 'invalid_name', which: err.name }, { status: 422 });
    }
    throw err;
  }

  // Cache hit → serve cached text immediately as plain text stream
  const cached = await getCachedResult(a, b);
  if (cached) {
    return new Response(cached.aiText, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Enishi-Cache': 'hit' },
    });
  }

  // Cache miss → enforce rate limits before paying for an AI call
  const ip = clientIp(req);
  const cfg = env();

  const ipCheck = await checkIpRateLimit(ip, cfg.RATE_LIMIT_PER_IP_HOURLY);
  if (!ipCheck.allowed) {
    return Response.json(
      { error: 'rate_limit_ip', resetAt: ipCheck.resetAt },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((ipCheck.resetAt - Date.now()) / 1000)) } }
    );
  }

  const globalCheck = await checkGlobalDailyLimit(cfg.GLOBAL_DAILY_LIMIT);
  if (!globalCheck.allowed) {
    return Response.json(
      { error: 'rate_limit_global', resetAt: globalCheck.resetAt },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((globalCheck.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Stream from Claude
  const generation = await defaultGenerator().generate(result);

  let buffer = '';
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of generation.textStream) {
          buffer += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
        // Persist to cache after stream completes (fire-and-forget pattern but awaited for log clarity)
        await setCachedResult(a, b, {
          percentage: result.percentage,
          subScores: result.subScores,
          tagline: result.tagline,
          aiText: buffer,
          generatedAt: Date.now(),
        });
      } catch (err) {
        console.error('[api/text] stream error', err);
        controller.error(err);
      }
    },
  });

  return new Response(responseStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Enishi-Cache': 'miss' },
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/api/text/route.ts
git commit -m "feat(api): streaming /api/text with cache and dual rate limit"
```

---

### Task 22: `app/og/route.tsx` — dynamic OG image

**Files:**
- Create: `app/og/route.tsx`, `lib/og/image.tsx`

- [ ] **Step 1: Implement the OG visual component**

`lib/og/image.tsx`:

```tsx
import type { CSSProperties } from 'react';

export interface OgProps {
  a: string;
  b: string;
  percentage: number;
  tagline: string;
}

const wrap: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(165deg, #FBF5F2 0%, #F5E6E1 100%)',
  fontFamily: 'serif',
  color: '#2b2733',
  padding: 80,
};

export function OgVisual({ a, b, percentage, tagline }: OgProps) {
  return (
    <div style={wrap}>
      <div style={{ fontSize: 28, color: '#b56a7a', letterSpacing: 8, textTransform: 'uppercase', marginBottom: 24 }}>
        Enishi
      </div>
      <div style={{ fontSize: 64, fontStyle: 'italic', display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <span>{a}</span>
        <span style={{ color: '#b56a7a' }}>&amp;</span>
        <span>{b}</span>
      </div>
      <div style={{ width: 60, height: 1, background: '#b56a7a', opacity: 0.5, margin: '36px 0' }} />
      <div style={{ fontSize: 220, lineHeight: 1, letterSpacing: '-0.03em', display: 'flex', alignItems: 'flex-start' }}>
        <span>{percentage}</span>
        <span style={{ fontSize: 96, color: '#b56a7a', fontStyle: 'italic', marginLeft: 8 }}>%</span>
      </div>
      <div style={{ fontSize: 32, fontStyle: 'italic', color: '#8a7a85', marginTop: 24 }}>{tagline}</div>
    </div>
  );
}
```

- [ ] **Step 2: Implement the route**

`app/og/route.tsx`:

```tsx
import { ImageResponse } from 'next/og';
import { computeScore, InvalidNameError } from '@/lib/scoring';
import { OgVisual } from '@/lib/og/image';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const a = searchParams.get('a');
  const b = searchParams.get('b');

  if (!a || !b) {
    return new Response('missing names', { status: 400 });
  }

  try {
    const result = computeScore(a, b);
    return new ImageResponse(
      (
        <OgVisual
          a={result.inputs.a}
          b={result.inputs.b}
          percentage={result.percentage}
          tagline={result.tagline}
        />
      ),
      { width: 1200, height: 630 }
    );
  } catch (err) {
    if (err instanceof InvalidNameError) {
      return new Response('invalid name', { status: 422 });
    }
    throw err;
  }
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add app/og/route.tsx lib/og/image.tsx
git commit -m "feat(og): dynamic 1200x630 OG image with computed score"
```

---

## Phase 6 — UI components

### Task 23: `components/shared/Brand.tsx`

**Files:**
- Create: `components/shared/Brand.tsx`

- [ ] **Step 1: Implement**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/shared/Brand.tsx
git commit -m "feat(ui): Brand wordmark with optional back link"
```

---

### Task 24: `components/form/HomeForm.tsx`, `NameInput.tsx`, `SubmitButton.tsx`

**Files:**
- Create: `components/form/NameInput.tsx`, `components/form/SubmitButton.tsx`, `components/form/HomeForm.tsx`

- [ ] **Step 1: `NameInput`**

```tsx
'use client';
import type { ChangeEvent } from 'react';

interface NameInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}

const ALLOWED = /[\p{L}\s\-']/u;

export function NameInput({ id, label, value, onChange }: NameInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
      .split('')
      .filter((ch) => ALLOWED.test(ch))
      .join('')
      .slice(0, 50);
    onChange(next);
  }
  return (
    <label htmlFor={id} className="flex flex-col gap-2 w-full">
      <span
        className="text-xs uppercase tracking-[0.18em]"
        style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-accent)', fontStyle: 'italic' }}
      >
        {label}
      </span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        autoComplete="off"
        spellCheck={false}
        className="text-3xl bg-transparent border-b py-2 outline-none focus:border-current transition-colors"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-ink)',
          borderColor: 'var(--color-accent-soft)',
        }}
      />
    </label>
  );
}
```

- [ ] **Step 2: `SubmitButton`**

```tsx
'use client';

interface SubmitButtonProps {
  disabled: boolean;
}

export function SubmitButton({ disabled }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="px-6 py-3 rounded-xl font-medium transition-all"
      style={{
        background: disabled ? 'rgba(43,39,51,0.25)' : 'var(--color-ink)',
        color: 'var(--color-cream)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      Calculer →
    </button>
  );
}
```

- [ ] **Step 3: `HomeForm`**

```tsx
'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { NameInput } from './NameInput';
import { SubmitButton } from './SubmitButton';

export function HomeForm() {
  const router = useRouter();
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const valid = a.trim().length > 0 && b.trim().length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const params = new URLSearchParams({ a: a.trim(), b: b.trim() });
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-12 max-w-xl mx-auto py-24 px-6"
    >
      <div>
        <h1 className="text-5xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          La concordance des prénoms
        </h1>
        <p
          className="text-lg italic"
          style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-ink-soft)' }}
        >
          Deux prénoms, une résonance racontée par les nombres.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <NameInput id="name-a" label="Premier prénom" value={a} onChange={setA} />
        <NameInput id="name-b" label="Second prénom" value={b} onChange={setB} />
      </div>

      <SubmitButton disabled={!valid} />
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/form/
git commit -m "feat(ui): home form with sanitized inputs and disabled submit when empty"
```

---

### Task 25: `components/result/HeroSection.tsx`

**Files:**
- Create: `components/result/HeroSection.tsx`

- [ ] **Step 1: Implement**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/result/HeroSection.tsx
git commit -m "feat(ui): hero section with names, large percentage, tagline"
```

---

### Task 26: `components/result/FilRouge.tsx`

**Files:**
- Create: `components/result/FilRouge.tsx`

- [ ] **Step 1: Implement**

```tsx
export function FilRouge() {
  return (
    <svg
      width="48"
      height="20"
      viewBox="0 0 100 20"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M2 10 Q 25 4, 50 10 T 98 10"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="fil-rouge-path"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/result/FilRouge.tsx
git commit -m "feat(ui): FilRouge animated SVG thread between names"
```

---

### Task 27: `components/result/ScoresSection.tsx`

**Files:**
- Create: `components/result/ScoresSection.tsx`

- [ ] **Step 1: Implement**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/result/ScoresSection.tsx
git commit -m "feat(ui): scores section with bars and italic serif values"
```

---

### Task 28: `components/result/AITextSkeleton.tsx`

**Files:**
- Create: `components/result/AITextSkeleton.tsx`

- [ ] **Step 1: Implement**

```tsx
export function AITextSkeleton() {
  return (
    <div className="max-w-2xl mx-auto" aria-busy="true" aria-label="Génération du texte poétique en cours">
      <div className="skeleton-line h-[18px] w-full mb-4" />
      <div className="skeleton-line h-[18px] w-[95%] mb-4" />
      <div className="skeleton-line h-[18px] w-[88%] mb-4" />
      <div className="skeleton-line h-[18px] w-[60%]" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/result/AITextSkeleton.tsx
git commit -m "feat(ui): AI text skeleton with pulse animation"
```

---

### Task 29: `components/result/AIText.tsx` (client streaming)

**Files:**
- Create: `components/result/AIText.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { AITextSkeleton } from './AITextSkeleton';

interface AITextProps {
  a: string;
  b: string;
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

export function AIText({ a, b }: AITextProps) {
  const [state, setState] = useState<FetchState>({ kind: 'loading', text: '' });

  useEffect(() => {
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
  }, [a, b]);

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
```

- [ ] **Step 2: Commit**

```bash
git add components/result/AIText.tsx
git commit -m "feat(ui): AIText client component streams /api/text token-by-token"
```

---

### Task 30: `components/result/ShareButton.tsx` and `ActionsSection.tsx`

**Files:**
- Create: `components/result/ShareButton.tsx`, `components/result/ActionsSection.tsx`

- [ ] **Step 1: `ShareButton` (client, copies current URL)**

```tsx
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
```

- [ ] **Step 2: `ActionsSection`**

```tsx
import Link from 'next/link';
import { ShareButton } from './ShareButton';

export function ActionsSection() {
  return (
    <section className="text-center" style={{ padding: '60px 40px 90px' }}>
      <div className="inline-flex gap-3 flex-wrap justify-center">
        <ShareButton />
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-medium"
          style={{
            background: 'white',
            color: 'var(--color-ink)',
            boxShadow: '0 1px 2px rgba(60,40,50,0.06)',
          }}
        >
          Tester deux autres prénoms
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/result/ShareButton.tsx components/result/ActionsSection.tsx
git commit -m "feat(ui): share button and actions section"
```

---

### Task 31: `app/page.tsx` — routing logic + generateMetadata

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace with full routing logic**

```tsx
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

function thinDivider() {
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
      {thinDivider()}
      <section className="text-center" style={{ padding: '70px 40px 90px' }}>
        <div
          className="text-sm uppercase tracking-[0.25em] mb-9 italic"
          style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-accent)' }}
        >
          le mot des nombres
        </div>
        <AIText a={result.inputs.a} b={result.inputs.b} />
      </section>
      {thinDivider()}
      <ScoresSection scores={result.subScores} />
      {thinDivider()}
      <ActionsSection />
    </main>
  );
}
```

- [ ] **Step 2: Verify dev boot and home renders**

```bash
npm run dev &
SERVER_PID=$!
sleep 8
curl -s http://localhost:3000 | grep -q "concordance des prénoms" && echo "home ok" || echo "MISSING"
kill $SERVER_PID
```

Expected: `home ok`.

- [ ] **Step 3: Visual smoke (manual)**

Manually visit `http://localhost:3000` and `http://localhost:3000/?a=Marie&b=Paul` in a browser. The first shows the form; the second should show the hero + a skeleton (the `/api/text` call will fail until we have an API key — that's fine for now, the error message should appear).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat(ui): page.tsx routes form vs result and wires generateMetadata"
```

---

## Phase 7 — Docker

### Task 32: `docker/Dockerfile` (multi-stage)

**Files:**
- Create: `docker/Dockerfile`, `.dockerignore`

- [ ] **Step 1: Create `.dockerignore`**

```bash
cat > .dockerignore <<'EOF'
node_modules
.next
.git
.gitignore
.env
.env.*.local
.superpowers
docs
playwright-report
test-results
coverage
README.md
**/*.test.ts
**/*.test.tsx
tests/e2e
EOF
```

- [ ] **Step 2: Create the Dockerfile**

```bash
mkdir -p docker
```

`docker/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 3: Build the image**

```bash
docker build -f docker/Dockerfile -t enishi:dev .
```

Expected: build succeeds, final image around 150-200 MB. If you get a "module not found" for ioredis at runtime, ensure `ioredis` is in `dependencies` (not `devDependencies`).

- [ ] **Step 4: Commit**

```bash
git add docker/Dockerfile .dockerignore
git commit -m "feat(docker): multi-stage Dockerfile with Next.js standalone output"
```

---

### Task 33: `docker/docker-compose.yml`

**Files:**
- Create: `docker/docker-compose.yml`

- [ ] **Step 1: Create the compose file**

```yaml
services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    image: enishi:latest
    ports:
      - "3000:3000"
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      REDIS_URL: redis://redis:6379
      RATE_LIMIT_PER_IP_HOURLY: ${RATE_LIMIT_PER_IP_HOURLY:-10}
      GLOBAL_DAILY_LIMIT: ${GLOBAL_DAILY_LIMIT:-500}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-https://enishi.fr}
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  redis-data:
```

- [ ] **Step 2: Smoke-test the stack**

Make sure you have `ANTHROPIC_API_KEY` exported in your shell, then:

```bash
docker compose -f docker/docker-compose.yml up -d --build
sleep 10
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
docker compose -f docker/docker-compose.yml logs --tail=30 app
docker compose -f docker/docker-compose.yml down
```

Expected: `200` from the curl, no errors in app logs.

- [ ] **Step 3: Commit**

```bash
git add docker/docker-compose.yml
git commit -m "feat(docker): compose stack with app + redis (persistent volume)"
```

---

## Phase 8 — End-to-end test

### Task 34: Playwright happy-path test

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/flow.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Write the E2E spec**

`tests/e2e/flow.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home form → result → share link round-trip', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /concordance des prénoms/i })).toBeVisible();

  await page.getByLabel('Premier prénom').fill('Hélène');
  await page.getByLabel('Second prénom').fill('Julien');

  await page.getByRole('button', { name: /Calculer/ }).click();

  // Hero must appear with the percentage rendered immediately (math is sync)
  await expect(page.getByText(/concordance révélée/i)).toBeVisible();
  await expect(page.getByText('Hélène')).toBeVisible();
  await expect(page.getByText('Julien')).toBeVisible();

  // Sub-scores section is server-rendered too
  await expect(page.getByText(/la décomposition/i)).toBeVisible();
  await expect(page.getByText('Résonance des lettres')).toBeVisible();

  // URL has the params
  expect(page.url()).toContain('a=H%C3%A9l%C3%A8ne');
  expect(page.url()).toContain('b=Julien');
});

test('empty inputs disable submit', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: /Calculer/ });
  await expect(button).toBeDisabled();
  await page.getByLabel('Premier prénom').fill('Marie');
  await expect(button).toBeDisabled();
  await page.getByLabel('Second prénom').fill('Paul');
  await expect(button).toBeEnabled();
});
```

- [ ] **Step 3: Run E2E**

You will need a Redis available and `ANTHROPIC_API_KEY` set (the test only checks structure, not AI text content, so a stub key is acceptable as the test does not require the AI call to succeed). Easiest: start Redis from compose, then run Playwright.

```bash
docker compose -f docker/docker-compose.yml up -d redis
ANTHROPIC_API_KEY=sk-ant-stub REDIS_URL=redis://localhost:6379 npx playwright test
docker compose -f docker/docker-compose.yml down
```

Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/flow.spec.ts
git commit -m "test(e2e): home → result happy path and submit-disabled check"
```

---

## Phase 9 — Documentation

### Task 35: `README.md`

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

````markdown
# Enishi

Site web qui calcule la compatibilité poétique entre deux prénoms.

## Stack

Next.js 15 (App Router), TypeScript strict, Tailwind v4, ioredis, Anthropic Claude Haiku via Vercel AI SDK.

## Dev

```bash
npm install
cp .env.example .env.local
# édite .env.local et mets ta clé Anthropic
docker compose -f docker/docker-compose.yml up -d redis
npm run dev
```

## Tests

```bash
npm test            # vitest
npm run test:e2e    # playwright (nécessite Redis up)
npm run typecheck
```

## Production (self-host)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
docker compose -f docker/docker-compose.yml up -d --build
```

Mets un reverse proxy (Caddy / Traefik / nginx) devant pour HTTPS et `X-Forwarded-For`.

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Requis**. Clé API Anthropic |
| `REDIS_URL` | `redis://redis:6379` | URL Redis |
| `RATE_LIMIT_PER_IP_HOURLY` | `10` | Nouvelles générations max par IP par heure |
| `GLOBAL_DAILY_LIMIT` | `500` | Plafond global de générations IA / jour |
| `NEXT_PUBLIC_SITE_URL` | `https://enishi.fr` | URL publique |

Voir [`docs/superpowers/specs/2026-05-05-enishi-design.md`](docs/superpowers/specs/2026-05-05-enishi-design.md) pour la spec complète.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with dev, test, and production self-host instructions"
```

---

## Self-review

### Spec coverage

| Spec section | Implementing tasks |
|---|---|
| §1 Vision | implicit across the whole plan |
| §2 Nom & identité (Enishi, fil rouge) | T26 (FilRouge), T23 (Brand) |
| §3 Parcours utilisateur (form, result, shared link) | T24, T31, T29 |
| §4 Identité visuelle (palette, fonts, layout) | T4, T25, T27 |
| §5 Calcul mathématique (4 sub-scores, agrégat, tagline) | T6–T12 |
| §6 Génération de texte (Claude, prompt, streaming) | T19, T20, T21, T29 |
| §7 Architecture technique (Next.js, ioredis, OG, rate limit) | T1, T15–T18, T21, T22 |
| §8 Configuration & déploiement (env, Dockerfile, compose) | T13, T32, T33 |
| §9 États & cas limites (validation, loading, errors) | T6 (validation), T28, T29, T31 |
| §10 Hors périmètre v1 | none — explicit non-implementations |
| §11 Plan de tests | T6–T12 (unit), T16–T18, T34 (E2E) |

### Placeholder scan
No "TBD", "TODO", "implement later", "add appropriate error handling", or similar weasel phrases. Every step contains either runnable code or a concrete shell command with expected output.

### Type consistency
- `SubScores` keys are exactly `resonance | harmony | cadence | numerology` everywhere (types, scoring impls, prompt, scores section, OG, cache).
- `ScoreResult` shape is identical between `lib/scoring/types.ts` and consumption sites (`computeScore`, `buildPrompt`, `OgVisual`, `page.tsx`).
- `RateLimitOutcome` (`allowed`, `remaining`, `resetAt`) shared between `ip.ts` and `global.ts`, consumed by `app/api/text/route.ts`.
- `CachedResult` matches between `lib/cache/store.ts` write site (`route.ts`) and read site (page.tsx hit branch — currently the route returns plain text on hit; the page does not separately read the cache, only the API does).
- `TextGenerator.generate` returns a `TextGenerationResult` with `textStream` and `fullText`, consumed identically in `route.ts`.

### Notes for the implementer

- **Streaming honesty.** The original spec described "RSC + Suspense" streaming. In practice, true token-by-token streaming requires a small client component (`AIText.tsx`) that consumes a server route. The page itself is still a Server Component — the math, scores, and metadata are fully server-rendered. This is a deliberate, documented refinement of the spec.
- **Tailwind v4.** Uses CSS-first `@theme` config (no `tailwind.config.ts`). If `create-next-app` ships v3 instead, Task 4 covers the upgrade.
- **Cache hit served as text.** The `/api/text` route returns cached text as a single chunk (no artificial delay). The client `AIText` component handles both single-chunk and streamed responses identically because `ReadableStream.getReader().read()` works for both.
- **Time / date formats.** UTC midnight is used for the global daily reset, intentionally — server time zone independence. If you ever want Paris-local resets, that's a one-line change in `tomorrowMidnightUtc`.

---

## Execution Handoff

**Plan complete and saved to [`docs/superpowers/plans/2026-05-05-enishi-implementation.md`](2026-05-05-enishi-implementation.md). Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
