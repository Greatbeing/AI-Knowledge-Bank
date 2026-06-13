# Phase 2 Vault Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the shared vault pages with readable fallbacks, structured filters, node details, clearer states, and community validation result feedback.

**Architecture:** Keep the static HTML + shared `assets/vault-page.js` and `assets/vault-page.css` architecture. Add client-side state and DOM rendering only; do not change API routes, Supabase schema, dependencies, or deployment settings.

**Tech Stack:** Vite 6, TypeScript 5, vanilla JavaScript, CSS, Cloudflare Pages Functions fallback API.

---

## File Structure

- Modify `knowledge.html`, `tools.html`, `cases.html`, `community.html`: repair static fallback text and add shared filter/status/detail panel markup.
- Modify `assets/vault-page.js`: add filter state, detail panel behavior, result status rendering, unavailable state, and validation result rendering.
- Modify `assets/vault-page.css`: style filter controls, status text, detail panel, card action button, and validation result.
- Verify with `node --check assets/vault-page.js`, targeted mojibake scan, `npm run lint`, and `npm run build`.

---

### Task 1: Repair Vault HTML Templates

**Files:**
- Modify: `knowledge.html`
- Modify: `tools.html`
- Modify: `cases.html`
- Modify: `community.html`

- [ ] Replace static Chinese fallback text in each page with readable equivalents. The runtime `data-i18n` keys must remain unchanged.
- [ ] Add toolbar controls to each page:

```html
<div class="toolbar">
  <input id="page-search" class="search-input" type="search" placeholder="筛选当前页面内容" />
  <select id="source-filter" class="filter-select" aria-label="Filter by source">
    <option value="all">全部来源</option>
    <option value="supabase">Supabase</option>
    <option value="fallback">Demo</option>
  </select>
  <select id="trust-filter" class="filter-select" aria-label="Filter by minimum trust">
    <option value="0">全部可信度</option>
    <option value="70">70%+</option>
    <option value="80">80%+</option>
    <option value="90">90%+</option>
  </select>
  <span id="result-status" class="result-status" role="status" aria-live="polite">正在加载</span>
</div>
```

- [ ] Add a shared detail panel near the end of each body before the script:

```html
<div id="detail-panel" class="detail-panel" aria-hidden="true">
  <div class="detail-backdrop" data-detail-close></div>
  <article class="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
    <button class="detail-close" type="button" data-detail-close aria-label="Close detail">×</button>
    <div id="detail-content"></div>
  </article>
</div>
```

- [ ] In `community.html`, add:

```html
<div id="validation-result" class="validation-result" aria-live="polite"></div>
```

inside the existing `.action-panel`, after `#status-line`.

---

### Task 2: Add Client-Side Filters And Detail Panel

**Files:**
- Modify: `assets/vault-page.js`

- [ ] Add DOM references for `source-filter`, `trust-filter`, `result-status`, `detail-panel`, `detail-content`, and `validation-result`.
- [ ] Update `renderNodes` to filter by:
  - text query
  - selected source, using `latestSource`
  - minimum trust, using `node.confidence`
- [ ] Update result status after each render.
- [ ] Add a details button to each card and an `openDetail(node)` function.
- [ ] Add `closeDetail()` plus click handlers for `[data-detail-close]` and Escape key.
- [ ] Render detail fields using `textContent` or created elements, not `innerHTML`.
- [ ] In `submitCommunityValidation`, render a structured validation result from the API response.

---

### Task 3: Style Filters, Details, And Validation Result

**Files:**
- Modify: `assets/vault-page.css`

- [ ] Add `.filter-select`, `.result-status`, `.card-actions`, `.detail-button`, `.detail-panel`, `.detail-panel.is-open`, `.detail-backdrop`, `.detail-dialog`, `.detail-close`, `.detail-meta`, `.detail-tags`, `.detail-section`, and `.validation-result` styles.
- [ ] Ensure mobile layout stacks filters cleanly.
- [ ] Ensure detail panel is usable on mobile with max-height and scroll.

---

### Task 4: Validate

**Files:**
- Inspect: `knowledge.html`
- Inspect: `tools.html`
- Inspect: `cases.html`
- Inspect: `community.html`
- Inspect: `assets/vault-page.js`
- Inspect: `assets/vault-page.css`

- [ ] Run:

```bash
node --check assets/vault-page.js
```

- [ ] Run:

```bash
rg -n "鐭|涓|鈥|鈹|�|俙|鍚|绋|杩|楠|璺" knowledge.html tools.html cases.html community.html assets/vault-page.js assets/vault-page.css
```

- [ ] Run:

```bash
npm run lint
```

- [ ] Run:

```bash
npm run build
```

- [ ] Confirm `dist/knowledge.html`, `dist/tools.html`, `dist/cases.html`, and `dist/community.html` exist.

