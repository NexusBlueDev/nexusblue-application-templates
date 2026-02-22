/**
 * Junior Jarvis — Speech Module
 * Text-to-speech only. Voice selection prioritizes natural male voices.
 */
var JJ = window.JJ || {};

JJ.speech = {
  synth: null,
  voice: null,

  init: function () {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;

      var self = this;
      var loadVoices = function () {
        var voices = self.synth.getVoices();
        var isNatural = function (v) { return v.name.indexOf('Natural') !== -1; };
        var isEnMale = function (v) { return v.lang.indexOf('en') === 0 && v.name.toLowerCase().indexOf('male') !== -1; };
        self.voice =
          // Tier 1: Edge Natural male voices (sound human)
          voices.find(function (v) { return isNatural(v) && v.name.indexOf('Guy') !== -1; }) ||
          voices.find(function (v) { return isNatural(v) && v.name.indexOf('Andrew') !== -1; }) ||
          voices.find(function (v) { return isNatural(v) && v.name.indexOf('Eric') !== -1; }) ||
          voices.find(function (v) { return isNatural(v) && v.name.indexOf('Davis') !== -1; }) ||
          voices.find(function (v) { return isNatural(v) && v.name.indexOf('Christopher') !== -1; }) ||
          voices.find(function (v) { return isNatural(v) && v.name.indexOf('Brian') !== -1; }) ||
          // Tier 2: Any Natural English voice
          voices.find(function (v) { return isNatural(v) && v.lang.indexOf('en') === 0; }) ||
          // Tier 3: Chrome's best male option
          voices.find(function (v) { return v.name === 'Google UK English Male'; }) ||
          // Tier 4: Any explicitly male English voice
          voices.find(function (v) { return isEnMale(v); }) ||
          // Tier 5: Named male voices
          voices.find(function (v) { return v.name.indexOf('David') !== -1 && v.lang === 'en-US'; }) ||
          voices.find(function (v) { return v.name.indexOf('Mark') !== -1 && v.lang === 'en-US'; }) ||
          voices.find(function (v) { return v.name.indexOf('Daniel') !== -1 && v.lang.indexOf('en') === 0; }) ||
          voices.find(function (v) { return v.name.indexOf('James') !== -1 && v.lang.indexOf('en') === 0; }) ||
          // Tier 6: Any English voice
          voices.find(function (v) { return v.lang === 'en-US'; }) ||
          voices.find(function (v) { return v.lang.indexOf('en') === 0; }) ||
          voices[0] || null;
        if (self.voice) console.log('JJ Voice:', self.voice.name, self.voice.lang);
      };
      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
    }
  },

  speak: function (text, onEnd) {
    if (!this.synth) { if (onEnd) onEnd(); return; }

    this.synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    if (this.voice) u.voice = this.voice;
    u.rate = 1.0;
    u.pitch = 1.0;
    if (onEnd) {
      var fired = false;
      var guard = function () { if (fired) return; fired = true; onEnd(); };
      u.onend = guard;
      u.onerror = guard;
    }
    this.synth.speak(u);
    this._keepAlive();
  },

  _keepAlive: function () {
    var self = this;
    if (this._keepAliveTimer) clearInterval(this._keepAliveTimer);
    this._keepAliveTimer = setInterval(function () {
      if (!self.synth || !self.synth.speaking) { clearInterval(self._keepAliveTimer); return; }
      self.synth.pause(); self.synth.resume();
    }, 10000);
  },

  cancelSpeech: function () {
    if (this.synth) this.synth.cancel();
    if (this._keepAliveTimer) clearInterval(this._keepAliveTimer);
  }
};
