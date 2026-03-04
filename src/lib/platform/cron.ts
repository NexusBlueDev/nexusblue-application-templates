/* ── Cron Registry ──
 * Single source of truth for all scheduled tasks. Defines schedules in code,
 * generates platform-specific configs (vercel.json, crontab, etc.).
 *
 * Phase 3 of NexusBlue Platform Evolution.
 */

// ── Types ──

export interface CronJob {
  /** Unique identifier — matches the API route path segment */
  name: string;
  /** API route path (e.g., /api/cron/event-aggregation) */
  path: string;
  /** Cron schedule expression (standard 5-field cron) */
  schedule: string;
  /** Human-readable description */
  description: string;
  /** Whether this cron is currently active */
  enabled: boolean;
}

export interface VercelCronConfig {
  path: string;
  schedule: string;
}

// ── Registry ──
// All cron jobs for nexusblue-website. Each project maintains its own registry.

const CRON_REGISTRY: CronJob[] = [
  // ── Contacts & Attendance ──
  { name: 'event-aggregation', path: '/api/cron/event-aggregation', schedule: '0 8 * * *', description: 'Aggregate event data from integrations', enabled: true },
  { name: 'trend-aggregation', path: '/api/cron/trend-aggregation', schedule: '0 9 * * *', description: 'Compute attendance trends', enabled: true },
  { name: 'daily-digest', path: '/api/cron/daily-digest', schedule: '0 13 * * *', description: 'Send daily attendance digest emails', enabled: true },
  { name: 'send-queued-emails', path: '/api/cron/send-queued-emails', schedule: '*/15 * * * *', description: 'Process email send queue', enabled: true },
  { name: 'nurture-send', path: '/api/cron/nurture-send', schedule: '0 14,22 * * *', description: 'Send nurture campaign emails', enabled: true },
  { name: 'weekly-health-score', path: '/api/cron/weekly-health-score', schedule: '0 14 * * 1', description: 'Calculate weekly engagement health scores', enabled: true },
  { name: 'trend-email', path: '/api/cron/trend-email', schedule: '0 10 * * 2', description: 'Send weekly trend report emails', enabled: true },
  { name: 'churn-detection', path: '/api/cron/churn-detection', schedule: '0 15 * * 3', description: 'Detect churn risk in attendance patterns', enabled: true },
  { name: 'monthly-report', path: '/api/cron/monthly-report', schedule: '0 11 1 * *', description: 'Generate monthly attendance report', enabled: true },
  { name: 'conversation-intelligence', path: '/api/cron/conversation-intelligence', schedule: '0 16 * * 0', description: 'Analyze conversation patterns', enabled: true },

  // ── AppVault ──
  { name: 'appvault-freshness', path: '/api/cron/appvault-freshness', schedule: '0 6 * * *', description: 'Check AppVault entry freshness', enabled: true },

  // ── Portal Agents ──
  { name: 'portal-performance', path: '/api/cron/portal-performance', schedule: '0 5 * * 0', description: 'Weekly PageSpeed audit for all projects', enabled: true },
  { name: 'portal-roadmap', path: '/api/cron/portal-roadmap', schedule: '0 6 * * 0', description: 'Weekly AI roadmap suggestions', enabled: true },
  { name: 'portal-sync', path: '/api/cron/portal-sync', schedule: '0 4 1 * *', description: 'Monthly AI usage sync via Management API', enabled: true },

  // ── BioGate ──
  { name: 'biogate-purge', path: '/api/cron/biogate-purge', schedule: '0 3 * * *', description: 'Purge expired biometric data per retention policy', enabled: true },
  { name: 'biogate-anomaly', path: '/api/cron/biogate-anomaly', schedule: '0 7 * * *', description: 'Detect biometric verification anomalies', enabled: true },
  { name: 'biogate-compliance', path: '/api/cron/biogate-compliance', schedule: '0 8 * * 1', description: 'Weekly biometric compliance audit', enabled: true },

  // ── Grant Writer ──
  { name: 'grant-discovery', path: '/api/cron/grant-discovery', schedule: '0 7 * * 0', description: 'Discover new grant opportunities', enabled: true },
  { name: 'grant-deadlines', path: '/api/cron/grant-deadlines', schedule: '0 9 * * *', description: 'Check grant deadline reminders', enabled: true },
];

// ── Public API ──

/** Get all registered cron jobs */
export function getCronRegistry(): CronJob[] {
  return CRON_REGISTRY;
}

/** Get only enabled cron jobs */
export function getEnabledCrons(): CronJob[] {
  return CRON_REGISTRY.filter(c => c.enabled);
}

/** Generate vercel.json crons array from registry */
export function generateVercelCrons(): VercelCronConfig[] {
  return getEnabledCrons().map(c => ({
    path: c.path,
    schedule: c.schedule,
  }));
}

/** Generate crontab entries for non-Vercel deployments */
export function generateCrontab(baseUrl: string, cronSecret: string): string {
  return getEnabledCrons()
    .map(c => `${c.schedule} curl -s -H "Authorization: Bearer ${cronSecret}" ${baseUrl}${c.path}`)
    .join('\n');
}

/** Generate systemd timer unit content for a specific cron */
export function generateSystemdTimer(cron: CronJob): string {
  // Convert cron schedule to systemd OnCalendar format (simplified)
  return [
    `[Unit]`,
    `Description=${cron.description}`,
    ``,
    `[Timer]`,
    `# Original cron: ${cron.schedule}`,
    `# Convert manually — systemd OnCalendar uses a different format`,
    `Persistent=true`,
    ``,
    `[Install]`,
    `WantedBy=timers.target`,
  ].join('\n');
}
