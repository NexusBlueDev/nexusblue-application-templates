/**
 * Junior Jarvis — Effects Module
 * Particles, confetti, emoji reactions, and sound effects.
 */
var JJ = window.JJ || {};

JJ.effects = {
  _audioCtx: null,

  init: function () {
    this.createParticles(25);
  },

  _ctx: function () {
    if (!this._audioCtx) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
    return this._audioCtx;
  },

  /* ========== Particles ========== */

  createParticles: function (count) {
    var c = document.createElement('div');
    c.className = 'particles';
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      p.style.left = (Math.random() * 100) + '%';
      p.style.animationDuration = (6 + Math.random() * 10) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      var s = 2 + Math.random() * 5;
      p.style.width = s + 'px'; p.style.height = s + 'px';
      var colors = ['rgba(0,255,255,0.6)', 'rgba(0,191,255,0.5)', 'rgba(100,200,255,0.4)', 'rgba(255,255,255,0.3)'];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.appendChild(p);
    }
    document.body.insertBefore(c, document.body.firstChild);
  },

  /* ========== Confetti ========== */

  confetti: function () {
    var c = document.createElement('div');
    c.className = 'confetti-container';
    var colors = ['#00FFFF', '#FFD700', '#FF6B6B', '#00FF88', '#FF69B4', '#7B68EE', '#FFA500'];
    for (var i = 0; i < 50; i++) {
      var p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = (30 + Math.random() * 40) + '%';
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      p.style.animationDuration = (1 + Math.random() * 1.5) + 's';
      var a = Math.random() * 360, d = 80 + Math.random() * 250;
      p.style.setProperty('--confetti-x', (Math.cos(a) * d) + 'px');
      p.style.setProperty('--confetti-y', (-60 - Math.random() * 350) + 'px');
      p.style.setProperty('--confetti-r', (Math.random() * 720 - 360) + 'deg');
      c.appendChild(p);
    }
    document.body.appendChild(c);
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 3500);
  },

  /* ========== Emoji Reactions ========== */

  emojiReaction: function (emoji) {
    var el = document.createElement('div');
    el.className = 'emoji-reaction';
    el.textContent = emoji;
    el.style.left = (35 + Math.random() * 30) + '%';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1500);
  },

  answerReaction: function (value) {
    var map = { 1: '👍', 0: '👎', 0.75: '🤔', 0.25: '😕' };
    var emoji = map[value] || '❓';
    this.emojiReaction(emoji);
  },

  /* ========== Sound Effects (Web Audio API) ========== */

  soundTap: function () {
    try {
      var ctx = this._ctx();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      o.type = 'sine';
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  },

  soundCorrect: function () {
    try {
      var ctx = this._ctx();
      [523, 659, 784].forEach(function (f, i) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        o.type = 'sine';
        var t = ctx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.start(t); o.stop(t + 0.25);
      });
    } catch (e) {}
  },

  soundWrong: function () {
    try {
      var ctx = this._ctx();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(350, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.25);
      o.type = 'sine';
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  },

  soundReveal: function () {
    try {
      var ctx = this._ctx();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(300, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
      o.type = 'triangle';
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }
};
