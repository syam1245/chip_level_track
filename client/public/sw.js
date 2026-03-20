// ChipLevel Track Service Worker
// Provides: offline fallback, static asset caching, push notification support

const CACHE_NAME = "chip-track-v2";
const OFFLINE_URL = "/offline.html";

// Assets to pre-cache on install
const PRE_CACHE_ASSETS = [
    "/",
    "/items",
    "/manifest.json",
    "/offline.html",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRE_CACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ── Caching Strategies ───────────────────────────────────────────────────────

const MAX_CACHE_ENTRIES = 100;

/**
 * Detect Vite-built static assets. These filenames contain content hashes
 * (e.g. index-DkF3q.js) so a cached version is guaranteed fresh.
 */
const isStaticAsset = (url) =>
    url.pathname.startsWith("/assets") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff");

/**
 * Evict oldest entries when the cache grows beyond MAX_CACHE_ENTRIES.
 * Simple LRU-ish approach: delete the first (oldest) keys.
 */
async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        await cache.delete(keys[0]);
        // Recurse for safety if many entries over the limit
        return trimCache(cacheName, maxEntries);
    }
}

/**
 * Cache First — for hashed static assets.
 * If it's in cache, return instantly. Otherwise fetch, cache, and return.
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
            trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
        }
        return response;
    } catch {
        // Static asset not available offline — nothing useful to return
        return new Response("", { status: 503, statusText: "Offline" });
    }
}

/**
 * Stale While Revalidate — for HTML navigation.
 * Return cached version immediately for speed, then update the cache
 * in the background so the next visit gets fresh content.
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    // Fire the network request in the background regardless
    const networkPromise = fetch(request)
        .then((response) => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // If we have a cached version, return it immediately
    if (cached) {
        // Still let the network request complete in the background to refresh cache
        networkPromise;
        return cached;
    }

    // No cache — must wait for network
    const networkResponse = await networkPromise;
    if (networkResponse) return networkResponse;

    // Network failed and no cache — show offline page
    return (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
}

// ── Fetch — Strategy Router ──────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
    const req = event.request;

    // Only intercept GET over http(s)
    if (req.method !== "GET" || !req.url.startsWith("http")) return;

    const url = new URL(req.url);

    // API calls → always go to network, never cache
    if (url.pathname.startsWith("/api/")) return;

    // Static assets (JS/CSS/fonts) → Cache First (hash-versioned, safe to cache forever)
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(req));
        return;
    }

    // HTML navigation → Stale While Revalidate (fast + fresh)
    event.respondWith(staleWhileRevalidate(req));
});

// ── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
    let data = { title: "ChipLevel Track", body: "You have an update." };
    try {
        data = event.data?.json() || data;
    } catch (_) { }

    event.waitUntil(
        self.registration.showNotification(data.title || "ChipLevel Track", {
            body: data.body || "",
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: data.url ? { url: data.url } : undefined,
        })
    );
});

// Open app on notification click
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/items";
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                const existing = clientList.find((c) => c.url.includes(url) && "focus" in c);
                if (existing) return existing.focus();
                return clients.openWindow(url);
            })
    );
});
