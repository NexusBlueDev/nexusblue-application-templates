/* ── Supabase Server Client Template ──
 * Creates Supabase clients for server-side operations (API routes, Server Components, middleware).
 *
 * Two clients:
 *   createServerSupabase() — user-scoped (respects RLS via auth cookies)
 *   createServiceClient()  — service-role (bypasses RLS — use for admin/cron/agent operations)
 *
 * Setup:
 *   npm install @supabase/supabase-js @supabase/ssr
 *
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Data classification: internal (infrastructure — no PII in this file)
 *
 * Customize: Adapt cookie handling to your auth strategy (e.g., next-auth, clerk).
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * User-scoped Supabase client (respects RLS).
 * Use in API routes and Server Components where the caller's identity matters.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll can fail in Server Components (read-only cookies).
            // Safe to ignore — auth state is read-only in that context.
          }
        },
      },
    },
  );
}

/**
 * Service-role Supabase client (bypasses RLS).
 * Use for cron jobs, agents, admin operations, and cross-tenant queries.
 * NEVER expose to the client or pass to user-initiated code paths.
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
