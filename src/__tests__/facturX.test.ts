/**
 * Tests unitaires - Moteur Factur-X (ZUGFeRD profil BASIC)
 *
 * Couvre :
 * - generateFacturX_XML() : structure XML, TypeCode, numéro, dates, montants,
 *                           échappement XML, lignes d'articles, codes unité
 * - simulateDigitalSignature() : hex SHA-256, déterminisme, unicité
 * - generatePDFWithFacturX() : intégration jsPDF (mocké), injection XML
 *
 * Note : jsPDF est mocké pour éviter les dépendances canvas / browser API
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client, Invoice, InvoiceItem, UserProfile } from '../types';

// ─── Mock jsPDF (avant l'import du module sous test) ─────────────────────────

const mockDocInstance = vi.hoisted(() => ({
  setFontSize: vi.fn(),
  text: vi.fn(),
  output: vi.fn(() => 'mock-pdf-output'),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  autoTable: vi.fn(),
  lastAutoTable: { finalY: 100 },
  facturX: undefined as string | undefined,
}));

vi.mock('jspdf', () => ({
  // Utiliser 'function' (pas une arrow function) pour supporter 'new jsPDF()'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsPDF: vi.fn(function (this: any) {
    return mockDocInstance;
  }),
}));

vi.mock('jspdf-autotable', () => ({}));

// ─── Import du module sous test (APRÈS les mocks) ─────────────────────────────

import {
  generateFacturX_XML,
  generatePDFWithFacturX,
  simulateDigitalSignature,
} from '../lib/facturX';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUserProfile: UserProfile = {
  companyName: 'Ma Super Entreprise',
  siret: '12345678901234',
  address: '42 Rue de la Liberté, 75011 Paris',
  email: 'contact@masuperentreprise.fr',
  phone: '+33 1 23 45 67 89',
  currency: 'EUR',
  invoicePrefix: 'FAC',
};

/** Client avec des caractères spéciaux XML dans le nom */
const mockClient: Client = {
  id: 'cl-001',
  name: 'Client & Fils <SARL>',
  email: 'client@test.fr',
  address: '10 Avenue des Champs, 75008 Paris',
  siret: '98765432101234',
};

const mockItemHeure: InvoiceItem = {
  id: 'item-001',
  description: 'Développement & intégration web',
  quantity: 10,
  unitPrice: 150,
  unit: 'heure',
  vatRate: 20,
};

const mockItemUnite: InvoiceItem = {
  id: 'item-002',
  description: 'Licence logiciel',
  quantity: 1,
  unitPrice: 500,
  // unit: undefined → doit générer unitCode="C62"
  vatRate: 20,
};

const mockInvoice: Invoice = {
  id: 'inv-001',
  type: 'invoice',
  number: 'FAC-2026-001',
  date: '2026-03-29',
  dueDate: '2026-04-29',
  clientId: 'cl-001',
  items: [mockItemHeure],
  status: 'Brouillon',
  total: 1800,
  vatAmount: 300,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Factur-X', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocInstance.facturX = undefined;
  });

  afterEach(() => {
    vi.resetAllMocks();
    mockDocInstance.facturX = undefined;
  });

  // ── generateFacturX_XML() ─────────────────────────────────────────────────

  describe('generateFacturX_XML()', () => {
    it('génère une chaîne XML non vide', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toBeTruthy();
      expect(typeof xml).toBe('string');
    });

    it('commence par la déclaration XML UTF-8', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    });

    it('contient les namespaces CrossIndustryInvoice et Factur-X BASIC', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('CrossIndustryInvoice');
      expect(xml).toContain('urn:factur-x.eu:1p0:basic');
    });

    it('TypeCode 380 pour une facture ordinaire', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:TypeCode>380</ram:TypeCode>');
    });

    it('TypeCode 381 pour un avoir (credit_note)', () => {
      const avoir: Invoice = { ...mockInvoice, type: 'credit_note' };
      const xml = generateFacturX_XML(avoir, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:TypeCode>381</ram:TypeCode>');
    });

    it('contient le numéro de facture dans <ram:ID>', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:ID>FAC-2026-001</ram:ID>');
    });

    it('encode la date au format YYYYMMDD (sans tirets)', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      // 2026-03-29 → 20260329
      expect(xml).toContain('20260329');
    });

    it("encode la date d'échéance au format YYYYMMDD", () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      // 2026-04-29 → 20260429
      expect(xml).toContain('20260429');
    });

    it('contient le nom et le SIRET du vendeur', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('Ma Super Entreprise');
      expect(xml).toContain('12345678901234');
    });

    it('échappe le caractère & dans le nom du client', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('&amp;');
      expect(xml).not.toContain('Client & Fils');
    });

    it('échappe les chevrons < et > dans le nom du client', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('&lt;SARL&gt;');
      expect(xml).not.toContain('<SARL>');
    });

    it('utilise vatAmount de la facture si présent', () => {
      const invoiceAvecTVA: Invoice = { ...mockInvoice, vatAmount: 300 };
      const xml = generateFacturX_XML(invoiceAvecTVA, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:TaxTotalAmount currencyID="EUR">300.00</ram:TaxTotalAmount>');
    });

    it('calcule la TVA depuis les items si vatAmount est absent', () => {
      // item: 10 * 150 = 1500 HT, TVA 20% = 300
      const invoiceSansTVA: Invoice = { ...mockInvoice, vatAmount: undefined };
      const xml = generateFacturX_XML(invoiceSansTVA, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:TaxTotalAmount currencyID="EUR">300.00</ram:TaxTotalAmount>');
    });

    it('contient TaxBasisTotalAmount (HT) et GrandTotalAmount (TTC) corrects', () => {
      // subtotal = 10 * 150 = 1500, vatAmount = 300, TTC = 1800
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:TaxBasisTotalAmount>1500.00</ram:TaxBasisTotalAmount>');
      expect(xml).toContain('<ram:GrandTotalAmount>1800.00</ram:GrandTotalAmount>');
    });

    it('génère unitCode="HUR" pour les articles en heures', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('unitCode="HUR"');
    });

    it('génère unitCode="C62" pour les articles sans unité spécifiée', () => {
      const invoiceUnite: Invoice = { ...mockInvoice, items: [mockItemUnite] };
      const xml = generateFacturX_XML(invoiceUnite, mockClient, mockUserProfile);
      expect(xml).toContain('unitCode="C62"');
    });

    it('utilise CategoryCode S pour les articles avec TVA standard', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:CategoryCode>S</ram:CategoryCode>');
    });

    it('utilise CategoryCode Z pour les articles à taux zéro', () => {
      const itemTVAZero: InvoiceItem = { ...mockItemHeure, vatRate: 0 };
      const invoiceTVAZero: Invoice = { ...mockInvoice, items: [itemTVAZero] };
      const xml = generateFacturX_XML(invoiceTVAZero, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:CategoryCode>Z</ram:CategoryCode>');
    });

    it('utilise CategoryCode E pour les articles exonérés (TVA non définie)', () => {
      const itemExonere: InvoiceItem = { ...mockItemHeure, vatRate: undefined };
      const invoiceExonere: Invoice = { ...mockInvoice, items: [itemExonere] };
      const xml = generateFacturX_XML(invoiceExonere, mockClient, mockUserProfile);
      expect(xml).toContain('<ram:CategoryCode>E</ram:CategoryCode>');
    });

    it("gère un profil sans SIRET sans lever d'exception", () => {
      const profileSansSiret: UserProfile = { ...mockUserProfile, siret: '' };
      const xml = generateFacturX_XML(mockInvoice, mockClient, profileSansSiret);
      expect(xml).toBeDefined();
      expect(xml).toContain('CrossIndustryInvoice');
    });

    it('génère une ligne XML par article de facture', () => {
      const invoice2Items: Invoice = {
        ...mockInvoice,
        items: [mockItemHeure, mockItemUnite],
      };
      const xml = generateFacturX_XML(invoice2Items, mockClient, mockUserProfile);
      // Chaque ligne a un <ram:LineID>
      expect(xml).toContain('<ram:LineID>1</ram:LineID>');
      expect(xml).toContain('<ram:LineID>2</ram:LineID>');
    });
  });

  // ── simulateDigitalSignature() ────────────────────────────────────────────

  describe('simulateDigitalSignature()', () => {
    it('retourne une chaîne de 32 caractères', async () => {
      const hash = await simulateDigitalSignature('test-data');
      expect(hash).toHaveLength(32);
    });

    it('retourne uniquement des caractères hexadécimaux majuscules', async () => {
      const hash = await simulateDigitalSignature('test-data');
      expect(hash).toMatch(/^[0-9A-F]{32}$/);
    });

    it('est déterministe : même entrée → même empreinte', async () => {
      const hash1 = await simulateDigitalSignature('données-identiques');
      const hash2 = await simulateDigitalSignature('données-identiques');
      expect(hash1).toBe(hash2);
    });

    it('différentes entrées produisent des empreintes différentes', async () => {
      const hash1 = await simulateDigitalSignature('alpha');
      const hash2 = await simulateDigitalSignature('beta');
      expect(hash1).not.toBe(hash2);
    });

    it('fonctionne avec une chaîne vide', async () => {
      const hash = await simulateDigitalSignature('');
      expect(hash).toHaveLength(32);
      expect(hash).toMatch(/^[0-9A-F]{32}$/);
    });
  });

  // ── generatePDFWithFacturX() ──────────────────────────────────────────────

  describe('generatePDFWithFacturX()', () => {
    it("retourne un objet jsPDF sans lever d'exception", async () => {
      const doc = await generatePDFWithFacturX(mockInvoice, mockClient, mockUserProfile);
      expect(doc).toBeDefined();
    });

    it('attache le XML Factur-X dans la propriété facturX du document', async () => {
      await generatePDFWithFacturX(mockInvoice, mockClient, mockUserProfile);
      expect(mockDocInstance.facturX).toBeDefined();
      expect(mockDocInstance.facturX).toContain('CrossIndustryInvoice');
      expect(mockDocInstance.facturX).toContain('urn:factur-x.eu:1p0:basic');
    });

    it('appelle setFontSize pour mettre en forme le document', async () => {
      await generatePDFWithFacturX(mockInvoice, mockClient, mockUserProfile);
      expect(mockDocInstance.setFontSize).toHaveBeenCalled();
    });

    it('inclut le numéro de facture dans un appel text()', async () => {
      await generatePDFWithFacturX(mockInvoice, mockClient, mockUserProfile);
      const textCalls = mockDocInstance.text.mock.calls as unknown[][];
      const hasNumero = textCalls.some(
        (args) => typeof args[0] === 'string' && args[0].includes('FAC-2026-001')
      );
      expect(hasNumero).toBe(true);
    });

    it('gère un avoir (credit_note) avec le bon libellé', async () => {
      const avoir: Invoice = { ...mockInvoice, type: 'credit_note' };
      await generatePDFWithFacturX(avoir, mockClient, mockUserProfile);
      // Le XML attaché doit contenir TypeCode 381
      expect(mockDocInstance.facturX).toContain('<ram:TypeCode>381</ram:TypeCode>');
    });
  });
});
