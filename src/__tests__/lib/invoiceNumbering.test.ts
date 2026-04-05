/**
 * Tests unitaires — src/lib/invoiceNumbering.ts
 *
 * Conformité : Art. 289-I-5° CGI — séquence chronologique continue, sans trou ni doublon
 *
 * Couverture :
 *  1. formatDocumentNumber        → format NNN, préfixes défaut et personnalisés
 *  2. getNextInvoiceNumber        → séquence atomique, reset annuel, unicité, erreur custom
 *  3. peekNextInvoiceNumber       → lecture sans consommation
 *  4. repairSequence              → synchronisation avec les données réelles
 *  5. resetSequences              → remise à zéro (tests/admin)
 *  6. getAllSequences              → lecture d'audit
 *
 * Prérequis : fake-indexeddb importé dans vitest.setup.ts (avant Dexie)
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/invoiceDB';
import {
  formatDocumentNumber,
  getAllSequences,
  getNextInvoiceNumber,
  InvoiceNumberingError,
  peekNextInvoiceNumber,
  repairSequence,
  resetSequences,
} from '../../lib/invoiceNumbering';
import type { UserProfile } from '../../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

const mockProfile: Partial<UserProfile> = {
  invoicePrefix: 'FAC',
  quotePrefix: 'DEVIS',
  orderPrefix: 'CMD',
  creditNotePrefix: 'AVOIR',
};

const customProfile: Partial<UserProfile> = {
  invoicePrefix: 'INV',
  quotePrefix: 'QTE',
  orderPrefix: 'ORD',
  creditNotePrefix: 'CN',
};

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await db.clearAll();
});

// ─── Suite 1 : formatDocumentNumber ─────────────────────────────────────────

describe('formatDocumentNumber', () => {
  it('formate une facture avec padding 3 chiffres (NNN)', () => {
    expect(formatDocumentNumber('invoice', 1)).toBe(`FAC-${CURRENT_YEAR}-001`);
    expect(formatDocumentNumber('invoice', 42)).toBe(`FAC-${CURRENT_YEAR}-042`);
    expect(formatDocumentNumber('invoice', 999)).toBe(`FAC-${CURRENT_YEAR}-999`);
  });

  it("utilise le préfixe 'DEVIS' pour les devis par défaut", () => {
    expect(formatDocumentNumber('quote', 1)).toBe(`DEVIS-${CURRENT_YEAR}-001`);
  });

  it("utilise le préfixe 'COMM' pour les commandes par défaut", () => {
    expect(formatDocumentNumber('order', 1)).toBe(`COMM-${CURRENT_YEAR}-001`);
  });

  it("utilise le préfixe 'AVOIR' pour les avoirs par défaut", () => {
    expect(formatDocumentNumber('credit_note', 1)).toBe(`AVOIR-${CURRENT_YEAR}-001`);
  });

  it('respecte les préfixes personnalisés du UserProfile', () => {
    expect(formatDocumentNumber('invoice', 5, customProfile)).toBe(`INV-${CURRENT_YEAR}-005`);
    expect(formatDocumentNumber('quote', 5, customProfile)).toBe(`QTE-${CURRENT_YEAR}-005`);
    expect(formatDocumentNumber('order', 5, customProfile)).toBe(`ORD-${CURRENT_YEAR}-005`);
    expect(formatDocumentNumber('credit_note', 5, customProfile)).toBe(`CN-${CURRENT_YEAR}-005`);
  });

  it("inclut toujours l'année courante dans le numéro", () => {
    const result = formatDocumentNumber('invoice', 1);
    expect(result).toContain(CURRENT_YEAR.toString());
  });
});

// ─── Suite 2 : getNextInvoiceNumber ─────────────────────────────────────────

describe('getNextInvoiceNumber', () => {
  it('génère FAC-YYYY-001 pour la première facture', async () => {
    const num = await getNextInvoiceNumber('invoice', mockProfile);
    expect(num).toBe(`FAC-${CURRENT_YEAR}-001`);
  });

  it('incrémente de manière séquentielle sans trou', async () => {
    const n1 = await getNextInvoiceNumber('invoice', mockProfile);
    const n2 = await getNextInvoiceNumber('invoice', mockProfile);
    const n3 = await getNextInvoiceNumber('invoice', mockProfile);
    expect(n1).toBe(`FAC-${CURRENT_YEAR}-001`);
    expect(n2).toBe(`FAC-${CURRENT_YEAR}-002`);
    expect(n3).toBe(`FAC-${CURRENT_YEAR}-003`);
  });

  it('génère des séquences indépendantes par type de document', async () => {
    const inv1 = await getNextInvoiceNumber('invoice', mockProfile);
    const qte1 = await getNextInvoiceNumber('quote', mockProfile);
    const inv2 = await getNextInvoiceNumber('invoice', mockProfile);

    expect(inv1).toBe(`FAC-${CURRENT_YEAR}-001`);
    expect(qte1).toBe(`DEVIS-${CURRENT_YEAR}-001`); // séquence indépendante
    expect(inv2).toBe(`FAC-${CURRENT_YEAR}-002`); // n'est pas affecté par quote
  });

  it('repart à 001 en début de nouvelle année (reset annuel)', async () => {
    // Simule une séquence de l'année précédente en base
    const lastYear = CURRENT_YEAR - 1;
    await db.invoiceNumberSequences.put({
      type: 'invoice',
      year: lastYear,
      currentNumber: 99,
      lastUsedAt: `${lastYear}-12-31T23:59:59.000Z`,
    });

    // Lors de la première utilisation en année courante → repart à 001
    const num = await getNextInvoiceNumber('invoice', mockProfile);
    expect(num).toBe(`FAC-${CURRENT_YEAR}-001`);
  });

  it('utilise les préfixes personnalisés du profil utilisateur', async () => {
    const num = await getNextInvoiceNumber('invoice', customProfile);
    expect(num).toBe(`INV-${CURRENT_YEAR}-001`);
  });

  it('persiste le numéro dans IndexedDB (jamais en mémoire seule)', async () => {
    await getNextInvoiceNumber('invoice', mockProfile);
    const sequence = await db.invoiceNumberSequences.get('invoice');
    expect(sequence).toBeDefined();
    expect(sequence!.currentNumber).toBe(1);
    expect(sequence!.year).toBe(CURRENT_YEAR);
  });

  it("lève InvoiceNumberingError (et répare) si l'unicité ne peut être garantie", async () => {
    // Cas de corruption extrême : toutes les valeurs possibles existent déjà
    // On injecte des factures couvrant les 3 premiers numéros pour simuler le conflit
    await db.invoices.bulkPut([
      {
        id: 'f1',
        type: 'invoice',
        number: `FAC-${CURRENT_YEAR}-001`,
        date: '2026-01-01',
        dueDate: '2026-02-01',
        clientId: 'c1',
        items: [],
        status: 'Brouillon',
        total: 0,
      },
      {
        id: 'f2',
        type: 'invoice',
        number: `FAC-${CURRENT_YEAR}-002`,
        date: '2026-01-02',
        dueDate: '2026-02-02',
        clientId: 'c1',
        items: [],
        status: 'Brouillon',
        total: 0,
      },
      {
        id: 'f3',
        type: 'invoice',
        number: `FAC-${CURRENT_YEAR}-003`,
        date: '2026-01-03',
        dueDate: '2026-02-03',
        clientId: 'c1',
        items: [],
        status: 'Brouillon',
        total: 0,
      },
    ]);

    // La séquence démarre à 0 (fera 001, 002, 003 et trouvera des conflits)
    await db.invoiceNumberSequences.put({
      type: 'invoice',
      year: CURRENT_YEAR,
      currentNumber: 0,
      lastUsedAt: new Date().toISOString(),
    });

    await expect(getNextInvoiceNumber('invoice', mockProfile)).rejects.toThrow(
      InvoiceNumberingError
    );
  });
});

// ─── Suite 3 : peekNextInvoiceNumber ────────────────────────────────────────

describe('peekNextInvoiceNumber', () => {
  it('retourne le prochain numéro prévu sans consommer la séquence', async () => {
    const preview1 = await peekNextInvoiceNumber('invoice', mockProfile);
    const preview2 = await peekNextInvoiceNumber('invoice', mockProfile);

    // Doit retourner la même valeur à chaque appel (non consommé)
    expect(preview1).toBe(preview2);
    expect(preview1).toBe(`FAC-${CURRENT_YEAR}-001`);
  });

  it('ne modifie pas la séquence en base', async () => {
    await peekNextInvoiceNumber('invoice', mockProfile);
    const sequence = await db.invoiceNumberSequences.get('invoice');
    // La séquence ne doit pas avoir été créée/modifiée
    expect(sequence).toBeUndefined();
  });

  it("retourne 001 si la séquence est de l'année précédente", async () => {
    await db.invoiceNumberSequences.put({
      type: 'invoice',
      year: CURRENT_YEAR - 1,
      currentNumber: 50,
      lastUsedAt: `${CURRENT_YEAR - 1}-12-31T23:59:59.000Z`,
    });

    const preview = await peekNextInvoiceNumber('invoice', mockProfile);
    expect(preview).toBe(`FAC-${CURRENT_YEAR}-001`);
  });

  it('le premier getNextInvoiceNumber retourne la même valeur que peek', async () => {
    const preview = await peekNextInvoiceNumber('invoice', mockProfile);
    const actual = await getNextInvoiceNumber('invoice', mockProfile);
    expect(actual).toBe(preview);
  });
});

// ─── Suite 4 : repairSequence ────────────────────────────────────────────────

describe('repairSequence', () => {
  it('synchronise le compteur avec le numéro le plus élevé en base', async () => {
    // Insère des factures avec des n° existants
    await db.invoices.bulkPut([
      {
        id: 'r1',
        type: 'invoice',
        number: `FAC-${CURRENT_YEAR}-005`,
        date: '2026-01-05',
        dueDate: '2026-02-05',
        clientId: 'c1',
        items: [],
        status: 'Brouillont',
        total: 0,
      },
      {
        id: 'r2',
        type: 'invoice',
        number: `FAC-${CURRENT_YEAR}-012`,
        date: '2026-01-12',
        dueDate: '2026-02-12',
        clientId: 'c1',
        items: [],
        status: 'Payée',
        total: 100,
      },
    ]);

    // La séquence est incorrecte (à 0) — simule une corruption
    await db.invoiceNumberSequences.put({
      type: 'invoice',
      year: CURRENT_YEAR,
      currentNumber: 0,
      lastUsedAt: new Date().toISOString(),
    });

    await repairSequence('invoice');

    const sequence = await db.invoiceNumberSequences.get('invoice');
    expect(sequence!.currentNumber).toBe(12); // valeur max trouvée en DB
  });

  it('répare uniquement le type spécifié', async () => {
    await db.invoices.bulkPut([
      {
        id: 'q1',
        type: 'quote',
        number: `DEVIS-${CURRENT_YEAR}-007`,
        date: '2026-01-07',
        dueDate: '2026-02-07',
        clientId: 'c1',
        items: [],
        status: 'Brouillon',
        total: 0,
      },
    ]);

    await repairSequence('quote');

    const quoteSeq = await db.invoiceNumberSequences.get('quote');
    expect(quoteSeq!.currentNumber).toBe(7);

    // La séquence 'invoice' ne doit pas être affectée
    const invoiceSeq = await db.invoiceNumberSequences.get('invoice');
    expect(invoiceSeq?.currentNumber ?? 0).toBe(0);
  });

  it("ignore les numéros d'années précédentes lors de la réparation", async () => {
    const lastYear = CURRENT_YEAR - 1;
    await db.invoices.bulkPut([
      {
        id: 'old1',
        type: 'invoice',
        number: `FAC-${lastYear}-099`,
        date: `${lastYear}-06-01`,
        dueDate: `${lastYear}-07-01`,
        clientId: 'c1',
        items: [],
        status: 'Payée',
        total: 500,
      },
      {
        id: 'new1',
        type: 'invoice',
        number: `FAC-${CURRENT_YEAR}-003`,
        date: '2026-01-03',
        dueDate: '2026-02-03',
        clientId: 'c1',
        items: [],
        status: 'Brouillon',
        total: 0,
      },
    ]);

    await repairSequence('invoice');

    const sequence = await db.invoiceNumberSequences.get('invoice');
    // Ne doit prendre en compte que l'année courante → 3, pas 99
    expect(sequence!.currentNumber).toBe(3);
  });

  it("répare toutes les séquences en une fois si aucun type n'est spécifié", async () => {
    await db.invoices.bulkPut([
      {
        id: 'a1',
        type: 'invoice',
        number: `FAC-${CURRENT_YEAR}-004`,
        date: '2026-01-04',
        dueDate: '2026-02-04',
        clientId: 'c1',
        items: [],
        status: 'Brouillon',
        total: 0,
      },
      {
        id: 'a2',
        type: 'quote',
        number: `DEVIS-${CURRENT_YEAR}-006`,
        date: '2026-01-06',
        dueDate: '2026-02-06',
        clientId: 'c1',
        items: [],
        status: 'Brouillon',
        total: 0,
      },
    ]);

    await repairSequence(); // sans paramètre → toutes les séquences

    const invoiceSeq = await db.invoiceNumberSequences.get('invoice');
    const quoteSeq = await db.invoiceNumberSequences.get('quote');
    expect(invoiceSeq!.currentNumber).toBe(4);
    expect(quoteSeq!.currentNumber).toBe(6);
  });

  it("fixe le compteur à 0 si aucun document de l'année courante", async () => {
    // Aucune facture en base → réparation repart de 0
    await repairSequence('invoice');
    const sequence = await db.invoiceNumberSequences.get('invoice');
    expect(sequence!.currentNumber).toBe(0);
  });
});

// ─── Suite 5 : resetSequences ────────────────────────────────────────────────

describe('resetSequences', () => {
  it("réinitialise tous les compteurs à 0 pour l'année courante", async () => {
    // Crée des séquences non nulles
    await getNextInvoiceNumber('invoice', mockProfile);
    await getNextInvoiceNumber('quote', mockProfile);

    await resetSequences();

    const sequences = await getAllSequences();
    for (const seq of sequences) {
      expect(seq.currentNumber).toBe(0);
      expect(seq.year).toBe(CURRENT_YEAR);
    }
  });

  it('génère 001 pour la prochaine facture après reset', async () => {
    await getNextInvoiceNumber('invoice', mockProfile); // → 001
    await getNextInvoiceNumber('invoice', mockProfile); // → 002
    await resetSequences();

    const num = await getNextInvoiceNumber('invoice', mockProfile);
    expect(num).toBe(`FAC-${CURRENT_YEAR}-001`);
  });
});

// ─── Suite 6 : getAllSequences ───────────────────────────────────────────────

describe('getAllSequences', () => {
  it('retourne un tableau vide si aucune séquence existante', async () => {
    const sequences = await getAllSequences();
    expect(sequences).toEqual([]);
  });

  it('retourne les séquences créées avec leurs métadonnées', async () => {
    await getNextInvoiceNumber('invoice', mockProfile);
    await getNextInvoiceNumber('quote', mockProfile);

    const sequences = await getAllSequences();
    expect(sequences).toHaveLength(2);

    const invoiceSeq = sequences.find((s) => s.type === 'invoice');
    expect(invoiceSeq).toBeDefined();
    expect(invoiceSeq!.currentNumber).toBe(1);
    expect(invoiceSeq!.year).toBe(CURRENT_YEAR);
    expect(invoiceSeq!.lastUsedAt).toBeTruthy();
  });
});
