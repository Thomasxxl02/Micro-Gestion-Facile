/**
 * Proxy de filtrage PII (Personal Identifiable Information) pour les requêtes Gemini.
 * Ce service agit comme un "Middleware" de sécurité avant que les données ne quittent le périmètre client.
 *
 * Basé sur le principe de Minimisation des Données (RGPD Art. 5.1.c).
 *
 * Formats détectés et masqués :
 * - Emails (RFC 5322 pattern)
 * - Numéros de téléphone français (+33, 00 33, 0)
 * - IBAN (International Bank Account Number - ISO 13616)
 * - SIRET/SIREN français (14/9 chiffres)
 * - Numéros de TVA intracommunautaires (FR + 11 chiffres)
 * - Numéros de carte bancaire (4-6 groupes de 4 chiffres)
 * - Adresses IPv4/IPv6 (internes et publiques)
 * - Numéros de sécurité sociale (français - 15 chiffres avec suffixes)
 */

import { logger } from "../lib/logger";
import {
  anonymizeForComplianceCheck,
  anonymizeInvoicesForFinancial,
} from "../lib/piiAnonymizer";
import { PIIAuditLogger } from "../lib/piiAuditLogger";

/**
 * Types de prompts supportés par le middleware
 */
export type PromptType = "compliance" | "financial" | "general" | "email";

interface ProxyRequest {
  type: PromptType;
  data: unknown;
  context?: unknown;
}

/**
 * Patterns Regex pour détecter les formats sensibles.
 * Organisés par catégorie pour maintenance et audit facilitées.
 * NOTE: L'ordre d'application est CRITIQUE - patterns spécifiques avant génériques
 */
export const PII_PATTERNS = {
  // Identifiants fiscaux français (TOUJOURS AVANT patterns génériques IBAN/TVA intra)
  // TVA française : exactement "FR" + 11 chiffres
  tvaFR: /FR\d{11}\b/g,
  // SIRET : exactement 14 chiffres avec limite stricte
  siret: /\bSIRET[\s:]?(\d{14})|\b\d{14}\b(?!\d)/g,
  // SIREN : exactement 9 chiffres avec contexte
  siren: /\bSIREN[\s:]?(\d{9})|\bSIREN\s\d{9}\b/g,

  // Contact & Identité numériques
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Formats français : +33 1 XX XX XX XX (avec espaces), +33612345678 (compact +33), 01 23 45 67 89
  // Pattern conservateur: uniquement formats avec espaces ou +33 pour éviter faux positifs
  phoneFR: /(?:\+33\s[1-9](?:\s\d{2}){4}|\+33[1-9]\d{8}|0[1-9](?:\s\d{2}){4})/g,

  // Identifiants bancaires & financiers (RGPD Art. 37)
  // IBAN français strict : FR + 2 chiffres + structure précise (27 chars)
  ibanFR: /FR\d{2}\s?\d{4}\s?\d{4}\s?[A-Z0-9]{11}\s?\d{2}/g,
  // IBAN générique - STRICT: au moins 15 caractères (trop court = pas IBAN)
  iban: /[A-Z]{2}\d{2}\s?[A-Z0-9]{11,30}\b/g,
  // Carte bancaire (patterns courants : 4-6 groupes de 4 chiffres)
  cardNumber: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,

  // TVA intracommunautaire générique (APRÈS tvaFR pour éviter doublons)
  tvaIntra: /[A-Z]{2}\d{9,12}\b/g,

  // Identité & Sécurité sociale
  // NSS français (15 chiffres avec ou sans espaces)
  ssn: /\b\d{1}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{2}\b|\b\d{15}\b/g,

  // Infrastructure réseau
  ipv4: /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g,
  ipv6: /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g,
  ipv6Compressed: /::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}?/g,

  // Adresses & Localisations
  postalCode: /\b\d{5}\b/g,
} as const;

/**
 * Masques utilisés pour remplacer les données sensibles.
 */
export const PII_MASKS = {
  email: "[EMAIL_CACHÉ]",
  phone: "[TEL_CACHÉ]",
  iban: "[IBAN_CACHÉ]",
  card: "[CARTE_CACHÉ]",
  siret: "[SIRET_CACHÉ]",
  siren: "[SIREN_CACHÉ]",
  tva: "[TVA_CACHÉ]",
  ssn: "[IDENT_CACHÉ]",
  ip: "[IP_CACHÉ]",
  postal: "[CP_CACHÉ]",
} as const;

/**
 * Nettoie les données selon leur type avant envoi à Gemini via le service réel.
 * Applique les Regex de masquage pour tous les formats sensibles détectés.
 */
export class PIIProxyMiddleware {
  /**
   * Filtre les données sensibles et retourne un objet prêt pour geminiService.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async filterRequest(request: ProxyRequest): Promise<any> {
    logger.info(
      "PIIProxyMiddleware",
      `Filtrage en cours pour le type: ${request.type}`,
    );

    switch (request.type) {
      case "compliance":
        return this.handleComplianceFilter(request.data);
      case "financial":
        return this.handleFinancialFilter(request.data);
      case "email":
        return this.handleEmailFilter(request.data);
      default:
        return this.handleGeneralFilter(request.data);
    }
  }

  /**
   * Masque toutes les données sensibles détectées dans une chaîne de caractères.
   * Auto-log chaque détection pour audit et machine learning.
   * @param text Texte à filtrer
   * @param context Contexte d'appel (ex: "email_context", "invoice_query")
   * @param requestType Type de requête (compliance, financial, general, email)
   * @returns Texte avec données sensibles masquées
   */
  // eslint-disable-next-line complexity
  static maskSensitiveData(
    text: string,
    context: string = "general",
    requestType: "compliance" | "financial" | "general" | "email" = "general",
  ): string {
    let masked = text;

    // ORDRE CRITIQUE: Patterns spécifiques AVANT patterns génériques
    // 1. Identifiants fiscaux français (très spécifiques)
    if (PII_PATTERNS.tvaFR.test(masked)) {
      const matches = text.match(PII_PATTERNS.tvaFR) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "tva",
          match,
          PII_MASKS.tva,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.tvaFR, PII_MASKS.tva);
    }

    if (PII_PATTERNS.siret.test(masked)) {
      const matches = text.match(PII_PATTERNS.siret) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "siret",
          match,
          PII_MASKS.siret,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.siret, PII_MASKS.siret);
    }

    if (PII_PATTERNS.siren.test(masked)) {
      const matches = text.match(PII_PATTERNS.siren) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "siren",
          match,
          PII_MASKS.siren,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.siren, PII_MASKS.siren);
    }

    // 2. Contact & Identité générales
    if (PII_PATTERNS.email.test(masked)) {
      const matches = text.match(PII_PATTERNS.email) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "email",
          match,
          PII_MASKS.email,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.email, PII_MASKS.email);
    }

    if (PII_PATTERNS.phoneFR.test(masked)) {
      const matches = text.match(PII_PATTERNS.phoneFR) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "phoneFR",
          match,
          PII_MASKS.phone,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.phoneFR, PII_MASKS.phone);
    }

    // 3. Identifiants bancaires (IBAN français d'abord)
    if (PII_PATTERNS.ibanFR.test(masked)) {
      const matches = text.match(PII_PATTERNS.ibanFR) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "iban",
          match,
          PII_MASKS.iban,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.ibanFR, PII_MASKS.iban);
    }

    if (PII_PATTERNS.iban.test(masked)) {
      const matches = text.match(PII_PATTERNS.iban) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "iban",
          match,
          PII_MASKS.iban,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.iban, PII_MASKS.iban);
    }

    if (PII_PATTERNS.cardNumber.test(masked)) {
      const matches = text.match(PII_PATTERNS.cardNumber) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "card",
          match,
          PII_MASKS.card,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.cardNumber, PII_MASKS.card);
    }

    // 4. TVA intracommunautaire générique (APRÈS tvaFR)
    if (PII_PATTERNS.tvaIntra.test(masked)) {
      const matches = text.match(PII_PATTERNS.tvaIntra) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "tva",
          match,
          PII_MASKS.tva,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.tvaIntra, PII_MASKS.tva);
    }

    // 5. Identité & SSN
    if (PII_PATTERNS.ssn.test(masked)) {
      const matches = text.match(PII_PATTERNS.ssn) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "ssn",
          match,
          PII_MASKS.ssn,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.ssn, PII_MASKS.ssn);
    }

    // 6. Infrastructure (moins critique)
    if (PII_PATTERNS.ipv4.test(masked)) {
      const matches = text.match(PII_PATTERNS.ipv4) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "ip",
          match,
          PII_MASKS.ip,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.ipv4, PII_MASKS.ip);
    }

    if (PII_PATTERNS.ipv6.test(masked)) {
      const matches = text.match(PII_PATTERNS.ipv6) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "ip",
          match,
          PII_MASKS.ip,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.ipv6, PII_MASKS.ip);
    }

    if (PII_PATTERNS.ipv6Compressed.test(masked)) {
      const matches = text.match(PII_PATTERNS.ipv6Compressed) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "ip",
          match,
          PII_MASKS.ip,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.ipv6Compressed, PII_MASKS.ip);
    }

    if (PII_PATTERNS.postalCode.test(masked)) {
      const matches = text.match(PII_PATTERNS.postalCode) ?? [];
      matches.forEach((match) => {
        PIIAuditLogger.logDetection(
          "postal",
          match,
          PII_MASKS.postal,
          context,
          requestType,
        );
      });
      masked = masked.replace(PII_PATTERNS.postalCode, PII_MASKS.postal);
    }

    if (masked !== text) {
      logger.debug(
        "PIIProxyMiddleware",
        "Données sensibles détectées et masquées",
        {
          context,
          originalLength: text.length,
          maskedLength: masked.length,
        },
      );
    }

    return masked;
  }

  /**
   * Détecte si une chaîne contient des données sensibles.
   * Utile pour les logs et l'audit.
   */
  static hasSensitiveData(text: string): boolean {
    return Object.values(PII_PATTERNS).some((pattern) => pattern.test(text));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static handleComplianceFilter(data: any) {
    const { invoice, userProfile, client } = data;
    // Utilise l'anonymiseur existant qui remplace les PII par des booléens
    const anonymized = anonymizeForComplianceCheck(
      invoice,
      userProfile,
      client,
    );
    return anonymized;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static handleFinancialFilter(data: any) {
    const { invoices } = data;
    // Supprime les noms de clients et détails personnels, garde montants et dates
    return anonymizeInvoicesForFinancial(invoices);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static handleEmailFilter(data: any) {
    // Pour les emails, on remplace systématiquement les noms par des placeholders
    // si le développeur a oublié de le faire.
    return {
      ...data,
      clientName: "[CLIENT_ANONYMISÉ]",
      companyName: "[MA_SOCIÉTÉ]",
      invoiceNumber: data.invoiceNumber ? "FAC-XXXX" : undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static handleGeneralFilter(data: any) {
    if (typeof data === "string") {
      // Applique le masquage complet des données sensibles avec logging
      const masked = this.maskSensitiveData(data, "general_query", "general");
      if (masked !== data) {
        logger.warn(
          "PIIProxyMiddleware",
          "Données sensibles détectées et masquées",
          {
            originalLength: data.length,
            maskedLength: masked.length,
          },
        );
      }
      return masked;
    }
    return data;
  }
}
