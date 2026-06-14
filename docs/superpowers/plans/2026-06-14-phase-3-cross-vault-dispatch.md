# Phase 3 Cross-Vault Dispatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared Cross-Vault Dispatch panel to the four dedicated vault pages.

**Architecture:** Reuse the existing static HTML pages plus the shared `assets/vault-page.js` and `assets/vault-page.css` files. The panel calls the existing `/api/search` endpoint and falls back to local static dispatch results when the API is unavailable.

**Tech Stack:** HTML, vanilla JavaScript, CSS, Vite build, ESLint.

---

### Task 1: Add Shared Dispatch Markup

**Files:**
- Modify: `knowledge.html`
- Modify: `tools.html`
- Modify: `cases.html`
- Modify: `community.html`

- [ ] **Step 1: Insert the dispatch panel before each page toolbar**

Add this markup before the existing toolbar block on each page:

```html
<section class="dispatch-panel" aria-labelledby="dispatch-title">
  <div class="dispatch-copy">
    <span class="panel-kicker" data-i18n="dispatchKicker">Cross-Vault Dispatch</span>
    <h2 id="dispatch-title" data-i18n="dispatchTitle">用一个场景调度知识、工具和案例</h2>
    <p data-i18n="dispatchCopy">输入你的目标或问题，系统会跨三库组合认知解释、执行路径和案例证据。</p>
  </div>
  <form id="dispatch-form" class="dispatch-form">
    <input id="dispatch-query" class="dispatch-input" type="search" autocomplete="off" data-i18n-placeholder="dispatchPlaceholder" placeholder="例如：跨境营销团队要优化 AI 本地化 SOP" />
    <button id="dispatch-run" class="dispatch-button" type="submit" data-i18n="dispatchRun">运行调度</button>
  </form>
  <p id="dispatch-status" class="dispatch-status" aria-live="polite" data-i18n="dispatchReady">准备调度三库内容</p>
  <div id="dispatch-results" class="dispatch-results" aria-live="polite">
    <article class="dispatch-result" data-dispatch-layer="knowledge"></article>
    <article class="dispatch-result" data-dispatch-layer="tools"></article>
    <article class="dispatch-result" data-dispatch-layer="cases"></article>
  </div>
</section>
```

- [ ] **Step 2: Run a syntax scan**

Run:

```bash
rg -n "dispatch-panel|dispatch-form|dispatch-results" knowledge.html tools.html cases.html community.html
```

Expected: each page has one `dispatch-panel`, one `dispatch-form`, and one `dispatch-results`.

### Task 2: Implement Dispatch State And Rendering

**Files:**
- Modify: `assets/vault-page.js`

- [ ] **Step 1: Add dictionary keys**

Add Chinese and English keys for:

```javascript
dispatchKicker
dispatchTitle
dispatchCopy
dispatchPlaceholder
dispatchRun
dispatchRunning
dispatchReady
dispatchFallback
dispatchNoResults
dispatchKnowledge
dispatchTools
dispatchCases
dispatchSynthesis
dispatchSource
```

- [ ] **Step 2: Add DOM references**

Add constants for:

```javascript
const dispatchForm = document.getElementById('dispatch-form');
const dispatchQuery = document.getElementById('dispatch-query');
const dispatchRunButton = document.getElementById('dispatch-run');
const dispatchStatus = document.getElementById('dispatch-status');
const dispatchResults = document.getElementById('dispatch-results');
```

- [ ] **Step 3: Add fallback dispatch data**

Create a language-keyed fallback object containing one Knowledge, one Tools, and one Cases result. Each result should include `title`, `summary`, and `confidence`.

- [ ] **Step 4: Render dispatch results with safe DOM APIs**

Implement:

```javascript
function renderDispatchResult(layer, item, source) {}
function renderDispatchPayload(payload, source) {}
function buildFallbackDispatch(query) {}
```

Use `textContent`, `replaceChildren`, `createElement`, and existing `createTag()`.

- [ ] **Step 5: Submit dispatch queries**

Implement:

```javascript
async function runCrossVaultDispatch(query) {}
```

The function should:

- Trim the query.
- Use the fallback default query if the input is empty.
- Disable the run button while loading.
- Call `/api/search?q=${encodeURIComponent(query)}&locale=${currentLanguage}&limit=1` through the existing API helper.
- Render API results when available.
- Render fallback results on errors or empty results.
- Re-enable the button in `finally`.

- [ ] **Step 6: Wire events and language updates**

Add:

```javascript
dispatchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  runCrossVaultDispatch(dispatchQuery?.value || '');
});
```

Update `applyLanguage()` to set the dispatch input placeholder and re-render the current dispatch payload.

- [ ] **Step 7: Run JavaScript syntax check**

Run:

```bash
node --check assets\vault-page.js
```

Expected: no output and exit code 0.

### Task 3: Style The Dispatch Panel

**Files:**
- Modify: `assets/vault-page.css`

- [ ] **Step 1: Add desktop styles**

Add styles for:

```css
.dispatch-panel
.dispatch-copy
.panel-kicker
.dispatch-form
.dispatch-input
.dispatch-button
.dispatch-status
.dispatch-results
.dispatch-result
.dispatch-result h3
.dispatch-result p
.dispatch-result-meta
```

The layout should use two columns for copy and input at desktop width, then a three-column result grid.

- [ ] **Step 2: Add mobile styles**

Inside the existing `@media (max-width: 720px)` block, stack the dispatch panel, form, and results into one column.

### Task 4: Verify And Publish

**Files:**
- Inspect: working tree

- [ ] **Step 1: Run core verification**

Run:

```bash
node --check assets\vault-page.js
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 2: Confirm build artifacts**

Run:

```bash
Test-Path dist\knowledge.html; Test-Path dist\tools.html; Test-Path dist\cases.html; Test-Path dist\community.html
```

Expected: four `True` lines.

- [ ] **Step 3: Check status**

Run:

```bash
git status --short --branch
```

Expected: only intended files are modified.

- [ ] **Step 4: Commit**

Run:

```bash
git add knowledge.html tools.html cases.html community.html assets/vault-page.js assets/vault-page.css docs/superpowers/specs/2026-06-14-phase-3-cross-vault-dispatch-design.md docs/superpowers/plans/2026-06-14-phase-3-cross-vault-dispatch.md
git commit -m "feat: add cross-vault dispatch panel"
```

- [ ] **Step 5: Push**

Run:

```bash
git push origin main
```

Expected: `main -> main`.
