# New Project Starter Prompt

> **Usage:** Copy the prompt below and paste it as your first message when starting a
> new project with Claude Code. It enforces all NexusBlue v5.0 standards from session one.
>
> Replace `[PROJECT_NAME]`, `[PROJECT_TYPE]`, and `[CLIENT_NAME]` before pasting.
> Delete the bracketed sections that don't apply to your project type.

---

## COPY FROM HERE ↓

```
We are starting a new NexusBlue project. Follow the global CLAUDE.md v5.0 standards
exactly. Here is the project brief:

Project name: [PROJECT_NAME]
Client / purpose: [CLIENT_NAME / what it does]
Project type: [Platform Product | Website / Standalone | Static PWA]

[If Platform Product:]
Org #1 (first client): [CLIENT_ORG_NAME]
Roles: [admin, employee, client | super_admin, owner, employee, client | custom]
Modules planned: [list the gated feature areas, e.g. "AI chat, reporting, billing"]

[If Website / Standalone:]
Roles: [admin | admin, employee, client | admin only]
CMS needed: [yes — Sanity | no]

[If Static PWA:]
Hosting: GitHub Pages
Auth: none

Before writing any code, do the following in order:

1. Verify git remote points to NexusBlueDev:
   git remote -v
   If not set: git remote set-url origin https://github.com/NexusBlueDev/[REPO-NAME].git

2. Run Droplet health check:
   free -h | head -2 && df -h / | tail -1 && uptime

3. Create CLAUDE.md for this project with:
   - ## Project Type section (v5.0 format — declare type and architecture rules)
   - Stack, directory structure, key patterns
   - Based on the project type, include the correct seed account format

4. Create HANDOFF.md with the standard structure

5. Create TODO.md — populate with any client/team actions already identified

6. Create .env.local with all required service keys as empty placeholders
   (with setup URLs in comments). STOP and ask me to fill these in before building
   any features that depend on them.

7. Create .env.example (committed version — same keys, no values)

8. Create scripts/seed-accounts.sh:
   [If Platform Product:]
   - nexusblue-admin@nexusblue.dev / NxB_dev_2026! (platform_role = nexusblue_admin)
   - test-[role]@[slug].dev / NxB_dev_2026! for each role
   - Client initial accounts commented out with must_reset_pw=true placeholder

   [If Website / Standalone:]
   - test-[role]@[slug].dev / NxB_dev_2026! for each role
   - Client initial accounts commented out with must_reset_pw=true placeholder

9. [If Platform Product:] Prepare the organizations table SQL migration:
   CREATE TABLE IF NOT EXISTS public.organizations (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug       TEXT UNIQUE NOT NULL,
     name       TEXT NOT NULL,
     plan_tier  TEXT NOT NULL DEFAULT 'starter',
     is_active  BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ALTER TABLE public.profiles
     ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
     ADD COLUMN IF NOT EXISTS platform_role  TEXT CHECK (platform_role IN ('nexusblue_admin'));
   Show me this SQL and confirm before writing it to a migration file.

10. Scaffold the project (Next.js 15 + TypeScript + Tailwind v4):
    - Apply the Tailwind v4 CSS cascade layer fix in globals.css immediately
    - Define canonical CSS custom properties (--brand-primary, --surface-primary, etc.)
    - Define reserved component classes (.btn-primary, .input, .card, .badge, .page-container)
    - Set "engines": { "node": ">=22.0.0" } in package.json

11. Set up Vercel deployment:
    - Create scripts/deploy.sh using the REST API pattern (never vercel deploy CLI)
    - Create dev branch for preview environment
    - Add [project-name].nexusblue.ai as preview domain

12. Initial commit and push to NexusBlueDev GitHub repo.

After setup is complete, declare your understanding of the project in 3-5 lines
and confirm all checklist items above are done before starting feature work.
```

---

## STOP COPYING HERE ↑

---

## Reference: Project Type Checklist

### Platform Product
- [ ] `organizations` table migration
- [ ] `platform_role` column on `profiles`
- [ ] Three-tier RLS on all data tables (service_role / nexusblue_admin / org member)
- [ ] Module standard tables for each gated feature (permissions, defaults, overrides, usage)
- [ ] AI usage logging to `_usage` table (tokens_used, cost_usd, model_used)
- [ ] NexusBlue super-admin account in seed script
- [ ] `platform_role = 'nexusblue_admin'` SQL note in seed script

### Website / Standalone
- [ ] Standard Supabase RLS (user → own data)
- [ ] No organizations table
- [ ] NexusBlue dev accounts in seed script (test-[role]@[slug].dev)

### All Projects with Auth
- [ ] Login form: `autoComplete="email"` + `autoComplete="current-password"`
- [ ] Role in `profiles.role` (authoritative) + `user_metadata.role` (middleware cache)
- [ ] Static file bypass in middleware (before auth check)
- [ ] Auth callback syncs DB role → metadata

### All Next.js Projects
- [ ] Tailwind v4 cascade layer fix (all element overrides inside `@layer base {}`)
- [ ] No `*, *::before, *::after { margin: 0 }` outside `@layer base {}`
- [ ] `.input` class defined in globals.css (Tailwind v4 doesn't ship it)
- [ ] No IIFEs in JSX (extract to variables or helper components)
- [ ] `"engines": { "node": ">=22.0.0" }` in package.json
- [ ] `scripts/deploy.sh` using Vercel REST API (never `vercel deploy` CLI)

### All AI Features
- [ ] Wrap `textStream` in custom ReadableStream with try/catch (never `toTextStreamResponse()`)
- [ ] Retry logic (1 retry, 1.5s delay) for Anthropic 500/529/429 errors
- [ ] Friendly fallback messages on failure
- [ ] AI usage logged to `_usage` table (Platform Products)

### All PWA Projects (Serwist)
- [ ] `NetworkOnly` rules for auth routes, server actions (POST + Next-Action header), API routes
- [ ] These rules placed BEFORE `defaultCache` in runtimeCaching array
- [ ] `cacheOnNavigation: false` in withSerwistInit config

---

## Reference: Seed Account Format

### Platform Product
```
NexusBlue super-admin: nexusblue-admin@nexusblue.dev / NxB_dev_2026!
Dev org accounts:      test-[role]@[slug].dev / NxB_dev_2026!
Client initial:        [client-email] / TempPass1! (must_reset_pw=true, commented out)
```

After seeding: `UPDATE profiles SET platform_role = 'nexusblue_admin' WHERE ...`

### Website / Standalone
```
Dev accounts:    test-[role]@[slug].dev / NxB_dev_2026!
Client initial:  [client-email] / TempPass1! (must_reset_pw=true, commented out)
```

---

## Reference: Active Project Slugs (do not reuse)

| Slug | Project |
|------|---------|
| `mcpc` | mcpc-website |
| `cain` | cain-website-022026 |
| `cnc` | cnc-platform |
| `pw` | pw-app |
| `nexusblue` | nexusblue-website |
| `scheduler` | pet_scheduler |

---

## Reference: nexusblue.ai Preview Domains (do not reuse)

| Domain | Project | Branch |
|--------|---------|--------|
| pw-app.nexusblue.ai | pw-app | dev |
| mcpc-website.nexusblue.ai | mcpc-website | dev |

> Full registry: `/home/nexusblue/dev/nexusblue-application-templates/DOMAINS.md`
