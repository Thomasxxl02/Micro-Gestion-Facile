/**
 * Tests — src/lib/electronicSignature.ts
 */
import { describe, expect, it } from "vitest";
import { signInvoice, verifySignature } from "../../lib/electronicSignature";
import type { Invoice, UserProfile } from "../../types";

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "inv-001",
  number: "FAC-2026-001",
  date: "2026-01-15",
  dueDate: "2026-02-15",
  clientId: "cli-001",
  items: [{ id: "it-1", description: "Service", quantity: 1, unitPrice: 1000, vatRate: 0 }],
  total: 1000,
  vatAmount: 0,
  status: "sent",
  type: "invoice",
  ...overrides,
});

const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  companyName: "Ma Société EI",
  siret: "12345678901234",
  address: "123 Rue de Paris, 75001 Paris",
  email: "contact@masociete.fr",
  phone: "0102030405",
  isVatExempt: true,
  ...overrides,
});

describe("electronicSignature", () => {
  describe("signInvoice", () => {
    it("retourne une signature et un timestamp", async () => {
      const invoice = makeInvoice();
      const profile = makeProfile();
      const result = await signInvoice(invoice, profile);

      expect(result).toHaveProperty("signature");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.signature).toBe("string");
      expect(result.signature.length).toBeGreaterThan(0);
    });

    it("le timestamp est une chaîne ISO valide", async () => {
      const result = await signInvoice(makeInvoice(), makeProfile());
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(isNaN(new Date(result.timestamp).getTime())).toBe(false);
    });

    it("génère des signatures différentes pour des factures différentes", async () => {
      const profile = makeProfile();
      const result1 = await signInvoice(makeInvoice({ id: "inv-001", total: 1000 }), profile);
      const result2 = await signInvoice(makeInvoice({ id: "inv-002", total: 2000 }), profile);
      expect(result1.signature).not.toBe(result2.signature);
    });

    it("la signature est du Base64 valide", async () => {
      const result = await signInvoice(makeInvoice(), makeProfile());
      // Base64 should only contain A-Z, a-z, 0-9, +, /, and = padding
      expect(result.signature).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe("verifySignature", () => {
    it("vérifie correctement une signature valide", async () => {
      const invoice = makeInvoice();
      const profile = makeProfile();
      const { signature } = await signInvoice(invoice, profile);
      const isValid = await verifySignature(invoice, signature, "publicKey");
      expect(isValid).toBe(true);
    });

    it("rejette une signature invalide", async () => {
      const invoice = makeInvoice();
      const isValid = await verifySignature(invoice, "signaturedvalide==", "publicKey");
      expect(isValid).toBe(false);
    });

    it("rejette une signature pour une facture différente", async () => {
      const invoice1 = makeInvoice({ id: "inv-001", total: 1000 });
      const invoice2 = makeInvoice({ id: "inv-002", total: 2000 });
      const profile = makeProfile();
      const { signature } = await signInvoice(invoice1, profile);
      const isValid = await verifySignature(invoice2, signature, "publicKey");
      expect(isValid).toBe(false);
    });

    it("retourne false pour une chaîne Base64 corrompue", async () => {
      const invoice = makeInvoice();
      const isValid = await verifySignature(invoice, "!!!invalid_base64!!!", "publicKey");
      expect(isValid).toBe(false);
    });
  });
});
