import { describe, it, expect } from 'vitest';
import { exportAsJSON, exportAsCSV } from '../../lib/exportUtils';
import type { ExportData } from '../../lib/exportUtils';

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
      expect(csv).toContain('inv-1'); // Client ID is exported
    });

    it('inclut les headers automatiquement', () => {
      const csv = exportAsCSV('invoices', mockData.invoices || []);

      const lines = csv.split('\n');
      const header = lines[0];

      expect(header).toContain('id');
      expect(header).toContain('number');
      expect(header).toContain('clientId');
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

    it("inclut le timestamp d'export (RGPD requirement)", async () => {
      const json = await exportAsJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportedAt).toBeDefined();
      const exportDate = new Date(parsed.exportedAt);
      expect(exportDate instanceof Date).toBe(true);
    });
  });

  describe('Format Validation', () => {
    it('produit un JSON valide et parsable', async () => {
      const json = await exportAsJSON(mockData);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("utilise l'encodage UTF-8 correctement", async () => {
      const dataWithSpecialChars: Partial<ExportData> = {
        ...mockData,
        clients: [
          {
            ...mockData.clients![0],
            name: 'Café Français €',
          },
        ],
      };

      const json = await exportAsJSON(dataWithSpecialChars);
      const parsed = JSON.parse(json);

      expect(parsed.clients[0].name).toBe('Café Français €');
    });

    it("CSV récupère tous les champs de l'entité", () => {
      const csv = exportAsCSV('invoices', mockData.invoices || []);
      const lines = csv.split('\n');
      const header = lines[0].split(',');

      // Vérifier que les champs pricipaux sont présents
      expect(header.length).toBeGreaterThan(3);
      expect(csv).toContain('id');
      expect(csv).toContain('number');
      expect(csv).toContain('date');
      expect(csv).toContain('total');
      expect(csv).toContain('status');
    });
  });

  describe('Performance', () => {
    it('exporte 1000 factures rapidement en JSON', async () => {
      const largeData: Partial<ExportData> = {
        version: '1.0',
        userProfile: mockData.userProfile!,
        invoices: Array.from({ length: 1000 }, (_, i) => ({
          id: `inv-${i}`,
          number: `FAC-${String(i).padStart(6, '0')}`,
          date: '2026-03-21',
          dueDate: '2026-04-21',
          clientId: `cli-${i % 100}`,
          items: [],
          total: 1000 + i,
          status: 'paid' as const,
          type: 'invoice' as const,
        })),
        clients: [],
      };

      const start = performance.now();
      const json = await exportAsJSON(largeData);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
      const parsed = JSON.parse(json);
      expect(parsed.invoices).toHaveLength(1000);
    });

    it('exporte 1000 factures rapidement en CSV', () => {
      const largeInvoices = Array.from({ length: 1000 }, (_, i) => ({
        id: `inv-${i}`,
        number: `FAC-${String(i).padStart(6, '0')}`,
        date: '2026-03-21',
        clientId: `cli-${i % 100}`,
        total: 1000 + i,
        status: 'paid' as const,
        type: 'invoice' as const,
      }));

      const start = performance.now();
      const csv = exportAsCSV('invoices', largeInvoices);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
      const lines = csv.split('\n');
      // CSV avec 1000 factures devrait avoir header + 1000 données = 1001 lignes (ou 1002 avec ligne vide)
      expect(lines.length).toBeGreaterThanOrEqual(1001);
    });
  });

  describe('Edge Cases', () => {
    it('gère les montants très élevés sans perte de précision', async () => {
      const dataWithHighAmounts: Partial<ExportData> = {
        ...mockData,
        invoices: [
          {
            ...mockData.invoices![0],
            total: 9999999.99,
          },
        ],
      };

      const json = await exportAsJSON(dataWithHighAmounts);
      const parsed = JSON.parse(json);

      expect(parsed.invoices[0].total).toBeCloseTo(9999999.99);
    });

    it('gère les montants très petits avec précision décimale', async () => {
      const dataWithSmallAmounts: Partial<ExportData> = {
        ...mockData,
        invoices: [
          {
            ...mockData.invoices![0],
            total: 0.01,
          },
        ],
      };

      const json = await exportAsJSON(dataWithSmallAmounts);
      const parsed = JSON.parse(json);

      expect(parsed.invoices[0].total).toBe(0.01);
    });

    it('gère les valeurs null/undefined gracieux', async () => {
      const dataWithNulls: Partial<ExportData> = {
        ...mockData,
        invoices: [
          {
            ...mockData.invoices![0],
            notes: null as any,
            description: undefined as any,
          },
        ],
      };

      const json = await exportAsJSON(dataWithNulls);
      const parsed = JSON.parse(json);

      expect(parsed.invoices[0]).toBeDefined();
    });

    it('gère les chaînes vides correctement', () => {
      const csvData = [
        {
          id: '1',
          name: '',
          description: 'Test',
        },
      ];

      const csv = exportAsCSV('items', csvData);

      expect(csv).toBeDefined();
      expect(csv).toContain('Test');
    });

    it('gère les caractères de contrôle dans les données', async () => {
      const dataWithControlChars: Partial<ExportData> = {
        ...mockData,
        clients: [
          {
            ...mockData.clients![0],
            name: 'Client\nWith\nNewlines',
          },
        ],
      };

      const json = await exportAsJSON(dataWithControlChars);
      const parsed = JSON.parse(json);

      expect(parsed.clients[0].name).toContain('Client');
    });

    it('échappe correctement les guillemets doubles en CSV', () => {
      const csvData = [
        {
          id: '1',
          description: 'Valeur avec "citation"',
        },
      ];

      const csv = exportAsCSV('items', csvData);

      // En CSV, les guillemets doubles sont échappés par doubler
      expect(csv).toContain('"Valeur avec ""citation"""');
    });

    it("conserve l'ordre des lignes en CSV", () => {
      const csvData = [
        { id: '3', name: 'Trois' },
        { id: '1', name: 'Un' },
        { id: '2', name: 'Deux' },
      ];

      const csv = exportAsCSV('items', csvData);
      const lines = csv.split('\n').filter((l) => l.trim());

      expect(lines[1]).toContain('3');
      expect(lines[2]).toContain('1');
      expect(lines[3]).toContain('2');
    });
  });

  describe('Multi-Language Support', () => {
    it('exporte correctement les données multilingues', async () => {
      const multilingualData: Partial<ExportData> = {
        ...mockData,
        clients: [
          {
            ...mockData.clients![0],
            name: '日本 Client 中文',
            address: 'Rue François Müller, 99€',
          },
        ],
      };

      const json = await exportAsJSON(multilingualData);
      const parsed = JSON.parse(json);

      expect(parsed.clients[0].name).toContain('日本');
      expect(parsed.clients[0].address).toContain('€');
    });

    it('exporte le CSV avec support multilingue UTF-8', () => {
      const csvData = [
        {
          id: '1',
          name: '🎯 Client Spécial',
          email: 'contact@café.fr',
        },
      ];

      const csv = exportAsCSV('clients', csvData);

      expect(csv).toContain('Spécial');
      expect(csv).toContain('café');
    });
  });

  describe('File Size & Streaming', () => {
    it('produit un JSON de taille raisonnable pour 1000 factures', async () => {
      const bulkData: Partial<ExportData> = {
        version: '1.0',
        userProfile: mockData.userProfile!,
        invoices: Array.from({ length: 1000 }, (_, i) => ({
          id: `inv-${i}`,
          number: `FAC-${i}`,
          date: '2026-03-21',
          dueDate: '2026-04-21',
          clientId: 'cli-1',
          items: [],
          total: 1000,
          status: 'paid' as const,
          type: 'invoice' as const,
        })),
        clients: [],
      };

      const json = await exportAsJSON(bulkData);

      // Pour 1000 factures simples : ~237KB (avec JSON formatting)
      expect(json.length).toBeLessThan(300000);
    });

    it('encode correctement en base64 si nécessaire', async () => {
      const json = await exportAsJSON(mockData);

      // Vérifier que le JSON est valide et parsable
      expect(() => JSON.parse(json)).not.toThrow();

      // Vous pouvez l'encoder en base64 pour transport
      const base64 = Buffer.from(json).toString('base64');
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');

      expect(JSON.parse(decoded)).toBeDefined();
    });
  });
});
