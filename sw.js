// Назва кешу
const CACHE_NAME = 'recipeBox-v1';
const urlsToCache = [
  '/RID/',
  '/RID/index.html',
  '/rezeptid/manifest.json'
];

// Встановлення Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache відкритий');
      return cache.addAll(urlsToCache);
    })
  );
});

// Обслуговування запитів
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Повернути з кешу, якщо є
      if (response) {
        return response;
      }
      // Інакше завантажити з мережі
      return fetch(event.request).catch(() => {
        // Якщо онлайну немає, повернути кешований файл
        return caches.match('/rezeptid/index.html');
      });
    })
  );
});

// Активація Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Видалення старого кешу:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});