/* ── Structured Logging (pino) ──
 * Platform-wide structured logger with request correlation IDs.
 * Heuristic H38: pino uses object-first pattern — log.error({ err }, message).
 *
 * IMPORTANT: Add 'pino' to serverExternalPackages in next.config.ts
 * to prevent Vercel OOM when many routes import this file.
 *
 * Usage in API routes:
 *   import { logger, withRequestId } from '@/lib/logger';
 *   const log = withRequestId(request);
 *   log.info({ userId }, 'Fetched dashboard');
 *   log.error({ err }, 'Payment failed');
 *
 * Requires: npm install pino
 */

import pino from 'pino';
import { getPlatformInfo } from '@/lib/platform/env';

// ── Base Logger ──

const info = getPlatformInfo();

export const logger = pino({
  level: info.environment === 'production' ? 'info' : 'debug',
  // Vercel captures stdout as structured JSON natively — no transport needed
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  base: {
    env: info.environment,
    platform: info.platform,
    ...(info.region ? { region: info.region } : {}),
  },
  // Redact sensitive fields if they appear in log objects
  redact: {
    paths: [
      'password',
      'token',
      'secret',
      'authorization',
      'cookie',
      'apiKey',
      'api_key',
      'access_token',
      'refresh_token',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// ── Request Correlation ──

/**
 * Create a child logger bound to a request's correlation ID.
 * Uses x-request-id header if present (load balancer / CDN), otherwise generates one.
 */
export function withRequestId(
  request: Request,
  bindings?: Record<string, unknown>,
): pino.Logger {
  const requestId =
    request.headers.get('x-request-id') ||
    request.headers.get('x-vercel-id') ||
    crypto.randomUUID();

  const url = new URL(request.url);

  return logger.child({
    requestId,
    method: request.method,
    path: url.pathname,
    ...bindings,
  });
}
