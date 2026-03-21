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
  Invoice,
  InvoiceItem,
  Client,
  Supplier,
  Product,
  Expense,
  Email,
  EmailTemplate,
  CalendarEvent,
  UserProfile,
  ChatMessage,
} from '../types';

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

    // Migrations futures peuvent être ajoutées avec this.version(2), etc.
    // Exemple :
    // this.version(2).stores({...}).upgrade(tx => {
    //   // Logique de migration
    // });
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
  async exportData(): Promise<Record<string, any>> {
    const exported: Record<string, any> = {};

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
  async importData(data: Record<string, any>): Promise<void> {
    try {
      if (data.invoices) {await this.invoices.bulkPut(data.invoices);}
      if (data.invoiceItems) {await this.invoiceItems.bulkPut(data.invoiceItems);}
      if (data.clients) {await this.clients.bulkPut(data.clients);}
      if (data.suppliers) {await this.suppliers.bulkPut(data.suppliers);}
      if (data.products) {await this.products.bulkPut(data.products);}
      if (data.expenses) {await this.expenses.bulkPut(data.expenses);}
      if (data.emails) {await this.emails.bulkPut(data.emails);}
      if (data.emailTemplates) {await this.emailTemplates.bulkPut(data.emailTemplates);}
      if (data.calendarEvents) {await this.calendarEvents.bulkPut(data.calendarEvents);}
      if (data.userProfile) {await this.userProfile.bulkPut(data.userProfile);}
      if (data.chatMessages) {await this.chatMessages.bulkPut(data.chatMessages);}
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
      const defaultProfile: UserProfile = {
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
      };
      await db.userProfile.add(defaultProfile);
      console.warn('✅ Profil utilisateur initialisé');
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la BD:", error);
    throw error;
  }
}

export default db;
