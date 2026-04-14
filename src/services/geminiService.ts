import { GoogleGenAI } from '@google/genai';
import { db } from '../db/invoiceDB';
import type { ChatMessage, Invoice } from '../types';

const apiKey = process.env.GEMINI_API_KEY || '';
// Initialize securely - assumes environment variable is injected at build time via Vite define
const ai = new GoogleGenAI({ apiKey });

/**
 * Sanitizes user-controlled string input before embedding in AI prompts
 * to mitigate prompt injection attacks (CodeQL: js/prompt-injection).
 * Removes non-printable control characters and enforces a maximum length.
 */
function sanitizeForPrompt(input: string, maxLength = 1000): string {
  return String(input)
    .replaceAll(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/gu, ' ') // eslint-disable-line no-control-regex
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
    return '{}';
  }
}

export const generateAssistantResponse = async (
  query: string,
  context?: string
): Promise<string> => {
  try {
    const model = 'gemini-2.0-flash';

    // System instruction contains ONLY trusted static instructions — no user data
    const systemPrompt = `Tu es un assistant expert pour les auto-entrepreneurs en France.
    Tu connais les règles de l'URSSAF, les seuils de TVA (Franchise en base), les plafonds de Chiffre d'Affaires, et les obligations de facturation.
    Réponds de manière concise, professionnelle et utile.
    Si on te demande de rédiger un email ou un texte, fais-le avec un ton courtois.`;

    // User-controlled data goes into `contents` (user role), never in system instructions
    const sanitizedQuery = sanitizeForPrompt(query, 2000);
    const sanitizedContext = context ? sanitizeForPrompt(context, 500) : null;
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

    return response.text || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error('Erreur Gemini:', error);
    return "Une erreur est survenue lors de la consultation de l'assistant IA. Veuillez vérifier votre clé API.";
  }
};

export const suggestInvoiceDescription = async (
  clientName: string,
  serviceType: string
): Promise<string> => {
  try {
    const safeClientName = sanitizeForPrompt(clientName, 100);
    const safeServiceType = sanitizeForPrompt(serviceType, 200);
    const prompt = `Génère une description professionnelle courte pour une ligne de facture destinée au client "${safeClientName}" pour un service de type : "${safeServiceType}".
     La description doit être claire et formelle. Ne donne que la description, pas de guillemets.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text?.trim() || serviceType;
  } catch (error) {
    console.error('Erreur Gemini:', error);
    return serviceType;
  }
};

export const generateInvoiceItemsFromPrompt = async (
  prompt: string
): Promise<Array<{ description: string; quantity: number; unitPrice: number; unit: string }>> => {
  try {
    const systemPrompt = `Tu es un assistant de facturation.
    L'utilisateur va te donner une description de ce qu'il veut facturer.
    Tu dois extraire les articles, quantités et prix unitaires probables.
    Réponds UNIQUEMENT avec un tableau JSON d'objets ayant les propriétés : description (string), quantity (number), unitPrice (number), unit (string).
    Exemple : [{"description": "Consulting IT", "quantity": 3, "unitPrice": 500, "unit": "jour"}]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: sanitizeForPrompt(prompt, 2000),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (error) {
    console.error('Erreur Gemini (generateInvoiceItems):', error);
    return [];
  }
};

export const draftEmail = async (context: {
  clientName: string;
  invoiceNumber?: string;
  total?: string;
  purpose: string;
  tone: 'formal' | 'friendly' | 'urgent';
  companyName: string;
}): Promise<{ subject: string; body: string }> => {
  try {
    const safeCompanyName = sanitizeForPrompt(context.companyName, 100);
    const safeClientName = sanitizeForPrompt(context.clientName, 100);
    const safeInvoiceNumber = context.invoiceNumber
      ? sanitizeForPrompt(context.invoiceNumber, 50)
      : null;
    const safeTotal = context.total ? sanitizeForPrompt(context.total, 50) : null;
    const safePurpose = sanitizeForPrompt(context.purpose, 500);
    const prompt = `Rédige un email professionnel en français.
    Contexte :
    - Expéditeur : ${safeCompanyName}
    - Destinataire : ${safeClientName}
    ${safeInvoiceNumber ? `- Numéro de facture : ${safeInvoiceNumber}` : ''}
    ${safeTotal ? `- Montant total : ${safeTotal}€` : ''}
    - Objectif : ${safePurpose}
    - Ton : ${context.tone}

    Réponds UNIQUEMENT avec un objet JSON ayant les propriétés : subject (string), body (string).
    Le corps de l'email doit être bien structuré avec des sauts de ligne.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{"subject": "", "body": ""}';
    return JSON.parse(text);
  } catch (error) {
    console.error('Erreur Gemini (draftEmail):', error);
    return { subject: 'Draft', body: 'Erreur lors de la génération du brouillon.' };
  }
};

export const analyzeReceipt = async (
  base64Image: string,
  mimeType: string
): Promise<{
  date: string;
  description: string;
  amount: number;
  vatAmount: number;
  vatRate: number;
  supplierName: string;
} | null> => {
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
      model: 'gemini-2.0-flash',
      contents: {
        parts: [{ text: prompt }, { inlineData: { data: base64Image, mimeType } }],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error('Erreur Gemini (analyzeReceipt):', error);
    return null;
  }
};

export const predictRevenue = async (history: Invoice[], quotes: Invoice[]): Promise<string> => {
  try {
    const safeHistory = serializeForPrompt(history);
    const safeQuotes = serializeForPrompt(quotes);
    const prompt = `En tant qu'expert financier pour micro-entrepreneur, analyse l'historique de chiffre d'affaires (factures payées) et les devis en cours (acceptés ou en attente) pour prédire le chiffre d'affaires du mois prochain.

    Historique (Invoices Paid): ${safeHistory}
    Devis en cours (Quotes): ${safeQuotes}

    Donne une estimation chiffrée et une brève explication de ton raisonnement.
    Réponds de manière concise en français.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text || 'Impossible de générer une prédiction.';
  } catch (error) {
    console.error('Erreur Gemini (predictRevenue):', error);
    return 'Erreur lors de la prédiction.';
  }
};

/**
 * Analyse une facture pour détecter des anomalies ou des manques légaux
 */
export const checkInvoiceCompliance = async (
  invoice: Invoice,
  userProfile: Record<string, unknown>,
  client: Record<string, unknown>
): Promise<{
  isCompliant: boolean;
  issues: string[];
  suggestions: string[];
}> => {
  try {
    const safeInvoice = serializeForPrompt(invoice);
    const safeProfile = serializeForPrompt(userProfile, 3000);
    const safeClient = serializeForPrompt(client, 2000);
    const prompt = `Analyse la conformité légale de cette facture pour un micro-entrepreneur français (Régime 2026).

    FACTURE: ${safeInvoice}
    MON ENTREPRISE: ${safeProfile}
    CLIENT: ${safeClient}

    Vérifie spécifiquement:
    1. Présence du SIRET et de l'adresse (émetteur et client).
    2. Mentions obligatoires si exonéré de TVA (Art. 293 B du CGI).
    3. Mentions "EI" ou "Entrepreneur Individuel" à côté du nom.
    4. Date d'émission et date d'échéance.
    5. Pénalités de retard et indemnité forfaitaire (40€).

    Réponds UNIQUEMENT avec un objet JSON ayant les propriétés :
    - isCompliant (boolean)
    - issues (string array, liste des problèmes trouvés)
    - suggestions (string array, comment corriger)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text =
      response.text || '{"isCompliant": false, "issues": ["Erreur de réponse"], "suggestions": []}';
    return JSON.parse(text);
  } catch (error) {
    console.error('Erreur Gemini (checkInvoiceCompliance):', error);
    return { isCompliant: false, issues: ['Erreur de service'], suggestions: [] };
  }
};

/**
 * Prédiction de trésorerie à 30 jours basée sur les factures et le comportement passé
 */
export const predictCashflowJ30 = async (
  invoices: Invoice[],
  userProfile: Record<string, unknown>
): Promise<{
  predictedBalance: number;
  confidence: number;
  analysis: string;
  riskLevel: 'low' | 'medium' | 'high';
}> => {
  try {
    const rawActivityType = (userProfile as Record<string, string>).activityType;
    const activityType = sanitizeForPrompt(
      typeof rawActivityType === 'string' ? rawActivityType : 'SERVICES',
      50
    );
    const safeInvoices = serializeForPrompt(invoices);
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
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text =
      response.text ||
      '{"predictedBalance": 0, "confidence": 0, "analysis": "N/A", "riskLevel": "low"}';
    return JSON.parse(text);
  } catch (error) {
    console.error('Erreur Gemini (predictCashflowJ30):', error);
    return { predictedBalance: 0, confidence: 0, analysis: "Erreur d'analyse", riskLevel: 'low' };
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
      .orderBy('timestamp')
      .limit(count - CHAT_MESSAGES_LIMIT)
      .primaryKeys();
    await db.chatMessages.bulkDelete(oldest as string[]);
  }
};
