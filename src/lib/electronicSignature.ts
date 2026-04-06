/**
 * Module de Signature Électronique Simple
 * ─────────────────────────────────────────
 * Appose un hash HMAC-SHA-256 sur le contenu canonique d'une facture.
 * Utilise exclusivement la Web Crypto API native — aucune dépendance externe.
 *
 * Sécurité :
 *   - La clé HMAC est dérivée du SIRET + timestamp ISO de signature
 *   - Le résultat est un hex string 64 caractères stockable dans l'Invoice
 *   - Protège contre la falsification a posteriori des montants / dates
 *
 * ⚠️  Ce n'est PAS une signature qualifiée eIDAS — c'est un tampon
 *     d'intégrité numérique (audit trail interne). Pour eIDAS qualifié,
 *     utiliser DocuSign / Yousign via API dédiée.
 */

import type { Invoice, UserProfile } from '../types';

export interface InvoiceSignatureResult {
  /** HMAC-SHA-256 hex, 64 chars */
  hash: string;
  algorithm: 'SHA-256-HMAC';
  /** ISO datetime au moment de la signature */
  signedAt: string;
  signerSiret: string;
  invoiceId: string;
  invoiceNumber: string;
}

/**
 * Sérialise les champs fiscalement significatifs dans un ordre canonique
 * déterministe pour garantir la reproductibilité du hash.
 */
function canonicalize(invoice: Invoice): string {
  return JSON.stringify({
    id: invoice.id,
    number: invoice.number,
    date: invoice.date,
    dueDate: invoice.dueDate,
    clientId: invoice.clientId,
    total: invoice.total,
    vatAmount: invoice.vatAmount ?? 0,
    discount: invoice.discount ?? 0,
    shipping: invoice.shipping ?? 0,
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate ?? 0,
    })),
  });
}

/**
 * Importe une clé HMAC depuis les bytes SIRET + signedAt.
 * La diversification par `signedAt` rend chaque signature unique
 * même si le SIRET ne change pas.
 */
async function importHMACKey(siret: string, signedAt: string): Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(`${siret}:${signedAt}`);
  return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
  const ab = new ArrayBuffer(bytes.length);
  new Uint8Array(ab).set(bytes);
  return ab;
}

/**
 * Signe une facture avec HMAC-SHA-256.
 * Renvoie un objet contenant le hash et les métadonnées de signature.
 *
 * @param invoice     Facture à signer
 * @param userProfile Profil de l'utilisateur (SIRET requis)
 */
export async function signInvoice(
  invoice: Invoice,
  userProfile: UserProfile
): Promise<InvoiceSignatureResult> {
  const signedAt = new Date().toISOString();
  const siret = userProfile.siret || 'NO_SIRET';
  const canonical = canonicalize(invoice);

  const key = await importHMACKey(siret, signedAt);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(canonical)
  );

  return {
    hash: bufferToHex(signatureBuffer),
    algorithm: 'SHA-256-HMAC',
    signedAt,
    signerSiret: siret,
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
  };
}

/**
 * Vérifie l'intégrité d'une facture par rapport à sa signature stockée.
 * Retourne `true` si la facture n'a pas été modifiée depuis la signature.
 *
 * @param invoice   Facture à vérifier
 * @param userProfile Profil de l'utilisateur (même SIRET que lors de la signature)
 * @param signature Résultat de signature précédemment émis par `signInvoice`
 */
export async function verifyInvoiceSignature(
  invoice: Invoice,
  userProfile: UserProfile,
  signature: InvoiceSignatureResult
): Promise<boolean> {
  try {
    if (signature.invoiceId !== invoice.id) {
      return false;
    }
    const siret = userProfile.siret || 'NO_SIRET';
    const canonical = canonicalize(invoice);
    const key = await importHMACKey(siret, signature.signedAt);

    return await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBuffer(signature.hash),
      new TextEncoder().encode(canonical)
    );
  } catch {
    return false;
  }
}
