/**
 * Moteur de calcul des cotisations sociales - Micro-entreprise 2026
 * Sources : URSSAF / Service-Public.fr
 */

import Decimal from "decimal.js";
import type { ActivityType, UserProfile } from "../types";
import { 
  ACRE_RATES, 
  TAX_PFL_RATES, 
  getRatesForYear, 
  getThresholdsForYear 
} from "./complianceConstants";

export interface SocialContributions {
  rate: number;
  amount: number;
  netRevenue: number;
  isAcreApplied: boolean;
}

/**
 * Durée d'exonération ACRE : 12 mois calendaires à compter de la date de début
 * d'activité (art. L.5141-1 du Code du Travail).
 *
 * @param profile Profil utilisateur
 * @param referenceDate Date de référence pour le calcul (défaut : aujourd'hui)
 * @returns true si l'ACRE est encore applicable à la date de référence
 */
export const isAcreActive = (
  profile: UserProfile,
  referenceDate: Date = new Date(),
): boolean => {
  if (!profile.isAcreBeneficiary) return false;
  if (!profile.businessStartDate) {
    // Aucune date de démarrage renseignée → on applique le bénéfice par défaut
    // (dégradé safe : l'utilisateur devrait renseigner la date)
    return true;
  }
  const start = new Date(profile.businessStartDate);
  // Date d'expiration = 12 mois après la date de début
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + 12);
  return referenceDate < expiry;
};

/**
 * Calcule les cotisations sociales pour un chiffre d'affaires donné
 * @param revenue Chiffre d'affaires brut (TTC ou HT selon franchise)
 * @param profile Profil de l'utilisateur (pour ACRE et type d'activité)
 * @param referenceDate Date de référence (défaut : aujourd'hui) — utile pour les tests
 */
export const calculateSocialContributions = (
  revenue: number,
  profile: UserProfile,
  referenceDate: Date = new Date(),
): SocialContributions => {
  const type = profile.activityType ?? "SERVICE_BNC";
  const isAcre = isAcreActive(profile, referenceDate);
  const year = referenceDate.getFullYear();

  // On utilise les taux via le module de conformité
  const rates = getRatesForYear(year);

  // Taux personnalisé dans le profil (ex. taux négocié ou correction manuelle).
  // Priorité sur les constantes réglementaires pour permettre la souplesse UX.
  let rate: number;
  if (
    profile.socialContributionRate !== undefined &&
    profile.socialContributionRate > 0
  ) {
    rate = profile.socialContributionRate;
  } else {
    rate = isAcre ? ACRE_RATES[type] : rates[type];
  }

  const revenueD = new Decimal(revenue);
  const amount = revenueD
    .times(new Decimal(rate))
    .dividedBy(100)
    .toDecimalPlaces(2);
  const netRevenue = revenueD.minus(amount).toDecimalPlaces(2);

  return {
    rate,
    amount: amount.toNumber(),
    netRevenue: netRevenue.toNumber(),
    isAcreApplied: isAcre,
  };
};

/**
 * Calcule l'Impôt sur le Revenu (Prélèvement Forfaitaire Libératoire)
 * Optionnel selon le revenu fiscal de référence
 */
export const calculateIncomeTaxPFL = (
  revenue: number,
  type: ActivityType,
): number => {
  return new Decimal(revenue)
    .times(new Decimal(TAX_PFL_RATES[type]))
    .dividedBy(100)
    .toDecimalPlaces(2)
    .toNumber();
};

/**
 * Détermine le seuil applicable selon le type d'activité et la date
 */
export const getThresholds = (
  type: ActivityType,
  referenceDate: Date = new Date(),
) => {
  const isSale = type === "SALE";
  const year = referenceDate.getFullYear();

  // On utilise les seuils via le module de conformité
  const thresholds = getThresholdsForYear(year);

  return {
    micro: isSale ? thresholds.MICRO.SALE : thresholds.MICRO.SERVICE,
    tva: isSale
      ? thresholds.TVA_FRANCHISE.SALE
      : thresholds.TVA_FRANCHISE.SERVICE,
    tvaTolerance: isSale
      ? thresholds.TVA_TOLERANCE.SALE
      : thresholds.TVA_TOLERANCE.SERVICE,
  };
};

/**
 * Calcule les cotisations pour une activité mixte (Vente + Service)
 */
export const calculateMixedActivityContributions = (
  saleRevenue: number,
  serviceRevenue: number,
  profile: UserProfile,
  referenceDate: Date = new Date(),
) => {
  const saleResult = calculateSocialContributions(
    saleRevenue,
    { ...profile, activityType: "SALE" },
    referenceDate,
  );
  const serviceResult = calculateSocialContributions(
    serviceRevenue,
    { ...profile, activityType: "SERVICE_BNC" }, // Par défaut BNC pour mixte
    referenceDate,
  );

  return {
    sale: saleResult,
    service: serviceResult,
    totalAmount: new Decimal(saleResult.amount)
      .plus(serviceResult.amount)
      .toNumber(),
    totalNetRevenue: new Decimal(saleResult.netRevenue)
      .plus(serviceResult.netRevenue)
      .toNumber(),
  };
};

/**
 * Calcule l'état par rapport aux seuils pour une activité mixte
 */
export const calculateMixedThresholdStatus = (
  saleRevenue: number,
  serviceRevenue: number,
  profile: UserProfile,
  referenceDate: Date = new Date(),
) => {
  const thresholdsSale = getThresholds("SALE", referenceDate);
  const thresholdsService = getThresholds("SERVICE_BNC", referenceDate);

  const totalRevenue = new Decimal(saleRevenue).plus(serviceRevenue).toNumber();

  // En activité mixte, le CA global ne doit pas dépasser le seuil SALE,
  // ET le CA SERVICE ne doit pas dépasser le seuil SERVICE.
  const isGlobalMicroExceeded = totalRevenue > thresholdsSale.micro;
  const isServiceMicroExceeded = serviceRevenue > thresholdsService.micro;

  const isGlobalTvaExceeded = totalRevenue > thresholdsSale.tva;
  const isServiceTvaExceeded = serviceRevenue > thresholdsService.tva;

  return {
    totalRevenue,
    isMicroExceeded: isGlobalMicroExceeded || isServiceMicroExceeded,
    isTvaExceeded: isGlobalTvaExceeded || isServiceTvaExceeded,
    global: {
      current: totalRevenue,
      limit: thresholdsSale.micro,
    },
    service: {
      current: serviceRevenue,
      limit: thresholdsService.micro,
    },
  };
};

/**
 * Calcule l'état par rapport aux seuils
 */
export const calculateThresholdStatus = (
  currentRevenue: number,
  profile: UserProfile,
  referenceDate: Date = new Date(),
) => {
  const type = profile.activityType ?? "SERVICE_BNC";
  const thresholds = getThresholds(type, referenceDate);

  // Pourcentages d'alerte personnalisés (fallback sur 80/90%)
  const vatAlertPercent = profile.customVatThresholdPercentage ?? 80;
  const revAlertPercent = profile.customRevenueThresholdPercentage ?? 90;

  return {
    micro: {
      current: currentRevenue,
      limit: thresholds.micro,
      remaining: Math.max(0, thresholds.micro - currentRevenue),
      percentage: (currentRevenue / thresholds.micro) * 100,
      isExceeded: currentRevenue > thresholds.micro,
      isNear:
        currentRevenue > (thresholds.micro * revAlertPercent) / 100 &&
        currentRevenue <= thresholds.micro,
    },
    tva: {
      current: currentRevenue,
      limit: thresholds.tva,
      tolerance: thresholds.tvaTolerance,
      remaining: Math.max(0, thresholds.tva - currentRevenue),
      percentage: (currentRevenue / thresholds.tva) * 100,
      isExceeded: currentRevenue > thresholds.tva,
      isNear:
        currentRevenue > (thresholds.tva * vatAlertPercent) / 100 &&
        currentRevenue <= thresholds.tva,
    },
  };
};
