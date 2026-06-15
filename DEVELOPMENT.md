# AI Knowledge Bank Development Status

This file tracks the current engineering state of the repository. For product vision and user-facing setup, start with `README.md`.

## Current Phase

AI Knowledge Bank is in the V1.0 Beta track. The current surface includes:

- Static Vite pages for the homepage, dedicated vault pages, and dashboard entry points.
- Cloudflare Pages Functions under `functions/api/[[path]].js`.
- Supabase migrations for CAS scoring, users, workflow, and Cross-Vault RAG.
- Three dedicated vault pages with filtering, detail panels, community validation, and Cross-Vault Dispatch.
- A text health gate to prevent mojibake regressions in public docs and runtime source.

## Verification Commands

Run these before committing user-facing or runtime changes:

```bash
npm run check:text
npm run lint
npm run build
```

Use `npm run preview` after `npm run build` when visual inspection is needed.

## Text Health

`npm run check:text` runs `scripts/check-text-health.mjs`. It scans public documentation and runtime source files for common mojibake signatures while skipping generated and historical folders:

- `.git`
- `.vite`
- `dist`
- `docs/superpowers`
- `node_modules`

The check script itself is skipped because it contains the mojibake signatures it searches for. The `docs/superpowers` folder is skipped because historical implementation plans intentionally mention old mojibake regex examples.

## Architecture Snapshot

```text
AI Knowledge Bank
|-- index.html                 # Main public experience
|-- knowledge.html             # Knowledge Vault page
|-- tools.html                 # Tools Vault page
|-- cases.html                 # Cases Vault page
|-- community.html             # Community validation page
|-- assets/                    # Shared CSS, JS, and visual assets
|-- functions/api/             # Cloudflare Pages Functions backend
|-- lib/                       # TypeScript utilities and workflow code
|-- components/                # React-ready components
|-- supabase/migrations/       # Database schema and workflow migrations
|-- types/                     # Shared TypeScript definitions
|-- scripts/                   # Local verification utilities
`-- docs/superpowers/          # Agentic design and implementation records
```

## Recent Completed Work

- Phase 1: repaired quality foundation, Chinese copy, contributor text, and core verification.
- Phase 2: improved dedicated vault pages with readable fallbacks, filtering, node details, and community signals.
- Phase 3: added Cross-Vault Dispatch panels to all dedicated vault pages.
- Phase 4: added text health verification and documented the guardrail.

## Backlog

High priority:

- Add focused API contract tests for `/api/search`, `/api/vaults`, and `/api/community-signals`.
- Add a contribution flow for submitting knowledge, tool, and case candidates.
- Add UI smoke checks for the dedicated vault pages.

Medium priority:

- Add a lightweight analytics dashboard for evolution signals.
- Improve Supabase Realtime integration for community signals.
- Add authenticated authoring flows when credentials are available.

Future:

- Add semantic pgvector search to improve Cross-Vault RAG retrieval quality.
- Add AI-assisted node extraction and SOP generation.
- Add governance workflows for disputes, merges, and community standards.

## Commit Expectations

- Keep commits scoped to one phase or one bugfix.
- Run `npm run check:text`, `npm run lint`, and `npm run build` before pushing.
- Update `CHANGELOG.md` under `[Unreleased]` when adding visible behavior, scripts, docs, or deployment changes.
