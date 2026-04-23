/**
 * Logger centralisé pour l'audit PII et le machine learning de patterns.
 *
 * Fonctionnalités:
 * - Enregistrement des patterns détectés + contexte
 * - Statistiques d'utilisation (fréquence par type)
 * - Détection de nouveaux patterns non-couverts (pour évolution)
 * - Export pour analyse réglementaire RGPD
 *
 * Persiste en localStorage pour survie aux rechargements de page.
 * Limité à 1000 derniers enregistrements pour éviter surcharge mémoire.
 */

import { logger } from "./logger";

// ─── Types d'audit ──────────────────────────────────────────────────────────

export interface PIIDetectionEvent {
  timestamp: number; // milliseconds since epoch
  patternType:
    | "email"
    | "phoneFR"
    | "iban"
    | "card"
    | "siret"
    | "siren"
    | "tva"
    | "ssn"
    | "ip"
    | "postal"
    | "unknown";
  detectedText: string; // Première 20 chars du texte détecté (masqué pour audit)
  maskedTo: string; // Le masque appliqué
  context: string; // D'où venait le texte (ex: "email_context", "general_query")
  requestType: "compliance" | "financial" | "general" | "email";
}

export interface PIIStatistics {
  totalDetections: number;
  detectionsByType: Record<string, number>;
  detectionsByContext: Record<string, number>;
  detectionsByRequestType: Record<string, number>;
  lastDetectionTime: number | null;
  unknownPatterns: string[];
}

/**
 * Gestionnaire centralisé d'audit PII.
 * Utilise localStorage pour persister les logs entre sessions.
 */
export class PIIAuditLogger {
  private static readonly STORAGE_KEY = "pii_detection_log";
  private static readonly MAX_EVENTS = 1000;
  private static readonly UNKNOWN_PATTERN_KEY = "pii_unknown_patterns";

  private static events: PIIDetectionEvent[] = [];
  private static unknownPatterns: Set<string> = new Set();

  /**
   * Initialise les logs depuis localStorage.
   */
  static initialize(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      this.events = stored ? JSON.parse(stored) : [];

      const unknownStored = localStorage.getItem(this.UNKNOWN_PATTERN_KEY);
      this.unknownPatterns = new Set(
        unknownStored ? JSON.parse(unknownStored) : [],
      );

      logger.info("PIIAuditLogger", "Initialized with events", {
        count: this.events.length,
      });
    } catch (error) {
      logger.warn(
        "PIIAuditLogger",
        "Failed to load stored events",
        error as Error,
      );
      this.events = [];
      this.unknownPatterns = new Set();
    }
  }

  /**
   * Enregistre une détection de pattern PII.
   */
  static logDetection(
    patternType: PIIDetectionEvent["patternType"],
    detectedText: string,
    maskedTo: string,
    context: string,
    requestType: PIIDetectionEvent["requestType"],
  ): void {
    const event: PIIDetectionEvent = {
      timestamp: Date.now(),
      patternType,
      detectedText: detectedText.substring(0, 20), // Éviter de stocker du vrai PII
      maskedTo,
      context,
      requestType,
    };

    this.events.push(event);

    // Rotation des événements si dépassement du max
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Persiste en localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      logger.warn("PIIAuditLogger", "Failed to persist events", error as Error);
    }

    logger.debug("PIIAuditLogger", `Logged detection: ${patternType}`, {
      context,
      requestType,
    });
  }

  /**
   * Enregistre un pattern détecté qui ne correspond à aucun format connu.
   * Utile pour identifier de nouvelles types de PII à couvrir.
   */
  static logUnknownPattern(pattern: string, context: string): void {
    if (pattern.length > 50) {
      // Limiter la taille pour ne pas stocker du PII complet
      pattern = pattern.substring(0, 50) + "...";
    }

    const patternId = `${pattern}|${context}`;
    this.unknownPatterns.add(patternId);

    // Persiste les patterns inconnus
    try {
      localStorage.setItem(
        this.UNKNOWN_PATTERN_KEY,
        JSON.stringify(Array.from(this.unknownPatterns)),
      );
    } catch (error) {
      logger.warn(
        "PIIAuditLogger",
        "Failed to persist unknown patterns",
        error as Error,
      );
    }

    logger.warn("PIIAuditLogger", "Unknown PII pattern detected", {
      pattern: pattern.substring(0, 20),
      context,
    });
  }

  /**
   * Retourne les statistiques actuelles.
   */
  static getStatistics(): PIIStatistics {
    const stats: PIIStatistics = {
      totalDetections: this.events.length,
      detectionsByType: {},
      detectionsByContext: {},
      detectionsByRequestType: {},
      lastDetectionTime:
        this.events.length > 0
          ? this.events[this.events.length - 1].timestamp
          : null,
      unknownPatterns: Array.from(this.unknownPatterns).slice(0, 50),
    };

    this.events.forEach((event) => {
      // Par type
      stats.detectionsByType[event.patternType] =
        (stats.detectionsByType[event.patternType] || 0) + 1;

      // Par contexte
      stats.detectionsByContext[event.context] =
        (stats.detectionsByContext[event.context] || 0) + 1;

      // Par type de requête
      stats.detectionsByRequestType[event.requestType] =
        (stats.detectionsByRequestType[event.requestType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Exporte les logs pour audit réglementaire (RGPD, conformité).
   * Format JSON lisible pour analyse externe.
   */
  static exportAuditReport(): {
    generatedAt: string;
    totalEvents: number;
    statistics: PIIStatistics;
    recentEvents: PIIDetectionEvent[];
    unknownPatternsAnalysis: Record<string, number>;
  } {
    const stats = this.getStatistics();
    const recentEvents = this.events.slice(-50); // Derniers 50 événements

    // Analyse des patterns inconnus
    const unknownPatternsAnalysis: Record<string, number> = {};
    this.unknownPatterns.forEach((pattern) => {
      const basePattern = pattern.split("|")[0];
      unknownPatternsAnalysis[basePattern] =
        (unknownPatternsAnalysis[basePattern] || 0) + 1;
    });

    return {
      generatedAt: new Date().toISOString(),
      totalEvents: this.events.length,
      statistics: stats,
      recentEvents,
      unknownPatternsAnalysis,
    };
  }

  /**
   * Réinitialise tous les logs (par ex. pour tests ou RGPD right-to-be-forgotten).
   */
  static clearAllLogs(): void {
    this.events = [];
    this.unknownPatterns.clear();

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.UNKNOWN_PATTERN_KEY);
    } catch (error) {
      logger.warn(
        "PIIAuditLogger",
        "Failed to clear localStorage",
        error as Error,
      );
    }

    logger.info("PIIAuditLogger", "All logs cleared");
  }

  /**
   * Retourne tous les événements (pour debug/UI).
   */
  static getAllEvents(): PIIDetectionEvent[] {
    return [...this.events];
  }

  /**
   * Filtre les événements par plage de dates.
   */
  static getEventsByDateRange(
    startTime: number,
    endTime: number,
  ): PIIDetectionEvent[] {
    return this.events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime,
    );
  }
}

// Auto-initialize on module load
if (typeof window !== "undefined") {
  PIIAuditLogger.initialize();
}
