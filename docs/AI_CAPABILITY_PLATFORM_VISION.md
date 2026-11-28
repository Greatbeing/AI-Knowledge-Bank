# AI Knowledge Bank — AI Capability Platform Vision & Architecture

> Status: Proposed architecture baseline  
> Version: 0.1  
> Date: 2026-11-28

## 1. Product thesis

AI Knowledge Bank is not an AI tools directory. It is an **AI capability distribution and orchestration platform** that makes capabilities created across the global developer ecosystem accessible to ordinary people.

A user describes an outcome in natural language. The platform discovers relevant capabilities, explains why they fit, checks provenance and evidence, composes a safe execution plan, runs the approved workflow, evaluates the result, and captures reusable evidence.

**Positioning:** The AI Capability Layer for Everyone.  
**Promise:** Discover. Understand. Use. Verify. Improve.

The product must hide infrastructure complexity from end users. Users should not need to understand GitHub repositories, source code, package managers, API keys, MCP configuration, agent frameworks, or deployment steps to benefit from a capability.

## 2. Users and jobs to be done

### Everyday users
- Describe a task in plain language.
- Understand what the platform proposes and what it will do.
- Use a capability without installing or configuring developer tools.
- See evidence, limitations, permissions, cost expectations, and alternatives.
- Review, approve, stop, or undo consequential actions.

### Capability creators and developers
- Keep authoring and maintaining assets in their existing GitHub repositories.
- Publish a machine-readable capability manifest alongside source files.
- Receive attribution, usage signals, validation feedback, and contribution pathways.
- Retain ownership and control over source repositories.

### Reviewers and domain experts
- Verify claims, safety boundaries, reproducibility, and task fit.
- Attach evidence and evaluation results.
- Promote, challenge, deprecate, or revoke capability listings.

## 3. Core product loop

1. **Discover** — connect public or explicitly authorized GitHub repositories and other approved sources.
2. **Understand** — parse manifests, documentation, dependencies, interfaces, examples, licenses, and operating constraints.
3. **Match** — translate a user objective into task requirements and rank candidate capabilities.
4. **Compose** — build a plan from compatible knowledge, tools, agents, and workflows.
5. **Explain** — show the user the proposed plan, expected output, data access, permissions, risk, and cost before execution.
6. **Execute** — call approved adapters in a sandboxed or least-privilege runtime; never execute arbitrary repository code merely because it was discovered.
7. **Verify** — compare outputs against explicit acceptance criteria, tests, provenance, and human review where required.
8. **Evolve** — record usage and evidence, propose source changes through GitHub issues or pull requests, and refresh derived indexes.

A completed task is the unit of user value. A repository, model, prompt, or tool is only a possible implementation component.

## 4. System architecture

### A. GitHub: canonical content and collaboration layer

GitHub is the default source of truth for versioned, creator-owned capability assets:
- Knowledge documents and decision frameworks.
- Prompts, scripts, tools, agents, workflows, and integration adapters.
- Examples, tests, evaluation datasets, and case studies.
- Capability manifests, release notes, provenance, and evidence references.

Use repository, commit, release, issue, pull-request, and GitHub Actions metadata to preserve attribution, version history, review, and contribution workflows.

GitHub is **not** treated as a transactional database or an execution sandbox. API rate limits, repository permissions, private content, binary assets, dynamic user state, and high-frequency events require separate handling.

### B. Ingestion and indexing layer

A background ingestion pipeline:
- Registers repositories and authorized source scopes.
- Reads repository trees and relevant text files through GitHub APIs.
- Detects manifests and supported asset types.
- Parses metadata and extracts searchable content.
- Checks schema validity, license metadata, provenance, suspicious patterns, and dependency declarations.
- Creates a versioned catalog snapshot keyed by repository + path + commit SHA.
- Builds full-text and, later, semantic indexes.
- Rebuilds derived indexes from GitHub when needed; indexes are disposable, never the canonical copy.

Incremental sync should use commit SHAs and repository events where available. Add bounded retries, caching, rate-limit handling, and explicit sync status.

### C. Capability catalog and retrieval layer

Expose one stable catalog API regardless of source provider. Search should combine:
- Intent and task classification.
- Capability description and input/output compatibility.
- Domain, language, scenario, and constraints.
- Lifecycle and verification state.
- Evidence quality and recency.
- Permissions, risk, runtime availability, latency, and cost.

Start with deterministic metadata + full-text retrieval. Add embeddings and reranking only after baseline relevance can be measured.

### D. Cognitive Engine: planning and composition

The existing `cognitive-engine` remains the execution intelligence layer:
- Convert the user's objective into a typed TaskSpec.
- Decompose the task into steps and success criteria.
- Select compatible primitives and capability adapters.
- Produce an inspectable RoutingDecision and plan.
- Abstain, ask a clarifying question, or escalate when confidence or safety is insufficient.
- Emit a structured ExecutionTrace and EvaluationReport.

Keep its repository independently maintainable and connect through versioned contracts.

### E. Runtime and execution adapters

Use explicit adapters for supported execution modes, such as:
- Instructions / prompt-only.
- Hosted API.
- MCP tool.
- Sandboxed container or isolated job.
- Human-guided workflow.

Every executable capability must declare input/output contracts, permissions, network needs, secrets requirements, risk class, timeout, resource budget, and rollback/stop behavior.

Discovery never implies execution permission. Do not run arbitrary code, install arbitrary dependencies, or grant broad credentials automatically. Require explicit user approval for sensitive data access, external side effects, purchases, publication, account changes, or destructive operations.

### F. User experience layer

The default entry point is a single natural-language task box:

> What would you like to accomplish?

The experience should:
- Ask only for missing essential context.
- Show a short recommended plan in plain language.
- Explain why each capability was selected.
- Present evidence and limitations without overwhelming the user.
- Make permissions and external side effects explicit.
- Provide progress, result, citations/provenance, and next actions.
- Offer a simple way to rate the outcome and report failure.

Developer details remain available in an advanced view, not forced on ordinary users.

## 5. Source of truth vs operational data

Do not mirror the same canonical knowledge record in multiple stores.

| Data class | Authority | Notes |
| --- | --- | --- |
| Capability source, docs, manifests, examples, tests | GitHub repository | Versioned and attributable |
| Capability release / revision | Git commit or release | Pin executions to an immutable revision |
| Search catalog and embeddings | Rebuildable index | Derived from GitHub; safe to regenerate |
| User identity and access grants | Auth provider | Never store credentials in public repositories |
| Task sessions, execution traces, approvals | Operational store | Transactional, access-controlled, retention-aware |
| Feedback and moderation events | Operational event store, with curated summaries in GitHub | Do not write every runtime event as a Git commit |
| Cache and rate-limit counters | Cache / KV | Ephemeral, rebuildable |

Therefore, GitHub can remove the need for a separate database for the **knowledge asset corpus**, but it does not eliminate the need for operational state storage. Keep the existing database integration isolated behind repository interfaces until the replacement is proven. Do not delete migrations or production data as part of this architecture phase.

## 6. Capability lifecycle and trust

Use explicit lifecycle states:
- `discovered`: source found, not yet parsed.
- `parsed`: manifest and metadata parsed.
- `reviewed`: provenance, license, interface, and risk checks completed.
- `verified`: task-specific evidence meets a published threshold.
- `executable`: supported adapter, permissions, and runtime checks passed.
- `deprecated`: no longer recommended; historical record retained.
- `rejected`: failed policy, provenance, security, or quality review.

Never present an unverified repository's popularity, stars, or download counts as proof of capability quality. Separate source reputation, technical compatibility, and measured task performance.

## 7. Initial architecture decisions

1. GitHub is the canonical content source for versioned capability assets, not the whole application database.
2. The catalog API abstracts GitHub and future source providers from the frontend.
3. Repository ingestion is read-only by default; write access is opt-in and narrowly scoped.
4. The existing three-vault concept remains useful as a user-facing information architecture, but the underlying catalog should support richer capability types.
5. The three repositories retain separate responsibilities:
   - `AI-Knowledge-Bank`: discovery, catalog, evidence, community, user experience.
   - `cognitive-engine`: task planning, routing, composition, runtime contracts, evaluation.
   - `writing-engines`: domain capability packages and applied experiments.
6. No arbitrary code execution from a discovered GitHub repository.
7. Every recommendation and execution should be traceable to a repository, path, immutable commit, adapter version, and evaluation result.

## 8. Delivery roadmap

### Phase 0 — Architecture and contracts
- [x] Confirm product thesis and repository boundaries.
- [ ] Define the capability manifest schema and example.
- [ ] Define source connector and catalog API contracts.
- [ ] Map current database-backed features to canonical content vs operational state.
- [ ] Establish security, license, and trust review requirements.

### Phase 1 — GitHub read-only ingestion MVP
- Connect one public repository (start with the user's own three repositories).
- Read repository tree and supported text files.
- Parse capability manifests and generate a normalized catalog.
- Build deterministic full-text search.
- Show repository, file path, commit, license, lifecycle, and verification status.
- Keep all writes and execution disabled.

**Exit criteria:** repeatable sync; no duplicate source records; immutable provenance; tests for malformed manifests, deleted files, changed commits, API failures, and rate limits.

### Phase 2 — Ordinary-user capability discovery
- Replace tool-directory browsing with task-first discovery.
- Add task clarification, ranked capability cards, and plain-language explanations.
- Add evidence and limitation summaries.
- Complete responsive mobile navigation and a useful dashboard.

**Exit criteria:** representative non-developer users can find and understand a suitable capability without using GitHub directly.

### Phase 3 — Safe composition and execution
- Connect catalog results to Cognitive Engine TaskSpec and RoutingDecision.
- Implement allowlisted runtime adapters.
- Add approval gates, budgets, traces, and stop/rollback controls.
- Start with low-risk, reversible tasks.

**Exit criteria:** end-to-end tasks are reproducible, auditable, and measurably better than a model-only baseline.

### Phase 4 — Verification and capability evolution
- Collect structured feedback and task-specific evaluations.
- Propose improvements to source repositories through issues or pull requests.
- Promote verified revisions and deprecate stale or unsafe assets.
- Publish transparent capability scorecards.

**Exit criteria:** evidence-backed improvements, safe rollback, and measurable improvement in task success.

## 9. Non-goals for the first release

- Replacing GitHub as a developer collaboration platform.
- Executing every repository or arbitrary package.
- Building a universal agent marketplace before retrieval and verification work.
- Replacing all operational storage with Git commits.
- Treating stars, likes, model claims, or generated trust percentages as validation.
- Autonomous writes to user accounts, external services, or production infrastructure without explicit approval.

## 10. Product success metrics

Measure user outcomes, not catalog size alone:
- Task completion rate.
- Time from task description to usable result.
- Recommendation acceptance and successful execution rate.
- Evidence coverage and verified-capability share.
- Reuse rate across users and contexts.
- Failure, abstention, escalation, and rollback rates.
- Cost and latency per successful task.
- Percentage of users completing a task without opening GitHub or configuring developer tools.
