# HANDOFF -- NexusBlue Application Templates

## Last Updated
2026-10-10 -- **nexusblue-core session: claude/CLAUDE.md v9.11 -> v9.12.** Rule #32 "What's Next" block gains a fifth, always-present section: Needs Your Input. Founder reported directly that questions and open asks embedded inline in prior What's Next blocks were going unseen, buried in prose or inside the backlog list, and confirmed he wants a standing, always-present template (show every time, not conditionally). Format per item: the plain question first, a recommendation with its one-line reason, then what happens with no answer back; architecture-shaped items add one line naming the real tradeoff. Present even when nothing is open -- state that plainly rather than omitting the section, since an absent section is indistinguishable from a silently-dropped question. Full spec added to Execution Philosophy. Also synced to installed `~/.claude/CLAUDE.md`. Paired changes this session (not single-file in the full sense, but no architect/security/QA review applicable -- a governance-doc + enforcement-hook pairing, not a code change to a product repo): `~/.claude/hooks/whats-next-gate.sh` now enforces the section live (nexusblue-claude-hooks commit `abab71a`); `core_rules` rows priority 32 and 88 updated directly in Core DB (ids `07c0b073`, `1a4fba28`) and re-embedded via `scripts/backfill-governance-embeddings.mjs` so governance-injected rule text matches actual enforcement; `~/.claude/skills/continuity-start/SKILL.md`'s post-READY Rule #32 instructions updated to include the new section. `core_decisions` `84a04685` (domain=devops, closest fit -- no `governance` domain value exists in the live check constraint), `eng_project_library` `bbbe18a7`.
2026-10-10 -- **setup-copilot session: claude/CLAUDE.md v9.10 -> v9.11, commit `ba1abe9`.** Adds a named, cited gate under Execution Philosophy: a subagent's own verification (continuity, architect, security, docs, or any other orchestration agent) does not substitute for the main session independently re-checking its concrete, falsifiable claims before they enter a Rule #32 block. `~/.claude/skills/continuity-start/SKILL.md` gained a corresponding STEP 9 (main-session spot-check, not delegable back to the subagent). Root cause: a setup-copilot session accepted a continuity-start subagent's READY verdict and backlog verbatim; the founder asked "is this backlog real for this repo?" and a direct check found three independently-wrong claims the subagent had presented as fact (a bug against a field name absent from the codebase, a Dependabot count stale in both directions, and an entire "ready to migrate" batch whose premise -- an unbumped package version, a dated code comment explicitly explaining why migration could not yet be done, and a "held" commit that had actually been merged two weeks earlier -- was contradicted on inspection). Also synced to installed `~/.claude/CLAUDE.md`. Single-file change (`claude/CLAUDE.md` only, no hooks/code touched) -- no architect/security/QA review applicable, matching the precedent set by the 2026-10-04 and 2026-07-31 entries below for the same class of change. `eng_project_library`/`core_decisions` rows: not inserted this session -- this session does not have confirmed write access to those tables beyond the governance MCP's `create_heuristic()` call (heuristic `327132a2-f913-4450-b8af-930ac66e3e53`, domain=governance), which was used instead; flagging this rather than asserting registry rows exist that weren't actually verified.
2026-10-04 -- **nexusblue-core session: claude/CLAUDE.md reconciled v9.8 to v9.10 in one commit (`781b529`).** This session's own pre-push docs-gate audit found the global bootloader (`claude/CLAUDE.md`, synced to `~/.claude/CLAUDE.md`, loaded by every `~/dev/` and `~/sandbox/` session) had drifted stale at v9.8 on disk -- v9.9's SMS/A2P compliance gate (Rule #275) and BlueTalk-as-base-provider platform note were entirely missing from the file, even though that decision had already been made and recorded in Core DB back on 2026-08-04 (`core_decisions` `65b5004e`). The decision existed; the bootloader document itself just never got v9.9 written into it. Reconciled to full v9.9 content first, then layered v9.10 on top: a full formatting/integrity spec for the Rule #32 "What's Next" block (numbered batches of genuinely related work, each stating what it's part of and where found, human-only batches get the exact one-sentence ask, architecture-review batches flagged and moved up, cross-repo batches get a drafted handoff prompt, nothing listed unless checked against the real rule/code/schema/DB); a global no-em-dash style rule for all session output; a requirement that a discovered issue be scoped and either resolved immediately or pushed into the owning repo's own registry, never left as a bare chat/doc note; and a requirement that in-progress work's state be written into HANDOFF.md, TODO.md, or Setup Copilot before a session ends. Single-file change (`claude/CLAUDE.md` only, no hooks/code touched) -- no architect/security/QA review applicable. `core_decisions` `c875e8aa`, `eng_project_library` `ac72dabf`.

2026-09-08 -- **Repo 8/8 (final) of the `audit_events` platform-wide onboarding program (`nexusblue-core` `docs/roadmap/AUDIT_EVENTS_8_REPO_ONBOARDING.md`, `core_decisions` `37964174`/ADR `ba2bf975`).** This repo is DIFFERENT IN KIND from the other 7: it is the templates/scaffolding/standards source-of-truth repo — no `package.json` at the top level (only nested in `publishing-pipeline-template/`), no `next.config`, no CI workflow, nothing buildable or deployable here. `src/` (instrumentation.ts, API route templates, lib helpers) and `vercel.json` are reference/template content copied into real projects (e.g. the `/nexusblue` super-admin portal — confirmed via `docs/NEXUSBLUE_SUPERADMIN_PLAN.md`: "Lives in: nexusblue-website"), not a running application. **Standard 7-repo playbook (live API request + live DB row verification) does not apply — there is no live request to make and no tenant DB to write to.**
  - Checked the right question instead: does this repo's own template/standard correctly instruct new projects to onboard to `audit_events` from day one? **Partially — found and fixed a real gap.** `src/app/api/cron/*/route.ts` templates already wrap handlers in `withAuditEvent()` and `docs/SECURITY_STANDARD.md` already documented `secureRoute()`/`withAuditEvent()` as required route middleware — but `src/instrumentation.ts` (the template every new project's own instrumentation.ts gets copied/adapted from) never called `initCore()` + `configureAuditRuntime({ after })`. This is the *exact* silent-no-op bug class (`core_decisions` `ba2bf975`, ADR `6421f19d`) found and fixed live in nexusblue-website, cnc-platform, and nexusblue-bluesocial during this program — it was reproducing at the template level too, meaning every *future* project scaffolded from this repo would inherit the same gap on day one.
  - **Fixed:** `src/instrumentation.ts` — added the `initCore(createServiceClient())` + `configureAuditRuntime({ after })` bootstrap block (matches the proven-correct pattern from cnc-platform/nexusblue-website), with inline comments explaining both failure modes it closes. `docs/SECURITY_STANDARD.md` — added a "Required Runtime Bootstrap" subsection documenting that wrapping a route is necessary but not sufficient; bumped to v2.1.
  - **`setup_blocker` `63320b8e-6e9c-49a4-89db-56005d284950`** ("audit_events writes silently dropped on Vercel") — its premise ("this project ... is Vercel-deployed ... losing audit writes in production right now") does not hold for this repo specifically (nothing is deployed here to lose writes from). Resolved with a correction note distinguishing "no live production impact" from "the template gap was real and is now fixed," rather than closing it as if the original finding were false.
  - No architect/security/QA review applicable — docs + one template file changed, no runtime code path executes anywhere in this repo. No CI to run (none configured). Findings registered in `eng_project_library`.

2026-07-31 -- **S192 (nexusblue-core, U9): Retired the drifted `claude/hooks/` mirror; resynced `claude/CLAUDE.md` v9.6->v9.8.** `claude/hooks/` held only 2 of 48 live hook scripts and had drifted three independent ways from the actual `~/.claude/hooks` working tree — proof the manual-copy sync model doesn't hold under real use (see nexusblue-core heuristic `7023a71e`). Hook scripts are now version-controlled in place at `github.com/NexusBlueDev/nexusblue-claude-hooks` (private), which IS the live `~/.claude/hooks` working tree, not a copy — this repo's bootloader now points there as source of truth for hook contents instead of bundling its own copy. `claude/CLAUDE.md` here was v9.6 vs v9.8 installed; resynced. Commit `4cf7d00`. No CI/architect/security review applicable (docs + one file removal, no code path changed).

2026-05-13 -- **Session 26 (nexusblue-website): Ported two CI standard scripts from nexusblue-website.**

- `scripts/migration-impact-check.sh` — scans changed migrations for DROP TABLE/VIEW/CONSTRAINT/COLUMN; greps src/ for dead references. No deps (pure bash). Platform standard since Session 25.
- `scripts/check-types-drift.sh` — calls Supabase Management API to generate fresh TypeScript types; diffs against committed `src/types/supabase.ts` baseline. No CLI needed (curl + python3). Gracefully skips if `SUPABASE_ACCESS_TOKEN` absent.
- `docs/github-ci-template.yml` updated with Jobs 2b and 2c wiring both scripts. Projects set `SUPABASE_PROJECT_ID` env var and `SUPABASE_ACCESS_TOKEN` GitHub Secret to activate the type drift check.

---

2026-05-03 -- **Session 99 (2026-05-03): Autonomous-First enforcement hooks.** `claude/hooks/autonomous-first-gate.sh` (PreToolUse Bash) blocks blocker pushes with no prior autonomous verification in session ledger. `claude/hooks/whats-next-gate.sh` updated with Rule #944f268c check flagging responses that ask human to verify things reachable autonomously (trigger.dev, DB, logs). Both wired in `~/.claude/settings.json`. Rule 944f268c + Heuristic ea04d5d3 in Core DB.

2026-04-16 -- Platform registry integrity audit + slug normalization shipped

## Project State
Canonical source for CLAUDE.md bootloader, governance rules, hooks, and application templates. Platform-wide registry audit completed this session — 4 slug pairs normalized across Core DB (660 rows touched, 4 duplicate agents dropped), bootloader count drifts fixed (rules/heuristics/feedback), and 7 follow-up items queued in TODO.md Phase 5.

## Environment Status
> **Branch:** master
> **Last Active:** 2026-04-16

## How to Resume
> Start by reading: HANDOFF.md -> CLAUDE.md

---

### Session 2026-04-16 — Platform Registry Integrity Audit

**Shipped (pushed to origin/master):**
- Commit beb49c3 — governance bootloader updates (Setup Copilot section, Rules #221/#222 registry block, no-localhost rule)
- This commit — bootloader count corrections + TODO.md Phase 5 seeded with 7 follow-ups

**Platform DB changes (no code — direct SQL against Core DB iezojzzfhilbsrkjujjr, inside a transaction):**
- 4 slug pairs normalized: `cain-website` → `cain-website-022026`, `pet-scheduler` → `pet_scheduler`, `nexusblue-grantwriter` → `nexusblue-bluegrant`, `nexusblue-social` → `nexusblue-bluesocial`
- 12 UPDATE statements across `core_agents`, `core_agent_executions`, `core_decisions`, `dev_alerts`, `eng_project_library`, `project_library`
- 4 DELETEs from `core_agents` — stale `nexusblue-social` agents were functional duplicates of existing `nexusblue-bluesocial` agents (identical `name`, different slug prefix)
- Backup tables `_backup_slug_normalize_2026_04_16_*` preserve full rollback (drop on or after 2026-10-16)
- Core DB row 1d83a459-f3b1-42de-9fa1-e3823eb4a288 in `core_feedback_loops` records the audit as a `correction`/`positive` entry (7th real-session entry out of 192 total — the feedback loop health gap is itself one of the deferred items)
- `eng_project_library` row 7208045b-6608-4d0a-bc24-8fc2ca1c6321 documents the normalization procedure as a reusable infrastructure pattern (Rule #49)
- `core_decisions` ADR 91ac2ada-c682-4617-a604-76fd35e7df92 records the "lowercase-hyphenated slug convention with stale-slug consolidation on rename" decision (Rule #197)

**Bootloader corrections in `claude/CLAUDE.md`:**
- Rule count: 219 → 237
- Heuristic count: 48 → 54
- Feedback entries: 187 → 191 (now 192 with this session's entry)
- Real-session ratio: "2 entries" → "6 entries (3.1%)"
- Synced to `~/.claude/CLAUDE.md` (MD5 match verified)

**Still open — see TODO.md Phase 5:**
- `refuge-ridge` orphan (on disk, 1 open blocker, no `dev_projects` row)
- 3 PascalCase disk directory renames (`NexusBlue-*` → `nexusblue-*`) — deferred pending tooling-impact scan
- `nexusblue-website` blocker triage (8 needs, 5 blockers)
- `core_decisions` null `project_slug` backfill (22 of 49 rows)
- Zero-coverage project deep-dive (re-run coverage query post-normalization)
- FCE feedback loop wiring health check — only 6/192 entries are real sessions

**Skipped / not applicable this session:**
- Architect review — no module/migration code written
- Security review — no new API routes
- QA review — no module going LIVE
