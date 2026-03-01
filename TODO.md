# TODO — NexusBlue Environment (Cross-Project)

> Last updated: 2026-03-01 (Phase 3 DONE — all 7 portal sections live)
> These are actions required from the NexusBlue team or clients — NOT Claude tasks.
> Project-specific TODOs live in each project's own TODO.md.
> Items are ordered by dependency chain — earlier phases unblock later ones.

---

## Phase 0 — Blocking Prerequisites — DONE 2026-03-01

- [x] **nexusblue-website**: Migrations 031–037 all confirmed applied (031+032 were already in place; 033–036 applied via Management API; 037 CHECK constraint verified) — done 2026-03-01
- [x] **pw-app**: Migration 012 applied — organizations table, platform_role + organization_id on profiles, WrapOps seeded as org #1, all existing profiles assigned — done 2026-03-01
- [x] `SUPABASE_ACCESS_TOKEN` added to all 5 Supabase projects for CLI/API access — done 2026-03-01
- [x] `scripts/apply-migrations.sh` created (template + both projects) — done 2026-03-01

---

## Phase 1 — CI Guardrails & Hardening — DONE 2026-03-01

- [x] GitHub branch protection on all 8 repos (7 projects + templates): require CI pass + no force push — done 2026-03-01
- [x] `npm audit --audit-level=high` step added to CI template + all 7 repo workflows — done 2026-03-01
- [x] `scripts/rollback.sh` created — promote prior Vercel deployment to production via REST API — done 2026-03-01
- [x] Git release tagging added to all deploy-production CI jobs (6 repos with deploy) — done 2026-03-01

---

## Phase 2 — Super-Admin Portal Foundation — DONE 2026-03-01

> Spec: `docs/NEXUSBLUE_SUPERADMIN_PLAN.md` v1.3

### 2a. Database & Auth — DONE 2026-03-01

- [x] **[Dev]** Write and apply **migration 038** — 9 `dev_*` tables + RLS + seed data — done 2026-03-01
- [x] **[Dev]** Seed `bill@nexusblue.io` as super-admin + PIN hash — done 2026-03-01
- [x] **[Dev]** Install `bcryptjs` + `@types/bcryptjs` — done 2026-03-01
- [x] **[Dev]** Update middleware — `/nexusblue` platform_role gate + PIN cookie check — done 2026-03-01
- [x] **[Dev]** Build PIN verification flow — `/nexusblue/verify` page + `verifyPortalPin` action — done 2026-03-01
- [x] **[Dev]** Add "NexusBlue Command" nav entry + `isSuperAdmin` in auth provider — done 2026-03-01

### 2b. Layout & Hub — DONE 2026-03-01

- [x] **[Dev]** Create `/nexusblue` route group with portal sidebar (8 nav items) — done 2026-03-01
- [x] **[Dev]** Build Hub page — stat cards, agent logs, roadmap items, quick links — done 2026-03-01
- [x] **[Dev]** Placeholder pages for all 7 portal sections — done 2026-03-01

---

## Phase 3 — Super-Admin Portal Sections — DONE 2026-03-01

- [x] **[Dev]** **Environment** — Projects table, Tenants table, Agent Log feed — done 2026-03-01
- [x] **[Dev]** **IP Registry** — Project cards with stack pills, Module Library table — done 2026-03-01
- [x] **[Dev]** **Health** — Droplet metrics, Vercel build status, Agent schedule — done 2026-03-01
- [x] **[Dev]** **AI Monitor** — Usage by project (MTD), Adherence checklist — done 2026-03-01
- [x] **[Dev]** **Roadmap** — Suggestions feed, Backlog table, Completed items — done 2026-03-01
- [x] **[Dev]** **Industry Benchmark** — CWV targets, Methodology comparison — done 2026-03-01
- [x] **[Dev]** **Settings** — Change Portal PIN — done 2026-03-01

---

## Phase 4 — Portal Agents

> Depends on: Phase 3 (at minimum Environment + Health sections live).
> These write to `dev_*` tables and surface results in portal sections.

- [ ] **[Dev]** **Roadmap agent** — triggered after architect/security/QA cycles. Reads `dev_agent_logs`, generates prioritized improvement suggestions → writes to `dev_roadmap_items`.
- [ ] **[Dev]** **Performance agent** — weekly per live project. Fetches PageSpeed Insights, writes to `dev_performance_snapshots`, flags below-target metrics.
- [ ] **[Dev]** **Sync agent** — monthly per Platform Product. Reads `_usage` tables from each product's Supabase, aggregates → writes to `dev_ai_usage_summary`.

---

## Housekeeping (Independent — Any Time)

- [ ] **[Dev]** Add preview domains to DOMAINS.md for any new Vercel-hosted projects.
- [ ] **[Dev]** Set up SendGrid for **pw-app** email sharing (SENDGRID_API_KEY → Vercel env vars).
- [ ] **[Dev]** Confirm nexusblue-website super-admin shares existing Supabase project (or create separate one).

---

## Testing & CI — Completed

### Tier 1 — DONE 2026-02-28
- [x] Add GitHub Actions CI + Vitest to **nexusblue-website** (10 tests) — done 2026-02-28
- [x] Add GitHub Actions CI + Vitest to **pw-app** (23 tests: auth, AI, autosave, reports) — done 2026-02-28
- [x] Add GitHub Actions CI + Vitest + Playwright to **mcpc-website** (8 tests) — done 2026-02-28
- [x] Set GitHub repo secrets (`VERCEL_TOKEN` + `VERCEL_TEAM_ID`) on all 3 repos — done 2026-02-28

### Tier 2 — DONE 2026-03-01
- [x] Add GitHub Actions CI + Vitest to **cnc-platform** (6 tests) — done 2026-03-01
- [x] Add GitHub Actions CI + Vitest to **cain-website-022026** (4 tests) — done 2026-03-01
- [x] Add GitHub Actions CI + Vitest to **pet_scheduler** (80 tests — 5 new + 75 jest→vitest) — done 2026-03-01
- [x] Add GitHub Actions CI (lint + typecheck) to **sectorius-website** — done 2026-03-01
- [x] Set GitHub repo secrets on cnc-platform, cain-website-022026, sectorius-website — done 2026-03-01

---

### Guardrails + Hardening — DONE 2026-03-01
- [x] Branch protection on all 8 repos (require CI pass, block force push) — done 2026-03-01
- [x] npm audit step in CI template + all 7 repo workflows — done 2026-03-01
- [x] `scripts/rollback.sh` template created — done 2026-03-01
- [x] Release tagging on all deploy-production CI jobs — done 2026-03-01

### Housekeeping — DONE 2026-03-01
- [x] transcript-safety-pipeline git remote fixed → NexusBlueDev (repo created + pushed) — done 2026-03-01
- [x] `__CLIENT_NAME__` + `__CLIENT_DOMAIN__` placeholders fixed in nexusblue-website/CLAUDE.md — done 2026-03-01

## Other Completed Items

- [x] Add `## Project Type` section to all 11 project CLAUDE.md files — done 2026-02-28
- [x] Create `scripts/seed-accounts.sh` for all projects — done 2026-02-28
- [x] Elevate pw-app to Platform Product classification — done 2026-02-28
- [x] Add `## Test Accounts` to all seeded project HANDOFF.md files — done 2026-02-28
- [x] Create EXTERNAL_LLM_BRIEF.md for sharing NexusBlue context with outside AIs — done 2026-02-28
- [x] Create NEW_PROJECT_PROMPT.md — copy-paste project starter prompt — done 2026-02-28
- [x] Create NEXUSBLUE_SUPERADMIN_PLAN.md — full spec for `/nexusblue` portal — done 2026-02-28
- [x] Update MEMORY.md with cross-session stable patterns — done 2026-02-28
- [x] Update PROJECT_CLAUDE_TEMPLATE.md with v5.0 Project Type section — done 2026-02-28
