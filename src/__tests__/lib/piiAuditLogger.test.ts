/**
 * Tests d'audit PII — src/lib/piiAuditLogger.ts
 *
 * Vérifie l'enregistrement des détections, la rotation des logs et l'export.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PIIAuditLogger } from "../../lib/piiAuditLogger";

describe("PIIAuditLogger", () => {
  beforeEach(() => {
    localStorage.clear();
    // Accès aux membres privés pour reset l'état interne entre les tests
    (PIIAuditLogger as any).events = [];
    (PIIAuditLogger as any).unknownPatterns = new Set();
    PIIAuditLogger.initialize();
  });

  it("initialise correctement les logs depuis localStorage", () => {
    const mockEvent = {
      timestamp: Date.now(),
      patternType: "email",
      context: "test",
    };
    localStorage.setItem("pii_detection_log", JSON.stringify([mockEvent]));

    PIIAuditLogger.initialize();
    const stats = PIIAuditLogger.getStatistics();
    expect(stats.totalDetections).toBe(1);
  });

  it("enregistre une détection et masque le texte", () => {
    PIIAuditLogger.logDetection(
      "email",
      "secret@email.com",
      "[MASKED]",
      "email_context",
      "general",
    );

    const stats = PIIAuditLogger.getStatistics();
    expect(stats.totalDetections).toBe(1);
    expect(stats.detectionsByType["email"]).toBe(1);

    const report = PIIAuditLogger.exportAuditReport();
    expect(report.recentEvents[0].detectedText).toBe(
      "secret@email.com".substring(0, 20),
    );
  });

  it("applique la rotation des logs (MAX_EVENTS = 1000)", () => {
    // Simuler 1005 événements
    for (let i = 0; i < 1005; i++) {
      PIIAuditLogger.logDetection(
        "phoneFR",
        `06000000${i}`,
        "XXX",
        "test",
        "general",
      );
    }

    const stats = PIIAuditLogger.getStatistics();
    expect(stats.totalDetections).toBe(1000); // MAX_EVENTS
  });

  it("enregistre les patterns inconnus et les limite", () => {
    PIIAuditLogger.logUnknownPattern(
      "Long text that should be truncated because it might be a PII",
      "query",
    );

    const stats = PIIAuditLogger.getStatistics();
    expect(stats.unknownPatterns).toHaveLength(1);
    expect(stats.unknownPatterns[0]).toContain("...");
  });

  it("gère les erreurs de localStorage gracieusement", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota exceeded");
      });

    // Ne devrait pas crash
    PIIAuditLogger.logDetection("iban", "FR76...", "XXX", "pay", "financial");

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("génère un rapport d'audit complet", () => {
    PIIAuditLogger.logDetection("email", "a@b.c", "X", "ctx", "general");
    const report = PIIAuditLogger.exportAuditReport();

    expect(report.generatedAt).toBeDefined();
    expect(report.statistics).toBeDefined();
    expect(report.recentEvents).toHaveLength(1);
  });
});
