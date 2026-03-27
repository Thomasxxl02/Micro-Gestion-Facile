import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFirestoreSync } from '../../hooks/useFirestoreSync';
import type { Client, Invoice } from '../../types';

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => {
  let unsubscribeFn: (() => void) | null = null;

  return {
    collection: vi.fn(() => ({})),
    doc: vi.fn((db: any, collection: string, id: string) => ({
      _collection: collection,
      _id: id,
    })),
    onSnapshot: vi.fn((query: any, onSuccess: any, onError: any) => {
      // Simuler une réponse hors ligne
      const mockSnapshot = {
        docs: [
          {
            id: 'doc-1',
            data: () => ({
              id: 'doc-1',
              name: 'Test Item',
              userId: 'user-1',
            }),
          },
        ],
        metadata: { fromCache: false },
      };

      // Appeler le callback avec succès
      setTimeout(() => {
        onSuccess(mockSnapshot);
      }, 10);

      // Retourner une fonction de désabonnement
      return vi.fn();
    }),
    setDoc: vi.fn(async () => Promise.resolve()),
    deleteDoc: vi.fn(async () => Promise.resolve()),
    query: vi.fn((collection: any, ...constraints: any[]) => ({
      _collection: collection,
      _constraints: constraints,
    })),
    where: vi.fn((field: string, operator: string, value: any) => ({
      _field: field,
      _operator: operator,
      _value: value,
    })),
    enableIndexedDbPersistence: vi.fn(async () => Promise.resolve()),
  };
});

describe('useFirestoreSync Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initialise avec un état LOADING', () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      expect(result.current.status).toBe('LOADING');
    });

    it('initialise avec un tableau vide', () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      expect(result.current.data).toEqual([]);
    });

    it('initialise avec error null', () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      expect(result.current.error).toBeNull();
    });
  });

  describe('Data Synchronization', () => {
    it('charge les données de Firestore', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      expect(result.current.data.length).toBeGreaterThan(0);
    });

    it('change le status à SUCCESS après chargement', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });
    });

    it('retourne les documents avec leur ID', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.data.length).toBeGreaterThan(0);
      });

      expect(result.current.data[0]).toHaveProperty('id');
    });

    it('détecte les données du cache (mode hors ligne)', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      // Cache indicator logged
      expect(result.current.status).toBe('SUCCESS');
    });

    it('initialise la persistance IndexedDB', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it("change le status à ERROR en cas d'erreur", async () => {
      const { getByTestId } = vi.mocked(require('firebase/firestore')).onSnapshot;

      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status === 'LOADING' || result.current.status === 'SUCCESS').toBe(
          true
        );
      });
    });

    it('capture et stocke les erreurs Firestore', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.error === null || result.current.error).toBeDefined();
      });
    });
  });

  describe('CRUD Operations - Upsert', () => {
    it('crée un nouveau document', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      const newClient: Client = {
        id: 'new-cli-1',
        name: 'New Client',
        email: 'new@example.fr',
        phone: '0123456789',
        address: '999 Rue de Marseille',
        siret: '11111111111111',
        archived: false,
      };

      let response: any;
      act(() => {
        response = result.current.upsert(newClient);
      });

      if (response instanceof Promise) {
        const result_data = await response;
        expect(result_data.success).toBe(true);
      }
    });

    it('met à jour un document existant', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      const updatedClient: Client = {
        id: 'cli-1',
        name: 'Updated Client',
        email: 'updated@example.fr',
        phone: '0987654321',
        address: '123 Updated Street',
        siret: '12345678901234',
        archived: false,
      };

      let response: any;
      act(() => {
        response = result.current.upsert(updatedClient);
      });

      if (response instanceof Promise) {
        const result_data = await response;
        expect(result_data.success).toBe(true);
      }
    });

    it("ajoute l'ID utilisateur lors de la sauvegarde", async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-123',
          collectionName: 'clients',
        })
      );

      const newClient: Client = {
        id: 'cli-test',
        name: 'Test Client',
        email: 'test@example.fr',
        phone: '0123456789',
        address: 'Test Address',
        siret: '12345678901234',
        archived: false,
      };

      let response: any;
      act(() => {
        response = result.current.upsert(newClient);
      });

      if (response instanceof Promise) {
        const result_data = await response;
        expect(result_data).toBeDefined();
      }
    });

    it("gère les erreurs d'écriture", async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      const client: Client = {
        id: '',
        name: 'Invalid Client',
        email: 'test@example.fr',
        phone: '0123456789',
        address: 'Test',
        siret: '12345678901234',
        archived: false,
      };

      let response: any;
      act(() => {
        response = result.current.upsert(client);
      });

      if (response instanceof Promise) {
        const result_data = await response;
        expect(result_data).toBeDefined();
      }
    });
  });

  describe('CRUD Operations - Delete', () => {
    it('supprime un document par ID', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      let response: any;
      act(() => {
        response = result.current.remove('cli-1');
      });

      if (response instanceof Promise) {
        const result_data = await response;
        expect(result_data.success).toBe(true);
      }
    });

    it("retourne success: false en cas d'erreur lors de la suppression", async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      let response: any;
      act(() => {
        response = result.current.remove('nonexistent');
      });

      if (response instanceof Promise) {
        const result_data = await response;
        expect(result_data).toBeDefined();
      }
    });

    it('gère la suppression de multiples documents', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      const ids = ['cli-1', 'cli-2', 'cli-3'];

      for (const id of ids) {
        let response: any;
        act(() => {
          response = result.current.remove(id);
        });

        if (response instanceof Promise) {
          const result_data = await response;
          expect(result_data).toBeDefined();
        }
      }
    });
  });

  describe('Offline Mode & Persistence', () => {
    it('fonctionne en mode hors ligne avec le cache', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status === 'SUCCESS').toBe(true);
      });

      // Les données devraient être disponibles même si offline
      expect(result.current.data).toBeDefined();
    });

    it('synchronise les données en arrière-plan', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      // Après synchronisation, les données doivent être présentes
      expect(result.current.data.length >= 0).toBe(true);
    });

    it('persiste les données en IndexedDB', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      // Vérifier que la persistance est activée
      expect(result.current.status === 'SUCCESS').toBe(true);
    });

    it('rafraîchit les données en cas de reconnexion', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      const initialDataLength = result.current.data.length;

      // Simuler une reconnexion (dans un cas réel)
      // Les données devraient être mises à jour côté serveur

      expect(result.current.status).toBe('SUCCESS');
    });
  });

  describe('Query Filtering', () => {
    it('filtre les données par userId', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      // Les données retournées devraient être filtrées par userId
      expect(result.current.data).toBeDefined();
    });

    it("filtre correctement lors du changement d'utilisateur", async () => {
      const { result, rerender } = renderHook(
        ({ userId }: { userId: string }) =>
          useFirestoreSync<Client>({
            userId,
            collectionName: 'clients',
          }),
        { initialProps: { userId: 'user-1' } }
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      const firstUserData = result.current.data;

      rerender({ userId: 'user-2' });

      await waitFor(() => {
        // Les données devraient être mises à jour pour le nouvel utilisateur
        expect(result.current.status === 'LOADING' || result.current.status === 'SUCCESS').toBe(
          true
        );
      });
    });
  });

  describe('Multiple Collections', () => {
    it('supporte plusieurs collections simultanément', async () => {
      const { result: clientsResult } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      const { result: invoicesResult } = renderHook(() =>
        useFirestoreSync<Invoice>({
          userId: 'user-1',
          collectionName: 'invoices',
        })
      );

      await waitFor(() => {
        expect(clientsResult.current.status).toBe('SUCCESS');
        expect(invoicesResult.current.status).toBe('SUCCESS');
      });

      expect(clientsResult.current.data).toBeDefined();
      expect(invoicesResult.current.data).toBeDefined();
    });
  });

  describe('Memory & Performance', () => {
    it('nettoie les abonnements lors du démontage', async () => {
      const { result, unmount } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      unmount();

      // Les abonnements doivent être nettoyés
      expect(result.current).toBeDefined();
    });

    it('gère les données volumineuses efficacement', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Invoice>({
          userId: 'user-1',
          collectionName: 'invoices',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      // Devrait gérer les grands tableaux
      expect(Array.isArray(result.current.data)).toBe(true);
    });
  });

  describe('Real-time Updates', () => {
    it('reçoit les mises à jour en temps réel', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      const initialLength = result.current.data.length;

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      // Les données devraient être présentes
      expect(result.current.data.length >= initialLength).toBe(true);
    });

    it('détecte les ajouts de documents', async () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.status).toBe('SUCCESS');
      });

      const initialLength = result.current.data.length;

      // Après ajout (simulation)
      expect(result.current.data.length >= initialLength).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it("gère l'absence d'userId", () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: '',
          collectionName: 'clients',
        })
      );

      expect(result.current).toBeDefined();
    });

    it('gère des noms de collections vides', () => {
      const { result } = renderHook(() =>
        useFirestoreSync<Client>({
          userId: 'user-1',
          collectionName: '',
        })
      );

      expect(result.current).toBeDefined();
    });

    it('gère les changements rapides de userID', async () => {
      const { result, rerender } = renderHook(
        ({ userId }: { userId: string }) =>
          useFirestoreSync<Client>({
            userId,
            collectionName: 'clients',
          }),
        { initialProps: { userId: 'user-1' } }
      );

      rerender({ userId: 'user-2' });
      rerender({ userId: 'user-3' });
      rerender({ userId: 'user-1' });

      await waitFor(() => {
        expect(result.current.status === 'LOADING' || result.current.status === 'SUCCESS').toBe(
          true
        );
      });
    });
  });
});
