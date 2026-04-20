/**
 * Service Worker - Offline-First PWA Implementation
 *
 * Responsibilities:
 * 1. Intercept fetch requests (cache-first for assets, network-first for APIs)
 * 2. Handle Background Sync for queued offline requests
 * 3. Manage cache lifecycle (install, activate)
 * 4. Push notifications (future)
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

/**
 * Asset Cache Configuration
 * Format: [cacheName]: [urlPatterns]
 */
const CACHE_CONFIG = {
  ASSETS: "micro-gestion-v1-assets",
  API: "micro-gestion-v1-api",
};

/**
 * URL Patterns for Caching
 */
const CACHE_PATTERNS = {
  // Assets: JS, CSS, fonts (cache-first)
  assets: [/\.js$/, /\.css$/, /\.woff2?$/, /\.ttf$/, /\.eot$/],
  // Google Fonts (cache-first, long-lived)
  googleFonts: [/fonts\.googleapis\.com/, /fonts\.gstatic\.com/],
  // Firebase & APIs (network-first with fallback)
  firebase: [/firestore\.googleapis\.com/, /storage\.googleapis\.com/],
  // Gemini API (network-first)
  gemini: [/generativelanguage\.googleapis\.com/],
};

/**
 * SERVICE WORKER LIFECYCLE
 */

/**
 * Install: Pre-cache critical assets
 */
self.addEventListener("install", (event: ExtendableEvent) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    (async () => {
      // Pre-cache critical assets in the background
      try {
        const cache = await caches.open(CACHE_CONFIG.ASSETS);
        // Add your critical assets here (index.html, main.js, etc.)
        await cache.addAll(["/", "/index.html", "/manifest.json"]);
        console.log("[SW] Pre-cached critical assets");
      } catch (error) {
        console.error("[SW] Pre-caching failed:", error);
      }

      // Force this SW to become active immediately
      self.skipWaiting();
    })(),
  );
});

/**
 * Activate: Clean up old caches
 */
self.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const activeCache = new Set(Object.values(CACHE_CONFIG));

      // Delete old caches not in CACHE_CONFIG
      await Promise.all(
        cacheNames
          .filter((name) => !activeCache.has(name))
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );

      // Take control of all clients immediately
      await self.clients.claim();
      console.log("[SW] Activated and claimed clients");
    })(),
  );
});

/**
 * FETCH HANDLING
 * Implements: Cache-first for assets, Network-first for APIs
 */
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip Chrome extensions and special protocols
  if (url.protocol === "chrome-extension:" || url.protocol === "about:") {
    return;
  }

  // Determine caching strategy
  if (isAssetRequest(url)) {
    // Cache-first for static assets
    event.respondWith(cacheFirstStrategy(request));
  } else if (isApiRequest(url)) {
    // Network-first for API calls (with offline fallback)
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Default: network with cache fallback
    event.respondWith(networkWithCacheFallback(request));
  }
});

/**
 * BACKGROUND SYNC
 * Resync queued offline requests when online
 */
self.addEventListener("sync", (event: any) => {
  console.log("[SW] Background sync event:", event.tag);

  if (event.tag === "sync-queued-requests") {
    event.waitUntil(syncQueuedRequests());
  }
});

/**
 * MESSAGE HANDLING
 * Communication with clients (App.tsx)
 */
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const { data } = event;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (data.type === "GET_CACHE_SIZE") {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ type: "CACHE_SIZE", size });
    });
  }

  if (data.type === "CLEAR_CACHE") {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ type: "CACHE_CLEARED" });
    });
  }
});

/**
 * CACHING STRATEGIES
 */

/**
 * Cache-first: Return from cache, fetch if missing
 * Best for: Static assets, fonts, images
 */
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cached = await caches.match(request);

  if (cached) {
    console.log("[SW] Cache hit:", request.url);
    return cached;
  }

  console.log("[SW] Cache miss, fetching:", request.url);

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok && response.status === 200) {
      const cache = await caches.open(CACHE_CONFIG.ASSETS);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error("[SW] Fetch failed for:", request.url, error);
    return createOfflineResponse("Erreur hors ligne");
  }
}

/**
 * Network-first: Fetch first, fallback to cache
 * Best for: API responses, data that changes
 */
async function networkFirstStrategy(request: Request): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    // Cache successful responses
    if (response.ok && response.status === 200) {
      const cache = await caches.open(CACHE_CONFIG.API);
      cache.put(request, response.clone());
    }

    console.log("[SW] Network response:", request.url);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.log("[SW] Network failed, checking cache:", request.url);

    // Try cache as fallback
    const cached = await caches.match(request);
    if (cached) {
      console.log("[SW] Returning cached response:", request.url);
      return cached;
    }

    // If it's a Gemini API call, queue for background sync
    if (request.url.includes("generativelanguage.googleapis.com")) {
      console.log("[SW] Queueing Gemini API call for sync:", request.url);
      await queueRequest(request);
      return createQueuedResponse();
    }

    return createOfflineResponse(
      "Erreur réseau - Tentative de synchronisation...",
    );
  }
}

/**
 * Network with cache fallback: Try network, fallback to cache
 */
async function networkWithCacheFallback(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    console.log("[SW] Network failed, using cache:", request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return createOfflineResponse("Page non disponible hors ligne");
  }
}

/**
 * BACKGROUND SYNC
 */

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retries: number;
}

async function queueRequest(request: Request): Promise<void> {
  const queued: QueuedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== "GET" ? await request.text() : null,
    timestamp: Date.now(),
    retries: 0,
  };

  const db = await openRequestDB();
  const tx = db.transaction("queued_requests", "readwrite");
  await tx.objectStore("queued_requests").add(queued);
  await tx.done;

  console.log("[Sync] Queued request:", queued.id);
}

async function syncQueuedRequests(): Promise<void> {
  console.log("[Sync] Starting background sync...");

  const db = await openRequestDB();
  const tx = db.transaction("queued_requests", "readonly");
  const store = tx.objectStore("queued_requests");
  const requests = await store.getAll();
  await tx.done;

  if (requests.length === 0) {
    console.log("[Sync] No queued requests");
    return;
  }

  console.log(`[Sync] Processing ${requests.length} queued requests`);

  const results = await Promise.allSettled(
    requests.map((req: unknown) => retryRequest(req as QueuedRequest)),
  );

  // Remove successful requests
  const db2 = await openRequestDB();
  const tx2 = db2.transaction("queued_requests", "readwrite");
  const store2 = tx2.objectStore("queued_requests");

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      store2.delete(requests[index].id);
      console.log(`[Sync] ✓ Synced request: ${requests[index].id}`);
    } else {
      console.error(`[Sync] ✗ Failed request: ${requests[index].id}`);
    }
  });

  await tx2.done;
  console.log("[Sync] Background sync completed");
}

async function retryRequest(req: QueuedRequest): Promise<Response> {
  const request = new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(request);

      if (response.ok) {
        return response;
      }

      // Temporary error, retry
      if (response.status >= 500) {
        await delay(Math.pow(2, attempt) * 1000);
        continue;
      }

      // Permanent error, give up
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }

      await delay(Math.pow(2, attempt) * 1000);
    }
  }

  throw new Error("Max retries exceeded");
}

/**
 * INDEXEDDB FOR QUEUED REQUESTS
 */

let dbInstance: any = null;

async function openRequestDB() {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open("micro-gestion-sync", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("queued_requests")) {
        const store = db.createObjectStore("queued_requests", {
          keyPath: "id",
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
        console.log("[DB] Created queued_requests store");
      }
    };
  });
}

/**
 * UTILITIES
 */

function isAssetRequest(url: URL): boolean {
  return (
    CACHE_PATTERNS.assets.some((pattern) => pattern.test(url.pathname)) ||
    CACHE_PATTERNS.googleFonts.some((pattern) => pattern.test(url.hostname))
  );
}

function isApiRequest(url: URL): boolean {
  return (
    CACHE_PATTERNS.firebase.some((pattern) => pattern.test(url.hostname)) ||
    CACHE_PATTERNS.gemini.some((pattern) => pattern.test(url.hostname))
  );
}

function createOfflineResponse(message: string): Response {
  return new Response(
    JSON.stringify({
      error: "OFFLINE",
      message,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "application/json" },
    },
  );
}

function createQueuedResponse(): Response {
  return new Response(
    JSON.stringify({
      status: "QUEUED",
      message: "Requête en attente de synchronisation",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 202,
      statusText: "Accepted",
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function getCacheSize(): Promise<number> {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log("[SW] All caches cleared");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Export SW as recognized by vite-plugin-pwa
 */
export {};
