/**
 * useMixedActivityDetection
 *
 * Détection automatique des activités mixtes (Vente + Service) pour les
 * micro-entrepreneurs déclarés en profil SERVICE uniquement.
 *
 * Règle fiscale — URSSAF 2026 (art. L.613-7 CSS + circulaire URSSAF n°2022-017) :
 *   • Plafond GLOBAL  (Ventes + Services) : 188 700 €
 *   • Plafond SERVICES dans le global    :  77 700 €
 *   • Cotisations calculées séparément   :  12,3 % sur Vente / 23,2 % sur Service
 *
 * Déclenchement :
 *   Quand un profil SERVICE_BNC / SERVICE_BIC / LIBERAL possède des factures
 *   avec operationCategory = "BIENS" ou "MIXTE" sur l'année en cours.
 */

import Decimal from "decimal.js";
import { useCallback, useMemo } from "react";
import {
  calculateMixedActivityContributions,
  calculateMixedThresholdStatus,
} from "../lib/fiscalCalculations";
import type { ActivityType } from "../types/common";
import type { Invoice, UserProfile } from "../types";

/** Clé localStorage : mémorise le refus par année calendaire */
const DISMISS_KEY = "mgf_mixed_activity_dismissed_year";

/** Types d'activité considérés comme « service pur » (sans Vente) */
const SERVICE_ONLY_TYPES: ActivityType[] = [
  "SERVICE_BNC",
  "SERVICE_BIC",
  "LIBERAL",
];

// ─── Types exportés ──────────────────────────────────────────────────────────

/**
 * Ventilation détaillée du CA annuel entre Ventes et Services,
 * avec cotisations et état des plafonds micro-entreprise.
 */
export interface MixedRevenueVentilation {
  /** CA catégorisé « Ventes de marchandises » pour l'année (€) */
  saleRevenue: number;
  /** CA catégorisé « Prestations de services » pour l'année (€) */
  serviceRevenue: number;
  /** CA total de l'année en cours = saleRevenue + serviceRevenue (€) */
  totalRevenue: number;

  /** Cotisations URSSAF calculées sur la part vente (taux : 12,3 %) */
  saleContributions: number;
  /** Cotisations URSSAF calculées sur la part service (taux : 23,2 % BNC) */
  serviceContributions: number;
  /** Total cotisations = saleContributions + serviceContributions (€) */
  totalContributions: number;

  /**
   * Plafond micro-entreprise global (188 700 €, proraté si activité < 1 an).
   * Les deux activités cumulées ne doivent pas le dépasser.
   */
  globalLimit: number;
  /**
   * Plafond micro-entreprise services (77 700 €, proraté).
   * La seule part "services" ne doit pas le dépasser.
   */
  serviceLimit: number;

  /** Utilisation du plafond global : de 0 à 100 (peut dépasser 100 si dépassé) */
  globalUsagePercent: number;
  /** Utilisation du plafond services : de 0 à 100 (peut dépasser 100 si dépassé) */
  serviceUsagePercent: number;

  /** true si CA global > 80 % du plafond global */
  isGlobalNearLimit: boolean;
  /** true si CA services > 80 % du plafond services */
  isServiceNearLimit: boolean;
  /** true si au moins un des deux plafonds micro est dépassé */
  isAnyLimitExceeded: boolean;
}

export interface UseMixedActivityDetectionResult {
  /** true : des factures "Vente" existent alors que le profil est « service pur » */
  isMixedDetected: boolean;
  /** true : la bannière de suggestion doit être affichée */
  shouldShowSuggestion: boolean;
  /** Détail de la ventilation CA + cotisations pour l'année courante */
  ventilation: MixedRevenueVentilation | null;
  /** Masque la suggestion pour l'année en cours (persisté en localStorage) */
  dismiss: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Détecte automatiquement une activité mixte à partir des factures existantes.
 *
 * @param invoices      - Toutes les factures de l'utilisateur
 * @param userProfile   - Profil fiscal actif
 * @param referenceDate - Date de référence (défaut : today) — utile en tests
 */
export function useMixedActivityDetection(
  invoices: Invoice[],
  userProfile: UserProfile,
  referenceDate: Date = new Date(),
): UseMixedActivityDetectionResult {
  const currentYear = referenceDate.getFullYear();

  // ─── Ventilation CA ────────────────────────────────────────────────────────
  const ventilation = useMemo((): MixedRevenueVentilation | null => {
    // Factures émises (hors brouillons et annulées) sur l'année de référence
    const activeInvoices = invoices.filter((inv) => {
      if (inv.type !== "invoice") return false;
      if (inv.status === "Annulée" || inv.status === "Brouillon") return false;
      return new Date(inv.date).getFullYear() === currentYear;
    });

    if (activeInvoices.length === 0) return null;

    let saleRevenue = new Decimal(0);
    let serviceRevenue = new Decimal(0);

    for (const inv of activeInvoices) {
      const amount = new Decimal(inv.total);

      switch (inv.operationCategory) {
        case "BIENS":
          saleRevenue = saleRevenue.plus(amount);
          break;

        case "MIXTE":
          // Répartition 50/50 par défaut pour les factures catégorisées "Mixte".
          // Approche conservative : les deux plafonds sont sollicités.
          saleRevenue = saleRevenue.plus(amount.dividedBy(2));
          serviceRevenue = serviceRevenue.plus(amount.dividedBy(2));
          break;

        default:
          // "SERVICES" ou undefined → tout va en services (hypothèse safe)
          serviceRevenue = serviceRevenue.plus(amount);
      }
    }

    const sale = saleRevenue.toDecimalPlaces(2).toNumber();
    const service = serviceRevenue.toDecimalPlaces(2).toNumber();

    // Sans CA « Vente », pas d'activité mixte à signaler
    if (sale === 0) return null;

    const mixed = calculateMixedActivityContributions(
      sale,
      service,
      userProfile,
      referenceDate,
    );
    const status = calculateMixedThresholdStatus(
      sale,
      service,
      userProfile,
      referenceDate,
    );

    return {
      saleRevenue: sale,
      serviceRevenue: service,
      totalRevenue: status.totalRevenue,
      saleContributions: mixed.sale.amount,
      serviceContributions: mixed.service.amount,
      totalContributions: mixed.totalAmount,
      globalLimit: status.global.limit,
      serviceLimit: status.service.limit,
      globalUsagePercent: Math.min(
        100,
        (status.totalRevenue / status.global.limit) * 100,
      ),
      serviceUsagePercent:
        service > 0 ? Math.min(100, (service / status.service.limit) * 100) : 0,
      isGlobalNearLimit: status.totalRevenue > status.global.limit * 0.8,
      isServiceNearLimit: service > status.service.limit * 0.8,
      isAnyLimitExceeded: status.isMicroExceeded,
    };
  }, [invoices, currentYear, userProfile, referenceDate]);

  const isMixedDetected = ventilation !== null;

  // ─── État « ignoré » (localStorage, réinitialisé chaque année) ─────────────
  const isDismissed = useMemo(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === String(currentYear);
    } catch {
      return false;
    }
  }, [currentYear]);

  /**
   * La suggestion s'affiche quand :
   *   1. Du CA « Vente » a été détecté dans les factures
   *   2. Le profil est déclaré « service pur »
   *   3. Le profil n'a pas déjà activé le mode mixte
   *   4. L'utilisateur n'a pas ignoré pour cette année
   */
  const shouldShowSuggestion =
    isMixedDetected &&
    SERVICE_ONLY_TYPES.includes(userProfile.activityType ?? "SERVICE_BNC") &&
    !userProfile.isMixedActivity &&
    !isDismissed;

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(currentYear));
    } catch {
      // Ignore : localStorage peut être indisponible (tests, navigation privée stricte)
    }
  }, [currentYear]);

  return { isMixedDetected, shouldShowSuggestion, ventilation, dismiss };
}
