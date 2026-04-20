import type Dexie from "dexie";
import type { Migration } from "./types";

/**
 * Migration 001 - Ajout de numérotation continue améliorée
 *
 * Scenario:
 * - v1: invoiceNumberSequences était seulement dans invoices
 * - v2: Créer table dédiée pour persistance robuste des séquences
 *
 * Changements:
 * - Ajouter table invoiceNumberSequences avec index par type
 * - Migrer les séquences existantes depuis les données d'invoices
 * - Ajouter index syncedAt pour audit
 *
 * Ref: Art. 289-I-5° CGI - seule la séquence continue est légale
 */
export const migration001AddInvoiceNumberSequence: Migration = {
  version: 2,
  description: "Add dedicated invoice number sequence tracking",

  schema: {
    invoices: "&id, number, clientId, date, status, eInvoiceStatus, syncedAt",
    invoiceItems: "&id, invoiceId",
    clients: "&id, name, email, archived",
    suppliers: "&id, name, email, archived",
    products: "&id, name, category, archived",
    expenses: "&id, supplierId, date, category",
    emails: "&id, relatedId, type, status, sentAt",
    emailTemplates: "&id, type, name",
    calendarEvents: "&id, clientId, invoiceId, start, type",
    userProfile: "&id",
    chatMessages: "&id, timestamp, role",
    invoiceNumberSequences: "&type, year", // Remplace storage temporaire
  },

  /**
   * Migration des données d'invoices vers invoiceNumberSequences
   *
   * Logique:
   * 1. Extraire tous les numéros d'invoices
   * 2. Grouper par année et type
   * 3. Créer enregistrements sequence pour chaque groupe
   * 4. Copier syncedAt si disponible
   */
  upgrade: async (db: Dexie) => {
    const invoices = await db.table("invoices").toArray();

    // Grouper par (type, year) pour calculer max number
    const sequences: Record<string, Record<number, number>> = {};

    for (const invoice of invoices) {
      const year = new Date(invoice.date).getFullYear();
      const type = invoice.type || "invoice";

      if (!sequences[type]) sequences[type] = {};
      sequences[type][year] = Math.max(
        sequences[type][year] || 0,
        invoice.number,
      );
    }

    // Créer enregistrements sequence
    const sequenceTable = db.table("invoiceNumberSequences");

    for (const type of Object.keys(sequences)) {
      for (const yearStr of Object.keys(sequences[type])) {
        const year = parseInt(yearStr);
        const currentNumber = sequences[type][year];

        await sequenceTable.put({
          type,
          year,
          currentNumber,
          lastUsedAt: new Date().toISOString(),
        });
      }
    }

    console.warn(
      `✅ Migration 001: ${Object.keys(sequences).length} sequences créées`,
    );
  },
};
