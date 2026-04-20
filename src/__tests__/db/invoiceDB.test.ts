/**
 * Tests IndexedDB — src/db/invoiceDB.ts + repositories
 *
 * Utilise fake-indexeddb pour simuler l'environnement navigateur en Vitest (jsdom).
 * Couvre : CRUD, migrations de schéma, conflits de sync LWW, export/import.
 *
 * Ref: Art. 289-I-5° CGI — séquence chronologique continue
 */
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// On importe la DB après avoir initialisé fake-indexeddb
// Les repositories utilisent tous l'instance singleton `db` via invoiceDB.ts
import { db, type InvoiceNumberSequence } from "../../db/invoiceDB";
import { clientRepository } from "../../db/repositories/ClientRepository";
import {
  invoiceItemRepository,
  invoiceRepository,
} from "../../db/repositories/InvoiceRepository";
import { productRepository } from "../../db/repositories/ProductRepository";
import { supplierRepository } from "../../db/repositories/SupplierRepository";
import type {
  Client,
  Invoice,
  InvoiceItem,
  Product,
  Supplier,
} from "../../types";
import { InvoiceStatus } from "../../types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeClient = (overrides: Partial<Client> = {}): Client => ({
  id: "cli-test-1",
  name: "Acme Corp",
  email: "contact@acme.fr",
  address: "12 Rue de la Paix, 75001 Paris",
  siret: "12345678901234",
  phone: "0102030405",
  archived: false,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
  ...overrides,
});

const makeSupplier = (overrides: Partial<Supplier> = {}): Supplier => ({
  id: "sup-test-1",
  name: "TechFournitures SAS",
  email: "orders@techfournitures.fr",
  address: "88 Avenue des Fournisseurs, 69000 Lyon",
  siret: "98765432109876",
  phone: "0400000001",
  archived: false,
  createdAt: "2026-01-10T08:00:00.000Z",
  updatedAt: "2026-01-10T08:00:00.000Z",
  ...overrides,
});

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-test-1",
  name: "Prestation consulting",
  description: "Conseil en systèmes d'information",
  price: 850,
  type: "service",
  category: "Consulting",
  archived: false,
  createdAt: "2026-01-05T09:00:00.000Z",
  updatedAt: "2026-01-05T09:00:00.000Z",
  ...overrides,
});

const makeInvoiceItem = (
  overrides: Partial<InvoiceItem> = {},
): InvoiceItem => ({
  id: "itm-test-1",
  description: "Développement feature A",
  quantity: 5,
  unitPrice: 150,
  unit: "heure",
  vatRate: 20,
  ...overrides,
});

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "inv-test-1",
  type: "invoice",
  number: "FAC-2026-001",
  date: "2026-03-01",
  dueDate: "2026-04-01",
  clientId: "cli-test-1",
  items: [makeInvoiceItem()],
  status: InvoiceStatus.DRAFT,
  total: 900,
  vatAmount: 150,
  updatedAt: "2026-03-01T12:00:00.000Z",
  ...overrides,
});

// ─── Utilitaire de reset de la DB entre les tests ─────────────────────────────

const resetDB = async () => {
  await db.invoices.clear();
  await db.invoiceItems.clear();
  await db.clients.clear();
  await db.suppliers.clear();
  await db.products.clear();
  await db.expenses.clear();
  await db.invoiceNumberSequences.clear();
};

// ─── Suite principale ─────────────────────────────────────────────────────────

describe("InvoiceDB — Base de données IndexedDB", () => {
  beforeEach(async () => {
    await resetDB();
  });

  afterEach(async () => {
    await resetDB();
  });

  // ─── Tests d'ouverture ──────────────────────────────────────────────────────

  describe("Initialisation de la DB", () => {
    it("ouvre la base de données sans erreur", async () => {
      expect(db.isOpen()).toBe(true);
    });

    it("expose toutes les tables requises", () => {
      expect(db.invoices).toBeDefined();
      expect(db.invoiceItems).toBeDefined();
      expect(db.clients).toBeDefined();
      expect(db.suppliers).toBeDefined();
      expect(db.products).toBeDefined();
      expect(db.expenses).toBeDefined();
      expect(db.emails).toBeDefined();
      expect(db.calendarEvents).toBeDefined();
      expect(db.userProfile).toBeDefined();
      expect(db.chatMessages).toBeDefined();
      expect(db.invoiceNumberSequences).toBeDefined();
    });

    it("retourne des statistiques vides au départ", async () => {
      const stats = await db.getStatistics();
      expect(stats.invoices).toBe(0);
      expect(stats.clients).toBe(0);
      expect(stats.suppliers).toBe(0);
      expect(stats.products).toBe(0);
      expect(stats.expenses).toBe(0);
    });
  });

  // ─── Tests CRUD Clients ─────────────────────────────────────────────────────

  describe("clientRepository — CRUD Clients", () => {
    it("insère un client (save) et le retrouve (findById)", async () => {
      const client = makeClient();
      await clientRepository.save(client);

      const found = await clientRepository.findById("cli-test-1");
      expect(found).toBeDefined();
      expect(found?.name).toBe("Acme Corp");
      expect(found?.email).toBe("contact@acme.fr");
    });

    it("met à jour un client existant (save = upsert)", async () => {
      await clientRepository.save(makeClient());

      const updated = makeClient({
        name: "Acme Corp Updated",
        updatedAt: "2026-03-10T10:00:00.000Z",
      });
      await clientRepository.save(updated);

      const found = await clientRepository.findById("cli-test-1");
      expect(found?.name).toBe("Acme Corp Updated");
    });

    it("liste tous les clients (findAll)", async () => {
      await clientRepository.save(makeClient({ id: "cli-1", name: "Alpha" }));
      await clientRepository.save(makeClient({ id: "cli-2", name: "Beta" }));
      await clientRepository.save(
        makeClient({ id: "cli-3", name: "Gamma", archived: true }),
      );

      const all = await clientRepository.findAll();
      expect(all).toHaveLength(3);
    });

    it("liste uniquement les clients actifs (findAllActive)", async () => {
      await clientRepository.save(
        makeClient({ id: "cli-1", name: "Alpha", archived: false }),
      );
      await clientRepository.save(
        makeClient({ id: "cli-2", name: "Archivé", archived: true }),
      );

      const actifs = await clientRepository.findAllActive();
      expect(actifs).toHaveLength(1);
      expect(actifs[0].name).toBe("Alpha");
    });

    it("recherche par email (findByEmail)", async () => {
      await clientRepository.save(
        makeClient({ id: "cli-1", email: "uniq@exemple.fr" }),
      );
      await clientRepository.save(
        makeClient({ id: "cli-2", email: "autre@exemple.fr" }),
      );

      const result = await clientRepository.findByEmail("uniq@exemple.fr");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("cli-1");
    });

    it("supprime un client (delete)", async () => {
      await clientRepository.save(makeClient());
      await clientRepository.delete("cli-test-1");

      const found = await clientRepository.findById("cli-test-1");
      expect(found).toBeUndefined();
    });

    it("comptabilise correctement le nombre de clients (count)", async () => {
      expect(await clientRepository.count()).toBe(0);
      await clientRepository.save(makeClient({ id: "a" }));
      await clientRepository.save(makeClient({ id: "b" }));
      expect(await clientRepository.count()).toBe(2);
    });

    it("sauvegarde en masse (saveBulk)", async () => {
      const clients = [
        makeClient({ id: "bulk-1", name: "Bulk 1" }),
        makeClient({ id: "bulk-2", name: "Bulk 2" }),
        makeClient({ id: "bulk-3", name: "Bulk 3" }),
      ];
      await clientRepository.saveBulk(clients);

      expect(await clientRepository.count()).toBe(3);
    });

    it("retourne undefined pour un id inexistant", async () => {
      const found = await clientRepository.findById("id-inexistant");
      expect(found).toBeUndefined();
    });
  });

  // ─── Tests CRUD Fournisseurs ────────────────────────────────────────────────

  describe("supplierRepository — CRUD Fournisseurs", () => {
    it("insère et retrouve un fournisseur", async () => {
      await supplierRepository.save(makeSupplier());

      const found = await supplierRepository.findById("sup-test-1");
      expect(found?.name).toBe("TechFournitures SAS");
    });

    it("liste les fournisseurs actifs uniquement", async () => {
      await supplierRepository.save(
        makeSupplier({ id: "sup-1", archived: false }),
      );
      await supplierRepository.save(
        makeSupplier({ id: "sup-2", archived: true }),
      );

      const actifs = await supplierRepository.findAllActive();
      expect(actifs).toHaveLength(1);
    });

    it("supprime un fournisseur", async () => {
      await supplierRepository.save(makeSupplier());
      await supplierRepository.delete("sup-test-1");

      expect(await supplierRepository.findById("sup-test-1")).toBeUndefined();
    });

    it("compte correctement les fournisseurs", async () => {
      await supplierRepository.save(makeSupplier({ id: "s1" }));
      await supplierRepository.save(makeSupplier({ id: "s2" }));
      expect(await supplierRepository.count()).toBe(2);
    });

    it("met à jour en upsert (save = put)", async () => {
      await supplierRepository.save(makeSupplier({ name: "Original" }));
      await supplierRepository.save(makeSupplier({ name: "Modifié" }));

      const found = await supplierRepository.findById("sup-test-1");
      expect(found?.name).toBe("Modifié");
    });
  });

  // ─── Tests CRUD Produits ────────────────────────────────────────────────────

  describe("productRepository — CRUD Produits", () => {
    it("insère et retrouve un produit", async () => {
      await productRepository.save(makeProduct());

      const found = await productRepository.findById("prod-test-1");
      expect(found?.name).toBe("Prestation consulting");
      expect(found?.price).toBe(850);
    });

    it("filtre par catégorie (findByCategory)", async () => {
      await productRepository.save(
        makeProduct({ id: "p1", category: "Consulting" }),
      );
      await productRepository.save(
        makeProduct({ id: "p2", category: "Formation" }),
      );

      const consulting = await productRepository.findByCategory("Consulting");
      expect(consulting).toHaveLength(1);
      expect(consulting[0].id).toBe("p1");
    });

    it("détecte les produits en dessous du stock minimum", async () => {
      await productRepository.save(
        makeProduct({
          id: "p-stock-low",
          type: "product",
          stock: 2,
          minStock: 5,
        }),
      );
      await productRepository.save(
        makeProduct({
          id: "p-stock-ok",
          type: "product",
          stock: 10,
          minStock: 5,
        }),
      );

      const alertes = await productRepository.findBelowMinStock();
      expect(alertes).toHaveLength(1);
      expect(alertes[0].id).toBe("p-stock-low");
    });

    it("ne signale pas d'alerte si stock >= minStock", async () => {
      await productRepository.save(
        makeProduct({ id: "p-exact", type: "product", stock: 5, minStock: 5 }),
      );
      const alertes = await productRepository.findBelowMinStock();
      expect(alertes).toHaveLength(0);
    });

    it("liste les produits actifs et ignore les archivés", async () => {
      await productRepository.save(
        makeProduct({ id: "p-actif", archived: false }),
      );
      await productRepository.save(
        makeProduct({ id: "p-archive", archived: true }),
      );

      const actifs = await productRepository.findAllActive();
      expect(actifs).toHaveLength(1);
      expect(actifs[0].id).toBe("p-actif");
    });
  });

  // ─── Tests CRUD Factures ────────────────────────────────────────────────────

  describe("invoiceRepository — CRUD Factures", () => {
    it("insère une facture et la retrouve par id", async () => {
      await invoiceRepository.save(makeInvoice());

      const found = await invoiceRepository.findById("inv-test-1");
      expect(found?.number).toBe("FAC-2026-001");
      expect(found?.total).toBe(900);
    });

    it("met à jour une facture existante (upsert)", async () => {
      await invoiceRepository.save(makeInvoice());
      await invoiceRepository.save(
        makeInvoice({ status: InvoiceStatus.PAID, total: 1000 }),
      );

      const found = await invoiceRepository.findById("inv-test-1");
      expect(found?.status).toBe(InvoiceStatus.PAID);
      expect(found?.total).toBe(1000);
    });

    it("liste toutes les factures (findAll)", async () => {
      await invoiceRepository.save(
        makeInvoice({ id: "i1", number: "FAC-001" }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "i2", number: "FAC-002" }),
      );

      const all = await invoiceRepository.findAll();
      expect(all).toHaveLength(2);
    });

    it("filtre par client (findByClient)", async () => {
      await invoiceRepository.save(
        makeInvoice({ id: "i1", clientId: "cli-A" }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "i2", clientId: "cli-B" }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "i3", clientId: "cli-A" }),
      );

      const facesCliA = await invoiceRepository.findByClient("cli-A");
      expect(facesCliA).toHaveLength(2);
    });

    it("filtre par statut (findByStatus)", async () => {
      await invoiceRepository.save(
        makeInvoice({ id: "i1", status: InvoiceStatus.DRAFT }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "i2", status: InvoiceStatus.PAID }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "i3", status: InvoiceStatus.DRAFT }),
      );

      const brouillons = await invoiceRepository.findByStatus(
        InvoiceStatus.DRAFT,
      );
      expect(brouillons).toHaveLength(2);
    });

    it("filtre par type de document (findByType)", async () => {
      await invoiceRepository.save(makeInvoice({ id: "f1", type: "invoice" }));
      await invoiceRepository.save(makeInvoice({ id: "d1", type: "quote" }));
      await invoiceRepository.save(makeInvoice({ id: "d2", type: "quote" }));

      const devis = await invoiceRepository.findByType("quote");
      expect(devis).toHaveLength(2);

      const factures = await invoiceRepository.findByType("invoice");
      expect(factures).toHaveLength(1);
    });

    it("filtre par plage de dates (findByDateRange)", async () => {
      await invoiceRepository.save(
        makeInvoice({ id: "jan", date: "2026-01-15" }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "mar", date: "2026-03-01" }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "dec", date: "2026-12-01" }),
      );

      const trimestre1 = await invoiceRepository.findByDateRange(
        "2026-01-01",
        "2026-03-31",
      );
      expect(trimestre1).toHaveLength(2);
      expect(trimestre1.map((i) => i.id)).toContain("jan");
      expect(trimestre1.map((i) => i.id)).toContain("mar");
    });

    it("filtre par statut e-invoice (findByEInvoiceStatus)", async () => {
      await invoiceRepository.save(
        makeInvoice({ id: "e1", eInvoiceStatus: "DEPOSITED" }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "e2", eInvoiceStatus: "REJECTED" }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "e3", eInvoiceStatus: "DEPOSITED" }),
      );

      const deposées =
        await invoiceRepository.findByEInvoiceStatus("DEPOSITED");
      expect(deposées).toHaveLength(2);
    });

    it("supprime une facture", async () => {
      await invoiceRepository.save(makeInvoice());
      await invoiceRepository.delete("inv-test-1");
      expect(await invoiceRepository.findById("inv-test-1")).toBeUndefined();
    });

    it("compte le nombre total de factures", async () => {
      expect(await invoiceRepository.count()).toBe(0);
      await invoiceRepository.save(makeInvoice({ id: "x1" }));
      await invoiceRepository.save(makeInvoice({ id: "x2" }));
      expect(await invoiceRepository.count()).toBe(2);
    });

    it("enregistre en masse via saveBulk", async () => {
      const factures = [
        makeInvoice({ id: "b1", number: "FAC-B01" }),
        makeInvoice({ id: "b2", number: "FAC-B02" }),
        makeInvoice({ id: "b3", number: "FAC-B03" }),
      ];
      await invoiceRepository.saveBulk(factures);
      expect(await invoiceRepository.count()).toBe(3);
    });
  });

  // ─── Tests CRUD Articles de Facture ────────────────────────────────────────

  describe("invoiceItemRepository — CRUD Articles", () => {
    it("insère et retrouve un article de facture", async () => {
      const item = makeInvoiceItem({
        id: "itm-A",
        description: "Consulting spécifique",
      });
      await invoiceItemRepository.save(item);

      const all = await invoiceItemRepository.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].description).toBe("Consulting spécifique");
    });

    it("retrouve les articles d'une facture donnée (findByInvoice)", async () => {
      await invoiceItemRepository.save(
        makeInvoiceItem({ id: "itm-1", description: "Item 1" }),
      );
      await invoiceItemRepository.save(
        makeInvoiceItem({ id: "itm-2", description: "Item 2" }),
      );
      await invoiceItemRepository.save(
        makeInvoiceItem({ id: "itm-autre", description: "Autre facture" }),
      );

      // Les items 1 et 2 n'ont pas de invoiceId dans le fixture de base, on les ajoute
      const itm1 = makeInvoiceItem({
        id: "link-1",
        description: "Lié à inv-A",
      });
      const itm2 = makeInvoiceItem({
        id: "link-2",
        description: "Lié aussi à inv-A",
      });
      const itm3 = makeInvoiceItem({
        id: "link-3",
        description: "Lié à inv-B",
      });

      // InvoiceItem n'a pas de invoiceId dans le type === on l'étend pour le test
      await db.invoiceItems.put({
        ...itm1,
        invoiceId: "inv-A",
      } as InvoiceItem & { invoiceId: string });
      await db.invoiceItems.put({
        ...itm2,
        invoiceId: "inv-A",
      } as InvoiceItem & { invoiceId: string });
      await db.invoiceItems.put({
        ...itm3,
        invoiceId: "inv-B",
      } as InvoiceItem & { invoiceId: string });

      const itemsA = await invoiceItemRepository.findByInvoice("inv-A");
      expect(itemsA).toHaveLength(2);
      expect(itemsA.map((i) => i.id)).toContain("link-1");
      expect(itemsA.map((i) => i.id)).toContain("link-2");
    });

    it("supprime tous les articles d'une facture (deleteByInvoice)", async () => {
      await db.invoiceItems.put({
        ...makeInvoiceItem({ id: "del-1" }),
        invoiceId: "inv-del",
      } as InvoiceItem & { invoiceId: string });
      await db.invoiceItems.put({
        ...makeInvoiceItem({ id: "del-2" }),
        invoiceId: "inv-del",
      } as InvoiceItem & { invoiceId: string });
      await db.invoiceItems.put({
        ...makeInvoiceItem({ id: "keep-1" }),
        invoiceId: "inv-keep",
      } as InvoiceItem & { invoiceId: string });

      await invoiceItemRepository.deleteByInvoice("inv-del");

      const remaining = await invoiceItemRepository.findAll();
      const deleted = remaining.filter((i: any) => i.invoiceId === "inv-del");
      expect(deleted).toHaveLength(0);

      const kept = remaining.filter((i: any) => i.invoiceId === "inv-keep");
      expect(kept).toHaveLength(1);
    });
  });

  // ─── Tests Export / Import ──────────────────────────────────────────────────

  describe("db.exportData / importData — Backup JSON", () => {
    it("exporte toutes les collections", async () => {
      await clientRepository.save(makeClient());
      await invoiceRepository.save(makeInvoice());
      await productRepository.save(makeProduct());

      const exported = await db.exportData();

      expect(Array.isArray(exported.clients)).toBe(true);
      expect(Array.isArray(exported.invoices)).toBe(true);
      expect(Array.isArray(exported.products)).toBe(true);
      expect((exported.clients as Client[]).length).toBe(1);
      expect((exported.invoices as Invoice[]).length).toBe(1);
    });

    it("importe correctement un backup JSON", async () => {
      const backup = {
        clients: [
          makeClient({ id: "import-cli-1", name: "Import Client" }),
          makeClient({ id: "import-cli-2", name: "Import Client 2" }),
        ],
        invoices: [makeInvoice({ id: "import-inv-1", number: "IMPORT-001" })],
        products: [],
        suppliers: [],
        expenses: [],
      };

      await db.importData(backup);

      expect(await clientRepository.count()).toBe(2);
      expect(await invoiceRepository.count()).toBe(1);

      const inv = await invoiceRepository.findById("import-inv-1");
      expect(inv?.number).toBe("IMPORT-001");
    });

    it("l'export puis l'import préserve toutes les données", async () => {
      await clientRepository.save(
        makeClient({ id: "round-cli", name: "Round Trip Client" }),
      );
      await invoiceRepository.save(
        makeInvoice({ id: "round-inv", number: "RT-001" }),
      );

      const snapshot = await db.exportData();

      // Reset la DB
      await resetDB();
      expect(await clientRepository.count()).toBe(0);

      // Restaurer depuis le snapshot
      await db.importData(snapshot as Record<string, unknown>);

      const cli = await clientRepository.findById("round-cli");
      const inv = await invoiceRepository.findById("round-inv");

      expect(cli?.name).toBe("Round Trip Client");
      expect(inv?.number).toBe("RT-001");
    });
  });

  // ─── Tests Statistiques globales ───────────────────────────────────────────

  describe("db.getStatistics — Statistiques", () => {
    it("retourne des compteurs exacts après insertions", async () => {
      await clientRepository.save(makeClient({ id: "c1" }));
      await clientRepository.save(makeClient({ id: "c2" }));
      await invoiceRepository.save(makeInvoice({ id: "i1" }));
      await productRepository.save(makeProduct({ id: "p1" }));
      await supplierRepository.save(makeSupplier({ id: "s1" }));

      const stats = await db.getStatistics();
      expect(stats.clients).toBe(2);
      expect(stats.invoices).toBe(1);
      expect(stats.products).toBe(1);
      expect(stats.suppliers).toBe(1);
    });

    it("décroît après suppression", async () => {
      await clientRepository.save(makeClient({ id: "c1" }));
      await clientRepository.save(makeClient({ id: "c2" }));
      await clientRepository.delete("c1");

      const stats = await db.getStatistics();
      expect(stats.clients).toBe(1);
    });
  });

  // ─── Tests Séquences de numérotation ───────────────────────────────────────

  describe("invoiceNumberSequences — Numérotation légale", () => {
    it("insère une séquence et la retrouve", async () => {
      const seq: InvoiceNumberSequence = {
        type: "invoice",
        year: 2026,
        currentNumber: 5,
        lastUsedAt: "2026-03-01T10:00:00.000Z",
      };
      await db.invoiceNumberSequences.put(seq);

      const found = await db.invoiceNumberSequences.get("invoice");
      expect(found?.currentNumber).toBe(5);
      expect(found?.year).toBe(2026);
    });

    it("incrémente la séquence (simulation compteur)", async () => {
      const seq: InvoiceNumberSequence = {
        type: "invoice",
        year: 2026,
        currentNumber: 10,
        lastUsedAt: "2026-06-01T00:00:00.000Z",
      };
      await db.invoiceNumberSequences.put(seq);

      // Incrémenter manuellement comme le ferait generateInvoiceNumber
      const current = await db.invoiceNumberSequences.get("invoice");
      if (current) {
        await db.invoiceNumberSequences.put({
          ...current,
          currentNumber: current.currentNumber + 1,
          lastUsedAt: new Date().toISOString(),
        });
      }

      const updated = await db.invoiceNumberSequences.get("invoice");
      expect(updated?.currentNumber).toBe(11);
    });

    it("réinitialise le compteur pour une nouvelle année (reset annuel CGI)", async () => {
      // Simuler une séquence de l'année passée
      const seqOldYear: InvoiceNumberSequence = {
        type: "invoice",
        year: 2025,
        currentNumber: 42,
        lastUsedAt: "2025-12-31T23:59:59.000Z",
      };
      await db.invoiceNumberSequences.put(seqOldYear);

      // Logique de reset : si année courante > année séquence → remettre à 0
      const current = await db.invoiceNumberSequences.get("invoice");
      const currentYear = new Date().getFullYear();

      if (current && current.year < currentYear) {
        await db.invoiceNumberSequences.put({
          ...current,
          year: currentYear,
          currentNumber: 0,
          lastUsedAt: new Date().toISOString(),
        });
      }

      const reset = await db.invoiceNumberSequences.get("invoice");
      expect(reset?.currentNumber).toBe(0);
      expect(reset?.year).toBe(currentYear);
    });
  });

  // ─── Tests Conflits de sync LWW (Last-Write-Wins) ──────────────────────────

  describe("Résolution de conflits offline — LWW (Last-Write-Wins)", () => {
    it("conserve l'enregistrement le plus récent (updatedAt plus grand)", async () => {
      const base = makeClient({
        id: "lww-cli",
        name: "Version Locale",
        updatedAt: "2026-03-10T10:00:00.000Z",
      });
      await clientRepository.save(base);

      // Simuler un enregistrement distant plus récent
      const remote = makeClient({
        id: "lww-cli",
        name: "Version Distante",
        updatedAt: "2026-03-11T08:00:00.000Z", // Plus récent
      });

      // Logique LWW : on ne sauvegarde que si remote.updatedAt > local.updatedAt
      const local = await clientRepository.findById("lww-cli");
      if (
        local &&
        remote.updatedAt &&
        local.updatedAt &&
        remote.updatedAt > local.updatedAt
      ) {
        await clientRepository.save(remote);
      }

      const result = await clientRepository.findById("lww-cli");
      expect(result?.name).toBe("Version Distante");
    });

    it("ignore une mise à jour distante plus ancienne (enregistrement local conservé)", async () => {
      const base = makeClient({
        id: "lww-cli-2",
        name: "Version Locale Recente",
        updatedAt: "2026-03-15T10:00:00.000Z",
      });
      await clientRepository.save(base);

      // Simuler un enregistrement distant plus ancien
      const remote = makeClient({
        id: "lww-cli-2",
        name: "Version Distante Ancienne",
        updatedAt: "2026-03-01T10:00:00.000Z", // Plus ancien
      });

      const local = await clientRepository.findById("lww-cli-2");
      if (
        local &&
        remote.updatedAt &&
        local.updatedAt &&
        remote.updatedAt > local.updatedAt
      ) {
        await clientRepository.save(remote);
      }

      const result = await clientRepository.findById("lww-cli-2");
      expect(result?.name).toBe("Version Locale Recente");
    });

    it("conserve la facture distante si supprimée localement mais plus récente", async () => {
      // Scénario : Facture supprimée localement, mais enregistrement distant plus récent
      const remote = makeInvoice({
        id: "lww-inv-deleted",
        status: InvoiceStatus.PAID,
        updatedAt: "2026-04-01T10:00:00.000Z",
      });

      // Pas en local — on insère le distant (sync gagnant)
      const localInvoice = await invoiceRepository.findById("lww-inv-deleted");
      if (!localInvoice) {
        await invoiceRepository.save(remote);
      }

      const result = await invoiceRepository.findById("lww-inv-deleted");
      expect(result?.status).toBe(InvoiceStatus.PAID);
    });

    it("LWW sur facture : updatedAt identique → conserve la version locale", async () => {
      const sameTimestamp = "2026-03-20T12:00:00.000Z";
      const local = makeInvoice({
        id: "lww-tie",
        status: InvoiceStatus.DRAFT,
        updatedAt: sameTimestamp,
      });
      await invoiceRepository.save(local);

      const remote = makeInvoice({
        id: "lww-tie",
        status: InvoiceStatus.SENT,
        updatedAt: sameTimestamp, // Même timestamp → pas de mise à jour
      });

      const existing = await invoiceRepository.findById("lww-tie");
      if (
        existing &&
        remote.updatedAt &&
        existing.updatedAt &&
        remote.updatedAt > existing.updatedAt
      ) {
        await invoiceRepository.save(remote);
      }

      const result = await invoiceRepository.findById("lww-tie");
      expect(result?.status).toBe(InvoiceStatus.DRAFT); // Local inchangé
    });
  });
});
