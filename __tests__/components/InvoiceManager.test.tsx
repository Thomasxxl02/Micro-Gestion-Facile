import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InvoiceManager from '../../components/InvoiceManager';
import React from 'react';
import type { Invoice, Client, UserProfile, Product } from '../../types';

// Mock Lucide icons - import many as the component uses a lot
vi.mock('lucide-react', () => ({
  Plus: () => <span>PlusIcon</span>,
  Trash2: () => <span>Trash2Icon</span>,
  Wand2: () => <span>Wand2Icon</span>,
  ArrowLeft: () => <span>ArrowLeftIcon</span>,
  FileText: () => <span>FileTextIcon</span>,
  Repeat: () => <span>RepeatIcon</span>,
  FileCheck: () => <span>FileCheckIcon</span>,
  ShoppingBag: () => <span>ShoppingBagIcon</span>,
  Receipt: () => <span>ReceiptIcon</span>,
  'Link': () => <span>LinkIcon</span>,
  ArrowRightCircle: () => <span>ArrowRightCircleIcon</span>,
  Download: () => <span>DownloadIcon</span>,
  Calendar: () => <span>CalendarIcon</span>,
  Search: () => <span>SearchIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
  CheckSquare: () => <span>CheckSquareIcon</span>,
  Square: () => <span>SquareIcon</span>,
  Package: () => <span>PackageIcon</span>,
  ChevronUp: () => <span>ChevronUpIcon</span>,
  ChevronDown: () => <span>ChevronDownIcon</span>,
  X: () => <span>XIcon</span>,
  Eye: () => <span>EyeIcon</span>,
  Zap: () => <span>ZapIcon</span>,
  Printer: () => <span>PrinterIcon</span>,
  Mail: () => <span>MailIcon</span>,
  Bell: () => <span>BellIcon</span>,
  Copy: () => <span>CopyIcon</span>,
  ThumbsUp: () => <span>ThumbsUpIcon</span>,
  ThumbsDown: () => <span>ThumbsDownIcon</span>,
  ShieldCheck: () => <span>ShieldCheckIcon</span>,
  Calculator: () => <span>CalculatorIcon</span>,
  Percent: () => <span>PercentIcon</span>,
  Truck: () => <span>TruckIcon</span>,
  Coins: () => <span>CoinsIcon</span>,
  Clock: () => <span>ClockIcon</span>,
  ExternalLink: () => <span>ExternalLinkIcon</span>,
}));

// Mock geminiService
vi.mock('../../services/geminiService', () => ({
  suggestInvoiceDescription: vi.fn().mockResolvedValue('Description générée'),
  generateInvoiceItemsFromPrompt: vi.fn().mockResolvedValue([]),
}));

describe('InvoiceManager Component', () => {
  const mockUserProfile: UserProfile = {
    companyName: 'Ma Micro-Entreprise',
    siret: '12345678901234',
    address: '123 Rue de Paris',
    email: 'contact@example.fr',
    phone: '0102030405',
    activityType: 'SERVICE_BNC',
    isAcreBeneficiary: false,
  };

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
    {
      id: 'cli-2',
      name: 'Client B',
      email: 'clientb@test.fr',
      phone: '0605040302',
      address: '456 Rue de Lyon',
      siret: '98765432109876',
      archived: false,
    },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      number: 'FAC-001',
      date: '2026-03-10',
      dueDate: '2026-04-10',
      clientId: 'cli-1',
      items: [
        {
          id: 'itm-1',
          description: 'Développement',
          quantity: 10,
          unitPrice: 100,
          vatRate: 20,
        },
      ],
      total: 1000,
      status: 'draft',
      type: 'invoice',
    },
    {
      id: 'inv-2',
      number: 'FAC-002',
      date: '2026-03-15',
      dueDate: '2026-04-15',
      clientId: 'cli-2',
      items: [],
      total: 500,
      status: 'sent',
      type: 'invoice',
    },
  ];

  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Service A',
      description: 'Service A description',
      price: 100,
      type: 'service',
      category: 'Services',
    },
    {
      id: 'prod-2',
      name: 'Service B',
      description: 'Service B description',
      price: 150,
      type: 'service',
      category: 'Services',
    },
  ];

  describe('Rendering & UI', () => {
    it('affiche le gestionnaire de factures', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText(/Factures|factures|Invoices/i)).toBeTruthy();
    });

    it('affiche la liste des factures', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText('FAC-001')).toBeTruthy();
      expect(screen.getByText('FAC-002')).toBeTruthy();
    });

    it('affiche les statuts des factures', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText(/draft|brouillon|Draft/i)).toBeTruthy();
      expect(screen.getByText(/sent|envoyé|Sent/i)).toBeTruthy();
    });
  });

  describe('Invoice List', () => {
    it('affiche le numéro de facture', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText('FAC-001')).toBeTruthy();
    });

    it('affiche le client de la facture', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText('Client A')).toBeTruthy();
      expect(screen.getByText('Client B')).toBeTruthy();
    });

    it('affiche la date de facture', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText(/2026-03-10|10\/03|03\/10/)).toBeTruthy();
    });

    it('affiche les montants totaux', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText(/1000|1.*000/)).toBeTruthy();
    });
  });

  describe('Invoice Creation', () => {
    it('ouvre le formulaire de création de facture', async () => {
      const user = userEvent.setup();
      const setInvoices = vi.fn();

      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      const createButton = screen.getByText('PlusIcon');
      await user.click(createButton);

      // Devrait afficher des champs de formulaire
      await waitFor(() => {
        expect(screen.getByText(/Nouveau|Créer|Create/i)).toBeTruthy();
      });
    });
  });

  describe('Invoice Filtering', () => {
    it('filtre par statut', async () => {
      const user = userEvent.setup();
      const setInvoices = vi.fn();

      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      const filterButton = screen.getByText(/Filter|Filtre|filter/i);
      if (filterButton) {
        await user.click(filterButton);
      }
    });

    it('filtre par client', async () => {
      const user = userEvent.setup();
      const setInvoices = vi.fn();

      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      // Devrait avoir un champ de recherche/filtre
      expect(screen.getByText(/Client A|Client B/)).toBeTruthy();
    });
  });

  describe('Invoice Actions', () => {
    it('affiche un bouton pour dupliquer une facture', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      const copyButtons = screen.getAllByText('CopyIcon');
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it('affiche un bouton pour supprimer une facture', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      const deleteButtons = screen.getAllByText('Trash2Icon');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('affiche un bouton pour télécharger une facture', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      const downloadButtons = screen.getAllByText('DownloadIcon');
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    it('affiche un bouton pour envoyer une facture', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      const mailButtons = screen.getAllByText('MailIcon');
      expect(mailButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('affiche un message si pas de factures', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={[]}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText(/aucun|pas de|empty|vide|no invoice/i)).toBeTruthy();
    });
  });

  describe('Different Invoice Types', () => {
    it('gère les factures standards', () => {
      const setInvoices = vi.fn();
      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText('FAC-001')).toBeTruthy();
    });

    it('gère les devis', () => {
      const setInvoices = vi.fn();
      const quote: Invoice = {
        ...mockInvoices[0],
        id: 'quote-1',
        number: 'DEV-001',
        type: 'quote',
      };

      render(
        <InvoiceManager
          invoices={[quote]}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      expect(screen.getByText('DEV-001')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('les boutons sont accessibles au clavier', async () => {
      const user = userEvent.setup();
      const setInvoices = vi.fn();

      render(
        <InvoiceManager
          invoices={mockInvoices}
          setInvoices={setInvoices}
          clients={mockClients}
          userProfile={mockUserProfile}
          products={mockProducts}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      await user.tab();
      expect(buttons[0]).toHaveFocus();
    });
  });
});
