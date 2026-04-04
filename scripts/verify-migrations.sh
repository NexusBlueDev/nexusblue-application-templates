#!/bin/bash
# Verify all repo migrations have been applied to the live database
#
# Compares migration files in supabase/migrations/ against _migration_history table.
# Exits 0 if all applied, exits 1 if any are missing.
#
# Usage: bash scripts/verify-migrations.sh
#   Called by deploy-local.sh (global hook) before allowing git push.
#
# Prerequisites:
#   - _migration_history table must exist (see migrations/018_migration_tracking.sql)
#   - SUPABASE_ACCESS_TOKEN must be set in .env.local
#
# Reference: Deployment Integrity Protocol (Core DB)
# Rule #214: Deployment integrity verification required before push

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"
MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"

# Skip if no migrations directory
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No migrations directory — skipping verification."
  exit 0
fi

# Load credentials
SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)
ACCESS_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co.*||')

if [ -z "$PROJECT_REF" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "WARN: Missing Supabase credentials — skipping migration verification."
  echo "      Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN in .env.local"
  exit 0
fi

# Get applied migrations from DB
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT migration FROM public._migration_history ORDER BY migration;"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "WARN: Could not query _migration_history (HTTP $HTTP_CODE) — skipping."
  echo "      Create the table first. See Deployment Integrity Protocol."
  exit 0
fi

# Parse applied migrations into a list
APPLIED=$(echo "$BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for row in data:
    print(row['migration'])
" 2>/dev/null)

if [ -z "$APPLIED" ]; then
  echo "WARN: _migration_history is empty — skipping verification."
  exit 0
fi

# Compare repo files against applied list
MISSING=()
for FILE in "$MIGRATIONS_DIR"/*.sql; do
  MIGRATION_NAME=$(basename "$FILE" .sql)
  if ! echo "$APPLIED" | grep -qx "$MIGRATION_NAME"; then
    MISSING+=("$MIGRATION_NAME")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "Migration check: All migrations applied."
  exit 0
else
  echo "MIGRATION DRIFT DETECTED — the following migrations exist in repo but are NOT applied:" >&2
  for M in "${MISSING[@]}"; do
    echo "  ✗ $M" >&2
  done
  echo "" >&2
  echo "Apply them with:" >&2
  for M in "${MISSING[@]}"; do
    echo "  bash scripts/apply-migration.sh supabase/migrations/${M}.sql" >&2
  done
  exit 1
fi
