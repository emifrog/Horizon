/**
 * Service Worker — Horizon (Simulateur retraite SPP)
 *
 * Stratégie :
 *  - Navigations (HTML)  : network-first → cache → repli index.html (hors ligne).
 *  - Autres ressources same-origin (CSS/JS/images/manifest) : cache-first, puis
 *    mise en cache à la volée (l'app se remplit au 1er passage en ligne).
 *  - Requêtes cross-origin (ex. Google Fonts) : non interceptées — le navigateur
 *    les gère normalement (la police dégrade en police système hors ligne).
 *
 * Mise à jour : incrémenter CACHE_VERSION à chaque déploiement pour purger l'ancien
 * cache et re-télécharger les ressources modifiées.
 */

const CACHE_VERSION = 'horizon-v2';

// Coquille minimale pré-cachée à l'installation (le reste est mis en cache à la volée).
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './js/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll échoue si une seule URL échoue → on tolère les absences avec des put individuels.
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ne gérer que les GET same-origin ; laisser passer le reste (fonts, POST, etc.).
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations (documents HTML) : network-first avec repli cache puis index.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Autres ressources : cache-first, puis mise en cache à la volée.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Ne cacher que les réponses valides et « basic » (same-origin).
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
