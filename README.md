# Enishi

Site web qui calcule la compatibilité poétique entre deux prénoms.

## Stack

Next.js 15 (App Router), TypeScript strict, Tailwind v4, ioredis, Anthropic Claude Haiku via Vercel AI SDK.

## Dev

```bash
npm install
cp .env.example .env
# édite .env et mets ta clé Anthropic
docker compose -f docker/docker-compose.yml up -d redis
npm run dev
```

Le même fichier `.env` (à la racine) sert pour `npm run dev` et pour `docker compose`.

## Tests

```bash
npm test            # vitest (unit)
npm run test:e2e    # playwright (nécessite Redis up)
npm run typecheck
```

## Production (self-host)

Mets ta vraie clé Anthropic dans `.env` ainsi que `TRUSTED_PROXY=true` si un reverse proxy est devant, puis :

```bash
docker compose --env-file .env -f docker/docker-compose.yml up -d --build
```

Le flag `--env-file .env` est nécessaire : toutes les variables (Anthropic key, rate limits, `HOST_PORT`, `NEXT_PUBLIC_SITE_URL` build arg, `TRUSTED_PROXY`) sont substituées via `${VAR}` dans le compose. Si tu déploies via un UI type Dockhand / Portainer, tu peux mettre les variables directement dans l'interface — pas besoin du `--env-file`.

`HOST_PORT` permet de changer le port publié sur l'hôte (par défaut 3000) — pratique sur un NAS où 3000 est déjà pris. Le port interne du container reste 3000.

`NEXT_PUBLIC_SITE_URL` doit être présente au moment du build : Next.js inline les `NEXT_PUBLIC_*` dans le bundle compilé (pas au runtime). Si tu changes l'URL publique, rebuild avec `--build`.

Mets un reverse proxy (Caddy / Traefik / Nginx Proxy Manager) devant pour HTTPS et `X-Forwarded-For`.

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Requis**. Clé API Anthropic |
| `REDIS_URL` | `redis://redis:6379` (override compose) | URL Redis. Pour `npm run dev` local : `redis://localhost:6379` |
| `RATE_LIMIT_PER_IP_HOURLY` | `10` | Nouvelles générations max par IP par heure |
| `GLOBAL_DAILY_LIMIT` | `500` | Plafond global de générations IA / jour (cap des coûts Anthropic) |
| `TRUSTED_PROXY` | `false` | Mettre à `true` quand un reverse proxy gère X-Forwarded-For (sinon spoofable) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | URL publique (pour les OG images partagées) |

Voir [`docs/superpowers/specs/2026-05-05-enishi-design.md`](docs/superpowers/specs/2026-05-05-enishi-design.md) pour la spec complète.
