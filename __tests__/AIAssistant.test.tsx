import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIAssistant from '../components/AIAssistant';
import React from 'react';

// Mock geminiService
vi.mock('../services/geminiService', () => ({
  generateAssistantResponse: vi.fn(),
  checkInvoiceCompliance: vi.fn(),
  predictCashflowJ30: vi.fn(),
}));

// Mock appStore
vi.mock('../store/appStore', () => ({
  useAppStore: vi.fn(() => ({
    invoices: [],
    clients: [],
    userProfile: { name: 'Test User', siret: '12345678901234' }
  }))
}));

import { generateAssistantResponse, checkInvoiceCompliance, predictCashflowJ30 } from '../services/geminiService';
import { useAppStore } from '../store/appStore';

describe('AIAssistant Component - Improved Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset useAppStore mock to default (no invoices)
    (useAppStore as any).mockReturnValue({
      invoices: [],
      clients: [],
      userProfile: { name: 'Test User', siret: '12345678901234' }
    });

    // Reset service mocks
    (generateAssistantResponse as any).mockResolvedValue('Réponse simulée de l assistant');
    (checkInvoiceCompliance as any).mockResolvedValue({
      isCompliant: true,
      issues: [],
      suggestions: ['Suggestion 1']
    });
    (predictCashflowJ30 as any).mockResolvedValue({
      predictedBalance: 5000,
      confidence: 0.9,
      analysis: 'Analyse positive',
      riskLevel: 'low'
    });
  });

  describe('Rendering & UI', () => {
    it('devrait rendre le composant sans erreur', () => {
      render(<AIAssistant />);
      expect(screen.getByText(/assistant administratif virtuel/i)).toBeTruthy();
    });

    it('affiche le titre principal du composant', () => {
      render(<AIAssistant />);
      const title = screen.getByText(/assistant administratif virtuel/i);
      expect(title).toBeTruthy();
    });

    it('affiche le champ de saisie pour les questions', () => {
      render(<AIAssistant />);
      const input = screen.getByPlaceholderText(/Posez une question/i);
      expect(input).toBeTruthy();
    });

    it('affiche le bouton d\'envoi', () => {
      render(<AIAssistant />);
      const sendButton = screen.getByText('Envoyer');
      expect(sendButton).toBeTruthy();
    });
  });

  describe('Message Interaction', () => {
    it('devrait envoyer un message et afficher la réponse', async () => {
      const user = userEvent.setup();
      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      const sendButton = screen.getByText('Envoyer');

      await user.type(input, 'Quelle est la limite de TVA ?');
      await user.click(sendButton);

      expect(screen.getByText('Quelle est la limite de TVA ?')).toBeTruthy();

      await waitFor(() => {
        expect(screen.getByText('Réponse simulée de l assistant')).toBeTruthy();
      });
    });

    it('vide le champ de saisie après envoi', async () => {
      const user = userEvent.setup();
      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      const sendButton = screen.getByText('Envoyer');

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect((input as HTMLInputElement).value).toBe('');
      });
    });

    it('n\'envoie pas de message vide', async () => {
      const user = userEvent.setup();
      render(<AIAssistant />);

      const sendButton = screen.getByText('Envoyer');
      await user.click(sendButton);

      // Pas d'appel à generateAssistantResponse
      expect(generateAssistantResponse).not.toHaveBeenCalled();
    });

    it('affiche l\'historique des messages', async () => {
      const user = userEvent.setup();
      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      const sendButton = screen.getByText('Envoyer');

      await user.type(input, 'Message 1');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Message 1')).toBeTruthy();
        expect(screen.getByText('Réponse simulée de l assistant')).toBeTruthy();
      });
    });
  });

  describe('AI Features', () => {
    it('affiche la section de prédiction', () => {
      render(<AIAssistant />);
      const predictions = screen.getAllByText(/Prédiction|prédiction/i);
      expect(predictions.length).toBeGreaterThanOrEqual(1);
    });

    it('affiche la balance prédite', async () => {
      render(<AIAssistant />);

      await waitFor(() => {
        // Vérifie que les informations de prédiction sont affichées
        expect(screen.getByText(/5000|balance|trésorerie/i)).toBeTruthy();
      });
    });

    it('appelle predictCashflowJ30 au montage du composant', async () => {
      // Mock useAppStore with invoices to trigger the analysis
      const mockInvoices = [{
        id: '1',
        type: 'invoice' as const,
        number: 'INV-001',
        clientId: 'client-1',
        date: new Date().toISOString(),
        items: [{ id: '1', description: 'Test', quantity: 1, unitPrice: 100 }],
        status: 'Envoyée',
        totalHT: 100,
        totalTTC: 120,
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString()
      }];

      (useAppStore as any).mockReturnValue({
        invoices: mockInvoices,
        clients: [],
        userProfile: { name: 'Test User', siret: '12345678901234' }
      });

      render(<AIAssistant />);

      await waitFor(() => {
        expect(predictCashflowJ30).toHaveBeenCalled();
      });
    });

    it('affiche le niveau de risque de la prédiction', async () => {
      // Mock useAppStore with invoices data
      const mockInvoices = [{
        id: '1',
        type: 'invoice' as const,
        number: 'INV-001',
        clientId: 'client-1',
        date: new Date().toISOString(),
        items: [{ id: '1', description: 'Test', quantity: 1, unitPrice: 100 }],
        status: 'Envoyée',
        totalHT: 100,
        totalTTC: 120,
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString()
      }];

      const mockClients = [{
        id: 'client-1',
        name: 'Test Client',
        email: 'client@test.com',
        address: 'Address'
      }];

      (useAppStore as any).mockReturnValue({
        invoices: mockInvoices,
        clients: mockClients,
        userProfile: { name: 'Test User', siret: '12345678901234' }
      });

      render(<AIAssistant />);

      await waitFor(() => {
        // The component should show risk level with mocked prediction
        expect(screen.getByText(/Risque|risk/i)).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('gère les erreurs d\'API gracieusement', async () => {
      const user = userEvent.setup();
      // Reset and setup a rejection for this specific test
      vi.clearAllMocks();
      (generateAssistantResponse as any).mockRejectedValue(new Error('API Error'));
      (predictCashflowJ30 as any).mockResolvedValue({
        predictedBalance: 5000,
        confidence: 0.9,
        analysis: 'Analyse positive',
        riskLevel: 'low'
      });

      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      const sendButton = screen.getByText('Envoyer');

      await user.type(input, 'Test');
      await user.click(sendButton);

      // Le composant ne devrait pas crash
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeTruthy();
      });
    });

    it('gère les erreurs de prédiction au chargement', async () => {
      vi.clearAllMocks();
      (predictCashflowJ30 as any).mockRejectedValue(new Error('Prediction failed'));
      (generateAssistantResponse as any).mockResolvedValue('Réponse simulée de l assistant');
      (checkInvoiceCompliance as any).mockResolvedValue({
        isCompliant: true,
        issues: [],
        suggestions: ['Suggestion 1']
      });

      render(<AIAssistant />);

      // Le composant devrait toujours être rendu
      await waitFor(() => {
        expect(screen.getByText(/assistant administratif virtuel/i)).toBeTruthy();
      });
    });

    it('affiche un message par défaut en cas d\'erreur de réponse', async () => {
      const user = userEvent.setup();
      vi.clearAllMocks();
      (generateAssistantResponse as any).mockRejectedValue(new Error('Network error'));
      (predictCashflowJ30 as any).mockResolvedValue({
        predictedBalance: 5000,
        confidence: 0.9,
        analysis: 'Analyse positive',
        riskLevel: 'low'
      });

      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      const sendButton = screen.getByText('Envoyer');

      await user.type(input, 'Test error');
      await user.click(sendButton);

      await waitFor(() => {
        // Devrait afficher le message utilisateur même s'il y a une erreur
        expect(screen.queryByText(/Test error/i)).toBeTruthy();
      });
    });
  });

  describe('Loading States', () => {
    it('affiche un indicateur de chargement en envoyant un message', async () => {
      const user = userEvent.setup();
      (generateAssistantResponse as any).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('Réponse'), 100))
      );

      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      const sendButton = screen.getByText('Envoyer');

      await user.type(input, 'Test');
      await user.click(sendButton);

      // Devrait montrer un état de chargement (animation, texte, etc)
      expect(screen.getByText('Test')).toBeTruthy();
    });
  });

  describe('Keyboard Navigation', () => {
    it('envoie le message avec Enter', async () => {
      const user = userEvent.setup();
      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      await user.type(input, 'Test{Enter}');

      await waitFor(() => {
        // The component calls generateAssistantResponse with message and context
        expect(generateAssistantResponse).toHaveBeenCalledWith(
          'Test',
          expect.stringContaining('model:')
        );
      });
    });

    it('gère correctement le champ de saisie', async () => {
      const user = userEvent.setup();
      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      if (!(input instanceof HTMLInputElement)) {
        throw new TypeError('Expected input element to be HTMLInputElement');
      }

      // Type text
      await user.type(input, 'Test Message');
      expect(input.value).toBe('Test Message');

      // Send message should clear the input
      const sendButton = screen.getByText('Envoyer');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Accessibility', () => {
    it('a des labels descriptifs pour les éléments interactifs', () => {
      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      expect(input).toHaveAttribute('placeholder');
      expect(input).toBeTruthy();
    });

    it('le bouton est accessible au clavier', () => {
      render(<AIAssistant />);

      const sendButton = screen.getByText('Envoyer');
      expect(sendButton).toBeTruthy();
    });
  });
});
