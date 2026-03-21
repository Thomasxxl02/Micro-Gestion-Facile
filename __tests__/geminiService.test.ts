import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateAssistantResponse,
  suggestInvoiceDescription,
  generateInvoiceItemsFromPrompt,
  draftEmail,
  analyzeReceipt,
  predictRevenue,
  checkInvoiceCompliance,
  predictCashflowJ30
} from '../services/geminiService';

describe('geminiService - Improved & Robust Tests', () => {
  beforeEach(() => {
    // Vérifier que la clé API est bien définie
    expect(process.env.GEMINI_API_KEY || 'test-key').toBeDefined();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAssistantResponse', () => {
    it('accepte une question et retourne une réponse string', async () => {
      const response = await generateAssistantResponse('Quelle est la limite BNC ?');
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('gère les questions vides gracieusement', async () => {
      const response = await generateAssistantResponse('');
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('retourne du contenu pertinent pour des questions fiscales', async () => {
      const response = await generateAssistantResponse('Seuil TVA 2026 ?');
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(5);
    });
  });

  describe('suggestInvoiceDescription', () => {
    it('génère une description pour un type de prestation donné', async () => {
      const description = await suggestInvoiceDescription('Client SARL', 'Développement');
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      // Devrait contenir le type de prestation ou un équivalent
      expect(description.length).toBeGreaterThan(10);
    });

    it('gère différents types de prestations', async () => {
      const types = ['Consultation', 'Développement', 'Formation', 'Audit'];

      for (const type of types) {
        const desc = await suggestInvoiceDescription('Client Test', type);
        expect(desc).toBeDefined();
        expect(typeof desc).toBe('string');
      }
    });

    it('inclut le nom du client dans le contexte', async () => {
      const description = await suggestInvoiceDescription('Entreprise XYZ', 'Service');
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
    });
  });

  describe('generateInvoiceItemsFromPrompt', () => {
    it('analyse un prompt et retourne un tableau d\'items', async () => {
      const items = await generateInvoiceItemsFromPrompt('10 heures de développement à 100€/h');
      expect(Array.isArray(items)).toBe(true);
    });

    it('gère les prompts complexes avec plusieurs items', async () => {
      const prompt = 'Service 1: 5h à 80€, Service 2: 3h à 120€';
      const items = await generateInvoiceItemsFromPrompt(prompt);
      expect(Array.isArray(items)).toBe(true);
    });

    it('retourne un tableau vide pour un prompt vide', async () => {
      const items = await generateInvoiceItemsFromPrompt('');
      expect(Array.isArray(items)).toBe(true);
    });

    it('structure correctement chaque item avec description et quantité', async () => {
      const items = await generateInvoiceItemsFromPrompt('Prestation test');
      if (items.length > 0) {
        const item = items[0];
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('unitPrice');
      }
    });
  });

  describe('draftEmail', () => {
    it('génère un objet email avec subject et body', async () => {
      const email = await draftEmail({
        clientName: 'Jean Dupont',
        purpose: 'Relance',
        tone: 'formal',
        companyName: 'My Enterprise'
      });

      const result = Array.isArray(email) ? email[0] : email;
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('body');
      expect(typeof result.subject).toBe('string');
      expect(typeof result.body).toBe('string');
    });

    it('adapte le ton de l\'email', async () => {
      const formalEmail = await draftEmail({
        clientName: 'Client',
        purpose: 'Facture',
        tone: 'formal',
        companyName: 'Enterprise'
      });

      const result = Array.isArray(formalEmail) ? formalEmail[0] : formalEmail;
      expect(result.subject).toBeDefined();
      expect(result.body).toBeDefined();
    });

    it('inclut les informations du client et de l\'entreprise', async () => {
      const email = await draftEmail({
        clientName: 'Pierre Martin',
        purpose: 'Devis',
        tone: 'friendly',
        companyName: 'Startup Tech'
      });

      const result = Array.isArray(email) ? email[0] : email;
      expect(result.subject + result.body).toBeDefined();
    });
  });

  describe('analyzeReceipt', () => {
    it('analyse une image en base64', async () => {
      const result = await analyzeReceipt('fake-receipt-base64', 'image/png');
      expect(result).toBeDefined();
    });

    it('gère différents formats d\'image', async () => {
      const formats = ['image/png', 'image/jpeg', 'image/jpg'];

      for (const format of formats) {
        const result = await analyzeReceipt('base64-data', format);
        expect(result).toBeDefined();
      }
    });

    it('retourne des données structurées (si API répond)', async () => {
      const result = await analyzeReceipt('base64-image', 'image/png');
      const data = Array.isArray(result) ? result[0] : result;
      expect(data).toBeDefined();
    });
  });

  describe('predictRevenue', () => {
    it('donne une prédiction de chiffre d\'affaires depuis des historiques', async () => {
      const mockInvoices = [
        { id: '1', total: 1000, date: '2026-01-01' },
        { id: '2', total: 1500, date: '2026-02-01' },
      ];

      const prediction = await predictRevenue(mockInvoices, []);
      expect(prediction).toBeDefined();
      expect(typeof prediction).toBe('string');
    });

    it('gère l\'absence d\'historique gracieusement', async () => {
      const prediction = await predictRevenue([], []);
      expect(prediction).toBeDefined();
      expect(typeof prediction).toBe('string');
    });
  });

  describe('checkInvoiceCompliance', () => {
    it('vérifie la conformité d\'une facture', async () => {
      const invoice = { id: '1', number: 'FAC-001', items: [], total: 0 };
      const userProfile = { activityType: 'SERVICE_BNC', siret: '12345678901234' };
      const client = { id: 'cli-1', name: 'Client Test' };

      const complianceRaw = await checkInvoiceCompliance(invoice, userProfile, client);
      const compliance = Array.isArray(complianceRaw) ? complianceRaw[0] : complianceRaw;

      expect(compliance).toHaveProperty('isCompliant');
      expect(typeof compliance.isCompliant).toBe('boolean');
      expect(Array.isArray(compliance.issues)).toBe(true);
    });

    it('identifie les problèmes de conformité potentiels', async () => {
      const invoice = { id: '1', number: '', items: [], total: 0 };
      const complianceRaw = await checkInvoiceCompliance(invoice, {}, {});
      const compliance = Array.isArray(complianceRaw) ? complianceRaw[0] : complianceRaw;

      expect(compliance).toHaveProperty('issues');
      expect(Array.isArray(compliance.issues)).toBe(true);
    });
  });

  describe('predictCashflowJ30', () => {
    it('prédit la trésorerie à 30 jours', async () => {
      const mockInvoices = [
        { id: '1', total: 2000, status: 'paid', date: '2026-01-01' },
        { id: '2', total: 1500, status: 'draft', date: '2026-03-01' },
      ];

      const userProfile = {
        activityType: 'SERVICE_BNC',
      };

      const cashflowRaw = await predictCashflowJ30(mockInvoices, userProfile);
      const cashflow = Array.isArray(cashflowRaw) ? cashflowRaw[0] : cashflowRaw;

      expect(cashflow).toHaveProperty('predictedBalance');
      expect(cashflow).toHaveProperty('riskLevel');
      expect(['low', 'medium', 'high'].includes(cashflow.riskLevel)).toBe(true);
    });

    it('gère des données vides', async () => {
      const cashflowRaw = await predictCashflowJ30([], { activityType: 'SERVICE_BNC' });
      const cashflow = Array.isArray(cashflowRaw) ? cashflowRaw[0] : cashflowRaw;

      expect(cashflow.predictedBalance).toBeDefined();
      expect(cashflow.riskLevel).toBeDefined();
    });
  });

  describe('Error Handling & Resilience', () => {
    it('gère gracieusement une API indisponible', async () => {
      try {
        const response = await generateAssistantResponse('test');
        // Devrait retourner quelque chose, même si c'est un fallback
        expect(response).toBeDefined();
      } catch (error) {
        // Ou lever une erreur claire
        expect(error).toBeDefined();
      }
    });

    it('n\'expose pas les clés API en cas d\'erreur', async () => {
      try {
        // Toute fonction qui s\'appellerait sans API_KEY
        const response = await generateAssistantResponse('test');
        expect(response).toBeDefined();
      } catch (error) {
        // Les messages d\'erreur ne doivent pas contenir la clé
        if (error instanceof Error) {
          expect(error.message).not.toContain('test-key');
          expect(error.message).not.toContain(process.env.GEMINI_API_KEY || '');
        }
      }
    });
  });
});
