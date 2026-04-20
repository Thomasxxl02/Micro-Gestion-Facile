import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import {
  isOnline,
  onConnectivityChange,
  onSyncError,
  onSyncSuccess,
} from "../lib/serviceWorkerManager";

/**
 * OfflineIndicator - Affiche le statut online/offline
 *
 * Affiche:
 * - Badge vert "Online" si connecté
 * - Badge rouge "Offline" avec sync queue status si déconnecté
 * - Nombre de requêtes en attente de synchronisation
 */
export function OfflineIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    // État initial
    setIsConnected(isOnline());

    // Écouter les changements de connectivité
    const unsubscribe = onConnectivityChange((online) => {
      setIsConnected(online);
      if (online) {
        setSyncError(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Écouter les événements de synchronisation
    const unsubscribeSyncSuccess = onSyncSuccess((count) => {
      setPendingSync(0);
      setSyncError(null);
      console.warn(`✅ ${count} requête(s) synchronisée(s)`);
    });

    const unsubscribeSyncError = onSyncError((error) => {
      setSyncError(error);
      console.error("❌ Erreur synchronisation:", error);
    });

    return () => {
      unsubscribeSyncSuccess();
      unsubscribeSyncError();
    };
  }, []);

  if (isConnected) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-md bg-green-50 text-green-700"
        role="status"
        aria-live="polite"
        title="Vous êtes connecté à Internet"
      >
        <Wifi size={16} className="text-green-600" />
        <span className="text-sm font-medium">En ligne</span>
      </div>
    );
  }

  // Offline state
  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
      role="alert"
      aria-live="assertive"
      title={syncError ? `Erreur: ${syncError}` : "Mode hors-ligne activé"}
    >
      <WifiOff size={16} className="text-amber-600 animate-pulse" />
      <span className="text-sm font-medium">Hors ligne</span>
      {pendingSync > 0 && (
        <span className="ml-1 inline-block bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {pendingSync}
        </span>
      )}
      {syncError && (
        <span className="ml-1 text-xs opacity-75" title={syncError}>
          ⚠️
        </span>
      )}
    </div>
  );
}

export default OfflineIndicator;
