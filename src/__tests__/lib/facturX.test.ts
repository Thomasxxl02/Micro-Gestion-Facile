/**
 * Tests Factur-X — src/lib/facturX.ts
 *
 * Valide la conformité du XML généré au profil BASIC de Factur-X (ZUGFeRD)
 * selon la réforme de la facturation électronique obligatoire 2026 (art. L 441-9 C.com).
 *
 * Tests couverts :
 * - Structure XML de base (namespaces, balises obligatoires BASIC)
 * - Facture simple sans TVA (art. 293 B CGI — franchise en base)
 * - Facture avec TVA (taux normal 20%, réduit 10%, 5.5%)
 * - Multi-lignes articles
 * - Avoir (type 381 vs 380)
 * - Caractères spéciaux (XSS, entités XML)
 * - Signature SHA-256
 * - Adresses et codes postaux
 * - Cas limites (champs vides/undefined)
 */
import { describe, expect, it } from "vitest";
import {
  generateFacturX_XML,
  simulateDigitalSignature,
} from "../../lib/facturX";
import type { Client, Invoice, InvoiceItem, UserProfile } from "../../types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeUserProfile = (
  overrides: Partial<UserProfile> = {},
): UserProfile => ({
  companyName: "Ma Micro-Entreprise",
  siret: "12345678901234",
  address: "15 Rue de la Liberté, 75011 Paris",
  email: "contact@maboite.fr",
  phone: "0102030405",
  activityType: "SERVICE_BNC",
  isAcreBeneficiary: false,
  isVatExempt: true,
  vatExemptionReason: "TVA non applicable, art. 293 B du CGI",
  ...overrides,
});

const makeClient = (overrides: Partial<Client> = {}): Client => ({
  id: "cli-1",
  name: "Client Test SARL",
  email: "compta@clienttest.fr",
  address: "42 Avenue de la Paix, 69003 Lyon",
  siret: "98765432109876",
  phone: "0400000001",
  tvaNumber: "FR12987654321",
  ...overrides,
});

const makeItem = (overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
  id: "item-1",
  description: "Développement application web",
  quantity: 8,
  unitPrice: 125,
  unit: "heure",
  vatRate: 20,
  ...overrides,
});

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "inv-1",
  type: "invoice",
  number: "FAC-2026-001",
  date: "2026-03-15",
  dueDate: "2026-04-15",
  clientId: "cli-1",
  items: [makeItem()],
  status: "Envoyée",
  total: 1200,
  vatAmount: 200,
  ...overrides,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrait un tag XML et son contenu */
const _getXMLTagContent = (xml: string, tag: string): string | null => {
  const match = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`).exec(xml);
  return match ? match[1].trim() : null;
};

/** Vérifie qu'un tag XML est présent */
const _hasXMLTag = (xml: string, tag: string): boolean =>
  xml.includes(`<${tag}`) ||
  xml.includes(`<ram:${tag}`) ||
  xml.includes(`<rsm:${tag}`);

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe("generateFacturX_XML — Conformité Factur-X BASIC 2026", () => {
  const userProfile = makeUserProfile();
  const client = makeClient();
  const invoice = makeInvoice();

  // ─── Structure XML globale ─────────────────────────────────────────────────

  describe("Structure XML de base", () => {
    it("génère un XML valide commençant par la déclaration XML", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });

    it("contient le namespace CrossIndustryInvoice (profil BASIC)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("urn:factur-x.eu:1p0:basic");
    });

    it("contient le namespace CrossIndustryInvoice rsm", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain(
        "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
      );
    });

    it("contient le namespace ram (ReusableAggregateBusinessInformationEntity)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain(
        "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
      );
    });

    it("se termine par la balise racine fermante", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml.trimEnd()).toMatch(/<\/rsm:CrossIndustryInvoice>$/);
    });
  });

  // ─── ExchangedDocument — Métadonnées de la facture ─────────────────────────

  describe("ExchangedDocument — Identifiant et date", () => {
    it("contient le numéro de facture (ram:ID)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("<ram:ID>FAC-2026-001</ram:ID>");
    });

    it("contient le TypeCode 380 pour une facture standard", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
    });

    it("contient le TypeCode 381 pour un avoir (credit_note)", () => {
      const avoir = makeInvoice({ type: "credit_note", number: "AV-2026-001" });
      const xml = generateFacturX_XML(avoir, client, userProfile);
      expect(xml).toContain("<ram:TypeCode>381</ram:TypeCode>");
    });

    it("formate la date d'émission en format 102 (YYYYMMDD)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      // 2026-03-15 → 20260315
      expect(xml).toContain("20260315");
    });

    it("formate la date d'échéance en format 102 (YYYYMMDD)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      // 2026-04-15 → 20260415
      expect(xml).toContain("20260415");
    });
  });

  // ─── SellerTradeParty — Vendeur (micro-entrepreneur) ──────────────────────

  describe("SellerTradeParty — Informations vendeur", () => {
    it("contient le nom de l'entreprise", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("Ma Micro-Entreprise");
    });

    it("contient le SIRET du vendeur (schemeID 0002)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain('schemeID="0002"');
      expect(xml).toContain("12345678901234");
    });

    it("extrait correctement le code postal Paris (75011)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("75011");
    });

    it("utilise FR comme CountryID pour la France", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      // Doit contenir au moins une fois <ram:CountryID>FR</ram:CountryID>
      const matches = xml.match(/<ram:CountryID>FR<\/ram:CountryID>/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── BuyerTradeParty — Client ──────────────────────────────────────────────

  describe("BuyerTradeParty — Informations client", () => {
    it("contient le nom du client", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("Client Test SARL");
    });

    it("contient l'adresse du client", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("42 Avenue de la Paix, 69003 Lyon");
    });

    it("extrait le code postal Lyon (69003)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("69003");
    });

    it("contient le SIRET du client", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("98765432109876");
    });
  });

  // ─── Lignes d'articles (IncludedSupplyChainTradeLineItem) ─────────────────

  describe("Lignes d'articles — IncludedSupplyChainTradeLineItem", () => {
    it("génère une ligne pour chaque article", () => {
      const invoiceMultiItems = makeInvoice({
        items: [
          makeItem({ id: "i1", description: "Service A" }),
          makeItem({ id: "i2", description: "Service B" }),
          makeItem({ id: "i3", description: "Service C" }),
        ],
      });
      const xml = generateFacturX_XML(invoiceMultiItems, client, userProfile);
      const lineCount = (xml.match(/IncludedSupplyChainTradeLineItem/g) || [])
        .length;
      // On a ouverture + fermeture de balise pour chaque item × 2
      expect(lineCount).toBe(6); // 3 items × 2 balises (open+close)
    });

    it("contient les descriptions des articles", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("Développement application web");
    });

    it("contient le prix unitaire au format 2 décimales", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("125.00");
    });

    it("contient la quantité avec unité HUR pour heures", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain('unitCode="HUR"');
    });

    it("utilise unitCode C62 pour les unités non-heure", () => {
      const invoiceUnite = makeInvoice({
        items: [makeItem({ unit: "unité", quantity: 3 })],
      });
      const xml = generateFacturX_XML(invoiceUnite, client, userProfile);
      expect(xml).toContain('unitCode="C62"');
    });

    it("contient le total de ligne (LineTotalAmount)", () => {
      // 8h × 125€ = 1000€
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("1000.00");
    });

    it("utilise CategoryCode S pour TVA standard (20%)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain("<ram:CategoryCode>S</ram:CategoryCode>");
    });

    it("utilise CategoryCode Z pour TVA zéro (0%)", () => {
      const invoiceZeroVat = makeInvoice({
        items: [makeItem({ vatRate: 0 })],
      });
      const xml = generateFacturX_XML(invoiceZeroVat, client, userProfile);
      expect(xml).toContain("<ram:CategoryCode>Z</ram:CategoryCode>");
    });

    it("utilise CategoryCode E pour article exonéré (pas de vatRate)", () => {
      const invoiceExempt = makeInvoice({
        items: [makeItem({ vatRate: undefined })],
      });
      const xml = generateFacturX_XML(invoiceExempt, client, userProfile);
      expect(xml).toContain("<ram:CategoryCode>E</ram:CategoryCode>");
    });
  });

  // ─── Fiche fiscale — Totaux ────────────────────────────────────────────────

  describe("SpecifiedTradeSettlementHeaderMonetarySummation — Totaux", () => {
    it("contient le TaxBasisTotalAmount (sous-total HT)", () => {
      // 8 × 125 = 1000 HT
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain(
        "<ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>",
      );
    });

    it("calcule la TVA correctement si non fournie", () => {
      const invoiceNoVat = makeInvoice({
        vatAmount: undefined,
        items: [makeItem({ quantity: 10, unitPrice: 100, vatRate: 20 })],
        total: 1200,
      });
      const xml = generateFacturX_XML(invoiceNoVat, client, userProfile);
      // 10 × 100 × 20% = 200
      expect(xml).toContain("200.00");
    });

    it("utilise la TVA fournie si définie (invoice.vatAmount)", () => {
      const invoiceWithVat = makeInvoice({ vatAmount: 150, total: 1150 });
      const xml = generateFacturX_XML(invoiceWithVat, client, userProfile);
      expect(xml).toContain("150.00");
    });

    it("contient le GrandTotalAmount (TTC = HT + TVA)", () => {
      // 1000 HT + 200 TVA = 1200 TTC
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain(
        "<ram:GrandTotalAmount>1200.00</ram:GrandTotalAmount>",
      );
    });

    it("contient le DuePayableAmount (montant dû)", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain(
        "<ram:DuePayableAmount>1200.00</ram:DuePayableAmount>",
      );
    });

    it("code devise EUR", () => {
      const xml = generateFacturX_XML(invoice, client, userProfile);
      expect(xml).toContain(
        "<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>",
      );
    });
  });

  // ─── Cas particuliers — TVA multi-taux ────────────────────────────────────

  describe("Multi-taux TVA", () => {
    it("gère plusieurs taux de TVA sur des lignes différentes", () => {
      const invoiceMultiVat = makeInvoice({
        items: [
          makeItem({ id: "i1", vatRate: 20, quantity: 1, unitPrice: 100 }),
          makeItem({ id: "i2", vatRate: 10, quantity: 1, unitPrice: 50 }),
          makeItem({ id: "i3", vatRate: 5.5, quantity: 1, unitPrice: 200 }),
        ],
        vatAmount: 20 + 5 + 11,
        total: 100 + 50 + 200 + 20 + 5 + 11,
      });
      const xml = generateFacturX_XML(invoiceMultiVat, client, userProfile);

      // Les trois taux doivent être présents
      expect(xml).toContain("20");
      expect(xml).toContain("10");
      expect(xml).toContain("5.5");
    });
  });

  // ─── Sécurité — Échappement XSS / injection XML ───────────────────────────

  describe("Sécurité — Échappement des caractères XML", () => {
    it("échappe les &amp; dans les descriptions", () => {
      const dangerousItem = makeItem({ description: "Projet A & B" });
      const invoiceWithXSS = makeInvoice({ items: [dangerousItem] });
      const xml = generateFacturX_XML(invoiceWithXSS, client, userProfile);
      expect(xml).toContain("Projet A &amp; B");
      expect(xml).not.toContain("Projet A & B"); // brut non-échappé interdit
    });

    it("échappe les < et > dans les noms de société", () => {
      const xssProfile = makeUserProfile({
        companyName: '<script>alert("XSS")</script>',
      });
      const xml = generateFacturX_XML(invoice, client, xssProfile);
      expect(xml).toContain("&lt;script&gt;");
      expect(xml).not.toContain("<script>");
    });

    it("échappe les guillemets dans les champs texte", () => {
      const quotedClient = makeClient({ name: 'Client "Guillemets" Inc.' });
      const xml = generateFacturX_XML(invoice, quotedClient, userProfile);
      expect(xml).toContain("&quot;");
    });

    it("échappe les apostrophes dans les adresses", () => {
      const apostropheProfile = makeUserProfile({
        address: "15 Rue de l'Église, 75001 Paris",
      });
      const xml = generateFacturX_XML(invoice, client, apostropheProfile);
      expect(xml).toContain("&apos;");
    });

    it("gère les valeurs undefined sans crash (adresse undefined)", () => {
      const noAddressClient = makeClient({
        address: undefined as unknown as string,
      });
      expect(() =>
        generateFacturX_XML(invoice, noAddressClient, userProfile),
      ).not.toThrow();
    });

    it("gère un client sans SIRET (champ optionnel)", () => {
      const noSiretClient = makeClient({ siret: undefined });
      const xml = generateFacturX_XML(invoice, noSiretClient, userProfile);
      expect(xml).toBeDefined();
      expect(xml.length).toBeGreaterThan(100);
    });
  });

  // ─── Extraction codes postaux ──────────────────────────────────────────────

  describe("Extraction codes postaux", () => {
    it("extrait le code postal de Lyon (69000)", () => {
      const lyonClient = makeClient({
        address: "10 Rue Victor Hugo, 69000 Lyon",
      });
      const xml = generateFacturX_XML(invoice, lyonClient, userProfile);
      expect(xml).toContain("69000");
    });

    it("extrait le code postal de Marseille (13000)", () => {
      const marseilleClient = makeClient({
        address: "5 Rue de la Republique, 13000 Marseille",
      });
      const xml = generateFacturX_XML(invoice, marseilleClient, userProfile);
      expect(xml).toContain("13000");
    });

    it("utilise 75001 par défaut si pas de code postal reconnaissable", () => {
      const noPostalClient = makeClient({
        address: "Adresse sans code postal",
      });
      const xml = generateFacturX_XML(invoice, noPostalClient, userProfile);
      expect(xml).toContain("75001");
    });

    it("extrait le code postal exact d'une adresse normalisée", () => {
      const profile = makeUserProfile({
        address: "99 Boulevard Haussmann, 75008 Paris",
      });
      const xml = generateFacturX_XML(invoice, client, profile);
      expect(xml).toContain("75008");
    });
  });

  // ─── Facture sans TVA (franchise en base) ─────────────────────────────────

  describe("Facture sans TVA — Franchise en base (art. 293 B CGI)", () => {
    it("génère un XML valide pour une facture sans TVA (vatAmount = 0)", () => {
      const invoiceNoVAT = makeInvoice({
        vatAmount: 0,
        items: [makeItem({ vatRate: 0, quantity: 10, unitPrice: 100 })],
        total: 1000,
      });
      const xml = generateFacturX_XML(invoiceNoVAT, client, userProfile);
      expect(xml).toBeDefined();
      expect(xml).toContain("<ram:TaxTotalAmount");
      expect(xml).toContain("0.00");
    });

    it("GrandTotalAmount = TaxBasisTotalAmount quand vatAmount = 0", () => {
      const invoiceNoVAT = makeInvoice({
        vatAmount: 0,
        items: [makeItem({ vatRate: 0, quantity: 5, unitPrice: 200 })],
        total: 1000,
      });
      const xml = generateFacturX_XML(invoiceNoVAT, client, userProfile);
      expect(xml).toContain(
        "<ram:TaxBasisTotalAmount>1000.00</ram:TaxBasisTotalAmount>",
      );
      expect(xml).toContain(
        "<ram:GrandTotalAmount>1000.00</ram:GrandTotalAmount>",
      );
    });
  });

  // ─── Divers types de documents ─────────────────────────────────────────────

  describe("Types de documents", () => {
    it("TypeCode 380 pour quote (devis) — convention Factur-X", () => {
      const devis = makeInvoice({ type: "quote", number: "DEV-2026-001" });
      const xml = generateFacturX_XML(devis, client, userProfile);
      expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
    });

    it("TypeCode 380 pour deposit_invoice (facture acompte)", () => {
      const acompte = makeInvoice({
        type: "deposit_invoice",
        number: "AC-2026-001",
      });
      const xml = generateFacturX_XML(acompte, client, userProfile);
      expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
    });

    it("contient le numéro du document dans ram:ID", () => {
      const devis = makeInvoice({ type: "quote", number: "DEV-2026-042" });
      const xml = generateFacturX_XML(devis, client, userProfile);
      expect(xml).toContain("<ram:ID>DEV-2026-042</ram:ID>");
    });
  });

  // ─── Facture sans dueDate ─────────────────────────────────────────────────

  describe("Cas limites — dueDate manquant", () => {
    it("génère correctement si dueDate est undefined", () => {
      const invoiceNoDue = makeInvoice({
        dueDate: undefined as unknown as string,
      });
      expect(() =>
        generateFacturX_XML(invoiceNoDue, client, userProfile),
      ).not.toThrow();
    });

    it("n'inclut pas les balises SpecifiedTradePaymentTerms si pas de dueDate", () => {
      const invoiceNoDue = makeInvoice({ dueDate: "" });
      const xml = generateFacturX_XML(invoiceNoDue, client, userProfile);
      // Pas de balise de paiement si echéance vide
      expect(xml).not.toContain("SpecifiedTradePaymentTerms");
    });
  });
});

// ─── simulateDigitalSignature ─────────────────────────────────────────────────

describe("simulateDigitalSignature — Hachage SHA-256", () => {
  it("retourne une chaîne hexadécimale de 32 caractères", async () => {
    const hash = await simulateDigitalSignature("données test");
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[0-9A-F]+$/);
  });

  it("retourne une chaîne en majuscules", async () => {
    const hash = await simulateDigitalSignature("test");
    expect(hash).toBe(hash.toUpperCase());
  });

  it("produit le même hash pour le même input (déterministe)", async () => {
    const input = "même contenu PDF";
    const hash1 = await simulateDigitalSignature(input);
    const hash2 = await simulateDigitalSignature(input);
    expect(hash1).toBe(hash2);
  });

  it("produit un hash différent pour deux inputs différents", async () => {
    const hash1 = await simulateDigitalSignature("contenu A");
    const hash2 = await simulateDigitalSignature("contenu B");
    expect(hash1).not.toBe(hash2);
  });

  it("fonctionne avec une chaîne vide", async () => {
    const hash = await simulateDigitalSignature("");
    expect(hash).toHaveLength(32);
  });

  it("fonctionne avec des données volumineuses", async () => {
    const largeData = "x".repeat(100_000);
    const hash = await simulateDigitalSignature(largeData);
    expect(hash).toHaveLength(32);
  });
});
