# TODO — NexusBlue Environment (Cross-Project)

> Last updated: 2026-03-01
> These are actions required from the NexusBlue team or clients — NOT Claude tasks.
> Project-specific TODOs live in each project's own TODO.md.
> Items are ordered by dependency chain — earlier phases unblock later ones.

---

## Phase 0 — Blocking Prerequisites

> Nothing downstream can move until these are done.

- [ ] **[Dev]** Apply AppVault migrations **031 + 032 + 033** to **nexusblue-website** Supabase.
  Blocks: Super-admin portal (migration 038) cannot be applied until these land.
  Migration numbering: 034=appvault_consulting, 035–037 confirmed taken. Portal = **038**.

- [ ] **[Dev]** Apply `organizations` table migration to **pw-app** (migration 012).
  Blocks: WrapOps multi-tenancy, org #1 assignment, client onboarding.
  Script: `supabase/migrations/012_organizations.sql` (to be created)

---

## Phase 1 — CI Guardrails & Hardening — DONE 2026-03-01

- [x] GitHub branch protection on all 8 repos (7 projects + templates): require CI pass + no force push — done 2026-03-01
- [x] `npm audit --audit-level=high` step added to CI template + all 7 repo workflows — done 2026-03-01
- [x] `scripts/rollback.sh` created — promote prior Vercel deployment to production via REST API — done 2026-03-01
- [x] Git release tagging added to all deploy-production CI jobs (6 repos with deploy) — done 2026-03-01

---

## Phase 2 — Super-Admin Portal Foundation

> Depends on: Phase 0 (nexusblue-website migrations 031–033 applied).
> Spec: `docs/NEXUSBLUE_SUPERADMIN_PLAN.md` v1.3

### 2a. Database & Auth (build order steps 1–5)

- [ ] **[Dev]** Write and apply **migration 038** — 9 `dev_*` tables + `dev_portal_config` + RLS + seed data.
  Tables: dev_projects, dev_client_orgs, dev_modules, dev_agent_logs, dev_roadmap_items, dev_performance_snapshots, dev_ai_usage_summary, dev_llm_brief_overrides, dev_portal_config.
- [ ] **[Dev]** Seed `bill@nexusblue.io` as super-admin — run updated seed script, set `platform_role = 'nexusblue_admin'`, set initial PIN hash in `dev_portal_config`.
- [ ] **[Dev]** Update `src/middleware.ts` — add `/nexusblue` platform_role gate + portal cookie check + `/nexusblue/verify` PIN bypass.
- [ ] **[Dev]** Build PIN verification flow — `/nexusblue/verify` page + `verifyPortalPin` server action + install `bcryptjs`.
- [ ] **[Dev]** Add "NexusBlue Command" nav entry — visible only to `platform_role = 'nexusblue_admin'`.

### 2b. Layout & Hub (build order steps 6–7)

- [ ] **[Dev]** Create `/nexusblue` route group with sidebar nav (Environment / IP / AI Monitor / Industry / Roadmap / Health).
- [ ] **[Dev]** Build Hub page (`/nexusblue`) — dashboard cards: project counts, tenant count, agent health, AI usage MTD, performance alerts, droplet health.

---

## Phase 3 — Super-Admin Portal Sections

> Depends on: Phase 2 complete. Each section is independently useful — ship in order.

- [ ] **[Dev]** **Environment section** (`/nexusblue/environment`) — Projects table, Tenants table, Agent Log feed, LLM Brief viewer + clipboard copy.
- [ ] **[Dev]** **IP Registry** (`/nexusblue/ip`) — Project deep-dive cards, Module Library table, Documentation viewer (renders GitHub markdown).
- [ ] **[Dev]** **Health section** (`/nexusblue/health`) — Vercel build status per project, Supabase health, Droplet health (RAM/disk/load), Agent schedule + status.
- [ ] **[Dev]** **AI Monitor** (`/nexusblue/ai-monitor`) — Usage charts (MTD cost by project, tokens by model), Adherence checklist (scored per project), Feature performance.
- [ ] **[Dev]** **Roadmap section** (`/nexusblue/roadmap`) — AI Suggestions feed (accept/dismiss/snooze), Backlog table (editable, sortable by project + priority).
- [ ] **[Dev]** **Industry Benchmark** (`/nexusblue/industry`) — Core Web Vitals vs targets, NexusBlue methodology vs industry standard comparison.
- [ ] **[Dev]** **Settings** (`/nexusblue/settings`) — Change Portal PIN (current PIN → new PIN → re-hash).

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
