export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Pre-load serverExternalPackages BEFORE Sentry.init() registers the IITM Worker.
    // Every package listed in next.config.ts serverExternalPackages must be imported here,
    // in the same order, before the sentry.server.config import below.
    // Without pre-loading, a cold-start request loads them after IITM activates → 30s hang.
    // ADR 82568b6e governs this pattern — apply to every NexusBlue Next.js project.
    await import('pino');

    // ── audit_events runtime bootstrap (REQUIRED if any route uses withAuditEvent()/
    // secureRoute() from @nexusbluedev/core/security — see the cron routes in this
    // template and docs/SECURITY_STANDARD.md) ──
    //
    // Without this block, every audit write silently no-ops. Two independent failure
    // modes, both confirmed live across multiple NexusBlue projects before this block
    // was added here (core_decisions ba2bf975, ADR 6421f19d):
    //   1. initCore() is never called anywhere in the app — @nexusbluedev/core's shared
    //      getClient() singleton throws on every request, caught by emitAuditEvent's
    //      warn-once path (looks like nothing happened; nothing crashed either).
    //   2. Even with initCore() called, Vercel freezes a Lambda's execution environment
    //      immediately once the response is sent — a bare fire-and-forget audit write is
    //      silently abandoned mid-flight unless configureAuditRuntime({ after }) registers
    //      Next.js's keep-alive primitive (@nexusbluedev/core >=1.6.4).
    //
    // initCore() here must point at THIS APP'S OWN product DB (the same client
    // createServiceClient() builds) — audit_events lives alongside your app's own
    // tables, not a shared Core DB. If this app ALSO calls initCore() elsewhere (e.g.
    // a separate Core DB client for NAOL bootstrap), order matters: initCore() sets one
    // process-wide singleton and whichever call runs LAST wins — put any other
    // initCore() call BEFORE this block, not after.
    try {
      const { initCore } = await import('@nexusbluedev/core');
      const { configureAuditRuntime } = await import('@nexusbluedev/core/security');
      const { createServiceClient } = await import('./lib/supabase/server');
      const { after } = await import('next/server');
      initCore(createServiceClient());
      configureAuditRuntime({ after });
    } catch (err) {
      console.warn('[instrumentation] audit_events initCore/configureAuditRuntime failed (permissive):', err);
    }

    await import('../sentry.server.config');
    await import('./lib/env-validation');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs';
