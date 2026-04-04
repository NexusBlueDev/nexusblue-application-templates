# Portability Standard

**Version:** 1.0
**Phase:** 3 of NexusBlue Platform Evolution
**Status:** Active — preparation complete, no deployments outside Vercel yet

> This standard defines how NexusBlue projects are prepared for multi-cloud deployment.
> The goal: when the first client asks for AWS/Azure/Docker, the lift is days — not weeks.

---

## Infrastructure Isolation Decision Tree

When a new client or deployment need arises, use this decision tree:

| Client Need | Infrastructure Response | When to Trigger |
|-------------|------------------------|-----------------|
| **Standard SaaS** | Shared Vercel + shared Supabase (org isolation via RLS) | Default for all new clients |
| **Data residency** | Dedicated Supabase project in required region | Contractual requirement (e.g., EU-only data) |
| **Full isolation** | Dedicated Vercel project + dedicated Supabase | SOC 2 / enterprise contract |
| **Client-managed** | Docker package + deployment guide + managed Postgres | Client insists on own cloud |
| **Dedicated Droplet** | Standalone Node + systemd + nginx + managed Postgres | Background services / custom infra |

**Default path:** Shared infrastructure with tenant isolation via `organization_id` + RLS. Only escalate when contractually required.

---

## Cloud Portability Path

Every NexusBlue Next.js project is deployment-ready for these targets:

| Target | What's Required | Estimated Effort |
|--------|----------------|------------------|
| **Client's Vercel** | Fork repo, new Vercel project, new Supabase project | 1 session |
| **Docker (any cloud)** | Build Dockerfile, push to registry, deploy | 1-2 sessions |
| **AWS (via OpenNext)** | OpenNext adapter, CloudFront + Lambda | 2-3 sessions |
| **Azure App Service** | Docker image, App Service plan, managed Postgres | 2-3 sessions |
| **Dedicated Droplet** | Standalone build + systemd + nginx + SSL | 2-3 sessions |
| **Client self-managed** | Documentation package + deployment guide | 1 session |

---

## Per-Project Readiness Checklist

Every project must meet these criteria to be considered "portable":

### Required (All Projects)

- [ ] `output: 'standalone'` in `next.config.ts` — produces self-contained Node server
- [ ] `"engines": { "node": ">=22.0.0" }` in `package.json` — enforces runtime version
- [ ] No hardcoded URLs — all base URLs resolved via `getBaseUrl()` from `src/lib/platform/env.ts`
- [ ] No hardcoded platform assumptions — cron schedules in registry, not only in `vercel.json`
- [ ] Environment variables documented in `.env.local` with setup URLs
- [ ] Security headers defined in `next.config.ts` `headers()` (not platform-specific config)

### Required (Platform Products)

- [ ] `organization_id` on every data table — tenant isolation is DB-level, not platform-level
- [ ] Three-tier RLS (service_role / nexusblue_admin / org member) — works on any Postgres
- [ ] Brand config via `getBrandConfig()` — DB-driven dynamic pipeline (colors, fonts, assets, tagline)

### Optional (Enhance Portability)

- [ ] Platform detection via `getPlatform()` — adapts behavior per runtime
- [ ] Cron registry populated — can generate configs for any platform
- [ ] Dockerfile tested locally — `docker build` + `docker run` works

---

## Platform Abstraction Layer

Located at `src/lib/platform/` in each project. Reference implementation in nexusblue-website.

### `env.ts` — Platform Detection & Environment Resolution

```typescript
getPlatform()        // → 'vercel' | 'aws_lambda' | 'azure_functions' | 'docker' | 'digitalocean' | 'local'
getPlatformInfo()    // → { platform, region?, environment }
getBaseUrl()         // → correct base URL for current platform
getEnv(key, fallback?) // → typed env var access with error on missing required vars
```

**Detection order:** Checks platform-specific env vars (`VERCEL`, `AWS_LAMBDA_FUNCTION_NAME`, etc.) and falls back to `'local'`.

### `cron.ts` — Cron Registry

```typescript
getCronRegistry()       // → all registered cron jobs
getEnabledCrons()       // → only enabled jobs
generateVercelCrons()   // → array for vercel.json crons field
generateCrontab(baseUrl, secret) // → crontab file content
generateSystemdTimer(cron)       // → systemd timer unit content
```

**Pattern:** Define all schedules as a typed array in code. Generate platform-specific configs from the registry. The registry is the source of truth — `vercel.json` is a generated artifact.

### `brand.ts` — Dynamic Brand Pipeline

```typescript
// DB-driven (preferred for platform products):
createBrandConfigFetcher({ createServiceClient, orgId, defaults })
  // → { getBrandConfig, brandToCSS, brandFontsUrl }

getBrandConfig()    // → { tagline, industry, colors[], fonts[], assets[] } (cached 1hr)
brandToCSS(brand)   // → CSS :root overrides string (colors + font variables)
brandFontsUrl(brand) // → Google Fonts <link> URL or null

// Legacy (env-var-based, for non-DB projects):
getLegacyBrandConfig() // → { name, primaryColor, logoUrl, ... }
```

**Pattern:** Product apps read brand identity from `org_brand*` tables. Root layout calls `getBrandConfig()`, injects CSS overrides via `<style>` tag, loads fonts via Google Fonts `<link>`, serves logos via asset proxy (`/api/brand/asset/[slot]`). Admin changes propagate on next page load via `revalidateTag("brand-config")`. Falls back to hardcoded defaults in `globals.css` when DB is unavailable. Reference implementation: 1Application.

### `llm.ts` — Multi-LLM Router (Phase 2)

```typescript
getModel(task)    // → { provider, model, fallback }
estimateCost()    // → USD estimate
checkBudget()     // → remaining budget
trackUsage()      // → log tokens and cost
```

---

## Dockerfile Usage Guide

Template: `nexusblue-application-templates/docker/Dockerfile.nextjs`

### Build

```bash
# From the project root (where package.json lives)
docker build -f path/to/Dockerfile.nextjs -t myapp .
```

### Run

```bash
# Pass env vars via file
docker run -p 3000:3000 --env-file .env.local myapp

# Or pass individually
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  myapp
```

### Requirements

- `output: 'standalone'` must be set in `next.config.ts`
- Node 22 Alpine base image (matches Vercel runtime)
- `DOCKER_CONTAINER=true` is set automatically — detected by `getPlatform()`
- Runs as non-root user (`nextjs:nodejs`) for security
- Exposes port 3000 — map as needed

### What's NOT Included

- Database — use managed Postgres (Supabase, RDS, Cloud SQL) or Docker Compose
- SSL termination — use a reverse proxy (nginx, Caddy, cloud load balancer)
- Process management — use Docker restart policies or orchestration (Compose, K8s)
- Cron jobs — use host crontab, systemd timers, or cloud scheduler

---

## Deploy Target Tracking

The `dev_projects` table tracks where each project is deployed:

| Column | Type | Description |
|--------|------|-------------|
| `deploy_target` | `TEXT` | Primary platform: `vercel`, `aws`, `azure`, `docker`, `digitalocean`, `github_pages` |
| `deploy_config` | `JSONB` | Platform-specific config (region, project ID, etc.) |

Visible on the portal Environment page as a badge next to each project.

---

## What We Explicitly Do NOT Build Yet

- **Terraform/Pulumi IaC** — not until managing 3+ client cloud environments
- **Kubernetes** — premature for current scale
- **Multi-cloud CI/CD** — GitHub Actions + Vercel is sufficient
- **OpenNext adapter** — build only when first AWS deployment is needed
- **Docker Compose templates** — build only when first Docker deployment is needed

The portability layer is **preparation, not implementation**. Build the abstraction now; deploy to new platforms only when a client contract requires it.
