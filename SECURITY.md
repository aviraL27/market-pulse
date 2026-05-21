# Security

## Before pushing to GitHub

1. **Never commit** `.env` files — only `.env.example` with placeholders.
2. Confirm secrets are ignored:
   ```bash
   git status
   ```
   You should **not** see `.env`, `apps/api/.env`, or `apps/web/.env` in the list.
3. **`SUPABASE_SERVICE_ROLE_KEY`** and **`REDIS_URL`** must exist only in `apps/api/.env` (server), never in the web app or git.
4. The web app only uses `VITE_SUPABASE_ANON_KEY` (public by design, protected by RLS).

## If secrets were ever committed or shared

Rotate immediately:

- Supabase → Settings → API → roll **service_role** key
- Upstash → reset Redis password / URL
- Update local `apps/api/.env` only

## Reporting issues

Do not open public issues with API keys, tokens, or `.env` contents.
