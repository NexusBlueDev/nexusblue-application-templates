# NexusBlue Development Environment — External LLM Context Brief

> **Purpose:** This document gives any external AI assistant (ChatGPT, Grok, Gemini, etc.)
> enough context about NexusBlue's development environment, architecture, and standards
> to help **plan and design new projects, features, and integrations**.
>
> **Last updated:** 2026-03-04 (rev 4 — added environment pipeline, dev agents, multi-LLM, AIRP)
> **Maintained by:** NexusBlue Dev (nexusblue.ai)

---

## Who We Are

**NexusBlue** is an AI-first digital development studio. We build two types of work:

1. **Client websites and platforms** — custom digital products for external clients
2. **NexusBlue SaaS products** — white-label platforms we own and operate, licensed to clients as org #1

We operate as a small, high-velocity team. All code lives on a DigitalOcean Droplet, version controlled in GitHub under the `NexusBlueDev` organization, deployed primarily to Vercel. Claude Code (Anthropic's AI coding tool) is the primary development copilot and enforces all standards documented here.

---

## Standard Tech Stack

Every project is built from this stack unless there's a documented reason to deviate:

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database + Auth | Supabase (PostgreSQL + Auth + RLS + Realtime + pgvector) |
| Hosting | Vercel (auto-deploys via GitHub integration) |
| CMS | Sanity.io (where content editing is needed) |
| AI | Anthropic Claude API via Vercel AI SDK (multi-LLM router for dev agents) |
| Payments | Stripe (Checkout, Webhooks, Customer Portal) |
| Email | SendGrid |
| Static apps | HTML5 + Vanilla JS (ES5) + GitHub Pages |
| CI/CD | GitHub Actions (lint + typecheck + test on every push) |
| Testing | Vitest (unit/integration) |
| Dev Agents | GitHub Actions + Claude Code Action (self-healing CI, code review) |

**Node.js 22 LTS** is required for all JS/TS projects.

**"Use What We Have" Rule:** Before recommending a new tool or service, check whether the existing stack already solves the problem. If yes, use it. Document why if you bring in something new.

---

## Environment Pipeline (Three Environments)

All projects operate in a three-environment pipeline:

| Environment | Branch | Deploy Target | Purpose |
|-------------|--------|---------------|---------|
| **Sandbox** | `sandbox/*` | Vercel preview URL (auto) | Rapid prototyping, experiments. CI runs in advisory mode (failures don't block) |
| **Dev** | `dev` | `[project].nexusblue.ai` preview domain | Testing/staging. CI must pass. PRs reviewed before merge |
| **Production** | `main` | Production domain | Live/client-facing. Branch protection enforced |

**Promotion flow:** `sandbox/*` → PR to `dev` → PR to `main`

**Key rules:**
- Sandbox branches are autonomous — agents can push fixes directly
- Dev requires human PR review (supervised)
- Production always requires human merge approval (supervised)
- Stale `sandbox/*` branches auto-cleaned after 14 days (GitHub Actions cron)

---

## Development Agent Team

Claude Code operates as the AI development team with defined agent roles:

| Agent | Type | Trigger | Model | Description |
|-------|------|---------|-------|-------------|
| `dev-architect` | review | PR to `dev` | Haiku | Schema, RLS, migration review |
| `dev-security` | review | PR to `main` | Haiku | Auth, validation, data exposure audit |
| `dev-qa` | review | Module → LIVE | Haiku | Module standard compliance check |
| `dev-docs` | gate | Pre-push | Haiku | Documentation freshness enforcement |
| `dev-ci-healer` | automation | CI failure | Sonnet | Reads failure logs, generates fix |
| `dev-sandbox-builder` | automation | Portal trigger | Sonnet | Receives spec, builds prototype |
| `dev-promoter` | automation | Portal trigger | Sonnet | Creates PR from sandbox to dev |

**Agent types:**
- **review** — reads code, produces PASS / ISSUES FOUND assessment
- **gate** — blocks a lifecycle transition until conditions met
- **automation** — writes code, creates commits/PRs

**Autonomy rules (non-negotiable):**

| Environment | Default | Override? |
|------------|---------|-----------|
| Sandbox | Autonomous | No — always autonomous |
| Dev | Supervised | Yes — can promote specific agents |
| Production | Supervised | No — always supervised |

---

## Multi-LLM Strategy

Agents use a model router that selects the right model for each task:

| Task Type | Primary Model | Fallback | Use Case |
|-----------|--------------|----------|----------|
| Code generation | Claude Sonnet 4.6 | GPT-4o | CI healer, sandbox builder |
| Judgment/classification | Claude Haiku 4.5 | Sonnet | Architect, security, QA reviews |
| Heavy reasoning | Claude Opus 4.6 | Sonnet | Novel architecture, complex debugging |
| Content generation | Claude Sonnet 4.6 | Haiku | PR descriptions, reports |
| Embeddings/search | Voyage AI / OpenAI | — | Future: codebase search |

**Budget controls:**
- Per-project and global monthly LLM spend limits
- 70% = info logged, 90% = warning in portal, 100% = block non-critical agents
- CI healer always allowed regardless of budget

---

## Agent Isolation (AIRP)

The Agent Isolation & Resource Reservation Protocol prevents conflicts when multiple Claude Code sessions run simultaneously:

- **One project per session** — cross-project writes require human approval
- **Declare resources before building** — migrations, flags, dependencies in plan phase
- **Log cross-project bugs, don't fix them** — issue queue, not direct edits
- **Migrations are reserved, not first-come-first-served** — claim in migration_registry
- **Read-only access is always free** — boundary guard only blocks writes

---

## Project Type Taxonomy

Every NexusBlue project is classified as one of these types. The type determines the database architecture, auth model, and seed account structure.

### 1. Platform Product
**What it is:** A multi-tenant SaaS that NexusBlue builds and operates. Multiple client organizations use the same codebase. NexusBlue has a super-admin view across all orgs.

**Architecture requirements:**
- `organizations` table — every tenant is a row
- `organization_id UUID` on every data table
- Three-tier Supabase RLS: `service_role` (full) → `nexusblue_admin` (cross-org read) → org member (own org only)
- `platform_role` column on `profiles` for NexusBlue super-admin access
- Auth: Supabase Auth with role stored in `profiles.role` (authoritative) and synced to `user_metadata` (fast cache for middleware)

### 2. Website / Standalone
**What it is:** A single-tenant web application or marketing website for one client. No multi-tenancy.

**Architecture requirements:**
- No `organizations` table, no `organization_id`
- Standard RLS: users read/write their own records
- Auth: same Supabase Auth pattern as Platform Products, minus multi-tenancy

### 3. Static PWA
**What it is:** Pure client-side HTML5 app. No backend, no auth, no database. GitHub Pages hosted.

### 4. Infrastructure / Scripts
**What it is:** Server configuration, DevOps tooling, automation pipelines.

---

## Component Classification — Classify Before You Build

Every new piece of work must be classified before implementation begins. The classification determines which standard governs it, how much structure is required, and what template to use.

### The Five Component Types

| Type | What It Is | Governance | Standard |
|------|-----------|------------|----------|
| **Module** | Self-contained feature domain with DB tables, UI pages, API routes, feature gates | Heavy — docs before code, billing unit, role matrix | `MODULE_STANDARD.md` |
| **Agent** | Scheduled/triggered background task that processes data and writes results | Medium — route pattern, logging, cron registration | `AGENT_STANDARD.md` |
| **Integration** | Wrapper around an external API (auth + typed queries + error handling) | Medium — auth module, type isolation, env vars | `INTEGRATION_STANDARD.md` |
| **Script** | One-off or on-demand utility (seed data, migrate, deploy) | Light — `scripts/` directory, clear header comment |
| **Service** | Long-running background process (systemd unit on Droplet) | Medium — systemd unit, health check, log rotation |

### Decision Flowchart

Answer these questions in order:

1. **Does it wrap an external API?** → **Integration** (e.g., Google PageSpeed, Stripe, SendGrid)
2. **Does it run on a schedule or in response to an event (no UI)?** → **Agent** (e.g., weekly performance snapshots, email queue processing)
3. **Does it have its own DB tables, UI pages, AND feature gates?** → **Module** (e.g., AppVault, WebMap, billing)
4. **Is it a one-off utility or operational task?** → **Script** (e.g., seed-accounts.sh, deploy.sh)
5. **Does it run continuously as a background process?** → **Service** (e.g., WebSocket server, queue worker)

### Promotion Rules

Components naturally grow. When they cross a threshold, promote them:

| From → To | Trigger |
|-----------|---------|
| Script → Agent | Needs a schedule, logging, or error tracking |
| Agent → Module | Needs UI pages, feature gates, billing metering, or 3+ dedicated DB tables |
| Integration → Module | Needs its own DB tables, UI pages, or feature gates |

**When promoting, follow the target standard's checklist from scratch.** Don't skip steps because "it was working before."

---

## Module Standard (Summary)

Modules are the heaviest governance tier. Full standard: `MODULE_STANDARD.md` v1.3.

**Core pattern:** Every module has four database components:

| Table | Purpose |
|-------|---------|
| `{prefix}_module_permissions` | Per-org feature gates (enabled/disabled per org) |
| `{prefix}_module_defaults` | Platform-wide default config (seeded by migration) |
| `{prefix}_feature_overrides` | Per-org config overrides on top of defaults |
| `{prefix}_usage` | Billing metering (tracks consumption per org) |

**Key rules:**
- **Structure before code** — `docs/modules/{module}/` with README, ARCHITECTURE, SCHEMA must exist before any implementation
- **Billing unit defined before migration** — what gets counted per org per billing period
- **Role capability matrix** — which roles can do what, declared in README, enforced in API routes
- **AI-first** — AI does the work, humans approve outcomes. Streaming is default for user-facing calls
- **Three commercial modes:** Embedded (in NexusBlue subscription), Managed Product (NexusBlue operates), Standalone App (client owns)

**Module lifecycle:** PLANNING → FOUNDATION → BUILDING → ADMIN → LIVE → EXPANDED → MAINTAINED

**Template:** Use `NEW_MODULE_PROMPT.md` when adding a module to an existing project.

---

## Agent Standard (Summary)

Agents are background automation tasks. Full standard: `AGENT_STANDARD.md` v1.0.

**Core pattern:** Cron route at `src/app/api/cron/{agent-name}/route.ts`, registered in `vercel.json`.

**Key rules:**
- Auth via `verifyCronSecret(request)` — never unauthenticated
- Partial success pattern — process all items, track errors, never abort the batch for one failure
- Log every run to a structured table (agent_type, result, summary, details)
- Result codes: `pass` / `issues_found` / `error`
- AI-powered agents registered in `src/lib/agents/registry.ts`
- Model rule: Sonnet for generation, Haiku for judgment, code for deterministic

**Dev agents** (CI healer, sandbox builder, etc.) run as GitHub Actions workflows using `anthropics/claude-code-action@v1`. See `DEV_AGENT_STANDARD.md` for the full development agent contract.

---

## Integration Standard (Summary)

Integrations wrap external APIs. Full standard: `INTEGRATION_STANDARD.md` v1.0.

**Core pattern:** Auth module at `src/lib/{provider}/auth.ts`, typed queries per resource, types at `src/types/{provider}.ts`.

**Key rules:**
- Cache client instances (serverless reuses processes)
- Type isolation — map external shapes to internal types at the boundary. If you swap providers, only the integration lib changes
- Graceful degradation — integrations never crash the calling feature. Return typed errors
- Webhook verification mandatory (Stripe, GitHub, etc.)
- Rate limit awareness — document limits, add caching or queuing as needed

**No template needed** — integrations are lightweight enough that the standard itself serves as the guide.

---

## Planning Workflow — How to Design New Work

When an external AI is helping NexusBlue plan new work, follow this sequence:

### Step 1: Classify Every Piece of Work

Before designing anything, run each feature/capability through the decision flowchart above. State the classification explicitly: "This is a **Module** (has its own DB tables, UI, and feature gates)" or "This is an **Integration** (wraps the Stripe API)."

### Step 2: Pick the Right Template

| Work Type | Template to Use |
|-----------|----------------|
| Brand new project | `NEW_PROJECT_PROMPT.md` |
| New module in existing project | `NEW_MODULE_PROMPT.md` |
| New background agent | `NEW_AGENT_PROMPT.md` |
| New external API integration | Follow `INTEGRATION_STANDARD.md` directly |
| New utility script | Follow Script conventions in global CLAUDE.md |

### Step 3: Design Within the Standard

Each standard defines:
- Required directory structure
- Required documentation (before code for Modules)
- Database conventions (naming, RLS, JSONB)
- Checklist to verify before shipping

### Step 4: Check for Promotion

If during design you realize a component crosses a governance boundary (e.g., "this Agent needs its own UI pages"), flag it and promote to the correct type before building.

### Key Design Principles

- **Modules need docs before code.** README + ARCHITECTURE + SCHEMA before any implementation
- **Every data table in Platform Products has `organization_id`.** No exceptions
- **AI usage is always logged.** Tokens, cost, model — per org, per billing period
- **Feature gates are registered in migrations**, not hardcoded in UI
- **Streams for user-facing AI.** Never make users wait for a complete response
- **Wrap AI streams in custom ReadableStream.** Never use `toTextStreamResponse()` — it leaks API errors mid-stream
- **PWA service workers need auth route exclusions.** `NetworkOnly` rules before default cache
- **Three-environment pipeline.** Design for sandbox (autonomous) → dev (supervised) → production (supervised)
- **Budget-aware agents.** Every agent checks LLM budget before executing

---

## Design System Conventions

All web projects use CSS custom properties with these canonical token names (values vary per brand):

```css
/* Brand */
--brand-primary        /* Main brand color */
--brand-primary-hover  /* Hover state */
--brand-accent         /* Secondary accent */

/* Surfaces */
--surface-primary      /* Page background */
--surface-secondary    /* Card / panel background */

/* Text */
--text-primary         /* Body text */
--text-secondary       /* Muted / supporting text */
--text-muted           /* Placeholder / disabled */
--text-on-primary      /* Text on brand-colored backgrounds */

/* Borders & Radius */
--border-default       /* Standard borders */
--radius-sm / --radius-md / --radius-lg
```

**Reserved component class names** (defined in `globals.css`, consistent across projects):
- `.btn-primary` `.btn-secondary` `.btn-accent` — buttons
- `.input` `.input-field` — form inputs
- `.page-container` — centered max-width layout wrapper
- `.card-hover` — hover lift effect

**Font convention:** Poppins (body) + Oswald (headings, uppercase) via `next/font/google`

---

## Active Project Roster

| Project | Type | Client / Purpose | Stack notes |
|---------|------|-----------------|------------|
| pw-app | Platform Product | Vehicle inspection SaaS — WrapOps is org #1 | PWA, offline queue, PDF reports |
| cnc-platform | Platform Product | CNC workshop guided workflows | Sanity CMS |
| pet_scheduler | Platform Product | General scheduling SaaS | 4-role system, Google + MS Calendar OAuth |
| nexusblue-website | Platform Product | NexusBlue company platform + super-admin portal | Stripe, Sanity, portal agents, dev agent tracking |
| mcpc-website | Website / Standalone | Montgomery County Prevention Coalition | No CMS |
| cain-website-022026 | Website / Standalone | Cain Tax Advisors | Sanity, Retell AI |
| sectorius-website | Website / Standalone | Sectorius | — |
| beers-biz-dayton | Website / Standalone | Beers & Biz check-in PWA | Shares nexusblue-website Supabase DB |
| nexusblue-junior-jarvis | Static PWA | AI job guessing game (expo booth) | HTML5 / ES5, GitHub Pages |
| nexusblue-servers | Infrastructure | DigitalOcean Droplet management | Ubuntu, systemd, nginx |

---

## Key Architectural Decisions

**Why Supabase over custom auth?**
Built-in auth, RLS at the database level, pgvector for AI embeddings, realtime subscriptions, and storage — all in one managed service.

**Why Vercel over DigitalOcean for frontends?**
Preview URLs per branch, automatic SSL, edge functions, zero-config Next.js deploys. DigitalOcean runs background services and the dev environment.

**Why Next.js App Router?**
Server components reduce client bundle size. Server actions eliminate boilerplate API routes for form handling. Native streaming for AI chat.

**Why Tailwind v4?**
CSS variables allow per-project theming while keeping class names consistent. Note: all element-selector overrides must be inside `@layer base {}` — unlayered resets silently break all utilities in production.

**Why GitHub Actions for dev agents?**
Ephemeral runners (no persistent state), free audit trail via workflow logs, no new infrastructure needed. Claude Code Action (`anthropics/claude-code-action@v1`) runs headless on runners.

---

## Template Documents Available

For consistent project setup, these templates live in `nexusblue-application-templates/docs/`:

| Document | When to Use | Purpose |
|----------|------------|---------|
| `NEW_PROJECT_PROMPT.md` | Starting a brand new project | Copy-paste Claude Code prompt — scaffolds project with all standards |
| `NEW_MODULE_PROMPT.md` | Adding a feature module to an existing project | Copy-paste Claude Code prompt — creates docs-first, then schema, then code |
| `NEW_AGENT_PROMPT.md` | Adding a background cron/event agent | Copy-paste Claude Code prompt — creates route, cron registration, logging |
| `MODULE_STANDARD.md` v1.3 | Reference during module development | Full directory contract, naming, DB conventions, AI rules, monetization |
| `AGENT_STANDARD.md` v1.0 | Reference during agent development | Route pattern, cron registration, logging, error handling |
| `DEV_AGENT_STANDARD.md` v1.0 | Reference for dev agent team | Dev agent contracts, autonomy rules, CI healer pattern, cost tracking |
| `INTEGRATION_STANDARD.md` v1.0 | Reference during integration development | Auth patterns, type isolation, caching, error handling |
| `ENVIRONMENT_PIPELINE_STANDARD.md` | Reference for environment setup | Three-environment pipeline, branch conventions, promotion gates |
| `AGENT_ISOLATION_STANDARD.md` | Reference for multi-session safety | AIRP protocol, reservation schema, boundary guard |
| `EXTERNAL_LLM_BRIEF.md` | Sharing context with any external AI | This document |

---

## Active Prefixes & Slugs (Do Not Reuse)

**Project slugs:** `mcpc`, `cain`, `cnc`, `pw`, `nexusblue`, `scheduler`, `sectorius`, `beers-biz-checkin`

**Module table prefixes:** `webmap_` (WebMap), `av_` (AppVault), `dev_` (Super-Admin Portal), `ca_` (Contacts & Attendance), `bg_` (BioGate), `gw_` (Grant Writer)

---

## Preview Domains (*.nexusblue.ai)

| Domain | Project | Branch |
|--------|---------|--------|
| `pw-app.nexusblue.ai` | pw-app | dev |
| `mcpc-website.nexusblue.ai` | mcpc-website | dev |
| `nexusblue-dev.nexusblue.ai` | nexusblue-website | dev |
| `cnc-platform.nexusblue.ai` | cnc-platform | dev |
| `cain-website.nexusblue.ai` | cain-website-022026 | dev |
| `pet-scheduler.nexusblue.ai` | pet_scheduler | dev |
| `sectorius-website.nexusblue.ai` | sectorius-website | dev |
| `beers-biz-checkin.nexusblue.ai` | beers-biz-dayton | production (public PWA) |

---

## What We Don't Do

- No React Native / mobile apps (web PWA instead)
- No custom auth implementations (Supabase Auth only)
- No hardcoded secrets (`.env.local` only, gitignored)
- No `vercel deploy` CLI (bypasses GitHub — code loss risk). Deploy via GitHub auto-deploy
- No introducing new tools/services without checking if the existing stack covers it
- No code without classification — every piece of work is classified before building
- No direct pushes to `main` — always via PR with CI pass
