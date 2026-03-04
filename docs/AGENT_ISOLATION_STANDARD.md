# Agent Isolation & Resource Reservation Protocol (AIRP)

**Version:** 1.0
**Status:** Active (Advisory Mode)
**Source of truth:** `nexusblue-application-templates/docs/AGENT_ISOLATION_STANDARD.md`
**Runtime files:** `~/.claude/agent-reservations.json`, `~/.claude/cross-project-issues.md`
**Hook:** `~/.claude/hooks/boundary-guard.sh`

---

## Purpose

AIRP prevents development conflicts when multiple Claude Code sessions run simultaneously across NexusBlue projects. It ensures:

1. **One project per session** — agents only write to their assigned project
2. **Resource reservation** — migration numbers and shared resources are claimed before building
3. **Cross-project coordination** — bugs found in other projects are logged, not fixed directly
4. **Human authority** — cross-project actions require human approval

---

## Core Rules

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | One project per session — cross-project writes require human approval | Hook (advisory v1.0) |
| 2 | Declare resources before building — migrations, flags, deps in plan phase | Session protocol |
| 3 | Log cross-project bugs, don't fix them — issue queue, not direct edits | Session protocol |
| 4 | Migrations are reserved, not first-come-first-served — claim in registry | Reservation file |
| 5 | TTL is crash recovery — 24h interactive, 2h CI, auto-cleaned | Hook cleanup |
| 6 | Read-only access is always free — boundary guard only blocks writes | Hook logic |

---

## Session Lifecycle

### 1. Register (Session Start)

When a session begins work on a project, register in `~/.claude/agent-reservations.json`:

```json
{
  "sessions": {
    "session-{timestamp}": {
      "project": "project-name",
      "session_type": "interactive",
      "status": "planning",
      "started_at": "ISO-8601",
      "expires_at_epoch": 1234567890,
      "resources": []
    }
  }
}
```

**Session types:**
- `interactive` — human-driven Claude Code session (TTL: 24 hours)
- `ci_agent` — headless CI/CD agent (TTL: 2 hours)

**Status values:**
- `planning` — gathering requirements, not yet building
- `active` — building, has reserved resources
- `waiting_for_human` — blocked on cross-project request
- `completed` — session done, resources released

### 2. Reserve (Plan Approval)

When the plan is approved and resources are identified, reserve them:

**Migration numbers:**
```json
{
  "migration_registry": {
    "supabase-ref": {
      "last_applied": 52,
      "reserved": {
        "053": "session-{timestamp}"
      }
    }
  }
}
```

**Rules:**
- Check `last_applied` and all existing `reserved` entries before claiming
- If a number is already reserved by another session, pick the next available
- Shared databases (nexusblue-website + beers-biz-dayton) require the nexusblue-website session to claim migrations — beers-biz sessions cannot claim directly
- Update `last_applied` after migration is applied (not when reserved)

### 3. Build (Active Phase)

During active development:
- Write only to your registered project's directory
- Read any project freely (for reference, imports, etc.)
- If you find a bug in another project → log it in `~/.claude/cross-project-issues.md`
- If you need help from another project's domain → create a cross-project request

### 4. Release (Session End)

At session end, release all reservations:
- Remove session entry from `sessions`
- Remove migration reservations from `migration_registry.*.reserved`
- Update `last_applied` if migrations were applied
- Update `_updated_at` timestamp

---

## Reservation File Schema

**Location:** `~/.claude/agent-reservations.json`

```json
{
  "_version": "1.0",
  "_description": "AIRP coordination layer",
  "_updated_at": "ISO-8601",

  "sessions": {
    "session-id": {
      "project": "project-name",
      "session_type": "interactive | ci_agent",
      "status": "planning | active | waiting_for_human | completed",
      "started_at": "ISO-8601",
      "expires_at_epoch": 1234567890,
      "resources": ["migration:053", "feature_flag:biogate"]
    }
  },

  "migration_registry": {
    "supabase-project-ref": {
      "description": "Human-readable name",
      "projects": ["project-a", "project-b"],
      "last_applied": 52,
      "reserved": {
        "053": "session-id",
        "054": "other-session-id"
      }
    }
  },

  "cross_project_requests": [
    {
      "id": "req-001",
      "from_session": "session-id",
      "from_project": "pw-app",
      "to_project": "nexusblue-website",
      "request": "Need the portal API endpoint format for agent run logging",
      "status": "pending | answered | cancelled",
      "created_at": "ISO-8601",
      "response": null
    }
  ]
}
```

### Atomic Writes

All updates to the reservation file must use atomic writes to prevent corruption from concurrent sessions:

```python
import json, os

tmp = path + '.tmp'
with open(tmp, 'w') as f:
    json.dump(data, f, indent=2)
os.replace(tmp, path)  # Atomic on POSIX
```

---

## Boundary Guard Hook

**Location:** `~/.claude/hooks/boundary-guard.sh`
**Trigger:** PreToolUse on Bash (runs alongside docs-gate.sh)
**Mode:** Advisory (v1.0) — warns but does not block

### What It Checks

1. **Cross-project writes** — commands that write to paths outside the session's registered project
2. **Migration push guard** — `git push` with staged migration files that lack reservations

### What It Always Allows

- Read-only commands (cat, grep, ls, find, head, tail, etc.)
- Commands within the session's own project
- Commands when no session is registered (backwards compatible)

### TTL Cleanup

On every invocation, the hook checks all sessions for expired TTLs and cleans them up:
- Expired sessions are removed from `sessions`
- Their migration reservations are released
- This is the crash recovery mechanism — if a session dies without cleanup, the next hook invocation handles it

---

## Cross-Project Issue Queue

**Location:** `~/.claude/cross-project-issues.md`

When an agent finds a bug or issue in another project during their work:

1. **Do NOT fix it** — even if the fix is obvious
2. **Log it** in the issue queue with:
   - Unique ID (e.g., `XPROJ-001`)
   - Your session ID and project
   - Target project
   - Description of the issue
   - Severity (critical / high / medium / low)
3. **Continue your own work** — don't block on cross-project issues
4. **Human reviews** the issue queue and either:
   - Routes it to the target project's next session
   - Approves the current session to fix it (with explicit permission)
   - Marks it as `wontfix`

---

## Inter-Agent Request Flow

When a session needs information or help from another project's domain:

1. Write a `cross_project_request` to the reservation file
2. Set own session status to `waiting_for_human`
3. Present options to the human:
   - Provide the answer directly
   - Route to another active session
   - Approve a read-only cross-project lookup
4. **Wait for human decision** — never proceed autonomously on cross-project work

---

## Shared Database Coordination

Some projects share a Supabase database:

| DB Ref | Projects | Migration Owner |
|--------|----------|-----------------|
| `lbmxueowhpecoqlyhdcs` | nexusblue-website, beers-biz-dayton | nexusblue-website |

**Rules for shared databases:**
- Only the migration owner project can claim migration numbers
- Other projects on the same DB must request migrations through the owner project's session
- Feature flags that affect shared tables need coordination through cross-project requests

---

## Edge Cases

### Session Crash
TTL auto-expires the session. The next hook invocation on any session cleans up:
- Removes the crashed session from `sessions`
- Releases its migration reservations
- No manual intervention needed

### Pair Programming (Two Sessions, Same Project)
- Both sessions register with the same project name
- Advisory warning displayed: "Another session is also registered to this project"
- Both may proceed — human is responsible for coordinating their work
- Migration numbers must not overlap — each session claims different numbers

### CI Agents (Phase 2)
- Register with `session_type: "ci_agent"` and 2-hour TTL
- Phase 2 adds `dev_agent_runs` DB table as the CI-side counterpart
- CI agents are always autonomous in sandbox, supervised in dev/prod

### TTL Renewal
If a session runs longer than expected:
- Check remaining TTL periodically (e.g., during plan phase)
- If < 2 hours remaining, extend by re-writing `expires_at_epoch`
- Auto-renew pattern: check at session start protocol, renew if needed

---

## Enforcement Roadmap

| Version | Mode | Behavior |
|---------|------|----------|
| **1.0** (current) | Advisory | Warns on cross-project writes; exits 0 (allows) |
| **2.0** (Phase 2+) | Enforcement | Blocks cross-project writes; exits 2 (denies) |

The switch from advisory to enforcement happens when:
1. All active projects have been through at least one AIRP session
2. No false positives reported in advisory mode
3. Human explicitly approves the switch

---

## Integration with Session Protocol

### Session Start (additions to global CLAUDE.md)

After step 6 (verify git remote), add:

**6b. AIRP Registration**
1. Check `~/.claude/agent-reservations.json` for active sessions on this project
2. If another session exists → warn human, proceed if approved
3. Register this session with `status: planning`
4. Note any cross-project issues in the queue that target this project

### Plan Phase (additions)

When building a plan, declare all resources needed:
- Migration numbers (check registry, claim next available)
- Feature flags being added
- Cross-project dependencies (other projects' APIs, shared tables)

On plan approval:
- Reserve all declared migration numbers
- Update session status to `active`

### Session End (additions to global CLAUDE.md)

After step 1 (update HANDOFF.md), add:

**1b. Release AIRP Reservations**
1. Remove session from `sessions`
2. Release migration reservations (update `last_applied` if migrations were applied)
3. Review cross-project issue queue — any new issues logged this session?
4. Close any pending cross-project requests

---

## Verification Checklist

- [ ] `~/.claude/agent-reservations.json` exists with all 6 DB refs
- [ ] `~/.claude/cross-project-issues.md` exists
- [ ] `~/.claude/hooks/boundary-guard.sh` exists and is executable
- [ ] `~/.claude/settings.json` registers both hooks
- [ ] Boundary guard warns on cross-project writes (advisory mode)
- [ ] Boundary guard allows read-only cross-project access
- [ ] Boundary guard allows own-project writes silently
- [ ] TTL cleanup runs on every hook invocation
- [ ] Atomic writes used for all reservation file updates
