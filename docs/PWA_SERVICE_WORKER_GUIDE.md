# Service Worker & PWA Guide

## 📚 Vue d'ensemble

Ce guide documente le **cycle de vie du Service Worker** et l'implémentation de la **synchronisation offline** pour Micro-Gestion Facile.

**Objectif**: Garantir que l'application fonctionne correctement en mode offline et synchronise les données dès que la connexion est rétablie.

---

## 🔄 Service Worker Lifecycle

### 1. **INSTALL Phase** (Téléchargement des assets)

```
User navigates to app
    ↓
Browser downloads sw.js
    ↓
Service Worker installed
    ↓
Cache critical assets (index.html, app.js, styles, etc.)
    ↓
Event: install → cache fonctionnelle
```

**Code côté SW:**

```javascript
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("v1").then((cache) => {
      return cache.addAll([
        "/index.html",
        "/app.js",
        "/styles.css",
        // ... autres assets critiques
      ]);
    }),
  );
  // Skip waiting = activer immédiatement
  self.skipWaiting();
});
```

**Résultat:**

- ✅ Assets critiques en cache
- ✅ Application peut charger offline
- ✅ Nouveau worker en attente si mise à jour disponible

---

### 2. **ACTIVATE Phase** (Nettoyage des anciens caches)

```
New SW ready
    ↓
Old SW révoqué
    ↓
ACTIVATE event
    ↓
Delete old cache versions
    ↓
Claim all clients
    ↓
Event: activate → network intercepts actifs
```

**Code côté SW:**

```javascript
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Supprimer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== "v1") // Garder seulement v1
            .map((name) => caches.delete(name)),
        );
      }),
      // Prendre le contrôle des clients immédiatement
      self.clients.claim(),
    ]),
  );
});
```

**Résultat:**

- ✅ Nettoyage des anciens caches
- ✅ SW active et contrôle les requêtes
- ✅ Les pages reçoivent les nouvelles ressources

---

### 3. **FETCH Phase** (Interception des requêtes)

```
User makes request (img, API, HTML)
    ↓
Service Worker intercepts
    ↓
Decision: strategy cache/network/hybrid
    ↓
Returns response or error
    ↓
Browser gets response
```

**Stratégies implémentées:**

#### a) **Cache First** (pour les assets statiques)

```javascript
// Images, fonts, CSS → toujours depuis cache si disponible
self.addEventListener("fetch", (event) => {
  if (isStaticAsset(event.request)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      }),
    );
  }
});
```

#### b) **Network First** (pour les API)

```javascript
// APIs, données dynamiques → réseau d'abord
self.addEventListener("fetch", (event) => {
  if (isAPIRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache le succès pour utilisation offline
          if (response.ok) {
            const clone = response.clone();
            caches.open("api-cache").then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: retourner depuis cache
          return caches.match(event.request);
        }),
    );
  }
});
```

**Résultat:**

- ✅ Assets critiques rapides (cache)
- ✅ Données fraîches si possible (network)
- ✅ Fallback offline gracieux

---

### 4. **BACKGROUND SYNC Phase** (Synchronisation diff)

```
User offline, crée facture
    ↓
Requête en attente enqueue → IndexedDB
    ↓
User reconnecte
    ↓
SW détecte online
    ↓
Demande: sync.register('sync-tag')
    ↓
Traiter queue: retry failures
    ↓
POST/PUT requêtes en attente
    ↓
Synchronization complete
    ↓
UI notifiée (toast success/error)
```

**Code côté manager:**

```typescript
// src/lib/serviceWorkerManager.ts
export async function enqueueRequest(
  url: string,
  method: string,
  body?: unknown
) {
  // Save to IndexedDB
  await saveQueuedRequest({ url, method, body, ... });

  // Register background sync
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-queued-requests');
}
```

**Code côté SW:**

```javascript
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-queued-requests") {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  const requests = await getQueuedRequests(); // from IndexedDB
  let syncedCount = 0;

  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        body: req.body,
      });

      if (response.ok) {
        await removeQueuedRequest(req.id);
        syncedCount++;
      } else {
        await incrementRetries(req.id);
      }
    } catch (error) {
      // Retry on next sync event
      await incrementRetries(req.id);
    }
  }

  // Notifier le client
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_SUCCESS",
        count: syncedCount,
      });
    });
  });
}
```

**Résultat:**

- ✅ Requêtes persistées offline
- ✅ Automatiquement envoyées après reconnexion
- ✅ UI mise à jour (toast + sync count)

---

## 🔐 Architecture de Synchronisation

### IndexedDB Queue (Persistance)

```
Table: queued_requests
├─ id (uuid)
├─ url
├─ method
├─ body (JSON string)
├─ timestamp
├─ priority (high/normal/low)
├─ retries (0-3)
└─ maxRetries

Indexes:
├─ priority (sort par priorité)
├─ timestamp (FIFO)
└─ status (pending/failed)
```

### Stratégie de Retry

1. **Première tentative**: Immédiatement (max 3)
2. **Intervalle**: 5s → 15s → 30s
3. **Max retries**: 3
4. **Après 3 échecs**: User notification d'erreur

---

## 📱 UI Components

### OfflineIndicator.tsx

**Affichage:**

- 🟢 **Online**: Badge vert "En ligne"
- 🔴 **Offline**: Badge rouge "Hors ligne"
- 📊 **Sync pending**: Badge amber avec compte "(3)"

**Intégration:**

```tsx
import { OfflineIndicator } from "@/components/OfflineIndicator";

export function Navbar() {
  return (
    <header>
      <h1>Micro-Gestion</h1>
      <OfflineIndicator /> {/* Auto-update en temps réel */}
    </header>
  );
}
```

### Toasts (Sync Feedback)

```typescript
import {
  enqueueRequest,
  onSyncSuccess,
  onSyncError,
} from "@/lib/serviceWorkerManager";

// Créer facture
async function createInvoice(invoice: Invoice) {
  try {
    await enqueueRequest(
      "/api/invoices",
      "POST",
      invoice,
      "high", // Priority: créer facture = "high"
    );

    // Listeners
    onSyncSuccess((count) => {
      toast.success(`${count} facture(s) synchronisée(s)! ✅`);
    });

    onSyncError((error) => {
      toast.error(`Erreur sync: ${error}. Réessai en arrière-plan...`);
    });
  } catch (error) {
    // Offline: automatiquement en queue
    console.log("Facture mise en attente (offline)");
  }
}
```

---

## 📊 Diagnostic & Debugging

### DevTools Chrome

**Application → Service Workers:**

- État: `installing`, `waiting`, `active`
- Skip waiting: Force nouvelle version
- Unregister: Supprimer complètement

**Application → Cache Storage:**

- Voir tous les caches
- Déboguer les assets cachés

**Application → IndexedDB:**

- Inspectez `micro-gestion-sync`
- Vérifiez queue des requêtes

**Network (avec offline):**

1. DevTools → Network
2. Throttle → Offline
3. Naviguer → requêtes échouent gracieusement
4. Débugger les fallbacks

### Log Console

```javascript
// Activer logs détaillés
localStorage.setItem('SW_DEBUG', 'true');

// Dans le code:
if (localStorage.getItem('SW_DEBUG')) {
  console.log('[SW]', ...);
}
```

---

## 🚀 Deployment

### vite.config.ts

```typescript
import { VitePWA } from "vite-plugin-pwa";

export default {
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        skipWaiting: true, // Activer immédiatement
        clientsClaim: true, // Prendre contrôle clients
        runtimeCaching: [
          /* ... */
        ],
      },
    }),
  ],
};
```

### Manifest.json (Auto-généré)

```json
{
  "name": "Micro-Gestion Facile",
  "start_url": "/",
  "icons": [
    { "src": "/pwa-192x192.png", "sizes": "192x192" },
    { "src": "/pwa-512x512.png", "sizes": "512x512" }
  ],
  "display": "standalone",
  "theme_color": "#1f2937"
}
```

### Headers (importante pour les PWAs)

```
Service-Worker-Allowed: /
Cache-Control: public, max-age=3600
```

---

## ✅ Checklist d'Implémentation

- [x] vite-plugin-pwa configuré
- [x] Manifest.json généré
- [x] Service Worker lifecycle documenté
- [x] Offline Indicator UI créé
- [x] ServiceWorkerManager: coordination client-side
- [ ] public/sw.ts: implementationt côté worker
- [ ] Background Sync queues: IndexedDB + retry logic
- [ ] Tests offline mode: DevTools network throttle
- [ ] Tests sync: créer requête offline → reconnecter
- [ ] Monitoring Sentry (prod)

---

## 🔗 Ressources

- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [vite-plugin-pwa](https://vite-plugin-pwa.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
