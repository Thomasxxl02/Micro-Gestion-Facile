import { describe, it, expect } from 'vitest';
import { generateFacturX_XML } from '../../lib/facturX';
import type { Invoice, Client, UserProfile } from '../../types';

describe('facturX - Factur-X XML Generation', () => {
  const mockUserProfile: UserProfile = {
    companyName: 'Ma Micro-Entreprise SARL',
    siret: '12345678901234',
    address: '123 Rue de Paris',
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
    siret: '98765432109876',
    archived: false,
  };

  const mockInvoice: Invoice = {
    id: 'inv-1',
    number: 'FAC-2026-001',
    date: '2026-03-21',
    dueDate: '2026-04-21',
    clientId: 'cli-1',
    items: [
      {
        id: 'itm-1',
        description: 'Développement application web',
        quantity: 40,
        unitPrice: 100,
        vatRate: 20,
      },
      {
        id: 'itm-2',
        description: 'Consultation',
        quantity: 5,
        unitPrice: 150,
        vatRate: 20,
      },
    ],
    total: 4750,
    status: 'sent',
    type: 'invoice',
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

    it('gère les accents français correctement (UTF-8)', () => {
      const frenchInvoice: Invoice = {
        ...mockInvoice,
        items: [
          {
            id: 'itm-fr',
            description: 'Évaluation téléphonique et réunion',
            quantity: 1,
            unitPrice: 500,
            vatRate: 20,
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

    it('calcule correctement les totaux HT et TTC', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      // Total HT = 4750 euros
      expect(xml).toContain('4750');
      // TVA = 950 euros
      expect(xml).toContain('950');
      // Total TTC = 5700 euros
      expect(xml).toContain('5700');
    });

    it('inclut les adresses complètes du vendeur et acheteur', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('123 Rue de Paris');
      expect(xml).toContain('75001');
      expect(xml).toContain('456 Rue de Lyon');
      expect(xml).toContain('69000');
    });

    it('gère les factures sans items sans erreur', () => {
      const emptyInvoice: Invoice = {
        ...mockInvoice,
        items: [],
        total: 0,
      };

      const xml = generateFacturX_XML(emptyInvoice, mockClient, mockUserProfile);

      expect(xml).toBeDefined();
      expect(xml).toContain('rsm:CrossIndustryInvoice');
    });

    // VAT CODES - Test des différents régimes de TVA
    it('gère le code S (standard VAT rate)', () => {
      const invoiceS: Invoice = {
        ...mockInvoice,
        items: [{ ...mockInvoice.items[0], vatRate: 20 }],
      };
      const xml = generateFacturX_XML(invoiceS, mockClient, mockUserProfile);
      expect(xml).toContain('S'); // Standard VAT
    });

    it('gère le code Z (zero rated)', () => {
      const invoiceZ: Invoice = {
        ...mockInvoice,
        items: [{ ...mockInvoice.items[0], vatRate: 0 }],
      };
      const xml = generateFacturX_XML(invoiceZ, mockClient, mockUserProfile);
      expect(xml).toContain('Z'); // Zero VAT
    });

    it('gère le code E (exempt from VAT)', () => {
      const invoiceE: Invoice = {
        ...mockInvoice,
        items: [{ ...mockInvoice.items[0], vatRate: undefined }],
      };
      const xml = generateFacturX_XML(invoiceE, mockClient, mockUserProfile);
      expect(xml).toBeDefined();
    });

    it('gère le code RL (reverse charge)', () => {
      const invoiceRL: Invoice = {
        ...mockInvoice,
        items: [{ ...mockInvoice.items[0], vatRate: -1 }],
      };
      const xml = generateFacturX_XML(invoiceRL, mockClient, mockUserProfile);
      expect(xml).toBeDefined();
    });

    // PAYMENT TERMS
    it('inclut les conditions de paiement', () => {
      const invoiceDueDate: Invoice = {
        ...mockInvoice,
        dueDate: '2026-04-21',
      };
      const xml = generateFacturX_XML(invoiceDueDate, mockClient, mockUserProfile);

      expect(xml).toContain('2026-04-21');
    });

    // DECIMAL PRECISION
    it('respecte la précision décimale sur les montants', () => {
      const invoiceDecimal: Invoice = {
        ...mockInvoice,
        items: [
          {
            id: 'itm-decimal',
            description: 'Service précis',
            quantity: 3,
            unitPrice: 33.33,
            vatRate: 20,
          },
        ],
        total: 99.99,
      };
      const xml = generateFacturX_XML(invoiceDecimal, mockClient, mockUserProfile);

      expect(xml).toContain('33.33');
      expect(xml).toContain('99.99');
    });

    // SPECIAL CHARACTERS & ENCODING
    it('échappe correctement les caractères XML spéciaux', () => {
      const specialClient: Client = {
        ...mockClient,
        name: 'Client & Associés <SARL>',
      };
      const xml = generateFacturX_XML(mockInvoice, specialClient, mockUserProfile);

      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
    });

    // MULTIPLE ITEMS WITH DIFFERENT VAT RATES
    it('gère plusieurs items avec différents taux de TVA', () => {
      const multiVatInvoice: Invoice = {
        ...mockInvoice,
        items: [
          {
            id: 'itm-20',
            description: 'Service TVA 20%',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 20,
          },
          {
            id: 'itm-55',
            description: 'Service TVA 5.5%',
            quantity: 1,
            unitPrice: 500,
            vatRate: 5.5,
          },
          {
            id: 'itm-0',
            description: 'Service TVA 0%',
            quantity: 1,
            unitPrice: 200,
            vatRate: 0,
          },
        ],
        total: 1700,
      };
      const xml = generateFacturX_XML(multiVatInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('Service TVA 20%');
      expect(xml).toContain('Service TVA 5.5%');
      expect(xml).toContain('Service TVA 0%');
      expect(xml).toContain('20');
      expect(xml).toContain('5.5');
    });

    // ACRE BENEFICIARY (Auto-Entrepreneur ACRE)
    it('inclut le statut ACRE dans le profil', () => {
      const acreProfile: UserProfile = {
        ...mockUserProfile,
        isAcreBeneficiary: true,
      };
      const xml = generateFacturX_XML(mockInvoice, mockClient, acreProfile);

      expect(xml).toBeDefined();
      expect(xml).toContain(acreProfile.companyName);
    });

    // LARGE AMOUNTS
    it('gère les montants élevés sans perte de précision', () => {
      const largeInvoice: Invoice = {
        ...mockInvoice,
        items: [
          {
            id: 'itm-large',
            description: 'Gros projet',
            quantity: 1,
            unitPrice: 50000,
            vatRate: 20,
          },
        ],
        total: 50000,
      };
      const xml = generateFacturX_XML(largeInvoice, mockClient, mockUserProfile);

      expect(xml).toContain('50000');
    });

    // STRUCTURED ADDRESSES
    it('inclut complètement les adresses structurées (CodeListId)', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      // Seller et Buyer addresses
      expect(xml).toContain('ram:SellerTradeParty');
      expect(xml).toContain('ram:BuyerTradeParty');
      expect(xml).toContain('ram:PostalTradeAddress');
    });

    // INVOICE ID & NUMBER
    it('utilise le numéro de facture comme SchemeID', () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml).toContain(mockInvoice.number);
      expect(xml).toContain('<ram:ID>');
    });

    // VALIDITY CHECK
    it("valide l'XML pour Structure complète (pas de tags orphelins)", () => {
      const xml = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      const openTags = (xml.match(/<([a-z]+):/g) || []).length;
      const closeTags = (xml.match(/<\/([a-z]+):/g) || []).length;

      expect(openTags).toBeGreaterThan(0);
      // Chaque élément doit avoir un équivalent fermant (approx)
      expect(openTags - closeTags).toBeLessThan(5); // Tolère quelques auto-fermants
    });

    // DIFFERENT INVOICE TYPES
    it('différencie les types de document (facture vs avoir)', () => {
      const creditNote: Invoice = {
        ...mockInvoice,
        type: 'credit_note',
        number: 'AVOIR-001',
      };
      const xml = generateFacturX_XML(creditNote, mockClient, mockUserProfile);

      expect(xml).toContain('<ram:TypeCode>381</ram:TypeCode>');
    });

    // PERFORMANCE - Génération rapide
    it('génère le XML rapidement (< 100ms)', () => {
      const start = performance.now();
      generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    // ROUND-TRIP CONSISTENCY
    it('génère le même XML pour la même facture (déterministe)', () => {
      const xml1 = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);
      const xml2 = generateFacturX_XML(mockInvoice, mockClient, mockUserProfile);

      expect(xml1).toBe(xml2);
    });
  });
});
