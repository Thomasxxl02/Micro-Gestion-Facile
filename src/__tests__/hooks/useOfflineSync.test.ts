/**
 * Tests pour useOfflineSync.ts
 * Hook de synchronisation Firestore + Dexie (offline-first)
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock de l'instance Dexie
const mockDexieTable = {
  toArray: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('../../db/invoiceDB', () => ({
  db: {
    clients: {
      toArray: (...args: unknown[]) => mockDexieTable.toArray(...args),
      put: (...args: unknown[]) => mockDexieTable.put(...args),
      delete: (...args: unknown[]) => mockDexieTable.delete(...args),
    },
  },
}));

vi.mock('../../firebase', () => ({
  db: {},
}));

// Mock Firestore avec contrôle sur les callbacks
let capturedSuccessCb: ((snapshot: unknown) => void) | null = null;
let capturedErrorCb: ((err: unknown) => void) | null = null;
const mockUnsubscribe = vi.fn();

const mockOnSnapshot = vi.fn(
  (_query: unknown, optionsOrSuccess: unknown, successOrError: unknown, errorCb?: unknown) => {
    if (typeof optionsOrSuccess === 'function') {
      capturedSuccessCb = optionsOrSuccess as (snap: unknown) => void;
      capturedErrorCb = successOrError as (err: unknown) => void;
    } else {
      capturedSuccessCb = successOrError as (snap: unknown) => void;
      capturedErrorCb = errorCb as (err: unknown) => void;
    }
    return mockUnsubscribe;
  }
);

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db: unknown, col: string, id: string) => ({ _col: col, _id: id })),
  query: vi.fn((...args: unknown[]) => ({ _args: args })),
  where: vi.fn((f: string, op: string, v: unknown) => ({ _f: f, _op: op, _v: v })),
  onSnapshot: mockOnSnapshot,
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
}));

// ─── Types de test ─────────────────────────────────────────────────────────────

interface TestItem {
  id: string;
  name: string;
  updatedAt?: string;
}

function makeSnapshot(items: TestItem[], fromCache = false, hasPendingWrites = false) {
  return {
    docs: items.map((item) => ({
      id: item.id,
      data: () => ({ ...item }),
    })),
    metadata: { fromCache, hasPendingWrites },
  };
}

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSuccessCb = null;
    capturedErrorCb = null;
    mockDexieTable.toArray.mockResolvedValue([]);
    mockDexieTable.put.mockResolvedValue(undefined);
    mockDexieTable.delete.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── PHASE 1 : chargement Dexie ─────────────────────────────────────────────

  describe('PHASE 1 — chargement initial depuis Dexie', () => {
    it('charge les données depuis Dexie au montage (dexieTableName fourni)', async () => {
      const localData: TestItem[] = [{ id: 'item-1', name: 'Local Item' }];
      mockDexieTable.toArray.mockResolvedValue(localData);

      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
          dexieTableName: 'clients',
        })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(localData);
      });
      expect(result.current.isFromLocalCache).toBe(true);
    });

    it('ne charge pas Dexie si dexieTableName absent', async () => {
      renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockDexieTable.toArray).not.toHaveBeenCalled();
    });

    it('ne charge pas Dexie si userId absent', async () => {
      renderHook(() =>
        useOfflineSync<TestItem>({
          userId: undefined,
          collectionName: 'clients',
          dexieTableName: 'clients',
        })
      );

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockDexieTable.toArray).not.toHaveBeenCalled();
    });
  });

  // ─── PHASE 2 : sync Firestore ────────────────────────────────────────────────

  describe('PHASE 2 — synchronisation Firestore', () => {
    it('passe au statut OFFLINE si userId absent', () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: undefined,
          collectionName: 'clients',
        })
      );

      expect(result.current.status).toBe('OFFLINE');
    });

    it('passe au statut LOADING puis SUCCESS après snapshot Firestore', async () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      expect(result.current.status).toBe('LOADING');

      await act(async () => {
        capturedSuccessCb?.(makeSnapshot([{ id: '1', name: 'Test' }]));
      });

      expect(result.current.status).toBe('SUCCESS');
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe('1');
    });

    it('met à jour isFromLocalCache selon snapshot.metadata.fromCache', async () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await act(async () => {
        capturedSuccessCb?.(makeSnapshot([{ id: '1', name: 'Test' }], true));
      });

      expect(result.current.isFromLocalCache).toBe(true);
    });

    it('écrit dans Dexie après snapshot Firestore (dexieTableName fourni)', async () => {
      const items: TestItem[] = [
        { id: '1', name: 'Item A' },
        { id: '2', name: 'Item B' },
      ];

      renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
          dexieTableName: 'clients',
        })
      );

      await act(async () => {
        capturedSuccessCb?.(makeSnapshot(items));
        await new Promise((r) => setTimeout(r, 20));
      });

      expect(mockDexieTable.put).toHaveBeenCalledTimes(2);
    });

    it("passe au statut ERROR en cas d'erreur Firestore", async () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await act(async () => {
        capturedErrorCb?.({ code: 'permission-denied', message: 'Forbidden' });
      });

      expect(result.current.status).toBe('ERROR');
      expect(result.current.error).toBeTruthy();
    });

    it('appelle unsubscribe lorsque le hook est démonté', async () => {
      const { unmount } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // ─── upsert ───────────────────────────────────────────────────────────────────

  describe('upsert', () => {
    it('sauvegarde dans Dexie et Firestore', async () => {
      const { setDoc } = await import('firebase/firestore');

      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
          dexieTableName: 'clients',
        })
      );

      const item: TestItem = { id: 'item-new', name: 'New Item' };

      await act(async () => {
        await result.current.upsert(item);
      });

      expect(mockDexieTable.put).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'item-new', userId: 'user-1' })
      );
      expect(setDoc).toHaveBeenCalled();
    });

    it('retourne { success: true } en cas de succès', async () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
          dexieTableName: 'clients',
        })
      );

      const item: TestItem = { id: 'item-1', name: 'Test' };

      let response: { success: boolean } | undefined;
      await act(async () => {
        response = await result.current.upsert(item);
      });

      expect(response).toEqual({ success: true });
    });

    it('lève une erreur si userId absent', async () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: undefined,
          collectionName: 'clients',
        })
      );

      const item: TestItem = { id: 'item-1', name: 'Test' };

      await expect(result.current.upsert(item)).rejects.toThrow('Connexion requise');
    });

    it('retourne { success: false } si Firestore échoue', async () => {
      const { setDoc } = await import('firebase/firestore');
      vi.mocked(setDoc).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      const item: TestItem = { id: 'item-err', name: 'Error Item' };

      let response: { success: boolean; error?: unknown } | undefined;
      await act(async () => {
        response = await result.current.upsert(item);
      });

      expect(response?.success).toBe(false);
      expect(response?.error).toBeDefined();
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('supprime depuis Dexie et Firestore', async () => {
      const { deleteDoc } = await import('firebase/firestore');

      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
          dexieTableName: 'clients',
        })
      );

      await act(async () => {
        await result.current.remove('item-to-delete');
      });

      expect(mockDexieTable.delete).toHaveBeenCalledWith('item-to-delete');
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('retourne { success: true } en cas de succès', async () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
          dexieTableName: 'clients',
        })
      );

      let response: { success: boolean } | undefined;
      await act(async () => {
        response = await result.current.remove('item-1');
      });

      expect(response).toEqual({ success: true });
    });

    it('retourne { success: false } si la suppression échoue', async () => {
      const { deleteDoc } = await import('firebase/firestore');
      vi.mocked(deleteDoc).mockRejectedValueOnce(new Error('Delete failed'));

      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      let response: { success: boolean; error?: unknown } | undefined;
      await act(async () => {
        response = await result.current.remove('item-1');
      });

      expect(response?.success).toBe(false);
      expect(response?.error).toBeDefined();
    });
  });

  // ─── connectionState ──────────────────────────────────────────────────────────

  describe('connectionState', () => {
    it('isSyncing = true pendant LOADING', () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      expect(result.current.isSyncing).toBe(true);
    });

    it('isSyncing = false après SUCCESS', async () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await act(async () => {
        capturedSuccessCb?.(makeSnapshot([]));
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it('isOffline = true si fromCache est true', async () => {
      const { result } = renderHook(() =>
        useOfflineSync<TestItem>({
          userId: 'user-1',
          collectionName: 'clients',
        })
      );

      await act(async () => {
        capturedSuccessCb?.(makeSnapshot([], true)); // fromCache = true
      });

      expect(result.current.isOffline).toBe(true);
    });
  });
});
