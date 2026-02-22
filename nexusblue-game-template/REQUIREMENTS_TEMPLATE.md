# NexusBlue Game Requirements Template
## Fill This Out Before Building — It Drives Everything

Complete every section below. The more specific your answers,
the fewer questions Claude will need to ask and the faster the build will be.

---

## 1. App Identity

```
App Name:           [e.g. "Junior Jarvis College"]
Short Name:         [e.g. "JJ College"]  (max 12 chars for home screen)
Tagline:            [e.g. "Find Your Perfect Major!"]
App ID:             [e.g. "com.nexusblue.juniorjarviscollege"]
GitHub Repo Name:   [e.g. "nexusblue-junior-jarvis-college"]
Description:        [1-2 sentences for app store listing]
Target Age Group:   [e.g. "Ages 10-14"]
```

---

## 2. Game Concept

```
What is being discovered/matched?
  [e.g. "College major", "Sports position", "Business type", "Planet"]

What does the player do?
  [e.g. "Answer questions about their interests and get matched to a college major"]

What does the end result show them?
  [e.g. "Their best college major + what careers it leads to + how AI impacts it"]

Is this a DISCOVERY tool (no confirmation needed) or a GUESSING game (player has answer in mind)?
  [ ] Discovery — we recommend a result based on answers
  [ ] Guessing  — player picks something and we try to guess it
```

---

## 3. Items (The Things Being Matched/Guessed)

List 6–10 items. More is better for accuracy but harder to balance.
**Recommended: 8 items.**

| # | Name | Emoji | One-sentence description (shown on card) |
|---|------|-------|------------------------------------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |

---

## 4. Properties (What Differentiates Items)

Choose 6–9 boolean properties (true/false) that distinguish items from each other.
**Rule: Every pair of items must differ on at least 2 properties.**

Suggested property types:
- Skills: analytical, creative, physical, technical, communicative
- Environment: indoor, outdoor, solo, team, travel
- Output: builds_things, helps_people, creates_content, finds_answers
- Style: structured, flexible, fast_paced, detail_oriented

```
Property 1: __________ (description: _______________)
Property 2: __________ (description: _______________)
Property 3: __________ (description: _______________)
Property 4: __________ (description: _______________)
Property 5: __________ (description: _______________)
Property 6: __________ (description: _______________)
Property 7: __________ (description: _______________)
Property 8: __________ (description: _______________)
```

**Property Matrix** — Mark T (true) or F (false) for each item:

|      | Prop1 | Prop2 | Prop3 | Prop4 | Prop5 | Prop6 | Prop7 | Prop8 |
|------|-------|-------|-------|-------|-------|-------|-------|-------|
| Item1 | | | | | | | | |
| Item2 | | | | | | | | |
| Item3 | | | | | | | | |
| Item4 | | | | | | | | |
| Item5 | | | | | | | | |
| Item6 | | | | | | | | |
| Item7 | | | | | | | | |
| Item8 | | | | | | | | |

---

## 5. Questions (What We Ask the Player)

Write 10–14 questions. Questions should feel like personality/interest questions,
NOT like "does your answer have property X?" questions.

**Good:** "Do you feel most alive when you're solving a tricky puzzle?"
**Bad:** "Are you analytical?"

For each balanced property (4 T and 4 F), write 2 questions from different angles.
For unbalanced properties, write 1 question.

| # | Question Text | Hint (shown below question) | Maps to Property |
|---|--------------|----------------------------|-----------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |
| 10 | | | |
| 11 | | | |
| 12 | | | |

---

## 6. End Screen Content

What do we show after the match is revealed?

```
Section 1 Title:    [e.g. "🤖 How AI Will Change This"]
Section 1 Content:  [Per-item paragraph — describe in general terms; Claude will write per item]

Section 2 Title:    [e.g. "⭐ Your Steps to Success"]
Section 2 Format:   [ ] Numbered steps (recommended)   [ ] Paragraph
Number of Steps:    [e.g. 5]
Step Focus:         [e.g. "Concrete actions a kid can take NOW to prepare for this path"]
```

For each item, if you have specific content in mind, note it here.
Otherwise Claude will generate it based on the item name and description.

---

## 7. Branding & Visual Style

```
Primary Color:      [hex, e.g. #46b3e6 — NexusBlue default]
Accent Color:       [hex, e.g. #fa7022 — NexusBlue orange]
Keep NexusBlue logo and background image?  [ ] Yes   [ ] No — use: __________
```

**Item Card Colors** (gradient pairs — provide or let Claude choose):
| Item | Color From | Color To |
|------|-----------|---------|
| Item 1 | | |
| Item 2 | | |
| Item 3 | | |
| Item 4 | | |
| Item 5 | | |
| Item 6 | | |
| Item 7 | | |
| Item 8 | | |

---

## 8. Copy & Voice

```
Welcome message (what Jarvis says on load):
  [1-3 sentences — keep simple, aimed at your target age group]

Start message (when game begins):
  [e.g. "Let's find out! Here's my first question!"]

Match reveal message:
  [e.g. "Based on your answers, your best match is..."]

Explore again button text:
  [e.g. "Try Again!", "Explore Again!", "Play Again!"]
```

---

## 9. Technical Settings

```
Minimum questions before reveal:    [recommended: 6–8]
Score lead required to reveal:      [recommended: 4–6 points]
GitHub Pages org:                   NexusBlueDev  (or override: _________)
Service worker cache name:          [e.g. "nexusblue-jj-college-v1"]
LocalStorage key:                   [e.g. "jj_college_metrics"]
```

---

## 10. Checklist Before Handing to Claude

- [ ] All 8 items have name, emoji, and description
- [ ] Property matrix is filled in and every item pair differs on ≥2 properties
- [ ] At least 10 questions written
- [ ] End screen content approach defined
- [ ] Brand colors chosen
- [ ] GitHub repo name decided
- [ ] App ID chosen (com.nexusblue.XXXX)
