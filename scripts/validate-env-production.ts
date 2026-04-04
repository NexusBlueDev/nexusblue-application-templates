/**
 * Validate env-validation.ts schema against production-like conditions.
 * Runs with NODE_ENV=production and blank optional vars to catch the
 * class of bug where empty env vars crash Zod validation at startup.
 *
 * Usage: npx tsx scripts/validate-env-production.ts
 *
 * Called by:
 *   - deploy-local.sh (global hook, pre-push)
 *   - CI workflow (pre-build step)
 *
 * Customize: Update the env vars below to match your project's schema.
 *
 * Reference: Deployment Integrity Protocol (Core DB)
 * Rule #214: Deployment integrity verification required before push
 */

// @ts-expect-error — NODE_ENV is typed as readonly, but we need to override for testing
process.env.NODE_ENV = 'production';

// ── Required vars — use placeholders (testing schema, not values) ──
process.env.NEXT_PUBLIC_APP_NAME = 'Placeholder';
process.env.NEXT_PUBLIC_APP_URL = 'https://placeholder.example.com';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder-anon-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-key';

// ── Optional vars set to empty string (simulates Vercel blank vars) ──
// Add any optional vars your schema defines here as empty strings.
// This is the exact pattern that causes Zod .optional() + .min(1) to fail.
process.env.SENDGRID_API_KEY = '';
process.env.STRIPE_SECRET_KEY = '';

async function main() {
  try {
    const { env } = await import('../src/lib/env-validation');
    console.log('ENV VALIDATION: PASS — schema accepts production-like blank optionals');
    console.log(`  Validated keys: ${Object.keys(env).length}`);
    process.exit(0);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('ENV VALIDATION: FAIL — schema would crash in production');
    console.error(msg);
    process.exit(1);
  }
}

main();
