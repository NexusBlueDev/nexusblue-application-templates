export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Pre-load serverExternalPackages BEFORE Sentry.init() registers the IITM Worker.
    // Every package listed in next.config.ts serverExternalPackages must be imported here,
    // in the same order, before the sentry.server.config import below.
    // Without pre-loading, a cold-start request loads them after IITM activates → 30s hang.
    // ADR 82568b6e governs this pattern — apply to every NexusBlue Next.js project.
    await import('pino');

    await import('../sentry.server.config');
    await import('./lib/env-validation');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs';
