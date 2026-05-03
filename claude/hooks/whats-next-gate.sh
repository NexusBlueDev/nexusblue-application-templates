#!/usr/bin/env bash
# whats-next-gate.sh — Stop hook enforcing conversation-output gate rules.
#
# Runs after every assistant response. Detects task-completion signals and,
# when found, validates the final response against conversation-output gate
# rules:
#   Rule #32  — What's Next block (done / remaining / I want to do / do you agree)
#   Rule #183 — Backlog verification
#   Rule #50  — Questions include recommendation
#   Rule #178 — Lead with recommendation before options
#   Rule #1   — Never ask for credentials available in vault/.env.local
#
# Emits a stdoutMessage banner on violation. Does not block (the response is
# already sent); the banner prompts the Copilot to emit the missing block
# before the next user turn. The next-turn What's Next block closes the loop.
#
# Installed via PostToolUse on Stop — see ~/.claude/settings.json.

set -euo pipefail

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

# If no transcript path, nothing we can validate against — exit clean.
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  exit 0
fi

# Extract the last assistant message text.
LAST_MSG=$(tail -500 "$TRANSCRIPT_PATH" 2>/dev/null | python3 - "$TRANSCRIPT_PATH" <<'PYEOF' 2>/dev/null || echo ""
import json, sys
path = sys.argv[1]
last_text = ""
with open(path, 'r') as f:
    for line in f:
        try:
            row = json.loads(line)
        except Exception:
            continue
        if row.get('type') != 'assistant':
            continue
        msg = row.get('message', {})
        content = msg.get('content', [])
        if not isinstance(content, list):
            continue
        chunks = []
        for c in content:
            if isinstance(c, dict) and c.get('type') == 'text':
                chunks.append(c.get('text', ''))
        if chunks:
            last_text = "\n".join(chunks)
print(last_text)
PYEOF
)

if [ -z "$LAST_MSG" ]; then
  exit 0
fi

# --- Rule citation tracking (passive, background, non-blocking) ---
# Scan response for "Rule #N" references. Fire-and-forget DB inserts to
# core_feedback_loops. Feeds FCE auto-calibration without Copilot action.
CITED_RULES=$(echo "$LAST_MSG" | grep -oE 'Rule #[0-9]+' | grep -oE '[0-9]+' | sort -un | head -20)
if [ -n "$CITED_RULES" ]; then
  CITE_CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
  CITE_SLUG=$(basename "$CITE_CWD" 2>/dev/null || echo "unknown")
  CITE_TOKEN=""
  for f in "$HOME/.env.projects/setup-copilot.env" "$HOME/dev/setup-copilot/.env.local"; do
    if [ -f "$f" ]; then
      CITE_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' "$f" 2>/dev/null | head -1 | cut -d= -f2-)
      [ -n "$CITE_TOKEN" ] && break
    fi
  done
  if [ -n "$CITE_TOKEN" ]; then
    # Run async in background so it never blocks the response
    (echo "$CITED_RULES" | python3 - "$CITE_TOKEN" "iezojzzfhilbsrkjujjr" "$SESSION_ID" "$CITE_SLUG" 2>/dev/null << 'PYEOF'
import json, subprocess, sys
rules_in = sys.stdin.read().strip().split('\n')
token, project_ref, session_id, slug = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
def pg(s): return "'" + str(s).replace("'","''") + "'"
values = []
for n in rules_in:
    n = n.strip()
    if not n.isdigit(): continue
    ctx = json.dumps({"session_id": session_id, "project": slug, "rule_priority": int(n)})
    values.append(
        f"(gen_random_uuid(),'rule_citation','session-hook','rule',NULL,"
        f"{pg('rule-'+n)},'cited_in_response',1.0,{pg(ctx)},false,NULL,NOW())"
    )
if values:
    sql = (
        "INSERT INTO core_feedback_loops "
        "(id,feedback_type,source,target_type,target_id,target_ref,"
        "signal,magnitude,context,applied,applied_at,created_at) VALUES "
        + ",".join(values) + " ON CONFLICT DO NOTHING"
    )
    subprocess.run(
        ["curl","-s","--max-time","5","-X","POST",url,
         "-H",f"Authorization: Bearer {token}","-H","Content-Type: application/json",
         "-d",json.dumps({"query":sql})], capture_output=True, timeout=7
    )
PYEOF
    ) &
  fi
fi

# Detect task-completion signals. If NONE present, skip validation — not every
# response is a task-completion response.
SIGNAL_FOUND=0

# Signal 1: complete_task() was called (check transcript for mcp__nexusblue-governance__complete_task tool_use in recent rows)
if tail -200 "$TRANSCRIPT_PATH" 2>/dev/null | grep -q 'mcp__nexusblue-governance__complete_task'; then
  SIGNAL_FOUND=1
fi

# Signal 2: git push to main (recent bash tool with "git push" and success)
if tail -200 "$TRANSCRIPT_PATH" 2>/dev/null | grep -q 'main -> main'; then
  SIGNAL_FOUND=1
fi

# Signal 3: npm publish success
if echo "$LAST_MSG" | grep -qE '@nexusbluedev/core@[0-9.]+' && \
   tail -100 "$TRANSCRIPT_PATH" 2>/dev/null | grep -q 'Publishing to https://npm.pkg.github.com'; then
  SIGNAL_FOUND=1
fi

# Signal 4: response includes session-close language
if echo "$LAST_MSG" | grep -qiE 'session (closes?|complete|ended)|program (closed|complete)'; then
  SIGNAL_FOUND=1
fi

# Signal 5: Write/Edit tools used in last turn AND response has task-completion language.
# Catches the common case: write files, summarise what was done — no git push yet.
WRITE_EDIT_COUNT=$(tail -400 "$TRANSCRIPT_PATH" 2>/dev/null | grep -cE '"name"\s*:\s*"(Write|Edit)"' || echo "0")
COMPLETION_WORDS=$(echo "$LAST_MSG" | grep -ciE '\b(done|shipped|complete|finished|fixed|created|written|updated|deployed|distributed|pushed|wired|migrated)\b' || echo "0")
if [ "$WRITE_EDIT_COUNT" -ge 1 ] && [ "$COMPLETION_WORDS" -ge 1 ]; then
  SIGNAL_FOUND=1
fi

# Signal 6: Heavy file modification (3+ Write/Edit calls) regardless of response language.
if [ "$WRITE_EDIT_COUNT" -ge 3 ]; then
  SIGNAL_FOUND=1
fi

if [ "$SIGNAL_FOUND" -eq 0 ]; then
  # Clean pass (no task completion this turn) — clear any stale pending marker
  rm -f "$HOME/.claude/.whats-next-pending" 2>/dev/null || true
  exit 0
fi

# ── Validator ── Check the final message for the four What's Next parts.
VIOLATIONS=""

# Rule #32 Part 1: "Done" header / similar
if ! echo "$LAST_MSG" | grep -qiE '\*\*Done[:\*]|## Done|^Done:'; then
  VIOLATIONS="${VIOLATIONS}Rule #32: 'Done' section missing. "
fi

# Rule #32 Part 2: "Remaining" backlog
if ! echo "$LAST_MSG" | grep -qiE '\*\*Remaining|## Remaining|^Remaining[:(]'; then
  VIOLATIONS="${VIOLATIONS}Rule #32 + #183: 'Remaining' backlog section missing. "
fi

# Rule #32 Part 3: "I want to do:"
if ! echo "$LAST_MSG" | grep -qE '\*\*I want to do[:\*]|I want to do:'; then
  VIOLATIONS="${VIOLATIONS}Rule #32: 'I want to do:' recommendation missing. "
fi

# Rule #32 Part 4: "I am ready, do you agree"
if ! echo "$LAST_MSG" | grep -qiE 'I am ready[^?]*do you agree|do you agree with what I want to do|ready.*do you agree'; then
  VIOLATIONS="${VIOLATIONS}Rule #32: 'I am ready, do you agree?' prompt missing. "
fi

# Rule #1 — don't ask for credentials already in vault/.env.local.
# Flag only if the response contains a credential request AND the credential
# name appears in the vault.
if echo "$LAST_MSG" | grep -qiE 'please (provide|give me|share)|I need (you to )?provide|what is your'; then
  # Look for common credential shapes
  if echo "$LAST_MSG" | grep -qiE 'API[_ ]?KEY|TOKEN|SECRET|PASSWORD'; then
    VIOLATIONS="${VIOLATIONS}Rule #1: response may be asking for a credential — verify vault/.env.local first. "
  fi
fi

# Rule #944f268c — Autonomous-First: detect human escalation for things Claude can do itself.
# Fires when response asks the human to check/verify something reachable autonomously.
if echo "$LAST_MSG" | grep -qiE '(please|can you|could you|you (will |need to |should ))(check|verify|validate|look at|confirm|inspect|review)'; then
  # Only flag if the target is something Claude can reach autonomously
  if echo "$LAST_MSG" | grep -qiE 'trigger\.dev|dashboard|supabase|database|DB|table|log|production|deploy|env|vault|run|agent|signal|cron'; then
    VIOLATIONS="${VIOLATIONS}Rule #944f268c (Autonomous-First): response asks human to check something Claude can verify autonomously. Use vault-get.sh + API call or Bash tool instead. See docs/autonomous-capabilities-map.md. "
  fi
fi

if [ -n "$VIOLATIONS" ]; then
  MSG="whats-next-gate (Rule #32 / #183 / #50 / #178 / #1): $VIOLATIONS"
  MSG_JSON=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" <<< "$MSG")
  DETAIL="Gate rules on conversation output were violated. Emit the required What's Next block in your NEXT response (before any further work): (1) **Done** — what was just shipped; (2) **Remaining** — open backlog from TODO.md + HANDOFF.md Next Up; (3) **I want to do:** — single recommendation with reasoning; (4) **I am ready, do you agree with what I want to do?** — wait for approval. git push will be BLOCKED until this block is emitted. Reference: Governance Enforcement Program Phase 3 (~/.claude/hooks/whats-next-gate.sh)."
  DETAIL_JSON=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" <<< "$DETAIL")
  echo "{\"suppressOutput\":true,\"hookSpecificOutput\":{\"hookEventName\":\"Stop\",\"stdoutMessage\":${MSG_JSON},\"additionalContext\":${DETAIL_JSON}}}"

  # Set pending marker — blocks git push until What's Next block is emitted
  echo "$SESSION_ID $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$HOME/.claude/.whats-next-pending"

  # Log violation for governance-health metrics (Phase 5)
  LOG="$HOME/.claude/governance-violations.log"
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) whats-next-gate session=$SESSION_ID violations=\"$VIOLATIONS\"" >> "$LOG"
else
  # What's Next block was present (or no violations) — clear the pending marker
  rm -f "$HOME/.claude/.whats-next-pending" 2>/dev/null || true
fi

exit 0
