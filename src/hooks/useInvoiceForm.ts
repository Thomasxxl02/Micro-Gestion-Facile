/**
 * Hook useInvoiceForm
 * ✅ Gestion centralisée du formulaire de création/édition d'invoice
 * ✅ Validation dynamique avec réactions
 * ✅ États du formulaire séparés de la logique UI
 *
 * Usage:
 * ```tsx
 * const form = useInvoiceForm({ initialData: invoice });
 * form.setItem(0, { ...item, quantity: 5 });
 * form.removeItem(1);
 * form.toggleItemSelection(2);
 * ```
 */

import { useCallback, useMemo, useState } from 'react';
import { InvoiceStatus, type DocumentType, type Invoice, type InvoiceItem } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceFormState {
  // Données principales
  type: DocumentType;
  clientId: string;
  date: string;
  dueDate: string;

  // Articles
  items: InvoiceItem[];

  // Montants
  discount: number;
  shipping: number;
  deposit: number;

  // Métadonnées
  notes?: string;
  linkedDocumentId?: string;
  taxExempt?: boolean;

  // E-Invoicing 2026
  eInvoiceFormat?: 'Factur-X' | 'UBL' | 'CII';
  operationCategory?: 'BIENS' | 'SERVICES' | 'MIXTE';

  // Statut
  status?: (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
}

export interface UseInvoiceFormOptions {
  initialData?: Partial<Invoice>;
}

export interface UseInvoiceFormReturn {
  // État
  formData: InvoiceFormState;

  // Données du formulaire
  setFormData: (data: Partial<InvoiceFormState>) => void;
  reset: () => void;

  // Gestion des articles
  addItem: (item?: Partial<InvoiceItem>) => void;
  removeItem: (index: number) => void;
  setItem: (index: number, item: InvoiceItem) => void;
  updateItem: (index: number, updates: Partial<InvoiceItem>) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;

  // États de sélection
  selectedItemIndices: Set<number>;
  toggleItemSelection: (index: number) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;

  // Validations
  isValid: boolean;
  errors: Record<string, string>;

  // Computed
  itemsCount: number;
  hasItems: boolean;
  isDraft: boolean;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const defaultFormState: InvoiceFormState = {
  type: 'invoice',
  clientId: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: [],
  discount: 0,
  shipping: 0,
  deposit: 0,
  notes: '',
  taxExempt: false,
  eInvoiceFormat: 'Factur-X',
  operationCategory: 'SERVICES',
  status: InvoiceStatus.DRAFT,
};

// ============================================================================
// HOOK
// ============================================================================

export function useInvoiceForm(options?: UseInvoiceFormOptions): UseInvoiceFormReturn {
  const initialData = options?.initialData;

  const initialState: InvoiceFormState = useMemo(
    () => ({
      ...defaultFormState,
      ...initialData,
      status:
        (initialData?.status as (typeof InvoiceStatus)[keyof typeof InvoiceStatus]) ||
        InvoiceStatus.DRAFT,
    }),
    [initialData]
  );

  const [formData, setFormDataState] = useState<InvoiceFormState>(initialState);
  const [selectedItemIndices, setSelectedItemIndices] = useState<Set<number>>(new Set());

  // ========================================
  // ÉTAT DU FORMULAIRE
  // ========================================

  const setFormData = useCallback((data: Partial<InvoiceFormState>) => {
    setFormDataState((prev) => ({ ...prev, ...data }));
  }, []);

  const reset = useCallback(() => {
    setFormDataState(initialState);
    setSelectedItemIndices(new Set());
  }, [initialState]);

  // ========================================
  // GESTION DES ARTICLES
  // ========================================

  const addItem = useCallback((item?: Partial<InvoiceItem>) => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: '',
      vatRate: 20,
      ...item,
    };

    setFormDataState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setFormDataState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

    // Nettoyer la sélection
    setSelectedItemIndices((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  const setItem = useCallback((index: number, item: InvoiceItem) => {
    setFormDataState((prev) => {
      const newItems = [...prev.items];
      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  }, []);

  const updateItem = useCallback((index: number, updates: Partial<InvoiceItem>) => {
    setFormDataState((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setFormDataState((prev) => {
      const newItems = [...prev.items];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      return { ...prev, items: newItems };
    });
  }, []);

  // ========================================
  // SÉLECTION D'ARTICLES
  // ========================================

  const toggleItemSelection = useCallback((index: number) => {
    setSelectedItemIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    const indices = new Set<number>();
    formData.items.forEach((_, i) => indices.add(i));
    setSelectedItemIndices(indices);
  }, [formData.items]);

  const deselectAllItems = useCallback(() => {
    setSelectedItemIndices(new Set());
  }, []);

  // ========================================
  // VALIDATIONS
  // ========================================

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!formData.clientId) {
      errs.clientId = 'Client requis';
    }

    if (formData.items.length === 0) {
      errs.items = 'Au moins un article requis';
    }

    formData.items.forEach((item, idx) => {
      if (!item.description) {
        errs[`items.${idx}.description`] = 'Description requise';
      }
      if (item.quantity <= 0) {
        errs[`items.${idx}.quantity`] = 'Quantité > 0';
      }
      if (item.unitPrice < 0) {
        errs[`items.${idx}.unitPrice`] = 'Prix >= 0';
      }
    });

    if (!formData.date) {
      errs.date = 'Date requise';
    }

    if (!formData.dueDate) {
      errs.dueDate = 'Échéance requise';
    }

    if (formData.discount < 0 || formData.discount > 100) {
      errs.discount = 'Remise entre 0 et 100%';
    }

    if (formData.shipping < 0) {
      errs.shipping = 'Frais >= 0';
    }

    if (formData.deposit < 0) {
      errs.deposit = 'Acompte >= 0';
    }

    return errs;
  }, [formData]);

  const isValid = Object.keys(errors).length === 0;

  // ========================================
  // COMPUTED PROPERTIES
  // ========================================

  const itemsCount = formData.items.length;
  const hasItems = itemsCount > 0;
  const isDraft = formData.status === InvoiceStatus.DRAFT;

  // ========================================
  // RETURN
  // ========================================

  return {
    // État
    formData,

    // Données du formulaire
    setFormData,
    reset,

    // Articles
    addItem,
    removeItem,
    setItem,
    updateItem,
    moveItem,

    // Sélection
    selectedItemIndices,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,

    // Validations
    isValid,
    errors,

    // Computed
    itemsCount,
    hasItems,
    isDraft,
  };
}
