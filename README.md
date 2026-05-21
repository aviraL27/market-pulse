# Market Pulse

Smart market price tracker — mixed live APIs (crypto, FX, food, commodities), Supabase auth, Redis analytics, and a premium cream/glass UI.

## Stack

- **Web:** React, TypeScript, Vite, React Router, Zustand, TanStack Query, Tailwind CSS, Framer Motion
- **API:** Hono (Node), Redis (Upstash), Supabase service role
- **Data:** Supabase PostgreSQL + Auth + RLS

## Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project (migrations applied)
- Upstash Redis URL

## Setup

### 1. Install dependencies

```bash
pnpm install
pnpm --filter @market-pulse/shared build
```

### 2. Environment files

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Fill in Supabase and Redis values.

### 3. Supabase migration

In Supabase Dashboard → **SQL Editor**, run:

`supabase/migrations/20240521000000_init.sql`

### 4. Auth redirect URLs (Supabase → Authentication → URL configuration)

```
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
```

### 5. Run locally

```bash
pnpm dev
```

- Web: http://localhost:5173  
- API: http://localhost:3001  

## Deploy

| App | Suggested host | Env |
|-----|----------------|-----|
| `apps/web` | Vercel / Netlify | `VITE_*` |
| `apps/api` | Railway / Render / Fly | `SUPABASE_*`, `REDIS_URL`, `CORS_ORIGIN` |

Set production `CORS_ORIGIN` to your web URL and add production URLs to Supabase redirect allowlist.

## API routes

- `GET /health`
- `GET /api/products/dashboard`
- `GET /api/products/trending`
- `GET /api/products/top-viewed`
- `GET /api/products/search?q=&source=&limit=`
- `GET /api/products/:id`
- `POST /api/products/:id/view`
- `GET /api/watchlist` (auth)
- `POST /api/watchlist` (auth)
- `DELETE /api/watchlist/:productId` (auth)

## Mixed data sources

- CoinGecko (crypto)
- Open Food Facts (food)
- Frankfurter (FX)
- Demo commodities (synthetic indices)

## Pushing to GitHub

**Safe to push:** application code, `pnpm-lock.yaml`, `.env.example`, migrations.

**Never push:** `.env`, `apps/api/.env`, `apps/web/.env` (gitignored). See [SECURITY.md](./SECURITY.md).

```bash
git add .
git status   # confirm no .env files listed
git commit -m "Initial commit: Market Pulse"
git remote add origin https://github.com/YOUR_USER/market-pulse.git
git push -u origin main
```

Clone on another machine: copy `.env.example` → `.env` and fill secrets locally.
