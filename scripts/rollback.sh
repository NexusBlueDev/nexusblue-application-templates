#!/bin/bash
# rollback.sh — Promote the previous Vercel production deployment
#
# Usage: ./scripts/rollback.sh
#
# Finds the second-most-recent READY production deployment and promotes it.
# Requires VERCEL_TOKEN in .env.local or environment.

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-$(grep '^VERCEL_TOKEN=' .env.local 2>/dev/null | cut -d= -f2-)}"
TEAM_ID="team_hWt6xTS7kGfR781smAzdmvzV"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "Error: VERCEL_TOKEN not found in env or .env.local"
  exit 1
fi

# Read project name from package.json
PROJECT_NAME=$(python3 -c "import json; print(json.load(open('package.json'))['name'])" 2>/dev/null)
if [ -z "$PROJECT_NAME" ]; then
  echo "Error: Could not read project name from package.json"
  exit 1
fi

echo "Project: $PROJECT_NAME"
echo "Fetching recent production deployments..."

# Get the 5 most recent production deployments
DEPLOYMENTS=$(curl -s "https://api.vercel.com/v6/deployments?teamId=$TEAM_ID&projectId=$PROJECT_NAME&target=production&state=READY&limit=5" \
  -H "Authorization: Bearer $VERCEL_TOKEN")

# Parse deployment list
DEPLOY_INFO=$(echo "$DEPLOYMENTS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
deps = data.get('deployments', [])
if len(deps) < 2:
    print('ERROR:Not enough deployments to rollback (need at least 2)')
    sys.exit(0)
print(f'CURRENT:{deps[0][\"uid\"]}:{deps[0].get(\"url\",\"?\")}')
print(f'ROLLBACK:{deps[1][\"uid\"]}:{deps[1].get(\"url\",\"?\")}')
" 2>/dev/null)

if echo "$DEPLOY_INFO" | grep -q "^ERROR:"; then
  echo "$DEPLOY_INFO" | sed 's/^ERROR://'
  exit 1
fi

CURRENT_ID=$(echo "$DEPLOY_INFO" | grep "^CURRENT:" | cut -d: -f2)
CURRENT_URL=$(echo "$DEPLOY_INFO" | grep "^CURRENT:" | cut -d: -f3-)
ROLLBACK_ID=$(echo "$DEPLOY_INFO" | grep "^ROLLBACK:" | cut -d: -f2)
ROLLBACK_URL=$(echo "$DEPLOY_INFO" | grep "^ROLLBACK:" | cut -d: -f3-)

echo ""
echo "Current production:  $CURRENT_URL ($CURRENT_ID)"
echo "Rolling back to:     $ROLLBACK_URL ($ROLLBACK_ID)"
echo ""
echo "Press Ctrl+C within 5 seconds to abort..."
sleep 5

# Promote the previous deployment to production
echo "Promoting $ROLLBACK_ID to production..."
RESPONSE=$(curl -s -X POST "https://api.vercel.com/v13/deployments/$ROLLBACK_ID/promote?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json")

STATUS=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'error' in data:
    print(f'ERROR: {data[\"error\"].get(\"message\", \"Unknown error\")}')
else:
    print('OK')
" 2>/dev/null)

if echo "$STATUS" | grep -q "^ERROR"; then
  echo "$STATUS"
  echo "Rollback failed. Full response:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo "Rollback successful! $ROLLBACK_URL is now production."
