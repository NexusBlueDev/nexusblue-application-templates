# Domain Registry — nexusblue.ai

> Last updated: 2026-02-27

## DNS Setup
- **Provider:** Namecheap
- **Wildcard CNAME:** `*.nexusblue.ai → cname.vercel-dns.com`
- No per-project DNS changes needed — just add the subdomain to the Vercel project via API

## Preview Domains (*.nexusblue.ai)

| Subdomain | Vercel Project | Branch | Purpose | Added |
|-----------|---------------|--------|---------|-------|
| `pw-app.nexusblue.ai` | pw-app | dev | PW Inspection System — staging/testing | 2026-02-27 |

## Production Domains

| Domain | Vercel Project | Notes |
|--------|---------------|-------|
| `pw-app-tawny.vercel.app` | pw-app | Auto-assigned Vercel domain (production) |

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
4. **Update this file** — add a row to the Preview Domains table
5. Deploy: `./scripts/deploy.sh preview`
