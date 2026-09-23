const CACHE = 'mi-menu-v1';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './core.js', './menu.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))), self.clients.claim()]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request)));
});
