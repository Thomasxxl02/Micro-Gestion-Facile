/**
 * Tests — src/lib/invoiceNumbering.ts
 * Uses fake-indexeddb (auto-loaded via setupTests.ts)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateInvoiceNumber, getNextSequence } from "../../lib/invoiceNumbering";
import { db } from "../../db/invoiceDB";
import type { DocumentType, UserProfile } from "../../types";

const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  companyName: "Ma Société EI",
  siret: "12345678901234",
  address: "123 Rue de Paris, 75001 Paris",
  email: "contact@masociete.fr",
  phone: "0102030405",
  isVatExempt: true,
  invoicePrefix: "FAC",
  quotePrefix: "DEV",
  numberingFormat: "{PREFIX}-{YEAR}-{NUM}",
  resetNumberingYearly: true,
  ...overrides,
});

describe("invoiceNumbering", () => {
  beforeEach(async () => {
    // Nettoyer les séquences entre les tests
    await db.invoiceNumberSequences.clear();
  });

  describe("generateInvoiceNumber", () => {
    it("génère le premier numéro de facture en 001", async () => {
      const profile = makeProfile();
      const year = new Date().getFullYear();
      const number = await generateInvoiceNumber("invoice", profile);
      expect(number).toBe(`FAC-${year}-001`);
    });

    it("incrémente le numéro à chaque appel", async () => {
      const profile = makeProfile();
      const year = new Date().getFullYear();
      const num1 = await generateInvoiceNumber("invoice", profile);
      const num2 = await generateInvoiceNumber("invoice", profile);
      expect(num1).toBe(`FAC-${year}-001`);
      expect(num2).toBe(`FAC-${year}-002`);
    });

    it("génère des numéros indépendants pour chaque type de document", async () => {
      const profile = makeProfile();
      const year = new Date().getFullYear();
      const invNum = await generateInvoiceNumber("invoice", profile);
      const quoteNum = await generateInvoiceNumber("quote", profile);
      expect(invNum).toBe(`FAC-${year}-001`);
      expect(quoteNum).toBe(`DEV-${year}-001`);
    });

    it("utilise le préfixe par défaut pour les types sans préfixe personnalisé", async () => {
      const profile = makeProfile({ invoicePrefix: undefined });
      const year = new Date().getFullYear();
      const number = await generateInvoiceNumber("invoice", profile);
      expect(number).toBe(`FAC-${year}-001`);
    });

    it("utilise le préfixe par défaut 'BC' pour les commandes", async () => {
      const profile = makeProfile();
      const year = new Date().getFullYear();
      const number = await generateInvoiceNumber("order", profile);
      expect(number).toContain("BC");
    });

    it("utilise un format personnalisé", async () => {
      const profile = makeProfile({ numberingFormat: "{PREFIX}/{YEAR}/{NUM}" });
      const year = new Date().getFullYear();
      const number = await generateInvoiceNumber("invoice", profile);
      expect(number).toBe(`FAC/${year}/001`);
    });

    it("réinitialise la séquence lors d'un changement d'année (si activé)", async () => {
      const profile = makeProfile({ resetNumberingYearly: true });
      const currentYear = new Date().getFullYear();

      // Simuler une séquence de l'année précédente
      await db.invoiceNumberSequences.put({
        type: "invoice",
        year: currentYear - 1,
        currentNumber: 15,
        lastUsedAt: new Date().toISOString(),
      });

      const number = await generateInvoiceNumber("invoice", profile);
      expect(number).toContain("001");
    });

    it("ne réinitialise pas la séquence si resetNumberingYearly=false", async () => {
      const profile = makeProfile({ resetNumberingYearly: false });
      const currentYear = new Date().getFullYear();

      await db.invoiceNumberSequences.put({
        type: "invoice",
        year: currentYear - 1,
        currentNumber: 15,
        lastUsedAt: new Date().toISOString(),
      });

      const number = await generateInvoiceNumber("invoice", profile);
      expect(number).toContain("016");
    });

    it("utilise un format personnalisé passé en paramètre", async () => {
      const profile = makeProfile();
      const year = new Date().getFullYear();
      const number = await generateInvoiceNumber(
        "invoice",
        profile,
        "{PREFIX}_{NUM}",
      );
      expect(number).toBe("FAC_001");
    });
  });

  describe("getNextSequence", () => {
    it("retourne 1 si aucune séquence n'existe", async () => {
      const year = new Date().getFullYear();
      const next = await getNextSequence("invoice", year);
      expect(next).toBe(1);
    });

    it("retourne le prochain numéro sans incrémenter", async () => {
      const year = new Date().getFullYear();
      await db.invoiceNumberSequences.put({
        type: "invoice",
        year,
        currentNumber: 5,
        lastUsedAt: new Date().toISOString(),
      });
      const next = await getNextSequence("invoice", year);
      expect(next).toBe(6);
      // Vérifie que la séquence n'a pas été modifiée
      const seq = await db.invoiceNumberSequences.get("invoice");
      expect(seq?.currentNumber).toBe(5);
    });

    it("retourne 1 si la séquence est pour une autre année", async () => {
      const year = new Date().getFullYear();
      await db.invoiceNumberSequences.put({
        type: "invoice",
        year: year - 1,
        currentNumber: 10,
        lastUsedAt: new Date().toISOString(),
      });
      const next = await getNextSequence("invoice", year);
      expect(next).toBe(1);
    });
  });
});
