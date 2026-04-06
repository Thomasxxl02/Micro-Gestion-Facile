/**
 * Tests d'intégration : Flux Client complet
 *
 * Teste l'interaction entre :
 * - useEntityForm (gestion du formulaire)
 * - appStore (état global)
 * - useEntityFilters (filtrage et liste)
 *
 * Scénarios testés :
 * 1. Créer un client → stocker en mémoire
 * 2. Éditer un client existant → mettre à jour partout
 * 3. Lister les clients avec filtres → vérifier la synchronisation
 * 4. Archiver un client → vérifier les filtres
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useEntityFilters, useEntityForm } from '../../hooks/useEntity';
import { useAppStore } from '../../store/appStore';
import type { Client } from '../../types';

/**
 * Fixtures : Données de test
 */
const mockNewClient: Omit<Client, 'id'> = {
  name: 'Acme Corporation',
  email: 'contact@acme.fr',
  phone: '+33 1 23 45 67 89',
  address: '123 Boulevard Saint-Germain, 75006 Paris',
  siret: '50123456789012',
  archived: false,
};

const mockClient2: Omit<Client, 'id'> = {
  name: 'TechStart SAS',
  email: 'hello@techstart.fr',
  phone: '+33 2 34 56 78 90',
  address: '456 Rue de Rivoli, 75001 Paris',
  siret: '52987654321098',
  archived: false,
};

const mockClient3: Omit<Client, 'id'> = {
  name: 'Archives Inc',
  email: 'old@archived.fr',
  phone: '+33 3 45 67 89 01',
  address: '789 Rue des Archives, 75003 Paris',
  siret: '51111111111111',
  archived: true,
};

/**
 * Helpers pour l'intégration
 */

/**
 * Crée un client complet avec un ID généré
 */
function createClientWithId(data: Omit<Client, 'id'>, id?: string): Client {
  return {
    id: id || `cl-${Date.now()}`,
    ...data,
  };
}

/**
 * Suite de tests d'intégration
 */
describe('Client Flow Integration', () => {
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    const store = useAppStore.getState();
    store.reset();
  });

  afterEach(() => {
    // Nettoyer après le test
    const store = useAppStore.getState();
    store.reset();
  });

  describe('Scenario 1: Create → Store', () => {
    it('crée un client dans le formulaire et le sauvegarde en mémoire', () => {
      const { result: formResult } = renderHook(() => useEntityForm<Client>());

      // Étape 1 : Ouvrir le formulaire de création
      act(() => {
        formResult.current.openCreate();
      });

      expect(formResult.current.isPanelOpen).toBe(true);
      expect(formResult.current.isEditing).toBe(false);

      // Étape 2 : Remplir les champs du formulaire
      const newClient = createClientWithId(mockNewClient);

      act(() => {
        formResult.current.setFormData(newClient);
      });

      expect(formResult.current.formData).toEqual(newClient);

      // Étape 3 : Sauvegarder en mémoire (Zustand store)
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.setClients([...currentStore.clients, newClient]);
      });

      // Vérifier en récupérant l'état actuel du store
      const storeAfterAdd = useAppStore.getState();
      expect(storeAfterAdd.clients).toHaveLength(1);
      expect(storeAfterAdd.clients[0]).toEqual(newClient);

      // Étape 4 : Fermer le formulaire
      act(() => {
        formResult.current.closePanel();
      });

      expect(formResult.current.isPanelOpen).toBe(false);
      expect(formResult.current.formData).toBeNull();
    });

    it('crée plusieurs clients et les stocke tous en mémoire', () => {
      const client1 = createClientWithId(mockNewClient, 'cl-1');
      const client2 = createClientWithId(mockClient2, 'cl-2');
      const client3 = createClientWithId(mockClient3, 'cl-3');

      // Sauvegarder en mémoire
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.setClients([client1, client2, client3]);
      });

      // Vérifier dans le store
      const storeAfterAdd = useAppStore.getState();
      expect(storeAfterAdd.clients).toHaveLength(3);
      expect(storeAfterAdd.clients[0]).toEqual(client1);
      expect(storeAfterAdd.clients[1]).toEqual(client2);
      expect(storeAfterAdd.clients[2]).toEqual(client3);
    });
  });

  describe('Scenario 2: Edit → Update → Sync', () => {
    it('édite un client existant et synchronise les changements', () => {
      const client = createClientWithId(mockNewClient, 'cl-1');

      // Préparation : initialiser avec un client existant
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.setClients([client]);
      });

      // Vérifier que le client est bien en mémoire
      let storeAfterInit = useAppStore.getState();
      expect(storeAfterInit.clients).toHaveLength(1);

      // Étape 1 : Ouvrir le formulaire d'édition
      const { result: formResult } = renderHook(() => useEntityForm(client));

      act(() => {
        formResult.current.openEdit(client);
      });

      expect(formResult.current.isEditing).toBe(true);
      expect(formResult.current.editingId).toBe('cl-1');

      // Étape 2 : Modifier les champs
      const updatedName = 'Acme Corporation France';
      const updatedEmail = 'paris@acme.fr';

      act(() => {
        formResult.current.updateFormField('name', updatedName);
        formResult.current.updateFormField('email', updatedEmail);
      });

      expect(formResult.current.formData?.name).toBe(updatedName);
      expect(formResult.current.formData?.email).toBe(updatedEmail);

      // Étape 3 : Mettre à jour en mémoire
      const updatedClient = formResult.current.formData as Client;
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.updateClients((clients) =>
          clients.map((c) => (c.id === updatedClient.id ? updatedClient : c))
        );
      });

      const storeAfterUpdate = useAppStore.getState();
      expect(storeAfterUpdate.clients[0].name).toBe(updatedName);
      expect(storeAfterUpdate.clients[0].email).toBe(updatedEmail);

      // Étape 4 : Fermer le formulaire
      act(() => {
        formResult.current.closePanel();
      });

      expect(formResult.current.isPanelOpen).toBe(false);
    });
  });

  describe('Scenario 3: List → Filter → Display', () => {
    beforeEach(() => {
      const store = useAppStore.getState();
      const client1 = createClientWithId(mockNewClient, 'cl-1');
      const client2 = createClientWithId(mockClient2, 'cl-2');
      const client3 = createClientWithId(mockClient3, 'cl-3');

      // Initialiser le store
      act(() => {
        store.setClients([client1, client2, client3]);
      });
    });

    it('liste tous les clients actifs (exclut les archivés)', () => {
      const store = useAppStore.getState();
      const { result: filterResult } = renderHook(() =>
        useEntityFilters(store.clients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      expect(filterResult.current.filteredEntities).toHaveLength(2);
      expect(filterResult.current.filteredEntities.every((c) => !c.archived)).toBe(true);
      expect(filterResult.current.count).toBe(2);
    });

    it('affiche les clients archivés quand demandé', () => {
      const store = useAppStore.getState();
      const { result: filterResult } = renderHook(() =>
        useEntityFilters(store.clients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      // Initialement affiche 2 clients (non-archivés)
      expect(filterResult.current.filteredEntities).toHaveLength(2);

      act(() => {
        filterResult.current.setShowArchived(true);
      });

      // Quand showArchived est true, affiche TOUS les clients (3 clients)
      expect(filterResult.current.filteredEntities).toHaveLength(3);

      // Vérifier qu'il y a au moins un client archivé
      const archivedClients = filterResult.current.filteredEntities.filter((c) => c.archived);
      expect(archivedClients.length).toBeGreaterThan(0);
    });

    it('cherche un client par nom', () => {
      const store = useAppStore.getState();
      const { result: filterResult } = renderHook(() =>
        useEntityFilters(store.clients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
          searchField: 'name',
        })
      );

      act(() => {
        filterResult.current.setSearchTerm('Acme');
      });

      expect(filterResult.current.filteredEntities).toHaveLength(1);
      expect(filterResult.current.filteredEntities[0].name).toBe('Acme Corporation');
    });

    it('trie les clients par nom', () => {
      const store = useAppStore.getState();
      const { result: filterResult } = renderHook(() =>
        useEntityFilters(store.clients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      act(() => {
        filterResult.current.toggleSort('name');
      });

      expect(filterResult.current.sortBy).toBe('name');
      expect(filterResult.current.sortOrder).toBe('asc');

      const names = filterResult.current.filteredEntities.map((c) => c.name);
      expect(names).toEqual(['Acme Corporation', 'TechStart SAS']);
    });

    it('combine recherche, archivage et tri', () => {
      const store = useAppStore.getState();
      const { result: filterResult } = renderHook(() =>
        useEntityFilters(store.clients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
          searchField: 'name',
        })
      );

      act(() => {
        filterResult.current.setSearchTerm('Acme');
        filterResult.current.setShowArchived(false);
        filterResult.current.toggleSort('name');
      });

      expect(filterResult.current.filteredEntities).toHaveLength(1);
      expect(filterResult.current.filteredEntities[0].name).toBe('Acme Corporation');
    });
  });

  describe('Scenario 4: Archive → Filter Sync', () => {
    it('archive un client et vérifie que les filtres le masquent', () => {
      const client = createClientWithId(mockNewClient, 'cl-1');

      // Initialiser
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.setClients([client]);
      });

      // Vérifier que le client est visible au départ
      const storeAfterInit = useAppStore.getState();
      const { result: filterResult } = renderHook(() =>
        useEntityFilters(storeAfterInit.clients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      expect(filterResult.current.filteredEntities).toHaveLength(1);

      // Archiver le client
      const archivedClient = { ...client, archived: true };
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.setClients([archivedClient]);
      });

      // Vérifier qu'il est masqué maintenant
      const storeAfterArchive = useAppStore.getState();
      const { result: filterResult2 } = renderHook(() =>
        useEntityFilters(storeAfterArchive.clients as unknown as Record<string, unknown>[], {
          hasArchive: true,
          archiveField: 'archived',
        })
      );

      expect(filterResult2.current.filteredEntities).toHaveLength(0);

      // Vérifier qu'il réapparaît quand on affiche les archivés
      act(() => {
        filterResult2.current.setShowArchived(true);
      });

      expect(filterResult2.current.filteredEntities).toHaveLength(1);
    });
  });

  describe('Scenario 5: Store Persistence', () => {
    it('préserve les données du store en mémoire', () => {
      const client = createClientWithId(mockNewClient, 'cl-1');

      // Sauvegarder en store
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.setClients([client]);
      });

      // Vérifier en récupérant l'état actuel du store
      const storeAfterAdd = useAppStore.getState();
      expect(storeAfterAdd.clients).toHaveLength(1);
      expect(storeAfterAdd.clients[0]).toEqual(client);

      // Récupérer depuis le store sans réinitialiser
      expect(storeAfterAdd.clients[0].name).toBe('Acme Corporation');
    });

    it('gère une charge de données importante en mémoire', () => {
      const numberOfClients = 100;
      const clients: Client[] = [];

      for (let i = 0; i < numberOfClients; i++) {
        clients.push(
          createClientWithId(
            {
              ...mockNewClient,
              name: `Client ${i}`,
              email: `client${i}@example.fr`,
            },
            `cl-${i}`
          )
        );
      }

      // Sauvegarder tous les clients en mémoire
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.setClients(clients);
      });

      // Vérifier
      const storeAfterAdd = useAppStore.getState();
      expect(storeAfterAdd.clients).toHaveLength(numberOfClients);
    });
  });

  describe('Scenario 6: Concurrent Operations', () => {
    it("gère l'édition simultanée de plusieurs clients", () => {
      const client1 = createClientWithId(mockNewClient, 'cl-1');
      const client2 = createClientWithId(mockClient2, 'cl-2');

      // Initialiser
      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.setClients([client1, client2]);
      });

      // Éditer client1 et client2 "simultanément"
      const updated1 = { ...client1, name: 'Updated Acme' };
      const updated2 = { ...client2, email: 'new@techstart.fr' };

      act(() => {
        const currentStore = useAppStore.getState();
        currentStore.updateClients((clients) =>
          clients.map((c) => (c.id === client1.id ? updated1 : c.id === client2.id ? updated2 : c))
        );
      });

      // Vérifier
      const storeAfterUpdate = useAppStore.getState();
      expect(storeAfterUpdate.clients[0].name).toBe('Updated Acme');
      expect(storeAfterUpdate.clients[1].email).toBe('new@techstart.fr');
    });
  });
});
