/**
 * NexusBlue Game Template — UI Module (js/ui.js)
 * DOM manipulation, screen management, orb states, item gallery.
 *
 * DISCOVERY MODE: Uses screens welcome → game → match → future
 * GUESSING MODE:  Uses screens welcome → game → guess → result
 *                 (update this.screens and add showGuess/showResult methods)
 *
 * To customize: update buildItemGallery(), showMatch(), showFuture() for your items.
 * The orb, progress dots, and answer buttons work as-is — no changes needed.
 */
var JJ = window.JJ || {};

JJ.ui = {
  screens: {},
  answerBtns: [],
  orbEls: [],

  init: function () {
    // DISCOVERY MODE screens:
    this.screens = {
      welcome: document.getElementById('screen-welcome'),
      game:    document.getElementById('screen-game'),
      match:   document.getElementById('screen-match'),
      future:  document.getElementById('screen-future')
    };

    // GUESSING MODE screens (replace above with):
    // this.screens = {
    //   welcome: document.getElementById('screen-welcome'),
    //   game:    document.getElementById('screen-game'),
    //   guess:   document.getElementById('screen-guess'),
    //   result:  document.getElementById('screen-result')
    // };

    this.answerBtns = [
      document.getElementById('btn-yes'),
      document.getElementById('btn-no'),
      document.getElementById('btn-probably'),
      document.getElementById('btn-probably-not'),
      document.getElementById('btn-uncertain')
    ];
    this.orbEls = document.querySelectorAll('.orb-wrapper');

    this.buildItemGallery();
    this.buildProgressDots();
  },

  /**
   * Build the item preview gallery on the welcome screen.
   * Each item card shows emoji + name. Clicking opens a preview modal.
   */
  buildItemGallery: function () {
    var container = document.getElementById('item-gallery');
    if (!container) return;
    var self = this;
    JJ.characters.forEach(function (c) {
      var item = document.createElement('div');
      item.className = 'gallery-item';
      item.style.background = 'linear-gradient(135deg, ' + c.gradient[0] + ', ' + c.gradient[1] + ')';
      item.innerHTML = '<span class="gallery-emoji">' + c.emoji + '</span>' +
                       '<span class="gallery-name">' + c.name + '</span>' +
                       '<span class="gallery-click">(click me)</span>';
      item.addEventListener('click', function () { self.showItemPreview(c); });
      container.appendChild(item);
    });
  },

  /**
   * Show a modal overlay with item details when a gallery card is clicked.
   */
  showItemPreview: function (item) {
    var existing = document.getElementById('character-preview-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'character-preview-overlay';
    overlay.className = 'character-preview-overlay';

    var card = document.createElement('div');
    card.className = 'character-card glass-card';
    card.style.background = 'linear-gradient(135deg, ' + item.gradient[0] + ', ' + item.gradient[1] + ')';

    var emoji = document.createElement('div');
    emoji.className = 'character-emoji';
    emoji.textContent = item.emoji;

    var name = document.createElement('h2');
    name.className = 'character-name';
    name.textContent = item.name;

    var fact = document.createElement('p');
    fact.className = 'character-fact';
    fact.textContent = item.fact;

    var close = document.createElement('button');
    close.className = 'btn preview-close';
    close.textContent = 'Got it!';

    card.appendChild(emoji);
    card.appendChild(name);
    card.appendChild(fact);
    card.appendChild(close);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var dismiss = function () { JJ.speech.cancelSpeech(); overlay.remove(); };
    close.addEventListener('click', dismiss);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) dismiss();
    });

    JJ.speech.speak(item.name + '. ' + item.fact);
  },

  /**
   * Build progress dots — one dot per question.
   */
  buildProgressDots: function () {
    var container = document.getElementById('progress-dots');
    if (!container) return;
    for (var i = 0; i < JJ.questions.length; i++) {
      var dot = document.createElement('div');
      dot.className = 'progress-dot';
      container.appendChild(dot);
    }
  },

  showScreen: function (name) {
    var screens = this.screens;
    Object.keys(screens).forEach(function (key) {
      if (screens[key]) {
        screens[key].classList.toggle('hidden', key !== name);
        if (key === name) screens[key].classList.add('fade-in');
      }
    });
    // Scroll to top on screens that can overflow
    if ((name === 'future' || name === 'welcome') && screens[name]) {
      screens[name].scrollTop = 0;
    }
  },

  setQuestion: function (text) {
    var el = document.getElementById('question-text');
    if (el) el.textContent = text;
  },

  setQuestionHint: function (text) {
    var el = document.getElementById('question-hint');
    if (el) el.textContent = text;
  },

  updateProgress: function (current, total) {
    var dots = document.querySelectorAll('.progress-dot');
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('filled', i < current);
    }
    var counter = document.getElementById('question-counter');
    if (counter && current > 0) {
      counter.textContent = 'Question ' + current + ' of ' + total;
    } else if (counter) {
      counter.textContent = '';
    }
  },

  setAnswerButtonsEnabled: function (enabled) {
    this.answerBtns.forEach(function (btn) { if (btn) btn.disabled = !enabled; });
  },

  // ---------------------------------------------------------------------------
  // DISCOVERY MODE: Match screen
  // ---------------------------------------------------------------------------

  /**
   * Populate the match screen with the recommended item.
   */
  showMatch: function (item) {
    var emoji = document.getElementById('match-emoji');
    var name  = document.getElementById('match-name');
    var fact  = document.getElementById('match-fact');
    var card  = document.getElementById('match-card');
    if (emoji) emoji.textContent = item.emoji;
    if (name)  name.textContent  = item.name;
    if (fact)  fact.textContent  = item.fact;
    if (card)  card.style.background = 'linear-gradient(135deg, ' + item.gradient[0] + ', ' + item.gradient[1] + ')';
  },

  /**
   * Populate the AI Future / end screen.
   * Renders aiSuccessSteps as a numbered <ol> list.
   */
  showFuture: function (item) {
    var titleName = document.getElementById('future-title-name');
    var emoji     = document.getElementById('future-emoji');
    var name      = document.getElementById('future-name');
    var impact    = document.getElementById('future-ai-impact');
    var stepsList = document.getElementById('future-ai-steps');
    var card      = document.getElementById('future-card');

    if (titleName) titleName.textContent = item.name;
    if (emoji)     emoji.textContent     = item.emoji;
    if (name)      name.textContent      = item.name;
    if (impact)    impact.textContent    = item.aiImpact;
    if (card)      card.style.background = 'linear-gradient(135deg, ' + item.gradient[0] + ', ' + item.gradient[1] + ')';

    if (stepsList) {
      stepsList.innerHTML = '';
      var steps = item.aiSuccessSteps || [];
      steps.forEach(function (step) {
        var li = document.createElement('li');
        li.className = 'ai-step-item';
        li.textContent = step;
        stepsList.appendChild(li);
      });
    }
  },

  // ---------------------------------------------------------------------------
  // GUESSING MODE: Guess + Result screens
  // (Remove showMatch/showFuture above and use these instead)
  // ---------------------------------------------------------------------------

  // showGuess: function (item) {
  //   var emoji = document.getElementById('guess-emoji');
  //   var name  = document.getElementById('guess-name');
  //   var fact  = document.getElementById('guess-fact');
  //   var card  = document.getElementById('guess-card');
  //   if (emoji) emoji.textContent = item.emoji;
  //   if (name)  name.textContent  = item.name;
  //   if (fact)  fact.textContent  = item.fact;
  //   if (card)  card.style.background = 'linear-gradient(135deg, ' + item.gradient[0] + ', ' + item.gradient[1] + ')';
  // },

  // showResult: function (correct, item) {
  //   var resultCorrect = document.getElementById('result-correct');
  //   var resultWrong   = document.getElementById('result-wrong');
  //   if (resultCorrect) resultCorrect.classList.toggle('hidden', !correct);
  //   if (resultWrong)   resultWrong.classList.toggle('hidden', correct);
  //   if (correct && item) {
  //     var card = document.getElementById('result-card');
  //     if (card) {
  //       card.innerHTML = '<div class="character-emoji">' + item.emoji + '</div>' +
  //                        '<h2 class="character-name">' + item.name + '</h2>' +
  //                        '<p class="character-fact">' + item.fact + '</p>';
  //       card.style.background = 'linear-gradient(135deg, ' + item.gradient[0] + ', ' + item.gradient[1] + ')';
  //     }
  //   }
  // },

  // ---------------------------------------------------------------------------

  updateMetrics: function (count) {
    var el = document.getElementById('play-count');
    if (el) el.textContent = count;
  },

  setOrbState: function (state) {
    var states = ['idle', 'speaking', 'thinking', 'celebrating'];
    for (var i = 0; i < this.orbEls.length; i++) {
      var el = this.orbEls[i];
      for (var j = 0; j < states.length; j++) {
        el.classList.toggle('orb-' + states[j], states[j] === state);
      }
    }
  }
};
