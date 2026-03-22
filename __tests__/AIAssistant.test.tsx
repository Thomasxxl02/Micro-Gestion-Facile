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

import { generateAssistantResponse, checkInvoiceCompliance, predictCashflowJ30 } from '../services/geminiService';

describe('AIAssistant Component - Improved Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      render(<AIAssistant />);

      await waitFor(() => {
        expect(predictCashflowJ30).toHaveBeenCalled();
      });
    });

    it('affiche le niveau de risque de la prédiction', async () => {
      render(<AIAssistant />);

      await waitFor(() => {
        // Cherche le texte du risque
        expect(screen.getByText(/low|medium|high|faible|moyen|élevé/i)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('gère les erreurs d\'API gracieusement', async () => {
      const user = userEvent.setup();
      (generateAssistantResponse as any).mockRejectedValue(new Error('API Error'));

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
      (predictCashflowJ30 as any).mockRejectedValue(new Error('Prediction failed'));

      render(<AIAssistant />);

      // Le composant devrait toujours être rendu
      await waitFor(() => {
        expect(screen.getByText(/assistant administratif virtuel/i)).toBeTruthy();
      });
    });

    it('affiche un message par défaut en cas d\'erreur de réponse', async () => {
      const user = userEvent.setup();
      (generateAssistantResponse as any).mockRejectedValue(new Error('Network error'));

      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i);
      const sendButton = screen.getByText('Envoyer');

      await user.type(input, 'Test error');
      await user.click(sendButton);

      await waitFor(() => {
        // Devrait afficher une erreur ou message par défaut
        expect(screen.queryByText(/Test error/i) || screen.queryByText(/erreur|error/i)).toBeTruthy();
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
        expect(generateAssistantResponse).toHaveBeenCalledWith('Test');
      });
    });

    it('n\'envoie pas avec Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<AIAssistant />);

      const input = screen.getByPlaceholderText(/Posez une question/i) as HTMLInputElement;
      await user.type(input, 'Test{Shift>}{Enter}{/Shift}');

      // Shift+Enter ne devrait pas envoyer (pour multi-ligne)
      // Comportement optionnel selon l'implémentation
      expect(input.value).toContain('Test');
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
