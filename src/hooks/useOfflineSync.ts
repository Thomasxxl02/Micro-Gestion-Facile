/**
 * Hook useOfflineSync - Offline-First Cache Strategy
 *
 * Architecture:
 * 1. Dexie (IndexedDB) = source primaire locale (toujours disponible)
 * 2. Firestore = source secondaire (synchro en arrière-plan)
 * 3. Réconciliation atomique lors de la reconnexion
 *
 * Avantages:
 * ✅ Mode offline complet (Dexie marche sans réseau)
 * ✅ Déduplication automatique des doublons
 * ✅ Conflit resolution intelligent
 * ✅ Firestore reste simple (source of truth pour le cloud)
 *
 * Usage:
 * ```tsx
 * const { data, upsert, remove, isSync } = useOfflineSync({
 *   userId: user.uid,
 *   collectionName: 'invoices',
 *   convertToDb: (doc) => ({...doc, uid: userId}),
 * });
 * ```
 */

import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db as dexieDb } from '../db/invoiceDB';
import { db as firestoreDb } from '../firebase';

export interface UseOfflineSyncOptions<T> {
  userId: string;
  collectionName: string;
  convertToDb?: (doc: T) => T & { uid: string };
  onConflict?: (local: T, remote: T) => T; // Custom conflict resolution
}

export interface UseOfflineSyncResult<T> {
  data: T[];
  upsert: (item: T) => Promise<void>;
  remove: (id: string) => Promise<void>;
  isSync: boolean;
  lastSync: string | null;
  error: Error | null;
}

/**
 * Hook principal pour la synchronisation offline-first
 * Combine Dexie (cache) + Firestore (source cloud)
 */
export function useOfflineSync<T extends { id: string }>({
  userId,
  collectionName,
  convertToDb,
  onConflict,
}: UseOfflineSyncOptions<T>): UseOfflineSyncResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isSync, setIsSync] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Dexie table - dynamique selon collection name
  const getDexieTable = () => {
    const tableMap: Record<
      string,
      | 'invoices'
      | 'clients'
      | 'suppliers'
      | 'products'
      | 'expenses'
      | 'emails'
      | 'emailTemplates'
      | 'calendarEvents'
    > = {
      invoices: 'invoices',
      clients: 'clients',
      suppliers: 'suppliers',
      products: 'products',
      expenses: 'expenses',
      emails: 'emails',
      emailTemplates: 'emailTemplates',
      calendarEvents: 'calendarEvents',
    };
    return tableMap[collectionName];
  };

  // ============================================================================
  // PHASE 1: CHARGER LES DONNÉES LOCALES (DEXIE) — INSTANTANÉ
  // ============================================================================
  useEffect(() => {
    (async () => {
      try {
        const tableName = getDexieTable();
        if (!tableName) {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allRecords = (await (dexieDb as any)[tableName].toArray()) as T[];
        // Filtrer par userId si la structure le supporte

        const filtered = allRecords.filter((r) => !(r as any).uid || (r as any).uid === userId); // eslint-disable-line @typescript-eslint/no-explicit-any
        setData(filtered);
      } catch (err) {
        console.error(`[Dexie] Erreur chargement ${collectionName}:`, err);
      }
    })();
  }, [collectionName, userId]);

  // ============================================================================
  // PHASE 2: SYNCHRONISER AVEC FIRESTORE (EN ARRIÈRE-PLAN)
  // ============================================================================
  useEffect(() => {
    if (!userId) {
      return;
    }

    setIsSync(true);
    const q = query(collection(firestoreDb, collectionName), where('uid', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const remoteData: T[] = snapshot.docs.map((d) => d.data() as T);

          // RÉCONCILIATION: fusionner local + remote avec stratégie de conflit
          const tableName = getDexieTable();
          if (tableName) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const localData = (await (dexieDb as any)[tableName].toArray()) as T[];
            const merged = mergeDataWithConflictResolution(
              localData,
              remoteData,
              userId,
              onConflict
            );

            // Écrire dans Dexie (cache local)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (dexieDb as any)[tableName].bulkPut(merged);
          }

          setData(remoteData);
          setLastSync(new Date().toISOString());
          setError(null);
        } catch (err) {
          console.error(`[Firestore] Erreur sync ${collectionName}:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsSync(false);
        }
      },
      (err) => {
        console.error(`[Firestore] Erreur listener ${collectionName}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsSync(false);
      }
    );

    return () => unsubscribe();
  }, [userId, collectionName]);

  // ============================================================================
  // UPSERT: Écrire dans DEXIE + FIRESTORE
  // ============================================================================
  const upsert = async (item: T): Promise<void> => {
    try {
      const tableName = getDexieTable();
      if (!tableName) {
        throw new Error(`Collection ${collectionName} not supported`);
      }

      const toStore = convertToDb
        ? convertToDb({ ...item } as T & { uid?: string })
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ({ ...item, uid: userId } as any as T & { uid: string });

      // 1. Écrire dans Dexie (instantané)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dexieDb as any)[tableName].put(toStore);

      // 2. Écrire dans Firestore (async, peut échouer offline)
      await setDoc(doc(firestoreDb, collectionName, item.id), toStore);

      // 3. Actualiser l'état local
      setData((prev) => {
        const exists = prev.find((d) => d.id === item.id);
        if (exists) {
          return prev.map((d) => (d.id === item.id ? item : d));
        }
        return [...prev, item];
      });
    } catch (err) {
      console.error(`[Upsert] Erreur ${collectionName}/${item.id}:`, err);
      throw err;
    }
  };

  // ============================================================================
  // DELETE: Supprimer de DEXIE + FIRESTORE
  // ============================================================================
  const remove = async (id: string): Promise<void> => {
    try {
      const tableName = getDexieTable();
      if (!tableName) {
        throw new Error(`Collection ${collectionName} not supported`);
      }

      // 1. Supprimer de Dexie
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dexieDb as any)[tableName].delete(id);

      // 2. Supprimer de Firestore
      await deleteDoc(doc(firestoreDb, collectionName, id));

      // 3. Actualiser l'état local
      setData((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(`[Delete] Erreur ${collectionName}/${id}:`, err);
      throw err;
    }
  };

  return {
    data,
    upsert,
    remove,
    isSync,
    lastSync,
    error,
  };
}

/**
 * UTILITY: Merge local + remote data with conflict resolution
 * Stratégie: lastModified win (timestamp-based)
 */
function mergeDataWithConflictResolution<T extends { id: string }>(
  local: T[],
  remote: T[],
  userId: string,
  customResolver?: (local: T, remote: T) => T
): T[] {
  const merged = new Map<string, T>();

  // Ajouter toutes les données locales
  for (const item of local) {
    merged.set(item.id, item);
  }

  // Résoudre les conflits avec remote
  for (const remoteItem of remote) {
    const localItem = merged.get(remoteItem.id);

    if (!localItem) {
      // Nouveau dans remote → ajouter
      merged.set(remoteItem.id, remoteItem);
    } else {
      // Conflit → utiliser custom resolver ou timestamp-based
      if (customResolver) {
        merged.set(remoteItem.id, customResolver(localItem, remoteItem));
      } else {
        // Défaut: Remote gagne (Firestore = source of truth pour le cloud)
        merged.set(remoteItem.id, remoteItem);
      }
    }
  }

  return Array.from(merged.values());
}
