# NexusBlue Game — Automated Claude Build Prompt

## How to Use This Template

1. Fill out `REQUIREMENTS_TEMPLATE.md` completely
2. Copy the prompt below into a new Claude Code session (or paste it at the start of a conversation)
3. Replace every `[PLACEHOLDER]` with values from your requirements doc
4. Claude will build the complete app with minimal back-and-forth

---

## The Prompt (copy everything below this line)

---

I want to build a new NexusBlue Junior Jarvis app. I have a completed requirements document.
Please build the app in full at this path:

**Target directory:** `[FULL PATH TO NEW APP DIRECTORY]`

Use the NexusBlue game template at:
`[FULL PATH TO application-templates/nexusblue-game-template]`

The template already contains:
- `js/engine.js` — copy as-is (scoring engine, no changes needed)
- `js/speech.js` — copy as-is (TTS wrapper, no changes needed)
- `js/effects.js` — copy as-is (particles/confetti/sounds, no changes needed)
- `logo/` — copy as-is (NexusBlue branding)
- `assets/` — copy as-is (PWA icons)

You will need to CREATE these files fresh based on the requirements:
- `index.html`
- `css/styles.css`
- `js/data.js`
- `js/ui.js`
- `js/app.js`
- `js/metrics.js`
- `manifest.json`
- `sw.js`
- `CLAUDE.md`

---

## App Identity

```
App Name:           [APP NAME]
Short Name:         [SHORT NAME — max 12 chars]
Tagline:            [TAGLINE]
App ID:             [com.nexusblue.XXXX]
GitHub Repo Name:   [nexusblue-XXXX]
GitHub Org:         NexusBlueDev
Description:        [1-2 sentence description]
Target Age Group:   [e.g. Ages 10-14]
```

---

## Game Type

```
Game Mode:          [DISCOVERY or GUESSING]

DISCOVERY: App asks questions → recommends the best match → shows extended end screen
GUESSING:  Player picks something → app asks yes/no questions → tries to guess it → player confirms

For DISCOVERY: DO NOT include any "Did I guess right?" confirmation step.
  - Show match as a confident recommendation: "Based on your interests, we think your best [thing] is..."
  - End screen shows [END SCREEN CONTENT]

For GUESSING: Include yes/no confirmation step after the guess.
  - If correct: show congratulations + facts
  - If wrong: show encouragement + let them try again
```

---

## Items (8 items)

These are the things being discovered/guessed. Each needs:
- `id` — lowercase, no spaces (e.g. `doctor`)
- `name` — display name
- `emoji` — single emoji
- `fact` — one sentence shown on card and match/guess screen
- `gradient` — array of 2 hex colors [from, to]
- `props` — boolean property values from matrix below

```
| # | ID | Name | Emoji | Fact | Gradient From | Gradient To |
|---|-----|------|-------|------|---------------|-------------|
| 1 | [id] | [NAME] | [EMOJI] | [FACT] | [#HEX] | [#HEX] |
| 2 | [id] | [NAME] | [EMOJI] | [FACT] | [#HEX] | [#HEX] |
| 3 | [id] | [NAME] | [EMOJI] | [FACT] | [#HEX] | [#HEX] |
| 4 | [id] | [NAME] | [EMOJI] | [FACT] | [#HEX] | [#HEX] |
| 5 | [id] | [NAME] | [EMOJI] | [FACT] | [#HEX] | [#HEX] |
| 6 | [id] | [NAME] | [EMOJI] | [FACT] | [#HEX] | [#HEX] |
| 7 | [id] | [NAME] | [EMOJI] | [FACT] | [#HEX] | [#HEX] |
| 8 | [id] | [NAME] | [EMOJI] | [FACT] | [#HEX] | [#HEX] |
```

---

## Properties (8 boolean properties)

These power the scoring engine. Every item pair must differ on ≥2 properties.

```
Property 1 name: [PROP1]  — description: [what it means]
Property 2 name: [PROP2]  — description: [what it means]
Property 3 name: [PROP3]  — description: [what it means]
Property 4 name: [PROP4]  — description: [what it means]
Property 5 name: [PROP5]  — description: [what it means]
Property 6 name: [PROP6]  — description: [what it means]
Property 7 name: [PROP7]  — description: [what it means]
Property 8 name: [PROP8]  — description: [what it means]
```

Property matrix (T = true, F = false):

```
|        | PROP1 | PROP2 | PROP3 | PROP4 | PROP5 | PROP6 | PROP7 | PROP8 |
|--------|-------|-------|-------|-------|-------|-------|-------|-------|
| Item1  |   T   |   F   |   T   |   F   |   F   |   T   |   F   |   T   |
| Item2  | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] |
| Item3  | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] |
| Item4  | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] |
| Item5  | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] |
| Item6  | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] |
| Item7  | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] |
| Item8  | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] | [T/F] |
```

---

## Questions (10–14 questions)

Questions MUST feel like personality/interest questions — NOT "do you have property X?" questions.

**Good:** "Do you feel most alive when you're solving a tricky puzzle?"
**Bad:** "Are you analytical?"

Each question maps to one property. For each property with 4T/4F balance, write 2 questions.

```
| # | Question Text | Hint | Maps to Property |
|---|--------------|------|-----------------|
| 1 | [QUESTION] | [HINT] | [PROP] |
| 2 | [QUESTION] | [HINT] | [PROP] |
| 3 | [QUESTION] | [HINT] | [PROP] |
| 4 | [QUESTION] | [HINT] | [PROP] |
| 5 | [QUESTION] | [HINT] | [PROP] |
| 6 | [QUESTION] | [HINT] | [PROP] |
| 7 | [QUESTION] | [HINT] | [PROP] |
| 8 | [QUESTION] | [HINT] | [PROP] |
| 9 | [QUESTION] | [HINT] | [PROP] |
| 10 | [QUESTION] | [HINT] | [PROP] |
| 11 | [QUESTION] | [HINT] | [PROP] |
| 12 | [QUESTION] | [HINT] | [PROP] |
```

---

## End Screen Content (DISCOVERY mode only — skip if GUESSING mode)

For each item, provide:
- `aiImpact` — 2-3 sentence paragraph: how AI/technology will change this [thing]
- `aiSuccessSteps` — array of exactly 5 strings: concrete action steps the player can take NOW

If you don't provide per-item content, Claude will generate it based on the item name and description.

```
Section 1 Title: [e.g. "🤖 How AI Will Change This"]
Section 2 Title: [e.g. "⭐ Your Steps to Success"]
Number of steps: [5]
```

Per-item content (optional — leave blank to let Claude generate):

```
Item 1 ([NAME]):
  aiImpact: [paragraph or blank]
  Steps: [5 steps or blank]

Item 2 ([NAME]):
  aiImpact: [paragraph or blank]
  Steps: [5 steps or blank]

[... repeat for all 8 items ...]
```

---

## Copy & Voice

```
Welcome message:      [What Jarvis says on load — 1-3 sentences]
Start message:        [When game begins — e.g. "Let's find out! Here's my first question!"]
Match reveal prefix:  [e.g. "Based on your interests, your best match is..."]
Match confirm:        [e.g. "This career fits your personality and what you love!"]
Explore again button: [e.g. "Try Again!", "Explore Again!", "Play Again!"]
```

---

## Branding

```
Primary Color:   [hex — default #46b3e6]
Accent Color:    [hex — default #fa7022]
Keep NexusBlue logo and background image? [YES or NO]
```

---

## Technical Settings

```
Minimum questions before reveal:  [recommended 6–8]
Score lead required to reveal:    [recommended 4–6]
Service Worker cache name:        [e.g. "nexusblue-jj-XXXX-v1"]
LocalStorage key:                 [e.g. "jj_XXXX_metrics"]
Version:                          1
```

---

## Build Instructions for Claude

With the above requirements, please:

1. **Create the GitHub repository** at `github.com/NexusBlueDev/[REPO NAME]` using the `gh` CLI
2. **Copy unchanged files** from the template: `js/engine.js`, `js/speech.js`, `js/effects.js`, `logo/`, `assets/`
3. **Write all new files** from scratch using the requirements above:
   - `index.html` — follow the Career app structure with screens for: welcome (with item gallery), game (questions), match/reveal, [end screen if DISCOVERY mode]
   - `css/styles.css` — NexusBlue glassmorphism style, match the Career app visual language
   - `js/data.js` — items array + questions array + messages object, matching the schema below
   - `js/ui.js` — DOM manager for all screens
   - `js/app.js` — game flow controller
   - `js/metrics.js` — LocalStorage analytics
   - `manifest.json` — PWA config
   - `sw.js` — service worker (network-first, cache v1)
   - `CLAUDE.md` — project instructions for future Claude sessions
4. **Enable GitHub Pages** on the repo (source: main branch, root)
5. **Commit and push** all files to GitHub

### data.js Schema

```javascript
JJ.characters = [
  {
    id: 'item_id',
    name: 'Display Name',
    emoji: '🎯',
    fact: 'One-sentence description shown on card.',
    gradient: ['#HEX1', '#HEX2'],
    // DISCOVERY mode only:
    aiImpact: 'How AI will change this...',
    aiSuccessSteps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
    props: {
      prop1: true,
      prop2: false,
      // ... all 8 props
    }
  }
];

JJ.questions = [
  {
    id: 'unique_question_id',
    text: 'The question text?',
    hint: 'Supporting hint shown below question.',
    prop: 'prop_name'
  }
];

JJ.messages = {
  welcome: '...',
  start: '...',
  matchPrefix: '...',
  matchConfirm: '...',
  // GUESSING mode also needs:
  correct: '...',
  wrong: '...',
  encourageRetry: '...'
};
```

### Game Flow by Mode

**DISCOVERY mode:**
Welcome → [browse items] → Start → Questions → Career Match (direct reveal, no confirmation) → End Screen (AI impact + steps) → Explore Again

**GUESSING mode:**
Welcome → [browse items] → Start → Questions → Guess Screen → Player confirms YES/NO → Result Screen → Play Again

### Critical Rules
- Global namespace: `JJ` (window.JJ)
- ES5 JavaScript — no arrow functions, no `let`/`const`, no template literals, no modules
- No external dependencies
- All DOM manipulation through `JJ.ui` — never direct DOM in `app.js`
- Speech through `JJ.speech`
- ALWAYS commit and push to GitHub before considering the task complete
- When bumping versions: update `?v=N` on ALL script/link tags in `index.html` AND bump `CACHE_NAME` in `sw.js`
- Engine min questions: [MINIMUM QUESTIONS], lead required: [SCORE LEAD]

---

*End of build prompt. Fill in all [PLACEHOLDERS] and paste into Claude Code.*
