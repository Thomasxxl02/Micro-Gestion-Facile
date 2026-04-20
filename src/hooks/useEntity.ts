import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// useEntityForm<T>
// ---------------------------------------------------------------------------

interface EntityFormState<T> {
  formData: T | null;
  isEditing: boolean;
  editingId: string | undefined;
  isPanelOpen: boolean;
  openCreate: () => void;
  openEdit: (_entity: T & { id: string }) => void;
  closePanel: () => void;
}

export function useEntityForm<T>(): EntityFormState<T> {
  const [formData, setFormData] = useState<T | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const openCreate = () => {
    setFormData(null);
    setIsEditing(false);
    setEditingId(undefined);
    setIsPanelOpen(true);
  };

  const openEdit = (entity: T & { id: string }) => {
    setFormData(entity);
    setIsEditing(true);
    setEditingId(entity.id);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setFormData(null);
    setIsEditing(false);
    setEditingId(undefined);
    setIsPanelOpen(false);
  };

  return {
    formData,
    isEditing,
    editingId,
    isPanelOpen,
    openCreate,
    openEdit,
    closePanel,
  };
}

// ---------------------------------------------------------------------------
// useEntityFilters<T>
// ---------------------------------------------------------------------------

interface UseEntityFiltersOptions {
  searchField: string;
  hasArchive?: boolean;
  archiveField?: string;
}

interface EntityFiltersState<T> {
  filteredEntities: T[];
  searchTerm: string;
  setSearchTerm: (_term: string) => void;
  showArchived: boolean;
  setShowArchived: (_show: boolean) => void;
}

export function useEntityFilters<T extends Record<string, unknown>>(
  entities: T[],
  options: UseEntityFiltersOptions,
): EntityFiltersState<T> {
  const {
    searchField,
    hasArchive = false,
    archiveField = "archived",
  } = options;
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filteredEntities = useMemo(() => {
    let result = entities;

    if (hasArchive) {
      result = result.filter((e) =>
        showArchived ? e[archiveField] === true : e[archiveField] !== true,
      );
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((e) => {
        const val = e[searchField];
        return typeof val === "string" && val.toLowerCase().includes(lower);
      });
    }

    return result;
  }, [
    entities,
    searchField,
    hasArchive,
    archiveField,
    searchTerm,
    showArchived,
  ]);

  return {
    filteredEntities,
    searchTerm,
    setSearchTerm,
    showArchived,
    setShowArchived,
  };
}
