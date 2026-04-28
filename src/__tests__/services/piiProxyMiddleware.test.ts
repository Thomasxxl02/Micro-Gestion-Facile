/*!
 * PIIProxyMiddleware Tests
 *
 * - Validation des patterns Regex de détection PII
 * - Vérification des masques aplikados
 * - Tests des filtres spécifiques (email, financial, compliance, general)
 * - Audit et logging des données sensibles détectées
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { PIIAuditLogger } from "../../lib/piiAuditLogger";
import {
  PIIProxyMiddleware,
  PII_MASKS,
  PII_PATTERNS,
} from "../../services/piiProxyMiddleware";

// Mocks
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../lib/piiAuditLogger", () => ({
  PIIAuditLogger: {
    initialize: vi.fn(),
    logDetection: vi.fn(),
    logUnknownPattern: vi.fn(),
    getStatistics: vi.fn(() => ({
      totalDetections: 0,
      detectionsByType: {},
      detectionsByContext: {},
      detectionsByRequestType: {},
      lastDetectionTime: null,
      unknownPatterns: [],
    })),
    exportAuditReport: vi.fn(),
    clearAllLogs: vi.fn(),
    getAllEvents: vi.fn(() => []),
    getEventsByDateRange: vi.fn(() => []),
  },
}));

vi.mock("../../lib/piiAnonymizer", () => ({
  anonymizeForComplianceCheck: vi.fn(() => ({
    invoice: { number: "FAC-001", total: 100 },
    activityType: "SERVICES",
    isVatExempt: false,
  })),
  anonymizeInvoicesForFinancial: vi.fn(
    (invoices: Array<Record<string, unknown>>) =>
      invoices.map((i) => ({
        pseudoClientId: "CLIENT_1",
        date: i.date,
        total: i.total,
        status: i.status,
      })),
  ),
}));

describe("PIIProxyMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Pattern Detection", () => {
    it("should detect and mask email addresses", () => {
      const result = PIIProxyMiddleware.maskSensitiveData(
        "Contact john@example.fr",
      );
      expect(result).toContain(PII_MASKS.email);
    });

    it("should detect and mask IBAN codes", () => {
      const result = PIIProxyMiddleware.maskSensitiveData(
        "FR1420041010050500013M02606",
      );
      expect(result).toContain(PII_MASKS.iban);
    });

    it("should detect and mask SIRET numbers", () => {
      const result = PIIProxyMiddleware.maskSensitiveData("12345678901234");
      expect(result).toContain(PII_MASKS.siret);
    });

    it("should detect and mask French VAT numbers", () => {
      const result = PIIProxyMiddleware.maskSensitiveData("FR12345678901");
      expect(result).toContain(PII_MASKS.tva);
    });

    it("should detect and mask phone numbers", () => {
      const result = PIIProxyMiddleware.maskSensitiveData("+33 6 12 34 56 78");
      expect(result).toContain(PII_MASKS.phone);
    });
  });

  describe("Sensitivity Detection", () => {
    it("should detect sensitive data presence", () => {
      expect(
        PIIProxyMiddleware.hasSensitiveData("Email: alice@example.com"),
      ).toBe(true);
    });

    it("should return false for non-sensitive data", () => {
      expect(PIIProxyMiddleware.hasSensitiveData("Normal text")).toBe(false);
    });
  });

  describe("Request Filtering", () => {
    it("should anonymize email context data", async () => {
      const request = {
        type: "email" as const,
        data: {
          clientName: "John Doe",
          companyName: "Acme Corp",
          invoiceNumber: "INV-2026-001",
        },
      };

      const result = await PIIProxyMiddleware.filterRequest(request);
      expect(result.clientName).toBe("[CLIENT_ANONYMISÉ]");
      expect(result.companyName).toBe("[MA_SOCIÉTÉ]");
    });

    it("should mask sensitive data in general queries", async () => {
      const request = {
        type: "general" as const,
        data: "Email: alice@company.com with IBAN FR1420041010050500013M02606",
      };

      const result = await PIIProxyMiddleware.filterRequest(request);
      expect(result).toContain(PII_MASKS.email);
      expect(result).toContain(PII_MASKS.iban);
    });
  });

  describe("Audit Logging", () => {
    it("should log email detection", () => {
      PIIProxyMiddleware.maskSensitiveData(
        "Contact alice@example.com",
        "test_context",
        "general",
      );
      expect(PIIAuditLogger.logDetection).toHaveBeenCalledWith(
        "email",
        "alice@example.com",
        "[EMAIL_CACHÉ]",
        "test_context",
        "general",
      );
    });

    it("should log IBAN detection", () => {
      PIIProxyMiddleware.maskSensitiveData(
        "Transfer to FR1420041010050500013M02606",
        "payment_context",
        "financial",
      );
      expect(PIIAuditLogger.logDetection).toHaveBeenCalledWith(
        "iban",
        expect.stringContaining("FR1420041010050500013M"),
        "[IBAN_CACHÉ]",
        "payment_context",
        "financial",
      );
    });

    it("should pass correct context in handleGeneralFilter", async () => {
      const request = {
        type: "general" as const,
        data: "Contact: john@company.com",
      };
      await PIIProxyMiddleware.filterRequest(request);
      expect(PIIAuditLogger.logDetection).toHaveBeenCalledWith(
        "email",
        expect.any(String),
        "[EMAIL_CACHÉ]",
        "general_query",
        "general",
      );
    });
  });

  describe("Pattern Constants", () => {
    it("should export PII_PATTERNS", () => {
      expect(PII_PATTERNS.email).toBeInstanceOf(RegExp);
      expect(PII_PATTERNS.siret).toBeInstanceOf(RegExp);
    });

    it("should export PII_MASKS", () => {
      expect(PII_MASKS.email).toBe("[EMAIL_CACHÉ]");
      expect(PII_MASKS.iban).toBe("[IBAN_CACHÉ]");
    });
  });

  describe("Performance", () => {
    it("should handle long strings efficiently", () => {
      const longText = "This is a test ".repeat(1000) + "email@example.com";
      const startTime = performance.now();
      PIIProxyMiddleware.maskSensitiveData(longText);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings", () => {
      expect(PIIProxyMiddleware.maskSensitiveData("")).toBe("");
      expect(PIIProxyMiddleware.hasSensitiveData("")).toBe(false);
    });

    it("should handle null/undefined in filterRequest", async () => {
      const request = {
        type: "general" as const,
        data: null,
      };
      const result = await PIIProxyMiddleware.filterRequest(request);
      expect(result).toBe(null);
    });

    it("should handle repeated patterns", () => {
      const repeatedData = "alice@test.com, bob@test.com, charlie@test.com";
      const result = PIIProxyMiddleware.maskSensitiveData(repeatedData);
      const emailCount = (result.match(/\[EMAIL_CACHÉ\]/g) ?? []).length;
      expect(emailCount).toBe(3);
    });
  });

  describe("Security & RGPD Compliance", () => {
    it("should never leak SIRET to LLM", () => {
      const result = PIIProxyMiddleware.maskSensitiveData(
        "SIRET 12345678901234",
      );
      expect(result).not.toContain("12345678901234");
      expect(result).toContain(PII_MASKS.siret);
    });

    it("should never leak bank details", () => {
      const result = PIIProxyMiddleware.maskSensitiveData(
        "IBAN FR1420041010050500013M02606",
      );
      expect(result).not.toContain("FR1420041010050500013M02606");
      expect(result).toContain(PII_MASKS.iban);
    });
  });
});
