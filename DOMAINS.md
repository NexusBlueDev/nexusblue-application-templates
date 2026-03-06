# Domain Registry — nexusblue.ai

> Last updated: 2026-03-06

## DNS Setup
- **Provider:** Namecheap
- **Wildcard CNAME:** `*.nexusblue.ai → cname.vercel-dns.com`
- No per-project DNS changes needed — just add the subdomain to the Vercel project via API

## Preview Domains (*.nexusblue.ai → dev branch)

| Subdomain | Vercel Project | Branch | Purpose | Added |
|-----------|---------------|--------|---------|-------|
| `pw-app.nexusblue.ai` | pw-app | dev | PW Inspection System — staging/testing | 2026-02-27 |
| `mcpc-website.nexusblue.ai` | mcpc-website | dev | MCPC Website — staging/testing | 2026-02-28 |
| `nexusblue.nexusblue.ai` | nexusblue-website | dev | NexusBlue Platform — staging/testing | 2026-03-04 |
| `cnc-platform.nexusblue.ai` | cnc-platform | dev | CNC Platform — staging/testing | 2026-03-04 |
| `cain-website.nexusblue.ai` | cain-website-022026 | dev | Cain Tax Advisors — staging/testing | 2026-03-04 |
| `pet-scheduler.nexusblue.ai` | pet-scheduler | dev | Pet Scheduler — staging/testing | 2026-03-04 |
| `sectorius-website.nexusblue.ai` | sectorius-website | dev | Sectorius — staging/testing | 2026-03-04 |
| `forge.nexusblue.ai` | nexusblue-forgeai | dev | ForgeAI Engineering Platform — staging/testing | 2026-03-06 |

## Production Domains

| Domain | Vercel Project | Notes |
|--------|---------------|-------|
| `nexusblue.io` | nexusblue-website | NexusBlue Platform (production) |
| `caintaxadvisors.com` | cain-website-022026 | Cain Tax Advisors (production) |
| `sectorius.com` | sectorius-website | Sectorius (production) |
| `beers-biz-checkin.nexusblue.ai` | beers-biz-dayton | Public check-in PWA, no auth |
| `pw-app-tawny.vercel.app` | pw-app | Auto-assigned Vercel domain (production) |

## Reserved Slugs (do not reuse)

| Slug | Project |
|------|---------|
| `pw` | pw-app |
| `mcpc` | mcpc-website |
| `cain` | cain-website-022026 |
| `cnc` | cnc-platform |
| `nexusblue` | nexusblue-website |
| `nexusblue` | nexusblue-website (preview) |
| `scheduler` | pet_scheduler |
| `pet-scheduler` | pet_scheduler (preview) |
| `beers-biz-checkin` | beers-biz-dayton |
| `sectorius-website` | sectorius-website |
| `forge` | nexusblue-forgeai |

## How to Add a New Project

1. Domain already resolves (wildcard CNAME handles it)
2. Add to Vercel project:
   ```bash
   VERCEL_TOKEN=$(grep '^VERCEL_TOKEN=' .env.local | cut -d= -f2-)
   curl -s -X POST "https://api.vercel.com/v10/projects/PROJECT-NAME/domains?teamId=nexus-blue-dev" \
     -H "Authorization: Bearer $VERCEL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"PROJECT-NAME.nexusblue.ai","gitBranch":"dev"}'
   ```
3. Disable SSO protection if the app has its own auth:
   ```bash
   curl -s -X PATCH "https://api.vercel.com/v9/projects/PROJECT-NAME?teamId=nexus-blue-dev" \
     -H "Authorization: Bearer $VERCEL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"ssoProtection":null}'
   ```
4. **Update this file** — add a row to the Preview Domains table AND Reserved Slugs table
5. Deploy: `./scripts/deploy.sh preview`
