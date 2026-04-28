/**
 * Barrel export du Repository Pattern
 *
 * Ce module centralise l'accès type-safe à toutes les tables Dexie.
 * Objectif : remplacer le pattern dangereux
 *   `(dexieDB as unknown as Record<string, unknown>)[tableName]`
 * par un accès typé via `getDexieTable(name)`.
 *
 * Usage :
 *   import { invoiceRepository, getDexieTable } from '../db/repositories';
 */

import type { Table } from "dexie";
import type {
  CalendarEvent,
  ChatMessage,
  Client,
  Email,
  EmailTemplate,
  Expense,
  Invoice,
  InvoiceItem,
  Product,
  Supplier,
  UserProfile,
} from "../../types";
import { db, type InvoiceNumberSequence } from "../invoiceDB";

// ─── Re-exports des repositories ────────────────────────────────────────────

export { calendarRepository } from "./CalendarRepository";
export { clientRepository } from "./ClientRepository";
export { emailRepository, emailTemplateRepository } from "./EmailRepository";
export { expenseRepository } from "./ExpenseRepository";
export { invoiceItemRepository, invoiceRepository } from "./InvoiceRepository";
export { productRepository } from "./ProductRepository";
export { supplierRepository } from "./SupplierRepository";

// ─── Cartographie type-safe des tables Dexie ────────────────────────────────

/**
 * Mapping exhaustif entre les noms de tables et leurs types Dexie.
 * Utilisé par `getDexieTable` pour garantir un accès sans cast dangereux.
 */
export interface DexieTableMap {
  invoices: Table<Invoice, string>;
  invoiceItems: Table<InvoiceItem, string>;
  clients: Table<Client, string>;
  suppliers: Table<Supplier, string>;
  products: Table<Product, string>;
  expenses: Table<Expense, string>;
  emails: Table<Email, string>;
  emailTemplates: Table<EmailTemplate, string>;
  calendarEvents: Table<CalendarEvent, string>;
  userProfile: Table<UserProfile, string>;
  chatMessages: Table<ChatMessage, string>;
  invoiceNumberSequences: Table<InvoiceNumberSequence, string>;
}

/** Union des noms de tables Dexie valides pour useOfflineSync */
export type DexieTableName = keyof DexieTableMap;

// ─── Accesseur type-safe ─────────────────────────────────────────────────────

/**
 * Retourne une table Dexie typée par son nom.
 *
 * Remplace avantageusement le pattern anti-pattern :
 *   `(dexieDB as unknown as Record<string, unknown>)[tableName] as { ... }`
 *
 * Le cast interne `as unknown as Table<unknown, string>` est intentionnel et
 * unique : il trade la variance de `Table<T>` contre `Table<unknown>` pour
 * permettre des opérations `put`/`toArray`/`delete` depuis du code générique
 * (ex: `useOfflineSync<T>`), sans exposer le cast aux consommateurs.
 *
 * Pour les accès fortement typés, préférer directement les repositories
 * (ex: `invoiceRepository.findAll()` retourne `Promise<Invoice[]>`).
 */
export function getDexieTable(name: DexieTableName): Table<unknown, string> {
  return db[name] as unknown as Table<unknown, string>;
}
