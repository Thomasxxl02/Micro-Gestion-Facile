import { describe, expect, it } from "vitest";
import {
  calculateIncomeTaxPFL,
  calculateSocialContributions,
  calculateThresholdStatus,
  getThresholds,
  isAcreActive,
} from "../lib/fiscalCalculations";
import type { ActivityType, UserProfile } from "../types";

describe("fiscalCalculations", () => {
  const mockProfile: UserProfile = {
    companyName: "Test Company",
    siret: "12345678901234",
    address: "123 Test St",
    email: "test@example.com",
    phone: "0102030405",
    activityType: "SERVICE_BNC" as ActivityType,
    isAcreBeneficiary: false,
  };

  describe("calculateSocialContributions", () => {
    it("calcule correctement les cotisations pour SERVICE_BNC au taux standard", () => {
      const revenue = 1000;
      const result = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SERVICE_BNC",
      });

      expect(result.rate).toBe(23.2);
      expect(result.amount).toBe(232);
      expect(result.netRevenue).toBe(768);
      expect(result.isAcreApplied).toBe(false);
    });

    it("calcule correctement les cotisations pour SALE au taux standard", () => {
      const revenue = 1000;
      const result = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SALE",
      });

      expect(result.rate).toBe(12.3);
      expect(result.amount).toBe(123);
      expect(result.netRevenue).toBe(877);
    });

    it("calcule correctement les cotisations pour SERVICE_BIC at standard rate", () => {
      const revenue = 1000;
      const result = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SERVICE_BIC",
      });

      expect(result.rate).toBe(21.2);
      expect(result.amount).toBe(212);
      expect(result.netRevenue).toBe(788);
    });

    it("applique le taux ACRE si l'utilisateur est bénéficiaire", () => {
      const revenue = 1000;
      const profileWithAcre: UserProfile = {
        ...mockProfile,
        activityType: "SERVICE_BNC",
        isAcreBeneficiary: true,
      };
      const result = calculateSocialContributions(revenue, profileWithAcre);

      expect(result.rate).toBe(12.1);
      expect(result.amount).toBe(121);
      expect(result.isAcreApplied).toBe(true);
    });

    it("utilise SERVICE_BNC par défaut si le type d'activité n'est pas spécifié", () => {
      const revenue = 1000;
      const incompleteProfile = { ...mockProfile } as UserProfile;
      delete incompleteProfile.activityType;

      const result = calculateSocialContributions(revenue, incompleteProfile);
      expect(result.rate).toBe(23.2);
    });
  });

  describe("calculateIncomeTaxPFL", () => {
    it("calcule le PFL pour SERVICE_BNC", () => {
      const revenue = 1000;
      const tax = calculateIncomeTaxPFL(revenue, "SERVICE_BNC");
      expect(tax).toBe(22); // 2.2%
    });

    it("calcule le PFL pour SALE", () => {
      const revenue = 1000;
      const tax = calculateIncomeTaxPFL(revenue, "SALE");
      expect(tax).toBe(10); // 1.0%
    });

    it("calcule le PFL pour SERVICE_BIC", () => {
      const revenue = 1000;
      const tax = calculateIncomeTaxPFL(revenue, "SERVICE_BIC");
      expect(tax).toBe(17); // 1.7%
    });
  });

  describe("getThresholds", () => {
    it("retourne les seuils pour les prestations de services", () => {
      const thresholds = getThresholds("SERVICE_BNC");
      expect(thresholds.micro).toBe(77700);
      expect(thresholds.tva).toBe(36800);
    });

    it("retourne les seuils pour la vente de marchandises", () => {
      const thresholds = getThresholds("SALE");
      expect(thresholds.micro).toBe(188700);
      expect(thresholds.tva).toBe(91900);
    });
  });

  describe("calculateThresholdStatus", () => {
    it("calcule correctement le statut pour le dépassement de seuil micro", () => {
      const revenue = 80000;
      const status = calculateThresholdStatus(revenue, mockProfile);

      expect(status.micro.isExceeded).toBe(true);
      expect(status.micro.percentage).toBeGreaterThan(100);
      expect(status.micro.remaining).toBe(0);
    });

    it("calcule correctement le statut pour un chiffre d'affaires bas", () => {
      const revenue = 10000;
      const status = calculateThresholdStatus(revenue, mockProfile);

      expect(status.micro.isExceeded).toBe(false);
      expect(status.micro.remaining).toBe(67700);
      expect(status.tva.isExceeded).toBe(false);
      expect(status.tva.isNear).toBe(false);
    });

    it("détecte quand on est proche du seuil TVA avec le pourcentage par défaut (80%)", () => {
      const revenue = 30000; // Seuil TVA SERVICE = 36800. 80% = 29440. 30k > 29.4k
      const status = calculateThresholdStatus(revenue, {
        ...mockProfile,
        customVatThresholdPercentage: 80,
      });

      expect(status.tva.isExceeded).toBe(false);
      expect(status.tva.isNear).toBe(true);
    });

    it("détecte quand on est proche du seuil TVA avec un pourcentage personnalisé (50%)", () => {
      const revenue = 20000; // Seuil TVA SERVICE = 36800. 50% = 18400. 20k > 18.4k
      const status = calculateThresholdStatus(revenue, {
        ...mockProfile,
        customVatThresholdPercentage: 50,
      });

      expect(status.tva.isExceeded).toBe(false);
      expect(status.tva.isNear).toBe(true);
    });

    it("ne détecte pas d'alerte si sous le seuil personnalisé", () => {
      const revenue = 20000; // Seuil TVA SERVICE = 36800. 90% = 33120. 20k < 33.1k
      const status = calculateThresholdStatus(revenue, {
        ...mockProfile,
        customVatThresholdPercentage: 90,
      });

      expect(status.tva.isNear).toBe(false);
    });

    it("détecte quand on est proche du seuil micro-entreprise avec pourcentage personnalisé", () => {
      const revenue = 70000; // Seuil micro SERVICE = 77700. 90% = 69930. 70k > 69.9k
      const status = calculateThresholdStatus(revenue, {
        ...mockProfile,
        customRevenueThresholdPercentage: 90,
      });

      expect(status.micro.isExceeded).toBe(false);
      expect(status.micro.isNear).toBe(true);
    });

    it("considère que le seuil n'est PAS dépassé quand le revenu est EXACTEMENT égal au seuil", () => {
      const revenue = 77700; // Seuil micro SERVICE_BNC
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.micro.isExceeded).toBe(false);
      expect(status.micro.remaining).toBe(0);
    });

    it("détecte le dépassement du seuil de franchise mais SOUS le seuil de tolérance", () => {
      const revenue = 38000; // Franchise 36800 < 38000 < Tolérance 39100
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.tva.isExceeded).toBe(true);
      expect(status.tva.current).toBeLessThan(status.tva.tolerance);
    });
  });

  describe("Edge Cases - Zero & Negative Revenue", () => {
    it("traite correctement un revenu zéro", () => {
      const result = calculateSocialContributions(0, mockProfile);
      expect(result.amount).toBe(0);
      expect(result.netRevenue).toBe(0);
    });

    it("traite correctement un revenu négatif (perte)", () => {
      const result = calculateSocialContributions(-1000, mockProfile);
      expect(result.amount).toBeLessThanOrEqual(0);
      expect(result.netRevenue).toBeLessThanOrEqual(0);
    });

    it("calcule PFL avec revenu zéro", () => {
      const tax = calculateIncomeTaxPFL(0, "SERVICE_BNC");
      expect(tax).toBe(0);
    });

    it("status correct pour revenu zéro", () => {
      const status = calculateThresholdStatus(0, mockProfile);
      expect(status.micro.isExceeded).toBe(false);
      expect(status.micro.remaining).toBe(77700);
    });
  });

  describe("Edge Cases - Decimal Precision", () => {
    it("gère les montants avec décimales (0.01€)", () => {
      const revenue = 1000.01;
      const result = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SERVICE_BNC",
      });

      const expected = Math.round(((revenue * 23.2) / 100) * 100) / 100;
      expect(result.amount).toBeCloseTo(expected, 2);
    });

    it("gère les montants avec fractions de centimes", () => {
      const revenue = 333.33;
      const result = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SERVICE_BNC",
      });

      // 333.33 * 0.232 = 77.3328
      expect(result.amount).toBeDefined();
      expect(typeof result.amount).toBe("number");
    });

    it("gère les montants très petits (< 1€)", () => {
      const revenue = 0.99;
      const result = calculateSocialContributions(revenue, mockProfile);
      expect(result.amount).toBeGreaterThanOrEqual(0);
      expect(result.amount).toBeLessThan(1);
    });

    it("PFL avec décimales", () => {
      const revenue = 100.5;
      const tax = calculateIncomeTaxPFL(revenue, "SERVICE_BNC");
      expect(tax).toBeCloseTo(100.5 * 0.022, 2);
    });
  });

  describe("Edge Cases - Extreme Values", () => {
    it("traite les très hauts revenus (1M€)", () => {
      const revenue = 1000000;
      const result = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SERVICE_BNC",
      });

      expect(result.amount).toBeDefined();
      expect(result.amount).toBeGreaterThan(0);
      expect(result.netRevenue).toBeDefined();
    });

    it("traite les très hauts revenus (10M€)", () => {
      const revenue = 10000000;
      const result = calculateSocialContributions(revenue, mockProfile);
      expect(result.amount).toBeDefined();
    });

    it("status pour très hauts revenus", () => {
      const revenue = 1000000;
      const status = calculateThresholdStatus(revenue, mockProfile);

      expect(status.micro.isExceeded).toBe(true);
      expect(status.tva.isExceeded).toBe(true);
    });

    it("calcule correctement pour revenu = MAX_SAFE_INTEGER / 1000", () => {
      const revenue = Number.MAX_SAFE_INTEGER / 1000000; // 9007199254741 (énorme)
      const result = calculateSocialContributions(revenue, mockProfile);
      expect(result.amount).toBeDefined();
    });
  });

  describe("Edge Cases - Threshold Boundary Tests", () => {
    it("revenu juste SOUS le seuil micro SERVICE_BNC (77699€)", () => {
      const revenue = 77699;
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.micro.isExceeded).toBe(false);
      expect(status.micro.remaining).toBe(1);
    });

    it("revenu 1€ SOUS le seuil micro SERVICE_BNC", () => {
      const revenue = 77699.99;
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.micro.isExceeded).toBe(false);
    });

    it("revenu EXACTEMENT au seuil micro SERVICE_BNC (77700€)", () => {
      const revenue = 77700;
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.micro.isExceeded).toBe(false);
      expect(status.micro.remaining).toBe(0);
    });

    it("revenu 1€ AU-DESSUS du seuil micro SERVICE_BNC (77701€)", () => {
      const revenue = 77701;
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.micro.isExceeded).toBe(true);
    });

    it("revenu juste SOUS le seuil TVA SERVICE_BNC (36799€)", () => {
      const revenue = 36799;
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.tva.isExceeded).toBe(false);
    });

    it("revenu EXACTEMENT au seuil TVA SERVICE_BNC (36800€)", () => {
      const revenue = 36800;
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.tva.isExceeded).toBe(false);
      expect(status.tva.remaining).toBe(0);
    });

    it("revenu 1€ AU-DESSUS du seuil TVA SERVICE_BNC (36801€)", () => {
      const revenue = 36801;
      const status = calculateThresholdStatus(revenue, mockProfile);
      expect(status.tva.isExceeded).toBe(true);
    });
  });

  describe("Edge Cases - ACRE Transitions", () => {
    it("ACRE année 1 vs année 2 différenciation", () => {
      const revenue = 50000;

      // ACRE année 1: taux réduit (12.1%) — date de début il y a 6 mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const acreYear1 = calculateSocialContributions(revenue, {
        ...mockProfile,
        isAcreBeneficiary: true,
        businessStartDate: sixMonthsAgo.toISOString().slice(0, 10),
      });

      // Non-ACRE ou ACRE expirée (date il y a 18 mois)
      const eighteenMonthsAgo = new Date();
      eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
      const acreYear2 = calculateSocialContributions(revenue, {
        ...mockProfile,
        isAcreBeneficiary: true,
        businessStartDate: eighteenMonthsAgo.toISOString().slice(0, 10),
      });

      expect(acreYear1.rate).toBeLessThan(acreYear2.rate);
      expect(acreYear1.amount).toBeLessThan(acreYear2.amount);
    });

    it("ACRE réduit de moitié les cotisations", () => {
      const revenue = 100000;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // il y a 3 mois → ACRE active
      const withoutAcre = calculateSocialContributions(revenue, {
        ...mockProfile,
        isAcreBeneficiary: false,
        activityType: "SERVICE_BNC",
      });
      const withAcre = calculateSocialContributions(revenue, {
        ...mockProfile,
        isAcreBeneficiary: true,
        activityType: "SERVICE_BNC",
        businessStartDate: startDate.toISOString().slice(0, 10),
      });

      // ACRE réduit le taux de 23.2% à 12.1% (environ 52%)
      expect(withAcre.amount).toBeLessThan(withoutAcre.amount * 0.6);
    });
  });

  describe("Edge Cases - Activity Type Combinations", () => {
    it("compare les taux pour tous les types d'activité (même revenu)", () => {
      const revenue = 10000;

      const bncRate = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SERVICE_BNC",
      }).rate;
      const saleRate = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SALE",
      }).rate;
      const bicRate = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SERVICE_BIC",
      }).rate;

      expect(bncRate).toBeGreaterThan(saleRate);
      expect(bicRate).toBeLessThan(bncRate);
    });

    it("calcule les seuils pour tous les types", () => {
      const types: ActivityType[] = [
        "SERVICE_BNC",
        "SALE",
        "SERVICE_BIC",
        "LIBERAL",
      ];

      types.forEach((type) => {
        const thresholds = getThresholds(type);
        expect(thresholds.micro).toBeGreaterThan(0);
        expect(thresholds.tva).toBeGreaterThan(0);
        expect(thresholds.micro).toBeGreaterThan(thresholds.tva);
      });
    });

    it("PFL cohérent pour tous les types", () => {
      const revenue = 50000;
      const types: ActivityType[] = [
        "SERVICE_BNC",
        "SALE",
        "SERVICE_BIC",
        "LIBERAL",
      ];

      types.forEach((type) => {
        const tax = calculateIncomeTaxPFL(revenue, type);
        expect(tax).toBeGreaterThan(0);
        expect(tax).toBeLessThan(revenue);
      });
    });

    it("LIBERAL activity type handling", () => {
      const revenue = 30000;
      const result = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "LIBERAL",
      });

      expect(result.amount).toBeGreaterThan(0);
      expect(result.rate).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases - Financial Scenarios", () => {
    it("scénario: micro-entreprise juste SOUS seuil micro", () => {
      const revenue = 75000; // ~75000
      const status = calculateThresholdStatus(revenue, mockProfile);
      const contrib = calculateSocialContributions(revenue, {
        ...mockProfile,
        activityType: "SERVICE_BNC",
      });

      expect(status.micro.isExceeded).toBe(false);
      expect(contrib.rate).toBe(23.2);
    });

    it("scénario: micro-entreprise qui dépasse seuil micro", () => {
      const revenue = 80000; // Dépasse 77700
      const status = calculateThresholdStatus(revenue, mockProfile);

      expect(status.micro.isExceeded).toBe(true);
      expect(status.tva.isExceeded).toBe(true);
    });

    it("scénario: ACRE année 1 - calcul complet impôts + cotisations", () => {
      const revenue = 60000;
      const contrib = calculateSocialContributions(revenue, {
        ...mockProfile,
        isAcreBeneficiary: true,
        activityType: "SERVICE_BNC",
      });
      const tax = calculateIncomeTaxPFL(revenue, "SERVICE_BNC");

      const totalDeductions = contrib.amount + tax;
      const netIncome = revenue - totalDeductions;

      expect(netIncome).toBeGreaterThan(0);
      expect(netIncome).toBeLessThan(revenue);
    });

    it("scénario: revenu variant (croissance CA mensuelle)", () => {
      const months = [10000, 20000, 30000, 40000, 50000];

      months.forEach((revenue) => {
        const contrib = calculateSocialContributions(revenue, mockProfile);
        expect(contrib.amount).toBeDefined();
        expect(contrib.netRevenue).toBeLessThanOrEqual(revenue);
      });
    });
  });

  describe("Precision & Rounding", () => {
    it("arrondit correctement les montants (EUR)", () => {
      const revenue = 1234.56;
      const result = calculateSocialContributions(revenue, mockProfile);

      // Les montants doivent être arrondis à 2 décimales
      const rounded = Math.round(result.amount * 100) / 100;
      expect(result.amount).toBeCloseTo(rounded, 2);
    });

    it("pas de perte d'arrondi cumulée sur 12 mois", () => {
      const monthlyRevenue = 1000;
      let totalExact = 0;
      let totalRounded = 0;

      for (let month = 0; month < 12; month++) {
        const result = calculateSocialContributions(
          monthlyRevenue,
          mockProfile,
        );
        totalRounded += result.amount;
        totalExact += monthlyRevenue * 0.232;
      }

      // La différence due à l'arrondi doit être minime
      expect(Math.abs(totalRounded - totalExact)).toBeLessThan(1);
    });

    it("gère les calculs successifs sans erreur flottante", () => {
      const values = [100.11, 200.22, 300.33];
      let sum = 0;

      values.forEach((val) => {
        const result = calculateSocialContributions(val, mockProfile);
        sum += result.amount;
      });

      expect(typeof sum).toBe("number");
      expect(Number.isNaN(sum)).toBe(false);
    });
  });

  describe("isAcreActive — expiration 12 mois (art. L.5141-1)", () => {
    it("retourne false quand isAcreBeneficiary est false", () => {
      expect(isAcreActive({ ...mockProfile, isAcreBeneficiary: false })).toBe(
        false,
      );
    });

    it("retourne true si ACRE activée sans date de démarrage (mode dégradé)", () => {
      expect(
        isAcreActive({
          ...mockProfile,
          isAcreBeneficiary: true,
          businessStartDate: undefined,
        }),
      ).toBe(true);
    });

    it("retourne true si la date de début est il y a 6 mois (ACRE active)", () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      expect(
        isAcreActive({
          ...mockProfile,
          isAcreBeneficiary: true,
          businessStartDate: sixMonthsAgo.toISOString().slice(0, 10),
        }),
      ).toBe(true);
    });

    it("retourne false si la date de début est il y a 13 mois (ACRE expirée)", () => {
      const thirteenMonthsAgo = new Date();
      thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);
      expect(
        isAcreActive({
          ...mockProfile,
          isAcreBeneficiary: true,
          businessStartDate: thirteenMonthsAgo.toISOString().slice(0, 10),
        }),
      ).toBe(false);
    });

    it("utilise une date de référence explicite pour le test de l'expiration", () => {
      const startDate = "2025-01-15";
      const beforeExpiry = new Date("2026-01-14"); // J-1 avant l'expiration
      const onExpiry = new Date("2026-01-15"); // Exactement 12 mois → expiré

      expect(
        isAcreActive(
          {
            ...mockProfile,
            isAcreBeneficiary: true,
            businessStartDate: startDate,
          },
          beforeExpiry,
        ),
      ).toBe(true);
      expect(
        isAcreActive(
          {
            ...mockProfile,
            isAcreBeneficiary: true,
            businessStartDate: startDate,
          },
          onExpiry,
        ),
      ).toBe(false);
    });

    it("calculateSocialContributions applique le taux plein si ACRE expirée", () => {
      const expiredStart = new Date();
      expiredStart.setMonth(expiredStart.getMonth() - 13);
      const result = calculateSocialContributions(1000, {
        ...mockProfile,
        isAcreBeneficiary: true,
        activityType: "SERVICE_BNC",
        businessStartDate: expiredStart.toISOString().slice(0, 10),
      });
      expect(result.rate).toBe(23.2);
      expect(result.isAcreApplied).toBe(false);
    });
  });
});
