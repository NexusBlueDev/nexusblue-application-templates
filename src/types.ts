/* ── Shared Application Types ──
 * Platform-standard type definitions used across API routes, middleware, and components.
 *
 * Customize: Add project-specific roles or extend UserRole for your product's auth model.
 * The base roles below match the NexusBlue Core Platform profile schema.
 */

/**
 * User roles resolved from profiles.role / profiles.platform_role.
 * Used by withAuth middleware for role-based access control.
 *
 * Role hierarchy (highest to lowest):
 *   admin     — platform admin (nexusblue_admin maps here)
 *   employee  — internal staff
 *   partner   — external partners with elevated access
 *   client    — end users / tenants (default)
 */
export type UserRole = 'admin' | 'employee' | 'partner' | 'client';
