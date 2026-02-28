# New Module Starter Prompt

> **Usage:** Copy the prompt below and paste it as your first message when adding a new
> module to an existing NexusBlue Platform Product. It enforces all v5.0 module standards
> from the first message.
>
> Replace `[MODULE_NAME]`, `[PREFIX]`, `[PROJECT_NAME]`, and bracketed sections before pasting.
> Delete sections that don't apply.

---

## COPY FROM HERE ↓

```
We are adding a new module to an existing NexusBlue project. Follow the global CLAUDE.md
v5.0 standards and MODULE_STANDARD.md v1.2 exactly. Here is the module brief:

Project:     [PROJECT_NAME]  (e.g., nexusblue-website)
Module name: [MODULE_NAME]   (e.g., "Client Reports", "AI Chat", "Billing")
Table prefix:[PREFIX]        (2–4 chars, e.g., "rpt", "chat", "bill" — no conflicts)
Type:        [Platform Product module | Website/Standalone module]

[If Platform Product module:]
Organization-scoped: yes — `organization_id` on all data tables, three-tier RLS
Billing unit:        [what gets counted per org per billing period]
Min tier:            [starter | professional | enterprise]
Standalone viability:[yes | no]

[If Website/Standalone module:]
Organization-scoped: no — standard user-owns-own-data RLS

Feature gates needed:
- [PREFIX]           ← base module access
- [PREFIX]_[action]  ← action gate (repeat as needed)

Roles and capabilities:
| Capability     | admin | employee | partner | client |
|----------------|-------|----------|---------|--------|
| [capability 1] |  ✓   |   ✓      |   —     |   —    |
| [capability 2] |  ✓   |   —      |   —     |   —    |

[If AI module:]
Agents needed:
- [agent key]: [task description] — model: [claude-sonnet-4-6 | claude-haiku-4-5]
- [agent key]: [task description] — model: [...]

Before writing any code, do the following in order:

1. Confirm there are no table prefix conflicts:
   - Search existing migrations for `[PREFIX]_` to ensure prefix is free
   - If conflict found, stop and propose an alternative prefix

2. Confirm the next available migration number:
   - ls supabase/migrations/ | sort | tail -5
   - Note the highest number and use N+1

3. Create the required planning docs (structure before implementation):
   docs/modules/[module-name]/
   ├── README.md       — what it does, build plan, billing unit, role capability matrix
   ├── ARCHITECTURE.md — data flow, module boundaries, key design decisions
   ├── SCHEMA.md       — all tables, fields, types, RLS summary
   [If AI module:]
   └── AGENTS.md       — agent registry, gate mapping, prompt caching strategy

   src/lib/[module-name]/README.md  — public API surface, feature gates, dependencies

4. Show me the planning docs for review before proceeding.

5. Once approved, create:
   - src/types/[module-name].ts
   - supabase/migrations/0NN_[prefix]_core.sql
     (tables: [prefix]_module_permissions, [prefix]_module_defaults,
              [prefix]_feature_overrides, [prefix]_usage, plus domain tables)
   - Show me this SQL and confirm before writing to a file

6. After migration is confirmed, scaffold:
   - src/lib/[module-name]/ (core library)
   - src/app/api/[module-name]/ (API routes)
   - src/app/(admin)/admin/[module-name]/ (admin UI)
   - src/components/[module-name]/ (module components)

7. Register feature gates in the migration (INSERT INTO public.features).

8. Update HANDOFF.md with the new module section.

After planning docs are done, declare your understanding of the module in 3–5 lines
and confirm all planning items above are done before starting schema work.
```

---

## STOP COPYING HERE ↑

---

## Reference: Module Planning Checklist

### Before Any Code

- [ ] Table prefix confirmed — no conflicts with existing migrations
- [ ] Next migration number confirmed
- [ ] `docs/modules/[module]/README.md` created
- [ ] `docs/modules/[module]/ARCHITECTURE.md` created
- [ ] `docs/modules/[module]/SCHEMA.md` created
- [ ] `src/lib/[module]/README.md` created
- [ ] `src/types/[module].ts` created
- [ ] Billing unit defined (Platform Products)
- [ ] Role capability matrix defined

### AI Modules additionally need:
- [ ] `docs/modules/[module]/AGENTS.md` created
- [ ] Agent stack table (agent key | model | task | max_tokens)
- [ ] Gate mapping table (gate | implementation type | trigger)
- [ ] Streaming declared (yes/no per agent)
- [ ] Tool access declared (none / specific)
- [ ] Prompt caching strategy declared

### Core Migration Must Include:
- [ ] `{prefix}_module_permissions` table
- [ ] `{prefix}_module_defaults` table (seeded with default rows)
- [ ] `{prefix}_feature_overrides` table
- [ ] `{prefix}_usage` table
- [ ] Domain-specific tables
- [ ] Feature gate registrations (`INSERT INTO public.features`)
- [ ] RLS policies on all tables (three-tier for Platform Products)

### Before Calling Module "Live":
- [ ] Admin UI complete (create, review, manage)
- [ ] Role capability matrix enforced in all API routes
- [ ] Usage metering live (increments on every billable action)
- [ ] Feature gates checked at every API route entry point
- [ ] HANDOFF.md updated with module section
- [ ] Module README current and accurate

---

## Reference: Module Directory Contract

```
src/lib/{module}/
├── README.md              ← API surface, purpose, agent registry, feature gates
├── {core-logic}.ts        ← Primary implementation
├── constants.ts           ← Magic values, defaults, type guards
└── prompt-docs/           ← AI MODULES ONLY: system prompt reference docs
    └── NN_{name}.md

src/types/{module}.ts      ← All TypeScript interfaces

src/app/api/{module}/
└── {endpoint}/route.ts    ← One folder per endpoint

src/app/(admin)/admin/{module}/
└── page.tsx               ← Admin UI

src/components/{module}/   ← Module-specific components

docs/modules/{module}/
├── README.md
├── ARCHITECTURE.md
├── SCHEMA.md
└── AGENTS.md              ← AI MODULES ONLY
```

---

## Reference: Active Module Prefixes (do not reuse)

| Prefix | Module | Project |
|--------|--------|---------|
| `webmap_` | WebMap | nexusblue-website |
| `av_` | AppVault | nexusblue-website |
| `dev_` | Super-Admin Portal | nexusblue-website (planned, migration 034+) |

> Full MODULE_STANDARD: `/home/nexusblue/dev/nexusblue-application-templates/docs/MODULE_STANDARD.md`
