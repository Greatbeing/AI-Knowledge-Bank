# Phase 4 Text Health Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable text health gate and wire it into the project verification flow.

**Architecture:** Add one Node.js verification script and one npm script. Update development and deployment docs to include the new verification command, and audit API fallback strings with direct UTF-8 reads without changing API behavior.

**Tech Stack:** Node.js, npm scripts, Markdown, Cloudflare Pages Functions JavaScript, ESLint, Vite build.

---

### Task 1: Add Text Health Check

**Files:**
- Create: `scripts/check-text-health.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add a scanner script**

Create a Node.js script that scans `.md`, `.html`, `.js`, `.mjs`, `.ts`, `.tsx`, `.sql`, and `.json` files while skipping `.git`, `node_modules`, `dist`, `docs/superpowers`, generated caches, and the checker file itself. The script should print each file and line containing known mojibake fragments and exit with code `1` when any match exists.

- [ ] **Step 2: Add npm script**

Add:

```json
"check:text": "node scripts/check-text-health.mjs"
```

- [ ] **Step 3: Verify RED with a temporary sample**

Run:

```powershell
$temp = Join-Path $env:TEMP "akb-text-health-red"
New-Item -ItemType Directory -Force -Path $temp | Out-Null
Set-Content -Path (Join-Path $temp "bad.md") -Value "鐭ヨ瘑乱码" -Encoding utf8
Push-Location $temp
node "C:\Users\Administrator\Documents\Codex\2026-06-13\new-chat-2\work\AI-Knowledge-Bank\scripts\check-text-health.mjs"
Pop-Location
Remove-Item -LiteralPath (Join-Path $temp "bad.md")
Remove-Item -LiteralPath $temp
```

Expected: exit code `1`, with one match in `bad.md`.

### Task 2: Update Public Documentation

**Files:**
- Modify: `README.md`
- Modify: `DEVELOPMENT.md`
- Modify: `DEPLOYMENT_GUIDE.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update README verification commands**

Add `npm run check:text` to the build and verify command block.

- [ ] **Step 2: Rewrite DEVELOPMENT**

Replace outdated progress notes with a concise current engineering status, verification commands, architecture summary, and backlog.

- [ ] **Step 3: Update DEPLOYMENT_GUIDE**

Add `npm run check:text` to deployment preflight and smoke-check guidance.

- [ ] **Step 4: Update CHANGELOG**

Add the text health check under `[Unreleased]`.

### Task 3: Audit API Fallback Copy

**Files:**
- Inspect: `functions/api/[[path]].js`

- [ ] **Step 1: Inspect fallback nodes with Node.js**

Use Node.js direct reads to inspect `FALLBACK_NODES`.

- [ ] **Step 2: Inspect generated Chinese fallback text**

Use Node.js direct reads to inspect `buildSynthesis()`, `buildReason()`, `fallbackSummary()`, and `fallbackTitle()`.

- [ ] **Step 3: Preserve API shape**

Do not edit `functions/api/[[path]].js` if direct reads show readable UTF-8 fallback copy.

### Task 4: Verify And Publish

**Files:**
- Inspect: working tree

- [ ] **Step 1: Verify GREEN**

Run:

```bash
npm run check:text
node --check "functions/api/[[path]].js"
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 2: Check intended diff**

Run:

```bash
git status --short --branch
git diff --stat
```

Expected: only the Phase 4 docs, text check script, package script, and documentation updates changed.

- [ ] **Step 3: Commit and push**

Run:

```bash
git add README.md DEVELOPMENT.md DEPLOYMENT_GUIDE.md CHANGELOG.md package.json scripts/check-text-health.mjs docs/superpowers/specs/2026-06-15-phase-4-text-health-design.md docs/superpowers/plans/2026-06-15-phase-4-text-health.md
git commit -m "fix: repair text health and fallback copy"
git push origin main
```
