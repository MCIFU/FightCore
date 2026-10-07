/* FIGHTCORE service worker — offline-first shell, network-first pages. */
const VERSION = "fc-v4";
const SHELL = ["/", "/offline", "/icon.svg", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

// Pages and portraits live in their own caches with a size cap, so an installed
// app doesn't grow without limit (oldest entries go first).
const PAGES = `${VERSION}-pages`, PHOTOS = `${VERSION}-photos`;
const LIMIT = { [PAGES]: 60, [PHOTOS]: 300 };
async function putCapped(name, req, res) {
  const c = await caches.open(name);
  await c.put(req, res);
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - LIMIT[name]))) await c.delete(k);
}

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/portraits/") ||
  url.pathname.startsWith("/icons/") || url.pathname.startsWith("/_next/image") || url.pathname === "/icon.svg";

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first so data is fresh; cached copy or offline page when there is no network.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { if (res.ok) putCapped(PAGES, req, res.clone()); return res; })
        // "?source=app" and other tracking params shouldn't miss the cached page.
        .catch(async () => (await caches.match(req)) || (await caches.match(req, { ignoreSearch: true })) || (await caches.match("/offline"))),
    );
    return;
  }

  // Portraits: cache first (they don't change), capped.
  if (url.pathname.startsWith("/photos/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) putCapped(PHOTOS, req, res.clone()); return res; })),
    );
    return;
  }

  // Immutable assets and the search index: serve from cache, refresh in the background.
  if (isStatic(url) || url.pathname === "/api/search") {
    e.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      }),
    );
  }
});
