# Environment Pipeline Standard — NexusBlue v1.0

> Every NexusBlue project uses a three-environment pipeline: **Sandbox → Dev → Production.**
> This standard governs how code flows between environments, what gates exist at each transition,
> and how autonomous AI agents operate within each environment.

---

## Three Environments

| Environment | Branch Pattern | Deploy Target | Quality Gate | AI Autonomy |
|-------------|---------------|---------------|-------------|-------------|
| **Sandbox** | `sandbox/{name}` | Vercel auto-preview URL | Advisory (test failures don't block deploy) | Autonomous — no human approval needed |
| **Dev** | `dev` | `{slug}.nexusblue.ai` | Required (lint + typecheck + test must pass) | Supervised — PRs require human review |
| **Production** | `main` | Production domain | Required (lint + typecheck + test must pass) | Supervised — merge requires human approval |

---

## Branch Conventions

### Sandbox Branches
- **Pattern:** `sandbox/{experiment-name}` (e.g., `sandbox/dark-mode-poc`, `sandbox/ai-chat-widget`)
- **Purpose:** Rapid prototyping, proof of concepts, quick client demos
- **Lifecycle:** Created by developer or AI agent. Auto-deleted after 14 days of inactivity (no commits)
- **CI behavior:** Quality checks run but failures are advisory — deploy always proceeds
- **Deploy:** Vercel generates a unique preview URL per branch automatically
- **No database migrations allowed** — sandbox prototypes use the existing schema only
- **No production secrets** — sandbox environments use mock/test credentials

### Dev Branch
- **Pattern:** `dev` (single branch per project)
- **Purpose:** Integration, testing, stabilization before production
- **Preview URL:** `{slug}.nexusblue.ai` (configured in Vercel, registered in DOMAINS.md)
- **CI behavior:** Quality checks are required — deploy only proceeds on pass
- **Promotion from sandbox:** PR from `sandbox/*` to `dev`, must pass CI

### Main Branch (Production)
- **Pattern:** `main` (single branch per project)
- **Purpose:** Stable, client-facing production code
- **CI behavior:** Quality checks required. Release tag created on deploy
- **Promotion from dev:** PR from `dev` to `main`, must pass CI, requires human merge

---

## Promotion Flow

```
sandbox/{name}  ──PR──→  dev  ──PR──→  main
    │                      │              │
    │ Advisory CI          │ Required CI  │ Required CI
    │ Auto-deploy preview  │ Deploy to    │ Deploy to production
    │ 14-day auto-expire   │ *.nexusblue  │ Release tag created
    │ AI autonomous        │ AI supervised│ Human approves merge
```

### Sandbox → Dev
1. Claude (or developer) creates PR from `sandbox/{name}` to `dev`
2. CI quality gate runs — **must pass** (lint + typecheck + test)
3. PR includes: what was prototyped, test results, preview URL
4. Human reviews and merges (or Claude merges if autonomy level allows)

### Dev → Production
1. Claude (or developer) creates PR from `dev` to `main`
2. CI quality gate runs — **must pass**
3. PR includes: summary of changes since last production deploy
4. **Human must merge** — production deploys are never autonomous
5. Vercel auto-deploys on merge. Release tag `release-YYYYMMDD-HHMMSS` created

### Emergency Hotfix
1. Create `hotfix/{description}` branch from `main`
2. Fix, commit, create PR directly to `main`
3. Same CI gates as normal production deploy
4. After merge: cherry-pick or merge `main` → `dev` to keep branches in sync

---

## CI Template (v6.0)

Every project uses the CI template at `docs/github-ci-template.yml` with 5 jobs:

| Job | Trigger | Required? | Purpose |
|-----|---------|-----------|---------|
| `quality` | All pushes + PRs | Yes (advisory on sandbox) | Lint, typecheck, test |
| `deploy-sandbox` | Push to `sandbox/*` | Deploys even on test failure | Vercel auto-preview URL |
| `deploy-preview` | Push to `dev` | Only on quality pass | Deploy to `*.nexusblue.ai` |
| `deploy-production` | Push to `main` | Only on quality pass | Deploy to production + release tag |
| `docs-freshness` | Push to `main` | Advisory | Warn on stale HANDOFF.md/TODO.md |

Separate workflow `sandbox-cleanup.yml` runs weekly to delete `sandbox/*` branches with no commits in 14 days.

---

## AI Agent Autonomy Rules

| Action | Sandbox | Dev | Production |
|--------|---------|-----|------------|
| Create branch | Autonomous | Autonomous | N/A (main is protected) |
| Write code + commit | Autonomous | Autonomous | N/A |
| Push to branch | Autonomous | Autonomous | N/A |
| Create PR | Autonomous | Autonomous | Autonomous |
| Merge PR | N/A | Supervised (human reviews) | Human only |
| Run database migration | Never | Supervised | Human only |
| Modify auth config | Never | Supervised | Human only |
| Access production secrets | Never | Yes (via env vars) | Yes |
| Call paid APIs | Mock mode only | Yes (budget-checked) | Yes |
| Max execution time | 60 minutes | No limit | No limit |

---

## Sandbox Safety Boundaries

Sandbox is designed for autonomous AI operation with strict safety limits:

1. **Branch isolation:** Can only create/modify `sandbox/*` branches. Cannot touch `dev` or `main`
2. **No migrations:** Schema changes require human review. Sandbox prototypes work within existing schema
3. **No auth changes:** Cannot modify authentication configuration, RLS policies, or role definitions
4. **Mock credentials only:** Sandbox environments never access production databases or paid services
5. **Time-limited:** 60-minute maximum for autonomous execution per spec
6. **Fully logged:** Every action is recorded in `dev_agent_runs` and `audit_events`
7. **Auto-expiry:** Stale sandbox branches (14 days, no commits) are automatically deleted

---

## Preview Domain Registry

All preview domains follow the pattern `{slug}.nexusblue.ai` and are registered in:
- **DOMAINS.md** in `nexusblue-application-templates` (source of truth)
- **Vercel project domains** (configured via API, tied to `dev` branch)

DNS: Wildcard CNAME `*.nexusblue.ai → cname.vercel-dns.com` (Namecheap). No per-project DNS changes needed.

### Adding a New Preview Domain
1. Choose a slug (check DOMAINS.md for conflicts)
2. Register on Vercel: `POST /v10/projects/{name}/domains` with `gitBranch: "dev"`
3. Disable SSO protection if the app has its own auth
4. Update DOMAINS.md with the new entry

---

## Branch Protection Rules

Apply to all projects via GitHub API or dashboard:

### `main` branch
- Require pull request before merging
- Require status checks to pass (quality job)
- Do not allow force pushes
- Do not allow deletions

### `dev` branch
- Require status checks to pass (quality job)
- Do not allow force pushes
- Allow direct pushes (for routine development)

### `sandbox/*` branches
- No protection rules (ephemeral, auto-deleted)
- Anyone (including CI agents) can create, push, and delete

---

## Getting Started (New Project)

1. Create `dev` branch: `git checkout -b dev && git push -u origin dev`
2. Register preview domain on Vercel (see Adding a New Preview Domain above)
3. Update DOMAINS.md with the new entry
4. Copy `docs/github-ci-template.yml` to `.github/workflows/ci.yml`
5. Replace `PROJECT_NAME`, `REPO_NAME`, `REPO_ID` in the workflow
6. Set `VERCEL_TOKEN` and `VERCEL_TEAM_ID` as GitHub repo secrets
7. Optionally: copy `sandbox-cleanup.yml` section to `.github/workflows/sandbox-cleanup.yml`
8. Configure branch protection on `main` (see above)
