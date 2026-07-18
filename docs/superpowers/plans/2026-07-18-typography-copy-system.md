# Typography and Copy System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the six-page bilingual copy and typography system around trustworthy public knowledge and community validation.

**Architecture:** Keep the current Vite, HTML, Tailwind CDN, vanilla JavaScript, and Supabase flows. Add a shared typography stylesheet, update page-owned translation dictionaries, and add Dashboard translations through the existing shared i18n module without changing backend interfaces.

**Tech Stack:** Vite 6, HTML5, CSS, vanilla ES modules, Vitest, Supabase client.

---

### Task 1: Add failing content and typography contracts

**Files:**
- Create: `tests/typography-copy.test.js`

- [ ] Assert all six pages load the shared typography stylesheet and the Noto Serif SC/Noto Sans SC font pair.
- [ ] Assert the approved hero, four vault-page promises, dual CTAs, real-metric placeholders, and Dashboard bilingual hooks.
- [ ] Assert the homepage no longer contains the superseded slogan, fake metric literals, or redundant static sections.
- [ ] Run `npm test -- tests/typography-copy.test.js` and confirm it fails for missing implementation.

### Task 2: Install the shared typography system

**Files:**
- Create: `assets/typography.css`
- Modify: `index.html`, `dashboard.html`, `knowledge.html`, `tools.html`, `cases.html`, `community.html`, `assets/vault-page.css`

- [ ] Load Noto Serif SC, Noto Sans SC, and JetBrains Mono consistently and link `assets/typography.css` last.
- [ ] Define display/body/mono roles, restrained weights, readable measures, balanced wrapping, language-specific tracking, tabular figures, and responsive scales.
- [ ] Rework the home and vault hero grids at desktop and mobile breakpoints without changing functional IDs.
- [ ] Run the focused test and confirm typography contracts pass.

### Task 3: Rewrite and shorten the homepage

**Files:**
- Modify: `index.html`

- [ ] Replace the hero, method preview, vault, community, live-data, dispatch, validation, CTA, metadata, and status copy in both languages.
- [ ] Replace invented metric defaults with neutral placeholders and map real knowledge/tool/case counts from `/api/vaults`.
- [ ] Remove repeated static Vision/Mission, Two Engines, Experience Map, and Ecosystem sections; retain working method, live-vault, dispatch, evolution, and validation surfaces.
- [ ] Preserve the legacy `#dispatch` anchor near the live dispatch surface and remove navigation entries for deleted anchors.
- [ ] Run focused tests, `npm run check:text`, and `npm run lint`.

### Task 4: Rewrite the vault and community experience

**Files:**
- Modify: `assets/vault-page.js`, `assets/vault-page.css`, `knowledge.html`, `tools.html`, `cases.html`, `community.html`

- [ ] Give each page one concise promise and rewrite page intros, section copy, insights, search/filter labels, details, dispatch, validation, empty/error states, metadata, and footer in both languages.
- [ ] State explicitly that demo signals are local and real-node signals require a signed-in verified session.
- [ ] Keep the current API requests, node rendering, RLS-safe validation flow, and active navigation behavior unchanged.
- [ ] Run focused tests and the existing API tests.

### Task 5: Make Dashboard typography and language consistent

**Files:**
- Modify: `dashboard.html`, `lib/shared/i18n.js`
- Test: `tests/typography-copy.test.js`, `tests/i18n.test.js`

- [ ] Add Dashboard translation keys and a language toggle that reads `language`, falls back to legacy `akb-lang`, and writes both for cross-page compatibility.
- [ ] Translate loading, auth-required, auth-unavailable, profile, stats, badges, activity, notifications, empty states, dates, logout, and error copy.
- [ ] Remove or disable the non-functional profile-edit affordance until editing exists.
- [ ] Keep OAuth, session loading, profile queries, and redirect behavior unchanged.
- [ ] Run focused tests and auth tests.

### Task 6: Verify and review

- [ ] Run `npm test`, `npm run lint`, `npm run check:text`, `npm run build`, `npm run check:dist`, and `npm audit --omit=dev`.
- [ ] Preview at 1440×900, 1024×768, and 390×844 in Chinese and English; inspect homepage, one vault page, Community, Dashboard auth-required, and Dashboard auth-unavailable.
- [ ] Check console errors, keyboard focus, 200% zoom, reduced motion, language persistence, legacy anchors, and horizontal overflow.
- [ ] Conduct a separate aesthetic review against the taste brief, fix the largest visible deviation, and re-run the affected checks.

