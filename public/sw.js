/// <reference lib="webworker" />

const CACHE_VERSION = 'champteams-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const SPRITE_CACHE = `${CACHE_VERSION}-sprites`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

// Static assets to precache on install
const PRECACHE_URLS = [
  '/favicon.svg',
  '/logo-192.png',
  '/logo-512.png',
];

// Core API data to prefetch for offline use
const PREFETCH_API_URLS = [
  '/api/pokemon?limit=2000&format=season-m1',
  '/api/items?vgc=true&limit=500',
  '/api/abilities?all=true',
  '/api/moves?limit=1000',
  '/api/pokemon/playstyle-index?format=season-m1',
];

// API routes to cache (stale-while-revalidate)
const CACHEABLE_API_PATTERNS = [
  /^\/api\/pokemon/,
  /^\/api\/items/,
  /^\/api\/abilities/,
  /^\/api\/moves/,
  /^\/api\/usage/,
];

// Sprite CDN patterns to cache
const SPRITE_PATTERNS = [
  /play\.pokemonshowdown\.com\/sprites\//,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('champteams-') && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      ),
      // Prefetch core API data for offline use
      caches.open(API_CACHE).then((cache) =>
        Promise.all(
          PREFETCH_API_URLS.map((url) =>
            cache.match(url).then((existing) => {
              if (existing) return;
              return fetch(url).then((res) => {
                if (res.ok) cache.put(url, res);
              }).catch(() => {});
            })
          )
        )
      ),
    ])
  );
  self.clients.claim();
});

// Listen for manual prefetch trigger from client
self.addEventListener('message', (event) => {
  if (event.data === 'prefetch-api') {
    caches.open(API_CACHE).then((cache) =>
      Promise.all(
        PREFETCH_API_URLS.map((url) =>
          fetch(url).then((res) => {
            if (res.ok) cache.put(url, res);
          }).catch(() => {})
        )
      )
    );
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Next.js static assets (/_next/) — cache-first (content-hashed, immutable)
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // Sprite requests — cache-first (sprites never change)
  if (SPRITE_PATTERNS.some((p) => p.test(event.request.url))) {
    event.respondWith(
      caches.open(SPRITE_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // API requests — stale-while-revalidate
  if (CACHEABLE_API_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request)
            .then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => {
              if (cached) return cached;
              return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Navigation requests — network-first, cache fallback
  // Always try network first so deploys are picked up immediately.
  // Cache the response so offline visits have something to show.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a clone of every successful page load
          const clone = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline — try exact URL from cache, then fall back to /builder
          return caches.open(PAGE_CACHE).then((cache) =>
            cache.match(event.request).then((cached) => {
              if (cached) return cached;
              return cache.match('/builder').then((builderPage) => {
                if (builderPage) return builderPage;
                // Last resort: return a minimal offline page
                return new Response(
                  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ChampTeams - Offline</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#1a1a2e;color:#fff;text-align:center}h1{color:#d4a017}p{color:#999;margin-top:8px}</style></head><body><div><h1>ChampTeams.gg</h1><p>You\'re offline. Please connect to the internet and refresh.</p></div></body></html>',
                  { status: 200, headers: { 'Content-Type': 'text/html' } }
                );
              });
            })
          );
        })
    );
    return;
  }
});
