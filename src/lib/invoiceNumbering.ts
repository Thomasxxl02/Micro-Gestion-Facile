import { db } from "../db/invoiceDB";
import type { DocumentType, UserProfile } from "../types";

/**
 * Génère le prochain numéro de document pour un type donné.
 * Respecte l'art. 289-I-5° CGI : séquence chronologique continue.
 */
export async function generateInvoiceNumber(
  type: DocumentType,
  userProfile: UserProfile,
  customFormat?: string,
): Promise<string> {
  const year = new Date().getFullYear();

  try {
    const sequence = await db.invoiceNumberSequences.get(type);
    let nextNumber = 1;

    if (sequence) {
      // Réinitialiser si changement d'année
      nextNumber = sequence.year === year ? sequence.currentNumber + 1 : 1;
    }

    await db.invoiceNumberSequences.put({
      type,
      year,
      currentNumber: nextNumber,
      lastUsedAt: new Date().toISOString(),
    });

    return formatDocumentNumber(
      type,
      year,
      nextNumber,
      userProfile,
      customFormat,
    );
  } catch {
    // Fallback: timestamp-based
    return formatDocumentNumber(
      type,
      year,
      Date.now() % 1000,
      userProfile,
      customFormat,
    );
  }
}

function formatDocumentNumber(
  type: DocumentType,
  year: number,
  sequence: number,
  userProfile: UserProfile,
  customFormat?: string,
): string {
  const num = String(sequence).padStart(3, "0");
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const prefixMap: Record<DocumentType, string> = {
    invoice: userProfile.invoicePrefix ?? "FAC",
    quote: userProfile.quotePrefix ?? "DEV",
    order: userProfile.orderPrefix ?? "BC",
    credit_note: userProfile.creditNotePrefix ?? "AV",
    deposit_invoice: "ACPT",
  };
  const prefix = prefixMap[type] ?? "DOC";

  const format =
    (customFormat ?? userProfile.numberingFormat) ?? "{PREFIX}-{YEAR}-{NUM}";

  return format
    .replace(/\{PREFIX\}/g, prefix)
    .replace(/\[PREFIX\]/g, prefix)
    .replace(/\{YEAR\}/g, String(year))
    .replace(/\[YEAR\]/g, String(year))
    .replace(/\{YYYY\}/g, String(year))
    .replace(/\[YYYY\]/g, String(year))
    .replace(/\{YY\}/g, String(year).slice(-2))
    .replace(/\[YY\]/g, String(year).slice(-2))
    .replace(/\{MM\}/g, month)
    .replace(/\[MM\]/g, month)
    .replace(/\{NUM\}/g, num)
    .replace(/\[NUM\]/g, num)
    .replace(/\{SEQ\}/g, num)
    .replace(/\[SEQ\]/g, num);
}

/**
 * Retourne le prochain numéro de séquence sans l'incrémenter (preview).
 */
export async function getNextSequence(
  type: DocumentType,
  year: number,
): Promise<number> {
  try {
    const sequence = await db.invoiceNumberSequences.get(type);
    if (sequence?.year !== year) return 1;
    return sequence.currentNumber + 1;
  } catch {
    return 1;
  }
}
