# Oracle Cloud deployment (staged, not yet deployed)

This repository now contains an optional Node.js adapter and Docker Compose topology for a future Oracle Cloud VM deployment. Nothing in this document provisions infrastructure or changes the live Supabase project.

## Architecture

- **Frontend:** the existing Vite build, served by Nginx.
- **API:** the existing `functions/api/[[path]].js` Fetch handler, called through `server/oracle-api.mjs` under Node.js 22.
- **Database and identity:** the existing Supabase project, accessed with the anon key and user JWTs so RLS remains in force.
- **Ingress:** Nginx proxies `/api/*` to the private API container. The Compose file binds the web container to `127.0.0.1:8081`; it is not directly public.

The Node adapter intentionally reuses the existing API handler instead of duplicating business logic. The API runtime health response reports `oracle-node` when run through this adapter. The `API_ALLOWED_ORIGINS` environment variable adds exact browser origins to the existing allowlist.

## Files

- `Dockerfile`: `api` and `frontend` build targets.
- `docker-compose.oracle.yml`: API + Nginx services; API port is not published to the host.
- `deploy/nginx.conf`: reverse proxy and static file serving.
- `server/oracle-api.mjs`: Node HTTP adapter.
- `.env.oracle.example`: non-secret environment template.

## Local validation before any VM deployment

1. Install the repository's pinned Node dependencies with `npm ci`.
2. Run `npm run lint`, `npm run test`, `npm run build`, and `npm run check:dist`.
3. Copy `.env.oracle.example` to `.env.oracle` and fill in the Supabase project URL, anon key, and exact frontend origin. Never put a service-role key in this file.
4. Run `docker compose -f docker-compose.oracle.yml config` to validate Compose interpolation.
5. Build images with `docker compose -f docker-compose.oracle.yml build`.
6. Only after the VM, firewall, TLS reverse proxy, backups, and monitoring are reviewed should the stack be started.

## Production exposure requirements

- Keep API port 8080 private; do not add a host port mapping.
- Keep the web container bound to loopback. Configure a host-level TLS reverse proxy (or an equivalent managed ingress) before exposing the site.
- Do not expose port 8081 directly to the public internet.
- Configure Oracle Cloud network security rules and the VM firewall deliberately; only expose the required TLS ingress.
- The Nginx proxy overwrites forwarded client-IP headers. Do not bypass it and expose the API container directly.
- Configure `API_ALLOWED_ORIGINS` with exact origins, not wildcards.
- Use only `SUPABASE_ANON_KEY` for the public/user-scoped API. Do not configure `SUPABASE_SERVICE_ROLE_KEY` for this stack.

## Database migration gate

The production hardening migration is now named `supabase/migrations/006_production_security_hardening.sql`, following the repository's existing `005_indexes_rls_fixes.sql`. Its two malformed dollar-quoted function bodies have been corrected.

This is a code correction, **not proof that the migration is valid against the live schema**. Before production use:

1. Inspect the current Supabase migration history.
2. Apply the migration to a disposable/staging database matching the production schema.
3. Run RLS tests with anonymous, ordinary-user, validator, admin, and service-role contexts.
4. Inspect dependent views, triggers, grants, and RPC permissions.
5. Back up production and obtain explicit approval before any production migration.

## Current limitations

- No Oracle VM has been inspected or modified by this repository change.
- No Azure resources have been created.
- No Supabase migration has been executed.
- No TLS certificate or host-level reverse proxy is configured here.
- The current Vercel/Cloudflare deployment remains unchanged until an explicitly approved cutover.
