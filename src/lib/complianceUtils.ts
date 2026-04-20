import type { UserProfile } from "../types";

export interface ComplianceStatus {
  isCompliant: boolean;
  score: number; // 0 to 100
  missingFields: string[];
  recommendations: string[];
}

/**
 * Calcule le statut de conformité Factur-X 2026 d'un profil
 */
export const checkCompliance2026 = (profile: UserProfile): ComplianceStatus => {
  const missingFields: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Champs obligatoires pour Factur-X 2026
  if (!profile.companyName) {
    missingFields.push("Raison sociale");
    score -= 20;
  }

  if (!profile.siret) {
    missingFields.push("Numéro SIRET");
    score -= 20;
  }

  if (!profile.address || profile.address.length < 10) {
    missingFields.push("Adresse complète");
    score -= 15;
  }

  if (!profile.email) {
    missingFields.push("Email de contact");
    score -= 10;
  }

  // Vérification TVA (obligatoire même si exonéré pour Factur-X)
  if (!profile.tvaNumber && !profile.isVatExempt) {
    missingFields.push("Numéro de TVA Intracommunautaire");
    score -= 15;
  }

  if (profile.isVatExempt && !profile.vatExemptionReason) {
    missingFields.push(
      "Mention légale d'exonération de TVA (ex: Art. 293 B du CGI)",
    );
    score -= 10;
  }

  // Mentions spécifiques 2026 (EI pour entrepreneur individuel)
  const hasEiMention =
    profile.companyName?.toUpperCase().includes(" EI") ||
    profile.companyName?.toUpperCase().includes("ENTREPRENEUR INDIVIDUEL");

  if (!hasEiMention) {
    recommendations.push(
      "Ajoutez la mention 'EI' ou 'Entrepreneur Individuel' à votre raison sociale (obligation 2022/2026)",
    );
    score -= 5;
  }

  if (!profile.bankAccount) {
    missingFields.push("Coordonnées bancaires (IBAN)");
    score -= 10;
  }

  return {
    isCompliant: score >= 90 && missingFields.length === 0,
    score: Math.max(0, score),
    missingFields,
    recommendations,
  };
};
