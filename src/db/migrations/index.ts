import type Dexie from "dexie";
import { migration000InitialSchema } from "./000-initial-schema";
import { migration001AddInvoiceNumberSequence } from "./001-add-invoice-number-sequence";
import type { Migration, MigrationResult } from "./types";

/**
 * Liste ordonnée de toutes les migrations
 * Doit être en ordre croissant de version
 *
 * Quand ajouter une migration:
 * 1. Créer nouveau fichier: 002-description.ts
 * 2. Implémenter Migration interface
 * 3. L'ajouter à ce tableau (à la fin)
 * 4. Incrémenter version max dans invoiceDB
 */
export const MIGRATIONS: Migration[] = [
  migration000InitialSchema,
  migration001AddInvoiceNumberSequence,
];

/**
 * Current max version
 * MUST match the highest version in MIGRATIONS array
 */
export const CURRENT_DB_VERSION = MIGRATIONS.length;

/**
 * Applique toutes les migrations nécessaires à la DB
 *
 * Logique:
 * 1. Lire version actuelle de la DB
 * 2. Pour chaque version > currentVersion:
 *    a. Appliquer le schéma Dexie
 *    b. Exécuter upgrade handler si exists
 *    c. Logger le succès
 * 3. Retourner résultats
 *
 * @param db Instance Dexie
 * @throws Error si une migration échoue
 */
export async function applyMigrations(db: Dexie): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  // Lire la version actuelle
  const currentVersion = db.verno || 0;

  console.warn(`🔄 Migration: v${currentVersion} → v${CURRENT_DB_VERSION}`);

  // Appliquer chaque migration nécessaire
  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue; // Déjà appliquée
    }

    const startTime = Date.now();

    try {
      // Appliquer le schéma (Dexie gère automatiquement)
      db.version(migration.version).stores(migration.schema);

      // Appliquer le handler upgrade si exists
      if (migration.upgrade) {
        await migration.upgrade(db);
      }

      const duration = Date.now() - startTime;

      console.warn(
        `✅ Migration v${migration.version}: ${migration.description} (${duration}ms)`,
      );

      results.push({
        success: true,
        version: migration.version,
        description: migration.description,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ Migration v${migration.version} FAILED: ${migration.description}`,
        error,
      );

      results.push({
        success: false,
        version: migration.version,
        description: migration.description,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      // Arrêter sur erreur (important pour l'intégrité)
      throw error;
    }
  }

  return results;
}

/**
 * Vérifie que la DB est à la dernière version
 */
export function isAtLatestVersion(db: Dexie): boolean {
  return (db.verno || 0) === CURRENT_DB_VERSION;
}

/**
 * Récupère la version actuelle
 */
export function getCurrentVersion(db: Dexie): number {
  return db.verno || 0;
}

/**
 * Liste les migrations disponibles
 */
export function listMigrations(): Migration[] {
  return MIGRATIONS.map((m) => ({
    ...m,
  }));
}

/**
 * Récupère les migrations à appliquer
 */
export function getPendingMigrations(db: Dexie): Migration[] {
  const currentVersion = db.verno || 0;
  return MIGRATIONS.filter((m) => m.version > currentVersion);
}
