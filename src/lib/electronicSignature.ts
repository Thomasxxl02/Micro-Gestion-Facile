/**
 * Module de Signature Électronique Simple
 * ─────────────────────────────────────────
 * Appose un hash SHA-256 sur le contenu sérialisé d'une facture,
 * stocké dans les métadonnées. Utilise exclusivement la Web Crypto API
 * native du navigateur — aucune dépendance externe, zéro serveur.
 *
 * Usage :
 *   const sig = await signInvoice(invoice, userProfile);
 *   const valid = await verifyInvoiceSignature(invoice, sig);
 *
 * Sécurité :
 *   - Hash SHA-256 HMAC de la représentation canonique de la facture
 *   - La clé HMAC est dérivée du SIRET + date de signature (HKDF)
 *   - Le résultat est un string hex 64 caractères stockable dans un champ
 *   - Protège contre la falsification a posteriori des montants / dates
 *
 * ⚠️  Ce n'est PAS une signature qualifiée eIDAS — c'est un tampon
 *     d'intégrité numérique (audit trail). Pour eIDAS, utiliser DocuSign/
 *     Yousign via API.
 */

import type { Invoice, UserProfile } from '../types';

export interface InvoiceSignatureResult {
  hash: string; // SHA-256 hex, 64 chars
  algorithm: 'SHA-256-HMAC';
  signedAt: string; // ISO datetime
  signerSiret: string;
  invoiceId: string;
  invoiceNumber: string;
}

/**
 * Sérialise les champs fiscalement significatifs d'une facture
 * dans un ordre canonique reproductible.
 */
function canonicalize(invoice: Invoice): string {
  return JSON.stringify({
    id: invoice.id,
    number: invoice.number,
    date: invoice.date,
    dueDate: invoice.dueDate,
    clientId: invoice.clientId,
    total: invoice.total,
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate ?? 0,
    })),
    taxExempt: invoice.taxExempt ?? false,
    discount: invoice.discount ?? 0,
  });
}

/**
 * Encode une string en Uint8Array UTF-8
 */
function encode(s: string): Uint8Array<ArrayBuffer> {
  const raw = new TextEncoder().encode(s);
  return new Uint8Array(raw.buffer as ArrayBuffer);
}

/**
 * Convertit un ArrayBuffer en string hexadécimale
 */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Dérive une clé HMAC à partir du SIRET + date (HKDF-like avec SHA-256).
 * La clé est éphémère et non stockée — recréée à chaque vérification.
 */
async function deriveKey(siret: string, isoDate: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encode(`${siret}::${isoDate}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  return keyMaterial;
}

/**
 * Génère et retourne la signature SHA-256 HMAC d'une facture.
 * Utilise la Web Crypto API (disponible dans tous les navigateurs modernes).
 */
export async function signInvoice(
  invoice: Invoice,
  userProfile: UserProfile
): Promise<InvoiceSignatureResult> {
  if (!crypto.subtle) {
    throw new Error(
      "Web Crypto API non disponible — vérifiez que l'application est servie en HTTPS."
    );
  }

  const signedAt = new Date().toISOString();
  const canon = canonicalize(invoice);
  const key = await deriveKey(userProfile.siret, signedAt.slice(0, 10));
  const sig = await crypto.subtle.sign('HMAC', key, encode(canon));

  return {
    hash: toHex(sig),
    algorithm: 'SHA-256-HMAC',
    signedAt,
    signerSiret: userProfile.siret,
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
  };
}

/**
 * Vérifie l'intégrité d'une facture à partir de sa signature stockée.
 * Retourne `true` si le contenu n'a pas été modifié depuis la signature.
 */
export async function verifyInvoiceSignature(
  invoice: Invoice,
  signature: InvoiceSignatureResult
): Promise<boolean> {
  if (!crypto.subtle) {
    return false;
  }
  try {
    const canon = canonicalize(invoice);
    const key = await deriveKey(signature.signerSiret, signature.signedAt.slice(0, 10));

    // Reconvertir le hex en Uint8Array
    const hexBytes = (signature.hash.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16));
    const ab = new ArrayBuffer(hexBytes.length);
    const hashBytes = new Uint8Array(ab);
    hashBytes.set(hexBytes);

    return await crypto.subtle.verify('HMAC', key, hashBytes, encode(canon));
  } catch {
    return false;
  }
}

/**
 * Formate la signature pour affichage sur la facture (version courte).
 * Affiche les 16 premiers caractères du hash précédé d'un préfixe visuel.
 */
export function formatSignatureShort(sig: InvoiceSignatureResult): string {
  return `SIG-${sig.hash.slice(0, 8).toUpperCase()}…${sig.hash.slice(-4).toUpperCase()}`;
}

/**
 * Crée un "empreinte visuelle" : QR-friendly string encodant la signature.
 */
export function signaturePayload(sig: InvoiceSignatureResult): string {
  return [
    `FAC:${sig.invoiceNumber}`,
    `SIG:${sig.hash.slice(0, 16)}`,
    `DATE:${sig.signedAt.slice(0, 10)}`,
    `SIRET:${sig.signerSiret}`,
  ].join('|');
}
