/**
 * Junior Jarvis — Game Engine
 * Scoring-based elimination with intelligent question selection.
 *
 * AI-First Design: This module implements the local decision engine.
 * The app controller checks JJ.aiConfig.enabled to decide whether
 * to use this static engine or route through the AI provider.
 * Both paths share the same interface: selectQuestion() → processAnswer() → getGuess().
 */
var JJ = window.JJ || {};

JJ.engine = {
  scores: [],
  asked: new Set(),
  currentQuestionIndex: -1,

  reset: function () {
    this.scores = JJ.characters.map(function () { return 0; });
    this.asked = new Set();
    this.currentQuestionIndex = -1;
  },

  /**
   * Select the unasked question that produces the most balanced split
   * among characters that haven't been eliminated (score > threshold).
   * Returns question index, or -1 if no questions remain.
   */
  selectQuestion: function () {
    var bestSplit = Infinity;
    var bestIdx = -1;
    var self = this;

    JJ.questions.forEach(function (q, i) {
      if (self.asked.has(i)) return;

      var yesCount = 0;
      var noCount = 0;

      JJ.characters.forEach(function (c, ci) {
        if (self.scores[ci] < -3) return; // effectively eliminated
        if (c.props[q.prop]) yesCount++;
        else noCount++;
      });

      var split = Math.abs(yesCount - noCount);
      if (split < bestSplit) {
        bestSplit = split;
        bestIdx = i;
      }
    });

    this.currentQuestionIndex = bestIdx;
    if (bestIdx >= 0) this.asked.add(bestIdx);
    return bestIdx;
  },

  /**
   * Update character scores based on the player's answer.
   * Values: 1 = yes, 0 = no, 0.75 = probably, 0.25 = probably not, null = don't know
   */
  processAnswer: function (value) {
    if (this.currentQuestionIndex < 0) return;

    var prop = JJ.questions[this.currentQuestionIndex].prop;
    var self = this;

    JJ.characters.forEach(function (c, i) {
      var has = c.props[prop];
      if (value === 1) {
        self.scores[i] += has ? 2 : -2;
      } else if (value === 0) {
        self.scores[i] += has ? -2 : 2;
      } else if (value === 0.75) {
        self.scores[i] += has ? 1 : -0.5;
      } else if (value === 0.25) {
        self.scores[i] += has ? -0.5 : 1;
      }
      // null (don't know) → no score change
    });
  },

  /**
   * Determine if we have enough signal to reveal a career match.
   * Requires more questions for a fuller exploration before committing.
   */
  shouldGuess: function () {
    if (this.asked.size >= JJ.questions.length) return true;

    // Always ask at least 7 questions for a thorough exploration
    if (this.asked.size < 7) return false;

    var sorted = this.getSortedCharacters();
    var topScore = sorted[0].score;
    var secondScore = sorted.length > 1 ? sorted[1].score : -Infinity;
    var lead = topScore - secondScore;

    // Reveal when: very clear leader after 7+ questions
    if (lead >= 5) return true;
    if (this.asked.size >= 9 && lead >= 4) return true;

    return false;
  },

  getSortedCharacters: function () {
    return JJ.characters
      .map(function (c, i) { return { character: c, score: this.scores[i], index: i }; }.bind(this))
      .sort(function (a, b) { return b.score - a.score; });
  },

  getGuess: function () {
    return this.getSortedCharacters()[0].character;
  },

  getQuestionsAsked: function () {
    return this.asked.size;
  },

  getTotalQuestions: function () {
    return JJ.questions.length;
  }
};
