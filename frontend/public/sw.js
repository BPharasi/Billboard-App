const CACHE_NAME = 'billboard-cache-v1';
const RUNTIME = 'runtime';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/api/billboards' // Cache billboard API response
];

// Install - precache app shell if you have a precache list
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch - try cache first for uploads, then network and cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // handle uploaded images caching: any request path containing /uploads/
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return caches.open(CACHE_NAME).then((cache) =>
          fetch(event.request)
            .then((response) => {
              // only cache successful responses
              if (response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // fallback: you might return a placeholder from cache if precached
              return caches.match('/placeholder.jpg');
            })
        );
      })
    );
    return;
  }

  // Default: network-first for other requests (adjust to your need)
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
