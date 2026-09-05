const CACHE = 'cih-study-v3';
const APP_SHELL = ['./','./index.html','./mobile.css','./manifest.json'];
const FSRS_URL = 'https://cdn.jsdelivr.net/npm/ts-fsrs@5.4.2/+esm';
const FSRS_HOST = 'cdn.jsdelivr.net';
const FSRS_PREFIX = '/npm/ts-fsrs@5.4.2/';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    try {
      const response = await fetch(FSRS_URL, {mode:'cors'});
      if (response.ok) await cache.put(FSRS_URL, response.clone());
    } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.hostname === FSRS_HOST && url.pathname.startsWith(FSRS_PREFIX)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  if (url.origin === self.location.origin && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
  }
});
