# NexusBlue Application Templates

Central standards repository for all NexusBlue development projects. Contains the global Claude Code configuration, architectural standards, project templates, and reusable scripts.

## Standards

| Document | Purpose |
|----------|---------|
| `claude/CLAUDE.md` | Global Claude Code execution rules (v5.5) — installed at `~/.claude/CLAUDE.md` |
| `docs/MODULE_STANDARD.md` | Feature module governance — DB tables, UI, feature gates, billing (v1.3) |
| `docs/AGENT_STANDARD.md` | Background automation governance — cron, logging, error handling (v1.0) |
| `docs/INTEGRATION_STANDARD.md` | External API wrapper governance — auth, caching, type isolation (v1.0) |

The **Component Type Decision Framework** in `claude/CLAUDE.md` classifies all new work into the correct governance tier (Module / Agent / Integration / Script / Service / Microservice) before implementation begins.

## Templates

| File | Purpose |
|------|---------|
| `claude/PROJECT_CLAUDE_TEMPLATE.md` | Starter `CLAUDE.md` for new projects |
| `claude/HANDOFF_TEMPLATE.md` | Starter `HANDOFF.md` for new projects |
| `docs/NEW_PROJECT_PROMPT.md` | Copy-paste prompt to start a new project with Claude Code |
| `docs/NEW_MODULE_PROMPT.md` | Copy-paste prompt to add a module to an existing project |
| `docs/github-ci-template.yml` | GitHub Actions CI workflow template (lint + typecheck + test + deploy) |
| `nexusblue-game-template/` | HTML5/ES5 game PWA starter |
| `publishing-pipeline-template/` | Content publishing pipeline starter |

## Reference Docs

| File | Purpose |
|------|---------|
| `docs/EXTERNAL_LLM_BRIEF.md` | Context document for external AI tools working on NexusBlue projects |
| `docs/NEXUSBLUE_SUPERADMIN_PLAN.md` | Full spec for the `/nexusblue` super-admin portal |
| `docs/WEBSITE_REBUILD_PLAYBOOK.md` | 6-phase methodology for website rebuilds |
| `docs/NONPROFIT_CHAT_WIDGET.md` | Nonprofit chat widget template spec |
| `DOMAINS.md` | `*.nexusblue.ai` subdomain registry |
| `TODO.md` | Cross-project action items |

## Scripts

| File | Purpose |
|------|---------|
| `scripts/apply-migrations.sh` | Run SQL migrations against Supabase via Management API |
| `scripts/rollback.sh` | Promote prior Vercel deployment via REST API |

## Syncing Global Config

After updating `claude/CLAUDE.md`:

```bash
cp /home/nexusblue/dev/nexusblue-application-templates/claude/CLAUDE.md ~/.claude/CLAUDE.md
```

Windows machines pull the update automatically on next login via VBScript.
