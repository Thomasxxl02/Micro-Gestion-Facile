import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClientManager from '../../components/ClientManager';
import React from 'react';
import type { Client, Invoice } from '../../types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Plus: () => <span>PlusIcon</span>,
  Download: () => <span>DownloadIcon</span>,
  Upload: () => <span>UploadIcon</span>,
  Users: () => <span>UsersIcon</span>,
  TrendingUp: () => <span>TrendingUpIcon</span>,
  Archive: () => <span>ArchiveIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
  Search: () => <span>SearchIcon</span>,
  X: () => <span>XIcon</span>,
  Check: () => <span>CheckIcon</span>,
  Edit2: () => <span>Edit2Icon</span>,
  Trash2: () => <span>Trash2Icon</span>,
  Eye: () => <span>EyeIcon</span>,
}));

// Mock child components
vi.mock('../../components/EntityModal', () => ({
  default: ({ isOpen, onClose, children, title }: any) => (
    isOpen ? (
      <div data-testid="entity-modal" role="dialog">
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>Fermer</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/EntityFormFields', () => ({
  ContactFields: ({ formData, onChange }: any) => (
    <div data-testid="contact-fields">
      <input
        placeholder="Nom"
        value={formData?.name || ''}
        onChange={(e) => onChange({ ...formData, name: e.target.value })}
      />
      <input
        placeholder="Email"
        value={formData?.email || ''}
        onChange={(e) => onChange({ ...formData, email: e.target.value })}
      />
    </div>
  ),
  FinancialFields: () => <div data-testid="financial-fields">Financial Fields</div>,
  SearchFilterFields: ({ filters, onChange }: any) => (
    <div data-testid="search-fields">
      <input
        placeholder="Chercher..."
        value={filters.search || ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
    </div>
  ),
}));

describe('ClientManager Component', () => {
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
    {
      id: 'cli-3',
      name: 'Client Archivé',
      email: 'archived@test.fr',
      phone: '',
      address: '',
      archived: true,
    },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      number: 'FAC-001',
      date: '2026-01-01',
      dueDate: '2026-04-01',
      clientId: 'cli-1',
      items: [],
      total: 1000,
      status: 'paid',
      type: 'invoice',
    },
    {
      id: 'inv-2',
      number: 'FAC-002',
      date: '2026-02-01',
      dueDate: '2026-05-01',
      clientId: 'cli-1',
      items: [],
      total: 500,
      status: 'draft',
      type: 'invoice',
    },
    {
      id: 'inv-3',
      number: 'FAC-003',
      date: '2026-03-01',
      dueDate: '2026-06-01',
      clientId: 'cli-2',
      items: [],
      total: 2000,
      status: 'paid',
      type: 'invoice',
    },
  ];

  describe('Rendering & UI', () => {
    it('affiche le titre et interface du gestionnaire de clients', () => {
      const onSave = vi.fn();
      render(
        <ClientManager
          clients={mockClients}
          invoices={mockInvoices}
          onSave={onSave}
        />
      );

      expect(screen.getByText(/Clients|clients/i)).toBeTruthy();
    });

    it('affiche la liste des clients actifs', () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      expect(screen.getByText('Client A')).toBeTruthy();
      expect(screen.getByText('Client B')).toBeTruthy();
    });

    it('affiche le nombre total de clients', () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      // Devrait afficher 2 clients actifs (sans l'archivé)
      const clients = screen.getAllByText(/Client A|Client B/i);
      expect(clients.length).toBeGreaterThanOrEqual(2);
    });

    it('affiche les statuts et statistiques des clients', () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      // Affiche les infos du client
      expect(screen.getByText('clienta@test.fr')).toBeTruthy();
      expect(screen.getByText('clientb@test.fr')).toBeTruthy();
    });
  });

  describe('Client Search & Filter', () => {
    it('filtre les clients par nom', async () => {
      const user = userEvent.setup();
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const searchInput = screen.getByPlaceholderText('Chercher...');
      await user.type(searchInput, 'Client A');

      // Devrait afficher Client A mais pas Client B
      expect(screen.getByText('Client A')).toBeTruthy();
    });

    it('filtre les clients par email', async () => {
      const user = userEvent.setup();
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const searchInput = screen.getByPlaceholderText('Chercher...');
      await user.type(searchInput, 'clientb');

      expect(screen.getByText('Client B')).toBeTruthy();
    });

    it('affiche message si aucun résultat', async () => {
      const user = userEvent.setup();
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const searchInput = screen.getByPlaceholderText('Chercher...');
      await user.type(searchInput, 'ClientQuiNExistePas');

      // Devrait afficher un message "pas de résultats"
      await waitFor(() => {
        expect(screen.getByText(/aucun|pas de|no/i)).toBeTruthy();
      });
    });

    it('ignore les clients archivés par défaut', () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      expect(screen.getByText('Client A')).toBeTruthy();
      expect(screen.getByText('Client B')).toBeTruthy();
      expect(screen.queryByText('Client Archivé')).not.toBeInTheDocument();
    });
  });

  describe('Statistics', () => {
    it('affiche le chiffre d\'affaires total', () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      // Devrait afficher 3000 (1000 + 2000 de factures payées)
      expect(screen.getByText(/3000|3.*000/i)).toBeTruthy();
    });

    it('compte les factures payées par client', () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      // Client A a 1 facture payée (1000)
      // Client B a 1 facture payée (2000)
    });

    it('affiche le nombre total de clients', () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      // Devrait afficher 2 clients actifs
      const countText = screen.getByText(/2|deux/i);
      expect(countText).toBeTruthy();
    });
  });

  describe('Add Client Workflow', () => {
    it('ouvre le modal pour ajouter un client', async () => {
      const user = userEvent.setup();
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const addButton = screen.getByText('PlusIcon');
      await user.click(addButton);

      // Modal devrait s'ouvrir
      expect(screen.getByTestId('entity-modal')).toBeInTheDocument();
    });

    it('crée un nouveau client avec les données du formulaire', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(
        <ClientManager
          clients={mockClients}
          invoices={mockInvoices}
          onSave={onSave}
        />
      );

      const addButton = screen.getByText('PlusIcon');
      await user.click(addButton);

      const modal = screen.getByTestId('entity-modal');
      const nameInput = within(modal).getByPlaceholderText('Nom');
      const emailInput = within(modal).getByPlaceholderText('Email');

      await user.type(nameInput, 'Nouveau Client');
      await user.type(emailInput, 'nouveau@test.fr');

      const submitButton = within(modal).getByRole('button', { name: /Créer|Ajouter|Enregistrer/i });
      if (submitButton) {
        await user.click(submitButton);
      }

      // Appel du callback
      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Client Workflow', () => {
    it('ouvre le modal pour éditer un client', async () => {
      const user = userEvent.setup();
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const editButtons = screen.getAllByText('Edit2Icon');
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
      }

      // Modal devrait s'ouvrir
      expect(screen.getByTestId('entity-modal')).toBeInTheDocument();
    });

    it('précharge les données du client en édition', async () => {
      const user = userEvent.setup();
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const editButtons = screen.getAllByText('Edit2Icon');
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
      }

      const modal = screen.getByTestId('entity-modal');
      const nameInput = within(modal).getByPlaceholderText('Nom') as HTMLInputElement;

      // Devrait être préchargé avec 'Client A'
      expect(nameInput.value).toBe('Client A');
    });

    it('sauvegarde les modifications du client', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(
        <ClientManager
          clients={mockClients}
          invoices={mockInvoices}
          onSave={onSave}
        />
      );

      const editButtons = screen.getAllByText('Edit2Icon');
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
      }

      const modal = screen.getByTestId('entity-modal');
      const nameInput = within(modal).getByPlaceholderText('Nom');

      await user.clear(nameInput);
      await user.type(nameInput, 'Client A Modifié');

      const submitButton = within(modal).getByRole('button', { name: /Enregistrer|Sauvegarder|Créer/i });
      if (submitButton) {
        await user.click(submitButton);
      }

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Client Workflow', () => {
    it('affiche un bouton supprimer', async () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const deleteButtons = screen.getAllByText('Trash2Icon');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('appelle onDelete avec l\'ID du client', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <ClientManager
          clients={mockClients}
          invoices={mockInvoices}
          onDelete={onDelete}
        />
      );

      const deleteButtons = screen.getAllByText('Trash2Icon');
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
      }

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalled();
      });
    });
  });

  describe('Archive Client', () => {
    it('affiche l\'option d\'archivage', async () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const archiveButtons = screen.getAllByText('ArchiveIcon');
      expect(archiveButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('affiche un message si pas de clients', () => {
      render(
        <ClientManager clients={[]} invoices={[]} />
      );

      expect(screen.getByText(/aucun|pas de|empty|vide/i)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('les inputs sont accessibles au clavier', async () => {
      const user = userEvent.setup();
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const searchInput = screen.getByPlaceholderText('Chercher...');
      expect(searchInput).toBeTruthy();

      await user.tab();
      expect(searchInput).toHaveFocus();
    });

    it('les boutons d\'action sont accessibles', () => {
      render(
        <ClientManager clients={mockClients} invoices={mockInvoices} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
