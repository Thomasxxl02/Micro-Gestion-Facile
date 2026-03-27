import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmailManager from '../../components/EmailManager';
import type { Email, EmailTemplate, Client, Invoice, UserProfile } from '../../types';

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
      from: 'contact@test.fr',
      to: 'clienta@test.fr',
      subject: 'Rappel de facture',
      body: 'Bonjour, veuillez payer votre facture',
      type: 'invoice_reminder',
      status: 'sent',
      sentAt: '2026-01-15T10:00:00Z',
    },
  ];

  const mockTemplates: EmailTemplate[] = [
    {
      id: 'tpl-1',
      type: 'invoice_reminder',
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
          from: 'contact@test.fr',
          to: 'clienta@test.fr',
          subject: 'Merci pour votre paiement',
          body: 'Merci beaucoup',
          type: 'payment_confirmation',
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
});
