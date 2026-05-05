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

## Production — depuis l'image prébuilte (recommandé)

Une image multi-arch (amd64 + arm64) est publiée automatiquement sur **`ghcr.io/ankirama/enishi:latest`** à chaque push sur `main` (workflow `.github/workflows/publish.yml`). C'est le mode recommandé pour Dockhand / Portainer / un VPS sans checkout git.

```bash
# Récupère juste le compose prod (pas besoin du repo entier)
curl -O https://raw.githubusercontent.com/Ankirama/Enishi/main/docker/docker-compose.prod.yml

# Crée un .env avec au minimum ANTHROPIC_API_KEY et SITE_URL
docker compose --env-file .env -f docker-compose.prod.yml up -d
```

Sur Dockhand / Portainer : importe `docker-compose.prod.yml` et renseigne les variables via l'UI. L'image est tirée automatiquement à chaque démarrage (`pull_policy: always`).

> **Première fois** : le package GHCR est privé par défaut. Va sur https://github.com/users/Ankirama/packages/container/enishi/settings et passe la visibilité en `public` pour que Dockhand puisse pull sans auth. Une seule fois.

Mets un reverse proxy (Caddy / Traefik / Nginx Proxy Manager) devant pour HTTPS et `X-Forwarded-For`.

## Production — build local

Si tu préfères builder toi-même :

```bash
docker compose --env-file .env -f docker/docker-compose.yml up -d --build
```

`HOST_PORT` permet de changer le port publié (par défaut 3000). `SITE_URL` est lue au runtime — change-la sans rebuild.

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Requis**. Clé API Anthropic |
| `REDIS_URL` | `redis://redis:6379` (override compose) | URL Redis. Pour `npm run dev` local : `redis://localhost:6379` |
| `RATE_LIMIT_PER_IP_HOURLY` | `10` | Nouvelles générations max par IP par heure |
| `GLOBAL_DAILY_LIMIT` | `500` | Plafond global de générations IA / jour (cap des coûts Anthropic) |
| `TRUSTED_PROXY` | `false` | Mettre à `true` quand un reverse proxy gère X-Forwarded-For (sinon spoofable) |
| `SITE_URL` | `http://localhost:3000` | URL publique (pour les OG images partagées). Lue au runtime — change-la sans rebuild |
| `HOST_PORT` | `3000` | Port publié sur l'hôte (le container écoute toujours sur 3000 en interne) |

Voir [`docs/superpowers/specs/2026-05-05-enishi-design.md`](docs/superpowers/specs/2026-05-05-enishi-design.md) pour la spec complète.
