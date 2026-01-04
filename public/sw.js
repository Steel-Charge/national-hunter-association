const CACHE_NAME = 'nha-pwa-v1';

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic pass-through fetch
    event.respondWith(fetch(event.request));
});
