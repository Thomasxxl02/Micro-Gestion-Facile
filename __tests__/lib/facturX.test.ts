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

    it('inclut les informations de l\'acheteur', () => {
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
  });
});
