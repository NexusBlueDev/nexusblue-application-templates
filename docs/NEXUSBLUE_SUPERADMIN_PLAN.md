# NexusBlue Super-Admin Portal — Full Specification

> **Route prefix:** `/nexusblue` (gated by `platform_role = 'nexusblue_admin'`)
> **Lives in:** nexusblue-website (nexusblue.ai)
> **Purpose:** Single command center where NexusBlue super-admin manages the entire
> development environment, IP catalog, AI methodology, and platform performance.
>
> **Status:** Planning complete — pending AppVault migrations 031+032 before building
> **Version:** 1.0 — 2026-02-28

---

## Philosophy

This portal answers three questions at all times:

1. **What do we have?** — Every project, module, and piece of documented IP in one place.
2. **Are we doing it right?** — AI-first methodology adherence, architecture compliance, security posture.
3. **What should we do next?** — AI-generated roadmap suggestions, performance gaps, industry benchmarks.

Agents run continuously in the background. The super-admin reviews, decides, and acts.

---

## Portal Map

```
/nexusblue                           Hub — at-a-glance across all sections
/nexusblue/environment               Dev environment management
/nexusblue/environment/projects      Project roster
/nexusblue/environment/tenants       Client org / tenant registry
/nexusblue/environment/agents        Orchestration agent log
/nexusblue/environment/brief         LLM Brief (copy to clipboard for external LLMs)

/nexusblue/ip                        IP Registry hub
/nexusblue/ip/projects               Deep project detail cards
/nexusblue/ip/modules                Module library — all gated features across all products
/nexusblue/ip/docs                   Documentation library — standards, architecture, decisions

/nexusblue/ai-monitor                AI-First Monitor hub
/nexusblue/ai-monitor/usage          Token + cost + model breakdown by project
/nexusblue/ai-monitor/adherence      AI-first pattern compliance per project
/nexusblue/ai-monitor/features       Per-feature AI performance (accuracy, fallback rate)

/nexusblue/industry                  Industry Benchmark hub
/nexusblue/industry/performance      Core Web Vitals vs industry benchmarks
/nexusblue/industry/methodology      NexusBlue AI-first vs industry standard approaches

/nexusblue/roadmap                   Roadmap & Improvement hub
/nexusblue/roadmap/suggestions       AI-generated improvement recommendations
/nexusblue/roadmap/backlog           Roadmap items across all projects (editable)

/nexusblue/health                    Platform Health hub
/nexusblue/health/builds             Vercel build status per project
/nexusblue/health/database           Supabase health (connections, table sizes, migration status)
/nexusblue/health/droplet            Droplet health (RAM, disk, load, active services)
/nexusblue/health/agents             Agent schedule, last run, next due
```

---

## Section 1: Hub (`/nexusblue`)

**Purpose:** Instant situational awareness. Land here and know what needs attention.

**Layout:** Dashboard cards in a 3-column grid.

| Card | Content |
|------|---------|
| Projects | Count by type: X Platform Products, X Standalone, X Static |
| Active Tenants | Total orgs across all products, count by status |
| Agent Health | Last architect/security/QA run per project — green/amber/red |
| AI Usage (MTD) | Total tokens this month, estimated cost, model breakdown |
| Performance Alerts | Any project below Core Web Vitals thresholds |
| Roadmap Items | Count of open suggestions, count of accepted backlog items |
| Droplet Health | RAM / disk / load — live |
| Recent Activity | Last 5 agent log entries across all projects |

---

## Section 2: Environment (`/nexusblue/environment`)

### Projects tab (`/nexusblue/environment/projects`)

Sortable table of every NexusBlue project:

| Column | Content |
|--------|---------|
| Name | Project name (links to `/nexusblue/ip/projects/[slug]`) |
| Type | Badge: Platform Product / Standalone / Static PWA / Infrastructure |
| Client | Client name |
| Status | Active / Paused / Archived |
| Live URL | Link |
| Preview URL | Link |
| GitHub | Link |
| Seed Script | ✓ / ✗ |
| Last Agent Run | Date of last architect/security/QA run |

**Actions:** Add project, Edit, Archive

**Seed on page:** Populated from `dev_projects` table. Initial data seeded for all 11 current projects.

### Tenants tab (`/nexusblue/environment/tenants`)

All client organizations across all Platform Products:

| Column | Content |
|--------|---------|
| Org Name | Name |
| Product | Which Platform Product they're on (pw-app, cnc-platform, etc.) |
| Plan Tier | starter / professional / enterprise |
| Status | onboarding / active / paused / churned |
| Admin Email | Primary contact |
| Org ID | UUID in that product's Supabase (for cross-reference) |
| Onboarded | Date |

**Actions:** Add org, Edit, View in product's Supabase

### Agent Log tab (`/nexusblue/environment/agents`)

Chronological feed of all orchestration agent runs:

| Column | Content |
|--------|---------|
| Date | Timestamp |
| Project | Which project |
| Agent | architect / security / qa |
| Result | PASS (green) / ISSUES FOUND (amber) / ERROR (red) |
| Summary | One-line output |
| Details | Expandable — full agent output |
| Triggered By | Email of person who ran it |

### LLM Brief tab (`/nexusblue/environment/brief`)

- Rendered markdown of `EXTERNAL_LLM_BRIEF.md` (fetched from GitHub raw or Supabase)
- **"Copy Brief to Clipboard"** — formats as clean text, ready to paste into any LLM
- **"Copy New Project Prompt"** — copies `NEW_PROJECT_PROMPT.md` content
- Last updated timestamp + CLAUDE.md version it reflects
- Orchestration agents can write updates to a `dev_llm_brief_overrides` table — appended to the brief as "Recent Changes" section

---

## Section 3: IP Registry (`/nexusblue/ip`)

**Purpose:** Know exactly what NexusBlue has built and owns. Every project, every module, every architectural decision captured in one searchable library.

### Projects (`/nexusblue/ip/projects`)

Card grid — one card per project. Richer than the environment table:

Each card shows:
- Project name + type badge + status
- One-line description (client/purpose)
- Stack pills (Next.js 15, Supabase, Stripe, etc.)
- Module count (for Platform Products)
- Architecture decision count (links to `/nexusblue/ip/docs`)
- Quick links: Live, Preview, GitHub, HANDOFF.md

Click → `/nexusblue/ip/projects/[slug]` — full project deep dive:
- Full stack detail
- All modules with their purpose and billing tier
- All architectural decisions (pulled from ARCHITECTURE.md or Supabase)
- Test account table
- Known issues / tech debt
- Agent run history for this project

### Module Library (`/nexusblue/ip/modules`)

Every gated feature module across all Platform Products:

| Column | Content |
|--------|---------|
| Module Name | e.g. "AI Chat", "WebMap", "AppVault" |
| Product | Which Platform Product it lives in |
| Purpose | What it does (one line) |
| Billing Tier | Which plan tier gates it |
| Tables | The four standard module tables (permissions, defaults, overrides, usage) |
| AI-Powered | Yes/No |
| Monthly Token Cost | Estimated (from `_usage` table) |
| Status | Live / In Development / Planned |

**Value:** You can see at a glance which modules are reusable across products, where AI cost is highest, and what's in development vs live.

### Documentation Library (`/nexusblue/ip/docs`)

Rendered and searchable documentation pulled from GitHub:

| Doc | Source | Purpose |
|-----|--------|---------|
| Global CLAUDE.md | `nexusblue-application-templates/claude/CLAUDE.md` | Dev standards |
| MODULE_STANDARD.md | `nexusblue-application-templates/docs/` | Module architecture |
| EXTERNAL_LLM_BRIEF.md | `nexusblue-application-templates/docs/` | External LLM context |
| NEW_PROJECT_PROMPT.md | `nexusblue-application-templates/docs/` | New project starter |
| Per-project ARCHITECTURE.md | Each project repo | System design |
| Per-project HANDOFF.md | Each project repo | Current state |

**Rendered in-browser.** Search across all docs. "Copy" button on each. Timestamp shows last GitHub commit to each file.

---

## Section 4: AI-First Monitor (`/nexusblue/ai-monitor`)

**Purpose:** Ensure NexusBlue is actually AI-first, not just AI-adjacent. Measure adherence, cost, and value.

### Usage (`/nexusblue/ai-monitor/usage`)

Aggregated AI usage across all products (pulled from each product's `_usage` table via service role API or periodic sync):

- **MTD cost by project** — bar chart
- **MTD tokens by model** — Haiku vs Sonnet vs Opus breakdown
- **Cost per active tenant** — which orgs are generating the most AI usage
- **Daily usage trend** — 30-day sparkline per project
- **Top API routes by usage** — which features consume the most tokens

### Adherence (`/nexusblue/ai-monitor/adherence`)

Per-project checklist of AI-first methodology compliance:

| Check | What we verify |
|-------|---------------|
| AI usage logging | Does `_usage` table exist and get populated? |
| Error handling | Is `textStream` wrapped in custom ReadableStream? |
| Retry logic | Are 500/529/429 retries implemented? |
| Fallback messages | User-friendly errors on AI failure? |
| Model selection | Haiku for speed, Sonnet for quality — is the pattern followed? |
| PII protection | Is PII detection active before logging? |

**Scored per project.** Green = compliant, Amber = partial, Red = missing.

The architect agent populates this data when it runs. Manual override available.

### Features (`/nexusblue/ai-monitor/features`)

Per-feature AI performance (where data is available):
- Chat widget: response time, error rate, session length
- AI search: query count, no-result rate
- Document AI (AppVault): processing time, success rate
- Voice features: transcription accuracy, fallback rate

---

## Section 5: Industry Benchmark (`/nexusblue/industry`)

**Purpose:** Know how NexusBlue performs relative to industry. Not just "is it working" but "is it better."

### Performance (`/nexusblue/industry/performance`)

Core Web Vitals and performance scores vs industry benchmarks:

| Metric | NexusBlue target | Industry avg | Industry top 10% |
|--------|-----------------|--------------|-----------------|
| LCP (Largest Contentful Paint) | < 2.5s | 3.2s | 1.8s |
| FID / INP | < 100ms | 180ms | 60ms |
| CLS | < 0.1 | 0.15 | 0.05 |
| TTFB | < 800ms | 1.2s | 500ms |
| Lighthouse Performance | > 90 | 72 | 95 |

Per-project scores (pulled via PageSpeed Insights API or Vercel Analytics):
- Score vs NexusBlue target — Pass/Fail
- Score vs industry top 10% — Gap
- Historical trend — improving or degrading

**Performance QA agent** runs weekly per project, writes scores to `dev_performance_snapshots`.

### Methodology (`/nexusblue/industry/methodology`)

Comparison of NexusBlue's AI-first approach vs industry standard approaches:

| Dimension | Industry standard | NexusBlue approach | Our advantage |
|-----------|------------------|-------------------|---------------|
| Auth | Custom or Auth0 | Supabase Auth + RLS | Zero maintenance, DB-level security |
| AI integration | API calls, no structure | Module standard with usage logging | Billing metering from day one |
| Multi-tenancy | Custom implementations | Organizations table + three-tier RLS | Reusable pattern, consistent |
| Deployment | Manual or complex CI/CD | REST API deploy script | Simple, reliable, auditable |
| Documentation | Afterthought | HANDOFF.md as session protocol | AI-readable, always current |

**Editable.** Add rows, update assessments over time.

---

## Section 6: Roadmap & Improvement (`/nexusblue/roadmap`)

**Purpose:** Never fall behind. Surface what needs to improve before it becomes a problem.

### AI Suggestions (`/nexusblue/roadmap/suggestions`)

The **Roadmap agent** runs after each architect/security/QA agent cycle. It:
1. Reads all recent `dev_agent_logs` (issues found)
2. Reads all `dev_ai_monitor/adherence` gaps
3. Reads all `dev_performance_snapshots` below threshold
4. Generates prioritized improvement suggestions with rationale

Suggestions displayed as cards:
- **Priority:** Critical / High / Medium / Nice-to-have
- **Project:** Which project it applies to (or "Global")
- **Category:** Security / Performance / AI Adherence / Architecture / Documentation
- **Suggestion:** What to do
- **Why:** Rationale from agent analysis
- **Effort:** Estimated (S/M/L)
- **Actions:** Accept → moves to Backlog | Dismiss | Snooze

### Backlog (`/nexusblue/roadmap/backlog`)

Accepted suggestions + manually added items. Organized by project and priority.

| Column | Content |
|--------|---------|
| Item | Description |
| Project | Which project |
| Category | Type of work |
| Priority | Critical / High / Medium |
| Source | Agent suggestion / Manual |
| Status | Backlog / In Progress / Done |
| Added | Date |

This is the NexusBlue-level roadmap. Project-level roadmap lives in each project's `HANDOFF.md`. This aggregates across all of them.

---

## Section 7: Platform Health (`/nexusblue/health`)

**Purpose:** Know the infrastructure is healthy before starting work. Catch degradation before it becomes an incident.

### Builds (`/nexusblue/health/builds`)

Vercel build status per project (Vercel API):
- Last deploy: status (READY/ERROR/BUILDING), timestamp, deployment URL
- Current branch deployed
- Build time trend

### Database (`/nexusblue/health/database`)

Supabase health per product (Supabase Management API or manual):
- Connection count vs limit
- Table row counts (tracks growth)
- Migration status — last migration applied, any pending
- RLS enabled on all tables: ✓ / ✗

### Droplet (`/nexusblue/health/droplet`)

Live Droplet metrics (DigitalOcean Monitoring API or SSH polling via API route):
- RAM: used / total / swap
- Disk: used / total / %
- Load average: 1m / 5m / 15m
- Active services (systemd units): running / stopped
- Node.js version in use

**Alert thresholds** (from global CLAUDE.md):
- RAM < 4 GB → warning
- Disk > 70% → warning, > 85% → critical
- Load > 8 → warning, > 16 → critical

### Agents (`/nexusblue/health/agents`)

Orchestration agent schedule and status:

| Agent | Projects | Last Run | Status | Next Due | Trigger |
|-------|----------|----------|--------|----------|---------|
| Architect | All Platform Products | Date | PASS/ISSUES | Next planned | PLANNING→BUILDING gate |
| Security | All with auth | Date | PASS/ISSUES | Next planned | Before main merge |
| QA | All live | Date | PASS/ISSUES | Next planned | ADMIN→LIVE gate |
| Roadmap | All | Date | Suggestions generated | Weekly | After architect/security/QA |
| Performance | All live | Date | Scores captured | Weekly | Automated |

**Run agent** button — triggers the agent for a specific project directly from the UI.

---

## Database Schema (Migration 033)

All tables prefixed `dev_` to distinguish from product feature tables.

```sql
-- ============================================================
-- Migration 033: NexusBlue Super-Admin Portal
-- ============================================================

-- Project Registry
CREATE TABLE IF NOT EXISTS public.dev_projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  slug                  TEXT UNIQUE NOT NULL,
  project_type          TEXT NOT NULL CHECK (project_type IN (
                          'platform_product', 'website_standalone',
                          'static_pwa', 'infrastructure', 'script_pipeline')),
  client_name           TEXT,
  description           TEXT,
  live_url              TEXT,
  preview_url           TEXT,
  github_repo           TEXT,
  supabase_project_ref  TEXT,
  vercel_project_name   TEXT,
  stack_summary         TEXT[],         -- ['Next.js 15', 'Supabase', 'Stripe', ...]
  status                TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  has_seed_script       BOOLEAN DEFAULT false,
  notes                 TEXT,
  sort_order            INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Client Organization Registry (tenants across all Platform Products)
CREATE TABLE IF NOT EXISTS public.dev_client_orgs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name              TEXT NOT NULL,
  slug                  TEXT NOT NULL,
  plan_tier             TEXT DEFAULT 'starter',
  project_id            UUID REFERENCES public.dev_projects(id),
  org_id_in_product     UUID,           -- UUID in that product's organizations table
  status                TEXT DEFAULT 'onboarding' CHECK (status IN (
                          'onboarding', 'active', 'paused', 'churned')),
  admin_email           TEXT,
  onboarded_at          TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Module Library (gated feature modules across all Platform Products)
CREATE TABLE IF NOT EXISTS public.dev_modules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID REFERENCES public.dev_projects(id),
  module_name           TEXT NOT NULL,
  description           TEXT,
  is_ai_powered         BOOLEAN DEFAULT false,
  billing_tier          TEXT,           -- which plan tier gates this
  table_prefix          TEXT,           -- e.g. 'chat', 'webmap', 'appvault'
  status                TEXT DEFAULT 'live' CHECK (status IN ('live', 'in_development', 'planned')),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Orchestration Agent Logs
CREATE TABLE IF NOT EXISTS public.dev_agent_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID REFERENCES public.dev_projects(id),
  agent_type            TEXT NOT NULL CHECK (agent_type IN (
                          'architect', 'security', 'qa', 'roadmap', 'performance')),
  result                TEXT NOT NULL CHECK (result IN ('pass', 'issues_found', 'error')),
  summary               TEXT NOT NULL,
  details               TEXT,           -- full agent output
  triggered_by          TEXT,           -- email
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Roadmap Items (aggregated across all projects)
CREATE TABLE IF NOT EXISTS public.dev_roadmap_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID REFERENCES public.dev_projects(id),
  title                 TEXT NOT NULL,
  description           TEXT,
  category              TEXT CHECK (category IN (
                          'security', 'performance', 'ai_adherence',
                          'architecture', 'documentation', 'feature', 'tech_debt')),
  priority              TEXT DEFAULT 'medium' CHECK (priority IN (
                          'critical', 'high', 'medium', 'low')),
  effort                TEXT CHECK (effort IN ('s', 'm', 'l', 'xl')),
  source                TEXT DEFAULT 'manual' CHECK (source IN ('agent', 'manual')),
  agent_log_id          UUID REFERENCES public.dev_agent_logs(id),
  status                TEXT DEFAULT 'backlog' CHECK (status IN (
                          'suggestion', 'backlog', 'in_progress', 'done', 'dismissed')),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Performance Snapshots (Core Web Vitals per project over time)
CREATE TABLE IF NOT EXISTS public.dev_performance_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID REFERENCES public.dev_projects(id),
  url                   TEXT NOT NULL,
  lcp_ms                INT,            -- Largest Contentful Paint
  inp_ms                INT,            -- Interaction to Next Paint
  cls_score             DECIMAL(5,3),   -- Cumulative Layout Shift
  ttfb_ms               INT,            -- Time to First Byte
  lighthouse_perf       INT,            -- 0-100
  lighthouse_a11y       INT,
  lighthouse_seo        INT,
  source                TEXT DEFAULT 'pagespeed' CHECK (source IN ('pagespeed', 'manual', 'vercel')),
  captured_at           TIMESTAMPTZ DEFAULT now()
);

-- AI Usage Summary (aggregated from per-product _usage tables)
CREATE TABLE IF NOT EXISTS public.dev_ai_usage_summary (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID REFERENCES public.dev_projects(id),
  period_month          DATE NOT NULL,  -- first day of month
  model_used            TEXT,
  tokens_used           BIGINT DEFAULT 0,
  cost_usd              DECIMAL(10,4) DEFAULT 0,
  request_count         INT DEFAULT 0,
  synced_at             TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, period_month, model_used)
);

-- LLM Brief Overrides (agent-written additions to the base brief)
CREATE TABLE IF NOT EXISTS public.dev_llm_brief_overrides (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section               TEXT NOT NULL,  -- which section of the brief this updates
  content               TEXT NOT NULL,
  authored_by           TEXT,           -- 'agent' or email
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS: nexusblue_admin only — no org-level access
-- ============================================================
ALTER TABLE public.dev_projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_client_orgs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_modules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_agent_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_roadmap_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_ai_usage_summary   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_llm_brief_overrides ENABLE ROW LEVEL SECURITY;

-- Service role: full access
DO $$ DECLARE t TEXT;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'dev_projects','dev_client_orgs','dev_modules','dev_agent_logs',
  'dev_roadmap_items','dev_performance_snapshots','dev_ai_usage_summary','dev_llm_brief_overrides'
]) LOOP
  EXECUTE format('CREATE POLICY "Service role full access on %I" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', t, t);
END LOOP; END $$;

-- nexusblue_admin: full CRUD
DO $$ DECLARE t TEXT;
BEGIN FOR t IN SELECT unnest(ARRAY[
  'dev_projects','dev_client_orgs','dev_modules','dev_agent_logs',
  'dev_roadmap_items','dev_performance_snapshots','dev_ai_usage_summary','dev_llm_brief_overrides'
]) LOOP
  EXECUTE format('CREATE POLICY "NexusBlue admin full access on %I" ON public.%I FOR ALL
    USING ((SELECT platform_role FROM public.profiles WHERE id = auth.uid()) = ''nexusblue_admin'')', t, t);
END LOOP; END $$;

-- ============================================================
-- Seed: Current project roster
-- ============================================================
INSERT INTO public.dev_projects (name, slug, project_type, client_name, description, github_repo, preview_url, has_seed_script, stack_summary, sort_order) VALUES
  ('pw-app',                    'pw-app',      'platform_product',   'WrapOps (org #1)', 'White-label vehicle inspection SaaS. Multi-tenant, offline PWA, PDF reports.',         'NexusBlueDev/pw-app',                    'https://pw-app.nexusblue.ai',     true,  ARRAY['Next.js 15','TypeScript','Tailwind v4','Supabase','Vercel','Serwist PWA'], 10),
  ('cnc-platform',              'cnc',         'platform_product',   null,               'AI-powered CNC workshop platform. Step-by-step guided workflows, machine-aware AI.',   'NexusBlueDev/cnc-platform',              null,                              true,  ARRAY['Next.js 15','TypeScript','Tailwind v4','Supabase','Stripe','Sanity','Claude API'], 20),
  ('pet_scheduler',             'scheduler',   'platform_product',   null,               'General-purpose scheduling SaaS. Multi-tenant, any mobile service industry.',          'NexusBlueDev/pet_scheduler',             null,                              true,  ARRAY['Next.js 14','TypeScript','Tailwind v3','Supabase','Stripe','Google Calendar','MS Graph'], 30),
  ('nexusblue-website',         'nexusblue',   'platform_product',   'NexusBlue',        'NexusBlue company platform. Multi-role SaaS with AI, AppVault, WebMap, partner portal.','NexusBlueDev/nexusblue-website',         null,                              true,  ARRAY['Next.js 15','TypeScript','Tailwind v4','Supabase','Stripe','Sanity','Claude API'], 40),
  ('mcpc-website',              'mcpc',        'website_standalone', 'MCPC',             'Montgomery County Prevention Coalition. AI chat, admin portal, Tailwind MCPC brand.',   'NexusBlueDev/mcpc-website',              'https://mcpc-website.nexusblue.ai',true,  ARRAY['Next.js 16','TypeScript','Tailwind v4','Supabase','Claude API'], 50),
  ('cain-website-022026',       'cain',        'website_standalone', 'Cain Tax Advisors','AI-first website for tax firm. Admin panel, pricing estimator, Retell AI voice.',       'NexusBlueDev/cain-website-022026',       null,                              true,  ARRAY['Next.js 15','TypeScript','Tailwind v4','Supabase','Sanity','Claude API','Retell AI'], 60),
  ('nexusblue-junior-jarvis',   'jj',          'static_pwa',         'NexusBlue',        'Kid-friendly AI job guessing game for expo booths. HTML5/ES5, GitHub Pages.',           'NexusBlueDev/nexusblue-junior-jarvis',   null,                              false, ARRAY['HTML5','CSS3','Vanilla JS ES5','Service Worker','GitHub Pages'], 70),
  ('nexusblue-junior-jarvis-career','jj-career','static_pwa',        'NexusBlue',        'Kid-friendly AI career discovery tool for expo booths. HTML5/ES5, GitHub Pages.',        'NexusBlueDev/nexusblue-junior-jarvis-career',null,                         false, ARRAY['HTML5','CSS3','Vanilla JS ES5','Service Worker','GitHub Pages'], 80),
  ('nexusblue-servers',         'servers',     'infrastructure',     'NexusBlue',        'DigitalOcean Droplet management. Systemd services, nginx, SSH config.',                  'NexusBlueDev/nexusblue-servers',         null,                              false, ARRAY['Ubuntu 22.04','nginx','systemd','bash'], 90),
  ('transcript-safety-pipeline','transcript',  'script_pipeline',    'NexusBlue',        'Python data pipeline + Next.js chat UI. Transcript ingestion → pgvector → AI chat.',    'wrmagnuson/transcript-safety-pipeline',  null,                              false, ARRAY['Python 3.x','OpenAI','pgvector','Next.js 15','Supabase'], 100),
  ('sectorius-website',         'sectorius',   'website_standalone', 'Sectorius Inc.',   'Simple holding company static site. Single-page, no auth, no DB, Vercel.',              'NexusBlueDev/sectorius-website',         null,                              false, ARRAY['Next.js 16','TypeScript','Tailwind v4'], 110)
ON CONFLICT (slug) DO NOTHING;

-- Seed: WrapOps as org #1 on pw-app
INSERT INTO public.dev_client_orgs (org_name, slug, plan_tier, project_id, status, admin_email, notes)
SELECT 'WrapOps', 'wrapops', 'starter',
       (SELECT id FROM public.dev_projects WHERE slug = 'pw-app'),
       'onboarding', 'admin@wrapops.com',
       'Org #1 on pw-app. Confirm admin email before onboarding. organizations table migration pending in pw-app.'
ON CONFLICT DO NOTHING;
```

---

## Agent Architecture

### Existing agents (from CLAUDE.md v5.0)
- **Architect agent** — runs at PLANNING→BUILDING gate. Reviews module docs, RLS, migrations.
- **Security agent** — runs before merging to main. Reviews auth routes, API security.
- **QA agent** — runs before ADMIN→LIVE. Tests features, reviews error handling.

### New agents (added by this portal)

**Roadmap agent** — triggered after any architect/security/QA cycle
```
Prompt: Review recent dev_agent_logs for [project]. Identify the top 3
improvement opportunities from issues found. For each: write a title,
one-sentence description, category (security/performance/ai_adherence/
architecture/documentation/feature/tech_debt), priority (critical/high/medium/low),
and estimated effort (S/M/L). Write results to dev_roadmap_items via API.
Format: JSON array.
```

**Performance agent** — weekly, per live project
```
Prompt: Fetch PageSpeed Insights scores for [live_url]. Extract LCP, INP, CLS,
TTFB, and Lighthouse scores. Compare to targets: LCP<2.5s, INP<100ms, CLS<0.1,
TTFB<800ms, Lighthouse>90. Write to dev_performance_snapshots via API.
Flag any metric below target in dev_roadmap_items as priority=high, category=performance.
```

**Sync agent** — monthly, per Platform Product
```
Prompt: Read the _usage table from [product_supabase_url] using service role key.
Aggregate tokens_used and cost_usd by model_used for the current month.
Write aggregated totals to dev_ai_usage_summary via API.
```

---

## Build Order

When ready to build (after AppVault migrations 031+032 are applied):

1. **Migration 033** — apply `dev_` tables + RLS + seed data to nexusblue-website Supabase
2. **Middleware update** — add `/nexusblue` route protection (platform_role = nexusblue_admin)
3. **Layout** — `/nexusblue` route group with sidebar nav (Environment / IP / AI Monitor / Industry / Roadmap / Health)
4. **Hub page** — dashboard cards (quick wins, visible fast)
5. **Environment section** — Projects, Tenants, Agent Log, LLM Brief tabs
6. **IP Registry** — Projects deep dive, Module Library, Docs viewer
7. **Health section** — Builds, Droplet, Agent schedule
8. **AI Monitor** — Usage charts, Adherence checklist
9. **Roadmap** — Suggestions feed, Backlog table
10. **Industry** — Performance benchmarks, Methodology comparison
11. **Agents** — Roadmap agent, Performance agent, Sync agent

Each section is independently useful. Ship in order — don't wait for all 11 to be done.

---

## Files to Update When Building

| File | Change |
|------|--------|
| `src/middleware.ts` | Add `/nexusblue` platform_role gate |
| `src/app/(nexusblue)/` | New route group (separate from `(dashboard)`) |
| `src/components/nexusblue/` | Super-admin UI components |
| `src/lib/nexusblue/` | Data access for dev_ tables |
| `supabase/migrations/033_superadmin_portal.sql` | The schema above |
| `HANDOFF.md` | Update with portal scope and build plan |
