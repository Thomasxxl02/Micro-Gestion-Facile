/**
 * Repository pour les fournisseurs
 *
 * Centralise tous les accès Dexie pour l'entité Supplier.
 * Ref schéma : suppliers '&id, name, email, archived'
 */

import type { Supplier } from '../../types';
import { db } from '../invoiceDB';

export const supplierRepository = {
  /** Tous les fournisseurs (actifs + archivés) */
  findAll: (): Promise<Supplier[]> => db.suppliers.toArray(),

  /** Fournisseurs non archivés uniquement */
  findAllActive: (): Promise<Supplier[]> => db.suppliers.filter((s) => !s.archived).toArray(),

  /** Fournisseur par identifiant */
  findById: (id: string): Promise<Supplier | undefined> => db.suppliers.get(id),

  /** Persiste (insert ou update) un fournisseur */
  save: (supplier: Supplier): Promise<string> => db.suppliers.put(supplier),

  /** Persiste plusieurs fournisseurs en une seule transaction */
  saveBulk: (suppliers: Supplier[]): Promise<string> => db.suppliers.bulkPut(suppliers),

  /** Supprime un fournisseur par identifiant */
  delete: (id: string): Promise<void> => db.suppliers.delete(id),

  /** Nombre total de fournisseurs */
  count: (): Promise<number> => db.suppliers.count(),
};
