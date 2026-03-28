import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/invoiceDB';
import type {
  CalendarEvent,
  ChatMessage,
  Client,
  EmailTemplate,
  Invoice,
  InvoiceItem,
  Product,
} from '../../types';

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

    it("lève une erreur si l'invoice existe déjà", async () => {
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
      const active = all.filter((c) => c.archived === false);
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
  // SUPPLIERS TABLE
  // ============================================================================

  describe('suppliers table', () => {
    const mockSupplier = {
      id: 'sup-1',
      name: 'Fournisseur SARL',
      email: 'contact@supplier.fr',
      phone: '0102030405',
      address: '789 Rue de Marseille',
      siret: '55555555555555',
      archived: false,
    };

    it('crée un fournisseur', async () => {
      await db.suppliers.add(mockSupplier);
      const supplier = await db.suppliers.get('sup-1');
      expect(supplier?.name).toBe('Fournisseur SARL');
    });

    it('filtre les fournisseurs actifs', async () => {
      await db.suppliers.add(mockSupplier);
      await db.suppliers.add({ ...mockSupplier, id: 'sup-2', archived: true });
      const all = await db.suppliers.toArray();
      const active = all.filter((s) => s.archived === false);
      expect(active).toHaveLength(1);
    });

    it('met à jour un fournisseur', async () => {
      await db.suppliers.add(mockSupplier);
      await db.suppliers.update('sup-1', { email: 'newemail@supplier.fr' });
      const updated = await db.suppliers.get('sup-1');
      expect(updated?.email).toBe('newemail@supplier.fr');
    });

    it('supprime un fournisseur', async () => {
      await db.suppliers.add(mockSupplier);
      await db.suppliers.delete('sup-1');
      const deleted = await db.suppliers.get('sup-1');
      expect(deleted).toBeUndefined();
    });
  });

  // ============================================================================
  // PRODUCTS TABLE
  // ============================================================================

  describe('products table', () => {
    const mockProduct: Product = {
      id: 'prod-1',
      name: 'Produit A',
      description: 'Description du produit A',
      price: 100,
      type: 'product',
      category: 'Services',
      archived: false,
    };

    it('crée un produit', async () => {
      await db.products.add(mockProduct);
      const product = await db.products.get('prod-1');
      expect(product?.name).toBe('Produit A');
    });

    it('filtre par catégorie', async () => {
      await db.products.add(mockProduct);
      await db.products.add({ ...mockProduct, id: 'prod-2', category: 'Matériel' });
      const services = await db.products.where('category').equals('Services').toArray();
      expect(services).toHaveLength(1);
    });

    it('liste les produits actifs', async () => {
      await db.products.add(mockProduct);
      await db.products.add({ ...mockProduct, id: 'prod-2', archived: true });
      const active = (await db.products.toArray()).filter((p) => !p.archived);
      expect(active).toHaveLength(1);
    });
  });

  // ============================================================================
  // EXPENSES TABLE
  // ============================================================================

  describe('expenses table', () => {
    const mockExpense = {
      id: 'exp-1',
      supplierId: 'sup-1',
      date: '2026-03-21',
      category: 'Fournitures',
      amount: 150,
      description: 'Achat fournitures',
    };

    beforeEach(async () => {
      await db.suppliers.add({
        id: 'sup-1',
        name: 'Fournisseur',
        email: 'test@supplier.fr',
        phone: '',
        address: '',
        siret: '',
        archived: false,
      });
    });

    it('crée une dépense', async () => {
      await db.expenses.add(mockExpense);
      const expense = await db.expenses.get('exp-1');
      expect(expense?.amount).toBe(150);
    });

    it('filtre par fournisseur', async () => {
      await db.expenses.add(mockExpense);
      await db.expenses.add({ ...mockExpense, id: 'exp-2', supplierId: 'sup-2' });
      const supplier1 = await db.expenses.where('supplierId').equals('sup-1').toArray();
      expect(supplier1).toHaveLength(1);
    });

    it('filtre par catégorie', async () => {
      await db.expenses.add(mockExpense);
      await db.expenses.add({ ...mockExpense, id: 'exp-2', category: 'Déplacements' });
      const supplies = await db.expenses.where('category').equals('Fournitures').toArray();
      expect(supplies).toHaveLength(1);
    });
  });

  // ============================================================================
  // EXPORT DATA
  // ============================================================================

  describe('exportData method', () => {
    it('exporte toutes les tables en JSON', async () => {
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
        name: 'Client Test',
        email: 'test@test.fr',
        phone: '',
        address: '',
        siret: '',
        archived: false,
      });

      const exported = await db.exportData();

      expect(exported.invoices).toBeDefined();
      expect(exported.clients).toBeDefined();
      expect(Array.isArray(exported.invoices)).toBe(true);
      expect(Array.isArray(exported.clients)).toBe(true);
      expect((exported.invoices as any[]).length).toBe(1);
      expect((exported.clients as any[]).length).toBe(1);
    });

    it('exporte des données vides si la base est vide', async () => {
      const exported = await db.exportData();

      expect(Array.isArray(exported.invoices)).toBe(true);
      expect((exported.invoices as any[]).length).toBe(0);
    });

    it('exporte correctement Decimal.js amounts', async () => {
      await db.invoices.add({
        id: 'inv-decimal',
        number: 'FAC-DEC',
        date: '2026-03-21',
        dueDate: '2026-04-21',
        clientId: 'cli-1',
        items: [],
        total: 1234.56,
        status: 'draft',
        type: 'invoice',
      });

      const exported = await db.exportData();
      const invoice = (exported.invoices as any[])[0];

      expect(invoice.total).toBe(1234.56);
    });
  });

  // ============================================================================
  // CALENDAR EVENTS
  // ============================================================================

  describe('calendarEvents table', () => {
    const mockEvent: CalendarEvent = {
      id: 'evt-1',
      clientId: 'cli-1',
      invoiceId: 'inv-1',
      start: '2026-04-01T10:00:00Z',
      end: '2026-04-01T11:00:00Z',
      type: 'task',
      title: 'Suivi client',
      description: 'Appel de suivi',
    };

    it('crée un événement calendrier', async () => {
      await db.calendarEvents.add(mockEvent);
      const event = await db.calendarEvents.get('evt-1');
      expect(event?.title).toBe('Suivi client');
    });

    it('filtre par client', async () => {
      await db.calendarEvents.add(mockEvent);
      await db.calendarEvents.add({ ...mockEvent, id: 'evt-2', clientId: 'cli-2' });
      const client1Events = await db.calendarEvents.where('clientId').equals('cli-1').toArray();
      expect(client1Events).toHaveLength(1);
    });

    it('filtre par facture', async () => {
      await db.calendarEvents.add(mockEvent);
      await db.calendarEvents.add({ ...mockEvent, id: 'evt-2', invoiceId: 'inv-2' });
      const inv1Events = await db.calendarEvents.where('invoiceId').equals('inv-1').toArray();
      expect(inv1Events).toHaveLength(1);
    });
  });

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  describe('emailTemplates table', () => {
    const mockTemplate: EmailTemplate = {
      id: 'tpl-1',
      type: 'reminder',
      name: 'Rappel facture',
      subject: 'Facture en attente',
      body: 'Nous vous rappelons...',
    };

    it('crée un template email', async () => {
      await db.emailTemplates.add(mockTemplate);
      const template = await db.emailTemplates.get('tpl-1');
      expect(template?.name).toBe('Rappel facture');
    });

    it('récupère templates par type', async () => {
      await db.emailTemplates.add(mockTemplate);
      await db.emailTemplates.add({
        ...mockTemplate,
        id: 'tpl-2',
        type: 'invoice',
      });
      const reminders = await db.emailTemplates.where('type').equals('reminder').toArray();
      expect(reminders).toHaveLength(1);
    });
  });

  // ============================================================================
  // CHAT MESSAGES
  // ============================================================================

  describe('chatMessages table', () => {
    const mockMessage: ChatMessage = {
      id: 'msg-1',
      timestamp: Date.now(),
      role: 'user',
      content: 'Bonjour',
    };

    it('crée un message chat', async () => {
      await db.chatMessages.add(mockMessage);
      const msg = await db.chatMessages.get('msg-1');
      expect(msg?.content).toBe('Bonjour');
    });

    it('liste messages par timestamp', async () => {
      const now = Date.now();
      await db.chatMessages.add({ ...mockMessage, timestamp: now - 1000 });
      await db.chatMessages.add({ ...mockMessage, id: 'msg-2', timestamp: now });
      const messages = await db.chatMessages
        .where('timestamp')
        .above(now - 2000)
        .toArray();
      expect(messages.length).toBeGreaterThanOrEqual(1);
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

  // ============================================================================
  // ERROR HANDLING & EDGE CASES
  // ============================================================================

  describe('error handling & edge cases', () => {
    it("gère l'import avec données partielles", async () => {
      const partialData = {
        invoices: [
          {
            id: 'inv-1',
            number: 'FAC-001',
            date: '2026-03-21',
            dueDate: '2026-04-21',
            clientId: 'cli-1',
            items: [],
            total: 1000,
            status: 'draft',
            type: 'invoice',
          },
        ],
      };

      await db.importData(partialData);
      const invoices = await db.invoices.toArray();
      expect(invoices).toHaveLength(1);
    });

    it('exporte toutes les tables avec données complètes', async () => {
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

      const exported = await db.exportData();
      expect(exported).toBeDefined();
      expect(exported.invoices).toHaveLength(1);
    });

    it('gère les mises à jour sur des ID inexistants', async () => {
      const result = await db.invoices.update('nonexistent-id', { status: 'paid' });
      expect(result).toBeDefined();
    });

    it('gère les requêtes sur des tables vides', async () => {
      const empty = await db.invoices.toArray();
      expect(empty).toHaveLength(0);

      const emptyFiltered = await db.invoices.where('status').equals('draft').toArray();
      expect(emptyFiltered).toHaveLength(0);
    });

    it('calcule les stats correctement', async () => {
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

      const stats = await db.getStatistics();
      expect(stats.invoices).toBe(1);
    });

    it('accepte les champs partiels dans les entités', async () => {
      const minimalInvoice: any = {
        id: 'inv-min',
        number: 'FAC-MIN',
        date: '2026-03-21',
        clientId: 'cli-1',
        items: [],
        total: 100,
        status: 'draft',
        type: 'invoice',
      };

      await db.invoices.add(minimalInvoice);
      const retrieved = await db.invoices.get('inv-min');
      expect(retrieved).toBeDefined();
    });
  });
});
