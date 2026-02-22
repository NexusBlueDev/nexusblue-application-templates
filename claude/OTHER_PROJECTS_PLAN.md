# NexusBlue Dev Projects — Standards Adoption Plan
**Last Updated:** 2026-02-22
**Status:** Active projects updated. Remaining projects assessed below.

---

## Summary: All Projects in 18_Dev-projects

| Project | CLAUDE.md | HANDOFF.md | Type | Action Needed |
|---------|-----------|------------|------|---------------|
| nexusblue-junior-jarvis | ✅ Updated | ✅ Good | HTML5 PWA | Done — in global system |
| nexusblue-junior-jarvis-career | ✅ Updated | ✅ Good | HTML5 PWA | Done — in global system |
| pet_scheduler | ✅ Updated | ✅ Excellent | Next.js SaaS | Done — in global system |
| transcript-safety-pipeline | ✅ Updated | ✅ Excellent | Python/Next.js | Done — in global system |
| application-templates | ✅ New | — | Template system | This folder |
| nexusblue-ai-service | ❌ Needed | ✅ Exists | Backend service | See below |
| python-project-template | ❌ Needed | ✅ Exists | Template | See below |
| tax-source-of-truth | ❌ Needed | ✅ Exists | Knowledge base | See below |
| tech-intelligence-platform | ❌ Needed | ✅ Exists | Documentation | See below |
| retail-product-label-system | ❌ | ❌ | Backend (Node.js) | Defer |
| taxdome-scraper | ❌ | ❌ | Data tool | Defer |
| outlook_analyzer_project | ❌ | ❌ | Python tool | Defer |
| python-project-template | ❌ | ✅ | Template | Add CLAUDE.md |
| json-playground | ❌ | ❌ | Dev tool | Not needed |
| enterprise-personal-brand-enablement | ❌ | ❌ | Documentation | Not needed |
| nexusblue-operating-system | ❌ | ❌ | Documentation | Not needed |
| nexusblue-platform | ❌ | ❌ | Documentation | Not needed |
| app-urls | ❌ | ❌ | Documentation | Not needed |
| customer-md | ❌ | ❌ | Documentation | Not needed |
| sample-project | ❌ | ❌ | Template | Not needed |
| tax-accounting-firm-kb-template | ❌ | ❌ | Knowledge base | Not needed |

---

## Projects Needing Attention

### 1. nexusblue-ai-service
**What it is:** NexusBlue backend API service
**Current state:** Has a HANDOFF.md and README — unknown if active
**Action:** Add `CLAUDE.md` (use `PROJECT_CLAUDE_TEMPLATE.md` as base); review and update HANDOFF.md to match standard template
**Priority:** Medium — add before next active development session

### 2. python-project-template
**What it is:** Python project boilerplate template
**Current state:** Has HANDOFF.md and README — template project
**Action:** Add `CLAUDE.md` that explains this is a template; ensure HANDOFF.md documents how to use the template
**Priority:** Low — add when next Python project is started

### 3. tax-source-of-truth
**What it is:** Authoritative tax/accounting law sources knowledge base
**Current state:** Has HANDOFF.md, README, index.html — may have active web component
**Action:** Add `CLAUDE.md`; verify HANDOFF.md current state
**Priority:** Medium — before next active session

### 4. tech-intelligence-platform
**What it is:** System of record for technology intelligence
**Current state:** Has HANDOFF.md and README — documentation project
**Action:** Add `CLAUDE.md`; review HANDOFF.md
**Priority:** Low — add when next active development session

---

## Projects to Defer (Not Actively Developed)

These projects have no CLAUDE.md or HANDOFF.md and don't appear to be in active development.
Add CLAUDE.md + HANDOFF.md when you return to active work on any of these:

- **retail-product-label-system** — Backend infrastructure (Supabase Edge Functions)
- **taxdome-scraper** — Data scraping tool
- **outlook_analyzer_project** — Outlook/productivity analysis
- **json-playground** — Development testing tool

---

## Container Folders (No Action Needed)

These are containers that hold sub-projects — they don't need CLAUDE.md or HANDOFF.md at the top level:

- **Api/** — Contains caintaxadvisor_website, pet_scheduler sub-projects
- **client-websites/** — Contains cain-tax-advisors, templates
- **my-websites/** — Contains axionteal-website, nexusblue-website

**Sub-projects in containers:** If any of these sub-projects become active development targets, add CLAUDE.md + HANDOFF.md at the sub-project level, not the container level.

---

## Documentation-Only Folders (No Action Needed)

These folders contain documentation, knowledge bases, or operating system materials — not code projects. CLAUDE.md and HANDOFF.md don't apply:

- enterprise-personal-brand-enablement
- nexusblue-operating-system
- nexusblue-platform
- app-urls
- customer-md
- sample-project
- tax-accounting-firm-kb-template

---

## How to Add CLAUDE.md to a New Active Project

1. Copy `application-templates/claude/PROJECT_CLAUDE_TEMPLATE.md` to the project root as `CLAUDE.md`
2. Fill in the Project Identity section
3. Add only project-specific rules — global standards are inherited automatically
4. If no HANDOFF.md exists, copy `application-templates/claude/HANDOFF_TEMPLATE.md` and fill it out
5. Commit both files as the project foundation

---

## When Starting a Brand New Project

1. Create the GitHub repo under `NexusBlueDev/`
2. Copy `application-templates/nexusblue-game-template/` (for HTML5 PWA) OR scaffold from existing stack
3. Copy `HANDOFF_TEMPLATE.md` → `HANDOFF.md` and fill out every section
4. Copy `PROJECT_CLAUDE_TEMPLATE.md` → `CLAUDE.md` and fill out
5. Optionally set up publishing pipeline from `application-templates/publishing-pipeline-template/`
6. Initial commit: "feat: initial project scaffold"
