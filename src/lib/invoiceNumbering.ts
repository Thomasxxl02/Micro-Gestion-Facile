/**
 * Système de numérotation continue des documents fiscaux français
 *
 * Conformité : Art. 289-I-5° CGI — la numérotation doit être une séquence
 * chronologique continue, sans trou ni doublon.
 *
 * Format : <PREFIX>-<YYYY>-<NNN>   ex: FAC-2026-001, DEVIS-2026-042
 *
 * Principes :
 *  1. La séquence est persistée dans IndexedDB (jamais un compteur mémoire)
 *  2. Elle est incrémentée dans une transaction atomique Dexie (pas de doublon)
 *  3. L'unicité est vérifiée a posteriori contre la table `invoices`
 *  4. En début d'année, le compteur repart à 001 automatiquement
 *  5. Aucun fallback aléatoire — une erreur métier explicite est levée
 *
 * API publique :
 *  - getNextInvoiceNumber(type, userProfile)  → consomme + retourne le n°
 *  - peekNextInvoiceNumber(type, userProfile) → aperçu Sans consommer
 *  - repairSequence(type?)                    → synchronise avec les données réelles
 *  - getAllSequences()                         → lecture pour audit/debug
 *  - resetSequences()                         → réinitialise (tests/admin)
 *
 * Usage :
 * ```ts
 * const number = await getNextInvoiceNumber('invoice', userProfile);
 * // → "FAC-2026-001"
 * ```
 */

import { db, type InvoiceNumberSequence } from '../db/invoiceDB';
import type { DocumentType, UserProfile } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Types de documents supportant la numérotation séquentielle */
export type SequencedDocumentType = Exclude<DocumentType, 'deposit_invoice'>;

/** Erreur métier dédiée — ne pas être silencieusement ignorée */
export class InvoiceNumberingError extends Error {
  constructor(
    message: string,
    /** Type de document concerné (pour diagnostic) */
    public readonly documentType?: SequencedDocumentType
  ) {
    super(message);
    this.name = 'InvoiceNumberingError';
  }
}

// ─── Constantes ─────────────────────────────────────────────────────────────

/** Nombre de tentatives max avant de lancer repairSequence + erreur */
const MAX_UNIQUENESS_RETRIES = 3;

/** Longueur du numéro séquentiel (Art. 289-I-5° CGI : NNN = 3 chiffres) */
const SEQUENCE_PAD_LENGTH = 3;

// ─── Utilitaires ────────────────────────────────────────────────────────────

/**
 * Retourne le préfixe configuré pour un type de document.
 * Utilise les préfixes personnalisés du UserProfile si disponibles.
 */
function getPrefix(type: SequencedDocumentType, userProfile?: Partial<UserProfile>): string {
  switch (type) {
    case 'invoice':
      return userProfile?.invoicePrefix || 'FAC';
    case 'quote':
      return userProfile?.quotePrefix || 'DEVIS';
    case 'order':
      return userProfile?.orderPrefix || 'COMM';
    case 'credit_note':
      return userProfile?.creditNotePrefix || 'AVOIR';
  }
}

// ─── API publique ────────────────────────────────────────────────────────────

/**
 * Formate un numéro de document selon le type et le préfixe utilisateur.
 *
 * @example formatDocumentNumber('invoice', 1, profile) → "FAC-2026-001"
 */
export function formatDocumentNumber(
  type: SequencedDocumentType,
  sequenceNumber: number,
  userProfile?: Partial<UserProfile>
): string {
  const year = new Date().getFullYear();
  const paddedNumber = sequenceNumber.toString().padStart(SEQUENCE_PAD_LENGTH, '0');
  const prefix = getPrefix(type, userProfile);
  return `${prefix}-${year}-${paddedNumber}`;
}

/**
 * Génère le prochain numéro de document de façon ATOMIQUE.
 *
 * Garanties :
 *  - Incrémentation transactionnelle (Dexie `rw` transaction)
 *  - Reset automatique du compteur en début d'année civile
 *  - Vérification d'unicité contre la table `invoices` (filet de sécurité)
 *  - Retentative automatique (max 3) si conflit détecté (corruption de séquence)
 *
 * @param type        - Type de document ('invoice', 'quote', 'order', 'credit_note')
 * @param userProfile - Profil utilisateur (préfixes personnalisés)
 * @returns           Numéro formaté et unique (ex: "FAC-2026-001")
 *
 * @throws {InvoiceNumberingError} Si la séquence ne peut pas produire un n° unique
 *                                  après MAX_UNIQUENESS_RETRIES tentatives.
 */
export async function getNextInvoiceNumber(
  type: SequencedDocumentType,
  userProfile?: Partial<UserProfile>
): Promise<string> {
  const currentYear = new Date().getFullYear();

  for (let attempt = 1; attempt <= MAX_UNIQUENESS_RETRIES; attempt++) {
    // ── Étape 1 : Incrémentation atomique dans IndexedDB ──────────────────
    const nextSeq = await db.transaction('rw', db.invoiceNumberSequences, async () => {
      const sequence = await db.invoiceNumberSequences.get(type);

      // Reset en début d'année OU première utilisation
      const isNewYear = !sequence || sequence.year !== currentYear;
      const nextNumber = isNewYear ? 1 : sequence.currentNumber + 1;

      const updated: InvoiceNumberSequence = {
        type,
        year: currentYear,
        currentNumber: nextNumber,
        lastUsedAt: new Date().toISOString(),
      };

      await db.invoiceNumberSequences.put(updated);
      return nextNumber;
    });

    // ── Étape 2 : Formatage ───────────────────────────────────────────────
    const formatted = formatDocumentNumber(type, nextSeq, userProfile);

    // ── Étape 3 : Vérification d'unicité (filet de sécurité) ─────────────
    // Dans le cas normal (séquence saine), il n'y a jamais de collision.
    // Cette vérification protège contre une corruption éventuelle du compteur.
    const duplicateCount = await db.invoices.where('number').equals(formatted).count();
    if (duplicateCount === 0) {
      return formatted;
    }

    // Collision détectée : log et retry (la transaction va incrémenter à nouveau)
    console.warn(
      `[invoiceNumbering] Collision #${attempt}/${MAX_UNIQUENESS_RETRIES} ` +
        `pour le n° "${formatted}" — le compteur semble corrompu.`
    );
  }

  // ── Étape 4 : Réparation + erreur explicite ───────────────────────────────
  // Si on arrive ici, la séquence est sérieusement désynchronisée.
  // On répare depuis les données réelles et on demande une nouvelle tentative.
  await repairSequence(type);

  throw new InvoiceNumberingError(
    `Impossible de générer un numéro unique pour "${type}" après ` +
      `${MAX_UNIQUENESS_RETRIES} tentatives. ` +
      `La séquence a été réparée automatiquement — veuillez réessayer.`,
    type
  );
}

/**
 * Retourne le PROCHAIN numéro prévu SANS le consommer ni modifier la séquence.
 * Utile pour afficher un aperçu dans un formulaire de création.
 *
 * ⚠️ La valeur retournée N'EST PAS réservée — elle peut changer avant `save`.
 *
 * @example const preview = await peekNextInvoiceNumber('invoice', profile);
 *          // → "FAC-2026-001" (preview uniquement, non enregistré)
 */
export async function peekNextInvoiceNumber(
  type: SequencedDocumentType,
  userProfile?: Partial<UserProfile>
): Promise<string> {
  const currentYear = new Date().getFullYear();
  const sequence = await db.invoiceNumberSequences.get(type);

  const nextSeq = !sequence || sequence.year !== currentYear ? 1 : sequence.currentNumber + 1;

  return formatDocumentNumber(type, nextSeq, userProfile);
}

/**
 * Synchronise le compteur de séquence avec les données réelles présentes
 * dans la table `invoices`.
 *
 * À appeler en cas de :
 *  - Import de données depuis un backup
 *  - Corruption suspectée de la séquence
 *  - Résolution manuelle d'un incident de doublon
 *
 * @param type - Si omis, répare toutes les séquences
 */
export async function repairSequence(type?: SequencedDocumentType): Promise<void> {
  const currentYear = new Date().getFullYear();
  const typesToRepair: SequencedDocumentType[] = type
    ? [type]
    : ['invoice', 'quote', 'order', 'credit_note'];

  await db.transaction('rw', [db.invoices, db.invoiceNumberSequences], async () => {
    for (const docType of typesToRepair) {
      // Récupère tous les documents du type concerné
      const docs = await db.invoices.filter((inv) => inv.type === docType).toArray();

      let maxNum = 0;
      const yearStr = currentYear.toString();

      for (const doc of docs) {
        // Ne considère que les n° de l'année courante (format: PREFIX-YYYY-NNN)
        if (!doc.number.includes(`-${yearStr}-`)) {
          continue;
        }

        const match = doc.number.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }

      const repairedSequence: InvoiceNumberSequence = {
        type: docType,
        year: currentYear,
        currentNumber: maxNum,
        lastUsedAt: new Date().toISOString(),
      };

      await db.invoiceNumberSequences.put(repairedSequence);
      console.info(
        `[invoiceNumbering] repairSequence: "${docType}" → currentNumber=${maxNum} (année ${currentYear})`
      );
    }
  });
}

/**
 * Retourne toutes les séquences actives (utilisé pour l'audit et le debug).
 */
export async function getAllSequences(): Promise<InvoiceNumberSequence[]> {
  return db.invoiceNumberSequences.toArray();
}

/**
 * Réinitialise toutes les séquences à zéro.
 *
 * ⚠️ ADMIN / TESTS UNIQUEMENT — ne jamais appeler en production
 *    sans confirmation explicite de l'utilisateur.
 */
export async function resetSequences(): Promise<void> {
  const currentYear = new Date().getFullYear();

  await db.transaction('rw', db.invoiceNumberSequences, async () => {
    const types: SequencedDocumentType[] = ['invoice', 'quote', 'order', 'credit_note'];
    for (const type of types) {
      await db.invoiceNumberSequences.put({
        type,
        year: currentYear,
        currentNumber: 0,
        lastUsedAt: new Date().toISOString(),
      });
    }
  });
}
