# NexusBlue Development Environment — External LLM Context Brief

> **Purpose:** This document gives any external AI assistant (ChatGPT, Grok, Gemini, etc.)
> enough context about NexusBlue's development environment, architecture, and standards
> to help **plan and design new projects, features, and integrations**.
>
> **Last updated:** 2026-03-02 (rev 3 — added component classification, planning workflow, agent/integration standards)
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
| Database + Auth | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Hosting | Vercel (auto-deploys via GitHub integration) |
| CMS | Sanity.io (where content editing is needed) |
| AI | Anthropic Claude API via Vercel AI SDK |
| Payments | Stripe (Checkout, Webhooks, Customer Portal) |
| Email | SendGrid |
| Static apps | HTML5 + Vanilla JS (ES5) + GitHub Pages |
| CI/CD | GitHub Actions (lint + typecheck + test on every push) |
| Testing | Vitest (unit/integration) |

**Node.js 22 LTS** is required for all JS/TS projects.

**"Use What We Have" Rule:** Before recommending a new tool or service, check whether the existing stack already solves the problem. If yes, use it. Document why if you bring in something new.

---

## Project Type Taxonomy

Every NexusBlue project is classified as one of these types. The type determines the database architecture, auth model, and seed account structure.

### 1. Platform Product
**What it is:** A multi-tenant SaaS that NexusBlue builds and operates. Multiple client organizations use the same codebase. NexusBlue has a super-admin view across all orgs.

**Examples:** pw-app (vehicle inspection SaaS), cnc-platform, pet_scheduler, nexusblue-website

**Architecture requirements:**
- `organizations` table — every tenant is a row
- `organization_id UUID` on every data table
- Three-tier Supabase RLS: `service_role` (full) → `nexusblue_admin` (cross-org read) → org member (own org only)
- `platform_role` column on `profiles` for NexusBlue super-admin access
- Auth: Supabase Auth with role stored in `profiles.role` (authoritative) and synced to `user_metadata` (fast cache for middleware)

### 2. Website / Standalone
**What it is:** A single-tenant web application or marketing website for one client. No multi-tenancy.

**Examples:** mcpc-website (nonprofit), cain-website-022026 (tax firm), sectorius-website

**Architecture requirements:**
- No `organizations` table, no `organization_id`
- Standard RLS: users read/write their own records
- Auth: same Supabase Auth pattern as Platform Products, minus multi-tenancy

### 3. Static PWA
**What it is:** Pure client-side HTML5 app. No backend, no auth, no database. GitHub Pages hosted.

**Examples:** nexusblue-junior-jarvis (AI career game for expo booths)

### 4. Infrastructure / Scripts
**What it is:** Server configuration, DevOps tooling, automation pipelines.

**Examples:** nexusblue-servers (systemd/nginx), transcript-safety-pipeline (Python data pipeline)

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

**Template:** Use `NEW_AGENT_PROMPT.md` when adding a background agent.

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
| nexusblue-website | Platform Product | NexusBlue company platform | Stripe, Sanity, super-admin portal |
| mcpc-website | Website / Standalone | Montgomery County Prevention Coalition | No CMS |
| cain-website-022026 | Website / Standalone | Cain Tax Advisors | Sanity, Retell AI |
| sectorius-website | Website / Standalone | Sectorius | — |
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
| `INTEGRATION_STANDARD.md` v1.0 | Reference during integration development | Auth patterns, type isolation, caching, error handling |
| `EXTERNAL_LLM_BRIEF.md` | Sharing context with any external AI | This document |

---

## Active Prefixes & Slugs (Do Not Reuse)

**Project slugs:** `mcpc`, `cain`, `cnc`, `pw`, `nexusblue`, `scheduler`, `sectorius`

**Module table prefixes:** `webmap_` (WebMap), `av_` (AppVault), `dev_` (Super-Admin Portal)

---

## What We Don't Do

- No React Native / mobile apps (web PWA instead)
- No custom auth implementations (Supabase Auth only)
- No hardcoded secrets (`.env.local` only, gitignored)
- No `vercel deploy` CLI (bypasses GitHub — code loss risk). Deploy via GitHub auto-deploy
- No introducing new tools/services without checking if the existing stack covers it
- No code without classification — every piece of work is classified before building
