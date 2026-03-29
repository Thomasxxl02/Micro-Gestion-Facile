/**
 * Hook useInvoiceList
 * ✅ Gère tous les états relatifs à la liste de factures
 * ✅ Filtrage, tri, sélection et stats
 * ✅ Complètement indépendant de la UI
 *
 * Usage:
 * ```tsx
 * const list = useInvoiceList(invoices, clients);
 * list.setActiveTab('invoice');
 * list.setFilters({ status: 'DRAFT' });
 * list.filteredAndSorted // factures filtrées/triées
 * ```
 */

import { useCallback, useMemo, useState } from 'react';
import type { Client, DocumentType, Invoice } from '../types';

export interface ListFilters {
  dateStart: string;
  dateEnd: string;
  status: string;
  clientId: string;
}

export interface SortConfig {
  key: 'number' | 'date' | 'client' | 'total';
  direction: 'asc' | 'desc';
}

export interface ListStats {
  total: number;
  count: number;
  pending: number;
  paid: number;
  overdue: number;
}

export interface UseInvoiceListState {
  // Tabulation
  activeTab: DocumentType;
  setActiveTab: (tab: DocumentType) => void;

  // Filtrage
  filters: ListFilters;
  setFilters: (filters: ListFilters) => void;
  resetFilters: () => void;

  // Tri
  sortConfig: SortConfig;
  handleSort: (key: SortConfig['key']) => void;

  // Sélection
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  toggleSelectAll: (total: number) => void;
  clearSelection: () => void;

  // Résultats calculés
  filteredAndSorted: Invoice[];
  stats: ListStats;
  availableStatuses: string[];
}

/**
 * Hook pour gestion de la liste de factures
 */
export function useInvoiceList(invoices: Invoice[], clients: Client[]): UseInvoiceListState {
  // ===== ÉTAT UI =====
  const [activeTab, setActiveTab] = useState<DocumentType>('invoice');
  const [filters, setFilters] = useState<ListFilters>({
    dateStart: '',
    dateEnd: '',
    status: '',
    clientId: '',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ===== HELPERS =====
  const resetFilters = useCallback(() => {
    setFilters({
      dateStart: '',
      dateEnd: '',
      status: '',
      clientId: '',
    });
  }, []);

  const handleSort = useCallback((key: SortConfig['key']) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (total: number) => {
      if (selectedIds.size === total && total > 0) {
        setSelectedIds(new Set());
      } else {
        // Sélectionner tous les documents visibles
        const allIds = invoices
          .filter((doc) => (doc.type || 'invoice') === activeTab)
          .map((d) => d.id);
        setSelectedIds(new Set(allIds));
      }
    },
    [invoices, activeTab, selectedIds.size]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ===== CALCULS RÉACTIFS =====

  // Statuts disponibles
  const availableStatuses = useMemo(() => {
    const currentStatuses = new Set(invoices.map((i) => i.status));
    return Array.from(currentStatuses);
  }, [invoices]);

  // Filtrage et tri
  const filteredAndSorted = useMemo(() => {
    let docs = invoices.filter((doc) => (doc.type || 'invoice') === activeTab);

    // Filtres
    if (filters.dateStart) {
      docs = docs.filter((doc) => doc.date >= filters.dateStart);
    }
    if (filters.dateEnd) {
      docs = docs.filter((doc) => doc.date <= filters.dateEnd);
    }
    if (filters.status) {
      docs = docs.filter((doc) => doc.status === filters.status);
    }
    if (filters.clientId) {
      docs = docs.filter((doc) => doc.clientId === filters.clientId);
    }

    // Tri
    return docs.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortConfig.key) {
        case 'number':
          valA = a.number;
          valB = b.number;
          break;
        case 'date':
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
          break;
        case 'client':
          valA = clients.find((c) => c.id === a.clientId)?.name || '';
          valB = clients.find((c) => c.id === b.clientId)?.name || '';
          break;
        case 'total':
          valA = a.total;
          valB = b.total;
          break;
      }

      if (valA < valB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [invoices, activeTab, filters, sortConfig, clients]);

  // Stats
  const stats = useMemo(() => {
    const docs = invoices.filter((doc) => (doc.type || 'invoice') === activeTab);
    const total = docs.reduce((acc, doc) => acc + doc.total, 0);
    const count = docs.length;

    let pending = 0;
    let paid = 0;
    let overdue = 0;
    const today = new Date().toISOString().split('T')[0];

    const { PAID, ACCEPTED, REJECTED } = {
      PAID: 'PAID',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
    };

    docs.forEach((doc) => {
      if (doc.status === PAID || doc.status === ACCEPTED) {
        paid += doc.total;
      } else if (doc.status === REJECTED) {
        // ignore
      } else {
        pending += doc.total;
        if (doc.dueDate < today) {
          overdue += doc.total;
        }
      }
    });

    return { total, count, pending, paid, overdue };
  }, [invoices, activeTab]);

  return {
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    resetFilters,
    sortConfig,
    handleSort,
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    filteredAndSorted,
    stats,
    availableStatuses,
  };
}
