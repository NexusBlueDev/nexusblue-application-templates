# NexusBlue Game Template

Reusable starter template for all NexusBlue Junior Jarvis discovery/guessing games.

## What's Included

| File/Folder | Status | Description |
|-------------|--------|-------------|
| `REQUIREMENTS_TEMPLATE.md` | Fill out first | Define your app before building |
| `CLAUDE_BUILD_PROMPT.md` | Use to build | Paste into Claude Code to auto-build |
| `js/engine.js` | Copy as-is | Scoring-based elimination engine |
| `js/speech.js` | Copy as-is | Web Speech API TTS wrapper |
| `js/effects.js` | Copy as-is | Particles, confetti, sounds |
| `logo/` | Copy as-is | NexusBlue branding assets |
| `assets/` | Copy as-is | PWA icons (192, 512) |

## How to Build a New Game

### Step 1 — Fill Out Requirements

Open `REQUIREMENTS_TEMPLATE.md` and complete every section:
- App identity (name, ID, repo)
- Game concept (discovery vs. guessing)
- 8 items with names, emojis, facts, colors
- 8 boolean properties + property matrix
- 10–14 questions
- End screen content (discovery mode)
- Branding colors
- Technical settings

### Step 2 — Build With Claude

Open `CLAUDE_BUILD_PROMPT.md` and:
1. Copy the entire prompt section
2. Replace all `[PLACEHOLDER]` values with your requirements
3. Paste into a new Claude Code session
4. Claude will build the complete app and push to GitHub

### Step 3 — Test

Open the GitHub Pages URL (ready ~1-2 min after push) in Chrome or Edge.
Run through all 8 items to verify matches feel accurate.

---

## Architecture Overview

All NexusBlue games share the same pattern:

```
[app-name]/
├── index.html               ← App shell (3-4 screens)
├── manifest.json            ← PWA config
├── sw.js                    ← Service worker (cache-first fallback)
├── CLAUDE.md                ← Project instructions for future Claude sessions
│
├── css/
│   └── styles.css           ← NexusBlue glassmorphism styles
│
├── js/
│   ├── data.js              ← Items, questions, messages (YOU CUSTOMIZE)
│   ├── engine.js            ← Scoring engine (COPY AS-IS)
│   ├── speech.js            ← TTS wrapper (COPY AS-IS)
│   ├── effects.js           ← Particles/sounds (COPY AS-IS)
│   ├── ui.js                ← DOM management (YOU CUSTOMIZE)
│   ├── metrics.js           ← LocalStorage analytics (minimal changes)
│   └── app.js               ← Game flow controller (YOU CUSTOMIZE)
│
├── logo/                    ← NexusBlue branding (COPY AS-IS)
└── assets/                  ← PWA icons (COPY AS-IS)
```

## Game Modes

### Discovery Mode
Player answers interest/personality questions → app recommends the best match → shows AI impact + steps to succeed.
*Used by: Junior Jarvis Career*

### Guessing Mode
Player picks something they're thinking of → app asks yes/no questions → tries to guess it → player confirms.
*Used by: Junior Jarvis (original — AI jobs)*

## Key Conventions (Never Change These)

- **Global namespace:** `JJ` (window.JJ) — all modules attach to this
- **ES5 only** — no arrow functions, no `let`/`const`, no template literals, no modules
- **No external dependencies** — fully self-contained, works offline
- **DOM through `JJ.ui`** — no direct DOM access in `app.js`
- **Speech through `JJ.speech`** — never call Web Speech API directly
- **Version bumping** — always increment `?v=N` on ALL `<script>`/`<link>` tags AND bump `CACHE_NAME` in `sw.js` together

## Publishing

Once the game is live on GitHub Pages, use the `publishing-pipeline-template` to set up Capacitor + GitHub Actions for Google Play and App Store distribution.

See: `../publishing-pipeline-template/SETUP.md`

---

## Existing Games Built on This Template

| App | Repo | Mode | Status |
|-----|------|------|--------|
| Junior Jarvis | nexusblue-junior-jarvis | Guessing | Live |
| Junior Jarvis Career | nexusblue-junior-jarvis-career | Discovery | Live |
