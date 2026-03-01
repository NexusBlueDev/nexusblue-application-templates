#!/bin/bash
# Apply pending SQL migrations to a Supabase project via psql.
#
# Usage: ./scripts/apply-migrations.sh <migration_file> [migration_file2 ...]
#   or:  ./scripts/apply-migrations.sh supabase/migrations/033_*.sql supabase/migrations/034_*.sql
#
# Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD in .env.local
# The script constructs a pooler connection string from the Supabase project URL.
#
# Note: Run from the project root directory.

set -e

if [ $# -eq 0 ]; then
  echo "Usage: $0 <migration_file> [migration_file2 ...]"
  echo "Example: $0 supabase/migrations/033_appvault_rpc.sql"
  exit 1
fi

# Load env vars
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local 2>/dev/null | cut -d= -f2-)}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-$(grep '^SUPABASE_DB_PASSWORD=' .env.local 2>/dev/null | cut -d= -f2-)}"

if [ -z "$SUPABASE_URL" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL not found in env or .env.local"
  exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "Error: SUPABASE_DB_PASSWORD not found in env or .env.local"
  echo ""
  echo "Get your database password from:"
  echo "  Supabase Dashboard → Project Settings → Database → Connection string"
  echo ""
  echo "Add to .env.local:"
  echo "  SUPABASE_DB_PASSWORD=your-password-here"
  exit 1
fi

# Extract project ref from Supabase URL (e.g., https://abcdef.supabase.co → abcdef)
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co.*||')

if [ -z "$PROJECT_REF" ]; then
  echo "Error: Could not extract project ref from URL: $SUPABASE_URL"
  exit 1
fi

# Construct pooler connection string (transaction mode, port 6543)
CONN_STRING="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo ""
echo "Target: $SUPABASE_URL (ref: $PROJECT_REF)"
echo "Files to apply:"
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "  ERROR: $f does not exist"
    exit 1
  fi
  echo "  - $f"
done
echo ""
echo "Press Ctrl+C within 5 seconds to abort..."
sleep 5

# Apply each migration in order
for f in "$@"; do
  echo ""
  echo "=== Applying: $f ==="
  if psql "$CONN_STRING" -f "$f" 2>&1; then
    echo "  ✓ Applied successfully"
  else
    echo "  ✗ FAILED — stopping. Fix the issue and re-run from this migration."
    exit 1
  fi
done

echo ""
echo "=== All migrations applied successfully ==="
