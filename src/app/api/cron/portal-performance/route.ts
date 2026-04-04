/* ── Portal Performance Agent ──
 * Weekly PageSpeed Insights audit for all active projects.
 * Schedule: 0 5 * * 0 (Sunday 5am UTC)
 *
 * Reads: dev_projects (active projects with production_url)
 * Writes: dev_performance_snapshots, dev_agent_logs, dev_roadmap_items (below-target)
 *
 * Requires env:
 *   CRON_SECRET         — shared secret for cron auth
 *   PAGESPEED_API_KEY   — Google PageSpeed Insights API key
 *   SUPABASE_SERVICE_ROLE_KEY — for writing to dev_* tables
 *
 * Data classification: internal (no PII, only performance metrics)
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { resilientFetch } from '@/lib/resilient-fetch';
import { logPortalAgentRun } from '@/lib/portal/log-agent';
import { logger } from '@/lib/logger';
import type { DevProject, PerformanceSnapshot, RoadmapItem } from '@/lib/portal/types';
import { CWV_TARGETS } from '@/lib/portal/types';

export const maxDuration = 120;

const log = logger.child({ module: 'portal-performance' });

// ── Cron Auth ──

function verifyCronSecret(request: Request): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// ── PageSpeed Fetch ──

interface PageSpeedResult {
  lcp_ms?: number;
  inp_ms?: number;
  cls_score?: number;
  ttfb_ms?: number;
  lighthouse_perf?: number;
  lighthouse_a11y?: number;
  lighthouse_seo?: number;
}

async function fetchPageSpeedMetrics(url: string, apiKey: string): Promise<PageSpeedResult> {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.set('category', 'performance');
  endpoint.searchParams.set('category', 'accessibility');
  endpoint.searchParams.set('category', 'seo');

  const res = await resilientFetch(endpoint.toString(), undefined, {
    retries: 2,
    timeoutMs: 60_000,
    circuitKey: 'pagespeed',
  });

  if (!res.ok) {
    throw new Error(`PageSpeed API returned ${res.status}`);
  }

  const data = await res.json();

  const crux = data.loadingExperience?.metrics ?? {};
  const categories = data.lighthouseResult?.categories ?? {};

  return {
    lcp_ms: crux.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
    inp_ms: crux.INTERACTION_TO_NEXT_PAINT?.percentile,
    cls_score: crux.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile
      ? crux.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
      : undefined,
    ttfb_ms: crux.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile,
    lighthouse_perf: Math.round((categories.performance?.score ?? 0) * 100),
    lighthouse_a11y: Math.round((categories.accessibility?.score ?? 0) * 100),
    lighthouse_seo: Math.round((categories.seo?.score ?? 0) * 100),
  };
}

// ── Below-Target Detection ──

function findBelowTargetMetrics(metrics: PageSpeedResult): string[] {
  const issues: string[] = [];
  if (metrics.lcp_ms && metrics.lcp_ms > CWV_TARGETS.lcp_ms) issues.push(`LCP ${metrics.lcp_ms}ms > ${CWV_TARGETS.lcp_ms}ms`);
  if (metrics.inp_ms && metrics.inp_ms > CWV_TARGETS.inp_ms) issues.push(`INP ${metrics.inp_ms}ms > ${CWV_TARGETS.inp_ms}ms`);
  if (metrics.cls_score && metrics.cls_score > CWV_TARGETS.cls_score) issues.push(`CLS ${metrics.cls_score} > ${CWV_TARGETS.cls_score}`);
  if (metrics.ttfb_ms && metrics.ttfb_ms > CWV_TARGETS.ttfb_ms) issues.push(`TTFB ${metrics.ttfb_ms}ms > ${CWV_TARGETS.ttfb_ms}ms`);
  if (metrics.lighthouse_perf && metrics.lighthouse_perf < CWV_TARGETS.lighthouse_perf) issues.push(`Perf score ${metrics.lighthouse_perf} < ${CWV_TARGETS.lighthouse_perf}`);
  if (metrics.lighthouse_a11y && metrics.lighthouse_a11y < CWV_TARGETS.lighthouse_a11y) issues.push(`A11y score ${metrics.lighthouse_a11y} < ${CWV_TARGETS.lighthouse_a11y}`);
  if (metrics.lighthouse_seo && metrics.lighthouse_seo < CWV_TARGETS.lighthouse_seo) issues.push(`SEO score ${metrics.lighthouse_seo} < ${CWV_TARGETS.lighthouse_seo}`);
  return issues;
}

// ── Route Handler ──

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    log.error('PAGESPEED_API_KEY not configured');
    return NextResponse.json({ error: 'PAGESPEED_API_KEY not configured' }, { status: 500 });
  }

  const supabase = createServiceClient();
  let processed = 0;
  const errors: string[] = [];
  const allIssues: string[] = [];

  // Load active projects with production URLs
  const { data: projects } = await supabase
    .from('dev_projects')
    .select('id, slug, name, status, production_url')
    .eq('status', 'active')
    .not('production_url', 'is', null);

  if (!projects?.length) {
    log.info('No active projects with production URLs');
    return NextResponse.json({ ok: true, processed: 0, message: 'No projects to audit' });
  }

  // Audit each project (partial success — one failure does not stop others)
  for (const project of projects as DevProject[]) {
    try {
      const metrics = await fetchPageSpeedMetrics(project.production_url!, apiKey);

      // Write snapshot
      const snapshot: PerformanceSnapshot = {
        project_id: project.id,
        url: project.production_url!,
        ...metrics,
        source: 'pagespeed',
      };

      const { error: insertErr } = await supabase
        .from('dev_performance_snapshots')
        .insert(snapshot);

      if (insertErr) throw insertErr;

      // Check for below-target metrics
      const belowTarget = findBelowTargetMetrics(metrics);
      if (belowTarget.length > 0) {
        allIssues.push(`${project.slug}: ${belowTarget.join(', ')}`);
      }

      processed++;
      log.info({ project: project.slug, metrics }, 'Performance snapshot captured');
    } catch (err) {
      const msg = `${project.slug}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      log.error({ err, project: project.slug }, 'Failed to audit project');
    }
  }

  // Log the agent run
  const result = errors.length
    ? (processed > 0 ? 'issues_found' : 'error')
    : (allIssues.length > 0 ? 'issues_found' : 'pass');

  const logId = await logPortalAgentRun(supabase, {
    agent_type: 'performance',
    result,
    summary: `Audited ${processed}/${projects.length} projects. ${allIssues.length} below-target metrics.`,
    details: [...allIssues, ...errors.map(e => `ERROR: ${e}`)].join('\n') || undefined,
  });

  // Create roadmap items for below-target projects
  if (logId && allIssues.length > 0) {
    const roadmapItems: Omit<RoadmapItem, 'agent_log_id'>[] = allIssues.map((issue) => {
      const [slug] = issue.split(':');
      const projectId = (projects as DevProject[]).find(p => p.slug === slug)?.id;
      return {
        project_id: projectId!,
        title: `Performance below target: ${slug}`,
        description: issue,
        category: 'performance' as const,
        priority: 'medium' as const,
        effort: 'm' as const,
        source: 'agent' as const,
        status: 'suggestion' as const,
      };
    });

    for (const item of roadmapItems) {
      await supabase.from('dev_roadmap_items').insert({
        ...item,
        agent_log_id: logId,
      });
    }
  }

  return NextResponse.json({
    ok: processed > 0 || errors.length === 0,
    processed,
    total: projects.length,
    belowTarget: allIssues.length,
    errors: errors.length,
  });
}
