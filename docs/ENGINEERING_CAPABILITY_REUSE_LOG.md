# Engineering Capability Reuse Log

> Purpose: make AI Knowledge Bank's own development the first live validation of its capability discovery and reuse philosophy.
> Scope: engineering dependencies, GitHub-native services, developer tools and reusable workflows.
> Rule: record the decision and evidence; do not add a dependency merely because it exists.

## Decision record 001 — Phase 1 read-only GitHub ingestion

**Task:** discover and normalize capability assets from three pinned public repositories without executing source code or writing to production systems.

| Need | Existing capability evaluated / reused | Decision | Evidence and boundary |
|---|---|---|---|
| Read repository trees and immutable source files | GitHub REST Git Trees API + raw file endpoints | Reuse | Fetch recursive trees at full Commit SHA; fetch only allowlisted files; preserve Blob SHA and source URL. No clone, checkout or credential-bearing workflow is needed for this read-only task. |
| HTTP transport | Node.js built-in `fetch` | Reuse | Sufficient for the small, deterministic set of public GitHub API and raw-content requests. No additional HTTP client dependency. |
| Stable source fingerprints | Node.js `node:crypto` SHA-256 | Reuse | Deterministic content fingerprints are generated from canonicalized JSON/source content. |
| Frontmatter parsing | Existing `js-yaml` 4.2.0 already present in the lockfile | Reuse and declare directly | Use YAML parsing rather than a hand-written partial YAML parser. Parse metadata only; never execute embedded prompts or scripts. |
| Manifest validation | Existing `ajv` 6.15.0 already present in the lockfile | Reuse and declare directly | Validate each normalized record against the canonical Draft-07 Manifest schema, in addition to importer-specific invariants. |
| Unit and integration tests | Existing Vitest setup | Reuse | Tests mock GitHub responses and cover deterministic output, YAML frontmatter, source provenance, Atom/Primitive relationships and safety boundaries. |
| Continuous integration | Existing GitHub Actions Pull Request CI | Extend | CI runs lint, tests, a real pinned-source read-only import, completeness assertions and production build checks. |
| Repository cloning | Git clone / checkout | Defer | The Git Trees and raw-content APIs cover this read-only inventory. Cloning would add storage and checkout complexity without improving this task. |
| General-purpose GitHub SDK | Octokit | Defer | Native `fetch` is sufficient for the current read-only API surface. Reassess when authenticated pagination, retries, rate-limit policy or write operations become necessary. |
| Arbitrary repository tools and scripts | Third-party repository code | Reject for ingestion | Discovery and parsing do not imply execution permission. No fetched code, prompt or agent instruction is run. |

### Observed result

The first full CI import before the completeness correction exposed a real data-quality defect: 25 concise Atom descriptions were being dropped by a minimum-length check, and the Cangjie authoring workflow was being misclassified as an eighteenth writing engine. The importer was corrected to:

- extract short Atom definitions from their original Markdown source files;
- preserve all 182 domain primitives and separately account for the 4 general primitives;
- model the 17 writing engines separately from the Cangjie engine-authoring workflow;
- fail CI if any source primitive lacks a normalized Manifest record;
- validate normalized records against the canonical JSON Schema;
- keep all imported records unverified and license status at `review_required`.

The first CI installation also reported 23 dependency vulnerabilities (10 moderate, 13 high). No automatic audit fix was applied because dependency upgrades are outside this ingestion change and may be breaking; this requires a separate dependency-by-dependency security triage. The corrected pinned-source CI run completed successfully. It emitted 231 records: 17 engines, 1 Cangjie authoring workflow, 182 domain primitives, 4 general primitives, and 27 AKB seed records (9 knowledge, 9 tools, 9 cases). Atom/Primitive missing and orphan mappings: 0; duplicate IDs: 0; missing Manifest primitive IDs: 0; schema/manual validation errors: 0; importer issues: 0. CI passed text health, lint, all tests, live read-only import, TypeScript/Vite build and build-output verification.

## Required decision record for future engineering tasks

Before implementing a non-trivial subsystem, record:

1. Task and measurable acceptance criteria.
2. GitHub search terms / candidate repositories / exact versions considered.
3. Functional fit, maintenance, compatibility, license, security, evidence and integration cost.
4. Decision: `reuse`, `compose`, `build_gap`, `defer` or `reject`.
5. Source URL, immutable version, license status and verification evidence.
6. Test result and known limitations after integration.

**No automatic installation or execution:** discovery produces candidates, not permission. Dependencies require explicit review; executable tools require adapters, sandboxing, least privilege and authorization.


## Decision record 002 — GitHub capability candidate discovery

**Task:** turn an engineering need into a shortlist of public GitHub repositories for human evaluation.

| Need | Existing capability evaluated / reused | Decision | Evidence and boundary |
|---|---|---|---|
| Search public repository metadata | GitHub REST `search/repositories` endpoint | Reuse | Implemented in `scripts/github-capability-discovery.mjs`; accepts a natural-language/qualifier query and returns up to 30 repository candidates. |
| Candidate triage | GitHub-provided search relevance, pushed timestamp, SPDX identifier, description/topics, stars and forks | Compose | Transparent weighted signals; stars/forks are weak ecosystem signals only. The result is a shortlist, never a quality or security certification. |
| Test search behavior | Vitest with mocked GitHub Search API response | Reuse | Query construction, candidate ordering, archived/stale/license handling and non-verified status are covered without consuming GitHub API quota. |
| Execution / installation | Clone, package installation or repository scripts | Reject at discovery stage | The discovery tool reads metadata only. It does not clone, install, run code, or mark candidates executable. |

The discovery CLI is implemented and its mocked API contract is covered by CI. A real query against the public GitHub Search API remains a manual smoke test; rate limits and authentication policy must be considered before automation at scale.


## Decision record 003 — Retrieval engine selection and baseline

**Task:** establish a reproducible retrieval baseline over the normalized 231-record catalog before selecting a production search engine.

### Existing candidates discovered

| Candidate | Observed repository/package evidence | Initial assessment | Decision |
|---|---|---|---|
| MiniSearch | `lucaong/minisearch`, package `7.2.0`, package metadata declares MIT; inspected default-branch commit `3d239d1c3ae7aef1bf5d8945dd7b5f0709f646f5` dated 2025-09-16 | Small full-text search engine with fuzzy/prefix support; latest inspected commit is relatively old; repository LICENSE file was not resolved in the initial path check and must be verified before adoption | Defer |
| Fuse.js | `krisk/Fuse`, inspected package `7.6.0-beta.6`, package metadata declares Apache-2.0; inspected commit `b7590957d868fcd68634b3546b893ae1633a49b1` dated 2026-11-24 | Mature fuzzy-search approach; inspected package version is a beta build, so production selection should use a stable release and benchmark it against Chinese/English mixed queries | Defer |
| FlexSearch | `nextapps-de/flexsearch`, package `0.8.215`, package metadata declares Apache-2.0; inspected commit `f7ed963096a0792da7b2fd63bb7114b3fbac55ed` dated 2026-05-29 | Full-text search with broad indexing features; latest inspected commit message is a command-injection vulnerability fix, which requires review of the fix and dependency/security posture before adoption | Defer; security review required |

Repository discovery and package metadata are evidence for candidate triage only. They do not establish fitness, legal compatibility, security, or task-level performance. No candidate was installed or executed.

### Baseline implementation

- Added `scripts/evaluate-catalog-retrieval.mjs`, a dependency-free offline lexical baseline using weighted title, tag, description and summary matches, with Chinese character n-grams.
- Added `data/retrieval-benchmark.phase1.json`, now a 25-task human-labeled seed benchmark across writing, reasoning and verification tasks, including paraphrased and colloquial task formulations.
- Added Recall@5, Mean Reciprocal Rank (MRR) and NDCG@5 reporting.
- Added tests for Chinese/English tokenization, ranking and metric calculation.
- Added CI gates to evaluate the actual pinned-source catalog after import.

### Observed CI result

On commit `34b72475d1650de29ed3ff74fff70551f1268e4a`, GitHub Actions run [46120234581](https://github.com/Greatbeing/AI-Knowledge-Bank/actions/runs/46120234581) completed successfully:

- 146 tests across 11 test files passed.
- Catalog import: 231 records; 17 engines; 1 authoring workflow; 182 domain primitives; 4 general primitives; 27 AKB seed records.
- Expanded retrieval seed benchmark (25 tasks): Recall@5 = 0.9600; MRR = 0.7993; NDCG@5 = 0.8386; Precision@1 = 0.7200; Precision@5 = 0.1920 (theoretical ceiling is 0.2000 when each task has one relevant asset).
- Lint, text health, pinned-source reconciliation, schema validation, TypeScript/Vite build and build-output checks passed.

**Interpretation limit:** the expanded 25-task score is a seed benchmark, not evidence of production retrieval quality. Precision@5 = 0.1920 is close to its 0.2000 ceiling under the current one-relevant-asset-per-task labels; it must not be interpreted as a poor score. Precision@1 is added to make first-result accuracy easier to interpret. High Recall@5 still does not establish production retrieval quality. The next benchmark revision should add independently reviewed relevance judgments, ambiguous and multi-intent requests, misspellings, hard distractors, negative/no-match tasks, and lifecycle/license filters. Candidate engines should be compared on the same corpus and split before selecting or adding a dependency.

### Next decision

Keep the lexical baseline as a transparent control. Expand the benchmark first; then compare MiniSearch, Fuse.js, FlexSearch and a Chinese-aware semantic/hybrid approach on the same judged tasks. Select based on relevance, latency, bundle size, index size, operational complexity, licensing and security—not popularity or stars.


## Decision record 004 — Retrieval benchmark expansion

**Task:** reduce the risk of overfitting the lexical baseline to direct keyword queries.

- Expanded the manually curated seed set from 10 to 25 tasks, adding colloquial paraphrases, indirect task descriptions and professional task formulations across the existing 17 writing engines and 4 general reasoning/verification primitives.
- Added Precision@5 alongside Recall@5, MRR and NDCG@5 so the report exposes irrelevant results in the top-five list, not only whether a relevant result appears.
- Kept the original 10 tasks for continuity; new judgments are explicit and inspectable in `data/retrieval-benchmark.phase1.json`.
- The expanded set is still a seed benchmark, not an independently adjudicated production benchmark. Scores must be reported with this limitation and reviewed for ambiguous/overlapping intents before any production engine decision.


The 25-task benchmark is an intermediate checkpoint. The CI threshold currently checks the task count, minimum Recall@5 and minimum MRR; Precision@5 is reported but not yet gated because the relevance judgments are a small seed set and the precision baseline needs further calibration.


## Decision record 005 — Reuse-first policy implemented in Cognitive Engine

**Decision:** operationalize ADR-0002 as a deterministic planning policy, not merely a development guideline.

- Added `cognitive_engine/reuse_policy.py` with explicit candidate gates for task fit, lifecycle, verification, license, security and compatibility.
- Added `route_with_reuse()` so external catalog candidates are considered before the internal primitive router.
- Supported actions: `reuse`, `compose`, `adapt`, `defer`, and `build_gap`.
- Composition requires explicit composability and complete coverage of declared task capabilities. A partial set is not silently treated as sufficient.
- Unknown license/security/verification states defer for review. Known incompatible or deprecated candidates are rejected.
- Extended RoutingDecision contracts and added a Python 3.11 GitHub Actions test workflow.
- Latest Cognitive Engine CI: [run 46122068057](https://github.com/Greatbeing/cognitive-engine/actions/runs/46121822275), 27 tests passed; one pre-existing companion-repository integration test skipped because the companion repository is not checked out in the workflow.
- Draft implementation PR: https://github.com/Greatbeing/cognitive-engine/pull/1.

**Boundary:** this is the first policy implementation with explicit candidate input; it is not yet connected to the live AI Knowledge Bank catalog. The policy never executes candidates and always returns `execution_authorized=false`. `build_gap` authorizes designing a capability only, not deploying or executing it.

**Next validation:** connect real catalog candidates and run paired reuse-first versus generate-first tasks. Compare task success, output quality, total cost, latency, integration time, maintenance burden and security outcomes. Reuse rate is diagnostic, not an independent optimization target.
