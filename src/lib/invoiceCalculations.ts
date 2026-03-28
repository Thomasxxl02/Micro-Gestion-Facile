import Decimal from 'decimal.js';
import type { Invoice, InvoiceItem } from '../types';

/**
 * Module de calculs de factures pour micro-entrepreneurs français
 * Conformité fiscale 2026 (URSSAF, TVA, IR)
 *
 * Références légales:
 * - Code Général des Impôts (CGI)
 * - Circulaires URSSAF 2025-2026
 * - Loi de Finances 2026
 */

// ============================================================================
// TYPES
// ============================================================================

/** Type pour les montants acceptant plusieurs formats */
export type NumericInput = number | string | Decimal;

/** Type pour les types d'activité de micro-entrepreneur */
export type BusinessType = 'SERVICES' | 'SALES' | 'CRAFTS';

export interface TaxCalculationInput {
  /** Montant HT en euros */
  amountHT: NumericInput;
  /** Taux de TVA en % (0, 5.5, 10, 20) */
  taxRate: number;
  /** Montant de cotisations sociales (optionnel) */
  socialContribution?: NumericInput;
}

export interface InvoiceCalculationResult {
  /** Montant HT */
  amountHT: Decimal;
  /** Montant de TVA */
  tva: Decimal;
  /** Montant TTC */
  amountTTC: Decimal;
  /** Taux de TVA appliqué */
  taxRate: number;
}

export interface MicroEntrepreneurTaxResult {
  /** Chiffre d'affaires */
  revenue: Decimal;
  /** Impôt sur le revenu (micro-fiscal) */
  incomeTax: Decimal;
  /** Cotisations sociales obligatoires */
  socialContributions: Decimal;
  /** Montant net après charges */
  netIncome: Decimal;
  /** Est dépassement du seuil micro? */
  exceedsThreshold: boolean;
  /** Montant du dépassement (0 si dans limites) */
  excessAmount: Decimal;
}

// ============================================================================
// CONSTANTES FISCALES 2026
// ============================================================================

/** Plafonds de chiffre d'affaires pour micro-entreprise */
export const MICRO_THRESHOLDS = {
  // Prestation de services commerciales, libérales, gestion privée
  SERVICES: 77_700,
  // Vente de marchandises
  SALES: 311_900,
} as const;

/** Taux d'IR appliqué au forfait avec régime micro */
export const MICRO_INCOME_TAX_RATE = 0.22; // 22% du CA

/** Taux de cotisations sociales applicables */
export const SOCIAL_CONTRIBUTION_RATES = {
  SERVICES: 0.232, // Prestataires libéraux: ~23.2%
  SALES: 0.125, // Commerçants: ~12.5%
  CRAFTS: 0.248, // Artisans: ~24.8%
} as const;

/** Taux de TVA applicables en France métropolitaine */
export const VAT_RATES = {
  NORMAL: 20, // Régime normal
  REDUCED: 5.5, // Fournitures/restauration
  REDUCED_LOW: 2.1, // Médicaments, journaux
  EXEMPT: 0, // Services financiers, louages immobiliers
} as const;

// ============================================================================
// CALCULS DE TVA
// ============================================================================

export interface InvoiceTotalsInput {
  items: InvoiceItem[];
  taxExempt: boolean;
  discount?: number;
  shipping?: number;
  deposit?: number;
  defaultVatRate: number;
}

export interface InvoiceTotalsResult {
  subtotalHT: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  balanceDue: number;
}

/**
 * Calcule les totaux complets d'une facture
 * Source unique de vérité pour les calculs d'affichage et d'enregistrement
 */
export function calculateFullInvoiceTotals(input: InvoiceTotalsInput): InvoiceTotalsResult {
  const { items, taxExempt, discount = 0, shipping = 0, deposit = 0, defaultVatRate } = input;

  // Initialisation avec Decimal pour la précision financière
  let subtotalHT = new Decimal(0);
  let vatAmount = new Decimal(0);

  // 1. Calcul du sous-total HT
  items.forEach((item) => {
    const itemTotal = new Decimal(item.quantity).times(new Decimal(item.unitPrice));
    subtotalHT = subtotalHT.plus(itemTotal);
  });

  // 2. Calcul des remises
  const discountRate = new Decimal(discount).dividedBy(100);
  const discountAmount = subtotalHT.times(discountRate);
  const subtotalAfterDiscount = subtotalHT.minus(discountAmount);

  // 3. Calcul de la TVA
  if (!taxExempt) {
    items.forEach((item) => {
      const itemTotal = new Decimal(item.quantity).times(new Decimal(item.unitPrice));
      const itemDiscount = itemTotal.times(discountRate);
      const itemAfterDiscount = itemTotal.minus(itemDiscount);

      const rate = new Decimal(item.vatRate ?? defaultVatRate).dividedBy(100);
      vatAmount = vatAmount.plus(itemAfterDiscount.times(rate));
    });

    // TVA sur les frais de port (au taux par défaut)
    if (shipping > 0) {
      const shippingVat = new Decimal(shipping).times(new Decimal(defaultVatRate).dividedBy(100));
      vatAmount = vatAmount.plus(shippingVat);
    }
  }

  // 4. Totaux finaux
  const totalTTC = subtotalAfterDiscount.plus(new Decimal(shipping)).plus(vatAmount);
  const balanceDue = Decimal.max(0, totalTTC.minus(new Decimal(deposit)));

  return {
    subtotalHT: subtotalHT.toNumber(),
    discountAmount: discountAmount.toDecimalPlaces(2).toNumber(),
    vatAmount: vatAmount.toDecimalPlaces(2).toNumber(),
    total: totalTTC.toDecimalPlaces(2).toNumber(),
    balanceDue: balanceDue.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Calcule le montant de TVA et le montant TTC
 *
 * @param input - Données d'entrée (montant HT et taux TVA)
 * @returns Résultats détaillés du calcul
 */
export function calculateInvoiceTax(input: TaxCalculationInput): InvoiceCalculationResult {
  const amountHT = new Decimal(input.amountHT);
  const taxRate = input.taxRate;

  // Validation
  if (amountHT.isNegative()) {
    throw new Error('Le montant HT ne peut pas être négatif');
  }

  if (!Object.values(VAT_RATES).includes(taxRate as 0 | 20 | 5.5 | 2.1)) {
    throw new Error(
      `Taux de TVA invalide: ${taxRate}. Taux acceptés: ${Object.values(VAT_RATES).join(', ')}`
    );
  }

  // Calcul TVA: TVA = Montant HT × (Taux / 100)
  const tvaAmount = amountHT.times(new Decimal(taxRate).dividedBy(100));

  // Montant TTC = HT + TVA
  const amountTTC = amountHT.plus(tvaAmount);

  return {
    amountHT,
    tva: tvaAmount.toDecimalPlaces(2),
    amountTTC: amountTTC.toDecimalPlaces(2),
    taxRate,
  };
}

/**
 * Calcule le montant HT à partir du montant TTC (inverse)
 *
 * @param ttc - Montant TTC
 * @param taxRate - Taux de TVA
 * @returns Montant HT arrondi à 2 décimales
 */
export function calculateHTFromTTC(ttc: NumericInput, taxRate: number): Decimal {
  const ttcAmount = new Decimal(ttc);

  if (ttcAmount.isNegative()) {
    throw new Error('Le montant TTC ne peut pas être négatif');
  }

  // HT = TTC / (1 + Taux/100)
  const divisor = new Decimal(1).plus(new Decimal(taxRate).dividedBy(100));
  return ttcAmount.dividedBy(divisor).toDecimalPlaces(2);
}

// ============================================================================
// CALCULS DE CHARGES SOCIALES & FISCALES
// ============================================================================

/**
 * Calcule les charges pour un micro-entrepreneur
 * Conformité: Art. L. 133-6-8 du Code de la Sécurité Sociale
 *
 * @param revenue - Chiffre d'affaires
 * @param businessType - Type d'activité (SERVICES, SALES, CRAFTS)
 * @returns Résultats fiscaux et sociaux
 */
export function calculateMicroEntrepreneurCharges(
  revenue: NumericInput,
  businessType: BusinessType = 'SERVICES'
): MicroEntrepreneurTaxResult {
  const revenueDecimal = new Decimal(revenue);

  if (revenueDecimal.isNegative()) {
    throw new Error("Le chiffre d'affaires ne peut pas être négatif");
  }

  // Déterminer le seuil applicable
  const threshold = businessType === 'SALES' ? MICRO_THRESHOLDS.SALES : MICRO_THRESHOLDS.SERVICES;

  // Vérifier si dépassement
  const exceedsThreshold = revenueDecimal.greaterThan(threshold);
  const excessAmount = exceedsThreshold ? revenueDecimal.minus(threshold) : new Decimal(0);

  // Cotisations sociales = CA × Taux
  const socialRate = new Decimal(SOCIAL_CONTRIBUTION_RATES[businessType]);
  const socialContributions = revenueDecimal.times(socialRate).toDecimalPlaces(2);

  // Impôt sur le revenu (forfait) = CA × 22%
  const incomeTax = revenueDecimal.times(new Decimal(MICRO_INCOME_TAX_RATE)).toDecimalPlaces(2);

  // Revenu net = CA - Cotisations - IR
  const netIncome = revenueDecimal.minus(socialContributions).minus(incomeTax).toDecimalPlaces(2);

  return {
    revenue: revenueDecimal.toDecimalPlaces(2),
    incomeTax,
    socialContributions,
    netIncome,
    exceedsThreshold,
    excessAmount: excessAmount.toDecimalPlaces(2),
  };
}

// ============================================================================
// CALCULS DE FACTURE COMPLÈTE
// ============================================================================

/**
 * Calcule tous les éléments d'une facture:
 * - Montants HT/TTC
 * - TVA
 * - Cotisations facultatives
 *
 * @param params - Montant HT, taux TVA, et cotisations optionnelles
 * @returns Objet avec tous les montants détaillés
 */
export function calculateFullInvoice(params: {
  amountHT: NumericInput;
  taxRate: number;
  includeContributions?: boolean;
  businessType?: BusinessType;
}) {
  const taxResult = calculateInvoiceTax({
    amountHT: params.amountHT,
    taxRate: params.taxRate,
  });

  const chargeResult = params.includeContributions
    ? calculateMicroEntrepreneurCharges(taxResult.amountTTC, params.businessType || 'SERVICES')
    : null;

  return {
    ...taxResult,
    charges: chargeResult,
  };
}

// ============================================================================
// CALCULS DE REMISE / RABAIS
// ============================================================================

/**
 * Applique une remise au montant HT
 *
 * @param amountHT - Montant HT original
 * @param discountPercent - Pourcentage de remise (0-100)
 * @returns Montant après remise
 */
export function applyDiscount(amountHT: NumericInput, discountPercent: number): Decimal {
  const amount = new Decimal(amountHT);
  const discount = new Decimal(discountPercent);

  if (discount.isNegative() || discount.greaterThan(100)) {
    throw new Error('Le pourcentage de remise doit être entre 0 et 100');
  }

  return amount.times(new Decimal(1).minus(discount.dividedBy(100))).toDecimalPlaces(2);
}

/**
 * Applique une remise fixe au montant HT
 *
 * @param amountHT - Montant HT original
 * @param fixedDiscount - Montant de remise fixe
 * @returns Montant après remise
 */
export function applyFixedDiscount(amountHT: NumericInput, fixedDiscount: NumericInput): Decimal {
  const amount = new Decimal(amountHT);
  const discount = new Decimal(fixedDiscount);

  if (discount.isNegative()) {
    throw new Error('Le montant de remise ne peut pas être négatif');
  }

  if (discount.greaterThan(amount)) {
    throw new Error('La remise ne peut pas dépasser le montant HT');
  }

  return amount.minus(discount).toDecimalPlaces(2);
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Formate un montant en euros avec 2 décimales
 *
 * @param amount - Montant à formater
 * @param locale - Code locale (défaut: fr-FR)
 * @returns Chaîne formatée
 */
export function formatCurrency(amount: NumericInput, _locale: string = 'fr-FR'): string {
  const decimal = new Decimal(amount);
  return decimal.toFixed(2) + ' €';
}

/**
 * Arrondit un montant à 2 décimales (règle bancaire)
 *
 * @param amount - Montant à arrondir
 * @returns Montant arrondi
 */
export function roundToCents(amount: NumericInput): Decimal {
  return new Decimal(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Vérifie si un montant est dans les seuils micro-entrepreneur
 *
 * @param revenue - Chiffre d'affaires
 * @param businessType - Type d'activité
 * @returns true si dans les seuils, false sinon
 */
export function isWithinMicroThreshold(
  revenue: NumericInput,
  businessType: BusinessType = 'SERVICES'
): boolean {
  const revenueDecimal = new Decimal(revenue);
  const threshold = businessType === 'SALES' ? MICRO_THRESHOLDS.SALES : MICRO_THRESHOLDS.SERVICES;

  return revenueDecimal.lessThanOrEqualTo(threshold);
}

// ============================================================================
// CALCULS PAR ARTICLE (ITEMS)
// ============================================================================

export interface ItemCalculationResult {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

/**
 * Calcule le montant TVA et le total TTC pour un article
 *
 * @param item - Article avec quantité, prix, taux TVA
 * @param discountPercent - Remise globale à appliquer (optionnel)
 * @returns Détails du calcul pour cet article
 */
export function calculateItemVAT(
  item: {
    unitPrice: number;
    quantity: number;
    vatRate: number;
  },
  discountPercent: number = 0
): ItemCalculationResult {
  const unitPrice = new Decimal(item.unitPrice);
  const quantity = new Decimal(item.quantity);
  const vatRate = new Decimal(item.vatRate);

  // Sous-total HT
  const subtotal = unitPrice.times(quantity).toDecimalPlaces(2);

  // Appliquer la remise (si fournie)
  const discountRate = new Decimal(discountPercent).dividedBy(100);
  const discountAmount = subtotal.times(discountRate).toDecimalPlaces(2);
  const subtotalAfterDiscount = subtotal.minus(discountAmount).toDecimalPlaces(2);

  // TVA
  const vatAmount = subtotalAfterDiscount.times(vatRate.dividedBy(100)).toDecimalPlaces(2);

  // Total TTC
  const total = subtotalAfterDiscount.plus(vatAmount).toDecimalPlaces(2);

  return {
    unitPrice: unitPrice.toNumber(),
    quantity: quantity.toNumber(),
    subtotal: subtotal.toNumber(),
    discountAmount: discountAmount.toNumber(),
    subtotalAfterDiscount: subtotalAfterDiscount.toNumber(),
    vatRate: item.vatRate,
    vatAmount: vatAmount.toNumber(),
    total: total.toNumber(),
  };
}

// ============================================================================
// FORMATAGE POUR EXPORT/PDF
// ============================================================================


export interface FormattedInvoiceForPDF {
  number: string;
  date: string;
  dueDate: string;
  total: string;
  vatAmount: string;
  balanceDue: string;
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }>;
}

/**
 * Formate une facture pour l'export PDF
 * Convertit tous les montants en chaînes formatées en euros
 *
 * @param invoice - Facture à formater
 * @param totals - Totaux calculés (option alternative à recalcul)
 * @returns Facture formatée pour le PDF
 */
export function formatInvoiceForPDF(
  invoice: Invoice,
  totals?: InvoiceTotalsResult
): FormattedInvoiceForPDF {
  // Recalculer les totaux si non fournis
  const calculatedTotals =
    totals ||
    calculateFullInvoiceTotals({
      items: invoice.items,
      taxExempt: invoice.taxExempt || false,
      discount: invoice.discount || 0,
      shipping: invoice.shipping || 0,
      deposit: invoice.deposit || 0,
      defaultVatRate: 20, // Default VAT rate (passed via userProfile context)
    });

  return {
    number: invoice.number,
    date: new Date(invoice.date).toLocaleDateString('fr-FR'),
    dueDate: new Date(invoice.dueDate).toLocaleDateString('fr-FR'),
    total: formatCurrency(calculatedTotals.total),
    vatAmount: formatCurrency(calculatedTotals.vatAmount),
    balanceDue: formatCurrency(calculatedTotals.balanceDue),
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: `${item.quantity} ${item.unit || ''}`.trim(),
      unitPrice: formatCurrency(item.unitPrice),
      total: formatCurrency(item.quantity * item.unitPrice),
    })),
  };
}
