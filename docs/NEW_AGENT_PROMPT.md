# New Agent Starter Prompt

> **Usage:** Copy the prompt below and paste it when adding a new cron or event-triggered
> agent to an existing NexusBlue project. It enforces AGENT_STANDARD.md v1.0.
>
> Replace `[AGENT_NAME]`, `[PROJECT_NAME]`, and bracketed sections before pasting.

---

## COPY FROM HERE ↓

```
We are adding a new background agent to an existing NexusBlue project. Follow the global
CLAUDE.md v5.6 standards and AGENT_STANDARD.md v1.0 exactly. Here is the agent brief:

Project:    [PROJECT_NAME]
Agent name: [AGENT_NAME]   (kebab-case, e.g., "portal-performance", "appvault-freshness")
Domain:     [DOMAIN]       (which feature area it supports, e.g., "portal", "appvault", "email")
Trigger:    [cron | event | on-demand]

[If cron:]
Schedule: [cron expression, e.g., "0 5 * * 0" = Sunday 5am UTC]

[If event:]
Triggered by: [what triggers it — webhook, DB change, API call, etc.]

What it does:
[2-3 sentences: what data it reads, what processing it does, where it writes results]

[If AI-powered:]
Model:      [claude-sonnet-4-6 | claude-haiku-4-5]
Max tokens: [256-512 for judgment, 2000-5000 for generation]
Task type:  [generation | judgment | classification]

Before writing any code, do the following in order:

1. Confirm the agent name doesn't conflict with existing agents:
   - ls src/app/api/cron/ (if cron)
   - Check vercel.json for existing cron entries

2. Create the agent route:
   - src/app/api/cron/[AGENT_NAME]/route.ts
   - Follow the standard route pattern from AGENT_STANDARD.md:
     a. Auth via verifyCronSecret(request)
     b. Load data to process
     c. Process items with partial success tracking (never abort batch for one failure)
     d. Log the run (pass / issues_found / error)
     e. Return summary JSON

3. Register in vercel.json:
   - Add cron entry with path and schedule
   - Verify total cron count stays within Vercel plan limits

4. [If AI-powered:] Register in src/lib/agents/registry.ts:
   - Agent key, model, max_tokens, task description
   - System prompts >1,024 tokens use cache_control: { type: 'ephemeral' }

5. [If significant processing logic:] Extract to src/lib/[domain]/:
   - Keep the route handler thin — auth + orchestration only
   - Business logic in testable lib functions

6. Add entry to ARCHITECTURE.md agent table:
   | Agent | Schedule | What It Does |

7. Update HANDOFF.md with the new agent.

8. Test the agent:
   - Run via curl with CRON_SECRET header
   - Verify logging works (check the log table)
   - Verify partial failure handling (what happens if one item fails?)

After the route is created, declare what the agent does in 2-3 lines and confirm
all checklist items are done before deploying.
```

---

## STOP COPYING HERE ↑

---

## Reference: Agent Checklist

### Before Deploying

- [ ] Route at `src/app/api/cron/{agent-name}/route.ts`
- [ ] Auth via `verifyCronSecret(request)` (cron) or `requireAdmin()` (on-demand)
- [ ] Cron schedule registered in `vercel.json`
- [ ] Logging to structured log table (agent_type, result, summary, details)
- [ ] Error handling: partial success pattern (processed N/M, errors captured)
- [ ] Documented in ARCHITECTURE.md agent table
- [ ] `maxDuration` set appropriately (30 / 60 / 120)

### AI-Powered Agents additionally need:
- [ ] Registered in `src/lib/agents/registry.ts`
- [ ] Model assignment follows rule: Sonnet = generation, Haiku = judgment
- [ ] Explicit `max_tokens` set (never API defaults)
- [ ] System prompts >1,024 tokens use `cache_control: { type: 'ephemeral' }`
- [ ] Token usage logged if billing metering is relevant

### Promotion Triggers (Agent → Module)
If any of these become true, promote to Module (follow MODULE_STANDARD.md):
- [ ] Needs its own UI pages
- [ ] Needs feature gates (per-plan access control)
- [ ] Needs billing metering (usage tracking per org)
- [ ] Needs 3+ dedicated database tables
- [ ] Needs its own role capability matrix

---

## Reference: Standard Route Pattern

```typescript
import { NextResponse } from 'next/server';
import { verifyCronSecret, cronUnauthorizedResponse } from '@/lib/cron/verify';
import { createServiceClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return cronUnauthorizedResponse();
  }

  const supabase = createServiceClient();
  let processed = 0;
  const errors: string[] = [];

  const { data: items } = await supabase
    .from('table')
    .select('*')
    .eq('status', 'active');

  if (!items?.length) {
    return NextResponse.json({ ok: true, processed: 0, message: 'Nothing to process' });
  }

  for (const item of items) {
    try {
      // ... processing logic
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${item.id}: ${msg}`);
    }
  }

  // Log the run to your log table
  await logAgentRun({
    agentType: '{agent-name}',
    result: errors.length ? (processed > 0 ? 'issues_found' : 'error') : 'pass',
    summary: `Processed ${processed}/${items.length}`,
    details: errors.length ? errors.join('\n') : undefined,
  });

  return NextResponse.json({ ok: !errors.length || processed > 0, processed, errors: errors.length });
}
```

---

## Reference: Schedule Guidelines

| Frequency | When to Use | Example |
|-----------|-------------|---------|
| Every 15 min | Email queues, urgent processing | send-queued-emails |
| Daily | Aggregation, freshness checks | appvault-freshness |
| Weekly | Analysis, reporting, snapshots | portal-performance |
| Monthly | Reports, sync operations | portal-sync |

Choose the lowest frequency that meets the requirement.

> Full AGENT_STANDARD: `/home/nexusblue/dev/nexusblue-application-templates/docs/AGENT_STANDARD.md`
