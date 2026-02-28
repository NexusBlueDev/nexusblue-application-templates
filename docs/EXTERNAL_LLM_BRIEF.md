# NexusBlue Development Environment — External LLM Context Brief

> **Purpose:** This document gives any external AI assistant (ChatGPT, Grok, Gemini, etc.)
> enough context about NexusBlue's development environment, architecture, and standards
> to contribute useful planning, design, and technical guidance.
>
> **Last updated:** 2026-02-28
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
| Hosting | Vercel (REST API deploy from Droplet) |
| CMS | Sanity.io (where content editing is needed) |
| AI | Anthropic Claude API via Vercel AI SDK |
| Payments | Stripe (Checkout, Webhooks, Customer Portal) |
| Email | SendGrid |
| Static apps | HTML5 + Vanilla JS (ES5) + GitHub Pages |

**Node.js 22 LTS** is required for all JS/TS projects.

---

## Project Type Taxonomy

Every NexusBlue project is classified as one of these types. The type determines the database architecture, auth setup, and seed account structure.

### 1. Platform Product
**What it is:** A multi-tenant SaaS that NexusBlue builds and operates. Multiple client organizations use the same codebase. NexusBlue has a super-admin view across all orgs.

**Examples:** pw-app (vehicle inspection SaaS — WrapOps is org #1), cnc-platform, pet_scheduler (scheduling SaaS), nexusblue-website

**Architecture requirements:**
- `organizations` table — every tenant is a row
- `organization_id UUID` on every data table
- Three-tier Supabase RLS:
  - `service_role` — full access (backend/migrations)
  - `nexusblue_admin` — read across all orgs (platform oversight)
  - Org member — read/write own org data only
- `platform_role TEXT CHECK ('nexusblue_admin')` on `profiles` table
- NexusBlue super-admin account: `nexusblue-admin@nexusblue.dev`
- Dev test accounts: `test-[role]@[slug].dev / NxB_dev_2026!`

**Roles (varies by product):** Typically `admin`, `employee`, `client`. Some products use `super_admin`, `owner`, `employee`, `client`.

### 2. Website / Standalone
**What it is:** A single-tenant web application or marketing website for one client. No multi-tenancy. Standard Supabase RLS (user owns their own data).

**Examples:** mcpc-website (nonprofit prevention coalition), cain-website-022026 (tax firm)

**Architecture requirements:**
- No `organizations` table
- No `organization_id` on data tables
- Standard RLS: users read/write their own records
- Dev test accounts: `test-[role]@[slug].dev / NxB_dev_2026!`

### 3. Static PWA
**What it is:** Pure client-side HTML5 app. No backend, no auth, no database. GitHub Pages hosted.

**Examples:** nexusblue-junior-jarvis (AI career game for expo booths), nexusblue-junior-jarvis-career

**Architecture requirements:** None. ES5 JavaScript, service worker, no build step.

### 4. Infrastructure
**What it is:** Server configuration, systemd services, nginx, DevOps tooling.

**Examples:** nexusblue-servers

### 5. Script / Pipeline
**What it is:** Python scripts, data pipelines, automation tools.

**Examples:** transcript-safety-pipeline (meeting transcript ingestion → pgvector → chat UI)

---

## Auth Architecture (Platform Products & Website/Standalone)

All projects with auth use the same pattern:

- **Login:** Next.js server actions + native HTML form POST (enables Chrome password manager)
- **Session:** Supabase cookie-based sessions via `@supabase/ssr`
- **Role storage:** Two sources of truth:
  - `profiles.role` in PostgreSQL — authoritative
  - `user_metadata.role` in Supabase Auth — fast cache for middleware
  - Server actions sync DB → metadata on every login
- **Middleware:** Reads `user_metadata.role` (no DB hit). Enforces route-level access.
- **Input attributes required:** `autoComplete="email"` and `autoComplete="current-password"` on login forms for Chrome password manager compatibility

---

## Module Standard (Platform Products)

Platform Products that offer gated features follow a module standard:

Every feature module has four database components:

| Table | Purpose |
|-------|---------|
| `{prefix}_module_permissions` | Per-org feature gates (enabled/disabled per org) |
| `{prefix}_module_defaults` | Platform-wide default config (seeded by migration) |
| `{prefix}_feature_overrides` | Per-org config overrides on top of defaults |
| `{prefix}_usage` | Billing metering (tracks consumption per org) |

**AI-first rule:** Every module that touches AI must log to `{prefix}_usage` with `tokens_used`, `cost_usd`, and `model_used` columns. This enables per-org billing.

**Module permission check pattern:**
```
org setting → platform default → deny
```

---

## Design System Conventions

All web projects use CSS custom properties with these canonical token names (values vary per brand):

```css
/* Brand */
--brand-primary        /* Main brand color */
--brand-secondary      /* Secondary accent */
--brand-accent         /* Tertiary / highlight */

/* Surfaces */
--surface-primary      /* Page background */
--surface-secondary    /* Card / panel background */
--surface-tertiary     /* Subtle inset / input background */

/* Text */
--text-primary         /* Body text */
--text-secondary       /* Muted / supporting text */
--text-muted           /* Placeholder / disabled */
--text-on-brand        /* Text on brand-colored backgrounds */

/* Borders & UI */
--border-default       /* Standard borders */
--border-subtle        /* Hairline / de-emphasized borders */
--radius-sm / --radius-md / --radius-lg

/* Feedback */
--success / --warning / --error / --info
```

**Reserved component class names** (defined in `globals.css`, consistent across projects):
- `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-danger` — buttons
- `.input` `.input-field` — form inputs
- `.card` `.card-header` `.card-body` — card containers
- `.badge` `.badge-success` `.badge-warning` `.badge-error` — status badges
- `.page-container` `.content-grid` — layout wrappers

**Font convention:** Poppins (body) + Oswald (headings) via Google Fonts / `next/font/google`

---

## Active Project Roster

| Project | Type | Client / Purpose | Stack notes |
|---------|------|-----------------|------------|
| pw-app | Platform Product | Vehicle inspection SaaS — WrapOps is org #1 | Next.js 15, PWA, offline queue, PDF reports |
| cnc-platform | Platform Product | CNC workshop guided workflows | Next.js 15, Sanity CMS |
| pet_scheduler | Platform Product | General scheduling SaaS | Next.js 14, 4-role system, Google + MS Calendar OAuth |
| nexusblue-website | Platform Product | NexusBlue company platform | Next.js 15, Stripe, Sanity |
| mcpc-website | Website / Standalone | Montgomery County Prevention Coalition | Next.js 16, no CMS |
| cain-website-022026 | Website / Standalone | Cain Tax Advisors | Next.js 15, Sanity, Retell AI |
| nexusblue-junior-jarvis | Static PWA | AI job guessing game (expo booth) | HTML5 / ES5, GitHub Pages |
| nexusblue-junior-jarvis-career | Static PWA | AI career discovery tool (expo booth) | HTML5 / ES5, GitHub Pages |
| nexusblue-servers | Infrastructure | DigitalOcean Droplet management | Ubuntu, systemd, nginx |

---

## Key Architectural Decisions

**Why Supabase over custom auth?**
Built-in auth, RLS at the database level, pgvector for AI embeddings, realtime subscriptions, and storage — all in one managed service. Avoids building and maintaining an auth layer.

**Why Vercel over DigitalOcean for frontends?**
Preview URLs per branch, automatic SSL, edge functions, and zero-config Next.js deploys. DigitalOcean runs background services and the dev environment.

**Why Next.js App Router?**
Server components reduce client bundle size. Server actions eliminate boilerplate API routes for form handling. Native streaming support for AI chat.

**Why Tailwind v4 with CSS custom properties?**
v4's `@layer` system requires care (see below), but CSS variables allow per-project theming while keeping class names consistent across projects.

**Critical Tailwind v4 gotcha:**
Any CSS reset (`*, *::before, *::after { margin: 0; padding: 0 }`) outside `@layer base {}` silently overrides all Tailwind utilities in production webpack builds. All element-selector overrides must be inside `@layer base {}`.

---

## What to Know When Planning New Work

1. **New Platform Product?** → organizations table, three-tier RLS, NexusBlue super-admin, module standard for gated features
2. **New Website/Standalone?** → standard Supabase RLS, no multi-tenancy, seed NexusBlue dev accounts
3. **New feature module?** → four-table module pattern (permissions, defaults, overrides, usage)
4. **Adding AI?** → log to `_usage` table with tokens/cost/model. Use `claude-sonnet-4-6` for quality, `claude-haiku-4-5` for speed. Wrap streams in custom ReadableStream (never `toTextStreamResponse()` for user-facing chat — it leaks API errors mid-stream)
5. **Adding payments?** → Stripe Checkout + Webhook + Customer Portal pattern. Never store payment data in Supabase
6. **PWA needed?** → Serwist for service worker. Add `NetworkOnly` rules for auth routes, server actions, and API routes BEFORE `defaultCache`. Set `cacheOnNavigation: false`

---

## What We Don't Do

- No React Native / mobile apps (web PWA instead)
- No custom auth implementations (Supabase Auth only)
- No hardcoded secrets (`.env.local` only, gitignored)
- No `vercel deploy` CLI (deploys bypass GitHub — code loss risk). Always deploy via REST API
- No introducing new tools/services without checking if the existing stack covers it
