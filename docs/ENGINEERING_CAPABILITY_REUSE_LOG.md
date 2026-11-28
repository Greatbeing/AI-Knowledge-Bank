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

The first CI installation also reported 23 dependency vulnerabilities (10 moderate, 13 high). No automatic audit fix was applied because dependency upgrades are outside this ingestion change and may be breaking; this requires a separate dependency-by-dependency security triage. The corrected counts and full CI result must be recorded only after the latest run completes.

## Required decision record for future engineering tasks

Before implementing a non-trivial subsystem, record:

1. Task and measurable acceptance criteria.
2. GitHub search terms / candidate repositories / exact versions considered.
3. Functional fit, maintenance, compatibility, license, security, evidence and integration cost.
4. Decision: `reuse`, `compose`, `build_gap`, `defer` or `reject`.
5. Source URL, immutable version, license status and verification evidence.
6. Test result and known limitations after integration.

**No automatic installation or execution:** discovery produces candidates, not permission. Dependencies require explicit review; executable tools require adapters, sandboxing, least privilege and authorization.
