# Enishi — Design Spec

**Date** : 2026-05-05
**Statut** : Validé pour implémentation
**Domaine cible** : `enishi.fr`

---

## 1. Vision

Site web d'une page qui calcule la compatibilité entre deux prénoms via un algorithme déterministe à 4 sous-critères, et raconte ce résultat en français poétique grâce à Claude Haiku 4.5.

L'expérience est contemplative et premium : pas de gamification clinquante, pas de cœurs animés. L'esthétique évoque un papier à lettres moderne — beaucoup d'air, typographie sérif, palette pastel.

## 2. Nom & identité

- **Nom** : *Enishi* (縁) — concept japonais désignant le lien karmique entre deux personnes destinées
- **Domaine** : `enishi.fr`
- **Métaphore visuelle** : le **fil rouge du destin** (赤い糸) — un fin trait rouge animé apparaît entre les deux prénoms à l'affichage du résultat

## 3. Parcours utilisateur

### 3.1 Homepage (`/`)
- Titre serif géant
- Sous-titre italique court
- Deux champs prénoms côte-à-côte ou empilés (responsive)
- Bouton "Calculer" désactivé tant que les deux champs ne contiennent pas au moins une lettre
- Pas de footer chargé : juste une mention discrète

### 3.2 Page résultat (`/?a=Hélène&b=Julien`)
4 sections empilées verticalement, séparées par de fins traits dégradés :

1. **Hero** — eyebrow "concordance révélée", noms en italique serif (~52px), pourcentage en typo géante (~220px), tagline qualificative italique (« affinité affirmée », « écho lointain », etc.)
2. **Le mot des nombres** — texte IA streamé en typo Inter 21px / line-height 1.75, largeur max 720px, centré
3. **La décomposition** — grille 2×2 des 4 sous-scores, chacun avec barre fine et chiffre en italique serif
4. **Actions** — boutons "Partager ce résultat ↗" (primaire, fond foncé) + "Tester deux autres prénoms" (ghost)

### 3.3 Lien partagé
Identique à la page résultat. Si le résultat est en cache → rendu instantané. Sinon → math instantanée + texte streamé.

## 4. Identité visuelle

### Palette
- **Fond** : dégradé `#FBF5F2` → `#F5E6E1` → `#FBF5F2` (160deg)
- **Encre principale** : `#2b2733`
- **Encre secondaire** : `#4a4452`
- **Accent** : `#b56a7a` (bordeaux-rosé)
- **Accent dégradé** : `#9b8590` (gris-lavande)
- **Surface blanche** (cartes) : `#FFFFFF` avec `box-shadow: 0 12px 36px rgba(60,40,50,.10)`

### Typographie (Google Fonts)
- **DM Serif Display** — pourcentage, noms en hero, chiffres des sous-scores. Italic activé.
- **Inter** (300, 400, 500, 600) — corps, UI, labels
- **Cormorant Garamond** (italic) — eyebrows, tags qualificatives, légendes décoratives

### Tailles clés
- Hero pourcentage : 220px
- Hero noms : 52px italic
- Texte IA : 21px / line-height 1.75
- Sous-scores valeurs : 28px italic serif
- Labels eyebrow : 13-15px, letter-spacing .25em, uppercase

### Layout
- Largeur max corps : 760px (scores) / 720px (texte) / 760px (carte certificat)
- Padding section : 70-90px vertical
- Tout responsive : grille 2×2 → 1 colonne en mobile, tailles réduites proportionnellement

### Motif "fil rouge"
Animation subtile : un fin trait rouge (1px, `#b56a7a`) trace de gauche à droite entre les deux prénoms à l'affichage du résultat. Durée 800ms, easing doux. Optionnel à l'apparition seulement, pas de boucle.

## 5. Calcul mathématique

### Normalisation des entrées
Pipeline appliqué côté serveur sur chaque prénom :
1. `String.prototype.normalize('NFD')` — décompose les caractères accentués
2. Suppression des diacritiques (`/[̀-ͯ]/g`)
3. Lowercase
4. Conservation : lettres `a-z`, tirets `-`, apostrophes `'`
5. Rejet (validation) : chiffres, autres caractères spéciaux, chaîne vide

Conséquences : `Hélène` ≡ `helene` ≡ `Hélène` ; `Jean-Pierre` est conservé tel quel ; `Marie123` est rejeté.

### Clé de cache
`hash(sort([name1_normalized, name2_normalized]))` — donc `Marie+Paul` et `Paul+Marie` produisent la même clé.

Algo de hash : SHA-256, tronqué aux 16 premiers caractères hex (suffisant pour collision-free).

### Sous-scores (0–100)

| Critère | Poids | Algorithme |
|---|---|---|
| Résonance des lettres | 35% | `\|A ∩ B\| / \|A ∪ B\| × 100` (Jaccard sur ensembles de lettres uniques après normalisation) |
| Harmonie vocalique | 25% | `100 × (1 - \|ratio_voyelles_A - ratio_voyelles_B\|)` où ratio = voyelles / total_lettres |
| Cadence | 20% | `100 × (1 - \|len(A) - len(B)\| / max(len(A), len(B)))` |
| Empreinte numérologique | 20% | Réduction A=1…Z=26 → somme → **racine numérique** (sommation répétée des chiffres jusqu'à un seul chiffre 1-9 ; si 0, on retourne 9) pour chaque prénom. Score = `100 × (1 - distance / 8)` où distance = `\|n1 - n2\|` (max théorique 8) |

Voyelles considérées (post-normalisation) : `a, e, i, o, u, y`. Le `y` est toujours compté comme voyelle pour simplifier — la frontière voyelle/consonne en français est ambiguë.

Toutes les longueurs (`len(...)`) dans les formules s'appliquent à la **chaîne normalisée** (sans accents, sans tirets/apostrophes/espaces).

### Score final
`weighted_avg = 0.35 × résonance + 0.25 × harmonie + 0.20 × cadence + 0.20 × numérologie`

Arrondi à l'entier (0-100) pour l'affichage.

### Tagline qualitative
Calculée côté serveur depuis le score final, déterministe :
- 0-29 : « écho lointain »
- 30-49 : « affinité naissante »
- 50-69 : « concordance discrète »
- 70-84 : « affinité affirmée »
- 85-94 : « résonance forte »
- 95-100 : « harmonie rare »

## 6. Génération de texte (IA)

### Modèle
**Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk`, en streaming.

### Abstraction
Interface `TextGenerator` pour permettre le swap futur :
```ts
interface TextGenerator {
  generate(input: GenerationInput): AsyncIterable<string>;
}
```
Implémentation initiale : `ClaudeTextGenerator`. Le code applicatif ne dépend que de l'interface.

### Prompt template
Système : ton poétique français soutenu, registre littéraire, ~80-150 mots, pas de cliché de site de rencontre, pas d'emoji, pas de listes, un seul paragraphe fluide.

User : injecte les prénoms (forme **originale** avec accents et casse), le pourcentage final, le tag qualitatif, et les 4 sous-scores avec leur valeur. Demande d'expliquer poétiquement pourquoi ce score, en s'appuyant subtilement sur les sous-scores remarquables (les plus hauts et les plus bas).

Le prompt complet sera affiné en phase de prompt-engineering pendant l'implémentation.

### Streaming
Modèle **RSC + Suspense** : la page résultat est un Server Component. Le composant qui génère le texte IA est wrappé dans `<Suspense>` avec un fallback skeleton (lignes grisées en fade-in). Next.js streame le HTML au fur et à mesure.

Côté serveur, on bufferise les chunks reçus de Claude. À la fin du stream, on persiste le texte complet dans Redis (idempotent : si une autre requête est arrivée entre-temps, on accepte l'écrasement, le résultat est déterministe à un délai près).

## 7. Architecture technique

### Stack
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript strict
- **Styling** : Tailwind CSS
- **Runtime** : Node.js 22 LTS
- **Tests** : Vitest (unit) + Playwright (E2E sur le flow complet)

### Structure de dossiers
```
enishi/
├── app/
│   ├── page.tsx                 # Form OU résultat (selon search params)
│   ├── layout.tsx               # Polices, metadata de base
│   ├── api/
│   │   └── text/route.ts        # POST → cache → Claude streaming
│   ├── og/route.tsx             # OG image dynamique 1200×630
│   └── globals.css              # Tailwind + custom
├── components/
│   ├── form/                    # NameInput, SubmitButton
│   ├── result/                  # Hero, AIText, Scores, Actions
│   └── shared/                  # FilRouge, Layout
├── lib/
│   ├── scoring/
│   │   ├── normalize.ts
│   │   ├── jaccard.ts
│   │   ├── harmony.ts
│   │   ├── cadence.ts
│   │   ├── numerology.ts
│   │   ├── aggregate.ts         # poids + tag qualitatif
│   │   └── index.ts             # API publique : compute(name1, name2)
│   ├── ai/
│   │   ├── generator.ts         # interface TextGenerator
│   │   ├── claude.ts            # implémentation Anthropic
│   │   └── prompt.ts            # construction du prompt
│   ├── cache/
│   │   ├── client.ts            # ioredis client singleton
│   │   ├── key.ts               # hash(sort([n1, n2]))
│   │   └── store.ts             # get/set typés du résultat
│   ├── ratelimit/
│   │   ├── ip.ts                # sliding window per-IP / hour
│   │   └── global.ts            # fixed window global / day
│   └── og/
│       └── image.tsx            # composant OG (Satori)
├── tests/
│   ├── scoring/                 # tests unitaires des sous-scores
│   ├── normalize.test.ts        # accents, tirets, edge cases
│   └── e2e/                     # Playwright : flow complet
├── docker/
│   ├── Dockerfile               # multi-stage avec Next.js standalone
│   └── docker-compose.yml       # app + redis
├── .env.example                 # template des variables
├── next.config.ts               # output: 'standalone'
└── package.json
```

### Flux de requête (page résultat)
1. `GET /?a=Hélène&b=Julien` (sur le wire les accents sont URL-encodés en `%C3%A9` etc., le navigateur affiche la forme accentuée)
2. Server Component lit les search params
3. Validation + normalisation des prénoms
4. Calcul math (instantané, synchrone)
5. Lookup cache Redis avec la clé hashée
6. **Cache hit** : rendu complet immédiat avec le texte stocké
7. **Cache miss** :
   - Vérif rate limit (per-IP + global daily)
   - Si OK : rendu de la page avec math visible + `<Suspense>` autour du texte
   - Le composant suspendu await le stream Claude, écrit dans le cache à la fin
   - Si rate limit dépassé : message poétique adapté, math visible, pas d'appel IA

### Cache (Redis)
- Client : `ioredis` (mature, supporte cluster, parfait pour self-host)
- Schéma : `enishi:result:<hash>` → JSON `{ percentage, sub_scores, ai_text, generated_at }`
- Pas de TTL (les résultats sont permanents)
- Volume Docker persistant pour ne pas perdre le cache au restart

### Rate limiting (Redis)
- **Per-IP** : sliding window. Clé `enishi:rl:ip:<ip>:<floor(now/3600)>` → INCR + EXPIRE 3600. Bloque si > `RATE_LIMIT_PER_IP_HOURLY`.
- **Global daily** : fixed window. Clé `enishi:rl:global:<YYYY-MM-DD>` → INCR + EXPIRE 86400. Bloque si > `GLOBAL_DAILY_LIMIT`.
- Les deux comptent **uniquement les cache miss** (pas les hits).
- L'IP est lue depuis le header `X-Forwarded-For` (configuré dans le reverse proxy en prod).

### OG image
- Endpoint : `/og?a=Hélène&b=Julien`
- Génération via `next/og` (`ImageResponse`) avec Satori
- Format : 1200×630 PNG
- Contenu : nom du site, deux prénoms, pourcentage géant, palette/typo de l'identité
- Cache HTTP : `Cache-Control: public, max-age=31536000, immutable` (le résultat est figé pour une paire donnée)
- Référencée depuis `generateMetadata()` de la page résultat

### Metadata SEO
`generateMetadata()` produit dynamiquement :
- `title` : « Hélène & Julien — 78% — Enishi »
- `description` : courte phrase générique mentionnant l'affinité
- `og:image` : `/og?a=...&b=...`
- `twitter:card` : `summary_large_image`

## 8. Configuration & déploiement

### Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Requis**. Clé API Anthropic |
| `REDIS_URL` | `redis://redis:6379` | URL Redis (compose interne par défaut) |
| `RATE_LIMIT_PER_IP_HOURLY` | `10` | Nouvelles générations max par IP par heure |
| `GLOBAL_DAILY_LIMIT` | `500` | Plafond global de générations IA par jour |
| `NEXT_PUBLIC_SITE_URL` | `https://enishi.fr` | URL publique (pour OG image absolute, partage) |

Toutes lues depuis `process.env`, validées au démarrage avec un schéma Zod.

### Dockerfile
Multi-stage :
1. **deps** : install des dépendances (`npm ci`)
2. **builder** : build Next.js avec `output: 'standalone'`
3. **runner** : image Alpine + Node 22, copie le standalone bundle, expose 3000

Image finale visée : ~150 Mo.

### docker-compose.yml
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - REDIS_URL=redis://redis:6379
      - RATE_LIMIT_PER_IP_HOURLY=${RATE_LIMIT_PER_IP_HOURLY:-10}
      - GLOBAL_DAILY_LIMIT=${GLOBAL_DAILY_LIMIT:-500}
      - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://enishi.fr}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

### Reverse proxy (hors compose)
HTTPS, redirection www → apex, et X-Forwarded-For correctement passé. Géré par l'infra serveur (Caddy/Traefik/nginx au choix).

## 9. États & cas limites

### Validation côté client
- Bouton "Calculer" désactivé tant que `name1.trim().length === 0 || name2.trim().length === 0`
- Caractères saisis filtrés en temps réel : on n'accepte que lettres + accents + `-` + `'` + espaces

### Validation côté serveur
- Re-validation systématique (jamais faire confiance au client)
- Rejet : chaîne vide après normalisation, longueur > 50 caractères
- Erreur de validation → page d'erreur élégante avec lien vers la home

### Loading
- Math + sous-scores apparaissent **instantanément** dès que la page result se charge
- Le texte IA est dans `<Suspense>` avec un skeleton (3 lignes grisées en fade-in continue)
- Pas de spinner global

### Erreur API IA
- Si Claude échoue (timeout, 5xx, etc.) : on affiche math + scores normalement
- À la place du texte IA : « Le scribe est momentanément silencieux, mais les nombres parlent d'eux-mêmes. » + bouton "Réessayer"
- Le résultat **n'est pas mis en cache** (on retentera plus tard)

### Cas limites de prénoms
- **Même prénom 2x** : autorisé (easter egg, score ~100%, prompt indique à l'IA de jouer la dimension narcissique/jumelle)
- **Prénoms identiques après normalisation** (Hélène vs Helene) : traités comme égaux ⇒ même clé de cache, même résultat
- **Prénom à 1 lettre** : autorisé, math fonctionne mais prévenir que le résultat sera atypique
- **Prénoms très longs** (> 50 chars) : rejet avec message

### Rate limit dépassé
Dans les deux cas la math + les sous-scores sont calculés et affichés normalement (calcul local, gratuit). Seule la génération du texte IA est court-circuitée.

- **Per-IP dépassé** : à la place du texte IA, on affiche le message « Trop de destins explorés, reviens dans une heure » avec un countdown discret jusqu'au prochain reset (calculé depuis l'heure courante, le compteur Redis expirant sur l'heure pleine).
- **Global daily atteint** : « Le scribe se repose ce soir, reviens demain. » Pas de countdown détaillé (juste minuit local serveur).
- **Pas de mise en cache** dans ces deux cas : on retentera la prochaine fois.

## 10. Hors périmètre v1

| Feature | Raison |
|---|---|
| Comptes utilisateur, historique | YAGNI v1 |
| CAPTCHA | Rate limit + cache suffisent ; Cloudflare Turnstile prévu en plan B |
| Multilingue | Le ton poétique français est le cœur du produit |
| Bouton "regenerate" | Casserait le déterminisme du partage (même URL = mêmes mots) |
| Analytics | À ajouter via Plausible/Umami plus tard si besoin |
| Mode sombre | Le pastel clair est l'identité ; un mode sombre demanderait un repensé global |
| Sauvegarde de paires favorites | YAGNI v1 |

## 11. Plan de tests

### Tests unitaires (Vitest)
- `normalize`: tous les cas d'accents, tirets, apostrophes, casse
- Chaque sous-score isolément, avec valeurs limites (vide, identique, complètement disjoint)
- Agrégation : pondération correcte, arrondi
- Tag qualitatif : seuils corrects
- Hash de clé de cache : symétrie (Marie+Paul ≡ Paul+Marie)

### Tests d'intégration
- Endpoint `/api/text` : avec mock du `TextGenerator`, vérifier flow cache hit / miss / rate limit
- Mock Redis avec `ioredis-mock` ou un vrai Redis dans `docker-compose.test.yml`

### Tests E2E (Playwright)
- Flow complet : home → saisie → résultat avec streaming visible → partage du lien → ouverture du lien → cache hit instantané
- Cas erreur : champ vide → bouton désactivé ; rate limit dépassé → message correct
- Vérification de l'OG image (request HEAD sur `/og?...`)

## 12. Décisions ouvertes pour l'implémentation

Quelques détails qui seront tranchés en cours d'implémentation, sans impact sur l'architecture :
- Choix exact de l'easing CSS pour le fil rouge animé
- Wording final des taglines qualitatives et messages d'erreur
- Affinage du prompt Claude après quelques itérations
- Choix entre Tailwind v4 (fraîchement sorti) et v3 stable
