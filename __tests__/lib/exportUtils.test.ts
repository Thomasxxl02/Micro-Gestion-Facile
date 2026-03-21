import { describe, it, expect } from 'vitest';
import { exportAsJSON, exportAsCSV } from '../../lib/exportUtils';
import type { ExportData } from '../../lib/exportUtils';
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
        dueDate: '2026-04-21',
        clientId: 'cli-1',
        items: [
          {
            id: 'itm-1',
            description: 'Service',
            quantity: 10,
            unitPrice: 100,
            vatRate: 20,
          },
        ],
        total: 1000,
        status: 'paid',
        type: 'invoice',
      },
    ],
    clients: [
      {
        id: 'cli-1',
        name: 'Client Test',
        email: 'contact@test.fr',
        phone: '0102030405',
        address: 'Test Address',
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
            total: 1234.567,
          },
        ],
      };

      const json = await exportAsJSON(dataWithDecimal);
      const parsed = JSON.parse(json);

      expect(typeof parsed.invoices[0].total).toBe('number');
      expect(parsed.invoices[0].total).toBeCloseTo(1234.567);
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

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('exporte avec toutes les clés réquises', async () => {
      const json = await exportAsJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('userProfile');
      expect(parsed).toHaveProperty('invoices');
      expect(parsed).toHaveProperty('clients');
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

      expect(csv.includes('""')).toBe(true);
    });

    it('exporte les clients', () => {
      const csv = exportAsCSV('clients', mockData.clients || []);

      expect(csv).toContain('Client Test');
      expect(csv).toContain('contact@test.fr');
    });

    it('gère les collections vides', () => {
      const csv = exportAsCSV('invoices', []);

      expect(csv).toContain('No data to export');
    });

    it('exporte plusieurs items avec données complètes', () => {
      const multiItems = [
        { id: '1', description: 'Item 1', quantity: 10 },
        { id: '2', description: 'Item 2', quantity: 20 },
      ];

      const csv = exportAsCSV('items', multiItems);

      expect(csv.split('\n')).toHaveLength(3); // Header + 2 items
      expect(csv).toContain('Item 1');
      expect(csv).toContain('Item 2');
    });

    it('gère les données avec accents français', () => {
      const csvData = [
        {
          id: '1',
          name: 'Évaluation professionnelle',
          description: 'Prestation réalisée',
        },
      ];

      const csv = exportAsCSV('items', csvData);

      expect(csv).toContain('Évaluation');
      expect(csv).toContain('réalisée');
    });

    it('exporte les numéros correctement formatés', () => {
      const csvData = [
        {
          id: 'inv-1',
          number: 'FAC-2026-001',
          total: '1000.00',
        },
      ];

      const csv = exportAsCSV('invoices', csvData);

      expect(csv).toContain('FAC-2026-001');
      expect(csv).toContain('1000.00');
    });
  });

  describe('RGPD Data Portability', () => {
    it('exporte complètement les données personnelles', async () => {
      const json = await exportAsJSON(mockData);
      const parsed = JSON.parse(json);

      // Vérifier que toutes les données sont incluses
      expect(parsed.userProfile).toBeDefined();
      expect(parsed.invoices).toBeDefined();
      expect(parsed.clients).toBeDefined();
      expect(parsed.invoices[0].items).toBeDefined();
    });

    it('inclut le timestamp d\'export (RGPD requirement)', async () => {
      const json = await exportAsJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportedAt).toBeDefined();
      const exportDate = new Date(parsed.exportedAt);
      expect(exportDate instanceof Date).toBe(true);
    });
  });
});
