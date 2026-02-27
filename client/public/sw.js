// ChipLevel Track Service Worker
// Provides: offline fallback, static asset caching, push notification support

const CACHE_NAME = "chip-track-v1";
const OFFLINE_URL = "/offline.html";

// Assets to pre-cache on install
const PRE_CACHE_ASSETS = [
    "/",
    "/items",
    "/manifest.json",
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

// ── Fetch — Network First, Cache Fallback ────────────────────────────────────
self.addEventListener("fetch", (event) => {
    // Only handle GET requests; skip non-http(s) and API calls
    if (
        event.request.method !== "GET" ||
        event.request.url.includes("/api/") ||
        !event.request.url.startsWith("http")
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses for static assets
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() =>
                caches
                    .match(event.request)
                    .then((cached) => cached || caches.match(OFFLINE_URL))
            )
    );
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
