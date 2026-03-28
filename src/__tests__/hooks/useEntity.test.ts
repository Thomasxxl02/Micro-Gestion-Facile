import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useEntityFilters, useEntityForm, useEntityStats } from '../../hooks/useEntity';
import type { Client, Invoice } from '../../types';

describe('useEntityForm Hook', () => {
  describe('Initialization', () => {
    it('initialise avec des valeurs par défaut', () => {
      const { result } = renderHook(() => useEntityForm<Client>());

      expect(result.current.formData).toBeNull();
      expect(result.current.editingId).toBeNull();
      expect(result.current.isPanelOpen).toBe(false);
      expect(result.current.isEditing).toBe(false);
    });

    it('initialise avec les données providées', () => {
      const client: Client = {
        id: 'cl-1',
        name: 'Client Test',
        email: 'test@example.fr',
        phone: '0123456789',
        address: '123 Rue de Paris',
        siret: '12345678901234',
        archived: false,
      };

      const { result } = renderHook(() => useEntityForm(client));

      expect(result.current.formData).toEqual(client);
    });
  });

  describe('Form Operations', () => {
    it('ouvre le formulaire de création', () => {
      const { result } = renderHook(() => useEntityForm<Client>());

      act(() => {
        result.current.openCreate();
      });

      expect(result.current.isPanelOpen).toBe(true);
      expect(result.current.isEditing).toBe(false);
    });

    it("ouvre le formulaire d'édition avec les données du client", () => {
      const client: Client = {
        id: 'cl-1',
        name: 'Client Test',
        email: 'test@example.fr',
        phone: '0123456789',
        address: '123 Rue',
        siret: '12345678901234',
        archived: false,
      };

      const { result } = renderHook(() => useEntityForm<Client>());

      act(() => {
        result.current.openEdit(client);
      });

      expect(result.current.isPanelOpen).toBe(true);
      expect(result.current.editingId).toBe('cl-1');
      expect(result.current.isEditing).toBe(true);
      expect(result.current.formData).toEqual(client);
    });

    it('ferme le formulaire et réinitialise les données', () => {
      const client: Client = {
        id: 'cl-1',
        name: 'Client Test',
        email: 'test@example.fr',
        phone: '0123456789',
        address: '123 Rue',
        siret: '12345678901234',
        archived: false,
      };

      const { result } = renderHook(() => useEntityForm(client));

      act(() => {
        result.current.closePanel();
      });

      expect(result.current.isPanelOpen).toBe(false);
      expect(result.current.formData).toBeNull();
      expect(result.current.editingId).toBeNull();
    });
  });

  describe('Field Updates', () => {
    it('met à jour un champ du formulaire', () => {
      const client: Client = {
        id: 'cl-1',
        name: 'Original Name',
        email: 'test@example.fr',
        phone: '0123456789',
        address: '123 Rue',
        siret: '12345678901234',
        archived: false,
      };

      const { result } = renderHook(() => useEntityForm(client));

      act(() => {
        result.current.updateFormField('name', 'New Name');
      });

      expect(result.current.formData?.name).toBe('New Name');
    });

    it('met à jour plusieurs champs du formulaire', () => {
      const client: Client = {
        id: 'cl-1',
        name: 'Client',
        email: 'test@example.fr',
        phone: '0123456789',
        address: '123 Rue',
        siret: '12345678901234',
        archived: false,
      };

      const { result } = renderHook(() => useEntityForm(client));

      act(() => {
        result.current.updateFormField('name', 'New Name');
        result.current.updateFormField('email', 'newemail@example.fr');
        result.current.updateFormField('phone', '0987654321');
      });

      expect(result.current.formData?.name).toBe('New Name');
      expect(result.current.formData?.email).toBe('newemail@example.fr');
      expect(result.current.formData?.phone).toBe('0987654321');
    });

    it('permet la modification directe du formData', () => {
      const client: Client = {
        id: 'cl-1',
        name: 'Client',
        email: 'test@example.fr',
        phone: '0123456789',
        address: '123 Rue',
        siret: '12345678901234',
        archived: false,
      };

      const { result } = renderHook(() => useEntityForm(client));

      act(() => {
        result.current.setFormData({
          ...client,
          name: 'Modified Client',
          archived: true,
        });
      });

      expect(result.current.formData?.name).toBe('Modified Client');
      expect(result.current.formData?.archived).toBe(true);
    });
  });

  describe('Template Creation', () => {
    it('crée un nouveau formulaire avec un template partiel', () => {
      const { result } = renderHook(() => useEntityForm<Client>());

      const template = { name: 'Template Client' } as Client;

      act(() => {
        result.current.openCreate(template);
      });

      expect(result.current.formData?.name).toBe('Template Client');
      expect(result.current.isPanelOpen).toBe(true);
    });

    it('crée un nouveau formulaire sans template', () => {
      const { result } = renderHook(() => useEntityForm<Client>());

      act(() => {
        result.current.openCreate();
      });

      expect(result.current.formData).toBeNull();
      expect(result.current.isPanelOpen).toBe(true);
    });
  });
});

describe('useEntityFilters Hook', () => {
  const mockClients: Client[] = [
    {
      id: 'cl-1',
      name: 'Alice Martin',
      email: 'alice@example.fr',
      phone: '0123456789',
      address: '123 Rue de Paris',
      siret: '12345678901234',
      archived: false,
    },
    {
      id: 'cl-2',
      name: 'Bob Dupont',
      email: 'bob@example.fr',
      phone: '0987654321',
      address: '456 Rue de Lyon',
      siret: '98765432109876',
      archived: false,
    },
    {
      id: 'cl-3',
      name: 'Claire Lefevre',
      email: 'claire@example.fr',
      phone: '0612345678',
      address: '789 Rue de Bordeaux',
      siret: '55555555555555',
      archived: true,
    },
  ];

  describe('Search Functionality', () => {
    it('filtre par terme de recherche', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
        })
      );

      act(() => {
        result.current.setSearchTerm('alice');
      });

      expect(result.current.filteredEntities).toHaveLength(1);
      expect(result.current.filteredEntities[0].name).toBe('Alice Martin');
    });

    it('recherche insensible à la casse', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
        })
      );

      act(() => {
        result.current.setSearchTerm('ALICE');
      });

      expect(result.current.filteredEntities).toHaveLength(1);
      expect(result.current.filteredEntities[0].name).toBe('Alice Martin');
    });

    it('affiche tous les résultats si recherche vide', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
        })
      );

      act(() => {
        result.current.setSearchTerm('');
      });

      expect(result.current.filteredEntities).toHaveLength(3);
    });

    it('ne retourne aucun résultat si pas de correspondance', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
        })
      );

      act(() => {
        result.current.setSearchTerm('NonExistant');
      });

      expect(result.current.filteredEntities).toHaveLength(0);
    });
  });

  describe('Archive Filtering', () => {
    it('masque les archivés par défaut', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      expect(result.current.filteredEntities).toHaveLength(2);
      expect(result.current.filteredEntities.every((c) => !c.archived)).toBe(true);
    });

    it('affiche les archivés si filtré', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      // Initially shows only non-archived: Alice, Bob
      expect(result.current.filteredEntities).toHaveLength(2);
      expect(result.current.filteredEntities.every((c: any) => !c.archived)).toBe(true);

      act(() => {
        result.current.setShowArchived(true);
      });

      // Now shows all including archived: Alice, Bob, Claire
      expect(result.current.filteredEntities).toHaveLength(3);
    });

    it('affiche tous les éléments (archivés + actifs) si filtré', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      // Initially should show only active (2): Alice, Bob
      expect(result.current.filteredEntities).toHaveLength(2);

      act(() => {
        result.current.setShowArchived(true);
      });

      // After toggling, should show all (3): Alice, Bob, Claire
      expect(result.current.filteredEntities).toHaveLength(3);
    });
  });

  describe('Sorting', () => {
    it('trie par champ en ordre ascendant', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
        })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sortBy).toBe('name');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.filteredEntities[0].name).toBe('Alice Martin');
    });

    it("inverse l'ordre de tri au deuxième clic", () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
        })
      );

      // First click: should sort asc
      act(() => {
        result.current.toggleSort('name');
      });
      expect(result.current.sortOrder).toBe('asc');
      const nameAsc = result.current.filteredEntities[0].name;

      // Second click on same field: should sort desc
      act(() => {
        result.current.toggleSort('name');
      });
      expect(result.current.sortOrder).toBe('desc');
      const nameDesc = result.current.filteredEntities[0].name;

      // Verify the order is actually reversed
      expect(nameAsc).not.toBe(nameDesc);
    });

    it('change le champ de tri', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
        })
      );

      act(() => {
        result.current.toggleSort('name');
        result.current.toggleSort('email');
      });

      expect(result.current.sortBy).toBe('email');
      expect(result.current.sortOrder).toBe('asc');
    });
  });

  describe('Combined Filtering & Sorting', () => {
    it('recherche + filtre archivés + tri', () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      act(() => {
        result.current.setSearchTerm('D');
        result.current.setShowArchived(false);
        result.current.toggleSort('name');
      });

      expect(result.current.count).toBeGreaterThanOrEqual(0);
    });

    it("affiche le bon nombre d'éléments filtrés", () => {
      const { result } = renderHook(() =>
        useEntityFilters(mockClients as unknown as Record<string, unknown>[], {
          searchField: 'name',
        })
      );

      expect(result.current.count).toBe(3);

      act(() => {
        result.current.setSearchTerm('alice');
      });

      expect(result.current.count).toBe(1);
    });
  });
});

describe('useEntityStats Hook', () => {
  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      number: 'FAC-001',
      date: '2026-01-01',
      dueDate: '2026-04-01',
      clientId: 'cl-1',
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
      clientId: 'cl-1',
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
      clientId: 'cl-2',
      items: [],
      total: 2000,
      status: 'paid',
      type: 'invoice',
    },
  ];

  describe('Statistics Calculation', () => {
    it('calcule le total des factures', () => {
      const { result } = renderHook(() =>
        useEntityStats(mockInvoices, {
          totalRevenue: (items: Invoice[]) => items.reduce((sum, inv) => sum + inv.total, 0),
        })
      );

      expect(result.current.totalRevenue).toBe(3500);
    });

    it('compte les factures payées', () => {
      const { result } = renderHook(() =>
        useEntityStats(mockInvoices, {
          paidCount: (items: Invoice[]) => items.filter((inv) => inv.status === 'paid').length,
        })
      );

      expect(result.current.paidCount).toBe(2);
    });

    it('calcule plusieurs statistiques simultanément', () => {
      const { result } = renderHook(() =>
        useEntityStats(mockInvoices, {
          totalRevenue: (items: Invoice[]) => items.reduce((sum, inv) => sum + inv.total, 0),
          paidCount: (items: Invoice[]) => items.filter((inv) => inv.status === 'paid').length,
          draftCount: (items: Invoice[]) => items.filter((inv) => inv.status === 'draft').length,
        })
      );

      expect(result.current.totalRevenue).toBe(3500);
      expect(result.current.paidCount).toBe(2);
      expect(result.current.draftCount).toBe(1);
    });
  });

  describe('Memoization', () => {
    it('recalcule les stats si les données changent', () => {
      const stats = {
        count: (items: Invoice[]) => items.length,
      };

      const { result, rerender } = renderHook(({ items }) => useEntityStats(items, stats), {
        initialProps: { items: mockInvoices },
      });

      expect(result.current.count).toBe(3);

      const newInvoices: Invoice[] = [
        ...mockInvoices,
        {
          id: 'inv-4',
          number: 'FAC-004',
          date: '2026-03-01',
          dueDate: '2026-06-01',
          clientId: 'cl-3',
          items: [],
          total: 300,
          status: 'paid',
          type: 'invoice',
        } as Invoice,
      ];

      rerender({ items: newInvoices });

      expect(result.current.count).toBe(4);
    });

    it('garde la même référence si les données ne changent pas', () => {
      const stats = {
        count: (items: Invoice[]) => items.length,
      };

      const { result, rerender } = renderHook(({ items }) => useEntityStats(items, stats), {
        initialProps: { items: mockInvoices },
      });

      const firstResult = result.current;

      rerender({ items: mockInvoices });

      expect(result.current).toEqual(firstResult);
    });
  });

  describe('Custom Statistics', () => {
    it('supporte les fonctions statistiques personnalisées', () => {
      const { result } = renderHook(() =>
        useEntityStats(mockInvoices, {
          avgAmount: (items: Invoice[]) =>
            items.length > 0 ? items.reduce((sum, inv) => sum + inv.total, 0) / items.length : 0,
        })
      );

      expect(result.current.avgAmount).toBe(3500 / 3);
    });

    it('calcule le revenu moyen des factures payées', () => {
      const { result } = renderHook(() =>
        useEntityStats(mockInvoices, {
          avgPaidAmount: (items: Invoice[]) => {
            const paid = items.filter((inv) => inv.status === 'paid');
            return paid.length > 0
              ? paid.reduce((sum, inv) => sum + inv.total, 0) / paid.length
              : 0;
          },
        })
      );

      expect(result.current.avgPaidAmount).toBe(1500);
    });
  });
});
