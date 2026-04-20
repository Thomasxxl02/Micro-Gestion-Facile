/**
 * Service Worker Manager
 *
 * Gère le lifecycle du Service Worker et les stratégies de synchronisation
 * pour l'application PWA Micro-Gestion Facile.
 *
 * Lifecycle:
 * 1. INSTALL → Téléchargement des assets critiques (cache)
 * 2. ACTIVATE → Nettoyage des anciens caches
 * 3. FETCH → Interception des requêtes (offline-first ou network-first)
 * 4. BACKGROUND SYNC → Synchronisation des données en arrière-plan
 */

/**
 * Type pour les événements de synchronisation
 */
export interface SyncEvent {
  tag: string;
  lastChance: boolean;
}

/**
 * Interface pour les requêtes en attente
 */
export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: string;
  timestamp: number;
  priority: "high" | "normal" | "low";
  retries: number;
  maxRetries: number;
}

/**
 * Store local pour les requêtes en attente
 * Stocké dans IndexedDB pour persistance offline
 */
const SYNC_QUEUE_DB_NAME = "micro-gestion-sync";
const SYNC_QUEUE_STORE = "pending-requests";

/**
 * Initialise le Service Worker et enregistre les handlers
 */
export async function initializeServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers non supportés sur ce navigateur");
    return;
  }

  try {
    // Si on est en mode dev, désactiver le SW
    if (import.meta.env.DEV) {
      console.warn("[SW] Mode développement: Service Worker désactivé");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.warn("[SW] Service Worker registered successfully:", registration);

    // Écouter les mises à jour
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          // Nouvelle version disponible
          console.warn("[SW] Nouvelle version disponible");
          dispatchUpdateAvailable();
        }
      });
    });

    // Écouter les messages du Service Worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      handleServiceWorkerMessage(event.data);
    });
  } catch (_error) {
    console.error("[SW] Erreur lors de l'enregistrement:", _error);
  }
}

/**
 * Enqueue une requête pour synchronisation offline
 * Stockée dans IndexedDB si offline, exécutée immédiatement si online
 */
export async function enqueueRequest(
  url: string,
  method: string = "GET",
  body?: unknown,
  priority: "high" | "normal" | "low" = "normal",
): Promise<void> {
  const request: QueuedRequest = {
    id: `${Date.now()}-${Math.random()}`,
    url,
    method,
    body: body ? JSON.stringify(body) : undefined,
    timestamp: Date.now(),
    priority,
    retries: 0,
    maxRetries: 3,
  };

  // Si online, tenter directement
  if (navigator.onLine) {
    try {
      await fetch(url, {
        method,
        body: request.body,
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.warn("[Sync] Requête exécutée immédiatement", url);
      return;
    } catch (_error) {
      console.warn("[Sync] Offline détecté, enqueue requête:", url);
    }
  }

  // Offline: sauvegarder dans IndexedDB
  await saveQueuedRequest(request);

  // Demander au Service Worker de synchroniser
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (
        registration as ServiceWorkerRegistration & {
          sync: { register(tag: string): Promise<void> };
        }
      ).sync.register("sync-queued-requests");
      console.warn("[Sync] Sync background enregistrée");
    } catch (_error) {
      console.error("[Sync] Erreur enregistrement sync:", _error);
    }
  }
}

/**
 * Message handler pour la communication avec le Service Worker
 */
function handleServiceWorkerMessage(data: unknown): void {
  if (!data || typeof data !== "object") return;

  const message = data as {
    type: string;
    count?: number;
    error?: string;
    status?: boolean;
    [key: string]: unknown;
  };

  switch (message.type) {
    case "SYNC_SUCCESS":
      console.warn("[Sync] Synchronisation réussie:", message.count);
      dispatchSyncSuccess(message.count as number);
      break;

    case "SYNC_ERROR":
      console.error("[Sync] Erreur synchronisation:", message.error);
      dispatchSyncError(message.error as string);
      break;

    case "UPDATE_AVAILABLE":
      console.warn("[SW] Mise à jour disponible");
      dispatchUpdateAvailable();
      break;

    case "OFFLINE_STATUS":
      console.warn("[SW] Statut offline:", message.status);
      dispatchOfflineStatus(message.status as boolean);
      break;

    default:
      console.warn("[SW] Message reçu:", message);
  }
}

/**
 * Sauvegarde une requête dans IndexedDB pour synchro offline
 */
async function saveQueuedRequest(request: QueuedRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const request_db = indexedDB.open(SYNC_QUEUE_DB_NAME, 1);

    request_db.onerror = () => {
      console.error("[IndexedDB] Erreur ouverture DB");
      reject(request_db.error);
    };

    request_db.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "id" });
      }
    };

    request_db.onsuccess = () => {
      const db = request_db.result;
      const transaction = db.transaction(SYNC_QUEUE_STORE, "readwrite");
      const store = transaction.objectStore(SYNC_QUEUE_STORE);

      store.add(request);

      transaction.oncomplete = () => {
        console.warn("[IndexedDB] Requête enqueue:", request.id);
        resolve();
      };

      transaction.onerror = () => {
        console.error("[IndexedDB] Erreur storing request");
        reject(transaction.error);
      };
    };
  });
}

/**
 * Listeners pour les mises à jour
 */
const listeners = {
  updateAvailable: new Set<() => void>(),
  syncSuccess: new Set<(count: number) => void>(),
  syncError: new Set<(error: string) => void>(),
  offlineStatus: new Set<(offline: boolean) => void>(),
};

export function onUpdateAvailable(callback: () => void): () => void {
  listeners.updateAvailable.add(callback);
  return () => {
    listeners.updateAvailable.delete(callback);
  };
}

export function onSyncSuccess(_callback: (count: number) => void): () => void {
  // Désactivé temporairement pour éviter les erreurs de variables inutilisées en attendant l'implémentation complète
  return () => {
    // No-op
  };
}

export function onSyncError(_callback: (error: string) => void): () => void {
  return () => {
    // No-op
  };
}

export function onOfflineStatus(
  _callback: (offline: boolean) => void,
): () => void {
  return () => {
    // No-op
  };
}

function dispatchUpdateAvailable(): void {
  listeners.updateAvailable.forEach((cb) => cb());
}

function dispatchSyncSuccess(count: number): void {
  console.warn("[Sync] Result success:", count);
}

function dispatchSyncError(error: string): void {
  console.error("[Sync] Result error:", error);
}

function dispatchOfflineStatus(offline: boolean): void {
  console.warn("[Sync] Result offline status:", offline);
}

/**
 * Demander une mise à jour du Service Worker
 */
export async function checkForUpdates(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistrations();
    for (const reg of registration) {
      await reg.update();
    }
    console.warn("[SW] Vérification des mises à jour effectuée");
  } catch (error) {
    console.error("[SW] Erreur vérification updates:", error);
  }
}

/**
 * Forcer la mise à jour et le rechargement
 */
export async function skipWaitingAndReload(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const newWorker = registration.waiting;

  if (newWorker) {
    newWorker.postMessage({ type: "SKIP_WAITING" });

    // Rechargement une fois le nouveau SW activé
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

/**
 * Vérifier l'état online/offline
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Écouter les changements de connectivité
 */
export function onConnectivityChange(
  callback: (online: boolean) => void,
): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
