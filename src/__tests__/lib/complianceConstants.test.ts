/**
 * Tests — src/lib/complianceConstants.ts
 */
import { describe, expect, it } from "vitest";
import {
  getRatesForYear,
  getThresholdsForYear,
  SOCIAL_RATES,
  ACRE_RATES,
  TAX_PFL_RATES,
  THRESHOLDS,
} from "../../lib/complianceConstants";

describe("complianceConstants", () => {
  describe("getRatesForYear", () => {
    it("retourne les taux 2025 pour l'année 2025", () => {
      const rates = getRatesForYear(2025);
      expect(rates).toEqual(SOCIAL_RATES["2025"]);
    });

    it("retourne les taux 2026 pour l'année 2026", () => {
      const rates = getRatesForYear(2026);
      expect(rates).toEqual(SOCIAL_RATES["2026"]);
    });

    it("retourne les taux 2026 pour les années supérieures à 2026", () => {
      const rates = getRatesForYear(2030);
      expect(rates).toEqual(SOCIAL_RATES["2026"]);
    });

    it("retourne les taux 2025 pour les années antérieures à 2026", () => {
      const rates = getRatesForYear(2024);
      expect(rates).toEqual(SOCIAL_RATES["2025"]);
    });

    it("les taux 2026 sont différents des taux 2025 pour SERVICE_BIC", () => {
      expect(SOCIAL_RATES["2026"].SERVICE_BIC).not.toBe(SOCIAL_RATES["2025"].SERVICE_BIC);
    });
  });

  describe("getThresholdsForYear", () => {
    it("retourne les seuils 2025 pour l'année 2025", () => {
      const thresholds = getThresholdsForYear(2025);
      expect(thresholds).toEqual(THRESHOLDS["2025"]);
    });

    it("retourne les seuils 2026 pour l'année 2026", () => {
      const thresholds = getThresholdsForYear(2026);
      expect(thresholds).toEqual(THRESHOLDS["2026"]);
    });

    it("retourne les seuils 2026 pour les années supérieures à 2026", () => {
      const thresholds = getThresholdsForYear(2030);
      expect(thresholds).toEqual(THRESHOLDS["2026"]);
    });

    it("retourne les seuils 2025 pour les années antérieures", () => {
      const thresholds = getThresholdsForYear(2023);
      expect(thresholds).toEqual(THRESHOLDS["2025"]);
    });
  });

  describe("constants shape", () => {
    it("SOCIAL_RATES contient les 4 types d'activité pour chaque année", () => {
      for (const year of ["2025", "2026"] as const) {
        expect(SOCIAL_RATES[year]).toHaveProperty("SALE");
        expect(SOCIAL_RATES[year]).toHaveProperty("SERVICE_BIC");
        expect(SOCIAL_RATES[year]).toHaveProperty("SERVICE_BNC");
        expect(SOCIAL_RATES[year]).toHaveProperty("LIBERAL");
      }
    });

    it("ACRE_RATES contient les 4 types d'activité", () => {
      expect(ACRE_RATES).toHaveProperty("SALE");
      expect(ACRE_RATES).toHaveProperty("SERVICE_BIC");
      expect(ACRE_RATES).toHaveProperty("SERVICE_BNC");
      expect(ACRE_RATES).toHaveProperty("LIBERAL");
    });

    it("TAX_PFL_RATES contient les 4 types d'activité", () => {
      expect(TAX_PFL_RATES).toHaveProperty("SALE");
      expect(TAX_PFL_RATES).toHaveProperty("SERVICE_BIC");
      expect(TAX_PFL_RATES).toHaveProperty("SERVICE_BNC");
      expect(TAX_PFL_RATES).toHaveProperty("LIBERAL");
    });

    it("THRESHOLDS contient MICRO et TVA_FRANCHISE pour SALE et SERVICE", () => {
      for (const year of ["2025", "2026"] as const) {
        expect(THRESHOLDS[year].MICRO).toHaveProperty("SALE");
        expect(THRESHOLDS[year].MICRO).toHaveProperty("SERVICE");
        expect(THRESHOLDS[year].TVA_FRANCHISE).toHaveProperty("SALE");
        expect(THRESHOLDS[year].TVA_FRANCHISE).toHaveProperty("SERVICE");
      }
    });

    it("les taux ACRE sont inférieurs aux taux pleins", () => {
      expect(ACRE_RATES.SERVICE_BNC).toBeLessThan(SOCIAL_RATES["2025"].SERVICE_BNC);
      expect(ACRE_RATES.SALE).toBeLessThan(SOCIAL_RATES["2025"].SALE);
    });
  });
});
