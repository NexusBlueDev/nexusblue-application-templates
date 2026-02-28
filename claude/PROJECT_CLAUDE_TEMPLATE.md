# [PROJECT NAME] — Project-Specific Claude Code Instructions
<!-- Copy this file to your project root as CLAUDE.md -->
<!-- Keep this file SHORT. Only put project-specific rules here. -->
<!-- Global standards (security, workflow, Windows/OneDrive, commit discipline, session protocols) -->
<!-- are defined in the global template and inherited automatically. -->

**Global template version:** v5.0
**Based on:** `application-templates/claude/CLAUDE.md`

---

## Project Type

**Type:** [Platform Product | Website / Standalone | Static PWA | Infrastructure | Script / Pipeline]

<!-- Platform Product: uncomment and fill in -->
<!-- White-label [describe] SaaS. NexusBlue owns the platform. `organizations` table required. -->
<!-- `organization_id` on all data tables. Three-tier RLS (service_role → nexusblue_admin → org member). -->
<!-- [Client Name] is org #1. No self-signup — admin creates all accounts. -->

<!-- Website / Standalone: uncomment and fill in -->
<!-- Single-tenant [describe] for [Client Name]. Standard Supabase RLS (user → own data). -->
<!-- No `organizations` table. No `organization_id` on data tables. -->

<!-- Static PWA: uncomment and fill in -->
<!-- Client-side only. No auth, no database, no backend. Hosted on GitHub Pages. -->

---

## Project Identity

```
What:    [One-sentence description of what this project is]
Client:  [Client / Owner name]
Repo:    https://github.com/NexusBlueDev/[REPO-NAME]
Live:    [URL or "not deployed"]
Stack:   [Key technologies — only what differs from or adds to the global stack]
```

---

## Workflow Rules

<!-- Only include rules that OVERRIDE or ADD TO the global workflow. -->
<!-- "Always commit before any task is complete" is already global — don't repeat it. -->

- [Any project-specific workflow rule]
- [e.g., "Run npm run build before every push"]

---

## Architecture

<!-- Key things Claude needs to know to navigate this project. -->
<!-- For complex projects, reference ARCHITECTURE.md. -->

**Key files:**
- `[file]` — [what it does]
- `[file]` — [what it does]

**Conventions:**
- [Project-specific naming or structural convention]

---

## Stack Specifics

<!-- Only include what's specific to this project, beyond the global stack. -->

```
Framework:     Next.js 15 + TypeScript
Styling:       Tailwind v4
Database/Auth: Supabase
Hosting:       Vercel
Node:          >=22.0.0
```

---

## Seed Accounts

<!-- Platform Product format: -->
<!-- NexusBlue super-admin: nexusblue-admin@nexusblue.dev / NxB_dev_2026! -->
<!-- Dev org accounts:      test-[role]@[slug].dev / NxB_dev_2026! -->
<!-- Client initial:        [email] / TempPass1! (must_reset_pw=true — uncomment when onboarding) -->

<!-- Website / Standalone format: -->
<!-- Dev accounts:    test-[role]@[slug].dev / NxB_dev_2026! -->
<!-- Client initial:  [email] / TempPass1! (must_reset_pw=true — uncomment when onboarding) -->

Run `./scripts/seed-accounts.sh` to create all dev accounts.

---

## Project-Specific Rules

<!-- Rules that only make sense for this project. -->

1. [Rule]
2. [Rule]

---

## Notes for Future Sessions

<!-- Important context that doesn't fit elsewhere. -->
<!-- Migrate to HANDOFF.md if project-state related. -->
<!-- Migrate to global template if applicable to all projects. -->

- [Note]
