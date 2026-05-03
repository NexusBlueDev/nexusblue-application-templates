#!/bin/bash
# autonomous-first-gate.sh — PreToolUse hook on Bash
#
# GATE: Before pushing a setup_blocker or setup_need, verify an autonomous
# attempt was made in this session (vault lookup, API call, CLI check, file read).
#
# Rule #944f268c — Autonomous-First: attempt verification before human escalation
# Operating Contract §0 — attempt before escalating
#
# When triggered:
#   - Command contains a blocker/need INSERT toward setup_blockers or setup_needs
# What it checks:
#   - Session ledger for evidence of autonomous attempts (curl/vault-get/gh/api. patterns)
#   - If no evidence found → emits blocking message with remediation map
# Exit codes:
#   - 0 = proceed (evidence found or not a blocker push)
#   - 2 = BLOCK (blocker push with no autonomous evidence)

set -o pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)

[ -z "$COMMAND" ] && exit 0

# --- Fast-path: is this a blocker/need push? ---
IS_BLOCKER_PUSH=false
case "$COMMAND" in
  *"setup_blockers"*) IS_BLOCKER_PUSH=true ;;
  *"setup_needs"*"INSERT"*|*"setup_needs"*"Prefer"*) IS_BLOCKER_PUSH=true ;;
  *"/blockers"*) IS_BLOCKER_PUSH=true ;;
  *"/needs"*"-X POST"*|*"POST"*"/needs"*) IS_BLOCKER_PUSH=true ;;
  *"push_blocker"*|*"push_need"*) IS_BLOCKER_PUSH=true ;;
esac

# Exclude read-only operations on these tables
case "$COMMAND" in
  *"setup_blockers"*"select"*|*"setup_blockers"*"GET"*|*"GET"*"/blockers"*)
    IS_BLOCKER_PUSH=false ;;
esac

[ "$IS_BLOCKER_PUSH" = "false" ] && exit 0

# --- Find session ledger ---
PROJECT_ROOT="$CWD"
while [ "$PROJECT_ROOT" != "/" ] && [ "$PROJECT_ROOT" != "/home/nexusblue" ]; do
  [ -d "$PROJECT_ROOT/.git" ] && break
  PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

ESCAPED=$(echo "$PROJECT_ROOT" | sed 's|/|-|g')
LEDGER="$HOME/.claude/projects/${ESCAPED}/memory/session-ledger.md"

# --- Check for autonomous attempt evidence in ledger ---
AUTONOMOUS_EVIDENCE=false
if [ -f "$LEDGER" ]; then
  # Look for evidence in last 200 lines: vault-get, API calls, CLI checks, DB queries
  RECENT=$(tail -200 "$LEDGER" 2>/dev/null)
  if echo "$RECENT" | grep -qiE 'vault.?get|api\.trigger\.dev|supabase\.co/rest|gh (pr|issue|run)|npm view|git log|curl.*api\.|\.env\.local|AUTH.*Bearer|TRIGGER.*KEY|ANTHROPIC.*KEY'; then
    AUTONOMOUS_EVIDENCE=true
  fi
fi

if [ "$AUTONOMOUS_EVIDENCE" = "true" ]; then
  exit 0
fi

# --- No autonomous evidence found — BLOCK with remediation ---
MSG="AUTONOMOUS-FIRST GATE (Rule #944f268c): Blocker push detected but no autonomous verification found this session."
DETAIL="Before pushing this blocker to setup_needs/setup_blockers, YOU MUST first attempt autonomous resolution.

Operating Contract §0 standing order: attempt before escalating.

FAST LOOKUP — try these first:
  vault:       bash ~/scripts/vault-get.sh {project-slug} {KEY_NAME}
  trigger.dev: curl https://api.trigger.dev/api/v1/runs -H 'Authorization: Bearer \$(vault-get.sh platform-intelligence TRIGGER_PROD_SECRET_KEY)'
  core DB:     curl https://iezojzzfhilbsrkjujjr.supabase.co/rest/v1/{table} ...
  github:      gh pr list / gh run list / git log
  files/logs:  Read tool or Bash cat/grep directly

Full map: ~/dev/nexusblue-core/docs/autonomous-capabilities-map.md

Only push a blocker AFTER you have tried and confirmed you are genuinely blocked.
If you already tried and this block is wrong, set AUTONOMOUS_FIRST_OVERRIDE=1 in your command."

# Allow override escape hatch
if echo "$COMMAND" | grep -q "AUTONOMOUS_FIRST_OVERRIDE=1"; then
  exit 0
fi

MSG_JSON=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" <<< "$MSG" 2>/dev/null)
DETAIL_JSON=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" <<< "$DETAIL" 2>/dev/null)

echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"stdoutMessage\":${MSG_JSON},\"additionalContext\":${DETAIL_JSON}}}"
exit 2
