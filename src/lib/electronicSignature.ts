import type { Invoice, UserProfile } from "../types";

/**
 * Génère une signature numérique simple pour une facture (non-cryptographique).
 * Pour une signature légalement contraignante, utiliser un service tiers certifié.
 */
export async function signInvoice(
  invoice: Invoice,
  userProfile: UserProfile,
  _privateKey?: string,
): Promise<{ signature: string; timestamp: string }> {
  const timestamp = new Date().toISOString();
  const payload = `${invoice.id}|${invoice.number}|${invoice.total}|${userProfile.siret}|${timestamp}`;

  // Encodage Base64 du payload comme signature simplifiée
  const signature = btoa(encodeURIComponent(payload));

  return { signature, timestamp };
}

/**
 * Vérifie une signature générée par signInvoice.
 */
export async function verifySignature(
  invoice: Invoice,
  signature: string,
  _publicKey: string,
): Promise<boolean> {
  try {
    const decoded = decodeURIComponent(atob(signature));
    return decoded.startsWith(
      `${invoice.id}|${invoice.number}|${invoice.total}`,
    );
  } catch {
    return false;
  }
}
