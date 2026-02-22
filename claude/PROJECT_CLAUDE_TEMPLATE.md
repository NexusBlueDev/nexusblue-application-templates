# [PROJECT NAME] — Project-Specific Claude Code Instructions
<!-- Copy this file to your project root as CLAUDE.md -->
<!-- Keep this file SHORT. Only put project-specific rules here. -->
<!-- Global standards (security, workflow, Windows/OneDrive, commit discipline, session protocols) -->
<!-- are defined in the global template and inherited automatically. -->

**Global template version:** v3.0
**Based on:** `application-templates/claude/CLAUDE.md`

---

## Project Identity

```
What:    [One-sentence description of what this project is]
Mode:    [Type — e.g., "Next.js SaaS", "HTML5 PWA", "Python data pipeline", "Static site"]
Repo:    https://github.com/NexusBlueDev/[REPO-NAME]
Live:    [URL or "not deployed"]
Stack:   [Key technologies — only what differs from or adds to the global stack]
```

---

## Workflow Rules

<!-- Only include rules that OVERRIDE or ADD TO the global workflow. -->
<!-- Example: "Always commit and push before any task is complete" is already global — don't repeat it. -->

- [Any project-specific workflow rule]
- [e.g., "When bumping versions: update ?v=N on ALL script/link tags AND bump CACHE_NAME in sw.js"]
- [e.g., "Run npm run build before every push"]

---

## Architecture

<!-- Key things Claude needs to know to navigate this project. -->
<!-- For complex projects, reference ARCHITECTURE.md. -->

**Key files:**
- `[file]` — [what it does]
- `[file]` — [what it does]

**Conventions:**
- [Project-specific naming or structural convention]
- [e.g., "Global namespace: JJ (window.JJ) — all modules attach to this"]
- [e.g., "All DOM manipulation through JJ.ui — never direct DOM in app.js"]

---

## Stack Specifics

<!-- Only include what's specific to this project, beyond the global stack. -->

```
[Language/Framework]:  [version]
[Database]:            [version or provider]
[Hosting]:             [where deployed]
[Cache name]:          [if applicable]
[Storage key]:         [if applicable]
[Current version]:     vN
```

---

## Project-Specific Rules

<!-- Rules that only make sense for this project. -->

1. [Rule]
2. [Rule]

---

## Notes for Future Sessions

<!-- Important context that doesn't fit elsewhere. -->
<!-- These should eventually migrate to HANDOFF.md if they're project-state related. -->
<!-- Or to the global template if they apply to all projects. -->

- [Note]
