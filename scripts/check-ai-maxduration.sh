#!/usr/bin/env bash
# check-ai-maxduration.sh
# Verifies that no AI-calling route has maxDuration≤10.
#
# WHY: Vercel applies callbackWaitsForEmptyEventLoop=false when maxDuration≤10.
# For DB-only routes this is desirable (faster Lambda flush after response).
# For AI routes this is fatal — it removes Lambda from the streaming response
# path mid-stream, cutting off the response before the model finishes. ADR 82568b6e.
#
# DETECTION: any route file that imports from a known AI path AND declares maxDuration≤10.
# AI paths: @/lib/ai/naol, @nexusbluedev/core/ai, @nexusbluedev/core/quality,
#           executeAI, streamAI, streamText, generateText, analyzeImage, improveText
#
# Usage: bash scripts/check-ai-maxduration.sh
# Exit codes: 0=pass  1=fail

set -uo pipefail

API_DIR="src/app/api"

if [[ ! -d "$API_DIR" ]]; then
  echo "SKIP: $API_DIR not found"
  exit 0
fi

AI_PATTERNS="from '@/lib/ai/naol\|from '@nexusbluedev/core/ai\|from '@nexusbluedev/core/quality\|executeAI\|streamAI\|streamText\|generateText\|analyzeImage\|improveText"

FAIL=0

while IFS= read -r route_file; do
  [[ -z "$route_file" ]] && continue

  # Check if this route calls AI
  if ! grep -qE "from '@/lib/ai/naol|from '@nexusbluedev/core/ai|from '@nexusbluedev/core/quality|executeAI|streamAI|streamText|generateText|analyzeImage|improveText" "$route_file" 2>/dev/null; then
    continue
  fi

  # Check for maxDuration ≤ 10
  if grep -qE "export const maxDuration = [0-9]+;" "$route_file" 2>/dev/null; then
    duration=$(grep -oE "maxDuration = [0-9]+" "$route_file" | head -1 | grep -oE "[0-9]+")
    if [[ -n "$duration" && "$duration" -le 10 ]]; then
      echo "FAIL: $route_file"
      echo "      maxDuration=$duration — AI routes must be ≥30"
      echo "      maxDuration≤10 causes Vercel to apply callbackWaitsForEmptyEventLoop=false,"
      echo "      which removes Lambda from the streaming response path mid-stream. ADR 82568b6e."
      FAIL=1
    else
      echo "PASS: $route_file (maxDuration=$duration)"
    fi
  fi
done < <(find "$API_DIR" -name "route.ts" -o -name "route.tsx" 2>/dev/null)

echo ""
if [[ "$FAIL" -eq 1 ]]; then
  echo "AI maxDuration check FAILED — restore affected routes to maxDuration=30 or higher. ADR 82568b6e."
  exit 1
fi

echo "AI maxDuration check PASSED."
exit 0
