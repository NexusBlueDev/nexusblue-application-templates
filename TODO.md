# TODO — NexusBlue Environment (Cross-Project)

> Last updated: 2026-02-28
> These are actions required from the NexusBlue team or clients — NOT Claude tasks.
> Project-specific TODOs live in each project's own TODO.md.

---

## Blocking (must be done before dependent features can be built)

- [ ] **[Dev]** Apply `organizations` table migration to **pw-app** (migration 012 pending).
  Required before WrapOps multi-tenancy is real and org #1 can be formally assigned.
  Script: `supabase/migrations/012_organizations.sql` (to be created)

- [ ] **[Dev]** Apply AppVault migrations **031 + 032 + 033** to **nexusblue-website**.
  Required before building the `/nexusblue` super-admin portal (migration 038).
  Migration numbering status: 034=appvault_consulting, 035, 036, and 037 also confirmed taken (2026-03-01). Super-admin portal = **038**.

---

## High Priority (do soon)

- [ ] **[Dev]** Fix **transcript-safety-pipeline** git remote — currently points to `wrmagnuson` personal account, not `NexusBlueDev`.
  Fix: `git remote set-url origin https://github.com/NexusBlueDev/transcript-safety-pipeline.git`
  Verify the repo exists in NexusBlueDev org first; if not, create it and push.

- [ ] **[WrapOps / Client]** Confirm WrapOps admin email address for **pw-app** onboarding.
  Once confirmed, uncomment `admin@wrapops.com` (or correct email) in `pw-app/scripts/seed-accounts.sh`.

- [ ] **[Dev]** Delete legacy **pw-app** test accounts from Supabase (superseded by NxB_dev_2026! accounts):
  - pw-admin@test.com (password: "test")
  - pw-employee@test.com (password: "test")
  - pw-client@test.com (password: "test")

- [ ] **[Dev]** Fix `__CLIENT_DOMAIN__` placeholder still in `nexusblue-website/CLAUDE.md`.

---

## Infrastructure & Services

- [ ] **[Dev]** Add preview domains to DOMAINS.md for any new Vercel-hosted projects.
  Current registry: `nexusblue-application-templates/DOMAINS.md`
  mcpc-website and other projects may need `[slug].nexusblue.ai` preview domains set up.

- [ ] **[Dev]** Create a Supabase project for **nexusblue-website** super-admin portal
  (if it needs its own project — or confirm it shares the existing nexusblue-website project).
  See `docs/NEXUSBLUE_SUPERADMIN_PLAN.md` for full spec.

---

## Client Content & Onboarding

- [ ] **[WrapOps / Client]** WrapOps org #1 onboarding:
  1. Confirm admin email
  2. Apply organizations migration to pw-app
  3. Create WrapOps row in `organizations` table
  4. Seed WrapOps admin account (must_reset_pw=true)

---

## Nice to Have

- [ ] **[Dev]** Set up SendGrid for **pw-app** email sharing (report sharing via email, not just link).
  Needs: SENDGRID_API_KEY in .env.local → Vercel env vars.

- [ ] **[Dev]** Add preview domain `mcpc-website.nexusblue.ai` to Vercel mcpc-website project (dev branch).

---

## Testing & CI Implementation

### Tier 1 — DONE 2026-02-28
- [x] **[Dev]** Add GitHub Actions CI + Vitest to **nexusblue-website** (10 tests) — done 2026-02-28
- [x] **[Dev]** Add GitHub Actions CI + Vitest to **pw-app** (21 tests: auth, AI, autosave, reports) — done 2026-02-28
- [x] **[Dev]** Add GitHub Actions CI + Vitest + Playwright to **mcpc-website** (8 tests) — done 2026-02-28
- [x] **[Dev]** Set GitHub repo secrets (`VERCEL_TOKEN` + `VERCEL_TEAM_ID`) on all 3 repos — done 2026-02-28

### Tier 2 — Next Session
- [ ] **[Dev]** Add GitHub Actions CI + Vitest to **cnc-platform**
- [ ] **[Dev]** Add GitHub Actions CI + Vitest to **cain-website-022026**
- [ ] **[Dev]** Add GitHub Actions CI + Vitest to **pet_scheduler**
- [ ] **[Dev]** Add GitHub Actions CI + Vitest to **sectorius-website**

### Guardrails + Hardening — Next Session
- [ ] **[Dev]** GitHub branch protection on all repos: require CI pass + no force push to main
- [ ] **[Dev]** Add `npm audit --audit-level=high` step to CI template (`docs/github-ci-template.yml`)
- [ ] **[Dev]** Create `scripts/rollback.sh` — promote prior Vercel deployment to production via REST API
- [ ] **[Dev]** Add git release tagging to CI deploy jobs (auto-tag on successful main deploy)

## Completed

- [x] **[Dev]** Add `## Project Type` section to all 11 project CLAUDE.md files — done 2026-02-28
- [x] **[Dev]** Create `scripts/seed-accounts.sh` for all projects — done 2026-02-28
- [x] **[Dev]** Elevate pw-app to Platform Product classification — done 2026-02-28
- [x] **[Dev]** Add `## Test Accounts` to all seeded project HANDOFF.md files — done 2026-02-28
- [x] **[Dev]** Create EXTERNAL_LLM_BRIEF.md for sharing NexusBlue context with outside AIs — done 2026-02-28
- [x] **[Dev]** Create NEW_PROJECT_PROMPT.md — copy-paste project starter prompt — done 2026-02-28
- [x] **[Dev]** Create NEXUSBLUE_SUPERADMIN_PLAN.md — full spec for `/nexusblue` portal — done 2026-02-28
- [x] **[Dev]** Update MEMORY.md with cross-session stable patterns — done 2026-02-28
- [x] **[Dev]** Update PROJECT_CLAUDE_TEMPLATE.md with v5.0 Project Type section — done 2026-02-28
