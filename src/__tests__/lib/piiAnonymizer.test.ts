/**
 * Tests d'anonymisation des données personnelles — src/lib/piiAnonymizer.ts
 *
 * Conformité RGPD : validation que les PII ne quittent pas le navigateur.
 */
import { describe, expect, it } from "vitest";
import {
  anonymizeForComplianceCheck,
  anonymizeInvoicesForFinancial,
} from "../../lib/piiAnonymizer";
import type { Client, Invoice, UserProfile } from "../../types";

const makeUserProfile = (
  overrides: Partial<UserProfile> = {},
): UserProfile => ({
  companyName: "Ma Micro-Entreprise",
  professionalTitle: "Développeur Freelance",
  siret: "12345678901234",
  address: "123 Rue de Paris, 75001 Paris",
  email: "contact@entreprise.fr",
  phone: "0123456789",
  isVatExempt: true,
  ...overrides,
});

const makeClient = (overrides: Partial<Client> = {}): Client => ({
  id: "cli-123",
  name: "Jean Dupont",
  email: "jean.dupont@email.com",
  address: "456 Avenue des Champs, 75008 Paris",
  siret: "98765432109876",
  ...overrides,
});

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "inv-001",
  number: "FAC-2026-001",
  date: "2026-01-01",
  dueDate: "2026-02-01",
  clientId: "cli-123",
  items: [
    {
      id: "it-1",
      description: "Service A",
      quantity: 1,
      unitPrice: 100,
      vatRate: 20,
    },
  ],
  total: 120,
  vatAmount: 20,
  status: "draft",
  type: "invoice",
  ...overrides,
});

describe("piiAnonymizer — Anonymisation RGPD", () => {
  const profile = makeUserProfile();
  const client = makeClient();
  const invoice = makeInvoice();

  describe("anonymizeForComplianceCheck", () => {
    it("remplace les données réelles par des booléens de présence", () => {
      const result = anonymizeForComplianceCheck(invoice, profile, client);

      expect(result.invoice.number).toBe(invoice.number);
      expect(result.invoice.hasSellerSiret).toBe(true);
      expect(result.invoice.hasBuyerSiret).toBe(true);
      expect(result.invoice.hasSellerAddress).toBe(true);
      expect(result.invoice.hasBuyerAddress).toBe(true);
      // Les données réelles ne doivent pas être présentes dans l'objet anonymisé
      const values = Object.values(result.invoice);
      expect(values).not.toContain(profile.siret);
      expect(values).not.toContain(client.siret);
      expect(values).not.toContain(profile.address);
      expect(values).not.toContain(client.address);
    });

    it("détecte correctement la mention EI dans le nom ou le titre", () => {
      const profileEI = makeUserProfile({ companyName: "Jean Dupont EI" });
      const result = anonymizeForComplianceCheck(invoice, profileEI, client);
      expect(result.invoice.hasEiMention).toBe(true);

      const profileEILower = makeUserProfile({
        professionalTitle: "entrepreneur individuel",
      });
      const result2 = anonymizeForComplianceCheck(
        invoice,
        profileEILower,
        client,
      );
      expect(result2.invoice.hasEiMention).toBe(true);
    });

    it("gère l'absence de données (false pour les indicateurs)", () => {
      const emptyProfile = makeUserProfile({ siret: "", address: "" });
      const emptyClient = makeClient({ siret: "", address: "" });
      const result = anonymizeForComplianceCheck(
        invoice,
        emptyProfile,
        emptyClient,
      );

      expect(result.invoice.hasSellerSiret).toBe(false);
      expect(result.invoice.hasSellerAddress).toBe(false);
      expect(result.invoice.hasBuyerSiret).toBe(false);
      expect(result.invoice.hasBuyerAddress).toBe(false);
    });
  });

  describe("anonymizeInvoicesForFinancial", () => {
    it("utilise des pseudonymes de session pour les clients", () => {
      const result = anonymizeInvoicesForFinancial([
        invoice,
        makeInvoice({ id: "inv-2", clientId: "cli-123" }),
      ]);

      // Même client -> même pseudonyme dans la session
      expect(result[0].pseudoClientId).toBe(result[1].pseudoClientId);
      expect(result[0].pseudoClientId).toMatch(/^Entité_\d+$/);

      // Nouveau client -> nouveau pseudonyme
      const result2 = anonymizeInvoicesForFinancial([
        makeInvoice({ clientId: "cli-456" }),
      ]);
      expect(result2[0].pseudoClientId).not.toBe(result[0].pseudoClientId);
    });

    it("ne transmet que les données financières essentielles", () => {
      const result = anonymizeInvoicesForFinancial([invoice])[0];
      expect(result).toEqual({
        pseudoClientId: expect.any(String),
        date: invoice.date,
        dueDate: invoice.dueDate,
        status: invoice.status,
        total: invoice.total,
        vatAmount: invoice.vatAmount,
        type: invoice.type,
      });
      // @ts-expect-error
      expect(result.number).toBeUndefined();
    });
  });
});
