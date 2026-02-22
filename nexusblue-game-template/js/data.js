/**
 * NexusBlue Game Template — Data Module (js/data.js)
 *
 * Replace ALL placeholder content with your actual game data.
 * This file is the ONLY file that changes for each new game concept.
 * engine.js, speech.js, and effects.js never need to change.
 *
 * AI-First Design: Static dataset serves as the offline fallback.
 * JJ.aiConfig at the bottom is the hook point for Claude API integration.
 *
 * Property matrix (min 2 diffs between any pair — verify before building):
 *  [PROP1] [PROP2] [PROP3] [PROP4] [PROP5] [PROP6] [PROP7] [PROP8]
 * 1  T       F       T       F       F       T       F       T      [ITEM1]
 * 2  F       T       F       F       T       F       F       F      [ITEM2]
 * 3  F       F       T       T       F       T       F       F      [ITEM3]
 * 4  F       T       F       F       F       T       F       F      [ITEM4]
 * 5  T       F       F       F       F       F       T       F      [ITEM5]
 * 6  F       T       T       F       F       T       F       T      [ITEM6]
 * 7  T       F       F       F       T       F       F       F      [ITEM7]
 * 8  F       F       T       T       F       F       F       T      [ITEM8]
 */
var JJ = window.JJ || {};

// ---------------------------------------------------------------------------
// Characters / Items
// Each object represents one thing being discovered or guessed.
//
// Required fields for ALL game modes:
//   id        — lowercase, no spaces, used internally
//   name      — display name shown on cards and screens
//   emoji     — single emoji shown on card
//   fact      — 1-2 sentence description shown on gallery card + match screen
//   gradient  — [fromColor, toColor] hex strings for card background
//   props     — object with boolean values for each property (see matrix above)
//
// Additional fields for DISCOVERY mode (AI future / end screen):
//   aiImpact      — paragraph: how AI/technology will change this (2-3 sentences)
//   aiSuccessSteps — array of exactly 5 strings: concrete action steps
// ---------------------------------------------------------------------------

JJ.characters = [
  {
    id: 'item1',
    name: '[Item 1 Name]',
    emoji: '[EMOJI]',
    fact: '[One to two sentence description of this item — shown on cards and match screen.]',
    gradient: ['#00ACC1', '#006064'],
    // DISCOVERY MODE — remove these two fields for GUESSING mode:
    aiImpact: '[2-3 sentences: how AI/automation/technology will change this item or career.]',
    aiSuccessSteps: [
      '[Step 1 — a concrete action this kid can take NOW to prepare or succeed]',
      '[Step 2]',
      '[Step 3]',
      '[Step 4]',
      '[Step 5]'
    ],
    props: { prop1: true, prop2: false, prop3: true, prop4: false, prop5: false, prop6: true, prop7: false, prop8: true }
  },
  {
    id: 'item2',
    name: '[Item 2 Name]',
    emoji: '[EMOJI]',
    fact: '[One to two sentence description.]',
    gradient: ['#FF5722', '#E91E63'],
    aiImpact: '[AI impact paragraph.]',
    aiSuccessSteps: ['[Step 1]', '[Step 2]', '[Step 3]', '[Step 4]', '[Step 5]'],
    props: { prop1: false, prop2: true, prop3: false, prop4: false, prop5: true, prop6: false, prop7: false, prop8: false }
  },
  {
    id: 'item3',
    name: '[Item 3 Name]',
    emoji: '[EMOJI]',
    fact: '[One to two sentence description.]',
    gradient: ['#7C4DFF', '#311B92'],
    aiImpact: '[AI impact paragraph.]',
    aiSuccessSteps: ['[Step 1]', '[Step 2]', '[Step 3]', '[Step 4]', '[Step 5]'],
    props: { prop1: false, prop2: false, prop3: true, prop4: true, prop5: false, prop6: true, prop7: false, prop8: false }
  },
  {
    id: 'item4',
    name: '[Item 4 Name]',
    emoji: '[EMOJI]',
    fact: '[One to two sentence description.]',
    gradient: ['#00C853', '#00695C'],
    aiImpact: '[AI impact paragraph.]',
    aiSuccessSteps: ['[Step 1]', '[Step 2]', '[Step 3]', '[Step 4]', '[Step 5]'],
    props: { prop1: false, prop2: true, prop3: false, prop4: false, prop5: false, prop6: true, prop7: false, prop8: false }
  },
  {
    id: 'item5',
    name: '[Item 5 Name]',
    emoji: '[EMOJI]',
    fact: '[One to two sentence description.]',
    gradient: ['#FFB300', '#E65100'],
    aiImpact: '[AI impact paragraph.]',
    aiSuccessSteps: ['[Step 1]', '[Step 2]', '[Step 3]', '[Step 4]', '[Step 5]'],
    props: { prop1: true, prop2: false, prop3: false, prop4: false, prop5: false, prop6: false, prop7: true, prop8: false }
  },
  {
    id: 'item6',
    name: '[Item 6 Name]',
    emoji: '[EMOJI]',
    fact: '[One to two sentence description.]',
    gradient: ['#546E7A', '#1565C0'],
    aiImpact: '[AI impact paragraph.]',
    aiSuccessSteps: ['[Step 1]', '[Step 2]', '[Step 3]', '[Step 4]', '[Step 5]'],
    props: { prop1: false, prop2: true, prop3: true, prop4: false, prop5: false, prop6: true, prop7: false, prop8: true }
  },
  {
    id: 'item7',
    name: '[Item 7 Name]',
    emoji: '[EMOJI]',
    fact: '[One to two sentence description.]',
    gradient: ['#FF7043', '#BF360C'],
    aiImpact: '[AI impact paragraph.]',
    aiSuccessSteps: ['[Step 1]', '[Step 2]', '[Step 3]', '[Step 4]', '[Step 5]'],
    props: { prop1: true, prop2: false, prop3: false, prop4: false, prop5: true, prop6: false, prop7: false, prop8: false }
  },
  {
    id: 'item8',
    name: '[Item 8 Name]',
    emoji: '[EMOJI]',
    fact: '[One to two sentence description.]',
    gradient: ['#43A047', '#1B5E20'],
    aiImpact: '[AI impact paragraph.]',
    aiSuccessSteps: ['[Step 1]', '[Step 2]', '[Step 3]', '[Step 4]', '[Step 5]'],
    props: { prop1: false, prop2: false, prop3: true, prop4: true, prop5: false, prop6: false, prop7: false, prop8: true }
  }
];

// ---------------------------------------------------------------------------
// Questions
//
// CRITICAL: Questions MUST feel like personality/interest questions.
// They should NOT directly reveal which item they map to.
//
// Good: "Do you feel most alive when you're solving a tricky puzzle?"
// Bad:  "Are you analytical?"
//
// Phase 1: Broad lifestyle questions (most balanced, asked earliest)
// Phase 2: Specific interest questions (narrow the field)
// Phase 3: Refinement questions (break close ties)
//
// For each property with 4T/4F balance → write 2 questions from different angles.
// For unbalanced properties → write 1 question.
// ---------------------------------------------------------------------------

JJ.questions = [
  // Phase 1: Broad lifestyle
  { id: 'q1',  text: '[Question 1 — broad personality/lifestyle question]',  hint: '[Supporting hint — 1 short sentence]',  prop: 'prop1' },
  { id: 'q2',  text: '[Question 2]',  hint: '[Hint]',  prop: 'prop2' },
  { id: 'q3',  text: '[Question 3]',  hint: '[Hint]',  prop: 'prop3' },
  { id: 'q4',  text: '[Question 4]',  hint: '[Hint]',  prop: 'prop4' },

  // Phase 2: Specific interests
  { id: 'q5',  text: '[Question 5]',  hint: '[Hint]',  prop: 'prop5' },
  { id: 'q6',  text: '[Question 6]',  hint: '[Hint]',  prop: 'prop6' },
  { id: 'q7',  text: '[Question 7]',  hint: '[Hint]',  prop: 'prop7' },
  { id: 'q8',  text: '[Question 8]',  hint: '[Hint]',  prop: 'prop8' },

  // Phase 3: Refinement (2nd question per balanced property)
  { id: 'q9',  text: '[Question 9 — 2nd angle on prop1]',   hint: '[Hint]',  prop: 'prop1' },
  { id: 'q10', text: '[Question 10 — 2nd angle on prop2]',  hint: '[Hint]',  prop: 'prop2' },
  { id: 'q11', text: '[Question 11 — 2nd angle on prop3]',  hint: '[Hint]',  prop: 'prop3' },
  { id: 'q12', text: '[Question 12 — 2nd angle on prop6]',  hint: '[Hint]',  prop: 'prop6' }
];

// ---------------------------------------------------------------------------
// Messages — what Jarvis says at each stage
// ---------------------------------------------------------------------------

JJ.messages = {
  welcome:        '[Welcome message — 1-3 sentences. Friendly, aimed at your target age group.]',
  start:          '[Start message — when game begins. e.g. "Let\'s find out! Here\'s my first question!"]',
  matchPrefix:    '[Match reveal prefix — e.g. "Based on your answers, your best match is..."]',
  matchConfirm:   '[Match confirm text — e.g. "This fits your personality really well!"]',
  futureIntro:    '[End screen intro text — e.g. "Here\'s what your future could look like!"]',
  encourageRetry: '[Explore again message — e.g. "Want to explore again? Try answering differently!"]'
  // GUESSING MODE: also add:
  // correct:     '[Correct guess celebration text]',
  // wrong:       '[Wrong guess recovery text]'
};

/**
 * AI Provider Configuration (AI-First Design)
 * When configured, the engine uses AI for dynamic questioning.
 * Falls back to static decision tree when offline or unconfigured.
 */
JJ.aiConfig = {
  enabled: false,
  provider: null,
  endpoint: null,
  apiKey: null,
  model: null,
  systemPrompt: '[System prompt for the AI provider — describe the game, list the items, explain the goal]'
};
