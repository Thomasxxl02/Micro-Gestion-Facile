/**
 * Repository pour les dépenses / charges
 *
 * Centralise tous les accès Dexie pour l'entité Expense.
 * Ref schéma : expenses '&id, supplierId, date, category'
 */

import type { Expense } from '../../types';
import { db } from '../invoiceDB';

export const expenseRepository = {
  /** Toutes les dépenses */
  findAll: (): Promise<Expense[]> => db.expenses.toArray(),

  /** Dépense par identifiant */
  findById: (id: string): Promise<Expense | undefined> => db.expenses.get(id),

  /** Dépenses d'un fournisseur donné (index supplierId) */
  findBySupplier: (supplierId: string): Promise<Expense[]> =>
    db.expenses.where('supplierId').equals(supplierId).toArray(),

  /** Dépenses par catégorie comptable (index category) */
  findByCategory: (category: string): Promise<Expense[]> =>
    db.expenses.where('category').equals(category).toArray(),

  /** Dépenses comprises entre deux dates ISO (ordre chronologique, inclusif) */
  findByDateRange: (from: string, to: string): Promise<Expense[]> =>
    db.expenses.where('date').between(from, to, true, true).toArray(),

  /** Persiste (insert ou update) une dépense */
  save: (expense: Expense): Promise<string> => db.expenses.put(expense),

  /** Persiste plusieurs dépenses en une seule transaction */
  saveBulk: (expenses: Expense[]): Promise<string> => db.expenses.bulkPut(expenses),

  /** Supprime une dépense par identifiant */
  delete: (id: string): Promise<void> => db.expenses.delete(id),

  /** Nombre total de dépenses */
  count: (): Promise<number> => db.expenses.count(),
};
