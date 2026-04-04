/* ── Portal Roadmap Agent ──
 * Reads recent agent logs (architect, security, QA, performance) and generates
 * prioritized improvement suggestions as roadmap items.
 * Schedule: 0 6 * * 0 (Sunday 6am UTC — runs after portal-performance)
 *
 * Reads: dev_agent_logs (recent issues), dev_projects
 * Writes: dev_roadmap_items, dev_agent_logs
 *
 * Requires env:
 *   CRON_SECRET             — shared secret for cron auth
 *   ANTHROPIC_API_KEY       — Claude API for AI-powered analysis
 *   SUPABASE_SERVICE_ROLE_KEY — for reading/writing dev_* tables
 *
 * Data classification: internal (agent summaries, no PII)
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { resilientFetch } from '@/lib/resilient-fetch';
import { logPortalAgentRun } from '@/lib/portal/log-agent';
import { logger } from '@/lib/logger';
import type { RoadmapCategory, Priority, Effort } from '@/lib/portal/types';

export const maxDuration = 120;

const log = logger.child({ module: 'portal-roadmap' });

// ── Cron Auth ──

function verifyCronSecret(request: Request): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// ── AI Analysis ──

interface SuggestedItem {
  project_id: string;
  title: string;
  description: string;
  category: RoadmapCategory;
  priority: Priority;
  effort: Effort;
}

async function analyzeLogsWithAI(
  logs: Array<{ project_slug: string; project_id: string; agent_type: string; result: string; summary: string; details: string | null }>,
  apiKey: string,
): Promise<SuggestedItem[]> {
  const prompt = `You are a senior engineering advisor reviewing automated agent results for a software platform.

Below are recent agent logs that found issues. Analyze them and produce a JSON array of the top improvement suggestions (max 5). Each suggestion should be:
- Actionable and specific
- Prioritized by impact
- Scoped to a single project

Agent logs:
${logs.map(l => `[${l.agent_type}] ${l.project_slug} — ${l.result}: ${l.summary}${l.details ? `\n  Details: ${l.details}` : ''}`).join('\n\n')}

Respond ONLY with a JSON array. Each object must have:
- project_id (string, use the exact ID from the logs)
- title (string, under 80 chars)
- description (string, 1-2 sentences)
- category (one of: security, performance, ai_adherence, architecture, documentation, feature, tech_debt)
- priority (one of: critical, high, medium, low)
- effort (one of: s, m, l, xl)`;

  const res = await resilientFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  }, {
    retries: 2,
    timeoutMs: 60_000,
    circuitKey: 'anthropic',
  });

  if (!res.ok) {
    throw new Error(`Anthropic API returned ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';

  // Extract JSON array from response (handles markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('AI response did not contain a valid JSON array');
  }

  return JSON.parse(jsonMatch[0]) as SuggestedItem[];
}

// ── Route Handler ──

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log.error('ANTHROPIC_API_KEY not configured');
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const supabase = createServiceClient();

  // Fetch recent agent logs with issues (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentLogs, error: logsErr } = await supabase
    .from('dev_agent_logs')
    .select(`
      id,
      agent_type,
      result,
      summary,
      details,
      project_id,
      dev_projects!inner(id, slug)
    `)
    .in('result', ['issues_found', 'error'])
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50);

  if (logsErr) {
    log.error({ err: logsErr }, 'Failed to fetch agent logs');
    return NextResponse.json({ error: 'Failed to fetch agent logs' }, { status: 500 });
  }

  if (!recentLogs?.length) {
    log.info('No recent agent issues — skipping roadmap generation');
    await logPortalAgentRun(supabase, {
      agent_type: 'roadmap',
      result: 'pass',
      summary: 'No recent agent issues to analyze.',
    });
    return NextResponse.json({ ok: true, suggestions: 0, message: 'No recent issues' });
  }

  // Prepare logs for AI analysis
  const logsForAI = recentLogs.map((entry: Record<string, unknown>) => {
    const project = entry.dev_projects as { id: string; slug: string } | null;
    return {
      project_slug: project?.slug ?? 'unknown',
      project_id: (entry.project_id as string) ?? '',
      agent_type: entry.agent_type as string,
      result: entry.result as string,
      summary: entry.summary as string,
      details: (entry.details as string) ?? null,
    };
  });

  try {
    const suggestions = await analyzeLogsWithAI(logsForAI, apiKey);

    // Log the roadmap agent run
    const logId = await logPortalAgentRun(supabase, {
      agent_type: 'roadmap',
      result: suggestions.length > 0 ? 'issues_found' : 'pass',
      summary: `Generated ${suggestions.length} roadmap suggestions from ${recentLogs.length} agent issues.`,
      details: suggestions.map(s => `[${s.priority}] ${s.title}`).join('\n') || undefined,
    });

    // Write suggestions to dev_roadmap_items
    let inserted = 0;
    for (const suggestion of suggestions) {
      const { error: insertErr } = await supabase
        .from('dev_roadmap_items')
        .insert({
          project_id: suggestion.project_id,
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category,
          priority: suggestion.priority,
          effort: suggestion.effort,
          source: 'agent',
          agent_log_id: logId,
          status: 'suggestion',
        });

      if (insertErr) {
        log.error({ err: insertErr, title: suggestion.title }, 'Failed to insert roadmap item');
      } else {
        inserted++;
      }
    }

    log.info({ suggestions: suggestions.length, inserted }, 'Roadmap suggestions generated');

    return NextResponse.json({
      ok: true,
      analyzed: recentLogs.length,
      suggestions: suggestions.length,
      inserted,
    });
  } catch (err) {
    log.error({ err }, 'Roadmap agent failed');

    await logPortalAgentRun(supabase, {
      agent_type: 'roadmap',
      result: 'error',
      summary: `Roadmap agent failed: ${err instanceof Error ? err.message : String(err)}`,
    });

    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
