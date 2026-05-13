#!/usr/bin/env bash
# Platform Standard: Supabase Type Drift Check
# Calls the Supabase Management API to generate fresh TypeScript types and diffs
# them against the committed src/types/supabase.ts baseline.
# No Supabase CLI required — uses curl + python3 (available on all CI runners).
#
# Requires: SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_ID env vars
# Skips gracefully when either is not provisioned.
#
# Project setup (one-time):
#   1. Create a PAT: supabase.com/dashboard/account/tokens
#   2. Vault it:   bash ~/scripts/vault-set.sh <project-slug> SUPABASE_ACCESS_TOKEN <token>
#   3. Add to GitHub Secrets: gh secret set SUPABASE_ACCESS_TOKEN --body <token>
#   4. Set SUPABASE_PROJECT_ID in ci.yml env block (e.g. "lbmxueowhpecoqlyhdcs")
#   5. Generate baseline:
#      SUPABASE_ACCESS_TOKEN=<token> SUPABASE_PROJECT_ID=<ref> \
#        bash scripts/check-types-drift.sh --regenerate
#      git add src/types/supabase.ts && git commit -m "chore(types): add Supabase types baseline"
#
# Ported from nexusblue-website (Session 26, 2026-05-13).

set -euo pipefail

TYPES_FILE="src/types/supabase.ts"

if [ "${1:-}" = "--regenerate" ]; then
  if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] || [ -z "${SUPABASE_PROJECT_ID:-}" ]; then
    echo "Error: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID are required for --regenerate"
    exit 1
  fi
  echo "Regenerating $TYPES_FILE from project $SUPABASE_PROJECT_ID..."
  curl -sf "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/types/typescript" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['types'], end='')" \
    > "$TYPES_FILE"
  echo "Regenerated $TYPES_FILE ($(wc -l < "$TYPES_FILE") lines)"
  echo "Commit: git add $TYPES_FILE && git commit -m 'chore(types): regenerate Supabase types'"
  exit 0
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] || [ -z "${SUPABASE_PROJECT_ID:-}" ]; then
  echo "::warning::SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_ID not set — type drift check skipped"
  echo "See scripts/check-types-drift.sh header for activation instructions."
  exit 0
fi

if [ ! -f "$TYPES_FILE" ]; then
  echo "::error::$TYPES_FILE is missing. Generate the baseline:"
  echo "  SUPABASE_ACCESS_TOKEN=<token> SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID bash scripts/check-types-drift.sh --regenerate"
  exit 1
fi

echo "Fetching types from project $SUPABASE_PROJECT_ID..."
RESPONSE=$(curl -sf "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/types/typescript" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" 2>&1)

if ! echo "$RESPONSE" | python3 -c "import sys,json; json.load(sys.stdin)" &>/dev/null; then
  echo "::error::Supabase Management API call failed:"
  echo "$RESPONSE"
  exit 1
fi

GENERATED=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['types'], end='')")
COMMITTED=$(cat "$TYPES_FILE")

if [ "$GENERATED" = "$COMMITTED" ]; then
  echo "Supabase types are up to date — no drift detected"
  exit 0
fi

echo "::error::Supabase schema/types are out of sync!"
echo ""
echo "Regenerate: SUPABASE_ACCESS_TOKEN=\$SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID bash scripts/check-types-drift.sh --regenerate"
echo "  git add $TYPES_FILE && git commit -m 'chore(types): regenerate Supabase types'"
echo ""
echo "--- Diff (first 50 lines) ---"
diff <(echo "$GENERATED") "$TYPES_FILE" | head -50 || true
exit 1
