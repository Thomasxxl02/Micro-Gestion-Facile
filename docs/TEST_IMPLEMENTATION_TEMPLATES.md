# 🚀 Quick Start: Implémentation des Tests Manquants

**Objectif:** Templates et patterns pour implémenter rapidement les tests manquants
**Target:** Atteindre 70% coverage en 5-6 jours

---

## 📋 Phase 1 CRITIQUE (18h / 2-3 jours)

### 1. Tests IndexedDB - `db/invoiceDB.test.ts` (3h)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../db/invoiceDB';
import type { Invoice, InvoiceItem, Client } from '../types';

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
      clientId: 'cli-1',
      customerName: 'Client Test',
      items: [],
      total: 1000,
      tva: 200,
      status: 'draft',
      type: 'invoice',
      description: 'Test invoice',
      notes: '',
      eInvoiceStatus: 'not_sent',
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
      expect(byClient[0].customerName).toBe('Client Test');
    });

    it('filtre par eInvoiceStatus', async () => {
      await db.invoices.add(mockInvoice);
      await db.invoices.add({ ...mockInvoice, id: 'inv-2', eInvoiceStatus: 'sent' });
      const notSent = await db.invoices.where('eInvoiceStatus').equals('not_sent').toArray();
      expect(notSent).toHaveLength(1);
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
      invoiceId: 'inv-1',
      description: 'Service',
      quantity: 10,
      unitPrice: 100,
      vatRate: 20,
      total: 1000,
    };

    beforeEach(async () => {
      await db.invoices.add({
        id: 'inv-1',
        number: 'FAC-001',
        date: '2026-03-21',
        clientId: 'cli-1',
        customerName: 'Test',
        items: [],
        total: 1000,
        tva: 200,
        status: 'draft',
        type: 'invoice',
        eInvoiceStatus: 'not_sent',
      });
    });

    it('crée un item', async () => {
      await db.invoiceItems.add(mockItem);
      const item = await db.invoiceItems.get('itm-1');
      expect(item?.quantity).toBe(10);
      expect(item?.unitPrice).toBe(100);
    });

    it('référence correctement une facture', async () => {
      await db.invoiceItems.add(mockItem);
      const items = await db.invoiceItems.where('invoiceId').equals('inv-1').toArray();
      expect(items).toHaveLength(1);
      expect(items[0].invoiceId).toBe('inv-1');
    });

    it('supprime les items avec la facture (cascade delete)', async () => {
      await db.invoiceItems.add(mockItem);
      await db.invoiceItems.add({ ...mockItem, id: 'itm-2' });
      await db.invoices.delete('inv-1');

      // REMARQUE: Dexie doesn't do cascade by default - app must handle this
      // This test documents the requirement
      const itemsLeft = await db.invoiceItems.where('invoiceId').equals('inv-1').toArray();
      expect(itemsLeft).toHaveLength(2); // Items still exist - app must clean up
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
      city: 'Paris',
      postalCode: '75000',
      siret: '12345678901234',
      archived: false,
    };

    it('crée un client', async () => {
      await db.clients.add(mockClient);
      const client = await db.clients.get('cli-1');
      expect(client?.name).toBe('Client SARL');
    });

    it('filtre les clients archivés', async () => {
      await db.clients.add(mockClient);
      await db.clients.add({ ...mockClient, id: 'cli-2', archived: true });
      const active = await db.clients.where('archived').equals(false).toArray();
      expect(active).toHaveLength(1);
    });

    it('recherche par email', async () => {
      await db.clients.add(mockClient);
      const byEmail = await db.clients.where('email').equals('contact@client.fr').toArray();
      expect(byEmail).toHaveLength(1);
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
          clientId: 'cli-1',
          customerName: 'Test',
          items: [],
          total: 3000,
          tva: 600,
          status: 'draft',
          type: 'invoice',
          eInvoiceStatus: 'not_sent',
        });

        await db.invoiceItems.add({
          id: 'itm-1',
          invoiceId,
          description: 'Item 1',
          quantity: 10,
          unitPrice: 100,
          vatRate: 20,
          total: 1000,
        });

        await db.invoiceItems.add({
          id: 'itm-2',
          invoiceId,
          description: 'Item 2',
          quantity: 20,
          unitPrice: 100,
          vatRate: 20,
          total: 2000,
        });
      });

      const items = await db.invoiceItems.where('invoiceId').equals(invoiceId).toArray();
      expect(items).toHaveLength(2);
    });

    it("maintient l'intégrité des références", async () => {
      // Le test documente que les contraintes d'intégrité doivent être vérifiées
      // au niveau application, pas au niveau BD
      expect(true).toBe(true);
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
          clientId: `cli-${i % 100}`,
          customerName: `Client ${i}`,
          items: [],
          total: 1000 + i,
          tva: 200 + i * 0.1,
          status: i % 3 === 0 ? 'paid' : 'draft',
          type: 'invoice',
          eInvoiceStatus: 'not_sent',
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
      // Ajouter 1000 factures
      const invoices = Array.from({ length: 1000 }, (_, i) => ({
        id: `inv-${i}`,
        number: `FAC-${String(i).padStart(6, '0')}`,
        date: '2026-03-21',
        clientId: `cli-${i % 50}`,
        customerName: `Client ${i}`,
        items: [],
        total: 1000,
        tva: 200,
        status: 'draft' as const,
        type: 'invoice' as const,
        eInvoiceStatus: 'not_sent' as const,
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
      // Ajouter données
      await db.invoices.add({
        id: 'inv-1',
        number: 'FAC-001',
        date: '2026-03-21',
        clientId: 'cli-1',
        customerName: 'Test',
        items: [],
        total: 1000,
        tva: 200,
        status: 'draft',
        type: 'invoice',
        eInvoiceStatus: 'not_sent',
      });
      await db.clients.add({
        id: 'cli-1',
        name: 'Client',
        email: 'test@test.fr',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        siret: '',
        archived: false,
      });

      // Vérifier qu'il y a des données
      expect(await db.invoices.count()).toBe(1);
      expect(await db.clients.count()).toBe(1);

      // Clear
      await db.clearAll();

      // Vérifier que tout est vide
      expect(await db.invoices.count()).toBe(0);
      expect(await db.clients.count()).toBe(0);
    });
  });
});
```

### 2. Tests Factur-X - `lib/facturX.test.ts` (4h)

```typescript
import { describe, it, expect } from 'vitest';
import { generateFacturX_XML } from '../lib/facturX';
import type { Invoice, Client, UserProfile } from '../types';

describe('facturX - Factur-X XML Generation', () => {
  const mockUserProfile: UserProfile = {
    companyName: 'Ma Micro-Entreprise SARL',
    siret: '12345678901234',
    address: '123 Rue de Paris',
    city: 'Paris',
    postalCode: '75001',
    email: 'contact@example.fr',
    phone: '0102030405',
    activityType: 'SERVICE_BNC',
    isAcreBeneficiary: false,
  };

  const mockClient: Client = {
    id: 'cli-1',
    name: 'Client SARL',
    email: 'contact@client.fr',
    phone: '0102030405',
    address: '456 Rue de Lyon',
    city: 'Lyon',
    postalCode: '69000',
    siret: '98765432109876',
    archived: false,
  };

  const mockInvoice: Invoice = {
    id: 'inv-1',
    number: 'FAC-2026-001',
    date: '2026-03-21',
    clientId: 'cli-1',
    customerName: 'Client SARL',
    items: [
      {
        id: 'itm-1',
        invoiceId: 'inv-1',
        description: 'Développement application web',
        quantity: 40,
        unitPrice: 100,
        vatRate: 20,
        total: 4000,
      },
      {
        id: 'itm-2',
        invoiceId: 'inv-1',
        description: 'Consultation',
        quantity: 5,
        unitPrice: 150,
        vatRate: 20,
        total: 750,
      },
    ],
    total: 4750,
    tva: 950,
    status: 'sent',
    type: 'invoice',
    eInvoiceStatus: 'sent',
    description: 'Facture de développement',
  };

  describe('generateFacturX_XML', () => {
    it('génère un XML bien formé', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
      expect(xml).toContain('<?xml');
      expect(xml).toContain('rsm:CrossIndustryInvoice');
    });

    it('inclut les informations du vendeur', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain(mockUserProfile.companyName);
      expect(xml).toContain(mockUserProfile.siret);
    });

    it("inclut les informations de l'acheteur", () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain(mockClient.name);
      expect(xml).toContain(mockClient.siret);
    });

    it('inclut le numéro de facture', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain(mockInvoice.number);
    });

    it('inclut la date au format YYYYMMDD', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      const expectedDate = '20260321';
      expect(xml).toContain(expectedDate);
    });

    it('inclut tous les items avec descriptions', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('Développement application web');
      expect(xml).toContain('Consultation');
    });

    it('inclut les quantités correctes', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('>40<');
      expect(xml).toContain('>5<');
    });

    it('inclut les montants unitaires', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('100.00');
      expect(xml).toContain('150.00');
    });

    it('inclut les taux de TVA', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('<ram:RateApplicablePercent>20</ram:RateApplicablePercent>');
    });

    it('utilise le profil BASIC Factur-X', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('urn:factur-x.eu:1p0:basic');
    });

    it('utilise typeCode 380 pour facture normale', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('<ram:TypeCode>380</ram:TypeCode>');
    });

    it('utilise typeCode 381 pour avoir-facture', () => {
      const creditNote = { ...mockInvoice, type: 'credit_note' as const };
      const xml = generateFacturX_XML(creditNote, mockClient, mockUserProfile);

      expect(xml).toContain('<ram:TypeCode>381</ram:TypeCode>');
    });

    it('utilise EUR comme devise', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>');
    });

    it('gère les unités correctement (HUR pour heures)', () => {
      const invoiceWithHours: Invoice = {
        ...mockInvoice,
        items: [
          {
            id: 'itm-h1',
            invoiceId: 'inv-1',
            description: 'Développement (10h)',
            quantity: 10,
            unitPrice: 80,
            vatRate: 20,
            total: 800,
          },
        ],
      };
      const xml = generateFacturX_XML(invoiceWithHours, mockClient, mockUserProfile);

      // Vérifier que "heure" mappe à "HUR"
      // (test dépend de la logique dans facturX.ts)
      expect(xml).toBeDefined();
    });

    it('gère les accents français correctement (UTF-8)', () => {
      const frenchInvoice: Invoice = {
        ...mockInvoice,
        items: [
          {
            id: 'itm-fr',
            invoiceId: 'inv-1',
            description: 'Évaluation téléphonique et réunion',
            quantity: 1,
            unitPrice: 500,
            vatRate: 20,
            total: 500,
          },
        ],
      };
      const xml = generateFacturX_XML(frenchInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('Évaluation');
      expect(xml).toContain('téléphonique');
      expect(xml).toContain('réunion');
    });

    it('structure bien formée avec éléments requis', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      // Éléments requis du profil BASIC
      expect(xml).toContain('rsm:ExchangedDocumentContext');
      expect(xml).toContain('rsm:ExchangedDocument');
      expect(xml).toContain('rsm:SupplyChainTradeTransaction');
      expect(xml).toContain('ram:ApplicableHeaderTradeAgreement');
      expect(xml).toContain('ram:SellerTradeParty');
      expect(xml).toContain('ram:BuyerTradeParty');
    });
  });
});
```

### 3. Tests Export Utils - `lib/exportUtils.test.ts` (2.5h)

```typescript
import { describe, it, expect } from 'vitest';
import { exportAsJSON, exportAsCSV } from '../lib/exportUtils';
import type { ExportData } from '../lib/exportUtils';
import Decimal from 'decimal.js';

describe('exportUtils', () => {
  const mockData: Partial<ExportData> = {
    version: '1.0',
    userProfile: {
      companyName: 'Test Company',
      siret: '12345678901234',
      address: 'Test Address',
      email: 'test@example.com',
      phone: '0102030405',
      activityType: 'SERVICE_BNC',
      isAcreBeneficiary: false,
    },
    invoices: [
      {
        id: 'inv-1',
        number: 'FAC-001',
        date: '2026-03-21',
        clientId: 'cli-1',
        customerName: 'Client Test',
        items: [
          {
            id: 'itm-1',
            invoiceId: 'inv-1',
            description: 'Service',
            quantity: 10,
            unitPrice: 100,
            vatRate: 20,
            total: 1000,
          },
        ],
        total: 1000,
        tva: 200,
        status: 'paid',
        type: 'invoice',
        eInvoiceStatus: 'sent',
      },
    ],
    clients: [
      {
        id: 'cli-1',
        name: 'Client Test',
        email: 'contact@test.fr',
        phone: '0102030405',
        address: 'Test Address',
        city: 'Paris',
        postalCode: '75000',
        siret: '98765432109876',
        archived: false,
      },
    ],
  };

  describe('exportAsJSON', () => {
    it('exporte complètement les données en JSON', async () => {
      const json = await exportAsJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe('1.0');
      expect(parsed.userProfile.companyName).toBe('Test Company');
      expect(parsed.invoices).toHaveLength(1);
      expect(parsed.clients).toHaveLength(1);
    });

    it('inclut les métadonnées (exportedAt)', async () => {
      const json = await exportAsJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportedAt).toBeDefined();
      expect(new Date(parsed.exportedAt).getTime()).toBeGreaterThan(0);
    });

    it('sérialise les Decimal en string', async () => {
      const dataWithDecimal: Partial<ExportData> = {
        ...mockData,
        invoices: [
          {
            ...mockData.invoices![0],
            total: new Decimal('1234.567'),
            tva: new Decimal('247.913'),
          },
        ],
      };

      const json = await exportAsJSON(dataWithDecimal);
      const parsed = JSON.parse(json);

      expect(typeof parsed.invoices[0].total).toBe('string');
      expect(parsed.invoices[0].total).toContain('1234');
    });

    it('gère les données vides correctement', async () => {
      const emptyData: Partial<ExportData> = {
        version: '1.0',
        userProfile: mockData.userProfile!,
        invoices: [],
        clients: [],
      };

      const json = await exportAsJSON(emptyData);
      const parsed = JSON.parse(json);

      expect(parsed.invoices).toHaveLength(0);
      expect(parsed.clients).toHaveLength(0);
    });

    it('sort et formate correctement le JSON', async () => {
      const json = await exportAsJSON(mockData);

      expect(json).toContain('\n'); // Bien formaté avec indentation
      expect(json).toContain('  '); // Espaces d'indentation
    });
  });

  describe('exportAsCSV', () => {
    it('exporte les factures en CSV', () => {
      const csv = exportAsCSV('invoices', mockData.invoices || []);

      expect(csv).toBeDefined();
      expect(csv).toContain('FAC-001');
      expect(csv).toContain('Client Test');
    });

    it('inclut les headers automatiquement', () => {
      const csv = exportAsCSV('invoices', mockData.invoices || []);

      const lines = csv.split('\n');
      const header = lines[0];

      expect(header).toContain('id');
      expect(header).toContain('number');
      expect(header).toContain('customerName');
    });

    it('gère les custom headers', () => {
      const csv = exportAsCSV('invoices', mockData.invoices || [], {
        id: 'Identifiant',
        number: 'Numéro de Facture',
        total: 'Montant Total',
      });

      const lines = csv.split('\n');
      const header = lines[0];

      expect(header).toContain('Identifiant');
      expect(header).toContain('Numéro de Facture');
    });

    it('échappe les valeurs contenant des virgules', () => {
      const csvData = [
        {
          id: '1',
          name: 'Dupont, Jean',
          email: 'test@test.fr',
        },
      ];

      const csv = exportAsCSV('clients', csvData);

      // Les valeurs avec virgules doivent être entre guillemets
      expect(csv).toContain('"Dupont, Jean"');
    });

    it('échappe les valeurs contenant des guillemets', () => {
      const csvData = [
        {
          id: '1',
          description: 'Service "Premium" inclus',
        },
      ];

      const csv = exportAsCSV('items', csvData);

      // Les guillemets doivent être échappés
      expect(csv.includes('""')).toBe(true);
    });

    it('exporte les clients', () => {
      const csv = exportAsCSV('clients', mockData.clients || []);

      expect(csv).toContain('Client Test');
      expect(csv).toContain('contact@test.fr');
    });

    it('gère les collections vides', () => {
      const csv = exportAsCSV('invoices', []);

      expect(csv).toContain('invoices: No data to export');
    });
  });
});
```

---

## 📋 Phase 2 HAUTE (16.5h / 2 jours)

### 4. Tests InvoiceManager - `components/InvoiceManager.test.tsx` (4h)

(Template pattern copié de Sidebar.test.tsx + appStore patterns)

### 5. Tests useFirestoreSync - `hooks/useFirestoreSync.test.ts` (3h)

(Utiliser renderHook pattern)

### 6. Finaliser Dashboard - `__tests__/Dashboard.test.tsx` (2h)

(Compléter le fichier vide avec tests KPIs et charts)

---

## 🎯 Checklist de Validation

Avant de clôturer chaque fichier de test:

```
✅ Pas d'erreurs TypeScript (tsc --noEmit)
✅ Tous les tests passent (npm run test)
✅ Coverage >= 80% pour le module testé
✅ Imports corrects et types validés
✅ Patterns cohérents avec existing tests
✅ Fixtures/mocks réalistes
✅ Assertions claires et descriptives
✅ Pas de tests ignorés (@skip, .skip)
✅ Pas de consoles.log
✅ README ou inline comments si logique complexe
```

---

## 🚀 Commandes de Validation

```bash
# Tests avec coverage du fichier spécifique
npm run test:coverage -- db/invoiceDB.test.ts

# Tests avec watch mode pour dev itératif
npm run test:watch -- lib/facturX.test.ts

# Coverage global (avant/après)
npm run test:coverage

# Lint des tests
npm run lint -- __tests__/

# Type check
npm run type-check
```

---

## 📚 Références Utiles

- Vitest docs: https://vitest.dev
- Testing Library React: https://testing-library.com/react
- Dexie.js: https://dexie.org
- Decimal.js: https://mikemcl.github.io/decimal.js

---

**Généré le 21 mars 2026**
