# Phase 3 Cross-Vault Dispatch Experience Design

## Context

Phase 2 upgraded the dedicated vault pages with readable fallbacks, structured filtering, node detail panels, and community validation feedback. The project already has a backend search contract at `GET /api/search?q=&locale=&limit=` that returns grouped Knowledge, Tools, and Cases results plus a synthesis string.

The homepage demonstrates Cross-Vault RAG, but the dedicated vault pages still work mainly as single-page browsing views. Phase 3 should make cross-vault dispatch available where users are already inspecting vault content.

## Goal

Add a shared Cross-Vault Dispatch panel to `knowledge.html`, `tools.html`, `cases.html`, and `community.html` so a user can enter a scenario and receive a combined knowledge explanation, tool path, case evidence, and synthesis without leaving the page.

## Scope

In scope:

- Add shared dispatch markup to all four vault pages.
- Reuse the existing `resolveApiBase()` and `fetchApi()` flow in `assets/vault-page.js`.
- Call `/api/search` with the current language and a compact result limit.
- Render three result lanes: Knowledge, Tools, Cases.
- Render the API synthesis text and data source state.
- Provide a local fallback route when the API fails or returns incomplete results.
- Keep the existing page filters, node detail modal, and community validation behavior intact.
- Style the panel in `assets/vault-page.css` with desktop and mobile layouts.

Out of scope:

- No new database migrations.
- No authentication, authoring, or write workflow.
- No changes to the Cloudflare API contract.
- No new dependency or framework.

## User Experience

Each vault page gets a dispatch panel near the top of the content area, before the local toolbar. The panel contains:

- A short title and copy explaining that the user can dispatch a scenario across all vaults.
- A text input with a default scenario.
- A run button.
- A synthesis/status line.
- Three result cards for Knowledge, Tools, and Cases.

On submit:

1. The button enters a loading state.
2. The panel requests `/api/search?q=<query>&locale=<currentLanguage>&limit=1`.
3. Each lane updates with title, summary, confidence, and source.
4. The synthesis line updates with the returned synthesis.
5. If the request fails, the panel renders local fallback content based on the current language.

Language switching should re-render dispatch labels and preserve the current query where possible.

## Data Contract

Expected API shape:

```json
{
  "ok": true,
  "query": "scenario",
  "locale": "zh",
  "source": "supabase",
  "results": {
    "knowledge": [{ "title": "...", "summary": "...", "confidence": 91 }],
    "tools": [{ "title": "...", "summary": "...", "confidence": 86 }],
    "cases": [{ "title": "...", "summary": "...", "confidence": 83 }]
  },
  "synthesis": "..."
}
```

The frontend must tolerate missing groups, missing confidence, empty synthesis, and failed network requests.

## Accessibility And Resilience

- The input should be usable with Enter.
- The status line should use `aria-live="polite"`.
- Render text with `textContent` and created nodes only.
- Keep the current no-`innerHTML` pattern in `assets/vault-page.js`.
- Do not block page browsing if dispatch fails.

## Acceptance Criteria

- All four vault pages contain the shared dispatch panel.
- Running a dispatch query updates Knowledge, Tools, Cases, and synthesis.
- API failure still shows usable local fallback content.
- Switching language updates panel labels.
- `node --check assets\vault-page.js` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Build output includes `knowledge.html`, `tools.html`, `cases.html`, and `community.html`.
