#!/usr/bin/env bash
# ── Hardening Rollout Script ──
# Copies enterprise hardening templates to a target Next.js project.
# Usage: ./rollout-hardening.sh /path/to/project [--force]
#
# What it does:
#   1. Installs pino + adds to serverExternalPackages
#   2. Copies generic files: logger.ts, platform/env.ts, resilient-fetch.ts, error-boundary.tsx
#   3. Creates error.tsx page(s) for Next.js error boundaries
#   4. Generates env-validation.ts from .env.local keys
#   5. Creates instrumentation.ts if missing
#   6. Reports: with-auth.ts adaptation needed, API routes to migrate
#
# Does NOT overwrite existing files unless --force is passed.

set -euo pipefail

TEMPLATES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/src"
PROJECT_DIR="${1:?Usage: rollout-hardening.sh /path/to/project [--force]}"
FORCE="${2:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
skip()  { echo -e "${CYAN}[SKIP]${NC} $1"; }
err()   { echo -e "${RED}[ERR]${NC} $1"; }
header(){ echo -e "\n${CYAN}── $1 ──${NC}"; }

# ── Validate ──
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  err "No package.json found in $PROJECT_DIR"
  exit 1
fi

PROJECT_NAME=$(basename "$PROJECT_DIR")
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Hardening Rollout: ${PROJECT_NAME}${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"

MANUAL_TASKS=()

# ── Helper: copy file if not exists ──
copy_template() {
  local src="$1"
  local dest="$2"
  local desc="$3"

  mkdir -p "$(dirname "$dest")"

  if [ -f "$dest" ] && [ "$FORCE" != "--force" ]; then
    skip "$desc already exists: $dest"
    return 1
  fi

  cp "$src" "$dest"
  info "Copied $desc → $dest"
  return 0
}

# ── Step 1: Install pino ──
header "Step 1: pino dependency"

if grep -q '"pino"' "$PROJECT_DIR/package.json"; then
  skip "pino already in package.json"
else
  (cd "$PROJECT_DIR" && npm install pino 2>/dev/null)
  info "Installed pino"
fi

# Add pino to serverExternalPackages in next.config
NEXT_CONFIG=""
for f in next.config.ts next.config.mjs next.config.js; do
  if [ -f "$PROJECT_DIR/$f" ]; then
    NEXT_CONFIG="$PROJECT_DIR/$f"
    break
  fi
done

if [ -n "$NEXT_CONFIG" ]; then
  if grep -q 'pino' "$NEXT_CONFIG"; then
    skip "pino already in serverExternalPackages"
  else
    if grep -q 'serverExternalPackages' "$NEXT_CONFIG"; then
      # Add pino to existing array
      sed -i "s/serverExternalPackages:\s*\[/serverExternalPackages: ['pino', /" "$NEXT_CONFIG"
      info "Added 'pino' to existing serverExternalPackages"
    else
      MANUAL_TASKS+=("Add serverExternalPackages: ['pino'] to $NEXT_CONFIG")
      warn "serverExternalPackages not found — add manually"
    fi
  fi
else
  err "No next.config found"
fi

# ── Step 2: Copy generic files ──
header "Step 2: Generic template files"

# platform/env.ts (logger dependency)
copy_template "$TEMPLATES_DIR/lib/platform/env.ts" "$PROJECT_DIR/src/lib/platform/env.ts" "platform/env.ts" || true

# logger.ts
copy_template "$TEMPLATES_DIR/lib/logger.ts" "$PROJECT_DIR/src/lib/logger.ts" "logger.ts" || true

# resilient-fetch.ts
copy_template "$TEMPLATES_DIR/lib/resilient-fetch.ts" "$PROJECT_DIR/src/lib/resilient-fetch.ts" "resilient-fetch.ts" || true

# error-boundary.tsx — strip Sentry if not installed
if [ ! -f "$PROJECT_DIR/src/components/error-boundary.tsx" ] || [ "$FORCE" = "--force" ]; then
  mkdir -p "$PROJECT_DIR/src/components"
  if grep -q '@sentry/nextjs' "$PROJECT_DIR/package.json" 2>/dev/null; then
    cp "$TEMPLATES_DIR/components/error-boundary.tsx" "$PROJECT_DIR/src/components/error-boundary.tsx"
    info "Copied error-boundary.tsx (with Sentry)"
  else
    cp "$TEMPLATES_DIR/components/error-boundary-no-sentry.tsx" "$PROJECT_DIR/src/components/error-boundary.tsx"
    info "Copied error-boundary.tsx (no Sentry)"
  fi
else
  skip "error-boundary.tsx already exists"
fi

# ── Step 3: Create error.tsx pages ──
header "Step 3: Error boundary pages"

ERROR_PAGE=''"'"'use client'"'"';

import { ErrorBoundary } from '"'"'@/components/error-boundary'"'"';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundary error={error} reset={reset} context="Application" />;
}
'

if [ ! -f "$PROJECT_DIR/src/app/error.tsx" ]; then
  echo "$ERROR_PAGE" > "$PROJECT_DIR/src/app/error.tsx"
  info "Created src/app/error.tsx"
else
  skip "src/app/error.tsx already exists"
fi

# Check for dashboard layout and create dashboard error.tsx
if [ -d "$PROJECT_DIR/src/app/(dashboard)" ]; then
  if [ ! -f "$PROJECT_DIR/src/app/(dashboard)/error.tsx" ]; then
    DASH_ERROR=$(echo "$ERROR_PAGE" | sed 's/context="Application"/context="Dashboard"/')
    echo "$DASH_ERROR" > "$PROJECT_DIR/src/app/(dashboard)/error.tsx"
    info "Created src/app/(dashboard)/error.tsx"
  else
    skip "src/app/(dashboard)/error.tsx already exists"
  fi
fi

# ── Step 4: with-auth.ts ──
header "Step 4: with-auth.ts (needs adaptation)"

if [ -f "$PROJECT_DIR/src/lib/api/with-auth.ts" ]; then
  skip "with-auth.ts already exists"
else
  copy_template "$TEMPLATES_DIR/lib/api/with-auth.ts" "$PROJECT_DIR/src/lib/api/with-auth.ts" "with-auth.ts (TEMPLATE)" || true
  MANUAL_TASKS+=("Adapt with-auth.ts: check profiles table schema, role column, v_profiles view, UserRole type, createServerSupabase import")
  warn "with-auth.ts copied as template — MUST be adapted to project's auth pattern"
fi

# Detect auth pattern for report
echo -e "  ${CYAN}Auth pattern detection:${NC}"
if [ -d "$PROJECT_DIR/supabase/migrations" ]; then
  if grep -rl 'v_profiles' "$PROJECT_DIR/supabase/migrations/" 2>/dev/null | head -1 > /dev/null 2>&1; then
    echo "    v_profiles view: YES"
  else
    echo "    v_profiles view: NO — with-auth queries v_profiles, may need to create view or change to profiles table"
    MANUAL_TASKS+=("Create v_profiles view OR modify with-auth.ts to query profiles table directly")
  fi

  ROLE_COL=$(grep -r "role.*CHECK" "$PROJECT_DIR/supabase/migrations/" 2>/dev/null | head -1 || true)
  if [ -n "$ROLE_COL" ]; then
    echo "    Roles: $ROLE_COL"
  fi
fi

# ── Step 5: env-validation.ts ──
header "Step 5: env-validation.ts"

if [ -f "$PROJECT_DIR/src/lib/env-validation.ts" ] && [ "$FORCE" != "--force" ]; then
  skip "env-validation.ts already exists"
else
  # Check if zod is installed
  if ! grep -q '"zod"' "$PROJECT_DIR/package.json"; then
    (cd "$PROJECT_DIR" && npm install zod 2>/dev/null)
    info "Installed zod"
  fi

  # Generate from .env.local keys
  if [ -f "$PROJECT_DIR/.env.local" ]; then
    ENV_KEYS=$(grep -v '^#' "$PROJECT_DIR/.env.local" | grep -v '^$' | sed 's/=.*//' | sort)

    # Build zod schema entries
    SCHEMA_LINES=""
    while IFS= read -r key; do
      [ -z "$key" ] && continue
      case "$key" in
        *_URL)     SCHEMA_LINES+="  $key: z.string().url(),\n" ;;
        *_KEY|*_SECRET|*_TOKEN|*_PASSWORD)
                   SCHEMA_LINES+="  $key: z.string().min(1),\n" ;;
        NEXT_PUBLIC_*)
                   SCHEMA_LINES+="  $key: z.string().min(1),\n" ;;
        NODE_ENV)  SCHEMA_LINES+="  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),\n" ;;
        VERCEL_ENV) SCHEMA_LINES+="  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),\n" ;;
        *)         SCHEMA_LINES+="  $key: z.string().min(1),\n" ;;
      esac
    done <<< "$ENV_KEYS"

    cat > "$PROJECT_DIR/src/lib/env-validation.ts" << ENVEOF
/* ── Environment Variable Validation ──
 * Auto-generated from .env.local keys. Review and adjust types.
 * Import in instrumentation.ts so the app fails fast on startup.
 */

import { z } from 'zod';

const envSchema = z.object({
$(echo -e "$SCHEMA_LINES")});

function validateEnv() {
  if (process.env.NODE_ENV === 'test') {
    return process.env as unknown as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => \`  \${i.path.join('.')}: \${i.message}\`)
      .join('\\n');

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        \`Environment validation warnings:\\n\${missing}\\n\` +
        'Some features may not work. Set these in .env.local.'
      );
      return process.env as unknown as z.infer<typeof envSchema>;
    }

    throw new Error(
      \`Missing or invalid environment variables:\\n\${missing}\\n\` +
      'Deploy will not succeed until these are set.'
    );
  }

  return parsed.data;
}

export const env = validateEnv();
ENVEOF
    info "Generated env-validation.ts from .env.local ($(echo "$ENV_KEYS" | wc -l) vars)"
    MANUAL_TASKS+=("Review env-validation.ts — adjust required/optional, add URL/prefix validators")
  else
    cp "$TEMPLATES_DIR/lib/env-validation.ts" "$PROJECT_DIR/src/lib/env-validation.ts"
    warn "No .env.local found — copied template env-validation.ts (needs customization)"
    MANUAL_TASKS+=("Customize env-validation.ts with project-specific env vars")
  fi
fi

# ── Step 6: instrumentation.ts ──
header "Step 6: instrumentation.ts"

INSTRUMENTATION_FILE=""
for f in instrumentation.ts src/instrumentation.ts; do
  if [ -f "$PROJECT_DIR/$f" ]; then
    INSTRUMENTATION_FILE="$PROJECT_DIR/$f"
    break
  fi
done

if [ -z "$INSTRUMENTATION_FILE" ]; then
  cat > "$PROJECT_DIR/src/instrumentation.ts" << 'INSTEOF'
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/env-validation');
  }
}
INSTEOF
  info "Created src/instrumentation.ts"
else
  if grep -q 'env-validation' "$INSTRUMENTATION_FILE"; then
    skip "instrumentation.ts already imports env-validation"
  else
    MANUAL_TASKS+=("Add env-validation import to $INSTRUMENTATION_FILE")
    warn "instrumentation.ts exists but doesn't import env-validation — add manually"
  fi
fi

# ── Step 7: API Route Report ──
header "Step 7: API routes needing withAuth migration"

ROUTE_COUNT=0
if [ -d "$PROJECT_DIR/src/app/api" ]; then
  ROUTES=$(find "$PROJECT_DIR/src/app/api" -name "route.ts" -o -name "route.tsx" 2>/dev/null || true)
  if [ -n "$ROUTES" ]; then
    ROUTE_COUNT=$(echo "$ROUTES" | wc -l)
    echo "  Found $ROUTE_COUNT API route files"

    # Check which already use withAuth
    ALREADY_MIGRATED=0
    NEEDS_MIGRATION=0
    while IFS= read -r route; do
      if grep -q 'withAuth' "$route" 2>/dev/null; then
        ((ALREADY_MIGRATED++)) || true
      else
        ((NEEDS_MIGRATION++)) || true
      fi
    done <<< "$ROUTES"

    echo "  Already using withAuth: $ALREADY_MIGRATED"
    echo "  Need migration: $NEEDS_MIGRATION"

    if [ "$NEEDS_MIGRATION" -gt 0 ]; then
      MANUAL_TASKS+=("Migrate $NEEDS_MIGRATION API routes to withAuth (project-specific, incremental)")
    fi
  fi
else
  skip "No src/app/api directory"
fi

# ── Summary ──
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Hardening Summary: ${PROJECT_NAME}${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "  API routes: $ROUTE_COUNT total"
echo ""

if [ ${#MANUAL_TASKS[@]} -gt 0 ]; then
  echo -e "${YELLOW}Manual tasks remaining:${NC}"
  for i in "${!MANUAL_TASKS[@]}"; do
    echo "  $((i+1)). ${MANUAL_TASKS[$i]}"
  done
else
  echo -e "${GREEN}No manual tasks — hardening complete!${NC}"
fi
echo ""
