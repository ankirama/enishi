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
| `TRUSTED_PROXY` | `false` | Mettre à `true` quand un reverse proxy gère X-Forwarded-For (sinon spoofable) |
| `NEXT_PUBLIC_SITE_URL` | `https://enishi.fr` | URL publique |

Voir [`docs/superpowers/specs/2026-05-05-enishi-design.md`](docs/superpowers/specs/2026-05-05-enishi-design.md) pour la spec complète.
