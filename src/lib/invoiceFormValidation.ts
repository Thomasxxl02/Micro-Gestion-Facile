/**
 * Module invoiceFormValidation
 * ✅ Toutes les règles de validation pour factures/devis/{commandes}
 * ✅ Testable indépendamment, réutilisable
 * ✅ Source unique de vérité pour les règles métier
 *
 * Usage:
 * ```tsx
 * const errors = validateInvoiceForm(formData);
 * const itemErrors = validateInvoiceItem(item);
 * if (!isFormValid(errors)) alert('Formulaire invalide');
 * ```
 */

import type { InvoiceFormState } from '../hooks/useInvoiceForm';
import type { InvoiceItem } from '../types';

/** Erreurs de validation pour un champ */
export type ValidationError = string | null;

/** Toutes les erreurs du formulaire */
export interface FormValidationErrors {
  clientId?: ValidationError;
  date?: ValidationError;
  dueDate?: ValidationError;
  items?: ValidationError;
  discount?: ValidationError;
  shipping?: ValidationError;
  deposit?: ValidationError;
  itemErrors?: Record<string, ValidationError>; // Par ID d'item
}

/** Résultat de validation */
export interface ValidationResult {
  errors: FormValidationErrors;
  isValid: boolean;
  hasFieldErrors: boolean;
  errorCount: number;
}

/**
 * Valide un article individuel
 * @param item - L'article à valider
 * @returns Message d'erreur ou null si valide
 */
export function validateInvoiceItem(item: InvoiceItem): ValidationError {
  // Description obligatoire
  if (!item.description?.trim()) {
    return "La description de l'article est obligatoire";
  }

  // Quantité > 0
  if (!item.quantity || item.quantity <= 0) {
    return 'La quantité doit être supérieure à 0';
  }

  // Prix unitaire >= 0
  if (item.unitPrice === undefined || item.unitPrice < 0) {
    return 'Le prix unitaire doit être positif';
  }

  return null;
}

/**
 * Valide un pourcentage de remise
 * @param discount - Pourcentage de remise (0-100)
 * @returns Message d'erreur ou null si valide
 */
export function validateDiscount(discount?: number): ValidationError {
  if (discount !== undefined && discount !== null) {
    if (discount < 0 || discount > 100) {
      return 'La remise doit être entre 0 et 100%';
    }
  }
  return null;
}

/**
 * Valide les frais de port
 * @param shipping - Montant des frais de port
 * @returns Message d'erreur ou null si valide
 */
export function validateShipping(shipping?: number): ValidationError {
  if (shipping !== undefined && shipping !== null) {
    if (shipping < 0) {
      return 'Les frais de port ne peuvent pas être négatifs';
    }
  }
  return null;
}

/**
 * Valide l'acompte
 * @param deposit - Montant de l'acompte
 * @param total - Total TTC du document
 * @returns Message d'erreur ou null si valide
 */
export function validateDeposit(deposit?: number, total?: number): ValidationError {
  if (deposit !== undefined && deposit !== null) {
    if (deposit < 0) {
      return "L'acompte ne peut pas être négatif";
    }
    if (total && deposit > total) {
      return "L'acompte ne peut pas dépasser le total";
    }
  }
  return null;
}

/**
 * Valide une date (non vide et format YYYY-MM-DD)
 * @param date - Date au format YYYY-MM-DD
 * @param fieldName - Nom du champ pour le message d'erreur
 * @returns Message d'erreur ou null si valide
 */
export function validateDate(date?: string, fieldName = 'Date'): ValidationError {
  if (!date?.trim()) {
    return `${fieldName} est obligatoire`;
  }

  // Validation format ISO 8601 (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${fieldName} doit être au format YYYY-MM-DD`;
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} invalide`;
  }

  return null;
}

/**
 * Valide les dates d'émission et d'échéance
 * @param emissionDate - Date d'émission
 * @param dueDate - Date d'échéance
 * @returns Erreurs ou null si valides
 */
export function validateDateRange(emissionDate?: string, dueDate?: string) {
  const emissionError = validateDate(emissionDate, "Date d'émission");
  const dueError = validateDate(dueDate, "Date d'échéance");

  if (emissionError || dueError) {
    return { emissionDate: emissionError, dueDate: dueError };
  }

  if (emissionDate && dueDate) {
    const emission = new Date(emissionDate);
    const due = new Date(dueDate);
    if (due < emission) {
      return {
        dueDate: "La date d'échéance doit être après la date d'émission",
      };
    }
  }

  return null;
}

/**
 * Valide le formulaire complet de facture
 * @param formData - Données du formulaire
 * @returns Résultat de validation avec erreurs et flag isValid
 */
export function validateInvoiceForm(formData: InvoiceFormState): ValidationResult {
  const errors: FormValidationErrors = {};
  let errorCount = 0;

  // ===== Validations obligatoires =====

  // 1. Client obligatoire
  if (!formData.clientId?.trim()) {
    errors.clientId = 'Veuillez sélectionner un client';
    errorCount++;
  }

  // 2. Au moins un article
  if (!formData.items || formData.items.length === 0) {
    errors.items = 'Vous devez ajouter au moins un article';
    errorCount++;
  } else {
    // 3. Valider chaque article
    const itemErrorsMap: Record<string, ValidationError> = {};
    errors.itemErrors = itemErrorsMap;
    let hasItemErrors = false;

    formData.items.forEach((item) => {
      const itemError = validateInvoiceItem(item);
      if (itemError) {
        itemErrorsMap[item.id] = itemError;
        errorCount++;
        hasItemErrors = true;
      }
    });

    if (!hasItemErrors) {
      delete errors.itemErrors;
    }
  }

  // 4. Dates
  const dateErrors = validateDateRange(formData.date, formData.dueDate);
  if (dateErrors) {
    Object.assign(errors, dateErrors);
    errorCount += Object.values(dateErrors).filter(Boolean).length;
  }

  // ===== Validations optionnelles =====

  // 5. Remise (0-100%)
  const discountError = validateDiscount(formData.discount);
  if (discountError) {
    errors.discount = discountError;
    errorCount++;
  }

  // 6. Frais de port
  const shippingError = validateShipping(formData.shipping);
  if (shippingError) {
    errors.shipping = shippingError;
    errorCount++;
  }

  // 7. Acompte (not validated against total here - depends on calculated total)
  const depositError = validateDeposit(formData.deposit);
  if (depositError) {
    errors.deposit = depositError;
    errorCount++;
  }

  const isValid = errorCount === 0;
  const hasFieldErrors = errorCount > 0;

  return {
    errors,
    isValid,
    hasFieldErrors,
    errorCount,
  };
}

/**
 * Retourne true si le formulaire est valide (helper pour templates)
 * @param formData - Données du formulaire
 * @returns true si valide, false sinon
 */
export function isValidInvoiceForm(formData: InvoiceFormState): boolean {
  return validateInvoiceForm(formData).isValid;
}

/**
 * Retourne les messages d'erreur pour un item spécifique
 * @param itemId - ID de l'article
 * @param errors - Résultat de validation
 * @returns Message d'erreur ou null
 */
export function getItemError(itemId: string, errors: FormValidationErrors): ValidationError {
  if (!errors.itemErrors) {
    return null;
  }
  return errors.itemErrors[itemId] ?? null;
}

/**
 * Helper pour compter les erreurs d'articles
 * @param errors - Résultat de validation
 * @returns Nombre d'articles avec erreurs
 */
export function getItemErrorCount(errors: FormValidationErrors): number {
  if (!errors.itemErrors) {
    return 0;
  }
  return Object.values(errors.itemErrors).filter((e) => e !== null).length;
}
