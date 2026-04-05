/**
 * Base de données IndexedDB centralisée avec Dexie
 * Gestion complète de la persistance locale pour la PWA
 *
 * Architecture :
 * - Schéma versionnée pour migrer sans perte de données
 * - Tables indexées pour optimiser les requêtes
 * - Relations entre entités (Invoices ↔ Clients, Items, etc.)
 * - Support du mode offline-first
 */

import Dexie, { type Table } from 'dexie';
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
} from '../types';

/**
 * Séquence de numérotation continue pour les documents
 * Garantit l'unicité et la continuité légale en France
 *
 * La clé primaire est `type`. Le champ `year` permet de détecter
 * le passage d'année et de réinitialiser le compteur automatiquement
 * (ex: passage de 2026 à 2027 → repart à 001).
 *
 * Ref légale : Art. 289-I-5° CGI — séquence chronologique continue
 */
export interface InvoiceNumberSequence {
  type: 'invoice' | 'quote' | 'order' | 'credit_note';
  year: number; // Année en cours de la séquence (reset si changement d'année)
  currentNumber: number; // Dernier numéro utilisé pour (type, year)
  lastUsedAt: string; // ISO timestamp pour audit
}

/**
 * Classe principale de la base de données IndexedDB
 * Initialise le schéma et gère la persistance des données
 */
class InvoiceDB extends Dexie {
  // Déclaration des tables
  invoices!: Table<Invoice>;
  invoiceItems!: Table<InvoiceItem>;
  clients!: Table<Client>;
  suppliers!: Table<Supplier>;
  products!: Table<Product>;
  expenses!: Table<Expense>;
  emails!: Table<Email>;
  emailTemplates!: Table<EmailTemplate>;
  calendarEvents!: Table<CalendarEvent>;
  userProfile!: Table<UserProfile>;
  chatMessages!: Table<ChatMessage>;
  invoiceNumberSequences!: Table<InvoiceNumberSequence>;

  constructor() {
    super('MicroGestionFacile');

    this.version(1).stores({
      // Schéma initial - v1
      // Format : { tableName: 'primaryKey, index1, index2, ...' }
      invoices: '&id, number, clientId, date, status, eInvoiceStatus',
      invoiceItems: '&id, invoiceId', // Relation avec invoices
      clients: '&id, name, email, archived',
      suppliers: '&id, name, email, archived',
      products: '&id, name, category, archived',
      expenses: '&id, supplierId, date, category',
      emails: '&id, relatedId, type, status, sentAt',
      emailTemplates: '&id, type, name',
      calendarEvents: '&id, clientId, invoiceId, start, type',
      userProfile: '&id', // Un seul profil utilisateur
      chatMessages: '&id, timestamp, role',
    });

    // Migration v2 - Ajout de la table de séquences pour numérotation continue
    this.version(2)
      .stores({
        invoices: '&id, number, clientId, date, status, eInvoiceStatus',
        invoiceItems: '&id, invoiceId',
        clients: '&id, name, email, archived',
        suppliers: '&id, name, email, archived',
        products: '&id, name, category, archived',
        expenses: '&id, supplierId, date, category',
        emails: '&id, relatedId, type, status, sentAt',
        emailTemplates: '&id, type, name',
        calendarEvents: '&id, clientId, invoiceId, start, type',
        userProfile: '&id',
        chatMessages: '&id, timestamp, role',
        invoiceNumberSequences: '&type', // 'invoice', 'quote', 'order', 'credit_note'
      })
      .upgrade(async (tx) => {
        // Initialise les séquences à partir des numéros existants
        const invoices = (await tx.table('invoices').toArray()) as Invoice[];
        const sequences: Record<string, InvoiceNumberSequence> = {};

        // Extrait le dernier numéro utilisé pour chaque type
        for (const doc of invoices) {
          const type = (doc.type || 'invoice') as 'invoice' | 'quote' | 'order' | 'credit_note';
          const match = doc.number.match(/(\d+)$/); // Extrait le dernier nombre
          const num = match ? parseInt(match[1], 10) : 0;

          if (!sequences[type] || sequences[type].currentNumber < num) {
            // year sera ajouté par la migration v3 ; on caste pour compatibilité
            sequences[type] = {
              type,
              year: 0, // Valeur temporaire — mise à jour par la migration v3
              currentNumber: num,
              lastUsedAt: new Date().toISOString(),
            };
          }
        }

        // Insère les séquences initialisées (ou defaut si aucun doc)
        const docTypes: Array<'invoice' | 'quote' | 'order' | 'credit_note'> = [
          'invoice',
          'quote',
          'order',
          'credit_note',
        ];
        for (const type of docTypes) {
          if (!sequences[type]) {
            sequences[type] = {
              type,
              year: 0, // Valeur temporaire — mise à jour par la migration v3
              currentNumber: 0,
              lastUsedAt: new Date().toISOString(),
            };
          }
        }

        await tx.table('invoiceNumberSequences').bulkPut(Object.values(sequences));
      });

    // Migration v3 — Ajout du champ `year` sur les séquences existantes
    // Art. 289-I-5° CGI : la numérotation doit être remise à 1 chaque année
    this.version(3)
      .stores({
        // Schéma identique à v2 — aucun index supplémentaire requis
        invoices: '&id, number, clientId, date, status, eInvoiceStatus',
        invoiceItems: '&id, invoiceId',
        clients: '&id, name, email, archived',
        suppliers: '&id, name, email, archived',
        products: '&id, name, category, archived',
        expenses: '&id, supplierId, date, category',
        emails: '&id, relatedId, type, status, sentAt',
        emailTemplates: '&id, type, name',
        calendarEvents: '&id, clientId, invoiceId, start, type',
        userProfile: '&id',
        chatMessages: '&id, timestamp, role',
        invoiceNumberSequences: '&type',
      })
      .upgrade(async (tx) => {
        // Ajoute le champ `year` aux séquences qui ne l'ont pas encore
        const sequences = await tx.table('invoiceNumberSequences').toArray();
        for (const seq of sequences) {
          if (seq.year === undefined) {
            // On déduit l'année depuis lastUsedAt ; à défaut l'année courante
            const year = seq.lastUsedAt
              ? new Date(seq.lastUsedAt).getFullYear()
              : new Date().getFullYear();
            await tx.table('invoiceNumberSequences').put({ ...seq, year });
          }
        }
      });
  }

  /**
   * Réinitialise complètement la base de données
   * ⚠️ À utiliser uniquement pour les tests ou le debug
   */
  async clearAll(): Promise<void> {
    await this.delete();
    await this.open();
  }

  /**
   * Exporte toutes les données en JSON
   * Utile pour les backups offline
   */
  async exportData(): Promise<Record<string, unknown>> {
    const exported: Record<string, unknown> = {};

    exported.invoices = await this.invoices.toArray();
    exported.invoiceItems = await this.invoiceItems.toArray();
    exported.clients = await this.clients.toArray();
    exported.suppliers = await this.suppliers.toArray();
    exported.products = await this.products.toArray();
    exported.expenses = await this.expenses.toArray();
    exported.emails = await this.emails.toArray();
    exported.emailTemplates = await this.emailTemplates.toArray();
    exported.calendarEvents = await this.calendarEvents.toArray();
    exported.userProfile = await this.userProfile.toArray();
    exported.chatMessages = await this.chatMessages.toArray();

    return exported;
  }

  /**
   * Importe des données depuis un backup JSON
   * @param data - Données exportées précédemment
   */
  async importData(data: Record<string, unknown>): Promise<void> {
    try {
      if (data.invoices) {
        await this.invoices.bulkPut(data.invoices as Invoice[]);
      }
      if (data.invoiceItems) {
        await this.invoiceItems.bulkPut(data.invoiceItems as InvoiceItem[]);
      }
      if (data.clients) {
        await this.clients.bulkPut(data.clients as Client[]);
      }
      if (data.suppliers) {
        await this.suppliers.bulkPut(data.suppliers as Supplier[]);
      }
      if (data.products) {
        await this.products.bulkPut(data.products as Product[]);
      }
      if (data.expenses) {
        await this.expenses.bulkPut(data.expenses as Expense[]);
      }
      if (data.emails) {
        await this.emails.bulkPut(data.emails as Email[]);
      }
      if (data.emailTemplates) {
        await this.emailTemplates.bulkPut(data.emailTemplates as EmailTemplate[]);
      }
      if (data.calendarEvents) {
        await this.calendarEvents.bulkPut(data.calendarEvents as CalendarEvent[]);
      }
      if (data.userProfile) {
        await this.userProfile.bulkPut(data.userProfile as UserProfile[]);
      }
      if (data.chatMessages) {
        await this.chatMessages.bulkPut(data.chatMessages as ChatMessage[]);
      }
    } catch (error) {
      console.error("Erreur lors de l'importation des données:", error);
      throw error;
    }
  }

  /**
   * Calcule les statistiques globales de la base
   * Utile pour l'audit et le monitoring
   */
  async getStatistics() {
    return {
      invoices: await this.invoices.count(),
      clients: await this.clients.count(),
      suppliers: await this.suppliers.count(),
      products: await this.products.count(),
      expenses: await this.expenses.count(),
      emails: await this.emails.count(),
      calendarEvents: await this.calendarEvents.count(),
    };
  }
}

/**
 * Instance singleton de la base de données
 * À importer dans les services et composants pour la persistance
 */
export const db = new InvoiceDB();

/**
 * Hook personnalisé pour initialiser la base (à utiliser au démarrage)
 * Nettoie les données obsolètes et initialise le profil utilisateur si absent
 */
export async function initializeDB(): Promise<void> {
  try {
    await db.open();
    console.warn('✅ Base de données initialisée avec succès');

    // Initialiser le profil utilisateur s'il n'existe pas
    const existingProfile = await db.userProfile.toArray();
    if (existingProfile.length === 0) {
      const defaultProfile = {
        id: 'main', // Clé primaire requise par le schéma Dexie '&id'
        companyName: 'Ma Micro-Entreprise',
        siret: '',
        address: '',
        email: '',
        phone: '',
        currency: 'EUR',
        invoicePrefix: 'FAC',
        quotePrefix: 'DEV',
        orderPrefix: 'CMD',
        creditNotePrefix: 'AV',
        defaultVatRate: 20,
      } satisfies UserProfile & { id: string };
      await db.userProfile.add(defaultProfile);
      console.warn('✅ Profil utilisateur initialisé');
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la BD:", error);
    throw error;
  }
}

export default db;
