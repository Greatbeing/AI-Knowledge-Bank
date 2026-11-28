# ADR-0003: Capability Compression as a Foundation for Reuse-Driven Intelligence

- **Status:** Proposed
- **Date:** 2026-11-28
- **Decision owners:** AI Knowledge Bank maintainers
- **Related decisions:** [ADR-0002 — Reuse Before Build](./ADR-0002-REUSE-BEFORE-BUILD.md)

## Context

Humanity has already invested substantial computation and engineering effort in
software repositories, algorithms, tools, agents, APIs, workflows, and domain
knowledge. These assets are fragmented, inconsistently described, difficult for
AI systems to compare, and frequently recreated for new tasks.

A searchable code archive alone does not solve this problem. An AI system needs
representations that preserve task-relevant structure, interfaces, constraints,
provenance, evidence, and relationships so that capabilities can be selected,
composed, adapted, and evaluated.

The project adopts **Compression is Intelligence** as a research and engineering
hypothesis: useful intelligence depends in part on the ability to form compact,
task-relevant representations of complex information and use those
representations to make effective decisions and generalize to new tasks. This
is not a claim that compression alone is sufficient for intelligence.

## Decision

AI Knowledge Bank will evolve from a repository-oriented index into a
machine-readable capability catalog that supports reuse-driven intelligence.

The platform will preserve a traceable, layered representation:

| Layer | Representation | Purpose |
|---|---|---|
| L0 | Original source and immutable snapshot | Preserve the executable or inspectable artifact |
| L1 | Repository and module structure | Understand project organization and dependencies |
| L2 | Capability Manifest | Describe purpose, interfaces, constraints, provenance, license, and evidence |
| L3 | Capability relationships | Represent dependency, composition, substitution, and tested-by relationships |
| L4 | Reuse and task experience | Record validated conditions, outcomes, failure modes, and transferable strategies |

Compression must be **traceable and task-preserving**. A summary must never replace
the original source, immutable source reference, or required implementation
details. Each derived representation must retain links to its evidence and
source version.

## Architectural responsibilities

- **AI Knowledge Bank** owns the canonical capability catalog, source snapshots,
  normalized manifests, provenance, lifecycle, and verification evidence.
- **Cognitive Engine** owns task interpretation, candidate evaluation, reuse
  decisions, composition planning, and evidence-gated strategy improvement.
- Capability providers (including writing engines and future repositories)
  publish or expose assets through the shared Manifest contract; they do not
  create competing canonical catalogs.

## Learning boundary

The platform distinguishes three kinds of retained knowledge:

1. **Capability facts:** what an asset is, its interfaces, dependencies, and constraints.
2. **Task experience:** what happened when a versioned capability was used for a
   particular task under specified conditions.
3. **Decision strategy:** validated rules for selecting, composing, adapting,
   deferring, or rejecting capabilities.

A successful execution is not automatically a reusable lesson. Experience may
be promoted only after evaluation against explicit success criteria and, where
appropriate, independent review and regression tests.

External memory and decision-policy updates can improve system-level
performance without changing model parameters. Model training or fine-tuning is
a separate process and must not be conflated with retrieval or memory updates.

## Evaluation requirements

The project must measure more than catalog size or raw reuse frequency.
Evaluation should include:

- capability abstraction accuracy and interface fidelity;
- task relevance and retrieval quality;
- composition success and transfer to unseen tasks;
- task success and output quality;
- total discovery, validation, integration, execution, and maintenance cost;
- compute and token consumption under a matched from-scratch baseline;
- regressions, security failures, and license violations.

Net reuse value is defined as:

`NetReuseValue = CounterfactualBuildCost - (DiscoveryCost + ValidationCost + IntegrationCost + MaintenanceCost)`

Compute savings must be estimated against a comparable baseline for the same
task and model conditions. Reuse count alone is not a compute-savings metric.
Report uncertainty and evaluation limitations.

## Safety and governance

- Discovery, trust, and execution authorization remain separate.
- Unknown license, security, provenance, or interface status must fail closed.
- Imported source code and capability instructions are never executed during
  discovery or catalog ingestion.
- Capability records must be versioned and traceable to immutable source
  snapshots.
- Learning updates must be reversible, evaluated, and protected by regression
  tests.
- External side effects and privileged execution require separate runtime
  authorization and human approval where consequential.

## Consequences

Positive:
- The catalog becomes useful to planners, not just search interfaces.
- Capability reuse can be evaluated as both an economic and learning mechanism.
- Provenance and source preservation make compressed representations auditable.
- The architecture can support multiple capability providers without duplicating
  the canonical catalog.

Costs and trade-offs:
- Manifest quality and evidence curation become first-class engineering work.
- More explicit contracts may initially reduce the number of eligible assets.
- Learning requires controlled experiments and may be slower than unverified
  automatic feedback.
- Semantic compression and generalization remain research problems requiring
  empirical validation.

## Initial implementation sequence

1. Connect Cognitive Engine to exported, read-only Manifest snapshots.
2. Establish task and capability contracts with explicit provenance.
3. Evaluate deterministic capability abstraction and retrieval baselines.
4. Add composition planning and end-to-end task validation.
5. Introduce versioned task experience and evidence-gated strategy updates.
6. Compare reuse-first and reuse-plus-learning against generate-first baselines.

## Success criterion

The decision is validated only when controlled, reproducible experiments show
that capability representations and reuse-driven learning improve task outcomes,
transfer, or total cost without unacceptable increases in defects, security
risk, or licensing violations.
