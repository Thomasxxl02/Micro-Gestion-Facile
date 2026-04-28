/**
 * Tests — src/lib/formatters.ts
 */
import { describe, expect, it } from "vitest";
import { formatCurrency, formatPercent, truncateText } from "../../lib/formatters";

describe("formatters", () => {
  describe("formatCurrency", () => {
    it("formate un entier positif en euros", () => {
      const result = formatCurrency(1500);
      expect(result).toContain("1");
      expect(result).toContain("500");
      expect(result).toContain("€");
    });

    it("formate zéro", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0");
      expect(result).toContain("€");
    });

    it("formate un nombre négatif", () => {
      const result = formatCurrency(-250);
      expect(result).toContain("250");
      expect(result).toContain("€");
    });

    it("arrondit les décimales (maximumFractionDigits = 0)", () => {
      const result = formatCurrency(1234.99);
      // Should round to 1235
      expect(result).toContain("1");
      expect(result).not.toContain(",99");
    });

    it("formate de grands nombres", () => {
      const result = formatCurrency(100000);
      expect(result).toContain("€");
    });
  });

  describe("formatPercent", () => {
    it("formate 50 comme 50 %", () => {
      const result = formatPercent(50);
      expect(result).toContain("50");
      expect(result).toContain("%");
    });

    it("formate 0 comme 0 %", () => {
      const result = formatPercent(0);
      expect(result).toContain("0");
    });

    it("formate 100 comme 100 %", () => {
      const result = formatPercent(100);
      expect(result).toContain("100");
    });

    it("divise la valeur par 100 avant le formatage", () => {
      // formatPercent(10) should display 10%
      const result = formatPercent(10);
      expect(result).toContain("10");
    });

    it("formate les décimales (maximumFractionDigits = 1)", () => {
      const result = formatPercent(33.33);
      // 33.33 / 100 = 0.3333 → 33,3%
      expect(result).toContain("33");
    });
  });

  describe("truncateText", () => {
    it("retourne le texte sans modification si plus court que maxLength", () => {
      expect(truncateText("Bonjour", 10)).toBe("Bonjour");
    });

    it("retourne le texte sans modification s'il est exactement maxLength", () => {
      expect(truncateText("12345", 5)).toBe("12345");
    });

    it("tronque et ajoute '...' si le texte dépasse maxLength", () => {
      expect(truncateText("Bonjour le monde", 7)).toBe("Bonjour...");
    });

    it("fonctionne avec maxLength = 0", () => {
      expect(truncateText("Bonjour", 0)).toBe("...");
    });

    it("fonctionne avec une chaîne vide", () => {
      expect(truncateText("", 5)).toBe("");
    });

    it("tronque correctement au bon endroit", () => {
      const result = truncateText("ABCDEFGHIJ", 5);
      expect(result).toBe("ABCDE...");
    });
  });
});
