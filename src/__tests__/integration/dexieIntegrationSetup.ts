/**
 * Setup et configuration pour les tests d'intégration IndexedDB
 *
 * Ce fichier configure :
 * - L'initialisation de Dexie pour les tests
 * - Les mocks nécessaires pour IndexedDB
 * - Les helpers communs pour étendre la DB avec des méthodes de test
 *
 * NOTE: Le polyfill fake-indexeddb doit être importé dans vitest.setup.ts
 * EN PREMIER, avant ce fichier et avant Dexie!
 */

import Dexie from 'dexie';
import { afterEach, beforeEach } from 'vitest';

declare global {
  namespace NodeJS {
    interface Global {
      indexedDB: IDBFactory;
    }
  }
}

/**
 * Hook : Réinitialiser Dexie avant chaque test
 *
 * ⚠️ À utiliser dans vitest.setup.ts ou dans chaque describe de test d'intégration
 */
export function setupDexieForTests() {
  beforeEach(() => {
    // Aucun setup spécial nécessaire au début
    // fake-indexeddb gère automatiquement les instances
  });

  afterEach(async () => {
    // Fermer et supprimer tous les DBs de Dexie en fin de test
    // Cela nettoie l'état pour le test suivant
    try {
      // Utiliser indexedDB.databases() pour récupérer les bases de données actives
      const databases = (await (indexedDB as any).databases?.()) ?? [];

      for (const dbName of databases.map((d: any) => d.name)) {
        try {
          const req = indexedDB.deleteDatabase(dbName);
          await new Promise((resolve, reject) => {
            req.onsuccess = resolve;
            req.onerror = reject;
          });
        } catch (e) {
          // Ignorer les erreurs (la DB peut déjà être fermée)
        }
      }
    } catch (e) {
      // Ignorer les erreurs de nettoyage
      console.warn('Cleanup error:', e);
    }
  });
}

/**
 * Helper : Attendre la disponibilité d'une table IndexedDB
 *
 * Utile pour s'assurer que la DB est initialisée avant les tests
 */
export async function waitForDatabase(db: Dexie, timeoutMs = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      // Tenter une opération simple pour vérifier la disponibilité
      const hasDb = await (db as any).table('clients')?.count?.();
      if (hasDb !== undefined) {
        return true;
      }
    } catch (e) {
      // Continuer à attendre
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Database "${db.name}" not available after ${timeoutMs}ms`);
}

/**
 * Helper : Vider complètement une base de données IndexedDB
 *
 * Utile pour réinitialiser l'état entre les tests
 */
export async function clearDatabase(db: Dexie) {
  try {
    const tables = db.tables || [];
    const promises = tables.map((table) => {
      try {
        return table.clear?.();
      } catch (e) {
        return Promise.resolve();
      }
    });
    await Promise.allSettled(promises);
  } catch (e) {
    console.warn(`Failed to clear database "${db.name}":`, e);
  }
}

/**
 * Helper : Vérifier qu'une table est vide
 */
export async function isTableEmpty(db: Dexie, tableName: string): Promise<boolean> {
  try {
    const count = await (db as any).table(tableName).count?.();
    return count === 0;
  } catch (e) {
    return true;
  }
}

/**
 * Helper : Exporter toutes les données d'une table (pour debugging)
 */
export async function exportTableData(
  db: Dexie,
  tableName: string
): Promise<Record<string, unknown>[]> {
  try {
    return await (db as any).table(tableName).toArray?.();
  } catch (e) {
    console.warn(`Failed to export table "${tableName}":`, e);
    return [];
  }
}

/**
 * Configuration globale pour tous les tests d'intégration
 *
 * À ajouter dans vitest.setup.ts :
 *
 * import { setupDexieForTests } from './__tests__/integration/dexieIntegrationSetup';
 * setupDexieForTests();
 */
