#!/usr/bin/env bash
# ── Rollout Orchestrator ──
# Runs hardening + brand rollout across all active Next.js projects.
# Usage: ./rollout.sh [project-name]  — run on one project
#        ./rollout.sh --all            — run on all projects
#        ./rollout.sh --status         — show rollout status for all projects
#
# Projects and their brand mode are defined in the PROJECTS array below.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="$HOME/dev"

# ── Project Registry ──
# Format: "project_dir:brand_mode"
# brand_mode: full (Platform Product) | legacy (non-platform)
declare -A PROJECTS=(
  ["1application"]="full"
  ["akguys-platform"]="full"
  ["setup-copilot"]="skip"
  ["pet_scheduler"]="full"
  ["pw-app"]="full"
  ["cain-website-022026"]="legacy"
  ["cnc-platform"]="legacy"
  ["mcpc-website"]="legacy"
  ["nexusblue-forgeai"]="legacy"
  ["adamhs-impact-demo"]="legacy"
)

# Priority order (execute in this sequence)
PRIORITY_ORDER=(
  "1application"
  "akguys-platform"
  "setup-copilot"
  "pet_scheduler"
  "pw-app"
  "cain-website-022026"
  "cnc-platform"
  "mcpc-website"
  "nexusblue-forgeai"
  "adamhs-impact-demo"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Status Check ──
show_status() {
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  Hardening + Brand Rollout Status                           ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  printf "%-22s %-6s %-6s %-6s %-6s %-6s %-8s\n" "Project" "pino" "logger" "rfetch" "errbd" "envval" "brand"
  printf "%-22s %-6s %-6s %-6s %-6s %-6s %-8s\n" "───────────────────" "────" "──────" "──────" "─────" "──────" "──────"

  for proj in "${PRIORITY_ORDER[@]}"; do
    local dir="$DEV_DIR/$proj"
    local brand_mode="${PROJECTS[$proj]}"

    if [ ! -d "$dir" ]; then
      printf "%-22s ${RED}NOT FOUND${NC}\n" "$proj"
      continue
    fi

    # Check each file
    local has_pino="--"
    local has_logger="--"
    local has_rfetch="--"
    local has_errbd="--"
    local has_envval="--"
    local has_brand="--"

    grep -q '"pino"' "$dir/package.json" 2>/dev/null && has_pino="${GREEN}OK${NC}"
    [ -f "$dir/src/lib/logger.ts" ] && has_logger="${GREEN}OK${NC}"
    [ -f "$dir/src/lib/resilient-fetch.ts" ] && has_rfetch="${GREEN}OK${NC}"
    [ -f "$dir/src/components/error-boundary.tsx" ] && has_errbd="${GREEN}OK${NC}"
    [ -f "$dir/src/lib/env-validation.ts" ] && has_envval="${GREEN}OK${NC}"

    if [ "$brand_mode" = "skip" ]; then
      has_brand="${CYAN}skip${NC}"
    elif [ -f "$dir/src/lib/platform/brand.ts" ]; then
      has_brand="${GREEN}OK${NC}"
    fi

    printf "%-22s %-15b %-15b %-15b %-15b %-15b %-17b\n" "$proj" "$has_pino" "$has_logger" "$has_rfetch" "$has_errbd" "$has_envval" "$has_brand"
  done
  echo ""
}

# ── Run on single project ──
run_project() {
  local proj="$1"
  local dir="$DEV_DIR/$proj"
  local brand_mode="${PROJECTS[$proj]:-legacy}"

  if [ ! -d "$dir" ]; then
    echo -e "${RED}Project not found: $dir${NC}"
    return 1
  fi

  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  Rolling out: $proj (brand: $brand_mode)${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Hardening
  bash "$SCRIPT_DIR/rollout-hardening.sh" "$dir"

  # Brand
  if [ "$brand_mode" != "skip" ]; then
    bash "$SCRIPT_DIR/rollout-brand.sh" "$dir" "$brand_mode"
  else
    echo -e "\n${CYAN}[SKIP]${NC} Brand rollout skipped for $proj"
  fi
}

# ── Main ──
ARG="${1:-}"

case "$ARG" in
  --status)
    show_status
    ;;
  --all)
    for proj in "${PRIORITY_ORDER[@]}"; do
      run_project "$proj"
    done
    echo ""
    show_status
    ;;
  "")
    echo "Usage: rollout.sh [project-name|--all|--status]"
    echo ""
    echo "Projects:"
    for proj in "${PRIORITY_ORDER[@]}"; do
      echo "  $proj (brand: ${PROJECTS[$proj]})"
    done
    ;;
  *)
    if [[ -v "PROJECTS[$ARG]" ]]; then
      run_project "$ARG"
    else
      echo -e "${RED}Unknown project: $ARG${NC}"
      echo "Valid projects: ${PRIORITY_ORDER[*]}"
      exit 1
    fi
    ;;
esac
