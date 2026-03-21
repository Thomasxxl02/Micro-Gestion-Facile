import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../db/invoiceDB';
import type { Invoice, InvoiceItem, Client } from '../../types';

describe('InvoiceDB - Dexie Database', () => {
  beforeEach(async () => {
    await db.clearAll();
  });

  afterEach(async () => {
    await db.clearAll();
  });

  // ============================================================================
  // INVOICES TABLE
  // ============================================================================

  describe('invoices table', () => {
    const mockInvoice: Invoice = {
      id: 'inv-1',
      number: 'FAC-001',
      date: '2026-03-21',
      dueDate: '2026-04-21',
      clientId: 'cli-1',
      items: [],
      total: 1000,
      status: 'draft',
      type: 'invoice',
      notes: '',
    };

    it('crée une facture', async () => {
      await db.invoices.add(mockInvoice);
      const invoice = await db.invoices.get('inv-1');
      expect(invoice?.number).toBe('FAC-001');
      expect(invoice?.total).toBe(1000);
    });

    it('récupère une facture par ID', async () => {
      await db.invoices.add(mockInvoice);
      const invoice = await db.invoices.get('inv-1');
      expect(invoice).toBeDefined();
      expect(invoice?.id).toBe('inv-1');
    });

    it('met à jour une facture', async () => {
      await db.invoices.add(mockInvoice);
      await db.invoices.update('inv-1', { status: 'sent' });
      const updated = await db.invoices.get('inv-1');
      expect(updated?.status).toBe('sent');
    });

    it('supprime une facture', async () => {
      await db.invoices.add(mockInvoice);
      await db.invoices.delete('inv-1');
      const deleted = await db.invoices.get('inv-1');
      expect(deleted).toBeUndefined();
    });

    it('liste toutes les factures', async () => {
      await db.invoices.add(mockInvoice);
      await db.invoices.add({ ...mockInvoice, id: 'inv-2', number: 'FAC-002' });
      const all = await db.invoices.toArray();
      expect(all).toHaveLength(2);
    });

    it('filtre par status', async () => {
      await db.invoices.add(mockInvoice);
      await db.invoices.add({ ...mockInvoice, id: 'inv-2', status: 'paid' });
      const draft = await db.invoices.where('status').equals('draft').toArray();
      expect(draft).toHaveLength(1);
    });

    it('filtre par clientId', async () => {
      await db.invoices.add(mockInvoice);
      await db.invoices.add({ ...mockInvoice, id: 'inv-2', clientId: 'cli-2' });
      const byClient = await db.invoices.where('clientId').equals('cli-1').toArray();
      expect(byClient).toHaveLength(1);
      expect(byClient[0].clientId).toBe('cli-1');
    });

    it('filtre par status', async () => {
      await db.invoices.add(mockInvoice);
      await db.invoices.add({ ...mockInvoice, id: 'inv-2', status: 'sent' });
      const draft = await db.invoices.where('status').equals('draft').toArray();
      expect(draft).toHaveLength(1);
    });

    it('lève une erreur si l\'invoice existe déjà', async () => {
      await db.invoices.add(mockInvoice);
      expect(async () => {
        await db.invoices.add(mockInvoice);
      }).rejects.toThrow();
    });
  });

  // ============================================================================
  // INVOICE ITEMS TABLE
  // ============================================================================

  describe('invoiceItems table', () => {
    const mockItem: InvoiceItem = {
      id: 'itm-1',
      description: 'Service',
      quantity: 10,
      unitPrice: 100,
      vatRate: 20,
    };

    beforeEach(async () => {
      await db.invoices.add({
        id: 'inv-1',
        number: 'FAC-001',
        date: '2026-03-21',
        dueDate: '2026-04-21',
        clientId: 'cli-1',
        items: [],
        total: 1000,
        status: 'draft',
        type: 'invoice',
      });
    });

    it('crée un item', async () => {
      await db.invoiceItems.add(mockItem);
      const item = await db.invoiceItems.get('itm-1');
      expect(item?.quantity).toBe(10);
      expect(item?.unitPrice).toBe(100);
    });

    it('crée et récupère un item', async () => {
      await db.invoiceItems.add(mockItem);
      const item = await db.invoiceItems.get('itm-1');
      expect(item).toBeDefined();
      expect(item?.description).toBe('Service');
    });

    it('supporte plusieurs items', async () => {
      await db.invoiceItems.add(mockItem);
      await db.invoiceItems.add({ ...mockItem, id: 'itm-2', description: 'Autre service' });

      const items = await db.invoiceItems.toArray();
      expect(items).toHaveLength(2);
    });
  });

  // ============================================================================
  // CLIENTS TABLE
  // ============================================================================

  describe('clients table', () => {
    const mockClient: Client = {
      id: 'cli-1',
      name: 'Client SARL',
      email: 'contact@client.fr',
      phone: '0102030405',
      address: '123 Rue de Paris',
      siret: '12345678901234',
      archived: false,
    };

    it('crée un client', async () => {
      await db.clients.add(mockClient);
      const client = await db.clients.get('cli-1');
      expect(client?.name).toBe('Client SARL');
    });

    it('filtre les clients actifs', async () => {
      await db.clients.add(mockClient);
      await db.clients.add({ ...mockClient, id: 'cli-2', archived: true });
      const all = await db.clients.toArray();
      const active = all.filter(c => c.archived === false);
      expect(active).toHaveLength(1);
    });

    it('recherche par email', async () => {
      await db.clients.add(mockClient);
      const byEmail = await db.clients.where('email').equals('contact@client.fr').toArray();
      expect(byEmail).toHaveLength(1);
    });

    it('met à jour un client', async () => {
      await db.clients.add(mockClient);
      await db.clients.update('cli-1', { phone: '0987654321' });
      const updated = await db.clients.get('cli-1');
      expect(updated?.phone).toBe('0987654321');
    });
  });

  // ============================================================================
  // TRANSACTIONS MULTI-TABLES
  // ============================================================================

  describe('multi-table transactions', () => {
    it('crée facture + items atomiquement', async () => {
      const invoiceId = 'inv-tx-1';

      await db.transaction('rw', db.invoices, db.invoiceItems, async () => {
        await db.invoices.add({
          id: invoiceId,
          number: 'FAC-TX-001',
          date: '2026-03-21',
          dueDate: '2026-04-21',
          clientId: 'cli-1',
          items: [],
          total: 3000,
          status: 'draft',
          type: 'invoice',
        });

        await db.invoiceItems.add({
          id: 'itm-1',
          description: 'Item 1',
          quantity: 10,
          unitPrice: 100,
          vatRate: 20,
        });

        await db.invoiceItems.add({
          id: 'itm-2',
          description: 'Item 2',
          quantity: 20,
          unitPrice: 100,
          vatRate: 20,
        });
      });

      const items = await db.invoiceItems.toArray();
      expect(items.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // PERFORMANCE
  // ============================================================================

  describe('performance avec gros volumes', () => {
    it('gère 1000 factures sans dégrade', async () => {
      const invoices: Invoice[] = [];
      for (let i = 0; i < 1000; i++) {
        invoices.push({
          id: `inv-${i}`,
          number: `FAC-${String(i).padStart(6, '0')}`,
          date: '2026-03-21',
          dueDate: '2026-04-21',
          clientId: `cli-${i % 100}`,
          items: [],
          total: 1000 + i,
          status: (i % 3 === 0 ? 'paid' : 'draft') as any,
          type: 'invoice',
        });
      }

      const start = performance.now();
      await db.invoices.bulkAdd(invoices);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000); // 2 secondes max
      const all = await db.invoices.toArray();
      expect(all).toHaveLength(1000);
    });

    it('cherche rapidement dans 1000 records', async () => {
      const invoices = Array.from({ length: 1000 }, (_, i) => ({
        id: `inv-${i}`,
        number: `FAC-${String(i).padStart(6, '0')}`,
        date: '2026-03-21',
        dueDate: '2026-04-21',
        clientId: `cli-${i % 50}`,
        items: [],
        total: 1000,
        status: 'draft' as const,
        type: 'invoice' as const,
      }));

      await db.invoices.bulkAdd(invoices);

      const start = performance.now();
      const results = await db.invoices.where('clientId').equals('cli-25').toArray();
      const duration = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Index query < 100ms
    });
  });

  // ============================================================================
  // CLEAR & RESET
  // ============================================================================

  describe('clearAll method', () => {
    it('vide complètement la base', async () => {
      await db.invoices.add({
        id: 'inv-1',
        number: 'FAC-001',
        date: '2026-03-21',
        dueDate: '2026-04-21',
        clientId: 'cli-1',
        items: [],
        total: 1000,
        status: 'draft',
        type: 'invoice',
      });
      await db.clients.add({
        id: 'cli-1',
        name: 'Client',
        email: 'test@test.fr',
        phone: '',
        address: '',
        siret: '',
        archived: false,
      });

      expect(await db.invoices.count()).toBe(1);
      expect(await db.clients.count()).toBe(1);

      await db.clearAll();

      expect(await db.invoices.count()).toBe(0);
      expect(await db.clients.count()).toBe(0);
    });
  });
});
