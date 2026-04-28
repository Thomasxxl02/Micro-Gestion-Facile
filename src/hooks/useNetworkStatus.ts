/**
 * useNetworkStatus
 * Détecte l'état de connexion réseau via les événements natifs du navigateur.
 *
 * Avantage par rapport à useFirestoreSync : aucune connexion Firestore ouverte,
 * aucune dépendance sur l'authentification. Réponse instantanée aux transitions
 * online/offline du navigateur.
 */

import { useEffect, useState } from "react";

export interface NetworkStatus {
  /** true si le navigateur se déclare hors-ligne */
  isOffline: boolean;
}

/**
 * Hook léger de détection réseau.
 * S'abonne aux événements window 'online' / 'offline'.
 *
 * @example
 * const { isOffline } = useNetworkStatus();
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOffline };
}
