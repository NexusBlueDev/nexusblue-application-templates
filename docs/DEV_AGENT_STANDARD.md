# Development Agent Standard

**Version:** 1.0
**Status:** Active
**Source of truth:** `nexusblue-application-templates/docs/DEV_AGENT_STANDARD.md`

---

## Purpose

Defines the contracts, autonomy rules, and operational patterns for NexusBlue's AI development agents. These agents operate as Claude Code sessions (interactive or headless via GitHub Actions) that perform specific development tasks across the project portfolio.

---

## Agent Registry

| Agent | Type | Trigger | Default Model | Description |
|-------|------|---------|--------------|-------------|
| `dev-architect` | review | PR to `dev` | Haiku | Schema, RLS, migration review |
| `dev-security` | review | PR to `main` | Haiku | Auth, validation, data exposure audit |
| `dev-qa` | review | Module → LIVE | Haiku | Module standard compliance check |
| `dev-docs` | gate | Pre-push | Haiku | Documentation freshness enforcement |
| `dev-ci-healer` | automation | CI failure | Sonnet | Reads failure logs, generates fix |
| `dev-sandbox-builder` | automation | Portal trigger | Sonnet | Receives spec, builds prototype |
| `dev-promoter` | automation | Portal trigger | Sonnet | Creates PR from sandbox to dev |

### Agent Types

| Type | Behavior | Output |
|------|----------|--------|
| **review** | Reads code, produces structured assessment | PASS / ISSUES FOUND with file:line references |
| **gate** | Blocks a lifecycle transition until conditions met | PASS (unblocks) / GAPS FOUND (blocks) |
| **automation** | Writes code, creates commits/PRs | Code changes + commit/PR |

---

## Autonomy Rules

Non-negotiable safety boundaries per environment.

| Environment | Default | Override? | What It Means |
|------------|---------|-----------|---------------|
| **Sandbox** | Autonomous | No — always autonomous | Agent pushes fixes and code directly |
| **Dev** | Supervised | Yes — can promote specific agents | Agent creates PRs; human reviews |
| **Production** | Supervised | No — always supervised | Agent proposes; human approves and merges |

### Autonomy Escalation

An agent that encounters a situation outside its autonomy level MUST:

1. Stop making changes
2. Log the situation in `dev_agent_runs.output_summary`
3. Set status to `needs_review`
4. If CI-based: create a PR or issue describing what it found
5. If interactive: present options to the human

### What Agents Cannot Do (Any Environment)

- Modify `main` branch directly (always via PR)
- Run database migrations (schema changes require human review)
- Modify auth configuration or RLS policies
- Access production secrets from sandbox/dev contexts
- Call paid external APIs without budget check
- Exceed 60-minute execution time per run
- Bypass AIRP isolation (see `AGENT_ISOLATION_STANDARD.md`)

---

## Execution Model

### Interactive Agents (Claude Code sessions)

Used during development. Invoked via the Agent tool with `subagent_type: general-purpose`.

**Pattern:**
```
Developer working → hits lifecycle gate → invokes agent → agent returns assessment → developer acts on result
```

**Examples:** dev-architect, dev-security, dev-qa, dev-docs

### Headless Agents (GitHub Actions)

Used for automation. Run on GitHub-hosted runners via `anthropics/claude-code-action@v1`.

**Pattern:**
```
Event fires (CI failure, PR created, portal trigger) → GitHub Actions workflow → Claude Code Action → commits/PRs → logs to dev_agent_runs
```

**Examples:** dev-ci-healer, dev-sandbox-builder, dev-promoter

### CI Healer Specific Pattern

```
CI quality job fails on dev or sandbox/*
  → workflow_run event fires
  → ci-healer.yml triggers
  → Downloads failure logs from GitHub API
  → Claude Code analyzes and fixes
  → Sandbox: pushes fix directly (autonomous)
  → Dev: creates PR with fix (supervised)
  → Logs run to dev_agent_runs with model/cost data
```

---

## Cost Tracking

Every agent run records LLM usage in the `dev_agent_runs` table:

| Field | Description |
|-------|-------------|
| `model_used` | Model ID (e.g., `claude-sonnet-4-6`) |
| `tokens_in` | Input tokens consumed |
| `tokens_out` | Output tokens generated |
| `estimated_cost` | USD cost estimate |

### Budget Controls

Agents check `dev_llm_budgets` before executing:

| Threshold | Action |
|-----------|--------|
| < 70% spent | Normal operation |
| 70-89% spent | Info logged, operation continues |
| 90-99% spent | Warning in portal, operation continues |
| >= 100% spent | Block non-critical agents; CI healer still allowed |

CI healer is always allowed regardless of budget — a broken CI pipeline is more expensive than the fix.

---

## Model Routing

Agents use the multi-LLM router (`src/lib/platform/llm.ts`) which reads from `dev_model_routing`:

| Task Type | Default Model | Fallback | Use Case |
|-----------|--------------|----------|----------|
| `code_gen` | Sonnet | GPT-4o | CI healer, sandbox builder |
| `judgment` | Haiku | Sonnet | Architect, security, QA reviews |
| `reasoning` | Opus | Sonnet | Novel architecture, complex debugging |
| `content` | Sonnet | Haiku | PR descriptions, reports |
| `embedding` | Voyage AI | — | Future: codebase search |

Model routing is configurable from the `dev_model_routing` table (portal editing UI planned).

---

## Logging Standard

All agent runs write to `dev_agent_runs`:

```sql
INSERT INTO dev_agent_runs (
  agent_type, project_id, trigger_type, trigger_ref,
  environment, autonomy_level, status,
  input_summary, model_used
) VALUES (
  'dev-ci-healer', NULL, 'ci_failure', 'workflow-run-12345',
  'sandbox', 'autonomous', 'running',
  'CI failure on sandbox/experiment-1', 'claude-sonnet-4-6'
);
```

On completion:
```sql
UPDATE dev_agent_runs SET
  status = 'completed',
  completed_at = now(),
  output_summary = 'Fixed missing import in utils.ts',
  changes_made = '{"files": ["src/lib/utils.ts"], "lines_changed": 2}',
  tokens_in = 15000,
  tokens_out = 3000,
  estimated_cost = 0.1620,
  duration_ms = 45000
WHERE id = 'run-uuid';
```

### Status Values

| Status | Meaning |
|--------|---------|
| `running` | Agent is actively working |
| `completed` | Task finished successfully |
| `failed` | Agent encountered an unrecoverable error |
| `needs_review` | Agent stopped — requires human decision |

---

## Adding a New Agent

1. **Define in registry:** Add to `DEV_AGENTS` array in `src/lib/portal/dev-agents.ts`
2. **Add to agent registry:** Add entry in `src/lib/agents/registry.ts` with model assignment
3. **Choose execution model:** Interactive (review/gate) or headless (automation)
4. **If headless:** Create `.github/workflows/{agent-name}.yml` from `ci-healer.yml` template
5. **Implement logging:** INSERT to `dev_agent_runs` on start, UPDATE on completion
6. **Set autonomy:** Follow the environment rules table above
7. **Budget check:** Verify budget before execution (CI healer exempt)
8. **Update portal:** Agent appears automatically on Agent Team page via `DEV_AGENTS` array

---

## GitHub Actions Setup

### Required Secrets

| Secret | Purpose | Where to Get |
|--------|---------|-------------|
| `ANTHROPIC_API_KEY` | Claude Code Action authentication | console.anthropic.com |
| `NEXT_PUBLIC_SUPABASE_URL` | Agent run logging | Project .env.local |
| `SUPABASE_SERVICE_ROLE_KEY` | Agent run logging (RLS bypass) | Project .env.local |

### Workflow Template

See `docs/github-ci-healer.yml` for the reusable CI healer workflow template.

Key configuration:
- `workflow_run` trigger on CI workflow completion
- Branch filtering: `dev` and `sandbox/*` only
- `anthropics/claude-code-action@v1` with Sonnet model
- Max 15 turns per invocation
- Commit signing enabled
- Agent run logging to Supabase

---

## Relationship to Other Standards

| Standard | Relationship |
|----------|-------------|
| `AGENT_STANDARD.md` | Governs cron/background agents (portal-performance, etc.). Dev agents follow this standard instead. |
| `AGENT_ISOLATION_STANDARD.md` | AIRP rules apply to all agents — dev agents must respect project boundaries |
| `MODULE_STANDARD.md` | Dev agents enforce module compliance (architect, QA) |
| `ENVIRONMENT_PIPELINE_STANDARD.md` | Dev agents operate within the three-environment pipeline |
