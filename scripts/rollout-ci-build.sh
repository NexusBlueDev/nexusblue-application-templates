#!/usr/bin/env bash
# ── Rollout: CI Build Verification ──
# Adds a "Build (env stubs)" job to .github/workflows/ci.yml in each project.
# Catches createServiceClient() at build time by intentionally omitting SUPABASE_SERVICE_ROLE_KEY.
# Vercel has real keys so it would silently succeed there — stub keys make it fail in CI.
#
# Usage: ./rollout-ci-build.sh [project-name]
#        ./rollout-ci-build.sh --all
#        ./rollout-ci-build.sh --status

set -euo pipefail

DEV_DIR="$HOME/dev"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Project Registry ──
# Format: "needs_npm_token"
declare -A PROJECTS=(
  ["1application"]="yes"
  ["akguys-platform"]="yes"
  ["setup-copilot"]="no"
  ["pet_scheduler"]="no"
  ["pw-app"]="yes"
  ["cain-website-022026"]="yes"
  ["cnc-platform"]="no"
  ["mcpc-website"]="yes"
  ["nexusblue-forgeai"]="no"
  ["adamhs-impact-demo"]="no"
)

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

COMMIT_MSG="ci: add build verification with env stubs"

# ── Generate build job env block per project ──
# Stubs all NEXT_PUBLIC_* vars the build needs.
# Intentionally omits SUPABASE_SERVICE_ROLE_KEY to catch createServiceClient() at build time.
get_env_block() {
  local proj="$1"

  # Common base
  local env=""
  env+="          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co\n"
  env+="          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder"

  case "$proj" in
    pet_scheduler)
      env+="\n          NEXT_PUBLIC_APP_NAME: placeholder"
      env+="\n          NEXT_PUBLIC_APP_URL: https://placeholder.app"
      env+="\n          NEXT_PUBLIC_SITE_URL: https://placeholder.app"
      ;;
    cnc-platform|mcpc-website)
      env+="\n          NEXT_PUBLIC_SITE_URL: https://placeholder.app"
      ;;
    nexusblue-forgeai|setup-copilot)
      env+="\n          NEXT_PUBLIC_CORE_SUPABASE_URL: https://placeholder.supabase.co"
      env+="\n          NEXT_PUBLIC_CORE_SUPABASE_ANON_KEY: placeholder"
      ;;
  esac

  echo -e "$env"
}

# ── Find the quality/lint job name in a CI file ──
# Projects may name it "quality" or "lint-typecheck-test" etc.
get_quality_job_name() {
  local ci_file="$1"
  # First job under jobs: is the quality gate
  awk '/^jobs:/ { injobs=1; next } injobs && /^  [a-zA-Z_-]+:/ { gsub(/:.*/, ""); gsub(/^  /, ""); print; exit }' "$ci_file"
}

# ── Generate the full build job YAML block ──
generate_build_job() {
  local proj="$1"
  local quality_name="$2"
  local needs_npm="${PROJECTS[$proj]}"
  local env_block
  env_block="$(get_env_block "$proj")"

  local npm_env=""
  if [ "$needs_npm" = "yes" ]; then
    npm_env=$'\n        env:\n          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}'
  fi

  cat <<EOF

  # -----------------------------------------------
  # Build Verification (env stubs)
  # Catches createServiceClient() at build time — Vercel has real keys
  # so it would silently succeed there. Stub keys make it fail here.
  # Intentionally omits SUPABASE_SERVICE_ROLE_KEY.
  # -----------------------------------------------
  build:
    name: Build (env stubs)
    needs: ${quality_name}
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci${npm_env}

      - name: Build with stub env vars
        run: npm run build
        env:
          NODE_OPTIONS: --max-old-space-size=4096
${env_block}
EOF
}

# ── Check if project already has a build job ──
has_build_job() {
  local ci_file="$1"
  # Match a top-level job named "build:" (2-space indent under jobs:)
  grep -qE "^  build:" "$ci_file" 2>/dev/null
}

# ── Find insertion point (line number of the job after quality, or 0 for append) ──
find_insert_line() {
  local ci_file="$1"
  local quality_name="$2"
  local quality_line
  quality_line=$(grep -n "^  ${quality_name}:" "$ci_file" | head -1 | cut -d: -f1)

  if [ -z "$quality_line" ]; then
    echo ""
    return
  fi

  # Find the next top-level job definition after quality
  local next_job
  next_job=$(awk -v start="$quality_line" '
    NR > start + 1 && /^  [a-zA-Z_-]+:/ { print NR; exit }
  ' "$ci_file")

  if [ -n "$next_job" ]; then
    echo "$next_job"
  else
    # No job after quality — append to end of file
    echo "0"
  fi
}

# ── Status Check ──
show_status() {
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  CI Build Job Rollout Status                                ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  printf "%-24s %-10s %-10s %-10s\n" "Project" "CI file" "Build job" "NPM_TOKEN"
  printf "%-24s %-10s %-10s %-10s\n" "───────────────────────" "────────" "─────────" "─────────"

  for proj in "${PRIORITY_ORDER[@]}"; do
    local dir="$DEV_DIR/$proj"
    local ci_file="$dir/.github/workflows/ci.yml"
    local needs_npm="${PROJECTS[$proj]}"

    local has_ci="--"
    local has_build="--"
    local npm_col="--"

    if [ ! -d "$dir" ]; then
      printf "%-24s ${RED}NOT FOUND${NC}\n" "$proj"
      continue
    fi

    if [ -f "$ci_file" ]; then
      has_ci="${GREEN}yes${NC}"
      if has_build_job "$ci_file"; then
        has_build="${GREEN}yes${NC}"
      else
        has_build="${YELLOW}no${NC}"
      fi
    else
      has_ci="${RED}no${NC}"
      has_build="${RED}n/a${NC}"
    fi

    if [ "$needs_npm" = "yes" ]; then
      npm_col="${CYAN}yes${NC}"
    else
      npm_col="no"
    fi

    printf "%-24s %-19b %-19b %-19b\n" "$proj" "$has_ci" "$has_build" "$npm_col"
  done
  echo ""
}

# ── Run on single project ──
run_project() {
  local proj="$1"
  local dir="$DEV_DIR/$proj"
  local ci_file="$dir/.github/workflows/ci.yml"

  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  CI Build: $proj${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Validate project exists
  if [ ! -d "$dir" ]; then
    echo -e "  ${RED}[SKIP]${NC} Project directory not found: $dir"
    return 0
  fi

  # Validate CI file exists
  if [ ! -f "$ci_file" ]; then
    echo -e "  ${RED}[SKIP]${NC} No CI workflow found: $ci_file"
    return 0
  fi

  # Check if build job already exists
  if has_build_job "$ci_file"; then
    echo -e "  ${GREEN}[SKIP]${NC} Build job already exists"
    return 0
  fi

  # Find the quality job name (may be "quality" or "lint-typecheck-test" etc.)
  local quality_name
  quality_name=$(get_quality_job_name "$ci_file")

  if [ -z "$quality_name" ]; then
    echo -e "  ${RED}[ERROR]${NC} Could not find any job under jobs:"
    return 1
  fi

  echo -e "  ${CYAN}[INFO]${NC} Quality job name: $quality_name"

  # Find insertion point
  local insert_line
  insert_line=$(find_insert_line "$ci_file" "$quality_name")

  if [ -z "$insert_line" ]; then
    echo -e "  ${RED}[ERROR]${NC} Could not find quality job in CI file"
    return 1
  fi

  # Generate the build job YAML
  local build_yaml
  build_yaml="$(generate_build_job "$proj" "$quality_name")"

  # Insert: split file at insertion point, or append to end
  local tmp_file
  tmp_file=$(mktemp)
  if [ "$insert_line" = "0" ]; then
    echo -e "  ${CYAN}[INFO]${NC} Appending build job to end of file"
    cat "$ci_file" > "$tmp_file"
    echo "$build_yaml" >> "$tmp_file"
  else
    echo -e "  ${CYAN}[INFO]${NC} Inserting build job before line $insert_line"
    head -n $((insert_line - 1)) "$ci_file" > "$tmp_file"
    echo "$build_yaml" >> "$tmp_file"
    tail -n +$((insert_line)) "$ci_file" >> "$tmp_file"
  fi
  mv "$tmp_file" "$ci_file"

  echo -e "  ${GREEN}[OK]${NC} Build job added to ci.yml"

  # Commit and push
  pushd "$dir" > /dev/null
  git add .github/workflows/ci.yml
  git commit -m "$COMMIT_MSG" --quiet
  echo -e "  ${GREEN}[OK]${NC} Committed: $COMMIT_MSG"

  git push --quiet
  echo -e "  ${GREEN}[OK]${NC} Pushed to remote"
  popd > /dev/null
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
    echo "Usage: rollout-ci-build.sh [project-name|--all|--status]"
    echo ""
    echo "Projects:"
    for proj in "${PRIORITY_ORDER[@]}"; do
      echo "  $proj (npm_token: ${PROJECTS[$proj]})"
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
