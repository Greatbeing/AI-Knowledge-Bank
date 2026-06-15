# Phase 4 Text Health Gate Design

## Context

The public site pages and vault experience now build successfully. During follow-up review, PowerShell displayed mojibake for several UTF-8 files, but direct Node.js reads confirmed the repository content is clean. The project still needs a reusable guard so real encoding regressions are caught by CI-style local checks instead of relying on terminal rendering.

## Goal

Add a reusable text health check and document it in the development flow so future changes do not reintroduce common mojibake patterns.

## Scope

In scope:

- Add a local text health script that scans public documentation and runtime source files for known mojibake fragments.
- Add an npm script so the check can run alongside `lint` and `build`.
- Update public development/deployment docs to include the new text health check.
- Verify Cloudflare API fallback copy using Node.js direct UTF-8 reads.
- Document the implementation plan under `docs/superpowers/plans/`.

Out of scope:

- No API schema changes.
- No Supabase migration changes.
- No frontend layout changes.
- No rewrite of historical Superpowers task documents, because those files intentionally contain old regex examples for prior repair work.
- No rewrite of clean runtime fallback strings.

## Design

Add `scripts/check-text-health.mjs` as a small Node.js verification utility. It recursively scans selected project files while skipping generated or historical folders such as `.git`, `node_modules`, `dist`, and `docs/superpowers`. It skips itself because it contains the signatures it searches for. It reports file, line, and matched fragment for common mojibake signatures including replacement characters, broken emoji bytes, and frequent UTF-8/GBK corruption fragments.

Document `npm run check:text` in the main verification flow. Update `DEVELOPMENT.md` into a current engineering status note, because it is the most useful place to explain when to run the new check. Add the command to deployment preflight checks.

For the API fallback copy, use Node.js direct reads to confirm `FALLBACK_NODES`, `buildSynthesis()`, `buildReason()`, `fallbackSummary()`, and `fallbackTitle()` are readable UTF-8. Since the strings are already clean, leave runtime API behavior unchanged.

## Acceptance Criteria

- A temporary bad sample makes the text health script exit `1`.
- `npm run check:text` passes on the repository.
- `npm run lint` passes.
- `npm run build` passes.
- `GET /api/search` fallback code remains compatible with the existing frontend contract.
- Public root documentation no longer contains common mojibake signatures.
