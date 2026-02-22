# [APP NAME] — Project-Specific Claude Code Instructions
# (Replace this header with your app name before using)

## Workflow Rules
- **Always commit and push to GitHub before any task is considered complete.**
- Do not ask for approval before committing — authorized per established workflow.
- When bumping versions: update `?v=N` on ALL script/link tags in `index.html` AND bump `CACHE_NAME` in `sw.js`.

## Project
[One sentence description of what this app does.]
[DISCOVERY / GUESSING] mode — [explain the game flow in one line].
Pure client-side HTML5/CSS/JS with PWA support. No build tools, no bundler.

## Live URLs
- App: https://nexusbluedev.github.io/[REPO-NAME]/
- Repo: https://github.com/NexusBlueDev/[REPO-NAME]

## AI-First Design Principle
Static decision tree engine is the offline fallback.
`JJ.aiConfig` in `data.js` is the hook point for Claude API integration.

## Stack
- HTML5 + CSS3 + Vanilla JavaScript (ES5, no transpiler)
- Web Speech API (TTS only)
- Service Worker for offline PWA (current cache: `[CACHE-NAME]-v1`)
- No external dependencies

## Architecture
- `js/data.js` — [N] items with [fields], [N] questions, messages
- `js/engine.js` — Scoring engine (min [N] questions, [N]pt lead required before reveal)
- `js/speech.js` — Web Speech API TTS wrapper
- `js/effects.js` — Particles, confetti, emoji reactions, Web Audio sounds
- `js/ui.js` — DOM, screens, item gallery, match/end screen
- `js/metrics.js` — LocalStorage analytics (key: `[STORAGE-KEY]`)
- `js/app.js` — Main controller

## Game Flow
[DISCOVERY mode:]
1. Welcome — browse item cards, click "[START BUTTON]"
2. Questions — [N]-[N] interest/personality questions
3. Match — direct reveal, no yes/no confirmation
4. End Screen — [AI impact paragraph + N numbered success steps]
5. Restart — full engine + UI reset before returning to welcome

[GUESSING mode:]
1. Welcome — browse item cards, click "[START BUTTON]"
2. Questions — [N]-[N] yes/no questions
3. Guess Screen — app reveals its guess
4. Player confirms YES/NO
5. Result Screen — celebration or retry
6. Restart — full engine + UI reset

## Key Conventions
- Global namespace: `JJ` (window.JJ)
- No build step — scripts load via `<script>` tags in order in `index.html`
- All DOM manipulation through `JJ.ui` — no direct DOM access in `app.js`
- Speech through `JJ.speech`
- Item data structure: `{ id, name, emoji, fact, gradient, [aiImpact, aiSuccessSteps[],] props{} }`
- Property matrix: [list your 8 property names here]
- All item pairs must have ≥2 property differences

## Current Version: v1
## Docs: See HANDOFF.md (create after first session)
