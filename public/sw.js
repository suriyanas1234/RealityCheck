// RealityCheck Service Worker
// Enables PWA offline caching and local high-priority notifications.

const CACHE_NAME = 'realitycheck-forge-v1';
const APP_SHELL = ['/', '/manifest.json', '/icon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first for navigation, cache-first for static assets.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      })
    );
  }
});
