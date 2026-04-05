/* ── Portal Agent Types ──
 * Shared type definitions for super-admin portal agents.
 * These agents write to dev_* tables in the nexusblue-website Supabase.
 */

// ── Agent Log (input/output for all agents) ──

export type AgentType = 'architect' | 'security' | 'qa' | 'roadmap' | 'performance' | 'sync';
export type AgentResult = 'pass' | 'issues_found' | 'error';

export interface AgentLogEntry {
  project_id?: string;
  agent_type: AgentType;
  result: AgentResult;
  summary: string;
  details?: string;
  triggered_by?: string;
}

// ── Roadmap Items (portal-roadmap output) ──

export type RoadmapCategory =
  | 'security'
  | 'performance'
  | 'ai_adherence'
  | 'architecture'
  | 'documentation'
  | 'feature'
  | 'tech_debt';

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Effort = 's' | 'm' | 'l' | 'xl';

export interface RoadmapItem {
  project_id: string;
  title: string;
  description?: string;
  category: RoadmapCategory;
  priority: Priority;
  effort: Effort;
  source: 'agent';
  agent_log_id: string | null;
  status: 'suggestion';
}

// ── Performance Snapshots (portal-performance output) ──

export interface PerformanceSnapshot {
  project_id: string;
  url: string;
  lcp_ms?: number;
  inp_ms?: number;
  cls_score?: number;
  ttfb_ms?: number;
  lighthouse_perf?: number;
  lighthouse_a11y?: number;
  lighthouse_seo?: number;
  source: 'pagespeed' | 'manual' | 'vercel';
}

// ── AI Usage Summary (portal-sync output) ──

export interface AiUsageSummary {
  project_id: string;
  period_month: string; // ISO date, first day of month (YYYY-MM-01)
  model_used: string;
  tokens_used: number;
  cost_usd: number;
  request_count: number;
}

// ── Project reference (from dev_projects) ──

export interface DevProject {
  id: string;
  slug: string;
  name: string;
  status: string;
  supabase_project_ref?: string;
  production_url?: string;
}

// ── Performance targets (CWV thresholds) ──

export const CWV_TARGETS = {
  lcp_ms: 2500,
  inp_ms: 200,
  cls_score: 0.1,
  ttfb_ms: 800,
  lighthouse_perf: 90,
  lighthouse_a11y: 90,
  lighthouse_seo: 90,
} as const;
