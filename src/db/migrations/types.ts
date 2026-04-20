import type Dexie from "dexie";

/**
 * Migration Interface
 *
 * Chaque migration doit implémenter cette interface.
 * Les migrations sont exécutées en ordre croissant de version.
 *
 * Exemple:
 *   - 000-initial-schema: v1
 *   - 001-add-invoice-number-sequence: v2
 *   - 002-add-email-automation: v3
 */
export interface Migration {
  /** Numéro de version (ex: 1, 2, 3) */
  version: number;

  /** Description courte de la migration */
  description: string;

  /**
   * Définition du schéma Dexie pour cette version
   *
   * Format Dexie:
   * ```
   * {
   *   tableName: 'primaryKey, index1, index2, ...'
   * }
   * ```
   *
   * Référence: https://dexie.org/docs/API-Reference#versionstores
   */
  schema: Record<string, string>;

  /**
   * Handler de migration (optionnel)
   *
   * Appelé après le changement de schéma.
   * Utilisé pour les transformations de données (ex: ajouter colonne, renommer, migrer).
   *
   * @param db Instance de la base de données Dexie
   * @throws Error si la migration échoue
   *
   * Exemple: Ajouter une colonne avec valeur par défaut
   * ```typescript
   * upgrade: async (db) => {
   *   const table = await db.table('invoices').toArray();
   *   for (const record of table) {
   *     await db.table('invoices').update(record.id, {
   *       syncedAt: new Date().toISOString(),
   *     });
   *   }
   * }
   * ```
   */
  upgrade?: (db: Dexie) => Promise<void>;
}

/**
 * Contexte de migration
 * Fourni des infos sur l'état actuel et précédent
 */
export interface MigrationContext {
  /** Version précédente (0 si première install) */
  fromVersion: number;

  /** Version cible de la migration */
  toVersion: number;

  /** Nom de la base de données */
  dbName: string;

  /** True si c'est la première installation */
  isFirstInstall: boolean;

  /** Timestamp du début de la migration */
  startTime: number;
}

/**
 * Result de migration
 */
export interface MigrationResult {
  success: boolean;
  version: number;
  description: string;
  duration: number; // en ms
  error?: Error;
}
