import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  where,
  enableIndexedDbPersistence,
  type FirestoreError
} from 'firebase/firestore';
import { db } from '../firebase';

// Tentative d'activation de la persistance hors ligne
try {
  enableIndexedDbPersistence(db).catch(() => {
    // Plusieurs onglets ouverts ou indisponible
  });
} catch {
  // Déjà activé ou erreur critique
}

export type SyncStatus = 'LOADING' | 'SUCCESS' | 'ERROR' | 'OFFLINE';

interface UseFirestoreSyncOptions {
  userId: string;
  collectionName: string;
}

/**
 * Hook de synchronisation Firestore avec gestion du mode hors ligne et des conflits
 */
export function useFirestoreSync<T extends { id: string }>(options: UseFirestoreSyncOptions) {
  const { userId, collectionName } = options;
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<SyncStatus>('LOADING');
  const [error, setError] = useState<FirestoreError | null>(null);

  // Synchronisation en temps réel (Temps réel + Persistance)
  useEffect(() => {
    if (!userId) {return;}

    setStatus('LOADING');
    const q = query(collection(db, collectionName), where('userId', '==', userId));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
        setData(items);
        setStatus('SUCCESS');

        // Notification métadonnées (si provenant du cache)
        if (snapshot.metadata.fromCache) {
          console.info(`Données ${collectionName} chargées du cache (Mode Hors Ligne)`);
        }
      },
      (err) => {
        console.error(`Erreur de synchro ${collectionName}:`, err);
        setError(err);
        setStatus('ERROR');
      }
    );

    return () => unsubscribe();
  }, [userId, collectionName]);

  // Ajouter / Mettre à jour (Optimiste par défaut avec Firestore)
  const upsert = useCallback(async (item: T) => {
    try {
      const docRef = doc(db, collectionName, item.id);
      // Ajout du userId pour la sécurité
      const dataToSave = { ...item, userId };

      // La mise à jour est immédiate localement grâce au SDK Firestore
      await setDoc(docRef, dataToSave, { merge: true });
      return { success: true };
    } catch (err) {
      console.error(`Erreur d'écriture ${collectionName}:`, err);
      return { success: false, error: err };
    }
  }, [userId, collectionName]);

  // Supprimer
  const remove = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return { success: true };
    } catch (err) {
      console.error(`Erreur de suppression ${collectionName}:`, err);
      return { success: false, error: err };
    }
  }, [collectionName]);

  return {
    data,
    status,
    error,
    upsert,
    remove,
    isOffline: status === 'SUCCESS' && !navigator.onLine
  };
}
