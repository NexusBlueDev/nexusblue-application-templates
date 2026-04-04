/* ── Resilient Fetch ──
 * Exponential backoff + circuit breaker for external API calls.
 * Use this instead of raw `fetch()` for any external service call
 * (Stripe SDK handles its own retries — this is for raw fetch).
 *
 * Usage:
 *   import { resilientFetch } from '@/lib/resilient-fetch';
 *
 *   const res = await resilientFetch('https://api.example.com/data', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ key: 'value' }),
 *   });
 *
 *   // With options:
 *   const res = await resilientFetch(url, init, {
 *     retries: 2,             // default: 3
 *     baseDelayMs: 500,       // default: 1000
 *     timeoutMs: 10000,       // default: 30000
 *     circuitKey: 'sendgrid', // enable circuit breaker for this service
 *   });
 *
 * Requires: @/lib/logger (pino)
 */

import { logger } from '@/lib/logger';

const log = logger.child({ module: 'resilient-fetch' });

// ── Circuit Breaker State ──

interface CircuitState {
  failures: number;
  lastFailure: number;
  open: boolean;
}

const circuits = new Map<string, CircuitState>();
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RECOVERY_MS = 60_000; // 60s

function getCircuit(key: string): CircuitState {
  if (!circuits.has(key)) {
    circuits.set(key, { failures: 0, lastFailure: 0, open: false });
  }
  return circuits.get(key)!;
}

function recordSuccess(key: string) {
  const c = getCircuit(key);
  c.failures = 0;
  c.open = false;
}

function recordFailure(key: string) {
  const c = getCircuit(key);
  c.failures++;
  c.lastFailure = Date.now();
  if (c.failures >= CIRCUIT_THRESHOLD) {
    c.open = true;
    log.warn({ circuitKey: key, failures: c.failures }, 'Circuit opened');
  }
}

function isCircuitOpen(key: string): boolean {
  const c = getCircuit(key);
  if (!c.open) return false;
  if (Date.now() - c.lastFailure > CIRCUIT_RECOVERY_MS) {
    c.open = false;
    log.info({ circuitKey: key }, 'Circuit half-open — allowing probe');
    return false;
  }
  return true;
}

// ── Resilient Fetch ──

export interface ResilientFetchOptions {
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelayMs?: number;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
  /** Circuit breaker key — groups calls to the same service */
  circuitKey?: string;
  /** HTTP status codes that should NOT be retried (e.g. 400, 401, 403, 404) */
  noRetryStatuses?: number[];
}

const DEFAULT_NO_RETRY = [400, 401, 403, 404, 409, 422];

export async function resilientFetch(
  url: string,
  init?: RequestInit,
  options?: ResilientFetchOptions,
): Promise<Response> {
  const {
    retries = 3,
    baseDelayMs = 1000,
    timeoutMs = 30_000,
    circuitKey,
    noRetryStatuses = DEFAULT_NO_RETRY,
  } = options ?? {};

  if (circuitKey && isCircuitOpen(circuitKey)) {
    log.warn({ circuitKey, url }, 'Circuit open — request blocked');
    throw new Error(`Circuit breaker open for ${circuitKey}`);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok || noRetryStatuses.includes(response.status)) {
        if (circuitKey) recordSuccess(circuitKey);
        return response;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
        log.warn(
          { url, status: response.status, attempt: attempt + 1, retries, delayMs: Math.round(delay) },
          'Retrying after server error',
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (lastError.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
      }

      if (attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
        log.warn(
          { url, err: lastError, attempt: attempt + 1, retries, delayMs: Math.round(delay) },
          'Retrying after network error',
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  if (circuitKey) recordFailure(circuitKey);
  log.error({ url, err: lastError, retries }, 'All retries exhausted');
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
