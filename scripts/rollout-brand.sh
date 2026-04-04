#!/usr/bin/env bash
# ── Brand Pipeline Rollout Script ──
# Copies DB-driven brand template to a target Next.js project.
# Usage: ./rollout-brand.sh /path/to/project [full|legacy]
#
# Modes:
#   full   — Platform Products: copy brand.ts, check org_brand* tables, generate config.ts wrapper
#   legacy — Non-platform: copy brand.ts only (for getLegacyBrandConfig / future use)
#
# Does NOT overwrite existing files unless --force is passed as 3rd arg.

set -euo pipefail

TEMPLATES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/src"
PROJECT_DIR="${1:?Usage: rollout-brand.sh /path/to/project [full|legacy]}"
MODE="${2:-legacy}"
FORCE="${3:-}"

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

PROJECT_NAME=$(basename "$PROJECT_DIR")
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Brand Rollout ($MODE): ${PROJECT_NAME}${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"

MANUAL_TASKS=()

# ── Step 1: Copy brand.ts to src/lib/platform/ ──
header "Step 1: Copy platform/brand.ts"

mkdir -p "$PROJECT_DIR/src/lib/platform"

if [ -f "$PROJECT_DIR/src/lib/platform/brand.ts" ] && [ "$FORCE" != "--force" ]; then
  skip "src/lib/platform/brand.ts already exists"
else
  cp "$TEMPLATES_DIR/lib/platform/brand.ts" "$PROJECT_DIR/src/lib/platform/brand.ts"
  info "Copied brand.ts → src/lib/platform/brand.ts"
fi

if [ "$MODE" = "legacy" ]; then
  echo ""
  info "Legacy mode — brand.ts copied for getLegacyBrandConfig / future use. Done."
  echo ""
  exit 0
fi

# ── Full mode below ──

# ── Step 2: Check for org_brand* tables ──
header "Step 2: Check org_brand* tables"

HAS_BRAND_TABLES=false
if [ -d "$PROJECT_DIR/supabase/migrations" ]; then
  if grep -rl 'org_brand' "$PROJECT_DIR/supabase/migrations/" 2>/dev/null | head -1 > /dev/null 2>&1; then
    BRAND_MIGRATIONS=$(grep -rl 'org_brand' "$PROJECT_DIR/supabase/migrations/" 2>/dev/null | sort)
    echo "  Found org_brand* tables in migrations:"
    echo "$BRAND_MIGRATIONS" | sed 's/^/    /'
    HAS_BRAND_TABLES=true
  fi
fi

if [ "$HAS_BRAND_TABLES" = false ]; then
  warn "No org_brand* tables found in migrations"
  MANUAL_TASKS+=("Create migration for org_brand, org_brand_colors, org_brand_fonts, org_brand_assets tables")
  MANUAL_TASKS+=("Add RLS policies for org_brand* tables")
  MANUAL_TASKS+=("Seed brand data for the project's organization")
fi

# ── Step 3: Check for existing brand config ──
header "Step 3: Existing brand config scan"

EXISTING_BRAND=""
for f in src/lib/brand/config.ts src/lib/brand.ts src/config/brand.ts; do
  if [ -f "$PROJECT_DIR/$f" ]; then
    EXISTING_BRAND="$PROJECT_DIR/$f"
    echo "  Found existing brand config: $f"
    break
  fi
done

if [ -n "$EXISTING_BRAND" ]; then
  echo "  Checking if it already uses createBrandConfigFetcher..."
  if grep -q 'createBrandConfigFetcher' "$EXISTING_BRAND"; then
    info "Already using createBrandConfigFetcher — no migration needed"
  else
    echo "  Current pattern: direct DB queries"
    MANUAL_TASKS+=("Refactor $EXISTING_BRAND to use createBrandConfigFetcher from @/lib/platform/brand")
  fi
else
  # Generate a starter config.ts
  if [ ! -f "$PROJECT_DIR/src/lib/brand/config.ts" ]; then
    mkdir -p "$PROJECT_DIR/src/lib/brand"
    cat > "$PROJECT_DIR/src/lib/brand/config.ts" << 'CONFIGEOF'
import { createBrandConfigFetcher } from "@/lib/platform/brand";
import { createServiceClient } from "@/lib/supabase/server";

// TODO: Replace with your project's org ID from the organizations table
const BRAND_ORG_ID = "00000000-0000-0000-0000-000000000001";

export const { getBrandConfig, brandToCSS, brandFontsUrl } =
  createBrandConfigFetcher({
    createServiceClient,
    orgId: BRAND_ORG_ID,
    defaults: {
      tagline: "Your Product Tagline",
      industry: "Your Industry",
    },
  });
CONFIGEOF
    info "Generated starter src/lib/brand/config.ts"
    MANUAL_TASKS+=("Update BRAND_ORG_ID in src/lib/brand/config.ts with actual org UUID")
    MANUAL_TASKS+=("Update defaults (tagline, industry) in src/lib/brand/config.ts")
  fi
fi

# ── Step 4: Scan for old imports ──
header "Step 4: Scan for old brand imports"

OLD_IMPORTS=()
for pattern in 'getBrandConfig' 'getBrandCSSOverrides' 'isWhiteLabel' 'brandToCSS' 'brandFontsUrl'; do
  MATCHES=$(grep -rl "$pattern" "$PROJECT_DIR/src/" 2>/dev/null | grep -v 'node_modules' | grep -v 'lib/platform/brand.ts' | grep -v 'lib/brand/config.ts' || true)
  if [ -n "$MATCHES" ]; then
    while IFS= read -r match; do
      OLD_IMPORTS+=("$match ($pattern)")
    done <<< "$MATCHES"
  fi
done

if [ ${#OLD_IMPORTS[@]} -gt 0 ]; then
  echo "  Files importing brand functions (may need import path update):"
  for imp in "${OLD_IMPORTS[@]}"; do
    echo "    - $imp"
  done
  MANUAL_TASKS+=("Update brand import paths in ${#OLD_IMPORTS[@]} file(s) to use @/lib/brand/config")
else
  info "No old brand imports found"
fi

# ── Step 5: Check root layout wiring ──
header "Step 5: Root layout brand wiring"

LAYOUT_FILE=""
for f in src/app/layout.tsx src/app/layout.js; do
  if [ -f "$PROJECT_DIR/$f" ]; then
    LAYOUT_FILE="$PROJECT_DIR/$f"
    break
  fi
done

if [ -n "$LAYOUT_FILE" ]; then
  if grep -q 'getBrandConfig\|brandToCSS\|brandFontsUrl' "$LAYOUT_FILE"; then
    info "Root layout already references brand functions"
  else
    MANUAL_TASKS+=("Wire brand into root layout: getBrandConfig() → brandToCSS() in <style> + brandFontsUrl() in <link>")
  fi
else
  warn "No root layout found"
fi

# ── Summary ──
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Brand Summary ($MODE): ${PROJECT_NAME}${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

if [ ${#MANUAL_TASKS[@]} -gt 0 ]; then
  echo -e "${YELLOW}Manual tasks remaining:${NC}"
  for i in "${!MANUAL_TASKS[@]}"; do
    echo "  $((i+1)). ${MANUAL_TASKS[$i]}"
  done
else
  echo -e "${GREEN}No manual tasks — brand pipeline complete!${NC}"
fi
echo ""
