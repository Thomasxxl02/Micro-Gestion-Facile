/**
 * Tests unitaires : useMixedActivityDetection
 *
 * Ce hook est une fonction pure (pas de renderHook nécessaire car il
 * utilise uniquement useMemo/useCallback avec des données stables).
 * On utilise renderHook de @testing-library/react pour l'exécuter dans un
 * environnement React.
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMixedActivityDetection } from "../hooks/useMixedActivityDetection";
import type { Invoice, UserProfile } from "../types";

// ─── Données de test ──────────────────────────────────────────────────────────

const BASE_PROFILE: UserProfile = {
  companyName: "Test SNC",
  siret: "12345678901234",
  address: "1 rue du Test",
  email: "test@example.com",
  phone: "0102030405",
  activityType: "SERVICE_BNC",
  isAcreBeneficiary: false,
};

const REFERENCE_DATE = new Date("2026-06-15T12:00:00");
const CURRENT_YEAR = 2026;

/** Crée une facture valide avec les champs minimalistes nécessaires au hook. */
function makeInvoice(
  overrides: Partial<Invoice> & { total: number },
): Invoice {
  return {
    id: crypto.randomUUID(),
    type: "invoice",
    status: "Payée",
    date: `${CURRENT_YEAR}-03-01`,
    invoiceNumber: "FA-001",
    clientId: "client-1",
    items: [],
    subtotal: overrides.total,
    taxTotal: 0,
    total: overrides.total,
    operationCategory: "SERVICES",
    ...overrides,
  } as Invoice;
}

// ─── Suite principale ─────────────────────────────────────────────────────────

describe("useMixedActivityDetection", () => {
  // Nettoyer le localStorage entre chaque test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Cas de base ────────────────────────────────────────────────────────────

  describe("Détection mixte", () => {
    it("renvoie isMixedDetected=false quand il n'y a aucune facture", () => {
      const { result } = renderHook(() =>
        useMixedActivityDetection([], BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.isMixedDetected).toBe(false);
      expect(result.current.ventilation).toBeNull();
    });

    it("renvoie isMixedDetected=false quand toutes les factures sont des services", () => {
      const invoices = [
        makeInvoice({ total: 5000, operationCategory: "SERVICES" }),
        makeInvoice({ total: 3000, operationCategory: "SERVICES" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.isMixedDetected).toBe(false);
    });

    it("renvoie isMixedDetected=true quand au moins une facture est de type BIENS", () => {
      const invoices = [
        makeInvoice({ total: 3000, operationCategory: "SERVICES" }),
        makeInvoice({ total: 1000, operationCategory: "BIENS" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.isMixedDetected).toBe(true);
    });

    it("renvoie isMixedDetected=true quand une facture est de type MIXTE", () => {
      const invoices = [
        makeInvoice({ total: 4000, operationCategory: "MIXTE" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.isMixedDetected).toBe(true);
    });
  });

  // ── Déclenchement de la suggestion ────────────────────────────────────────

  describe("shouldShowSuggestion", () => {
    const bienInvoice = makeInvoice({
      total: 5000,
      operationCategory: "BIENS",
    });

    it("affiche la suggestion pour un profil SERVICE_BNC avec des factures BIENS", () => {
      const { result } = renderHook(() =>
        useMixedActivityDetection(
          [bienInvoice],
          { ...BASE_PROFILE, activityType: "SERVICE_BNC" },
          REFERENCE_DATE,
        ),
      );
      expect(result.current.shouldShowSuggestion).toBe(true);
    });

    it("affiche la suggestion pour un profil SERVICE_BIC avec des factures BIENS", () => {
      const { result } = renderHook(() =>
        useMixedActivityDetection(
          [bienInvoice],
          { ...BASE_PROFILE, activityType: "SERVICE_BIC" },
          REFERENCE_DATE,
        ),
      );
      expect(result.current.shouldShowSuggestion).toBe(true);
    });

    it("affiche la suggestion pour un profil LIBERAL avec des factures BIENS", () => {
      const { result } = renderHook(() =>
        useMixedActivityDetection(
          [bienInvoice],
          { ...BASE_PROFILE, activityType: "LIBERAL" },
          REFERENCE_DATE,
        ),
      );
      expect(result.current.shouldShowSuggestion).toBe(true);
    });

    it("ne suggère pas si le profil est déjà isMixedActivity=true", () => {
      const { result } = renderHook(() =>
        useMixedActivityDetection(
          [bienInvoice],
          { ...BASE_PROFILE, isMixedActivity: true },
          REFERENCE_DATE,
        ),
      );
      expect(result.current.shouldShowSuggestion).toBe(false);
    });

    it("ne suggère pas si le profil est SALE (déjà commerçant)", () => {
      const { result } = renderHook(() =>
        useMixedActivityDetection(
          [bienInvoice],
          { ...BASE_PROFILE, activityType: "SALE" },
          REFERENCE_DATE,
        ),
      );
      expect(result.current.shouldShowSuggestion).toBe(false);
    });

    it("ne suggère pas si l'utilisateur a déjà ignoré cette année", () => {
      localStorage.setItem(
        "mgf_mixed_activity_dismissed_year",
        String(CURRENT_YEAR),
      );
      const { result } = renderHook(() =>
        useMixedActivityDetection([bienInvoice], BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.shouldShowSuggestion).toBe(false);
    });

    it("re-propose si l'utilisateur avait ignoré l'an dernier (autre année)", () => {
      localStorage.setItem(
        "mgf_mixed_activity_dismissed_year",
        String(CURRENT_YEAR - 1),
      );
      const { result } = renderHook(() =>
        useMixedActivityDetection([bienInvoice], BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.shouldShowSuggestion).toBe(true);
    });
  });

  // ── Filtrages des factures ─────────────────────────────────────────────────

  describe("Filtrage des factures", () => {
    it("ignore les factures annulées", () => {
      const invoices = [
        makeInvoice({
          total: 5000,
          operationCategory: "BIENS",
          status: "Annulée",
        }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.isMixedDetected).toBe(false);
    });

    it("ignore les brouillons", () => {
      const invoices = [
        makeInvoice({
          total: 5000,
          operationCategory: "BIENS",
          status: "Brouillon",
        }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.isMixedDetected).toBe(false);
    });

    it("ignore les factures d'une autre année", () => {
      const invoices = [
        makeInvoice({
          total: 5000,
          operationCategory: "BIENS",
          date: "2025-06-01",
        }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.isMixedDetected).toBe(false);
    });

    it("ignore les documents de type devis (type !== 'invoice')", () => {
      const invoices = [
        makeInvoice({
          total: 5000,
          operationCategory: "BIENS",
          type: "quote" as Invoice["type"],
        }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      expect(result.current.isMixedDetected).toBe(false);
    });
  });

  // ── Calcul de ventilation ─────────────────────────────────────────────────

  describe("Calcul de la ventilation", () => {
    it("calcule correctement la répartition 50/50 d'une facture MIXTE", () => {
      const invoices = [makeInvoice({ total: 2000, operationCategory: "MIXTE" })];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      const v = result.current.ventilation!;
      expect(v.saleRevenue).toBeCloseTo(1000, 2);
      expect(v.serviceRevenue).toBeCloseTo(1000, 2);
      expect(v.totalRevenue).toBeCloseTo(2000, 2);
    });

    it("ventile correctement BIENS → tout en saleRevenue", () => {
      const invoices = [makeInvoice({ total: 3000, operationCategory: "BIENS" })];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      const v = result.current.ventilation!;
      expect(v.saleRevenue).toBeCloseTo(3000, 2);
      expect(v.serviceRevenue).toBeCloseTo(0, 2);
    });

    it("calcule les cotisations vente à 12,3 %", () => {
      const invoices = [
        makeInvoice({ total: 10000, operationCategory: "BIENS" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      const v = result.current.ventilation!;
      // 10 000 × 12,3 % = 1 230 €
      expect(v.saleContributions).toBeCloseTo(1230, 0);
    });

    it("calcule les cotisations services BNC à 23,2 %", () => {
      const invoices = [
        makeInvoice({ total: 5000, operationCategory: "BIENS" }),
        makeInvoice({ total: 5000, operationCategory: "SERVICES" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      const v = result.current.ventilation!;
      // 5 000 × 23,2 % = 1 160 €
      expect(v.serviceContributions).toBeCloseTo(1160, 0);
    });

    it("totalContributions = saleContributions + serviceContributions", () => {
      const invoices = [
        makeInvoice({ total: 4000, operationCategory: "BIENS" }),
        makeInvoice({ total: 6000, operationCategory: "SERVICES" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      const v = result.current.ventilation!;
      expect(v.totalContributions).toBeCloseTo(
        v.saleContributions + v.serviceContributions,
        2,
      );
    });
  });

  // ── Plafonds ──────────────────────────────────────────────────────────────

  describe("Plafonds et alertes", () => {
    it("isAnyLimitExceeded=true quand le CA global dépasse 188 700 €", () => {
      const invoices = [
        makeInvoice({ total: 100000, operationCategory: "BIENS" }),
        makeInvoice({ total: 100000, operationCategory: "SERVICES" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      const v = result.current.ventilation!;
      expect(v.isAnyLimitExceeded).toBe(true);
    });

    it("isGlobalNearLimit=true quand le CA global dépasse 80 % du plafond global", () => {
      // 80 % × 188 700 = 150 960 €
      const invoices = [
        makeInvoice({ total: 100000, operationCategory: "BIENS" }),
        makeInvoice({ total: 60000, operationCategory: "SERVICES" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      const v = result.current.ventilation!;
      expect(v.isGlobalNearLimit).toBe(true);
    });

    it("isServiceNearLimit=true quand le CA services dépasse 80 % du plafond services", () => {
      // 80 % × 77 700 = 62 160 €
      const invoices = [
        makeInvoice({ total: 1000, operationCategory: "BIENS" }),
        makeInvoice({ total: 65000, operationCategory: "SERVICES" }),
      ];
      const { result } = renderHook(() =>
        useMixedActivityDetection(invoices, BASE_PROFILE, REFERENCE_DATE),
      );
      const v = result.current.ventilation!;
      expect(v.isServiceNearLimit).toBe(true);
    });
  });

  // ── Dismiss ───────────────────────────────────────────────────────────────

  describe("dismiss()", () => {
    it("persiste l'année courante dans localStorage", () => {
      const bienInvoice = makeInvoice({
        total: 5000,
        operationCategory: "BIENS",
      });
      const { result } = renderHook(() =>
        useMixedActivityDetection([bienInvoice], BASE_PROFILE, REFERENCE_DATE),
      );
      result.current.dismiss();
      expect(localStorage.getItem("mgf_mixed_activity_dismissed_year")).toBe(
        String(CURRENT_YEAR),
      );
    });

    it("ne plante pas si localStorage est indisponible", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("storage full");
      });
      const bienInvoice = makeInvoice({
        total: 5000,
        operationCategory: "BIENS",
      });
      const { result } = renderHook(() =>
        useMixedActivityDetection([bienInvoice], BASE_PROFILE, REFERENCE_DATE),
      );
      expect(() => result.current.dismiss()).not.toThrow();
    });
  });
});
