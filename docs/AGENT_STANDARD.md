# NexusBlue Agent Standard

> **Version:** 1.0
> **Applies to:** All cron agents, event-triggered agents, and background automation in all NexusBlue projects
> **Canonical location:** `/home/nexusblue/dev/nexusblue-application-templates/docs/AGENT_STANDARD.md`
> **Reference implementations:** portal-performance, portal-roadmap, portal-sync, appvault-freshness (nexusblue-website)
> **Related:** MODULE_STANDARD.md (for feature modules), INTEGRATION_STANDARD.md (for external API connections)

---

## What Is an Agent?

An agent is a background automation task that runs on a schedule (cron) or in response to an event (trigger). It processes data, monitors systems, generates insights, or maintains freshness. Agents do not have their own UI pages — they write results to database tables that existing pages read.

**An agent is NOT:**
- A user-facing feature with its own UI (that's a Module)
- A one-off utility script (that's a Script)
- A wrapper around an external API (that's an Integration)

**An agent IS:**
- A scheduled or triggered background task
- Something that reads data, processes it, and writes results
- Logged and monitored via `dev_agent_logs` or project-specific log table
- Registered in `vercel.json` (cron) or triggered by another system (event)

**When a Script becomes an Agent:** When it runs on a schedule, needs logging/monitoring, or needs error tracking.

**When an Agent becomes a Module:** When it grows a user-facing UI, needs feature gates, needs billing metering, or needs its own database tables beyond a log/results table.

---

## Agent Directory Contract

```
src/app/api/cron/{agent-name}/
  route.ts                    <- REQUIRED: Agent entry point (GET handler)

src/lib/{domain}/             <- If agent has significant logic, extract to lib
  {logic}.ts                  <- Processing functions (testable, no HTTP concerns)

vercel.json                   <- REQUIRED: Cron schedule entry
src/lib/agents/registry.ts    <- REQUIRED: Agent registry entry (if AI-powered)
```

Agents live inside API route handlers at `src/app/api/cron/`. They do not get their own `docs/` directory unless they are complex enough to warrant promotion to a Module.

---

## Required Checklist

Before deploying an agent:

- [ ] Route at `src/app/api/cron/{agent-name}/route.ts`
- [ ] Auth via `verifyCronSecret(request)` (cron) or `requireAdmin()` (on-demand)
- [ ] Cron schedule registered in `vercel.json`
- [ ] Logging to `dev_agent_logs` (portal agents) or project-specific log table
- [ ] Error handling: partial success tracking (processed N/M, errors captured)
- [ ] Documented in ARCHITECTURE.md agent table
- [ ] AI-powered agents registered in `src/lib/agents/registry.ts`

---

## Route Pattern

Every cron agent follows this exact structure:

```typescript
import { NextResponse } from 'next/server';
import { verifyCronSecret, cronUnauthorizedResponse } from '@/lib/cron/verify';
import { createServiceClient } from '@/lib/supabase/server';
import { logPortalAgentRun } from '@/lib/portal/log-agent'; // or project-specific logger

export const maxDuration = 120; // adjust per agent needs

export async function GET(request: Request) {
  // 1. Auth
  if (!verifyCronSecret(request)) {
    return cronUnauthorizedResponse();
  }

  // 2. Setup
  const supabase = createServiceClient();
  let processed = 0;
  const errors: string[] = [];

  // 3. Load data to process
  const { data: items } = await supabase
    .from('table')
    .select('*')
    .eq('status', 'active');

  if (!items?.length) {
    return NextResponse.json({ ok: true, processed: 0, message: 'Nothing to process' });
  }

  // 4. Process (sequential or parallel depending on external API rate limits)
  for (const item of items) {
    try {
      // ... processing logic
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${item.id}: ${msg}`);
      console.error(`[{agent-name}] ${item.id} failed:`, msg);
    }
  }

  // 5. Log the run
  const hasErrors = errors.length > 0;
  await logPortalAgentRun({
    agentType: '{agent-name}',
    result: hasErrors ? (processed > 0 ? 'issues_found' : 'error') : 'pass',
    summary: `Processed ${processed}/${items.length} items`,
    details: hasErrors ? `Errors:\n${errors.join('\n')}` : undefined,
  });

  // 6. Return summary
  return NextResponse.json({
    ok: !hasErrors || processed > 0,
    processed,
    errors: errors.length,
  });
}
```

---

## Cron Registration

Every agent has a `vercel.json` entry:

```json
{
  "crons": [
    {
      "path": "/api/cron/{agent-name}",
      "schedule": "0 5 * * 0"
    }
  ]
}
```

### Schedule Guidelines

| Frequency | When to Use | Example |
|-----------|-------------|---------|
| Every 15 min | Email queues, urgent processing | send-queued-emails |
| Daily | Aggregation, freshness checks | event-aggregation, appvault-freshness |
| Weekly | Analysis, reporting, snapshots | portal-performance, conversation-intelligence |
| Monthly | Reports, sync operations | monthly-report, portal-sync |

**Rule:** Choose the lowest frequency that meets the requirement. Every cron consumes Vercel build minutes. Verify the Vercel plan supports the total cron count.

---

## Logging

All agents log their runs to a structured table. Portal agents use `dev_agent_logs`. Project-specific agents should use an equivalent table.

### Log Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| agent_type | TEXT | Agent name (matches cron route name) |
| result | TEXT | `pass`, `issues_found`, or `error` |
| summary | TEXT | One-line human-readable summary |
| details | TEXT | Error details, stack traces (nullable) |
| created_at | TIMESTAMPTZ | When the run completed |

### Result Codes

| Code | Meaning |
|------|---------|
| `pass` | All items processed successfully |
| `issues_found` | Some items processed, some failed |
| `error` | Total failure — nothing processed |

---

## Error Handling

### Partial Success Pattern

Agents process multiple items. Some may fail while others succeed. Never abort the entire run for one failure.

```typescript
let processed = 0;
const errors: string[] = [];

for (const item of items) {
  try {
    await processItem(item);
    processed++;
  } catch (err) {
    errors.push(`${item.id}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
```

### External API Rate Limits

When calling external APIs (PageSpeed, GitHub, etc.), process sequentially with appropriate delays:

```typescript
// Sequential — respects API rate limits
for (const item of items) {
  await processItem(item); // includes the external API call
}
```

### Timeout Handling

Set `maxDuration` based on the expected workload:

| Workload | maxDuration |
|----------|-------------|
| < 10 items, fast processing | 30 |
| 10-50 items or slow external APIs | 60 |
| 50+ items or multiple slow APIs per item | 120 |

---

## AI-Powered Agents

Agents that use LLMs follow additional rules from MODULE_STANDARD.md's Agent Conventions:

- Register in `src/lib/agents/registry.ts`
- Model rule: Sonnet for generation, Haiku for judgment, Code for deterministic
- System prompts >1,024 tokens use `cache_control: { type: 'ephemeral' }`
- Set explicit `max_tokens` per agent
- Log token usage if billing metering is relevant

---

## On-Demand Triggering

Agents that support on-demand triggering (in addition to cron) should be callable through a protected API route:

```typescript
// src/app/api/portal/refresh/route.ts (or similar)
// Auth: requireAdmin() or platform_role check
// Calls the cron route internally with CRON_SECRET
```

The cron route itself does not change — on-demand is a separate caller that invokes the same endpoint.

---

## Naming Conventions

### Route Names
```
{domain}-{task}

Examples:
portal-performance       (domain: portal, task: performance snapshots)
portal-roadmap           (domain: portal, task: AI roadmap suggestions)
appvault-freshness       (domain: appvault, task: source freshness check)
event-aggregation        (domain: events, task: daily rollup)
send-queued-emails       (domain: email, task: queue processing)
```

### Agent Keys (AI-powered agents)
```
{domain}-{task}-agent

Examples:
portal-roadmap-agent
conversation-intelligence-agent
churn-detection-agent
```

---

## ARCHITECTURE.md Documentation

Every agent must have an entry in the project's ARCHITECTURE.md agent table:

```markdown
| Agent | Schedule | What It Does |
|-------|----------|-------------|
| portal-performance | Sunday 05:00 UTC | PageSpeed API → CWV snapshots |
| appvault-freshness | Daily 06:00 UTC | HTTP HEAD on sources → stale detection |
```

---

## Promotion to Module

An agent should be promoted to a Module (governed by MODULE_STANDARD.md) when ANY of these are true:

- It needs its own UI pages (admin or user-facing)
- It needs feature gates (per-plan access control)
- It needs billing metering (usage tracking per org)
- It needs 3+ dedicated database tables (beyond a log/results table)
- It needs its own role capability matrix

When promoting: create `docs/modules/{name}/` with all required files, move logic from `src/app/api/cron/` to `src/lib/{module}/`, keep the cron route as a thin caller.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-01 | Initial standard — derived from portal-performance, portal-roadmap, portal-sync, appvault-freshness patterns |
