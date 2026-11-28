# Phase 1 — Repository Inventory & Ingestion Design

> Status: initial read-only inventory completed  
> Scope: public repository trees and selected text files only  
> Date: 2026-11-28  
> Target branch: `capability-platform-architecture`  
> Safety: no repository code executed; no production data, credentials, databases, or cloud accounts accessed.

## 1. Executive findings

The three repositories contain complementary but structurally different assets. They should be integrated through source-specific connectors, not flattened into a single generic document corpus.

| Repository | Default-branch tree SHA | Files | Approx. tracked bytes | Main asset classes |
|---|---|---:|---:|---|
| `Greatbeing/AI-Knowledge-Bank` | `37affd4c3d6caece2ebbaeb9857bbd03f5fd8792` | 88 | 986,052 | Existing product, three-vault seed data, API/workflow code, database migrations and docs |
| `Greatbeing/cognitive-engine` | `a9d90a873858cd180415776d2c34c7558d7ebbdc` | 23 | 249,076 | Primitive registry, schemas, routing/runtime/evaluation architecture and contracts |
| `Greatbeing/writing-engines` | `78b6ce37bcdad3dafb2e0134939920f2f617733f` | 988 | 6,473,683 | 17 writing engines, 182 atoms, examples, evaluation assets, references, docs and site output |

The inventories are snapshots of the repositories' default branches at the SHAs above. They are not claims that every file is a publishable capability.

### Key conclusion

There is already a substantial capability representation in the ecosystem:

- `writing-engines/atoms/index.json` contains **182 atom records**, spanning **17 engines** and **19 families**.
- `cognitive-engine/registry/writing-engines.json` already contains **182 imported writing primitives**, all currently marked `draft`.
- `cognitive-engine/registry/general.json` contains **4 general reasoning/verification primitives**.
- The existing cognitive primitive schema and importer provide a useful starting point. We should reuse and improve them rather than invent a competing primitive registry.
- The existing AI Knowledge Bank has a legacy three-vault content model and a working product/backend structure. It should be evolved through an adapter and compatibility layer, not replaced wholesale.

## 2. Repository-by-repository inventory

### 2.1 AI-Knowledge-Bank — product and user-facing catalog

**Observed stack and structure**

- 88 tracked files; about 986 KB.
- Vite 6, TypeScript, React 18, Tailwind CSS and Framer Motion.
- Cloudflare Pages Functions under `functions/api/`.
- Supabase/PostgreSQL integration, RLS and five SQL migration files.
- Existing workflow logic in `lib/workflow.ts`.
- Existing type definitions in `types/index.ts`.
- Seed/content files include `data/akb_seed_nodes.json`, `data/db.json` and `data/genesis_nodes.md`.

**Existing content contract**

The current `Node` type has a title, description, content object, legacy node type, optional `vault_type` (`knowledge | tool | case`), tags, trust score, language and timestamps. Cross-vault query/result contracts already group results into knowledge, tools and cases.

The existing API also contains normalization and fallback logic. The inspected search implementation performs basic text matching over title, summary, recommendation reason, tags and source references; the synthesis text is currently a deterministic template. This is a useful compatibility surface, but it is not yet the new task-first capability discovery/ranking system.

**Ingestion decision**

- Treat this repository as the product/catalog host and as one source of existing seed assets.
- Inventory and import only explicitly allowlisted, version-controlled seed records and documentation.
- Keep existing user-generated records, identity, community activity, workflow state and Supabase data out of the public GitHub ingestion pipeline.
- Do not reinterpret every legacy `tool` node as an executable tool. It may be a prompt, workflow description, agent recipe or link; execution capability must be typed and separately authorized.
- Preserve the legacy three-vault API during migration. Add new capability identifiers and mappings rather than breaking existing node IDs.

### 2.2 cognitive-engine — primitive, planning and execution contracts

**Observed structure**

- 23 tracked files; about 249 KB.
- Python package includes `registry.py`, `router.py`, `runtime.py` and `evaluation.py`.
- Two JSON schemas: `schema/primitive.schema.json` and `schema/contracts.schema.json`.
- Registries: `registry/writing-engines.json` and `registry/general.json`.
- Specifications define cognitive primitives and router contracts; docs describe architecture and evolution.

**Existing registry facts**

- Imported writing registry: 182 primitives, `kind=domain`, `domain=writing`, lifecycle `draft`.
- General registry: 4 primitives, including claim decomposition, counterexample search, evidence grounding and redline audit.
- The importer reads the writing atom index and source atom sections, then generates normalized primitive records with source references.
- The primitive schema already provides fields for purpose, family, kind, domain, tags, triggers, preconditions, inputs, procedure, outputs, evaluation, failure modes, safety constraints, transfer hypotheses, lifecycle and provenance.
- TaskSpec, RoutingDecision, ExecutionTrace and EvaluationReport are already represented in the contracts schema.

**Ingestion decision**

- Treat the cognitive registry as the canonical structured representation of cognitive primitives, subject to validation and freshness checks.
- Preserve the distinction between `domain` primitives distilled from writing engines and `general` primitives authored as general reasoning operations. Never blend them when making transfer or effectiveness claims.
- Import routing policies, task contracts and evaluation reports as separate asset types, not as primitives.
- Preserve lifecycle as supplied. A record marked `draft` must not be displayed as validated or stable.
- Compare the generated registry against the source atom index by stable IDs and source refs. Detect stale generated snapshots instead of silently treating them as authoritative.

### 2.3 writing-engines — applied capability assets

**Observed structure**

- 988 tracked files; about 6.47 MB.
- 17 engine directories with `SKILL.md` entrypoints.
- 182 machine-readable atom records in `atoms/index.json`, grouped into 19 families.
- Each engine may contain references, examples and `test-prompts.json`.
- The repository also contains evaluation experiments, teaching material, documentation/site HTML, draft pipelines and corpus-related directories.

**Existing capability contract**

The repository defines an engine as:

`engine = atomic techniques × style fingerprints × red-line review`

Its `SPEC.md` establishes a seven-part skill structure, progressive disclosure through references, measurable style fingerprints, positive alternatives for red lines, source/corpus discipline and admission checks. The README reports 17 engines, with 4 usable and 13 trial-stage engines. The repository's own evaluation documentation says the current overall evaluation results are not yet complete; therefore, engine existence must not be equated with demonstrated performance.

**Ingestion decision**

- Model a writing engine as a composite capability (a user-facing skill), and each atom as a reusable primitive.
- Preserve the engine-to-atom relationship, engine-specific references, examples, test prompts and evaluation evidence as linked assets.
- Use `SKILL.md` frontmatter for the initial name/description/trigger metadata; use the body for the operating procedure and constraints.
- Use `atoms/index.json` as the initial atom index, and resolve atom definitions through the referenced source file and heading.
- Do not ingest the entire repository as undifferentiated searchable text.
- Exclude `drafts/`, raw/local corpus material, unreviewed source text and blind-evaluation answer/key material from the public catalog by default. Evaluation summaries may be imported only with their methodology, status and visibility preserved.
- Respect the repository's LICENSE, NOTICE and its explicit corpus/quotation restrictions. Store source references and short capability descriptions; do not replicate copyrighted source works.

## 3. Unified asset taxonomy

The new catalog should distinguish **what an asset is** from **where/how it is displayed**.

| Asset type | Meaning | Primary source |
|---|---|---|
| `engine` | User-facing composite capability with triggers, workflow, constraints and expected outputs | writing-engines |
| `primitive` | Small, composable cognitive operation | cognitive-engine registry; writing atom source |
| `workflow` | Ordered or conditional multi-step task procedure | writing-engine workflow, cognitive composition specs, approved AKB assets |
| `tool` | External executable integration with an explicit adapter and permission model | Future connector/tool sources |
| `knowledge` | Explanatory reference, principle, standard or decision framework | AKB and approved documentation |
| `case` | Example, evaluation, validation report or demonstrated application | Approved examples and evaluation summaries |

The legacy `vault_type` is a presentation/grouping field, not a sufficient canonical type system. A primitive may appear under the Tools Vault in an experience while remaining typed as a `primitive` in the underlying catalog.

## 4. Connector contract — proposed v0.1

Each source connector should implement the same read-only lifecycle:

1. `discover(source_config, ref)` — resolve repository, branch/ref and tree SHA.
2. `enumerate(tree)` — list candidate files and classify by allowlist/denylist.
3. `parse(file, context)` — parse only supported formats; never execute repository code.
4. `normalize(parsed_asset)` — map source-specific data to the canonical record.
5. `validate(record)` — schema, required fields, lifecycle, license and provenance checks.
6. `emit(record)` — produce a deterministic import artifact.
7. `report()` — counts, skipped files, validation errors, stale references and content hashes.

Connector output must be deterministic for the same repository ref and parser version.

### Required source identity

Every imported record must retain:

- `source.repository`
- `source.ref` (immutable commit SHA)
- `source.path`
- `source.blob_sha`
- `source.anchor` (optional heading, JSON pointer or stable item ID)
- `source.url`
- `source.license` (verified value or `unknown`; never infer)
- `source.parser` and `source.parser_version`
- `content_hash` and `imported_at`

Canonical source identity should be stable across re-imports, for example:

`github:Greatbeing/writing-engines@<commit>:feature-writing/SKILL.md#能力边界`

A branch name alone is not a reproducible source identity. Branches move; the commit SHA and blob SHA provide traceability.

## 5. First-pass source allowlist

| Source | Initial allowlist | Exclusions / special handling |
|---|---|---|
| AI-Knowledge-Bank | Selected docs, explicit seed-node JSON, manifest/schema files | Exclude credentials, environment files, private user data, generated bundles and operational database contents |
| cognitive-engine | `registry/*.json`, `schema/*.json`, selected `spec/` and architecture docs, evaluation summaries | Do not execute Python; do not promote draft primitives; separate general/domain types |
| writing-engines | `atoms/index.json`, engine `SKILL.md`, selected references, examples and test prompts | Exclude `drafts/`, corpus/source full text, raw blind keys/answers and unrelated generated site output |

The allowlist is intentionally conservative. Expand it only after checking file purpose, licensing, privacy, structure and user value.

## 6. Normalization and relationship model

The first importer should preserve source-native identifiers and create platform identifiers without overwriting the original:

- Engine ID: `we.engine.<engine-slug>`
- Primitive ID: preserve cognitive-engine IDs where present; otherwise map source atom IDs to a stable namespace such as `we.atom.<engine-slug>.<atom-number>`.
- Source record ID: repository + immutable commit + path + anchor.

Relationships to retain:

- `engine CONTAINS primitive`
- `engine REFERENCES document`
- `engine HAS_EXAMPLE example`
- `engine TESTED_BY test_suite`
- `primitive BELONGS_TO family`
- `asset DERIVED_FROM source_asset`
- `evaluation EVALUATES asset_version`

Do not create semantic equivalence merely because two assets have similar names. Cross-repository links must be explicit or evidence-backed.

## 7. Trust and publication rules

Discovery, trust and execution are separate decisions.

- **Discovered:** parsed and indexed with source provenance.
- **Reviewed:** schema, license, source integrity and metadata checks passed.
- **Evaluated:** an evaluation record exists and its methodology/status is visible.
- **Validated:** evidence meets the relevant asset-type acceptance criteria.
- **Executable:** a reviewed adapter exists, permissions are declared, and the execution policy authorizes it.

A GitHub file being public does not make its contents safe to execute. A `SKILL.md` describes behavior; it is not permission to run arbitrary code. All code execution remains out of scope for this ingestion phase.

## 8. Phase 1 implementation sequence

### P1.1 — Freeze source snapshots
- Record default branch, commit SHA, tree SHA and license for all three repositories.
- Store a source manifest for each repository.
- Exit: every imported record can be traced to an immutable source snapshot.

### P1.2 — Implement read-only connectors
- Implement GitHub tree discovery and file retrieval.
- Implement parsers for JSON, Markdown frontmatter/sections and JSON Schema.
- Apply allowlists before content retrieval where possible.
- Exit: connector output is deterministic and no repository code is executed.

### P1.3 — Build the initial catalog import
- Import 17 writing engines and 182 atoms from source data.
- Import 182 existing domain primitive records and 4 general primitives from cognitive-engine, while detecting duplicate representation and stale snapshots.
- Import selected AKB seed nodes/docs through a compatibility adapter.
- Exit: source IDs, relationships, lifecycle and provenance survive round-trip validation.

### P1.4 — Validate and evaluate retrieval
- Build a small, manually reviewed query set covering writing, reasoning, research, verification and workflow tasks.
- Evaluate exact-source lookup, semantic retrieval, type filtering, lifecycle filtering and provenance display separately.
- Exit: retrieval returns relevant assets with explainable source references; no unsupported trust claims.

### P1.5 — Integrate the product surface
- Only after import and retrieval checks pass, expose the catalog to the existing UI through a versioned API.
- Preserve existing three-vault routes and data contracts during transition.
- Exit: a user can describe a task, see suitable capabilities and understand why each result is recommended, without needing GitHub knowledge.

## 9. Risks and unresolved questions

1. **Registry freshness:** the cognitive writing registry is a generated 182-record snapshot. The connector must compare it with the source atom index and importer version.
2. **Evaluation status:** 182 imported primitives are all marked `draft`; writing-engine availability and evaluation results vary. UI labels must reflect this.
3. **Atom parser coverage:** atom sections use more than one Markdown format. Import completeness must be measured; fallback-to-name records should be flagged, not silently accepted.
4. **License and corpus:** repository-level license does not automatically establish rights to every referenced work or corpus. Per-asset provenance and conservative exclusions are required.
5. **Legacy data semantics:** current AKB `knowledge/tool/case` categories do not map one-to-one to the new asset taxonomy.
6. **Operational storage:** GitHub is the canonical source for public, versioned capability assets, not a replacement for user identity, approvals, task sessions, execution traces or private feedback.
7. **Public repository access:** initial connector can use public GitHub APIs. Private repository support, rate-limit strategy and webhook sync require a separate permission/security design.

## 10. Immediate engineering decisions

- Reuse the cognitive primitive schema as the primitive-source contract, but add a platform-level wrapper for source identity, visibility, license, publication status and cross-asset relationships.
- Keep engine and primitive as separate asset types.
- Treat `writing-engines/atoms/index.json` as the source index and cognitive-engine's imported registry as a derived normalized view until freshness checks prove otherwise.
- Use immutable commit snapshots and deterministic imports.
- Start with a dry-run importer that writes a local JSONL/catalog artifact and a machine-readable validation report. Do not write to production Supabase or deploy.
- Keep the existing product API and database intact until the new catalog is proven against the retrieval evaluation set.
