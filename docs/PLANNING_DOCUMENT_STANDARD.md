# LLM-Optimized Planning Document Standard

**Version: 1.0**
**Source of truth:** `nexusblue-application-templates/docs/PLANNING_DOCUMENT_STANDARD.md`
**Reference implementation:** `~/sandbox/plans/social-media/`

> This standard governs how planning documents are structured in `~/sandbox/plans/` so that
> LLMs can efficiently consume them during build sessions. The goal: minimize mandatory context
> per session while keeping all detail accessible on demand.

---

## Problem

Monolithic planning documents (2,000-5,000+ lines) force LLMs to read the entire document at
session start, consuming 30-60% of the context window before any work begins. This leaves less
room for code, conversation, and tool results — degrading output quality on complex tasks.

## Solution: Chunked Document Architecture

Split planning docs into **small, role-scoped files** organized by read frequency. An index file
(MANIFEST.md) tells the LLM exactly which files to read for the current task.

### Target Metrics

| Metric | Target | SocialAI Result |
|--------|--------|-----------------|
| Mandatory context per session | 200-400 lines | ~250 lines |
| Maximum context per session | 800-1,000 lines | ~900 lines |
| Reduction vs monolithic | 10-20x | 18x |
| File size per chunk | 50-500 lines | 37-1,432 lines |
| Total files | 15-40 depending on project size | 37 |

---

## Directory Structure

Every plan in `~/sandbox/plans/{name}/` follows this structure:

```
plans/{name}/
├── MANIFEST.md              ← Index file (MANDATORY read — every session)
├── BUILD_PLAN.md            ← Original monolithic plan (retained as backup)
├── ARCHITECTURE.md          ← Original monolithic architecture (retained as backup)
├── foundations/              ← Shared context — loaded once per session when relevant
│   ├── PRIMITIVES.md        ← Core Platform mapping, field registry, capability system
│   ├── SECURITY.md          ← Security architecture, agent registry, monitoring
│   ├── COST.md              ← Cost metering, prevention guardrails, billing
│   └── STANDARDS.md         ← Quality gates, UI standards, accessibility, testing
├── phases/                   ← Phase-scoped build plans — read only the active phase
│   ├── phase-00-foundation.md
│   ├── phase-01-adapters.md
│   ├── ...
│   ├── phase-NN-name.md
│   └── beta-gate.md         ← Validation checkpoints (if applicable)
├── architecture/             ← Domain-scoped architecture — read as needed
│   ├── PIPELINE.md          ← Data flow, state machines, process definitions
│   ├── ADAPTERS.md          ← External integrations, API interfaces
│   ├── CONTENT.md           ← Content creation, hooks, knowledge base
│   ├── ENGAGEMENT.md        ← User interaction, lead nurture, crisis
│   ├── ANALYTICS.md         ← Reporting, attribution, dashboards
│   ├── TENANCY.md           ← Multi-tenancy, RLS, agency hierarchy
│   └── TABLES.md            ← Full SQL CREATE TABLE definitions (reference)
└── decisions/                ← Historical decisions — read only when questioning a choice
    ├── OPEN_ITEMS.md        ← Resolved design decisions with reasoning
    └── RISK_REGISTER.md     ← Identified risks with mitigations
```

### Directory Roles

| Directory | Read When | Typical Size |
|-----------|-----------|-------------|
| `MANIFEST.md` | Every session (mandatory) | 100-200 lines |
| `foundations/` | Touching that domain (security, cost, etc.) | 100-350 lines each |
| `phases/` | Working on that phase only | 50-150 lines each |
| `architecture/` | Need domain-specific detail | 150-500 lines each |
| `decisions/` | Questioning a past decision | 30-100 lines each |
| `TABLES.md` | Need SQL definitions (read specific tables, not whole file) | 500-1,500 lines |

---

## MANIFEST.md Structure

The MANIFEST is the only mandatory read. It must contain:

1. **Module Identity** — name, prefix, type, status, dependencies, key metrics (table count, phase count, session estimates)
2. **Table Registry** — every table, its purpose, and which file has the full SQL definition
3. **Phase DAG** — build order showing dependencies between phases
4. **File Map** — every file in the split structure with line count and content summary
5. **Reading Protocol** — explicit instructions for which files to read based on the current task

### Reading Protocol Template

Include this at the bottom of every MANIFEST.md:

```
## Reading Protocol

**Session start (any phase):**
1. Read MANIFEST.md (this file) — understand scope, find your files
2. Read the active phase file: phases/phase-XX-name.md
3. If touching security/agents: read foundations/SECURITY.md
4. If touching cost/billing: read foundations/COST.md
5. If touching tables: read relevant section of architecture/TABLES.md
6. If questioning a past decision: read decisions/OPEN_ITEMS.md

**Mandatory context per session: ~250-400 lines** (MANIFEST + active phase)
**Maximum context per session: ~800-1000 lines** (MANIFEST + phase + 1-2 foundations + relevant architecture)
```

---

## File Size Guidelines

| File Type | Target | Hard Maximum | Action if Exceeded |
|-----------|--------|-------------|-------------------|
| MANIFEST.md | 100-200 lines | 300 lines | Trim table registry to essential columns |
| Foundation files | 100-350 lines | 500 lines | Split by subdomain |
| Phase files | 50-150 lines | 300 lines | Split into phase-XX-a and phase-XX-b |
| Architecture files | 150-400 lines | 600 lines | Split by subdomain |
| Decision files | 30-100 lines | 200 lines | Archive resolved items older than 6 months |
| TABLES.md | 500-1,500 lines | 2,000 lines | Read by section, not whole file |

**General rule:** If a file exceeds 600 lines, evaluate whether it should be split further. The exception is TABLES.md, which is a reference file read by section.

---

## When to Apply This Standard

| Project Size | Apply Split? | Rationale |
|-------------|-------------|-----------|
| S (1-3 sessions) | No | Single BUILD_PLAN.md is fine |
| M (4-8 sessions) | Optional | Split if plan exceeds 800 lines |
| L (9-15 sessions) | Yes | Plans will exceed 1,500 lines |
| XL (16+ sessions) | Mandatory | Plans will exceed 3,000 lines |

**Trigger:** When combined planning docs (BUILD_PLAN + ARCHITECTURE) exceed **1,500 lines**, split them.

---

## Splitting Process

1. **Create directory structure** — `foundations/`, `phases/`, `architecture/`, `decisions/`
2. **Write MANIFEST.md first** — this is the index; everything references it
3. **Extract decisions** — OPEN_ITEMS.md and RISK_REGISTER.md (smallest, least change)
4. **Extract phases** — one file per phase from BUILD_PLAN.md
5. **Extract foundations** — shared context that applies across multiple phases
6. **Extract architecture** — domain-scoped from ARCHITECTURE.md
7. **Retain originals** — keep BUILD_PLAN.md and ARCHITECTURE.md as source-of-truth backups
8. **Verify** — count files, spot-check content completeness, validate reading protocol

**Parallelization:** Steps 3-6 can run as parallel agents since they extract from different source sections.

---

## Adapting for Smaller Projects

Not every project needs all directories. Scale down:

| Project Size | Structure |
|-------------|-----------|
| **M (4-8 sessions)** | MANIFEST.md + phases/ + one ARCHITECTURE.md (no split) |
| **L (9-15 sessions)** | MANIFEST.md + phases/ + architecture/ + decisions/ |
| **XL (16+ sessions)** | Full structure (foundations/ + phases/ + architecture/ + decisions/) |

The `foundations/` directory is only needed when the project has cross-cutting concerns (security architecture, cost metering, platform primitives) that apply to multiple phases.

---

## Future: Vector-Enhanced Retrieval

The chunked file structure is designed to be compatible with future vector search integration:

- Each file becomes a document in a vector store
- MANIFEST.md metadata enables semantic routing (query → relevant file)
- Phase files have clear temporal scope (useful for time-based retrieval)
- Architecture files have clear domain scope (useful for topic-based retrieval)
- File size targets (50-500 lines) align with optimal embedding chunk sizes

When NexusBlue's AI pipeline includes vector-based document retrieval, the reading protocol can be augmented: instead of rule-based file selection ("if touching security, read SECURITY.md"), the system can semantically match the current task to the most relevant chunks.
