import type { Migration } from "./types";

/**
 * Migration 000 - Schéma initial
 *
 * Crée les tables de base:
 * - invoices: Factures
 * - invoiceItems: Lignes de facture
 * - clients: Tiers
 * - suppliers: Fournisseurs
 * - products: Produits/Services
 * - expenses: Dépenses
 * - emails: Historique emails
 * - emailTemplates: Templates email
 * - calendarEvents: Événements
 * - userProfile: Profil utilisateur
 * - chatMessages: Conversations IA
 * - invoiceNumberSequences: Séquences numérotation
 *
 * Ref légale: Art. 289-I-5° CGI (séquence continue)
 */
export const migration000InitialSchema: Migration = {
  version: 1,
  description: "Initial schema - invoices, clients, suppliers, products, etc.",
  schema: {
    invoices: "&id, number, clientId, date, status, eInvoiceStatus",
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
    invoiceNumberSequences: "&type, year",
  },

  // Pas d'upgrade nécessaire (première install)
  upgrade: undefined,
};
