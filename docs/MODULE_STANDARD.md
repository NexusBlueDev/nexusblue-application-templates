# NexusBlue Module Standard

> **Version:** 1.2
> **Applies to:** All feature modules in all NexusBlue Next.js + Supabase projects
> **Canonical location:** `/home/nexusblue/dev/nexusblue-application-templates/docs/MODULE_STANDARD.md`
> **Install to project:** `{project}/docs/modules/MODULE_STANDARD.md` (copy or symlink)
> **Reference implementations:** WebMap (nexusblue-website), AppVault (nexusblue-website)
> **Project type note:** `organization_id` on module tables, the three-tier RLS policy template, and `{prefix}_usage.organization_id` are **Platform Product requirements only**. Website / Standalone projects omit these. See the Platform Architecture Standard in global `CLAUDE.md`.

---

## What Is a Module?

A module is a self-contained feature domain within a NexusBlue project. It has clear boundaries, its own database tables, its own library code, its own API routes, its own UI pages, and its own documentation. Modules are designed to be portable — the lib core should be extractable and usable in other projects with minimal modification.

**A module is NOT:**
- A single component or utility
- A page with a few API calls
- A configuration change

**A module IS:**
- A domain with 3+ related database tables
- A domain with dedicated lib logic
- A domain controlled by feature gates
- A domain complex enough to warrant its own documentation

---

## Module Directory Contract

Every module MUST follow this exact structure. Deviations require a documented reason.

```
src/lib/{module}/
├── README.md              ← REQUIRED: API surface, purpose, agent registry, feature gates
├── {core-logic}.ts        ← Primary implementation files
├── constants.ts           ← Magic values, defaults, type guards
└── prompt-docs/           ← AI MODULES ONLY: system prompt reference documents
    └── *.md

src/types/{module}.ts      ← REQUIRED: All TypeScript interfaces for this module

src/app/api/{module}/
└── {endpoint}/route.ts    ← API routes (one folder per endpoint)

src/app/(admin)/admin/{module}/
└── page.tsx               ← Admin UI (if applicable)

src/app/(dashboard)/{portal}/{module}/
└── page.tsx               ← Portal UI (employee/client/partner)

src/components/{module}/   ← Module-specific components only
└── *.tsx

docs/modules/{module}/     ← REQUIRED: Module documentation
├── README.md              ← What it is, status, build plan, decisions
├── ARCHITECTURE.md        ← Data flow, module boundaries, key design decisions
├── SCHEMA.md              ← All DB tables with fields, types, constraints, RLS
└── AGENTS.md              ← AI MODULES ONLY: agent definitions, model assignments

supabase/migrations/
└── 0NN_{module}_{descriptor}.sql   ← One or more migrations
```

---

## Required Files Checklist

Before any code is written, these files MUST exist:

- [ ] `docs/modules/{module}/README.md` — module overview
- [ ] `docs/modules/{module}/ARCHITECTURE.md` — data flow and decisions
- [ ] `docs/modules/{module}/SCHEMA.md` — database schema
- [ ] `src/lib/{module}/README.md` — library API surface
- [ ] `src/types/{module}.ts` — TypeScript interfaces
- [ ] `supabase/migrations/0NN_{module}_core.sql` — core schema

**AI modules additionally require:**
- [ ] `docs/modules/{module}/AGENTS.md` — agent definitions
- [ ] `src/lib/{module}/prompt-docs/` — prompt reference documents

**All modules additionally require (before migration is written):**
- [ ] Billing unit defined in README
- [ ] Role capability matrix in README
- [ ] `{prefix}_usage` table included in core migration
- [ ] `module_defaults` seed rows included in core migration
- [ ] Standalone viability declared (yes/no) in README

**Structure before implementation.** If these files don't exist, the module is not ready to build.

---

## Naming Conventions

### Table Prefix
Every module has a 2–4 character table prefix, unique across the project.

```
webmap_   → WebMap module
av_       → AppVault module
{2-4}_    → Your new module
```

**Rule:** Short, memorable, no conflicts. Register in `docs/modules/README.md`.

### Migration Files
```
0NN_{module}_core.sql        ← Core tables (always first)
0NN_{module}_{descriptor}.sql ← Additional migrations

Examples:
031_appvault_core.sql
032_appvault_workspaces.sql
028_webmap.sql
029_webmap_page_meta.sql
```

**Rule:** Sequential numbering. Descriptive suffix. Never destructive in production.

### Agent Keys
```
{module}-{task}

Examples:
appvault-canonicalizer-dev
appvault-gate-g3
webmap-analyzer
```

**Rule:** Kebab-case. Module prefix first. Task describes what it does, not what it is.

### Feature Gate Keys
```
{module}                     ← Base access gate
{module}_{action}            ← Specific action gate

Examples:
appvault
appvault_collector
appvault_workbench
webmap
webmap_scan
webmap_export
```

### File Names
```
TypeScript files:  kebab-case.ts     (engine.ts, page-fetcher.ts, html-analyzer.ts)
Type files:        {module}.ts       (webmap.ts, appvault.ts)
Component files:   PascalCase.tsx    (AppPackCard.tsx, ScanResult.tsx)
Doc files:         UPPERCASE.md      (README.md, ARCHITECTURE.md, SCHEMA.md)
Prompt docs:       NN_{name}.md      (01_developer_api_documentation_prompt.md)
```

---

## Database Conventions

### Table Structure
Every table follows this pattern:

```sql
CREATE TABLE IF NOT EXISTS public.{prefix}_{entity} (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- foreign keys to core entities
  -- domain-specific fields
  -- JSONB for flexible structured data (config, results, metadata)
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()  -- if entity is mutable
);

CREATE INDEX IF NOT EXISTS idx_{prefix}_{entity}_{fk} ON public.{prefix}_{entity}({foreign_key});

ALTER TABLE public.{prefix}_{entity} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on {prefix}_{entity}"
  ON public.{prefix}_{entity} FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users read own org {prefix}_{entity}"
  ON public.{prefix}_{entity} FOR SELECT
  USING (
    (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) = organization_id
  );
```

### RLS Standard

Three tiers, applied to all tables:

| Role | Typical Access |
|------|---------------|
| service_role (cron, background jobs) | Full access — bypasses RLS |
| employee | SELECT on published/ready data; INSERT/UPDATE on own sessions |
| client | SELECT on own org's client-visible data only |
| admin | Full access via service_role or explicit admin policy |

**Rule:** Always enable RLS. Service role is how background agents write. Never expose raw DB access to clients.

### JSONB Fields
Use JSONB for structured data that varies per record:

```sql
config_json    JSONB DEFAULT '{}'::JSONB    -- configuration settings
result_json    JSONB                        -- analysis output
metadata_json  JSONB                        -- flexible metadata
```

**Rule:** Name JSONB fields with `_json` suffix. Document the expected shape in SCHEMA.md.

---

## Agent Conventions (AI Modules)

### Model Assignment Rule

| Task Type | Model | Examples |
|-----------|-------|---------|
| Generation — complex structured output | claude-sonnet-4-6 | Artifact creation, analysis, consulting outputs |
| Judgment — binary/categorical decision | claude-haiku-4-5-20251001 | Gate checks, classification, support verification |
| Real-time at scale — client-facing | selectModel(planTier) | Client workbench — tier-aware |
| Deterministic | Code (no LLM) | Domain checks, hash comparison, heading counts |

**Rule:** Store model assignments in the agent registry (`src/lib/agents/registry.ts`) and in `docs/modules/{module}/AGENTS.md`. Never hardcode model strings in route handlers.

### Prompt Caching
All system prompts over 1,024 tokens use `cache_control: { type: 'ephemeral' }`.

```typescript
system: [
  {
    type: 'text',
    text: YOUR_LONG_SYSTEM_PROMPT,
    cache_control: { type: 'ephemeral' }
  }
]
```

**Rule:** Gate check prompts (G5 equivalent) always cached — they run on every response.

### Max Token Limits
Set explicit `max_tokens` per agent. Never use API defaults in production.

| Task | Guideline |
|------|-----------|
| Full document generation | 6,000–8,000 |
| Analysis with structured output | 3,000–5,000 |
| Conversational response | 2,000–2,500 |
| Judgment / gate check | 256–512 |

### Prompt Documents (AI Modules)
System prompts that are long, versioned, or multi-stage live as reference `.md` files in `src/lib/{module}/prompt-docs/`. The actual TypeScript constants in `prompts.ts` are sourced from these files.

```
prompt-docs/
  01_{stage-name}.md    ← Stage 1 prompt reference
  02_{stage-name}.md    ← Stage 2 prompt reference
```

Each file includes:
- Agent metadata header (agent key, model, input, output, allowed tools)
- The full system prompt in a code block
- Requirements summary
- Self-audit checklist

---

## Feature Gate Conventions

Every module registers its feature gates in its core migration:

```sql
INSERT INTO public.features (key, name, description, min_tier, is_active, category)
VALUES
  ('{module}',          '{Module Name}',         'Base access',     'professional', true, 'module'),
  ('{module}_{action}', '{Module Name} - Action', 'Specific action', 'enterprise',   true, 'module')
ON CONFLICT (key) DO NOTHING;
```

**Rule:** Base gate uses module name. Action gates use `{module}_{action}`. All gates registered in migration, never hardcoded in UI.

---

## AI-First Requirements (All AI Modules)

Every module that uses LLMs must follow these rules. An "AI module" is any module with agents defined in AGENTS.md.

### AI is the Primary Interface

- AI does the work. Humans approve outcomes — they don't configure inputs.
- Streaming is the default for all user-facing agent calls. Never make users wait for a complete response.
- Every state machine has at least one AI-generated → human-approved checkpoint before data is published.

### Agent Design Rules

- Every agent has one task. Multi-step work = multiple agents.
- Every agent runs through `executeAgent()` from `src/lib/agents/base.ts` — never raw API calls in route handlers.
- Tool use in agents is always explicit. If an agent should not access the web, `tool_choice: 'none'` is enforced at the API call level, not just in the system prompt.
- Gate agents (binary judgments) are code-first. Use LLM only when a deterministic check cannot do the job.

### Prompt Management Rules

- System prompts >1,024 tokens use `cache_control: { type: 'ephemeral' }` — always.
- Long prompts live in `src/lib/{module}/prompt-docs/NN_{name}.md` — never inline in route handlers.
- Every prompt document includes: agent key, model, max_tokens, input/output spec, and a self-audit checklist.
- Gate check prompts are always cached — they run on every response.

### AI Required Checklist

Every AI module README must include:

- [ ] Agent stack table (agent key | model | task | max_tokens)
- [ ] Gate mapping table (gate | implementation type | trigger)
- [ ] Streaming declared: yes/no per agent
- [ ] Tool access declared: none / specific tools listed
- [ ] Prompt caching declared: which agents cache and why

---

## Monetization Requirements (All Modules)

Every module must be monetization-ready before migration is written. This is not optional — it prevents retroactive billing gaps and enables standalone app packaging.

### Required Definitions (Before Migration)

| Item | What to Define |
|------|---------------|
| **Billing unit** | The atomic thing counted per org per billing period (e.g., "app packs", "workbench queries", "scans") |
| **Min tier** | Which plan tier unlocks base module access |
| **Action tiers** | Which plan tier unlocks each specific action gate |
| **Usage cap** | Default cap per billing period per tier (can be overridden) |
| **Standalone viability** | Yes/No — can this module be packaged as a standalone app? |

### Usage Metering Table

Every module ships a `{prefix}_usage` table in its core migration:

```sql
CREATE TABLE IF NOT EXISTS public.{prefix}_usage (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.profiles(id),
  billing_period   TEXT NOT NULL,  -- 'YYYY-MM'
  units_used       INT DEFAULT 0,
  unit_type        TEXT NOT NULL,  -- matches billing unit definition
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, billing_period, unit_type)
);
```

**Rule:** Increment usage on every billable action via a dedicated lib function. Metering is server-side only — never trust client counts.

### Standard Monetization Tiers

Every module supports three commercial modes:

| Mode | Description | Who Uses It |
|------|-------------|------------|
| **Embedded** | Included in nexusblue-website subscription plan | NexusBlue platform clients |
| **Managed Product** | Sold as a standalone managed service (NexusBlue operates) | Clients who want results without access |
| **Standalone App** | White-label app client deploys and administers | Clients who want to own and run it |

Declare which modes the module supports in its README. Not all modules support all three modes.

### Admin Override Control

Org admins can control capability access within their plan limits via the `feature_overrides` table (existing) and `module_permissions` table (new, per module). NexusBlue sets the ceiling — org admins configure within it.

```
NexusBlue sets plan tier → defines what features are available
Org admin configures     → which roles in their org can access which features
Feature overrides        → NexusBlue can elevate any org above their plan (for trials, custom contracts)
```

---

## Role Capability Matrix

Every module defines which roles can do what. This is declared in the module's README and enforced in API routes and UI.

### Standard Matrix Format

```
| Capability           | admin | employee | partner | client |
|---------------------|-------|----------|---------|--------|
| View module          | ✓     | ✓        | ✓       | ✓      |
| Trigger action       | ✓     | ✓        | —       | —      |
| Review/approve       | ✓     | ✓        | —       | —      |
| Export results       | ✓     | ✓        | ✓       | —      |
| Client workbench     | ✓     | ✓        | —       | ✓      |
| Configure module     | ✓     | —        | —       | —      |
```

### Org Admin Capability Toggles

Org admins can turn off any capability their plan allows for specific roles in their org. They cannot enable capabilities their plan does not include.

Two tables support this:

```sql
-- module_permissions: per-org, per-role toggles
-- (one row per org × role × module capability)
CREATE TABLE IF NOT EXISTS public.module_permissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.profiles(id),
  module_key       TEXT NOT NULL,  -- e.g. 'appvault'
  role             TEXT NOT NULL,  -- CHECK IN ('admin', 'employee', 'partner', 'client')
  capability       TEXT NOT NULL,  -- matches capability name in role matrix
  enabled          BOOLEAN DEFAULT true,
  set_by           UUID REFERENCES public.profiles(id),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, module_key, role, capability)
);

-- module_defaults: default capabilities per plan tier (source of truth)
CREATE TABLE IF NOT EXISTS public.module_defaults (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key       TEXT NOT NULL,
  role             TEXT NOT NULL,
  capability       TEXT NOT NULL,
  min_tier         TEXT NOT NULL,  -- minimum plan tier required
  default_enabled  BOOLEAN DEFAULT true,
  UNIQUE (module_key, role, capability)
);
```

**Rule:** `module_defaults` is seeded in migration and owned by NexusBlue. `module_permissions` is written by org admins at runtime. Always check `module_permissions` first — fall back to `module_defaults` if no override exists.

### Required Role Matrix in README

Every module README must include a complete role capability matrix showing all roles × all capabilities with min_tier noted where applicable.

---

## API Route Conventions

```typescript
// src/app/api/{module}/{endpoint}/route.ts

export const maxDuration = 30;  // or 120 for long-running

export async function POST(request: Request) {
  // 1. Feature gate check
  const access = await checkFeatureAccess('{module}', orgId, planTier);
  if (!access) return new Response('Forbidden', { status: 403 });

  // 2. Rate limiting
  const rl = await checkRateLimit(identifier, '/api/{module}/{endpoint}', tier);
  if (!rl.allowed) return rateLimitResponse('/api/{module}/{endpoint}');

  // 3. Input validation (Zod)
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return new Response('Bad request', { status: 400 });

  // 4. Business logic via lib functions
  const result = await yourLibFunction(parsed.data);

  // 5. Return
  return NextResponse.json(result);
}
```

---

## Documentation Requirements

### README.md (Module Overview)
Required sections:
- What it does (2–3 sentences, value statement)
- Build plan (MVP, Phase 2, Phase 3)
- Decisions made (table: Decision | Choice | Reason)
- Decisions still needed (table: # | Question | Default)
- State machine (if applicable)
- Related docs

### ARCHITECTURE.md
Required sections:
- Module boundaries diagram (ASCII)
- Primary data flow (numbered sequence)
- Key security boundaries
- How module extends existing infrastructure (table)

### SCHEMA.md
Required sections:
- One section per table with: field, type, notes columns
- RLS summary table (role × table)
- Migration file references

### AGENTS.md (AI Modules)
Required sections:
- Agent registry entries (TypeScript)
- Gate mapping table (gate | implementation | when it runs)
- One definition per agent (trigger, input, task, output, stop conditions)
- Prompt caching strategy
- Max token limits table

### src/lib/{module}/README.md (API Surface)
Required sections:
- Public API surface (functions, signatures, description)
- File structure
- Agent registry entries
- Feature gates table
- Database tables table
- Dependencies (what existing infrastructure it uses)

---

## Module Lifecycle

```
1. PLANNING     — README + ARCHITECTURE + SCHEMA + AGENTS created; no code
2. FOUNDATION   — types.ts + migration written; feature gates registered
3. BUILDING     — lib functions + API routes + agents implemented
4. ADMIN        — admin UI + review flows
5. LIVE (MVP)   — core feature gates enabled; employee-facing complete
6. EXPANDED     — phase 2 features; client-facing if applicable
7. MAINTAINED   — freshness monitoring; schema migrations for enhancements
8. DEPRECATED   — feature gate disabled; tables archived (never dropped)
```

Do not move to BUILDING until PLANNING is complete.
Do not move to LIVE until admin review flow works.

---

## Portability Checklist

A module is portable (can be lifted into another project) when:

- [ ] All lib functions take explicit parameters (no hidden global state)
- [ ] Database table prefix is unique and consistent
- [ ] All env var dependencies are documented in `.env.example`
- [ ] Types are in `src/types/{module}.ts` (not mixed into `index.ts`)
- [ ] Agent registry entries are isolated (not dependent on other agents)
- [ ] `{prefix}_usage` table exists and metering is live
- [ ] `module_defaults` seeded with all role × capability rows
- [ ] Role capability matrix documented and enforced in API routes
- [ ] Billing unit documented and usage incremented on every billable action
- [ ] Standalone viability declared
- [ ] Documentation is current and accurate

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-28 | Initial standard — derived from WebMap + AppVault patterns |
| 1.1 | 2026-02-28 | Added AI-first requirements, Monetization requirements (billing unit, usage table, admin tier control), Role Capability Matrix (module_permissions + module_defaults tables). Updated Required Files Checklist and Portability Checklist. |
| 1.2 | 2026-02-28 | Clarified project type scope: `organization_id`, three-tier RLS template, and `{prefix}_usage.organization_id` are Platform Product requirements only — not applicable to Website / Standalone projects. Added reference to Platform Architecture Standard in global CLAUDE.md. |
