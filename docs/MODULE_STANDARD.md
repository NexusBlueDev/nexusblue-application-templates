# NexusBlue Module Standard

> **Version:** 1.0
> **Applies to:** All feature modules in all NexusBlue Next.js + Supabase projects
> **Canonical location:** `/home/nexusblue/dev/nexusblue-application-templates/docs/MODULE_STANDARD.md`
> **Install to project:** `{project}/docs/modules/MODULE_STANDARD.md` (copy or symlink)
> **Reference implementations:** WebMap (nexusblue-website), AppVault (nexusblue-website)

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
- [ ] Documentation is current and accurate

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-28 | Initial standard — derived from WebMap + AppVault patterns |
