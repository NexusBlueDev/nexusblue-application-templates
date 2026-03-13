# [PROJECT NAME] -- Project-Specific Claude Code Instructions

> Global rules loaded dynamically from Core DB via `~/.claude/CLAUDE.md` (v9.0 bootloader).
> Project-specific rules below override global rules where they conflict.

## Project Type
**Type:** [Platform Product | Website / Standalone | Static PWA | Infrastructure | Script / Pipeline]
[One line describing the project type context. E.g., "Single-tenant website for [Client]. No auth, no database schema, no seed accounts."]

## Project Identity

```
What:    [One-sentence description]
Client:  [Client / Owner name]
Repo:    https://github.com/NexusBlueDev/[REPO-NAME]
Live:    [URL or "not deployed"]
Stack:   [Key technologies]
```

## Project-Specific Rules
- [Rules that only apply to THIS project, not covered by global rules]
- [E.g., "All tables use `setup_` prefix" or "Fifth-grade writing level for all user-facing text"]

## Architecture

**Key files:**
- `[file]` -- [what it does]

**Conventions:**
- [Project-specific naming or structural convention]

---

## Stack Specifics

```
Framework:     [e.g., Next.js 15 + TypeScript]
Styling:       [e.g., Tailwind v4]
Database/Auth: [e.g., Supabase]
Hosting:       [e.g., Vercel | Droplet | GitHub Pages]
```

---

## Notes for Future Sessions

- [Important context that doesn't fit elsewhere]
