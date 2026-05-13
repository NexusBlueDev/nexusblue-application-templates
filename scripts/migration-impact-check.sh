#!/bin/bash
# migration-impact-check.sh — Platform Standard (NexusBlue Core)
#
# Scans new/modified migration files for destructive SQL operations and checks
# whether application code still references the dropped object.
#
# Catches the failure mode: "migration drops a table/FK/column → app code breaks
# silently at runtime" — which has caused repeated regressions across the platform.
#
# DROP TABLE, DROP CONSTRAINT, DROP VIEW → search src/ for string references
# ALTER TABLE ... DROP COLUMN → search src/ for column name references
#
# Usage:
#   bash scripts/migration-impact-check.sh              # auto-detects changed migrations
#   bash scripts/migration-impact-check.sh path/to.sql  # check a specific file
#
# In CI: automatically detects files changed vs origin/main.
# Locally (pre-push): detects files changed vs HEAD~1.
#
# Exit 0 → clean  |  Exit 1 → dead references found (blocks commit)

set -uo pipefail

MIGRATION_DIR="supabase/migrations"
SRC_DIR="src"
ISSUES=0

# ── Determine which migration files to scan ──────────────────────────────────

if [ -n "${1:-}" ] && [ -f "${1:-}" ]; then
  CHANGED=$(echo "$1")
elif [ -n "${GITHUB_BASE_REF:-}" ]; then
  # GitHub Actions: diff against the target branch
  git fetch origin "${GITHUB_BASE_REF}" --depth=1 2>/dev/null || true
  CHANGED=$(git diff --name-only "origin/${GITHUB_BASE_REF}" HEAD 2>/dev/null \
    | grep "^${MIGRATION_DIR}/" || true)
else
  # Local: diff against parent commit
  CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null \
    | grep "^${MIGRATION_DIR}/" || true)
fi

if [ -z "$CHANGED" ]; then
  echo "✓ No migration files changed — skipping impact check."
  exit 0
fi

FILE_COUNT=$(echo "$CHANGED" | wc -l | tr -d ' ')
echo "Migration Impact Check — scanning ${FILE_COUNT} migration file(s)"
echo ""

# ── Helper: search src/ for a term ───────────────────────────────────────────

find_refs() {
  local term="$1"
  # Search .ts/.tsx files for the term as a quoted string or identifier
  grep -rn \
    --include="*.ts" --include="*.tsx" \
    -e "\"${term}\"" \
    -e "'${term}'" \
    -e "\`${term}\`" \
    -e "!${term}" \
    "$SRC_DIR" 2>/dev/null \
    | grep -v "node_modules" \
    | grep -v "__tests__" \
    | grep -v "\.test\." \
    | grep -v "\.spec\." \
    || true
}

# ── Scan each changed migration ───────────────────────────────────────────────

for mig in $CHANGED; do
  [ -f "$mig" ] || continue
  echo "▶ $(basename "$mig")"

  # ── DROP TABLE ────────────────────────────────────────────────────────────
  while IFS= read -r tname; do
    [ -z "$tname" ] && continue
    refs=$(find_refs "$tname")
    if [ -n "$refs" ]; then
      echo "  ⚠️  DROP TABLE '${tname}' — code still references this table:"
      echo "$refs" | sed 's/^/      /'
      ISSUES=$((ISSUES + 1))
    else
      echo "  ✓  DROP TABLE '${tname}' — no live references"
    fi
  done < <(
    grep -i "DROP TABLE" "$mig" \
      | sed -E 's/.*DROP TABLE\s+(IF EXISTS\s+)?(public\.)?([a-zA-Z_][a-zA-Z0-9_]*).*/\3/i' \
      | grep -v "^$" || true
  )

  # ── DROP VIEW ────────────────────────────────────────────────────────────
  while IFS= read -r vname; do
    [ -z "$vname" ] && continue
    refs=$(find_refs "$vname")
    if [ -n "$refs" ]; then
      echo "  ⚠️  DROP VIEW '${vname}' — code still references this view:"
      echo "$refs" | sed 's/^/      /'
      ISSUES=$((ISSUES + 1))
    else
      echo "  ✓  DROP VIEW '${vname}' — no live references"
    fi
  done < <(
    grep -i "DROP VIEW" "$mig" \
      | sed -E 's/.*DROP VIEW\s+(IF EXISTS\s+)?(public\.)?([a-zA-Z_][a-zA-Z0-9_]*).*/\3/i' \
      | grep -v "^$" || true
  )

  # ── DROP CONSTRAINT ───────────────────────────────────────────────────────
  # Skip if the same migration re-adds the constraint (drop-then-recreate pattern)
  while IFS= read -r cname; do
    [ -z "$cname" ] && continue
    # If the migration also contains ADD CONSTRAINT with the same name, it's a recreate — skip
    if grep -qi "ADD CONSTRAINT\s*${cname}" "$mig" 2>/dev/null; then
      echo "  ✓  DROP CONSTRAINT '${cname}' — recreated in same migration (skip)"
      continue
    fi
    refs=$(find_refs "$cname")
    if [ -n "$refs" ]; then
      echo "  ⚠️  DROP CONSTRAINT '${cname}' — code still references this FK/constraint:"
      echo "$refs" | sed 's/^/      /'
      ISSUES=$((ISSUES + 1))
    else
      echo "  ✓  DROP CONSTRAINT '${cname}' — no live references"
    fi
  done < <(
    grep -i "DROP CONSTRAINT" "$mig" \
      | sed -E 's/.*DROP CONSTRAINT\s+(IF EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*).*/\2/i' \
      | grep -v "^$" || true
  )

  # ── ALTER TABLE ... DROP COLUMN ───────────────────────────────────────────
  while IFS= read -r colinfo; do
    [ -z "$colinfo" ] && continue
    colname=$(echo "$colinfo" | awk '{print $NF}')
    [ -z "$colname" ] && continue
    refs=$(find_refs "$colname")
    if [ -n "$refs" ]; then
      echo "  ⚠️  DROP COLUMN '${colname}' — code may still reference this column:"
      echo "$refs" | sed 's/^/      /'
      ISSUES=$((ISSUES + 1))
    else
      echo "  ✓  DROP COLUMN '${colname}' — no live references"
    fi
  done < <(
    grep -i "DROP COLUMN" "$mig" \
      | sed -E 's/.*DROP COLUMN\s+(IF EXISTS\s+)?([a-zA-Z_][a-zA-Z0-9_]*).*/\2/i' \
      | grep -v "^$" || true
  )

  echo ""
done

# ── Result ────────────────────────────────────────────────────────────────────

if [ "$ISSUES" -gt 0 ]; then
  echo "──────────────────────────────────────────────────────────────────"
  echo "IMPACT CHECK FAILED — ${ISSUES} dropped DB object(s) still referenced in src/"
  echo ""
  echo "Fix: update application code to remove or remap the references,"
  echo "then re-run this check. Do NOT suppress the check — dead references"
  echo "cause silent runtime failures."
  echo "──────────────────────────────────────────────────────────────────"
  exit 1
fi

echo "✓ Migration impact check passed — no dangling code references found."
exit 0
