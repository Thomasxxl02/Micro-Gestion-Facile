/**
 * Anonymisation des données personnelles avant envoi à un LLM cloud.
 *
 * Conformité RGPD Art. 28 : traitement par un sous-traitant (Gemini/Google)
 * → minimisation obligatoire des données à caractère personnel.
 *
 * Principe : seules les métadonnées structurelles (montants, dates, types, booléens de présence)
 * sont transmises. Aucun SIRET, nom, adresse ou coordonnée réelle ne quitte le navigateur.
 *
 * Les pseudonymes de session permettent une corrélation *au sein d'un même appel*,
 * sans persistance inter-sessions (réinitialisés au rechargement de la page).
 */

import type { Client, Invoice, UserProfile } from "../types";

// ─── Pseudonymisation de session ─────────────────────────────────────────────

const sessionPseudoMap = new Map<string, string>();
let pseudoCounter = 0;

/** Retourne un pseudonyme stable pour la session en cours (ex: "Entité_3"). */
function pseudonymize(realValue: string): string {
  if (!sessionPseudoMap.has(realValue)) {
    pseudoCounter++;
    sessionPseudoMap.set(realValue, `Entité_${pseudoCounter}`);
  }
  return sessionPseudoMap.get(realValue)!;
}

// ─── Types exportés ──────────────────────────────────────────────────────────

/** Métadonnées anonymisées d'une facture pour vérification de conformité légale. */
export interface AnonymizedInvoiceForCompliance {
  number: string; // conservé : numéro de facture non-PII
  date: string;
  dueDate: string;
  type: string;
  status: string;
  taxExempt: boolean;
  total: number;
  vatAmount: number;
  itemCount: number;
  /** Présence du SIRET vendeur (sans la valeur) */
  hasSellerSiret: boolean;
  hasSellerAddress: boolean;
  hasSellerCompanyName: boolean;
  /** Présence de la mention "EI" / "Entrepreneur Individuel" */
  hasEiMention: boolean;
  /** Présence des détails acheteur */
  hasBuyerName: boolean;
  hasBuyerAddress: boolean;
  hasBuyerSiret: boolean;
  /** La facture mentionne-t-elle les pénalités de retard ? */
  hasPenaltyClause: boolean;
}

/** Métadonnées anonymisées d'une facture pour analyse financière (cashflow, prédiction CA). */
export interface AnonymizedInvoiceFinancial {
  pseudoClientId: string; // identifiant pseudonymisé, corrélable dans l'appel
  date: string;
  dueDate: string;
  status: string;
  total: number;
  vatAmount: number;
  type: string;
}

// ─── Fonctions d'anonymisation ───────────────────────────────────────────────

/**
 * Prépare les données pour l'analyse de conformité LLM.
 * Les PII (SIRET, noms, adresses) sont remplacées par des indicateurs booléens.
 */
export function anonymizeForComplianceCheck(
  invoice: Invoice,
  userProfile: UserProfile,
  client: Client,
): {
  invoice: AnonymizedInvoiceForCompliance;
  activityType: string | undefined;
  isVatExempt: boolean | undefined;
} {
  const companyName = userProfile.companyName ?? "";
  const professionalTitle = userProfile.professionalTitle ?? "";
  const eiKeywords = ["ei", "entrepreneur individuel"];
  const hasEiMention = eiKeywords.some(
    (kw) =>
      companyName.toLowerCase().includes(kw) ||
      professionalTitle.toLowerCase().includes(kw),
  );

  return {
    invoice: {
      number: invoice.number,
      date: invoice.date,
      dueDate: invoice.dueDate,
      type: invoice.type,
      status: invoice.status,
      taxExempt: !!(invoice.taxExempt ?? userProfile.isVatExempt),
      total: invoice.total,
      vatAmount: invoice.vatAmount ?? 0,
      itemCount: invoice.items.length,
      hasSellerSiret: !!userProfile.siret?.trim(),
      hasSellerAddress: !!userProfile.address?.trim(),
      hasSellerCompanyName: !!companyName.trim(),
      hasEiMention,
      hasBuyerName: !!client.name?.trim(),
      hasBuyerAddress: !!client.address?.trim(),
      hasBuyerSiret: !!client.siret?.trim(),
      hasPenaltyClause:
        invoice.notes?.toLowerCase().includes("pénalité") === true ||
        invoice.notes?.toLowerCase().includes("retard") === true,
    },
    activityType: userProfile.activityType,
    isVatExempt: userProfile.isVatExempt,
  };
}

/**
 * Prépare un tableau de factures pour l'analyse financière (cashflow/prédiction).
 * Conserve uniquement les données économiques agrégées, sans identifiants réels.
 */
export function anonymizeInvoicesForFinancial(
  invoices: Invoice[],
): AnonymizedInvoiceFinancial[] {
  return invoices.map((inv) => ({
    pseudoClientId: pseudonymize(inv.clientId),
    date: inv.date,
    dueDate: inv.dueDate,
    status: inv.status,
    total: inv.total,
    vatAmount: inv.vatAmount ?? 0,
    type: inv.type,
  }));
}
