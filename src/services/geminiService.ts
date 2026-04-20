import { GoogleGenAI } from "@google/genai";
import { db } from "../db/invoiceDB";
import { logger } from "../lib/logger";
import {
  anonymizeForComplianceCheck,
  anonymizeInvoicesForFinancial,
} from "../lib/piiAnonymizer";
import { rateLimiter } from "../lib/rateLimiter";
import type { ChatMessage, Client, Invoice, UserProfile } from "../types";
import { PIIProxyMiddleware } from "./piiProxyMiddleware";

// Helper type pour accéder aux variables d'environnement Vite de manière typée
interface ViteEnv {
  VITE_GEMINI_API_KEY?: string;
}

const apiKey =
  (import.meta.env as unknown as ViteEnv)?.VITE_GEMINI_API_KEY ?? "";
// Initialize securely - assumes environment variable is injected at build time via Vite define
const ai = new GoogleGenAI({ apiKey });

/**
 * Sanitizes user-controlled string input before embedding in AI prompts
 * to mitigate prompt injection attacks (CodeQL: js/prompt-injection).
 * Removes non-printable control characters and enforces a maximum length.
 */
function sanitizeForPrompt(input: string, maxLength = 1000): string {
  return String(input)
    .replaceAll(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/gu, " ") // eslint-disable-line no-control-regex
    .trim()
    .slice(0, maxLength);
}

/**
 * Safely serializes structured data for use in AI prompts.
 * Limits output size to prevent context flooding and prompt manipulation.
 */
function serializeForPrompt(data: unknown, maxLength = 8000): string {
  try {
    return JSON.stringify(data).slice(0, maxLength);
  } catch {
    return "{}";
  }
}

/**
 * Helper pour convertir une erreur en objet structuré de manière sûre
 */
function formatErrorData(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  return error as Record<string, unknown>;
}

export const generateAssistantResponse = async (
  query: string,
  context?: string,
): Promise<string> => {
  // Rate limited execution with high priority (user-facing)
  return rateLimiter.execute(async () => {
    try {
      const model = "gemini-2.0-flash";

      // Filtrage PII préventif sur la requête utilisateur
      const filteredQuery = await PIIProxyMiddleware.filterRequest({
        type: "general",
        data: query,
      });

      // System instruction contains ONLY trusted static instructions — no user data
      const systemPrompt = `Tu es un assistant expert pour les auto-entrepreneurs en France.
    Tu connais les règles de l'URSSAF, les seuils de TVA (Franchise en base), les plafonds de Chiffre d'Affaires, et les obligations de facturation.
    Réponds de manière concise, professionnelle et utile.
    Si on te demande de rédiger un email ou un texte, fais-le avec un ton courtois.`;

      // User-controlled data goes into `contents` (user role), never in system instructions
      const sanitizedQuery = sanitizeForPrompt(filteredQuery, 2000);
      const sanitizedContext = context
        ? sanitizeForPrompt(
            await PIIProxyMiddleware.filterRequest({
              type: "general",
              data: context,
            }),
            500,
          )
        : null;
      const userContent = sanitizedContext
        ? `Contexte : ${sanitizedContext}\n\n${sanitizedQuery}`
        : sanitizedQuery;

      const response = await ai.models.generateContent({
        model: model,
        contents: userContent,
        config: {
          systemInstruction: systemPrompt,
          thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster simple Q&A
        },
      });

      const result =
        response.text ?? "Désolé, je n'ai pas pu générer de réponse.";
      logger.info("GeminiService", "generateAssistantResponse success", {
        queryLength: query.length,
      });
      return result;
    } catch (error) {
      const errorData = formatErrorData(error);
      logger.error(
        "GeminiService",
        "generateAssistantResponse failed",
        errorData,
      );
      throw error;
    }
  }, "high");
};

export const suggestInvoiceDescription = async (
  _clientName: string, // ignoré — PII non transmise au LLM (RGPD Art. 28)
  serviceType: string,
): Promise<string> => {
  // Rate limited execution with normal priority (background task)
  return rateLimiter.execute(async () => {
    try {
      const safeServiceType = sanitizeForPrompt(serviceType, 200);
      // Le nom du client n'est pas envoyé : seul le type de service est nécessaire
      // pour générer une description professionnelle pertinente.
      const prompt = `Génère une description professionnelle courte pour une ligne de facture pour un service de type : "${safeServiceType}".
     La description doit être claire et formelle. Ne donne que la description, pas de guillemets.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      return response.text?.trim() ?? serviceType;
    } catch (error) {
      const errorData = formatErrorData(error);
      logger.warn(
        "GeminiService",
        "suggestInvoiceDescription failed, returning fallback",
        errorData,
      );
      return serviceType;
    }
  }, "normal");
};

export const generateInvoiceItemsFromPrompt = async (
  prompt: string,
): Promise<
  Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string;
  }>
> => {
  // Rate limited execution with high priority (user-facing form filling)
  return rateLimiter.execute(async () => {
    try {
      const systemPrompt = `Tu es un assistant de facturation.
    L'utilisateur va te donner une description de ce qu'il veut facturer.
    Tu dois extraire les articles, quantités et prix unitaires probables.
    Réponds UNIQUEMENT avec un tableau JSON d'objets ayant les propriétés : description (string), quantity (number), unitPrice (number), unit (string).
    Exemple : [{"description": "Consulting IT", "quantity": 3, "unitPrice": 500, "unit": "jour"}]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: sanitizeForPrompt(prompt, 2000),
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const text = response.text ?? "[]";
      return JSON.parse(text);
    } catch (error) {
      const errorData = formatErrorData(error);
      logger.warn(
        "GeminiService",
        "generateInvoiceItemsFromPrompt failed, returning empty array",
        errorData,
      );
      return [];
    }
  }, "high");
};

export const draftEmail = async (context: {
  clientName: string;
  invoiceNumber?: string;
  total?: string;
  purpose: string;
  tone: "formal" | "friendly" | "urgent";
  companyName: string;
}): Promise<{ subject: string; body: string }> => {
  // Rate limited execution with high priority (user writing task)
  return rateLimiter.execute(async () => {
    try {
      const filteredContext = await PIIProxyMiddleware.filterRequest({
        type: "email",
        data: context,
      });

      const safeCompanyName = sanitizeForPrompt(
        filteredContext.companyName,
        100,
      );
      const safeClientName = sanitizeForPrompt(filteredContext.clientName, 100);
      const safeInvoiceNumber = filteredContext.invoiceNumber
        ? sanitizeForPrompt(filteredContext.invoiceNumber, 50)
        : null;
      const safeTotal = filteredContext.total
        ? sanitizeForPrompt(filteredContext.total, 50)
        : null;
      const safePurpose = sanitizeForPrompt(filteredContext.purpose, 500);
      const prompt = `Rédige un email professionnel en français.
    Contexte :
    - Expéditeur : ${safeCompanyName}
    - Destinataire : ${safeClientName}
    ${safeInvoiceNumber ? `- Numéro de facture : ${safeInvoiceNumber}` : ""}
    ${safeTotal ? `- Montant total : ${safeTotal}€` : ""}
    - Objectif : ${safePurpose}
    - Ton : ${filteredContext.tone}

    Réponds UNIQUEMENT avec un objet JSON ayant les propriétés : subject (string), body (string).
    Le corps de l'email doit être bien structuré avec des sauts de ligne.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text ?? '{"subject": "", "body": ""}';
      return JSON.parse(text);
    } catch (error) {
      const errorData = formatErrorData(error);
      logger.warn(
        "GeminiService",
        "draftEmail failed, returning fallback",
        errorData,
      );
      return {
        subject: "Draft",
        body: "Erreur lors de la génération du brouillon.",
      };
    }
  }, "high");
};

export const analyzeReceipt = async (
  base64Image: string,
  mimeType: string,
): Promise<{
  date: string;
  description: string;
  amount: number;
  vatAmount: number;
  vatRate: number;
  supplierName: string;
} | null> => {
  // Rate limited execution with normal priority (background scanning)
  return rateLimiter.execute(async () => {
    try {
      const prompt = `Analyse ce ticket de caisse et extrais les informations suivantes au format JSON :
    - date (string au format YYYY-MM-DD)
    - description (string courte du type d'achat)
    - amount (number, montant total TTC)
    - vatAmount (number, montant de la TVA si présent, sinon 0)
    - vatRate (number, taux de TVA en pourcentage si présent, sinon 0)
    - supplierName (string, nom du fournisseur/magasin)

    Réponds UNIQUEMENT avec l'objet JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } },
          ],
        },
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text ?? "{}";
      return JSON.parse(text);
    } catch (error) {
      const errorData = formatErrorData(error);
      logger.warn(
        "GeminiService",
        "analyzeReceipt failed, returning null",
        errorData,
      );
      return null;
    }
  }, "normal");
};

/**
 * Get current rate limiter metrics (for UI/monitoring)
 */
export function getGeminiLimiterMetrics() {
  return rateLimiter.getMetrics();
}

/**
 * Get queue status (for UI feedback)
 */
export function getGeminiQueueStatus() {
  return rateLimiter.getQueueStatus();
}

export const predictRevenue = async (
  history: Invoice[],
  quotes: Invoice[],
): Promise<string> => {
  try {
    // Anonymisation : montants et dates uniquement, sans noms ni SIRET
    const safeHistory = serializeForPrompt(
      anonymizeInvoicesForFinancial(history),
    );
    const safeQuotes = serializeForPrompt(
      anonymizeInvoicesForFinancial(quotes),
    );
    const prompt = `En tant qu'expert financier pour micro-entrepreneur, analyse l'historique de chiffre d'affaires (factures payées) et les devis en cours (acceptés ou en attente) pour prédire le chiffre d'affaires du mois prochain.

    Historique (Invoices Paid): ${safeHistory}
    Devis en cours (Quotes): ${safeQuotes}

    Donne une estimation chiffrée et une brève explication de ton raisonnement.
    Réponds de manière concise en français.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return response.text ?? "Impossible de générer une prédiction.";
  } catch (error) {
    console.error("Erreur Gemini (predictRevenue):", error);
    return "Erreur lors de la prédiction.";
  }
};

/**
 * Analyse une facture pour détecter des anomalies ou des manques légaux.
 * Les données PII (SIRET, noms, adresses) sont anonymisées avant envoi au LLM
 * — seuls les indicateurs de présence (booléens) sont transmis (RGPD Art. 28).
 */
export const checkInvoiceCompliance = async (
  invoice: Invoice,
  userProfile: UserProfile,
  client: Client,
): Promise<{
  isCompliant: boolean;
  issues: string[];
  suggestions: string[];
}> => {
  try {
    // Anonymisation : aucun SIRET, nom ou adresse réel n'est transmis au LLM
    const anonymized = anonymizeForComplianceCheck(
      invoice,
      userProfile,
      client,
    );
    const safeInvoice = serializeForPrompt(anonymized.invoice);
    const safeMeta = serializeForPrompt({
      activityType: anonymized.activityType,
      isVatExempt: anonymized.isVatExempt,
    });
    const prompt = `Analyse la conformité légale de cette facture pour un micro-entrepreneur français (Régime 2026).
Les données sont des indicateurs de présence/absence (booléens) — ne demande pas les valeurs réelles.

    MÉTADONNÉES FACTURE: ${safeInvoice}
    PROFIL ACTIVITÉ: ${safeMeta}

    Vérifie spécifiquement:
    1. hasSellerSiret: le SIRET vendeur est-il renseigné ?
    2. isVatExempt + taxExempt: si exonéré de TVA, la mention Art. 293 B CGI est-elle implicite ?
    3. hasEiMention: la mention "EI" / "Entrepreneur Individuel" est-elle présente ?
    4. date + dueDate: dates d'émission et d'échéance présentes ?
    5. hasPenaltyClause: les pénalités de retard (40€ forfait) sont-elles mentionnées ?

    Réponds UNIQUEMENT avec un objet JSON ayant les propriétés :
    - isCompliant (boolean)
    - issues (string array, liste des problèmes trouvés)
    - suggestions (string array, comment corriger)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text =
      response.text ??
      '{"isCompliant": false, "issues": ["Erreur de réponse"], "suggestions": []}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Erreur Gemini (checkInvoiceCompliance):", error);
    return {
      isCompliant: false,
      issues: ["Erreur de service"],
      suggestions: [],
    };
  }
};

/**
 * Prédiction de trésorerie à 30 jours basée sur les factures et le comportement passé
 */
export const predictCashflowJ30 = async (
  invoices: Invoice[],
  userProfile: UserProfile,
): Promise<{
  predictedBalance: number;
  confidence: number;
  analysis: string;
  riskLevel: "low" | "medium" | "high";
}> => {
  try {
    const activityType = sanitizeForPrompt(
      typeof userProfile.activityType === "string"
        ? userProfile.activityType
        : "SERVICES",
      50,
    );
    // Anonymisation : les noms clients et SIRET sont remplacés par des pseudonymes de session
    const safeInvoices = serializeForPrompt(
      anonymizeInvoicesForFinancial(invoices),
    );
    const prompt = `En tant qu'analyste financier, prédis la trésorerie à 30 jours pour ce micro-entrepreneur.
    Considère :
    - Les factures impayées et leur date d'échéance.
    - L'historique des paiements (si les clients paient souvent en retard).
    - Les charges sociales à prévoir (basé sur le CA encaissé).

    DONNÉES: ${safeInvoices}
    PROFIL ACTIVITÉ: ${activityType}

    Réponds UNIQUEMENT avec un objet JSON :
    - predictedBalance (number, solde estimé en plus par rapport à aujourd'hui)
    - confidence (number entre 0 et 1)
    - analysis (string courte en français expliquant le calcul)
    - riskLevel (string: 'low', 'medium' ou 'high')
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text =
      response.text ??
      '{"predictedBalance": 0, "confidence": 0, "analysis": "N/A", "riskLevel": "low"}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Erreur Gemini (predictCashflowJ30):", error);
    return {
      predictedBalance: 0,
      confidence: 0,
      analysis: "Erreur d'analyse",
      riskLevel: "low",
    };
  }
};

/** Limite maximale de messages conservés dans Dexie */
const CHAT_MESSAGES_LIMIT = 200;

/**
 * Persiste un message dans Dexie et élimine les plus anciens si le quota
 * de CHAT_MESSAGES_LIMIT est dépassé.
 */
export const saveMessage = async (message: ChatMessage): Promise<void> => {
  await db.chatMessages.put(message);

  const count = await db.chatMessages.count();
  if (count > CHAT_MESSAGES_LIMIT) {
    const oldest = await db.chatMessages
      .orderBy("timestamp")
      .limit(count - CHAT_MESSAGES_LIMIT)
      .primaryKeys();
    await db.chatMessages.bulkDelete(oldest as string[]);
  }
};
