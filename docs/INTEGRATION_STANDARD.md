# NexusBlue Integration Standard

> **Version:** 1.0
> **Applies to:** All external API/service connections in all NexusBlue projects
> **Canonical location:** `/home/nexusblue/dev/nexusblue-application-templates/docs/INTEGRATION_STANDARD.md`
> **Reference implementations:** Google PageSpeed (nexusblue-website cron), Stripe (nexusblue-website webhooks), SendGrid (nexusblue-website email), Anthropic Claude (all AI projects)
> **Related:** MODULE_STANDARD.md (for feature modules), AGENT_STANDARD.md (for background automation)

---

## What Is an Integration?

An integration is a connection to an external API or third-party service. It wraps authentication, provides typed query functions, handles errors gracefully, and isolates the rest of the codebase from provider-specific details.

**An integration is NOT:**
- A user-facing feature with its own UI and tables (that's a Module)
- A background scheduled task (that's an Agent — though agents often USE integrations)
- A one-off utility script (that's a Script)

**An integration IS:**
- A wrapper around an external API (Google, Stripe, SendGrid, Anthropic, etc.)
- An auth module + typed query functions + error handling
- Something consumed by Modules, Agents, or API routes — never accessed directly by UI
- Documented with env vars, setup instructions, and error behavior

**When an Integration becomes a Module:** When it grows its own database tables, user-facing UI, feature gates, or billing metering. The integration lib files become part of the module's `src/lib/{module}/` directory.

---

## Integration Directory Contract

```
src/lib/{provider}/
  auth.ts                     <- REQUIRED: Authentication (API key, OAuth, service account)
  {resource}.ts               <- Query functions per resource/domain
  cache.ts                    <- Optional: In-memory or persistent caching

src/types/{provider}.ts       <- REQUIRED: TypeScript interfaces for request/response shapes

.env.local                    <- REQUIRED: Env var placeholders with setup instructions
```

Integrations do NOT get their own `docs/` directory. They are documented through:
1. Code comments in the auth module
2. Env var setup instructions in `.env.local`
3. An entry in the project's ARCHITECTURE.md integrations section

---

## Required Checklist

Before using an integration in production:

- [ ] Auth module at `src/lib/{provider}/auth.ts`
- [ ] Types at `src/types/{provider}.ts`
- [ ] Env vars in `.env.local` with setup comments (service URL, API key, etc.)
- [ ] Error handling: clear error messages, graceful degradation
- [ ] Rate limit awareness: documented limits, caching or queuing if needed
- [ ] Entry in ARCHITECTURE.md integrations section
- [ ] No provider-specific types leaking into business logic (map to internal types)

---

## Auth Patterns

### API Key (simplest)

For services that use a single API key (PageSpeed, simple REST APIs):

```typescript
// src/lib/{provider}/auth.ts

export function getApiKey(): string {
  const key = process.env.{PROVIDER}_API_KEY;
  if (!key) throw new Error('{PROVIDER}_API_KEY not configured');
  return key;
}
```

### Service Account (Google APIs)

For Google APIs using a service account with JWT auth:

```typescript
// src/lib/google/auth.ts
import { google } from 'googleapis';

let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null;

export function getGoogleAuth(scopes: string[]) {
  if (cachedAuth) return cachedAuth;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials not configured');
  }

  cachedAuth = new google.auth.JWT({ email: clientEmail, key: privateKey, scopes });
  return cachedAuth;
}
```

### SDK Client (Supabase, Stripe, Anthropic)

For services with official SDK clients:

```typescript
// src/lib/{provider}/client.ts

let client: ProviderClient | null = null;

export function getClient(): ProviderClient {
  if (client) return client;

  const apiKey = process.env.{PROVIDER}_API_KEY;
  if (!apiKey) throw new Error('{PROVIDER}_API_KEY not configured');

  client = new ProviderClient({ apiKey });
  return client;
}
```

**Rule:** Always cache client instances. Serverless functions may reuse the same process — creating a new client on every request wastes auth handshakes.

### Webhook Verification (Stripe, GitHub)

For services that push data to your app:

```typescript
// src/app/api/webhooks/{provider}/route.ts

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('{provider}-signature');

  // Verify signature using provider's SDK
  const event = provider.webhooks.constructEvent(body, signature, webhookSecret);

  // Process the verified event
  // ...
}
```

**Rule:** Always verify webhook signatures. Never trust raw webhook payloads.

---

## Type Isolation

Integration types live at `src/types/{provider}.ts`. Business logic should NOT import provider-specific types directly. Map external shapes to internal types at the integration boundary.

```typescript
// src/types/google-analytics.ts — provider types (external shapes)
export interface GA4ReportRow {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

// src/types/analytics.ts — internal types (business domain)
export interface TopPage {
  path: string;
  pageviews: number;
  avgEngagementTime: number;
}
```

The mapping happens inside `src/lib/{provider}/` functions. Consumers only see internal types.

**Why:** If you swap providers (e.g., GA4 → Plausible), only the integration lib changes — not every consumer.

---

## Caching

Integrations that serve live API data to UI should cache responses to avoid:
- Hammering external APIs on every page load
- Hitting rate limits
- Slow page renders from external latency

### In-Memory TTL Cache (Default)

```typescript
// src/lib/{provider}/cache.ts

const cache = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}
```

### Cache TTL Guidelines

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Analytics / reporting data | 5 min | Rarely changes, expensive to fetch |
| Search results / listings | 1 min | May change, but not real-time |
| User-specific data | No cache | Must be fresh per request |
| Webhook data | No cache | Already pushed, stored in DB |

---

## Error Handling

### Graceful Degradation

Integrations must never crash the calling feature. Return typed errors that callers can handle:

```typescript
export async function fetchData(): Promise<DataResult | IntegrationError> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { error: `${provider} API ${response.status}`, retryable: response.status >= 500 };
    }
    return parseResponse(await response.json());
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error', retryable: true };
  }
}
```

### Retry Strategy

| Error Type | Action |
|------------|--------|
| 4xx (client error) | Do not retry — fix the request |
| 429 (rate limited) | Retry after delay (respect `Retry-After` header) |
| 5xx (server error) | Retry once after 1.5s |
| Network timeout | Retry once after 1.5s |
| Auth failure (401/403) | Do not retry — credentials are wrong |

### Timeout Configuration

Always set explicit timeouts on external API calls:

```typescript
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000), // 30s default
});
```

| Call Type | Timeout |
|-----------|---------|
| Fast API (Supabase, Stripe) | 10s |
| Medium API (Google APIs, SendGrid) | 30s |
| Slow API (PageSpeed, AI generation) | 45-60s |

---

## Env Var Convention

Every integration's env vars go in `.env.local` with:
1. **Service name comment** with setup URL
2. **All required keys** as empty placeholders
3. **Format notes** where the value is non-obvious

```bash
# Google Analytics — https://console.cloud.google.com/
# Enable: Google Analytics Data API
# Create service account → download JSON key → extract these values
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=

# GA4 Property ID (numeric) — GA4 Admin → Property Settings
# NOT the measurement ID (G-XXXXXXXX) — it's a separate number
GA4_PROPERTY_ID=
```

**Rule:** After adding env vars, STOP and ask the user to fill them in before building features that depend on them (per global CLAUDE.md Environment Variable Setup Protocol).

---

## ARCHITECTURE.md Documentation

Every integration must have an entry in the project's ARCHITECTURE.md:

```markdown
## External Integrations

| Provider | Purpose | Auth Method | Env Vars |
|----------|---------|-------------|----------|
| Google PageSpeed | CWV + Lighthouse scores | API key | PAGESPEED_API_KEY |
| Stripe | Billing + subscriptions | Secret key + webhook | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| Anthropic Claude | AI chat + analysis | API key via SDK | ANTHROPIC_API_KEY |
| SendGrid | Transactional email | API key | SENDGRID_API_KEY |
```

---

## Promotion to Module

An integration should be promoted to a Module (governed by MODULE_STANDARD.md) when ANY of these are true:

- It needs its own database tables (beyond caching)
- It needs user-facing UI pages
- It needs feature gates (per-plan access control)
- It needs billing metering
- It grows complex enough to need its own documentation directory

When promoting: create `docs/modules/{name}/`, move `src/lib/{provider}/` into `src/lib/{module}/`, add migration with tables, feature gates, and usage metering.

---

## Common Integration Patterns

### Provider + Agent

An integration feeds data to an agent:

```
Integration: src/lib/google/pagespeed.ts (fetchPageSpeed)
    ↓
Agent: src/app/api/cron/portal-performance/route.ts (calls fetchPageSpeed in a loop)
    ↓
Database: dev_performance_snapshots (stores results)
    ↓
UI: /nexusblue/health (reads from DB, displays in table)
```

### Provider + API Route

An integration serves live data through a protected API route:

```
Integration: src/lib/google/ga4.ts (fetchGA4Data)
    ↓
API Route: src/app/api/admin/analytics/ga4/route.ts (requireAdmin + cache + call)
    ↓
UI: /admin/analytics (client component fetches from API route)
```

### Provider + Webhook

A provider pushes events to your app:

```
Provider: Stripe sends webhook POST
    ↓
Webhook Route: src/app/api/webhooks/stripe/route.ts (verify signature, process event)
    ↓
Database: Update subscription status, log event
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-01 | Initial standard — derived from PageSpeed, Stripe, SendGrid, Anthropic patterns across NexusBlue projects |
