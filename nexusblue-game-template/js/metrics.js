/**
 * NexusBlue Game Template — Metrics Module (js/metrics.js)
 * LocalStorage-based engagement tracking for expo booth analytics.
 *
 * ONLY CHANGE NEEDED: Update STORAGE_KEY to match your app.
 * e.g. 'jj_college_metrics', 'jj_planet_metrics', 'jj_sports_metrics'
 */
var JJ = window.JJ || {};

JJ.metrics = {
  STORAGE_KEY: '[APP-STORAGE-KEY]',  // e.g. 'jj_college_metrics'

  getData: function () {
    try {
      var raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupt data, reset */ }
    return { gamesStarted: 0, gamesCompleted: 0, correctGuesses: 0, startedAt: null };
  },

  save: function (data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* storage full or unavailable */ }
  },

  recordGameStart: function () {
    var data = this.getData();
    data.gamesStarted++;
    if (!data.startedAt) data.startedAt = new Date().toISOString();
    this.save(data);
    return data;
  },

  recordGameEnd: function (correct) {
    var data = this.getData();
    data.gamesCompleted++;
    if (correct) data.correctGuesses++;
    this.save(data);
    return data;
  },

  getPlayCount: function () {
    return this.getData().gamesStarted;
  },

  getSummary: function () {
    var data = this.getData();
    return {
      started: data.gamesStarted,
      completed: data.gamesCompleted,
      correct: data.correctGuesses,
      accuracy: data.gamesCompleted > 0
        ? Math.round((data.correctGuesses / data.gamesCompleted) * 100)
        : 0,
      since: data.startedAt
    };
  },

  reset: function () {
    this.save({ gamesStarted: 0, gamesCompleted: 0, correctGuesses: 0, startedAt: null });
  }
};
