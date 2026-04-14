/**
 * BankReconciliationManager
 * ─────────────────────────
 * Import de relevé bancaire (CSV / OFX) et rapprochement automatique avec
 * les factures payées. 100% côté client, aucune donnée ne quitte le navigateur.
 *
 * Formats supportés :
 *   - CSV standard (Boursorama, BNP, CIC, LCL, Société Générale…)
 *   - OFX/QFX (Open Financial Exchange)
 */

import {
  CircleAlert as AlertCircle,
  ArrowUpDown,
  CircleCheck as CheckCircle2,
  Download,
  FileText,
  Link,
  LoaderCircle as Loader2,
  Search,
  Unlink,
  Upload,
  CircleSlash as XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';
import { InvoiceStatus, type Invoice } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BankTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positif = crédit, négatif = débit
  balance?: number;
  reference?: string;
  isMatched: boolean;
  matchedInvoiceId?: string;
  matchConfidence?: number; // 0-1
}

interface BankReconciliationManagerProps {
  invoices: Invoice[];
  onMarkInvoicePaid?: (invoiceId: string) => void;
}

// ─── Utilitaires de parsing ────────────────────────────────────────────────────

/**
 * Normalise une date sous divers formats en YYYY-MM-DD
 */
function parseDate(raw: string): string {
  // OFX : YYYYMMDD ou YYYYMMDDHHMMSS
  if (/^\d{8}/.test(raw)) {
    const d = raw.slice(0, 8);
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }
  // DD/MM/YYYY ou DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  return raw;
}

/**
 * Normalise un montant (gère virgule décimale, espaces, symboles)
 */
function parseAmount(raw: string): number {
  if (!raw) {
    return 0;
  }
  const cleaned = raw.replaceAll(/[€$ ]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Parse un fichier CSV bancaire — détection automatique des colonnes
 */
function parseCSV(text: string): BankTransaction[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: '',
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  return result.data
    .map((row, idx): BankTransaction | null => {
      // Heuristique de détection des colonnes (multi-banques)
      const dateKey = Object.keys(row).find((k) => /date|dat/.test(k));
      const descKey = Object.keys(row).find((k) =>
        /libellé|libell|label|description|motif|operat/.test(k)
      );
      const amtKey = Object.keys(row).find((k) =>
        /montant|amount|valeur|credit|débit|debit/.test(k)
      );
      const creditKey = Object.keys(row).find((k) => /crédit|credit/.test(k));
      const debitKey = Object.keys(row).find((k) => /débit|debit/.test(k));
      const balKey = Object.keys(row).find((k) => /solde|balance/.test(k));
      const refKey = Object.keys(row).find((k) => /référence|reference|ref/.test(k));

      if (!dateKey || !descKey) {
        return null;
      }

      let amount = 0;
      if (amtKey) {
        amount = parseAmount(row[amtKey]);
      } else if (creditKey || debitKey) {
        const credit = creditKey ? parseAmount(row[creditKey]) : 0;
        const debit = debitKey ? parseAmount(row[debitKey]) : 0;
        amount = credit - debit;
      }

      return {
        id: `bank-${Date.now()}-${idx}`,
        date: parseDate(row[dateKey] ?? ''),
        description: row[descKey]?.trim() ?? '',
        amount,
        balance: balKey ? parseAmount(row[balKey]) : undefined,
        reference: refKey ? row[refKey]?.trim() : undefined,
        isMatched: false,
      };
    })
    .filter(Boolean) as BankTransaction[];
}

/**
 * Parse un fichier OFX/QFX (balises SGML non-XML)
 */
function parseOFX(text: string): BankTransaction[] {
  const transactions: BankTransaction[] = [];
  const stmtTrnRe = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  const extract = (block: string, tag: string) => {
    const m = new RegExp(`<${tag}>([^<]+)`, 'i').exec(block);
    return m ? m[1].trim() : '';
  };

  let idx = 0;
  while ((match = stmtTrnRe.exec(text)) !== null) {
    const block = match[1];
    const trnAmt = parseAmount(extract(block, 'TRNAMT'));
    const datePosted = extract(block, 'DTPOSTED');
    const memo = extract(block, 'MEMO') || extract(block, 'NAME');
    const fitid = extract(block, 'FITID');

    if (datePosted) {
      transactions.push({
        id: fitid || `ofx-${Date.now()}-${idx++}`,
        date: parseDate(datePosted),
        description: memo,
        amount: trnAmt,
        isMatched: false,
        reference: fitid || undefined,
      });
    }
  }

  return transactions;
}

// ─── Algorithme de rapprochement automatique ──────────────────────────────────

/**
 * Tente de rapprocher automatiquement les transactions bancaires avec
 * les factures non encore soldées, en combinant 3 critères :
 *   1. Montant correspondant (tolérance 0.02 €)
 *   2. Numéro de facture dans la description
 *   3. Proximité de date (±30 jours)
 */
function autoMatch(transactions: BankTransaction[], invoices: Invoice[]): BankTransaction[] {
  const unpaidInvoices = invoices.filter(
    (inv) =>
      inv.type === 'invoice' &&
      inv.status !== InvoiceStatus.PAID &&
      inv.status !== InvoiceStatus.CANCELLED
  );

  return transactions.map((tx) => {
    if (tx.amount <= 0) {
      return tx; // On ne rapproche que les crédits
    }

    let bestMatch: Invoice | null = null;
    let bestScore = 0;

    for (const inv of unpaidInvoices) {
      let score = 0;
      const amtDiff = Math.abs(tx.amount - inv.total);

      // Critère 1 : montant
      if (amtDiff < 0.02) {
        score += 0.6;
      } else if (amtDiff < 1) {
        score += 0.3;
      } else if (amtDiff / inv.total < 0.05) {
        score += 0.1; // Tolérance 5%
      }

      // Critère 2 : n° facture dans la description
      if (tx.description.toUpperCase().includes(inv.number.toUpperCase())) {
        score += 0.4;
      }

      // Critère 3 : date (crédité dans +30 jours après émission)
      const txDate = new Date(tx.date).getTime();
      const invDate = new Date(inv.date).getTime();
      const daysDiff = (txDate - invDate) / 86_400_000;
      if (daysDiff >= 0 && daysDiff <= 30) {
        score += 0.15;
      } else if (daysDiff >= -7 && daysDiff < 0) {
        score += 0.05;
      }

      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestMatch = inv;
      }
    }

    return bestMatch
      ? {
          ...tx,
          isMatched: true,
          matchedInvoiceId: bestMatch.id,
          matchConfidence: parseFloat(bestScore.toFixed(2)),
        }
      : tx;
  });
}

// ─── Composant principal ───────────────────────────────────────────────────────

const BankReconciliationManager: React.FC<BankReconciliationManagerProps> = ({
  invoices,
  onMarkInvoicePaid,
}) => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const text = await file.text();
        let parsed: BankTransaction[];

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'ofx' || ext === 'qfx') {
          parsed = parseOFX(text);
        } else {
          parsed = parseCSV(text);
        }

        if (parsed.length === 0) {
          setError(
            'Aucune transaction trouvée. Vérifiez le format du fichier (CSV avec en-têtes ou OFX/QFX).'
          );
          return;
        }

        const matched = autoMatch(parsed, invoices);
        setTransactions((prev) => {
          // Dédupliquer par id
          const existingIds = new Set(prev.map((t) => t.id));
          const newTx = matched.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newTx];
        });
      } catch {
        setError("Erreur lors du parsing du fichier. Vérifiez qu'il est bien encodé en UTF-8.");
      } finally {
        setIsLoading(false);
      }
    },
    [invoices]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        void handleFileImport(file);
      }
    },
    [handleFileImport]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileImport(file);
    }
    e.target.value = '';
  };

  const toggleMatch = (txId: string, invoiceId?: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === txId
          ? {
              ...tx,
              isMatched: !tx.isMatched,
              matchedInvoiceId: tx.isMatched ? undefined : invoiceId,
              matchConfidence: tx.isMatched ? undefined : 1,
            }
          : tx
      )
    );
  };

  const markPaid = (tx: BankTransaction) => {
    if (tx.matchedInvoiceId && onMarkInvoicePaid) {
      onMarkInvoicePaid(tx.matchedInvoiceId);
      setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, isMatched: true } : t)));
    }
  };

  const exportReconciliation = () => {
    const rows = [
      ['Date', 'Description', 'Montant (€)', 'Référence', 'Rapproché', 'N° Facture'],
      ...transactions.map((tx) => {
        const inv = invoices.find((i) => i.id === tx.matchedInvoiceId);
        return [
          tx.date,
          tx.description,
          tx.amount.toFixed(2),
          tx.reference || '',
          tx.isMatched ? 'Oui' : 'Non',
          inv?.number || '',
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapprochement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Données filtrées ───────────────────────────────────────────────────────
  const filtered = transactions
    .filter((tx) => {
      if (filterStatus === 'matched') {
        return tx.isMatched;
      }
      if (filterStatus === 'unmatched') {
        return !tx.isMatched;
      }
      return true;
    })
    .filter(
      (tx) =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.reference ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const factor = sortAsc ? 1 : -1;
      if (sortField === 'date') {
        return factor * (new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      return factor * (a.amount - b.amount);
    });

  const matchedCount = transactions.filter((t) => t.isMatched).length;
  const totalCredit = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 dark:text-brand-50 font-display tracking-tight">
            Rapprochement Bancaire
          </h2>
          <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
            Importez un relevé CSV ou OFX pour rapprocher automatiquement vos encaissements.
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={exportReconciliation}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Exporter le rapprochement en CSV"
          >
            <Download size={14} />
            Exporter CSV
          </button>
        )}
      </div>

      {/* Zone de dépôt */}
      {transactions.length === 0 && (
        <label
          htmlFor="bank-file-upload"
          className="border-2 border-dashed border-brand-200 dark:border-brand-700 rounded-3xl p-12 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-800/20 transition-all block"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          aria-label="Importer un relevé bancaire"
        >
          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <Loader2 size={40} className="animate-spin text-brand-400" />
            ) : (
              <Upload size={40} className="text-brand-300" />
            )}
            <div>
              <p className="font-bold text-brand-700 dark:text-brand-200">
                {isLoading ? 'Analyse en cours…' : 'Déposez votre relevé ici'}
              </p>
              <p className="text-sm text-brand-400 mt-1">
                Formats supportés : CSV (Boursorama, BNP, Société Générale…), OFX, QFX
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.ofx,.qfx"
            onChange={handleFileChange}
            className="hidden"
            id="bank-file-upload"
            aria-label="Sélectionner un fichier bancaire"
          />
        </label>
      )}

      {/* Erreur */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Résumé */}
      {transactions.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Transactions',
                value: transactions.length.toString(),
                color: 'text-brand-900 dark:text-brand-50',
              },
              {
                label: 'Rapprochées',
                value: `${matchedCount} / ${transactions.length}`,
                color: 'text-accent-600',
              },
              {
                label: 'Total crédits',
                value: `+${totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
                color: 'text-accent-600',
              },
              {
                label: 'Total débits',
                value: `${totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
                color: 'text-red-500',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-modern p-4">
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                  {label}
                </p>
                <p className={`text-xl font-bold mt-1 font-display ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-60">
              <Search
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300"
              />
              <input
                type="search"
                placeholder="Rechercher une transaction…"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-brand-100 dark:border-brand-700 rounded-2xl bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 border border-brand-100 dark:border-brand-700 rounded-2xl p-1">
              {(['all', 'matched', 'unmatched'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    filterStatus === f
                      ? 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
                      : 'text-brand-400 hover:text-brand-700 dark:hover:text-brand-200'
                  }`}
                >
                  {f === 'all' ? 'Tout' : f === 'matched' ? 'Rapprochées' : 'En attente'}
                </button>
              ))}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border border-brand-100 dark:border-brand-700 rounded-2xl text-sm font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800 transition-all"
              title="Importer un autre fichier"
            >
              <Upload size={14} />
              Ajouter
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.ofx,.qfx"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Ajouter un fichier bancaire"
            />
          </div>

          {/* Tableau des transactions */}
          <div className="card-modern overflow-hidden">
            <table className="w-full text-sm" aria-label="Transactions bancaires">
              <thead>
                <tr className="border-b border-brand-100 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/50">
                  <th className="text-left px-4 py-3">
                    <button
                      className="flex items-center gap-1 text-[10px] font-bold text-brand-400 uppercase tracking-widest hover:text-brand-700"
                      onClick={() => {
                        if (sortField === 'date') {
                          setSortAsc((a) => !a);
                        } else {
                          setSortField('date');
                          setSortAsc(false);
                        }
                      }}
                    >
                      Date <ArrowUpDown size={10} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                    Description
                  </th>
                  <th className="text-right px-4 py-3">
                    <button
                      className="flex items-center gap-1 text-[10px] font-bold text-brand-400 uppercase tracking-widest hover:text-brand-700 ml-auto"
                      onClick={() => {
                        if (sortField === 'amount') {
                          setSortAsc((a) => !a);
                        } else {
                          setSortField('amount');
                          setSortAsc(false);
                        }
                      }}
                    >
                      Montant <ArrowUpDown size={10} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-brand-400 uppercase tracking-widest hidden md:table-cell">
                    Facture liée
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50 dark:divide-brand-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-brand-300 text-sm">
                      Aucune transaction trouvée
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => {
                    const linkedInvoice = invoices.find((i) => i.id === tx.matchedInvoiceId);
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-brand-50/50 dark:hover:bg-brand-800/20 transition-colors"
                      >
                        <td className="px-4 py-3 text-brand-500 font-mono text-xs whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-brand-800 dark:text-brand-200 font-medium truncate">
                            {tx.description}
                          </p>
                          {tx.reference && (
                            <p className="text-[10px] text-brand-400 font-mono mt-0.5">
                              Réf: {tx.reference}
                            </p>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold font-display ${tx.amount >= 0 ? 'text-accent-600' : 'text-red-500'}`}
                        >
                          {tx.amount >= 0 ? '+' : ''}
                          {tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {linkedInvoice ? (
                            <div className="flex items-center gap-2">
                              <FileText size={12} className="text-accent-600" />
                              <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                                {linkedInvoice.number}
                              </span>
                              {tx.matchConfidence !== undefined && tx.matchConfidence < 1 && (
                                <span className="text-[9px] text-brand-400 bg-brand-50 dark:bg-brand-800 px-1.5 py-0.5 rounded-full">
                                  {Math.round(tx.matchConfidence * 100)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-brand-300 italic">Non rapproché</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {tx.isMatched ? (
                              <>
                                <CheckCircle2
                                  size={14}
                                  className="text-accent-600"
                                  aria-hidden="true"
                                />
                                {linkedInvoice && linkedInvoice.status !== InvoiceStatus.PAID && (
                                  <button
                                    onClick={() => markPaid(tx)}
                                    title="Marquer la facture comme payée"
                                    className="text-[10px] font-bold text-accent-600 hover:text-accent-700 bg-accent-50 dark:bg-accent-900/20 px-2.5 py-1 rounded-xl transition-all"
                                  >
                                    Solder
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleMatch(tx.id)}
                                  title="Délier cette transaction"
                                  className="p-1.5 text-brand-300 hover:text-red-500 transition-colors"
                                >
                                  <Unlink size={12} />
                                </button>
                              </>
                            ) : (
                              tx.amount > 0 && (
                                <button
                                  onClick={() => toggleMatch(tx.id)}
                                  title="Rapprocher manuellement"
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-brand-500 hover:text-brand-900 dark:hover:text-brand-50 bg-brand-50 dark:bg-brand-800 px-2.5 py-1.5 rounded-xl transition-all"
                                >
                                  <Link size={10} />
                                  Lier
                                </button>
                              )
                            )}
                            {!tx.isMatched && tx.amount <= 0 && (
                              <XCircle size={14} className="text-brand-200" aria-hidden="true" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default BankReconciliationManager;
