/**
 * Moteur de calcul des cotisations sociales - Micro-entreprise 2026
 * Sources : URSSAF / Service-Public.fr
 */

import type { ActivityType, UserProfile } from '../types';

export interface SocialContributions {
  rate: number;
  amount: number;
  netRevenue: number;
  isAcreApplied: boolean;
}

// Taux de cotisations standard 2026 (estimations basées sur la trajectoire 2024-2026)
const STANDARD_RATES = {
  SALE: 12.3,           // Vente de marchandises (BIC)
  SERVICE_BIC: 21.2,    // Prestations de services artisanales/commerciales (BIC)
  SERVICE_BNC: 23.2,    // Prestations de services libérales (BNC)
  LIBERAL: 23.2,        // Professions libérales réglementées (BNC)
};

// Taux ACRE (exonération partielle pour la première année)
const ACRE_RATES = {
  SALE: 6.2,
  SERVICE_BIC: 10.6,
  SERVICE_BNC: 12.1,
  LIBERAL: 12.1,
};

/**
 * Calcule les cotisations sociales pour un chiffre d'affaires donné
 * @param revenue Chiffre d'affaires brut (TTC ou HT selon franchise)
 * @param profile Profil de l'utilisateur (pour ACRE et type d'activité)
 */
export const calculateSocialContributions = (
  revenue: number,
  profile: UserProfile
): SocialContributions => {
  const type = profile.activityType || 'SERVICE_BNC';
  const isAcre = profile.isAcreBeneficiary || false;

  const rate = isAcre ? ACRE_RATES[type] : STANDARD_RATES[type];
  const amount = (revenue * rate) / 100;
  const netRevenue = revenue - amount;

  return {
    rate,
    amount,
    netRevenue,
    isAcreApplied: isAcre,
  };
};

/**
 * Calcule l'Impôt sur le Revenu (Prélèvement Forfaitaire Libératoire)
 * Optionnel selon le revenu fiscal de référence
 */
export const calculateIncomeTaxPFL = (
  revenue: number,
  type: ActivityType
): number => {
  const taxRates = {
    SALE: 1.0,
    SERVICE_BIC: 1.7,
    SERVICE_BNC: 2.2,
    LIBERAL: 2.2,
  };
  
  return (revenue * taxRates[type]) / 100;
};

/**
 * Seuils de Chiffre d'Affaires 2026 (Projections basées sur 2025)
 */
export const THRESHOLDS_2026 = {
  MICRO: {
    SALE: 188700,
    SERVICE: 77700,
  },
  TVA_FRANCHISE: {
    SALE: 91900,
    SERVICE: 36800,
  },
  TVA_TOLERANCE: {
    SALE: 101000,
    SERVICE: 39100,
  }
};

/**
 * Détermine le seuil applicable selon le type d'activité
 */
export const getThresholds = (type: ActivityType) => {
  const isSale = type === 'SALE';
  return {
    micro: isSale ? THRESHOLDS_2026.MICRO.SALE : THRESHOLDS_2026.MICRO.SERVICE,
    tva: isSale ? THRESHOLDS_2026.TVA_FRANCHISE.SALE : THRESHOLDS_2026.TVA_FRANCHISE.SERVICE,
    tvaTolerance: isSale ? THRESHOLDS_2026.TVA_TOLERANCE.SALE : THRESHOLDS_2026.TVA_TOLERANCE.SERVICE,
  };
};

/**
 * Calcule l'état par rapport aux seuils
 */
export const calculateThresholdStatus = (
  currentRevenue: number,
  type: ActivityType
) => {
  const thresholds = getThresholds(type);
  
  return {
    micro: {
      current: currentRevenue,
      limit: thresholds.micro,
      remaining: Math.max(0, thresholds.micro - currentRevenue),
      percentage: (currentRevenue / thresholds.micro) * 100,
      isExceeded: currentRevenue > thresholds.micro,
    },
    tva: {
      current: currentRevenue,
      limit: thresholds.tva,
      tolerance: thresholds.tvaTolerance,
      remaining: Math.max(0, thresholds.tva - currentRevenue),
      percentage: (currentRevenue / thresholds.tva) * 100,
      isExceeded: currentRevenue > thresholds.tva,
      isNear: currentRevenue > thresholds.tva * 0.9 && currentRevenue <= thresholds.tva,
    }
  };
};
