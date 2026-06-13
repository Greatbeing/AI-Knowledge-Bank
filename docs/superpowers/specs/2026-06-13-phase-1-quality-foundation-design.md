# Phase 1 Quality Foundation Design

## Context

AI Knowledge Bank is a Vite, TypeScript, Tailwind, Cloudflare Pages Functions, and Supabase-backed prototype for a three-vault knowledge evolution platform. The project already has a landing experience, vault pages, API endpoints, Supabase migrations, and deployment documentation.

The current highest-impact issue is visible text corruption in Chinese content. Mojibake appears in public-facing documentation, page dictionaries, fallback API data, and some comments. This makes the product look broken before users can evaluate the core idea.

## Goal

Restore baseline product quality by fixing public-facing text corruption and ensuring the project still passes lint and build checks.

## Scope

This phase will:

- Fix user-facing Chinese copy in `README.md`.
- Fix Chinese page dictionary strings in `assets/vault-page.js`.
- Fix Chinese fallback node data and fallback response strings in `functions/api/[[path]].js`.
- Fix the most visible mojibake in developer-facing docs that are likely to be read by contributors.
- Keep the existing bilingual positioning.
- Preserve current product architecture and deployment targets.
- Run `npm run lint` and `npm run build`.

This phase will not:

- Redesign the UI.
- Rewrite the large `index.html` into React components.
- Change Supabase migrations or production schema.
- Add dependencies.
- Add real AI model integration.
- Deploy or publish changes.

## Design

### Public Copy

Chinese copy should be restored to clear simplified Chinese while preserving the existing English copy. The tone should be product-oriented and concrete:

- Explain the three vaults: Knowledge, Tools, Cases.
- Explain Cross-Vault RAG and Community Evolution.
- Explain that the project can run as a static demo without Supabase and can use Supabase for full backend workflows.

### Vault Page Runtime Text

`assets/vault-page.js` contains the runtime language dictionary for `knowledge.html`, `tools.html`, `cases.html`, and `community.html`. The Chinese dictionary should be valid UTF-8 simplified Chinese. English dictionary content can remain mostly unchanged except for obvious broken toggle text.

The page should continue to support:

- Chinese/English language switching.
- Local storage language preference.
- Fallback demo data.
- Supabase-backed data when the API is configured.

### API Fallback Data

`functions/api/[[path]].js` contains fallback nodes used when Supabase is unavailable. These are part of the public API and must be readable. Replace corrupted Chinese fallback titles, summaries, recommendation reasons, synthesis text, fallback summaries, fallback titles, and generated reasons.

The API contract must remain unchanged:

- `GET /api/health`
- `GET /api/vaults`
- `GET /api/vaults/:id`
- `GET /api/search`
- `POST /api/community-signals`
- `GET /api/leaderboard`

### Documentation

Fix visible mojibake in docs that describe development status and project structure. This phase should avoid broad documentation rewrites; only repair text that is clearly corrupted or blocks understanding.

## Validation

Run:

```bash
npm run lint
npm run build
```

If either command fails, fix issues introduced or exposed by this phase before considering the phase complete.

Manual checks:

- Open or inspect `README.md` and confirm Chinese text renders normally.
- Inspect `assets/vault-page.js` and confirm Chinese dictionary strings are readable.
- Inspect `functions/api/[[path]].js` and confirm fallback API text is readable.

## Risks

- Some files may contain mixed historical encodings. The implementation should edit text as UTF-8 and avoid binary or tooling-based recoding that could corrupt unaffected files.
- `index.html` is very large and already appears to contain mostly readable Chinese. This phase should not attempt a full rewrite of it.
- API fallback wording should change only copy, not response shape.

## Success Criteria

- Public-facing Chinese text in the targeted files is readable.
- Existing bilingual behavior remains intact.
- API fallback responses still use the same fields.
- `npm run lint` passes.
- `npm run build` passes.

