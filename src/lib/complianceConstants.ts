/**
 * Constantes Réglementaires - Micro-entreprise Française
 * Ce fichier centralise tous les taux et seuils officiels.
 *
 * NOTE 2026 : Les taux pour 2026 sont confirmés par la Loi de Finances.
 * Les taux de cotisations sociales ont été ajustés pour refléter la hausse
 * progressive des taux BNC/Libéral prévue pour 2024-2026.
 */

// Taux de cotisations sociales (URSSAF)
export const SOCIAL_RATES = {
  "2025": {
    SALE: 12.3,
    SERVICE_BIC: 21.1,
    SERVICE_BNC: 23.1,
    LIBERAL: 23.1,
  },
  "2026": {
    SALE: 12.3,
    SERVICE_BIC: 21.2,
    SERVICE_BNC: 23.2,
    LIBERAL: 23.2,
  },
} as const;

// Taux ACRE (Exonération partielle 50% la première année)
export const ACRE_RATES = {
  SALE: 6.2,
  SERVICE_BIC: 10.6,
  SERVICE_BNC: 12.1,
  LIBERAL: 12.1,
} as const;

// Taux du Prélèvement Forfaitaire Libératoire (PFL)
export const TAX_PFL_RATES = {
  SALE: 1.0,
  SERVICE_BIC: 1.7,
  SERVICE_BNC: 2.2,
  LIBERAL: 2.2,
} as const;

// Seuils de Chiffre d'Affaires
export const THRESHOLDS = {
  "2025": {
    MICRO: { SALE: 188700, SERVICE: 77700 },
    TVA_FRANCHISE: { SALE: 91900, SERVICE: 36800 },
    TVA_TOLERANCE: { SALE: 101000, SERVICE: 39100 },
  },
  "2026": {
    MICRO: { SALE: 188700, SERVICE: 77700 },
    TVA_FRANCHISE: { SALE: 91900, SERVICE: 36800 },
    TVA_TOLERANCE: { SALE: 101000, SERVICE: 39100 },
  },
} as const;

/**
 * Fonction utilitaire pour récupérer les taux selon l'année
 */
export function getRatesForYear(year: number) {
  if (year >= 2026) return SOCIAL_RATES["2026"];
  return SOCIAL_RATES["2025"];
}

/**
 * Fonction utilitaire pour récupérer les seuils selon l'année
 */
export function getThresholdsForYear(year: number) {
  if (year >= 2026) return THRESHOLDS["2026"];
  return THRESHOLDS["2025"];
}
