/* ── Centralized API Route Auth Wrapper ──
 * Replaces ad-hoc auth checks in API routes with a single composable wrapper.
 * Provides: authentication, role checking, impersonation, structured logging.
 *
 * Usage:
 *   // Admin-only route
 *   export const GET = withAuth({ roles: ['admin'] }, async (req, ctx) => {
 *     ctx.log.info('Admin fetched config');
 *     return NextResponse.json({ ok: true });
 *   });
 *
 *   // Any authenticated user
 *   export const POST = withAuth(async (req, ctx) => {
 *     return NextResponse.json({ ok: true });
 *   });
 *
 *   // With impersonation support (partner/admin routes)
 *   export const GET = withAuth({ impersonate: true }, async (req, ctx) => {
 *     // ctx.userId = effective user (may be impersonated)
 *     // ctx.actorId = actual caller (for audit)
 *   });
 *
 * Requires: @/lib/logger, @/lib/supabase/server, @/types (UserRole)
 * Assumes: Supabase auth with profiles table containing role, organization_id, platform_role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceClient } from '@/lib/supabase/server';
import { withRequestId } from '@/lib/logger';
import type { UserRole } from '@/types';
import type pino from 'pino';

// ── Impersonation Rules ──

const IMPERSONATION_ALLOWED: Record<string, string[]> = {
  admin: ['employee', 'partner', 'client'],
  employee: ['partner', 'client'],
};

// ── Types ──

export interface AuthContext {
  /** Effective user ID (impersonated target if active, otherwise caller) */
  userId: string;
  /** Resolved role (of effective user) */
  role: UserRole;
  /** Organization ID (of effective user) */
  organizationId: string | null;
  /** Platform role (of effective user) */
  platformRole: string | null;
  /** Full name (of effective user) */
  fullName: string | null;
  /** Email (of effective user) */
  email: string | null;
  /** True when impersonation is active */
  isImpersonated: boolean;
  /** Actual caller's user ID (always the real user — use for audit trails) */
  actorId: string;
  /** Request-scoped structured logger with correlation ID */
  log: pino.Logger;
}

export interface WithAuthOptions {
  /** Allowed roles. If omitted, any authenticated user is allowed. */
  roles?: UserRole[];
  /** Enable impersonation via x-impersonate-user header. Default: false. */
  impersonate?: boolean;
}

type AuthHandler = (
  request: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>,
) => Promise<Response>;

// ── Core Auth Resolution ──

interface ResolvedAuth {
  userId: string;
  role: UserRole;
  organizationId: string | null;
  platformRole: string | null;
  fullName: string | null;
  email: string | null;
  isImpersonated: boolean;
  actorId: string;
}

async function resolveAuth(
  request: NextRequest,
  enableImpersonation: boolean,
): Promise<
  | { ok: true } & ResolvedAuth
  | { ok: false; response: Response }
> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const service = createServiceClient();
  const { data: callerProfile } = await service
    .from('v_profiles')
    .select('id, role, organization_id, platform_role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!callerProfile) {
    return { ok: false, response: NextResponse.json({ error: 'Profile not found' }, { status: 401 }) };
  }

  // platform_role override (customize per project)
  const callerRole: UserRole = callerProfile.platform_role === 'nexusblue_admin'
    ? 'admin'
    : (callerProfile.role as UserRole) ?? 'client';

  const impersonateUserId = enableImpersonation
    ? request.headers.get('x-impersonate-user')
    : null;

  if (!impersonateUserId) {
    return {
      ok: true,
      userId: user.id,
      role: callerRole,
      organizationId: callerProfile.organization_id,
      platformRole: callerProfile.platform_role,
      fullName: callerProfile.full_name,
      email: callerProfile.email,
      isImpersonated: false,
      actorId: user.id,
    };
  }

  // Validate impersonation permissions
  const allowedTargetRoles = IMPERSONATION_ALLOWED[callerRole] || [];
  if (allowedTargetRoles.length === 0) {
    return { ok: false, response: NextResponse.json({ error: 'You do not have impersonation permissions' }, { status: 403 }) };
  }

  const { data: targetProfile } = await service
    .from('v_profiles')
    .select('id, role, organization_id, platform_role, full_name, email')
    .eq('id', impersonateUserId)
    .single();

  if (!targetProfile) {
    return { ok: false, response: NextResponse.json({ error: 'Target user not found' }, { status: 404 }) };
  }

  const targetRole = (targetProfile.role as UserRole) || 'client';
  if (!allowedTargetRoles.includes(targetRole)) {
    return { ok: false, response: NextResponse.json({ error: `Cannot impersonate ${targetRole} role` }, { status: 403 }) };
  }

  return {
    ok: true,
    userId: targetProfile.id,
    role: targetRole,
    organizationId: targetProfile.organization_id,
    platformRole: targetProfile.platform_role,
    fullName: targetProfile.full_name,
    email: targetProfile.email,
    isImpersonated: true,
    actorId: user.id,
  };
}

// ── Wrapper ──

type RouteContext = { params: Promise<Record<string, string>> };

export function withAuth(handler: AuthHandler): (req: NextRequest, ctx: RouteContext) => Promise<Response>;
export function withAuth(options: WithAuthOptions, handler: AuthHandler): (req: NextRequest, ctx: RouteContext) => Promise<Response>;
export function withAuth(
  optionsOrHandler: WithAuthOptions | AuthHandler,
  maybeHandler?: AuthHandler,
): (req: NextRequest, ctx: RouteContext) => Promise<Response> {
  const options: WithAuthOptions = typeof optionsOrHandler === 'function' ? {} : optionsOrHandler;
  const handler: AuthHandler = typeof optionsOrHandler === 'function' ? optionsOrHandler : maybeHandler!;

  return async (req: NextRequest, routeCtx: RouteContext) => {
    const log = withRequestId(req);

    try {
      const auth = await resolveAuth(req, options.impersonate ?? false);
      if (!auth.ok) {
        log.warn('Auth failed');
        return auth.response;
      }

      if (options.roles && !options.roles.includes(auth.role)) {
        log.warn({ userId: auth.userId, role: auth.role, required: options.roles }, 'Forbidden — role mismatch');
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const childLog = log.child({
        userId: auth.userId,
        role: auth.role,
        ...(auth.isImpersonated ? { actorId: auth.actorId, impersonated: true } : {}),
      });

      const params = routeCtx.params ? await routeCtx.params : undefined;

      return await handler(req, {
        userId: auth.userId,
        role: auth.role,
        organizationId: auth.organizationId,
        platformRole: auth.platformRole,
        fullName: auth.fullName,
        email: auth.email,
        isImpersonated: auth.isImpersonated,
        actorId: auth.actorId,
        log: childLog,
      }, params);
    } catch (err) {
      log.error({ err }, 'Unhandled API error');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
