/**
 * Hooks réutilisables pour gestion des entités (Invoice, Client, Supplier, etc)
 * Objectif: Réduire la duplication de code dans les managers
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Hook: Gestion du formulaire d'entité (créer/éditer)
 * Unifie la logique d'édition pour Invoice, Client, Supplier, Product
 */
export const useEntityForm = <T extends { id: string }>(initialData?: T) => {
  const [formData, setFormData] = useState<T | null>(initialData || null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(null);
    setEditingId(null);
    setIsPanelOpen(false);
  }, []);

  const openCreate = useCallback((template?: Partial<T>) => {
    setFormData(template ? (template as T) : null);
    setEditingId(null);
    setIsPanelOpen(true);
  }, []);

  const openEdit = useCallback((entity: T) => {
    setFormData(entity);
    setEditingId(entity.id);
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const updateFormField = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  }, []);

  return {
    formData,
    setFormData,
    editingId,
    isPanelOpen,
    resetForm,
    openCreate,
    openEdit,
    closePanel,
    updateFormField,
    isEditing: editingId !== null,
  };
};

/**
 * Hook: Gestion des filtres et recherche
 * Unifie la logique de filtrage pour tous les managers
 */
interface FilterConfig<T = Record<string, unknown>> {
  searchField?: keyof T; // ex: 'name', 'email'
  hasArchive?: boolean;
  archiveField?: keyof T; // ex: 'archived'
}

export const useEntityFilters = <T extends Record<string, unknown>>(
  entities: T[],
  config: FilterConfig<T> = {}
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredEntities = useMemo(() => {
    let result = [...entities];

    // Filtre archivés
    if (config.hasArchive && config.archiveField && !showArchived) {
      result = result.filter((item) => {
        const isArchived = item[config.archiveField as keyof T];
        return !isArchived;
      });
    }

    // Recherche
    if (searchTerm && config.searchField) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const value = String(item[config.searchField as keyof T] || '');
        return value.toLowerCase().includes(term);
      });
    }

    // Tri
    if (sortBy) {
      result.sort((a, b) => {
        const aVal = a[sortBy as keyof T];
        const bVal = b[sortBy as keyof T];
        const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [entities, searchTerm, showArchived, sortBy, sortOrder, config]);

  const toggleSort = useCallback(
    (field: keyof T) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(field);
        setSortOrder('asc');
      }
    },
    [sortBy]
  );

  return {
    searchTerm,
    setSearchTerm,
    showArchived,
    setShowArchived,
    sortBy,
    sortOrder,
    toggleSort,
    filteredEntities,
    count: filteredEntities.length,
  };
};

/**
 * Hook: Statistiques d'entité (revenue, count, etc)
 * Utilise useMemo pour ne recalculer que si les données changent
 */
export const useEntityStats = <T>(
  entities: T[],
  statFunctions: {
    [key: string]: (items: T[]) => unknown;
  }
) => {
  return useMemo(() => {
    const stats: { [key: string]: unknown } = {};
    Object.entries(statFunctions).forEach(([key, fn]) => {
      stats[key] = fn(entities);
    });
    return stats;
  }, [entities, statFunctions]);
};

/**
 * Hook: Gestion des actions (save, delete, archive)
 * Unifie les callbacks pour tous les managers
 */
export const useEntityActions = <T extends { id: string }>(callbacks: {
  onSave: (entity: T) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onArchive?: (id: string, archived: boolean) => Promise<void> | void;
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSave = useCallback(
    async (entity: T) => {
      setIsSaving(true);
      try {
        await callbacks.onSave(entity);
      } finally {
        setIsSaving(false);
      }
    },
    [callbacks]
  );

  const confirmDelete = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await callbacks.onDelete(id);
        setDeleteConfirmId(null);
      } finally {
        setIsDeleting(false);
      }
    },
    [callbacks]
  );

  const handleArchive = useCallback(
    async (id: string, archived: boolean) => {
      if (callbacks.onArchive) {
        await callbacks.onArchive(id, archived);
      }
    },
    [callbacks]
  );

  return {
    isSaving,
    isDeleting,
    deleteConfirmId,
    setDeleteConfirmId,
    handleSave,
    handleDelete,
    confirmDelete,
    handleArchive,
  };
};
