# Phase 2 Vault Experience Design

## Context

Phase 1 restored baseline text quality and verified lint/build. The next highest-value product step is improving the shared vault experience used by `knowledge.html`, `tools.html`, `cases.html`, and `community.html`.

These pages already share `assets/vault-page.js` and `assets/vault-page.css`, which makes them a good target for a focused product slice. The current pages show cards and basic search, but users cannot inspect a node deeply, filter by structured dimensions, or see a useful result after submitting a community validation signal.

## Goal

Upgrade the vault pages from static card grids into a usable knowledge exploration flow with readable static fallbacks, structured filtering, node details, clearer state handling, and better community validation feedback.

## Scope

This phase will:

- Repair visible static fallback text in `knowledge.html`, `tools.html`, `cases.html`, and `community.html`.
- Add a shared node detail panel in the vault page template.
- Add structured filters to `assets/vault-page.js`:
  - source filter: all, Supabase, Demo
  - minimum trust filter
  - tag/text search using the existing search input
- Improve loading, empty, and unavailable states.
- Enhance community validation feedback to show the submitted signal details.
- Add CSS for the filter controls, detail panel, result status, and validation result.
- Preserve the current API contract and fallback data behavior.
- Run `npm run lint` and `npm run build`.

This phase will not:

- Rewrite `index.html`.
- Convert the app to React.
- Change Supabase schema or migrations.
- Add dependencies.
- Add authentication UI.
- Add real AI model integration.
- Deploy or publish changes.

## Design

### Static Fallback Text

The four vault HTML pages should contain readable Chinese text before JavaScript applies the runtime i18n dictionary. This avoids a broken first paint if scripts are slow, disabled, or fail.

### Filters

The existing toolbar should grow from a single search input into a compact filter bar:

- Search input: free text across title, summary, recommendation reason, source refs, and tags.
- Source select: all, Supabase, Demo.
- Minimum trust select: all, 70+, 80+, 90+.
- Result count/status text.

Filters apply client-side to the currently loaded nodes.

### Node Detail Panel

Each card should expose a clear detail action. Opening details should show:

- title
- vault type
- summary
- recommendation reason
- trust percentage
- emergence level
- validation/fork/merge counts
- source refs
- scenario tags
- created date if available
- data source: Supabase or Demo

The panel should be keyboard-accessible enough for this phase:

- close button
- escape key closes panel
- clicking backdrop closes panel
- detail button has descriptive text

### State Handling

The page should distinguish:

- Loading: data request in progress.
- Empty: loaded successfully but no nodes match filters.
- Fallback: API responded with demo data.
- Unavailable: API request failed and no nodes are available.

### Community Validation Feedback

After clicking "Run Community Validation", the community page should show a compact result card:

- persisted or queued status
- signal type
- weighted impact
- confidence
- source

If the backend is unavailable, the user should still see that the result was kept as demo/local state.

## Validation

Run:

```bash
npm run lint
npm run build
```

Manual/static checks:

- Search targeted files for known mojibake fragments.
- Check `node --check assets/vault-page.js`.
- Inspect built output exists for all four vault pages.

## Risks

- The vault pages are static HTML templates; changes must be made consistently across all four files.
- `assets/vault-page.js` is shared by all vault pages, so page-specific behavior must remain guarded by `pageType`.
- The detail panel should not depend on Supabase-only fields because fallback data must keep working.

## Success Criteria

- Four vault HTML files have readable static fallback text.
- Users can filter nodes by text, source, and minimum trust.
- Users can open and close node details from cards.
- Community validation gives a visible structured result.
- `npm run lint` passes.
- `npm run build` passes.

