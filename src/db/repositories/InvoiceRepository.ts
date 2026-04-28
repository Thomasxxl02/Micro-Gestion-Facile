/**
 * Repository pour les factures, devis, commandes et avoirs
 *
 * Centralise tous les accès Dexie pour les entités Invoice + InvoiceItem.
 * Ref schéma : invoices '&id, number, clientId, date, status, eInvoiceStatus'
 *              invoiceItems '&id, invoiceId'
 */

import type { Invoice, InvoiceItem } from "../../types";
import { db } from "../invoiceDB";

export const invoiceRepository = {
  /** Toutes les factures/devis */
  findAll: (): Promise<Invoice[]> => db.invoices.toArray(),

  /** Facture par identifiant */
  findById: (id: string): Promise<Invoice | undefined> => db.invoices.get(id),

  /** Factures d'un client donné (index clientId) */
  findByClient: (clientId: string): Promise<Invoice[]> =>
    db.invoices.where("clientId").equals(clientId).toArray(),

  /** Factures par statut (ex: 'Brouillon', 'Payée') */
  findByStatus: (status: string): Promise<Invoice[]> =>
    db.invoices.where("status").equals(status).toArray(),

  /** Factures par type de document (ex: 'invoice', 'quote') */
  findByType: (type: string): Promise<Invoice[]> =>
    db.invoices.filter((inv) => inv.type === type).toArray(),

  /** Factures comprises entre deux dates ISO (ordre chronologique, inclusif) */
  findByDateRange: (from: string, to: string): Promise<Invoice[]> =>
    db.invoices.where("date").between(from, to, true, true).toArray(),

  /** Factures par statut e-invoice (pour le suivi Factur-X 2026) */
  findByEInvoiceStatus: (eStatus: string): Promise<Invoice[]> =>
    db.invoices.where("eInvoiceStatus").equals(eStatus).toArray(),

  /** Persiste (insert ou update) une facture */
  save: (invoice: Invoice): Promise<string> => db.invoices.put(invoice),

  /** Persiste plusieurs factures en une seule transaction */
  saveBulk: (invoices: Invoice[]): Promise<string> =>
    db.invoices.bulkPut(invoices),

  /** Supprime une facture par identifiant */
  delete: (id: string): Promise<void> => db.invoices.delete(id),

  /** Nombre total de factures */
  count: (): Promise<number> => db.invoices.count(),
};

export const invoiceItemRepository = {
  /** Tous les articles de facture */
  findAll: (): Promise<InvoiceItem[]> => db.invoiceItems.toArray(),

  /** Articles d'une facture donnée (index invoiceId) */
  findByInvoice: (invoiceId: string): Promise<InvoiceItem[]> =>
    db.invoiceItems.where("invoiceId").equals(invoiceId).toArray(),

  /** Persiste un article */
  save: (item: InvoiceItem): Promise<string> => db.invoiceItems.put(item),

  /** Persiste plusieurs articles */
  saveBulk: (items: InvoiceItem[]): Promise<string> =>
    db.invoiceItems.bulkPut(items),

  /** Supprime un article par identifiant */
  delete: (id: string): Promise<void> => db.invoiceItems.delete(id),

  /** Supprime tous les articles d'une facture (cascade manuelle) */
  deleteByInvoice: (invoiceId: string): Promise<void> =>
    db.invoiceItems
      .where("invoiceId")
      .equals(invoiceId)
      .delete()
      .then(() => undefined),
};
