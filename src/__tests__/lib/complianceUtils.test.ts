/**
 * Tests — src/lib/complianceUtils.ts
 */
import { describe, expect, it } from "vitest";
import { checkCompliance2026 } from "../../lib/complianceUtils";
import type { UserProfile } from "../../types";

const makeCompliantProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  companyName: "Jean Dupont EI",
  siret: "12345678901234",
  address: "123 Rue de Paris, 75001 Paris",
  email: "contact@example.fr",
  phone: "0102030405",
  bankAccount: "FR76 3000 6000 0112 3456 7890 189",
  tvaNumber: "FR12345678901",
  isVatExempt: false,
  ...overrides,
});

describe("checkCompliance2026", () => {
  it("retourne isCompliant=true pour un profil complet avec mention EI", () => {
    const result = checkCompliance2026(makeCompliantProfile());
    expect(result.isCompliant).toBe(true);
    expect(result.score).toBe(100);
    expect(result.missingFields).toHaveLength(0);
  });

  it("pénalise l'absence de raison sociale", () => {
    const result = checkCompliance2026(makeCompliantProfile({ companyName: "" }));
    expect(result.missingFields).toContain("Raison sociale");
    expect(result.score).toBeLessThan(100);
    expect(result.isCompliant).toBe(false);
  });

  it("pénalise l'absence de SIRET", () => {
    const result = checkCompliance2026(makeCompliantProfile({ siret: "" }));
    expect(result.missingFields).toContain("Numéro SIRET");
    expect(result.score).toBeLessThan(100);
  });

  it("pénalise une adresse trop courte (< 10 caractères)", () => {
    const result = checkCompliance2026(makeCompliantProfile({ address: "Court" }));
    expect(result.missingFields).toContain("Adresse complète");
  });

  it("pénalise l'absence d'adresse", () => {
    const result = checkCompliance2026(makeCompliantProfile({ address: "" }));
    expect(result.missingFields).toContain("Adresse complète");
  });

  it("pénalise l'absence d'email", () => {
    const result = checkCompliance2026(makeCompliantProfile({ email: "" }));
    expect(result.missingFields).toContain("Email de contact");
  });

  it("pénalise l'absence de numéro TVA quand non exonéré", () => {
    const result = checkCompliance2026(
      makeCompliantProfile({ tvaNumber: "", isVatExempt: false }),
    );
    expect(result.missingFields).toContain("Numéro de TVA Intracommunautaire");
  });

  it("ne pénalise pas l'absence de TVA quand isVatExempt=true avec mention", () => {
    const result = checkCompliance2026(
      makeCompliantProfile({
        tvaNumber: "",
        isVatExempt: true,
        vatExemptionReason: "Art. 293 B du CGI",
      }),
    );
    expect(result.missingFields).not.toContain("Numéro de TVA Intracommunautaire");
  });

  it("pénalise l'exonération TVA sans mention légale", () => {
    const result = checkCompliance2026(
      makeCompliantProfile({
        tvaNumber: "",
        isVatExempt: true,
        vatExemptionReason: "",
      }),
    );
    expect(result.missingFields).toContain(
      "Mention légale d'exonération de TVA (ex: Art. 293 B du CGI)",
    );
  });

  it("recommande la mention EI si absente du nom", () => {
    const result = checkCompliance2026(
      makeCompliantProfile({ companyName: "Jean Dupont SARL" }),
    );
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("accepte 'ENTREPRENEUR INDIVIDUEL' dans le nom", () => {
    const result = checkCompliance2026(
      makeCompliantProfile({ companyName: "Jean Dupont Entrepreneur Individuel" }),
    );
    expect(result.recommendations).not.toContain(
      expect.stringContaining("EI"),
    );
  });

  it("pénalise l'absence de coordonnées bancaires", () => {
    const result = checkCompliance2026(makeCompliantProfile({ bankAccount: "" }));
    expect(result.missingFields).toContain("Coordonnées bancaires (IBAN)");
  });

  it("retourne un score minimum de 0 quand tout manque", () => {
    const result = checkCompliance2026({
      companyName: "",
      siret: "",
      address: "",
      email: "",
      phone: "",
      isVatExempt: false,
    } as UserProfile);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.isCompliant).toBe(false);
  });
});
