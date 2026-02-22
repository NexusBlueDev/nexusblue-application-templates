/**
 * NexusBlue Game Template — Service Worker
 * Network-first strategy: always serves fresh content when online,
 * falls back to cache when offline (expo booth scenario).
 *
 * IMPORTANT: When bumping the app version, update CACHE_NAME here
 * AND update all ?v=N query strings on <script>/<link> tags in index.html.
 */

var CACHE_NAME = '[APP-CACHE-NAME]-v1';  // e.g. 'nexusblue-jj-college-v1'
var ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'js/data.js',
  'js/engine.js',
  'js/speech.js',
  'js/effects.js',
  'js/ui.js',
  'js/metrics.js',
  'js/app.js',
  'manifest.json',
  'assets/icon-192.svg',
  'assets/icon-512.svg',
  'logo/NexusBlueLogo2white_backandblue_trans.png',
  'logo/background_jarvis_image.jpg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* Network-first: try fresh content, update cache, fall back to cached if offline */
self.addEventListener('fetch', function (event) {
  event.respondWith(
    fetch(event.request).then(function (response) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(event.request, clone);
      });
      return response;
    }).catch(function () {
      return caches.match(event.request);
    })
  );
});
