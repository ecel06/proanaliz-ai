// public/sw.js
// ProAnaliz AI - Modern PWA Service Worker (v2.2 - Network-First for Navigation)
const CACHE_NAME = 'proanaliz-ai-v2.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA önbelleğe varlık eklenirken uyarı:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First for HTML/Navigation & APIs to prevent stale chunk 404s
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation / HTML pages & API endpoints: ALWAYS Network-First
  const isHtmlNavigation = event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
  const isApiOrBulletin = url.pathname.startsWith('/api') || url.pathname.includes('bulletin.json');

  if (isHtmlNavigation || isApiOrBulletin) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cache only when completely offline
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (isHtmlNavigation) return caches.match('/index.html');
            return null;
          });
        })
    );
    return;
  }

  // 2. Static hashed assets (.js, .css, images, fonts): Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      });
    })
  );
});