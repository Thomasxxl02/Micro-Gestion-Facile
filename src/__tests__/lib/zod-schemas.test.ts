/**
 * Tests — src/lib/zod-schemas.ts
 */
import { describe, expect, it } from "vitest";
import {
  validateRequired,
  validateName,
  validateEmailForm,
  validatePhoneForm,
  validateSIRETForm,
  validateSIREN,
  validateIBAN,
  validateTVANumberForm,
  validateFrenchPostalCode,
  validateWebsiteForm,
  validateAddressForm,
  validateAmount,
  validateDate,
  createSchema,
  schemaToRules,
} from "../../lib/zod-schemas";

describe("zod-schemas validators", () => {
  describe("validateRequired", () => {
    it("valide une valeur non vide", () => {
      expect(validateRequired("test").valid).toBe(true);
      expect(validateRequired(0).valid).toBe(true);
      expect(validateRequired(false).valid).toBe(true);
    });

    it("rejette null, undefined, et chaîne vide", () => {
      expect(validateRequired(null).valid).toBe(false);
      expect(validateRequired(undefined).valid).toBe(false);
      expect(validateRequired("").valid).toBe(false);
      expect(validateRequired("   ").valid).toBe(false);
    });
  });

  describe("validateName", () => {
    it("valide un nom de 2+ caractères", () => {
      expect(validateName("Al").valid).toBe(true);
      expect(validateName("Jean Dupont").valid).toBe(true);
    });

    it("rejette un nom vide", () => {
      expect(validateName("").valid).toBe(false);
    });

    it("rejette un nom d'un seul caractère", () => {
      expect(validateName("A").valid).toBe(false);
    });
  });

  describe("validateEmailForm", () => {
    it("valide des emails corrects", () => {
      expect(validateEmailForm("test@example.com").valid).toBe(true);
      expect(validateEmailForm("user.name+tag@domain.fr").valid).toBe(true);
    });

    it("rejette un email vide", () => {
      expect(validateEmailForm("").valid).toBe(false);
    });

    it("rejette un email sans @", () => {
      expect(validateEmailForm("notanemail").valid).toBe(false);
    });

    it("rejette un email sans domaine", () => {
      expect(validateEmailForm("user@").valid).toBe(false);
    });
  });

  describe("validatePhoneForm", () => {
    it("valide des numéros français valides", () => {
      expect(validatePhoneForm("0102030405").valid).toBe(true);
      expect(validatePhoneForm("+33102030405").valid).toBe(true);
      expect(validatePhoneForm("06 12 34 56 78").valid).toBe(true);
    });

    it("valide une valeur vide (optionnel)", () => {
      expect(validatePhoneForm("").valid).toBe(true);
    });

    it("rejette des numéros invalides", () => {
      expect(validatePhoneForm("01234").valid).toBe(false);
      expect(validatePhoneForm("0012345678").valid).toBe(false);
    });
  });

  describe("validateSIRETForm", () => {
    it("valide un SIRET correct (Luhn)", () => {
      // SIRET valide connu
      expect(validateSIRETForm("73282932000074").valid).toBe(true);
    });

    it("valide une valeur vide (optionnel)", () => {
      expect(validateSIRETForm("").valid).toBe(true);
    });

    it("rejette un SIRET qui n'a pas 14 chiffres", () => {
      expect(validateSIRETForm("1234567890").valid).toBe(false);
      expect(validateSIRETForm("123456789012345").valid).toBe(false);
    });

    it("rejette un SIRET invalide (Luhn)", () => {
      expect(validateSIRETForm("12345678901234").valid).toBe(false);
    });
  });

  describe("validateSIREN", () => {
    it("valide un SIREN correct", () => {
      expect(validateSIREN("123456783").valid).toBe(true);
    });

    it("valide une valeur vide (optionnel)", () => {
      expect(validateSIREN("").valid).toBe(true);
    });

    it("rejette un SIREN qui n'a pas 9 chiffres", () => {
      expect(validateSIREN("12345").valid).toBe(false);
    });

    it("rejette un SIREN invalide (Luhn)", () => {
      expect(validateSIREN("123456789").valid).toBe(false);
    });
  });

  describe("validateIBAN", () => {
    it("valide un IBAN français", () => {
      expect(validateIBAN("FR7630006000011234567890189").valid).toBe(true);
    });

    it("valide avec des espaces (stripped)", () => {
      expect(validateIBAN("FR76 3000 6000 0112 3456 7890 189").valid).toBe(true);
    });

    it("valide une valeur vide (optionnel)", () => {
      expect(validateIBAN("").valid).toBe(true);
    });

    it("rejette un IBAN invalide", () => {
      expect(validateIBAN("NOT_AN_IBAN").valid).toBe(false);
    });
  });

  describe("validateTVANumberForm", () => {
    it("valide un numéro TVA français", () => {
      expect(validateTVANumberForm("FR12345678901").valid).toBe(true);
      expect(validateTVANumberForm("FRAB345678901").valid).toBe(true);
    });

    it("valide une valeur vide (optionnel)", () => {
      expect(validateTVANumberForm("").valid).toBe(true);
    });

    it("rejette un numéro TVA invalide", () => {
      expect(validateTVANumberForm("DE12345678901").valid).toBe(false);
      expect(validateTVANumberForm("FR123").valid).toBe(false);
    });
  });

  describe("validateFrenchPostalCode", () => {
    it("valide un code postal à 5 chiffres", () => {
      expect(validateFrenchPostalCode("75001").valid).toBe(true);
      expect(validateFrenchPostalCode("06000").valid).toBe(true);
    });

    it("valide une valeur vide (optionnel)", () => {
      expect(validateFrenchPostalCode("").valid).toBe(true);
    });

    it("rejette un code postal invalide", () => {
      expect(validateFrenchPostalCode("7500").valid).toBe(false);
      expect(validateFrenchPostalCode("750011").valid).toBe(false);
      expect(validateFrenchPostalCode("ABCDE").valid).toBe(false);
    });
  });

  describe("validateWebsiteForm", () => {
    it("valide une URL complète", () => {
      expect(validateWebsiteForm("https://example.com").valid).toBe(true);
      expect(validateWebsiteForm("http://www.test.fr").valid).toBe(true);
    });

    it("valide une URL sans protocole (ajout https://)", () => {
      expect(validateWebsiteForm("www.example.com").valid).toBe(true);
    });

    it("valide une valeur vide (optionnel)", () => {
      expect(validateWebsiteForm("").valid).toBe(true);
    });

    it("rejette une URL invalide", () => {
      expect(validateWebsiteForm("not a url !!!").valid).toBe(false);
    });
  });

  describe("validateAddressForm", () => {
    it("valide une adresse de 10+ caractères", () => {
      expect(validateAddressForm("123 Rue de Paris, 75001 Paris").valid).toBe(true);
    });

    it("rejette une adresse vide", () => {
      expect(validateAddressForm("").valid).toBe(false);
    });

    it("rejette une adresse trop courte", () => {
      expect(validateAddressForm("Court").valid).toBe(false);
    });
  });

  describe("validateAmount", () => {
    it("valide des montants positifs et zéro", () => {
      expect(validateAmount(100).valid).toBe(true);
      expect(validateAmount(0).valid).toBe(true);
      expect(validateAmount(0.5).valid).toBe(true);
    });

    it("rejette les montants négatifs", () => {
      expect(validateAmount(-1).valid).toBe(false);
    });

    it("rejette les valeurs non-numériques", () => {
      expect(validateAmount("abc").valid).toBe(false);
    });
  });

  describe("validateDate", () => {
    it("valide une date valide", () => {
      expect(validateDate("2026-01-15").valid).toBe(true);
      expect(validateDate("2026-12-31").valid).toBe(true);
    });

    it("rejette une date vide", () => {
      expect(validateDate("").valid).toBe(false);
    });

    it("rejette une date invalide", () => {
      expect(validateDate("not-a-date").valid).toBe(false);
      expect(validateDate("2026-13-01").valid).toBe(false);
    });
  });

  describe("createSchema / schemaToRules", () => {
    it("crée un schéma et l'exporte en règles", () => {
      const schema = createSchema({ name: [validateRequired] });
      const rules = schemaToRules(schema);
      expect(rules).toHaveProperty("name");
      expect(Array.isArray(rules.name)).toBe(true);
    });
  });
});
