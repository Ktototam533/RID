const CACHE_NAME = 'recipeBox-v1';
const urlsToCache = [
  '/rezeptid/',
  '/rezeptid/index.html'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {});
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      return caches.match('/rezeptid/index.html');
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});