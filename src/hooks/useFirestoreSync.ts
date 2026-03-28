import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type FirestoreError,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';

// NOTE: La persistance (enableIndexedDbPersistence) est désormais gérée globalement
// dans src/firebase.ts via initializeFirestore pour le support multi-onglets natif.

export type SyncStatus = 'LOADING' | 'SUCCESS' | 'ERROR' | 'OFFLINE';

interface UseFirestoreSyncOptions {
  userId: string | undefined;
  collectionName: string;
}

/**
 * Hook de synchronisation Firestore 🚀 v2.0
 *
 * Améliorations :
 * - Gestion propre du cycle de vie du userId (évite les fuites de mémoire)
 * - Support natif multi-onglets (via config globale firebase.ts)
 * - Datestamp automatique via serverTimestamp
 * - Typage renforcé avec options optionnelles
 */
export function useFirestoreSync<T extends { id: string }>(options: UseFirestoreSyncOptions) {
  const { userId, collectionName } = options;
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<SyncStatus>('LOADING');
  const [error, setError] = useState<FirestoreError | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Synchronisation en temps réel (Temps réel + Persistance)
  useEffect(() => {
    // Ne pas tenter la synchro si pas d'utilisateur authentifié
    if (!userId) {
      setData([]);
      setStatus('OFFLINE');
      return;
    }

    setStatus('LOADING');
    setError(null);

    const q = query(collection(db, collectionName), where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true }, // Important pour détecter le passage hors-ligne/en-ligne
      (snapshot) => {
        const items = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as unknown as T
        );

        setData(items);
        setStatus('SUCCESS');
        setFromCache(snapshot.metadata.fromCache);

        if (snapshot.metadata.fromCache) {
          console.debug(`[Sync] ${collectionName} chargé du cache (Hors Ligne)`);
        }

        if (snapshot.metadata.hasPendingWrites) {
          console.debug(`[Sync] ${collectionName}: Modifications locales en attente d'envoi...`);
        }
      },
      (err) => {
        console.error(`[Sync] Erreur ${collectionName}:`, err);
        setError(err);
        setStatus('ERROR');
      }
    );

    return () => unsubscribe();
  }, [userId, collectionName]);

  // Ajouter / Mettre à jour (Optimiste par défaut avec Firestore)
  const upsert = useCallback(
    async (item: T) => {
      if (!userId) {
        throw new Error('Connexion requise pour sauvegarder');
      }

      try {
        const docRef = doc(db, collectionName, item.id);

        // Enrichir les données avec métadonnées techniques
        const dataToSave = {
          ...item,
          userId,
          updatedAt: serverTimestamp(),
          // Ne pas écraser createdAt si présent
          createdAt: (item as any).createdAt || serverTimestamp(),
        };

        // Firestore gère l'optimisme (mise à jour locale immédiate)
        await setDoc(docRef, dataToSave, { merge: true });
        return { success: true };
      } catch (err) {
        console.error(`[Sync] Erreur d'écriture ${collectionName}:`, err);
        return { success: false, error: err };
      }
    },
    [userId, collectionName]
  );

  // Supprimer
  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteDoc(doc(db, collectionName, id));
        return { success: true };
      } catch (err) {
        console.error(`[Sync] Erreur de suppression ${collectionName}:`, err);
        return { success: false, error: err };
      }
    },
    [collectionName]
  );

  // Memoization de l'état de connexion pour éviter des re-renders inutiles
  const connectionState = useMemo(
    () => ({
      isOffline: fromCache || !navigator.onLine,
      isSyncing: status === 'LOADING',
    }),
    [fromCache, status]
  );

  return {
    data,
    status,
    error,
    upsert,
    remove,
    ...connectionState,
  };
}
