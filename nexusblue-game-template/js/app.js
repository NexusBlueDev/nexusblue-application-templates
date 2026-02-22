/**
 * NexusBlue Game Template — Application Controller (js/app.js)
 *
 * DISCOVERY MODE flow:
 *   Welcome → Questions → Match (direct reveal) → End Screen → Restart
 *
 * GUESSING MODE flow (see commented sections):
 *   Welcome → Questions → Guess → Player Confirms → Result → Restart
 *
 * Key rules:
 * - ES5 only (no arrow functions, no let/const, no template literals)
 * - All DOM through JJ.ui — never direct DOM here
 * - All speech through JJ.speech
 */
var JJ = window.JJ || {};

JJ.app = {
  state: 'welcome',
  _answerLock: false,
  _currentItem: null,

  init: function () {
    JJ.speech.init();
    JJ.ui.init();
    JJ.effects.init();
    JJ.ui.updateMetrics(JJ.metrics.getPlayCount());
    JJ.ui.showScreen('welcome');
    JJ.ui.setOrbState('idle');

    this.bindEvents();
    this._setupTapOverlay();
  },

  _setupTapOverlay: function () {
    var overlay = document.getElementById('tap-overlay');
    if (!overlay) return;
    var self = this;
    var handler = function () {
      overlay.classList.add('hidden');
      overlay.removeEventListener('click', handler);
      JJ.ui.setOrbState('speaking');
      JJ.speech.speak(JJ.messages.welcome, function () {
        JJ.ui.setOrbState('idle');
      });
    };
    overlay.addEventListener('click', handler);
  },

  bindEvents: function () {
    var self = this;

    // Welcome screen
    document.getElementById('btn-start').addEventListener('click', function () { self.startGame(); });

    // Answer buttons
    document.getElementById('btn-yes').addEventListener('click', function () { self.answer(1); });
    document.getElementById('btn-no').addEventListener('click', function () { self.answer(0); });
    document.getElementById('btn-probably').addEventListener('click', function () { self.answer(0.75); });
    document.getElementById('btn-probably-not').addEventListener('click', function () { self.answer(0.25); });
    document.getElementById('btn-uncertain').addEventListener('click', function () { self.answer(null); });

    // DISCOVERY MODE buttons:
    document.getElementById('btn-see-future').addEventListener('click', function () { self.showFuture(); });
    document.getElementById('btn-future-play-again').addEventListener('click', function () { self.restart(); });

    // GUESSING MODE buttons (uncomment and replace above):
    // document.getElementById('btn-correct').addEventListener('click', function () { self.feedback(true); });
    // document.getElementById('btn-wrong').addEventListener('click', function () { self.feedback(false); });
    // document.getElementById('btn-result-play-again').addEventListener('click', function () { self.restart(); });

    // Start Over links (shared across all screens)
    var restartLinks = document.querySelectorAll('.btn-restart-link');
    for (var i = 0; i < restartLinks.length; i++) {
      restartLinks[i].addEventListener('click', function () { self.restart(); });
    }
  },

  startGame: function () {
    if (this.state === 'playing') return;
    this.state = 'playing';
    this._answerLock = false;
    this._currentItem = null;
    JJ.engine.reset();
    JJ.metrics.recordGameStart();
    JJ.ui.updateMetrics(JJ.metrics.getPlayCount());
    JJ.ui.showScreen('game');
    JJ.ui.updateProgress(0, JJ.engine.getTotalQuestions());
    JJ.effects.soundTap();

    var self = this;
    JJ.ui.setOrbState('speaking');
    JJ.speech.speak(JJ.messages.start, function () {
      JJ.ui.setOrbState('thinking');
      setTimeout(function () { self.askQuestion(); }, 400);
    });
  },

  askQuestion: function () {
    if (this.state !== 'playing') return;
    this._answerLock = false;

    if (JJ.engine.shouldGuess()) { this.revealResult(); return; }
    var qIdx = JJ.engine.selectQuestion();
    if (qIdx < 0) { this.revealResult(); return; }

    var question = JJ.questions[qIdx];
    JJ.ui.setQuestion(question.text);
    JJ.ui.setQuestionHint(question.hint);
    JJ.ui.updateProgress(JJ.engine.getQuestionsAsked(), JJ.engine.getTotalQuestions());
    JJ.ui.setAnswerButtonsEnabled(true);

    var self = this;
    JJ.ui.setOrbState('speaking');
    JJ.speech.cancelSpeech();
    JJ.speech.speak(question.text, function () {
      if (self._answerLock) return;
      JJ.ui.setOrbState('idle');
    });
  },

  answer: function (value) {
    if (this.state !== 'playing') return;
    if (this._answerLock) return;
    this._answerLock = true;

    JJ.ui.setAnswerButtonsEnabled(false);
    JJ.speech.cancelSpeech();
    JJ.effects.soundTap();
    JJ.effects.answerReaction(value);
    JJ.ui.setOrbState('thinking');
    JJ.engine.processAnswer(value);

    var self = this;
    setTimeout(function () { self.askQuestion(); }, 600);
  },

  // ---------------------------------------------------------------------------
  // DISCOVERY MODE: Direct reveal — no yes/no confirmation
  // ---------------------------------------------------------------------------

  revealResult: function () {
    this.state = 'match';
    this._answerLock = false;
    JJ.speech.cancelSpeech();

    var item = JJ.engine.getGuess();
    this._currentItem = item;

    JJ.metrics.recordGameEnd(true);
    JJ.effects.soundReveal();
    JJ.effects.confetti();
    JJ.ui.showScreen('match');
    JJ.ui.showMatch(item);
    JJ.ui.setOrbState('celebrating');

    var speech = JJ.messages.matchPrefix + item.name + '! ' + JJ.messages.matchConfirm;
    JJ.speech.speak(speech, function () { JJ.ui.setOrbState('idle'); });
  },

  showFuture: function () {
    this.state = 'future';
    JJ.speech.cancelSpeech();
    JJ.effects.soundTap();
    JJ.ui.showScreen('future');
    JJ.ui.showFuture(this._currentItem);
    JJ.ui.setOrbState('speaking');

    var itemName = this._currentItem ? this._currentItem.name : 'this';
    var speech = 'Here\'s what your future could look like as a ' + itemName + '! ' + JJ.messages.futureIntro;
    JJ.speech.speak(speech, function () { JJ.ui.setOrbState('idle'); });
  },

  // ---------------------------------------------------------------------------
  // GUESSING MODE: Guess → confirmation → result
  // (Remove revealResult/showFuture above and use these instead)
  // ---------------------------------------------------------------------------

  // revealResult: function () {
  //   this.state = 'guessing';
  //   this._answerLock = false;
  //   JJ.speech.cancelSpeech();

  //   var item = JJ.engine.getGuess();
  //   this._currentItem = item;

  //   JJ.effects.soundReveal();
  //   JJ.ui.showScreen('guess');
  //   JJ.ui.showGuess(item);
  //   JJ.ui.setOrbState('celebrating');

  //   var speech = 'I think your ' + '[ITEM TYPE]' + ' is... ' + item.name + '! Am I right?';
  //   JJ.speech.speak(speech, function () { JJ.ui.setOrbState('idle'); });
  // },

  // feedback: function (correct) {
  //   this.state = 'result';
  //   JJ.speech.cancelSpeech();
  //   JJ.effects.soundTap();
  //   JJ.metrics.recordGameEnd(correct);

  //   if (correct) {
  //     JJ.effects.confetti();
  //     JJ.speech.speak(JJ.messages.correct, function () { JJ.ui.setOrbState('idle'); });
  //   } else {
  //     JJ.speech.speak(JJ.messages.wrong, function () { JJ.ui.setOrbState('idle'); });
  //   }

  //   JJ.ui.showScreen('result');
  //   JJ.ui.showResult(correct, this._currentItem);
  //   JJ.ui.setOrbState(correct ? 'celebrating' : 'thinking');
  // },

  // ---------------------------------------------------------------------------

  restart: function () {
    this.state = 'welcome';
    this._answerLock = false;
    this._currentItem = null;

    // CRITICAL: Fully reset engine and clear UI state before returning to welcome.
    // Without this, the first question will be broken on restart.
    JJ.engine.reset();
    JJ.speech.cancelSpeech();
    JJ.effects.soundTap();

    JJ.ui.setQuestion('');
    JJ.ui.setQuestionHint('');
    JJ.ui.setAnswerButtonsEnabled(true);
    JJ.ui.updateProgress(0, JJ.engine.getTotalQuestions());

    JJ.ui.showScreen('welcome');
    JJ.ui.updateMetrics(JJ.metrics.getPlayCount());
    JJ.ui.setOrbState('idle');

    setTimeout(function () {
      JJ.ui.setOrbState('speaking');
      JJ.speech.speak(JJ.messages.welcome, function () { JJ.ui.setOrbState('idle'); });
    }, 300);
  }
};

document.addEventListener('DOMContentLoaded', function () { JJ.app.init(); });
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (reg) { reg.update(); });
    });
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}
