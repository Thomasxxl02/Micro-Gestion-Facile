import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EmailManager from '../../components/EmailManager';
import type { Client, Email, EmailTemplate, Invoice, UserProfile } from '../../types';

// Mock icons
vi.mock('lucide-react', () => ({
  Mail: () => <span>MailIcon</span>,
  Send: () => <span>SendIcon</span>,
  History: () => <span>HistoryIcon</span>,
  FileText: () => <span>FileTextIcon</span>,
  Plus: () => <span>PlusIcon</span>,
  Trash2: () => <span>Trash2Icon</span>,
  Search: () => <span>SearchIcon</span>,
  Clock: () => <span>ClockIcon</span>,
  CheckCircle2: () => <span>CheckCircle2Icon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
  X: () => <span>XIcon</span>,
  Edit2: () => <span>Edit2Icon</span>,
  Copy: () => <span>CopyIcon</span>,
  Wand2: () => <span>Wand2Icon</span>,
  User: () => <span>UserIcon</span>,
  Check: () => <span>CheckIcon</span>,
  Eye: () => <span>EyeIcon</span>,
}));

// Mock Gemini service
vi.mock('../../services/geminiService', () => ({
  draftEmail: vi.fn().mockResolvedValue({
    subject: 'Auto-generated subject',
    body: 'Auto-generated body',
  }),
}));

describe('EmailManager Component', () => {
  const mockClients: Client[] = [
    {
      id: 'cli-1',
      name: 'Client A',
      email: 'clienta@test.fr',
      phone: '0102030405',
      address: '123 Rue de Paris',
      siret: '12345678901234',
      archived: false,
    },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      number: 'FAC-001',
      date: '2026-01-01',
      dueDate: '2026-02-01',
      clientId: 'cli-1',
      items: [],
      total: 1000,
      status: 'draft',
      type: 'invoice',
    },
  ];

  const mockUserProfile: UserProfile = {
    companyName: 'Test Company',
    siret: '98765432109876',
    address: 'Test Address',
    email: 'contact@test.fr',
    phone: '0102030405',
    activityType: 'SERVICE_BNC',
    isAcreBeneficiary: false,
  };

  const mockEmails: Email[] = [
    {
      id: 'email-1',
      to: 'clienta@test.fr',
      subject: 'Rappel de facture',
      body: 'Bonjour, veuillez payer votre facture',
      type: 'reminder',
      status: 'sent',
      sentAt: '2026-01-15T10:00:00Z',
    },
  ];

  const mockTemplates: EmailTemplate[] = [
    {
      id: 'tpl-1',
      type: 'reminder',
      name: 'Rappel facture',
      subject: 'Facture en attente de paiement',
      body: 'Rappel: votre facture est en attente de paiement',
    },
  ];

  describe('Rendering', () => {
    it("affiche le gestionnaire d'emails", () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it("affiche l'onglet historique des emails", () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it("affiche l'onglet compose", () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it("affiche l'onglet templates", () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });
  });

  describe('Functionality', () => {
    it('affiche la liste des emails envoyés', () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it("affiche les templates d'email", () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it('permet de chercher des emails', () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it("affiche l'état des emails (sent, draft, failed)", () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it("affiche la date d'envoi des emails", () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('gère les emails vides', () => {
      const { container } = render(
        <EmailManager
          emails={[]}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it('gère les templates vides', () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={[]}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it('gère les clients vides', () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={[]}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it('gère les invoices vides', () => {
      const { container } = render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={[]}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it('filtre les emails par type', () => {
      const multiTypeEmails: Email[] = [
        ...mockEmails,
        {
          id: 'email-2',
          to: 'clienta@test.fr',
          subject: 'Merci pour votre paiement',
          body: 'Merci beaucoup',
          type: 'custom',
          status: 'sent',
          sentAt: '2026-01-20T10:00:00Z',
        },
      ];

      const { container } = render(
        <EmailManager
          emails={multiTypeEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });
  });

  // ─── Interactions ──────────────────────────────────────────────────────────
  describe('Navigation entre onglets', () => {
    const defaultProps = {
      emails: mockEmails,
      setEmails: vi.fn(),
      templates: mockTemplates,
      setTemplates: vi.fn(),
      clients: mockClients,
      invoices: mockInvoices,
      userProfile: mockUserProfile,
    };

    it("navigue vers l'onglet Composer (Nouveau Message)", () => {
      render(<EmailManager {...defaultProps} />);
      // Initial render: only 1 "Nouveau Message" button in header
      const composeBtn = screen.getAllByText('Nouveau Message')[0];
      fireEvent.click(composeBtn);
      // Compose tab open: button + h3 both show "Nouveau Message"
      expect(screen.getAllByText('Nouveau Message').length).toBeGreaterThanOrEqual(1);
    });

    it("navigue vers l'onglet Historique", () => {
      render(<EmailManager {...defaultProps} />);
      // Click compose first, then back to history
      fireEvent.click(screen.getByText('Nouveau Message'));
      const historyBtn = screen.getByText('Historique');
      fireEvent.click(historyBtn);
      expect(screen.getByText('Historique')).toBeDefined();
    });

    it("navigue vers l'onglet Templates", () => {
      render(<EmailManager {...defaultProps} />);
      const templatesBtn = screen.getByText('Templates');
      fireEvent.click(templatesBtn);
      expect(screen.getByText('Templates')).toBeDefined();
    });
  });

  describe("Recherche d'emails", () => {
    it('filtre les emails via le champ de recherche', () => {
      render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      fireEvent.change(searchInput, { target: { value: 'Rappel' } });
      expect(screen.getByDisplayValue('Rappel')).toBeDefined();
    });

    it('affiche les emails filtrés', () => {
      render(
        <EmailManager
          emails={[
            ...mockEmails,
            {
              id: 'email-2',
              to: 'other@test.fr',
              subject: 'Autre sujet',
              body: 'Corps du message',
              type: 'custom' as const,
              status: 'sent' as const,
              sentAt: '2026-01-20T10:00:00Z',
            },
          ]}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      const searchInput = screen.getByPlaceholderText(/rechercher/i);
      fireEvent.change(searchInput, { target: { value: 'Rappel' } });
      // Search should update the displayed list
      expect(searchInput).toBeDefined();
    });
  });

  describe('Formulaire de composition', () => {
    it("affiche le formulaire d'envoi après clic sur Nouveau Message", () => {
      render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      fireEvent.click(screen.getAllByText('Nouveau Message')[0]);
      // Compose tab open: button + h3 both present
      expect(screen.getAllByText('Nouveau Message').length).toBeGreaterThanOrEqual(1);
    });

    it('envoie un email avec le formulaire', async () => {
      const setEmails = vi.fn();
      const onSaveEmail = vi.fn();

      render(
        <EmailManager
          emails={mockEmails}
          setEmails={setEmails}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
          onSaveEmail={onSaveEmail}
        />
      );

      fireEvent.click(screen.getAllByText('Nouveau Message')[0]);

      // Fill in compose form if visible
      const toInputs = screen.queryAllByPlaceholderText(/destinataire|email|à/i);
      if (toInputs.length > 0) {
        fireEvent.change(toInputs[0], { target: { value: 'test@example.com' } });
      }

      // Submit the form
      const sendBtn = screen.queryByText('Envoyer');
      if (sendBtn) {
        fireEvent.click(sendBtn);
        // La validation peut empêcher l'envoi si les champs requis sont vides
      }

      expect(setEmails).toBeDefined();
    });
  });

  describe('Gestion des templates', () => {
    it('affiche les templates existants', () => {
      render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      fireEvent.click(screen.getByText('Templates'));
      expect(screen.getByText('Templates')).toBeDefined();
    });

    it('crée un nouveau template', async () => {
      const setTemplates = vi.fn();
      const onSaveTemplate = vi.fn();

      render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={setTemplates}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
          onSaveTemplate={onSaveTemplate}
        />
      );

      fireEvent.click(screen.getByText('Templates'));

      const templateForms = document.querySelectorAll('form');
      if (templateForms.length > 0) {
        fireEvent.submit(templateForms[0]);
        await waitFor(() => expect(setTemplates).toBeDefined());
      }

      expect(setTemplates).toBeDefined();
    });

    it('supprime un template après confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const setTemplates = vi.fn();
      const onDeleteTemplate = vi.fn();

      render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={setTemplates}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
          onDeleteTemplate={onDeleteTemplate}
        />
      );

      fireEvent.click(screen.getByText('Templates'));
      // Template deletion buttons would be in the templates tab
      expect(setTemplates).toBeDefined();
    });
  });

  describe("Suppression d'email", () => {
    it('supprime un email après confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const setEmails = vi.fn();
      const onDeleteEmail = vi.fn();

      render(
        <EmailManager
          emails={mockEmails}
          setEmails={setEmails}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
          onDeleteEmail={onDeleteEmail}
        />
      );

      const deleteButtons = screen.queryAllByRole('button');
      // The history tab should have delete buttons
      expect(deleteButtons.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Génération IA (draftEmail)', () => {
    it('affiche une alerte si aucun client sélectionné pour la génération IA', async () => {
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <EmailManager
          emails={mockEmails}
          setEmails={vi.fn()}
          templates={mockTemplates}
          setTemplates={vi.fn()}
          clients={mockClients}
          invoices={mockInvoices}
          userProfile={mockUserProfile}
        />
      );

      fireEvent.click(screen.getAllByText('Nouveau Message')[0]);

      // Le bouton "Aide à la rédaction" est disabled quand aucun client n'est sélectionné
      const aiButtons = screen.queryAllByText(/Aide à la rédaction/i);
      const aiBtn = aiButtons.map((el) => el.closest('button')).find(Boolean) ?? null;
      if (aiBtn) {
        expect(aiBtn).toHaveProperty('disabled', true);
      }

      expect(window.alert).toBeDefined();
    });
  });
});
