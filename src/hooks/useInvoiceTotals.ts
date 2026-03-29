/**
 * Hook useInvoiceTotals
 * ✅ Calcule réactivement les totaux d'une facture
 * ✅ Source unique de vérité pour les montants
 * ✅ Utilise calculateFullInvoiceTotals() comme logique métier
 *
 * Usage:
 * ```tsx
 * const totals = useInvoiceTotals(invoice, userProfile);
 * console.log(totals.total, totals.vatAmount, totals.balanceDue);
 * ```
 */

import { useMemo } from 'react';
import { calculateFullInvoiceTotals, type InvoiceTotalsResult } from '../lib/invoiceCalculations';
import type { Invoice, UserProfile } from '../types';

/**
 * Hook pour calculer les totaux d'une facture
 * @param invoice - La facture à calculer
 * @param userProfile - Profil utilisateur (taux TVA par défaut)
 * @returns Totaux calculés (HT, TVA, TTC, acompte, solde)
 */
export function useInvoiceTotals(invoice: Invoice, userProfile: UserProfile): InvoiceTotalsResult {
  return useMemo(() => {
    return calculateFullInvoiceTotals({
      items: invoice.items || [],
      taxExempt: invoice.taxExempt || false,
      discount: invoice.discount || 0,
      shipping: invoice.shipping || 0,
      deposit: invoice.deposit || 0,
      defaultVatRate: userProfile.defaultVatRate || 0,
    });
  }, [
    invoice.items,
    invoice.taxExempt,
    invoice.discount,
    invoice.shipping,
    invoice.deposit,
    userProfile.defaultVatRate,
  ]);
}
