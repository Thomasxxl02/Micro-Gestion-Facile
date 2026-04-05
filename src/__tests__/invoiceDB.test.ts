/**
 * Tests unitaires - Fonctions avancées IndexedDB (Dexie)
 *
 * Complément de src/__tests__/db/invoiceDB.test.ts (CRUD de base).
 * Ce fichier couvre les fonctionnalités non testées ailleurs :
 * - initializeDB() : création du profil par défaut, idempotence
 * - exportData()   : export JSON complet de toutes les tables
 * - importData()   : import / restauration depuis backup
 * - getStatistics() : comptages agrégés par table
 *
 * Prérequis : fake-indexeddb/auto importé dans vitest.setup.ts (déjà en place)
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { db, initializeDB } from '../db/invoiceDB';
import type { Client, Invoice, InvoiceItem } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockClient: Client = {
  id: 'cl-test-001',
  name: 'Acme Corporation',
  email: 'contact@acme.fr',
  address: '123 Rue de la Paix, 75001 Paris',
  siret: '50123456789012',
  archived: false,
};

const mockItem: InvoiceItem = {
  id: 'item-test-001',
  description: 'Développement web',
  quantity: 10,
  unitPrice: 150,
  unit: 'heure',
  vatRate: 20,
};

const mockInvoice: Invoice = {
  id: 'inv-test-001',
  type: 'invoice',
  number: 'FAC-2026-001',
  date: '2026-03-01',
  dueDate: '2026-04-01',
  clientId: 'cl-test-001',
  items: [mockItem],
  status: 'Brouillon',
  total: 1800,
  vatAmount: 300,
};

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(async () => {
  // clearAll() = delete() + open() — nettoie l'état entre chaque test
  await db.clearAll();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('invoiceDB - Base de données IndexedDB (Dexie)', () => {
  // ── initializeDB() ────────────────────────────────────────────────────────

  describe('initializeDB()', () => {
    it("initialise la BD et crée le profil utilisateur par défaut s'il est absent", async () => {
      await initializeDB();
      const profiles = await db.userProfile.toArray();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].companyName).toBe('Ma Micro-Entreprise');
      expect(profiles[0].currency).toBe('EUR');
      expect(profiles[0].invoicePrefix).toBe('FAC');
    });

    it('ne duplique pas le profil si déjà existant (idempotence)', async () => {
      await initializeDB();
      await initializeDB(); // deuxième appel
      const profiles = await db.userProfile.toArray();
      expect(profiles).toHaveLength(1);
    });

    it('ouvre la BD sans exception', async () => {
      await expect(initializeDB()).resolves.not.toThrow();
    });
  });

  // ── exportData() ──────────────────────────────────────────────────────────

  describe('exportData()', () => {
    it('retourne un objet contenant toutes les tables attendues', async () => {
      const exported = await db.exportData();
      const expectedTables = [
        'invoices',
        'invoiceItems',
        'clients',
        'suppliers',
        'products',
        'expenses',
        'emails',
        'emailTemplates',
        'calendarEvents',
        'userProfile',
        'chatMessages',
      ];
      for (const table of expectedTables) {
        expect(exported).toHaveProperty(table);
      }
    });

    it('exporte les données effectivement présentes dans la BD', async () => {
      await db.clients.add(mockClient);
      await db.invoices.add(mockInvoice);

      const exported = await db.exportData();
      const clients = exported.clients as Client[];
      const invoices = exported.invoices as Invoice[];

      expect(clients).toHaveLength(1);
      expect(clients[0].name).toBe('Acme Corporation');
      expect(invoices).toHaveLength(1);
      expect(invoices[0].number).toBe('FAC-2026-001');
    });

    it('retourne des tableaux vides sur BD neuve', async () => {
      const exported = await db.exportData();
      expect((exported.clients as Client[]).length).toBe(0);
      expect((exported.invoices as Invoice[]).length).toBe(0);
    });
  });

  // ── importData() ──────────────────────────────────────────────────────────

  describe('importData()', () => {
    it('importe les données depuis un backup JSON', async () => {
      const backup = {
        clients: [mockClient],
        invoices: [mockInvoice],
      };

      await db.importData(backup);

      const clients = await db.clients.toArray();
      const invoices = await db.invoices.toArray();
      expect(clients).toHaveLength(1);
      expect(invoices).toHaveLength(1);
      expect(clients[0].name).toBe('Acme Corporation');
    });

    it('gère une importation partielle sans erreur (seuls les clients)', async () => {
      const partialBackup = { clients: [mockClient] };
      await expect(db.importData(partialBackup)).resolves.not.toThrow();

      const clients = await db.clients.toArray();
      expect(clients).toHaveLength(1);
      const invoices = await db.invoices.toArray();
      expect(invoices).toHaveLength(0);
    });

    it('remplace les enregistrements existants via bulkPut (upsert)', async () => {
      await db.clients.add(mockClient);
      const clientModifie: Client = { ...mockClient, name: 'Acme Rebrand' };

      await db.importData({ clients: [clientModifie] });

      const client = await db.clients.get('cl-test-001');
      expect(client?.name).toBe('Acme Rebrand');
    });

    it("un backup vide ne provoque pas d'erreur", async () => {
      await expect(db.importData({})).resolves.not.toThrow();
    });
  });

  // ── getStatistics() ───────────────────────────────────────────────────────

  describe('getStatistics()', () => {
    it('retourne zéro pour toutes les entités sur BD neuve', async () => {
      const stats = await db.getStatistics();
      expect(stats.invoices).toBe(0);
      expect(stats.clients).toBe(0);
      expect(stats.suppliers).toBe(0);
      expect(stats.products).toBe(0);
      expect(stats.expenses).toBe(0);
      expect(stats.emails).toBe(0);
      expect(stats.calendarEvents).toBe(0);
    });

    it('retourne les comptes corrects après ajout', async () => {
      await db.clients.add(mockClient);
      await db.invoices.add(mockInvoice);
      const client2: Client = {
        id: 'cl-002',
        name: 'Second Client',
        email: 'b@b.fr',
        address: 'Paris',
        archived: false,
      };
      await db.clients.add(client2);

      const stats = await db.getStatistics();
      expect(stats.clients).toBe(2);
      expect(stats.invoices).toBe(1);
      expect(stats.suppliers).toBe(0);
    });
  });
});
