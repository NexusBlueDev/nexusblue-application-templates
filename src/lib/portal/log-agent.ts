/* ── Portal Agent Logger ──
 * Writes structured run logs to dev_agent_logs table.
 * Every portal agent calls this after completing its work.
 *
 * Usage:
 *   import { logPortalAgentRun } from '@/lib/portal/log-agent';
 *
 *   const logId = await logPortalAgentRun(supabase, {
 *     agent_type: 'performance',
 *     result: errors.length ? 'issues_found' : 'pass',
 *     summary: `Audited ${processed} URLs`,
 *     details: errors.join('\n'),
 *   });
 *
 * Requires: @supabase/supabase-js service client
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentLogEntry } from '@/lib/portal/types';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'portal-agent-log' });

/**
 * Write an agent run to dev_agent_logs. Returns the log row ID (for linking roadmap items).
 */
export async function logPortalAgentRun(
  supabase: SupabaseClient,
  entry: AgentLogEntry,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('dev_agent_logs')
    .insert({
      project_id: entry.project_id ?? null,
      agent_type: entry.agent_type,
      result: entry.result,
      summary: entry.summary,
      details: entry.details ?? null,
      triggered_by: entry.triggered_by ?? 'cron',
    })
    .select('id')
    .single();

  if (error) {
    log.error({ err: error, agentType: entry.agent_type }, 'Failed to write agent log');
    return null;
  }

  log.info({ logId: data.id, agentType: entry.agent_type, result: entry.result }, 'Agent run logged');
  return data.id;
}
