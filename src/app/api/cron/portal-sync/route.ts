/* ── Portal Sync Agent ──
 * Monthly AI usage aggregation across all product Supabase instances.
 * Schedule: 0 4 1 * * (1st of month, 4am UTC)
 *
 * Reads: dev_projects (active projects with supabase_project_ref),
 *        each project's ai_usage table via Supabase Management API
 * Writes: dev_ai_usage_summary, dev_agent_logs
 *
 * Requires env:
 *   CRON_SECRET               — shared secret for cron auth
 *   SUPABASE_SERVICE_ROLE_KEY  — for writing to dev_* tables
 *   SUPABASE_ACCESS_TOKEN      — Supabase Management API token (for querying project DBs)
 *
 * Data classification: internal (usage counts, costs — no PII)
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { resilientFetch } from '@/lib/resilient-fetch';
import { logPortalAgentRun } from '@/lib/portal/log-agent';
import { logger } from '@/lib/logger';
import type { DevProject, AiUsageSummary } from '@/lib/portal/types';

export const maxDuration = 120;

const log = logger.child({ module: 'portal-sync' });

// ── Cron Auth ──

function verifyCronSecret(request: Request): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// ── Period Calculation ──

function getPreviousMonth(): { periodMonth: string; startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-indexed previous month
  const paddedMonth = String(month).padStart(2, '0');

  return {
    periodMonth: `${year}-${paddedMonth}-01`,
    startDate: `${year}-${paddedMonth}-01T00:00:00Z`,
    endDate: new Date(year, month, 1).toISOString(), // first day of current month
  };
}

// ── Fetch Usage from Project DB ──

interface RawUsageRow {
  model_used: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
}

async function fetchProjectUsage(
  projectRef: string,
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<RawUsageRow[]> {
  // Query the project's database via Supabase Management API SQL endpoint
  const query = `
    SELECT
      model_used,
      COALESCE(SUM(tokens_used), 0)::bigint AS total_tokens,
      COALESCE(SUM(cost_usd), 0)::numeric(10,4) AS total_cost,
      COUNT(*)::int AS request_count
    FROM ai_usage
    WHERE created_at >= '${startDate}'
      AND created_at < '${endDate}'
    GROUP BY model_used
  `;

  const res = await resilientFetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query }),
    },
    {
      retries: 2,
      timeoutMs: 30_000,
      circuitKey: `supabase-mgmt-${projectRef}`,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    // If the table doesn't exist, that's expected for non-AI projects
    if (text.includes('relation') && text.includes('does not exist')) {
      return [];
    }
    throw new Error(`Management API returned ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data ?? []) as RawUsageRow[];
}

// ── Route Handler ──

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    log.error('SUPABASE_ACCESS_TOKEN not configured');
    return NextResponse.json({ error: 'SUPABASE_ACCESS_TOKEN not configured' }, { status: 500 });
  }

  const supabase = createServiceClient();
  const { periodMonth, startDate, endDate } = getPreviousMonth();
  let synced = 0;
  const errors: string[] = [];

  // Load active projects with Supabase refs
  const { data: projects } = await supabase
    .from('dev_projects')
    .select('id, slug, name, status, supabase_project_ref')
    .eq('status', 'active')
    .not('supabase_project_ref', 'is', null);

  if (!projects?.length) {
    log.info('No active projects with Supabase refs');
    return NextResponse.json({ ok: true, synced: 0, message: 'No projects to sync' });
  }

  // Sync each project (partial success pattern)
  for (const project of projects as DevProject[]) {
    try {
      const rows = await fetchProjectUsage(
        project.supabase_project_ref!,
        accessToken,
        startDate,
        endDate,
      );

      if (rows.length === 0) {
        log.info({ project: project.slug }, 'No AI usage data (table may not exist)');
        continue;
      }

      // Upsert usage summaries
      for (const row of rows) {
        const summary: AiUsageSummary = {
          project_id: project.id,
          period_month: periodMonth,
          model_used: row.model_used,
          tokens_used: row.total_tokens,
          cost_usd: row.total_cost,
          request_count: row.request_count,
        };

        const { error: upsertErr } = await supabase
          .from('dev_ai_usage_summary')
          .upsert(summary, {
            onConflict: 'project_id,period_month,model_used',
          });

        if (upsertErr) throw upsertErr;
      }

      synced++;
      log.info({ project: project.slug, models: rows.length, period: periodMonth }, 'Usage synced');
    } catch (err) {
      const msg = `${project.slug}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      log.error({ err, project: project.slug }, 'Failed to sync project usage');
    }
  }

  // Log the agent run
  const result = errors.length
    ? (synced > 0 ? 'issues_found' : 'error')
    : 'pass';

  await logPortalAgentRun(supabase, {
    agent_type: 'sync',
    result,
    summary: `Synced AI usage for ${synced}/${projects.length} projects (${periodMonth}).`,
    details: errors.length ? errors.map(e => `ERROR: ${e}`).join('\n') : undefined,
  });

  return NextResponse.json({
    ok: synced > 0 || errors.length === 0,
    synced,
    total: projects.length,
    period: periodMonth,
    errors: errors.length,
  });
}
