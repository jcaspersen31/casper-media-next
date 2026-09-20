// Minimal service worker: enables "Add to Home Screen" installability on
// Android and caches immutable static assets for repeat visits. Auth/API
// data is always fetched fresh. HTML pages are network-first (falling back
// to cache only when offline) — Next's JS chunk filenames change on every
// deploy, so a cache-first HTML page can end up pointing at chunk URLs that
// no longer exist on the new deployment, breaking hydration until the
// service worker itself is replaced. Bump CACHE_NAME on any change here so
// old clients drop their stale cache on the next activate.
const CACHE_NAME = "soil-report-static-v2";
const PRECACHE_URLS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return; // never cache API responses

  const isImmutableStatic = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

  if (isImmutableStatic) {
    // Content-hashed, safe to serve from cache first and only hit the
    // network for a miss.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else (HTML pages, manifest, etc.): network-first, so a new
  // deploy is visible immediately. Only fall back to cache when offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
