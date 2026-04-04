/* ── Environment Variable Validation (Template) ──
 * Validates required environment variables at import time.
 * Import this in instrumentation.ts so the app fails fast on startup.
 *
 * CUSTOMIZE: Replace the schema below with your project's actual env vars.
 *
 * Usage:
 *   // In src/instrumentation.ts:
 *   export async function register() {
 *     if (process.env.NEXT_RUNTIME === 'nodejs') {
 *       await import('./lib/env-validation');
 *     }
 *   }
 *
 *   // In any server file:
 *   import { env } from '@/lib/env-validation';
 *   env.SUPABASE_SERVICE_ROLE_KEY  // typed, guaranteed present
 *
 * Requires: npm install zod
 */

import { z } from 'zod';

// ── Schema (customize per project) ──

const envSchema = z.object({
  // ── Supabase ──
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // ── Add your project-specific required vars here ──
  // STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  // STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  // ANTHROPIC_API_KEY: z.string().min(1),
  // SENDGRID_API_KEY: z.string().min(1),
  // CRON_SECRET: z.string().min(1),

  // ── Optional (present in prod, may be absent locally) ──
  SENTRY_DSN: z.string().url().optional(),

  // ── Runtime ──
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
});

// ── Parse & Export ──

function validateEnv() {
  // Skip strict validation in test environment — CI uses mocked values
  if (process.env.NODE_ENV === 'test') {
    return process.env as unknown as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');

    // In development, warn but don't crash
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `Environment validation warnings:\n${missing}\n` +
        'Some features may not work. Set these in .env.local.'
      );
      return process.env as unknown as z.infer<typeof envSchema>;
    }

    // In production, fail hard
    throw new Error(
      `Missing or invalid environment variables:\n${missing}\n` +
      'Deploy will not succeed until these are set.'
    );
  }

  return parsed.data;
}

export const env = validateEnv();
