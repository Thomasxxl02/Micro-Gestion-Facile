/**
 * InvoicePaper — Vue aperçu et impression d'une facture (format A4)
 * ──────────────────────────────────────────────────────────────────
 * Rendu pur HTML/CSS — aucune dépendance PDF externe.
 * Utilise window.print() avec une feuille de style @media print dédiée
 * pour produire un rendu fidèle au format A4 (210 mm × 297 mm).
 *
 * Usage :
 *   <InvoicePaper invoice={inv} client={client} userProfile={profile} onClose={() => setOpen(false)} />
 */

import { Printer, X } from 'lucide-react';
import React, { useCallback } from 'react';
import type { Client, Invoice, UserProfile } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoicePaperProps {
  invoice: Invoice;
  client?: Client;
  userProfile: UserProfile;
  onClose: () => void;
}

// ─── Étiquettes ───────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: 'FACTURE',
  quote: 'DEVIS',
  order: 'BON DE COMMANDE',
  credit_note: 'AVOIR',
  deposit_invoice: "FACTURE D'ACOMPTE",
};

// ─── Formateurs ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });
}

// ─── Composant ────────────────────────────────────────────────────────────────

const InvoicePaper: React.FC<InvoicePaperProps> = ({ invoice, client, userProfile, onClose }) => {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Calculs de totaux
  const subtotal =
    invoice.subtotal ?? invoice.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const vatAmount = invoice.vatAmount ?? 0;
  const discountAmount = invoice.discount ? (subtotal * invoice.discount) / 100 : 0;
  const shippingAmount = invoice.shipping ?? 0;
  const depositAmount = invoice.deposit ?? 0;
  const total = invoice.total;
  const isVatExempt = invoice.taxExempt ?? userProfile.isVatExempt ?? false;
  const docLabel = DOC_TYPE_LABELS[invoice.type] ?? 'DOCUMENT';
  const primaryColor = userProfile.primaryColor ?? '#4F46E5';

  return (
    <>
      {/*
        ── STYLE PRINT ──────────────────────────────────────────────────────────
        Ces styles sont injectés globalement. La classe `.no-print` masque les
        éléments hors facture (toolbar, backdrop) lors de l'impression.
      */}
      <style>{`
        @media print {
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root .no-print { display: none !important; }
          #invoice-print-root { position: static !important; padding: 0 !important; }
          .invoice-paper-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 20mm 15mm !important;
          }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
        id="invoice-print-root"
      >
        {/* Toolbar */}
        <div className="no-print sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-brand-900/90 backdrop-blur text-white">
          <span className="text-sm font-semibold">
            Aperçu — {docLabel} {invoice.number}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Imprimer"
              className="flex items-center gap-2 px-4 py-2 bg-white text-brand-900 rounded-xl font-bold text-sm hover:bg-brand-100 transition-colors"
            >
              <Printer size={16} aria-hidden="true" />
              Imprimer / PDF
            </button>
            <button
              onClick={onClose}
              title="Fermer l'aperçu"
              aria-label="Fermer l'aperçu de la facture"
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Feuille A4 */}
        <div className="mx-auto my-8 w-[210mm] no-scrollbar">
          <div
            className="invoice-paper-sheet bg-white shadow-2xl rounded-sm"
            style={{ padding: '20mm 15mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}
          >
            {/* ── EN-TÊTE ─────────────────────────────────────────────────────── */}
            <header
              className="flex justify-between items-start pb-8 mb-8"
              style={{ borderBottom: `3px solid ${primaryColor}` }}
            >
              {/* Logo + infos émetteur */}
              <div>
                {userProfile.logoUrl && (
                  <img
                    src={userProfile.logoUrl}
                    alt={`Logo ${userProfile.companyName}`}
                    className="max-h-16 max-w-30 object-contain mb-3"
                  />
                )}
                <p className="text-xl font-bold text-gray-900">{userProfile.companyName}</p>
                {userProfile.professionalTitle && (
                  <p className="text-sm text-gray-500">{userProfile.professionalTitle}</p>
                )}
                <address className="not-italic text-sm text-gray-600 mt-1 leading-relaxed">
                  {userProfile.address}
                </address>
                <p className="text-sm text-gray-600 mt-1">{userProfile.email}</p>
                {userProfile.phone && <p className="text-sm text-gray-600">{userProfile.phone}</p>}
                {userProfile.siret && (
                  <p className="text-xs text-gray-400 mt-2">SIRET : {userProfile.siret}</p>
                )}
                {userProfile.tvaNumber && (
                  <p className="text-xs text-gray-400">TVA : {userProfile.tvaNumber}</p>
                )}
              </div>

              {/* Document info */}
              <div className="text-right">
                <div
                  className="inline-block px-5 py-2 rounded-lg mb-3"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white font-black text-lg tracking-widest">{docLabel}</span>
                </div>
                <p className="text-2xl font-mono font-bold mt-1" style={{ color: primaryColor }}>
                  {invoice.number}
                </p>
                <div className="mt-3 text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold">Date :</span> {formatDate(invoice.date)}
                  </p>
                  {invoice.dueDate && (
                    <p>
                      <span className="font-semibold">Échéance :</span>{' '}
                      {formatDate(invoice.dueDate)}
                    </p>
                  )}
                </div>
              </div>
            </header>

            {/* ── ADRESSES ─────────────────────────────────────────────────────── */}
            <section className="flex gap-12 mb-8">
              {/* Émetteur résumé */}
              <div className="flex-1">
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-2"
                  style={{ color: primaryColor }}
                >
                  Émetteur
                </p>
                <p className="font-semibold text-gray-900">{userProfile.companyName}</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{userProfile.address}</p>
              </div>

              {/* Client */}
              {client && (
                <div className="flex-1">
                  <p
                    className="text-[10px] font-black uppercase tracking-widest mb-2"
                    style={{ color: primaryColor }}
                  >
                    Destinataire
                  </p>
                  <p className="font-semibold text-gray-900">{client.name}</p>
                  {client.contactName && (
                    <p className="text-sm text-gray-600">À l'attention de : {client.contactName}</p>
                  )}
                  <p className="text-sm text-gray-600 whitespace-pre-line">{client.address}</p>
                  {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
                  {client.siret && (
                    <p className="text-xs text-gray-400 mt-1">SIRET : {client.siret}</p>
                  )}
                  {client.tvaNumber && (
                    <p className="text-xs text-gray-400">TVA : {client.tvaNumber}</p>
                  )}
                </div>
              )}
            </section>

            {/* ── LIGNES DE FACTURATION ────────────────────────────────────────── */}
            <table className="w-full text-sm mb-6" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: primaryColor }}>
                  <th className="text-white text-left px-4 py-3 font-semibold rounded-tl-sm">
                    Description
                  </th>
                  <th className="text-white text-right px-4 py-3 font-semibold w-20">Qté</th>
                  <th className="text-white text-right px-4 py-3 font-semibold w-32">P.U. HT</th>
                  {!isVatExempt && (
                    <th className="text-white text-right px-4 py-3 font-semibold w-20">TVA %</th>
                  )}
                  <th className="text-white text-right px-4 py-3 font-semibold w-32 rounded-tr-sm">
                    Total HT
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => {
                  const lineTotal = item.quantity * item.unitPrice;
                  return (
                    <tr
                      key={item.id}
                      style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#ffffff' }}
                    >
                      <td className="px-4 py-3 text-gray-800">
                        {item.description}
                        {item.unit && (
                          <span className="text-xs text-gray-400 ml-1">({item.unit})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-mono">
                        {formatAmount(item.unitPrice)}
                      </td>
                      {!isVatExempt && (
                        <td className="px-4 py-3 text-right text-gray-500 text-xs">
                          {item.vatRate ?? 0} %
                        </td>
                      )}
                      <td className="px-4 py-3 text-right text-gray-900 font-semibold font-mono">
                        {formatAmount(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── TOTAUX ────────────────────────────────────────────────────────── */}
            <div className="flex justify-end mb-8">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total HT</span>
                  <span className="font-mono">{formatAmount(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Remise ({invoice.discount} %)</span>
                    <span className="font-mono">−{formatAmount(discountAmount)}</span>
                  </div>
                )}
                {shippingAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de port</span>
                    <span className="font-mono">{formatAmount(shippingAmount)}</span>
                  </div>
                )}
                {isVatExempt ? (
                  <div className="flex justify-between text-gray-500 text-xs italic">
                    <span>TVA</span>
                    <span>Exonéré (art. 293 B CGI)</span>
                  </div>
                ) : (
                  vatAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>TVA</span>
                      <span className="font-mono">{formatAmount(vatAmount)}</span>
                    </div>
                  )
                )}
                {depositAmount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Acompte versé</span>
                    <span className="font-mono">−{formatAmount(depositAmount)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-black text-base border-t pt-2"
                  style={{ color: primaryColor, borderColor: primaryColor }}
                >
                  <span>TOTAL TTC</span>
                  <span className="font-mono">{formatAmount(total)}</span>
                </div>
              </div>
            </div>

            {/* ── MODALITÉS DE PAIEMENT ─────────────────────────────────────────── */}
            {(userProfile.bankAccount || userProfile.bic) && (
              <section
                className="p-4 rounded-lg mb-6"
                style={{
                  backgroundColor: `${primaryColor}0f`,
                  border: `1px solid ${primaryColor}33`,
                }}
              >
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-2"
                  style={{ color: primaryColor }}
                >
                  Coordonnées bancaires
                </p>
                {userProfile.bankAccount && (
                  <p className="text-sm text-gray-700 font-mono">
                    IBAN : {userProfile.bankAccount}
                  </p>
                )}
                {userProfile.bic && (
                  <p className="text-sm text-gray-700 font-mono">BIC : {userProfile.bic}</p>
                )}
              </section>
            )}

            {/* ── NOTES ─────────────────────────────────────────────────────────── */}
            {invoice.notes && (
              <section className="mb-6">
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-1"
                  style={{ color: primaryColor }}
                >
                  Notes
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
              </section>
            )}

            {/* ── PIED DE PAGE ──────────────────────────────────────────────────── */}
            <footer
              className="text-[9px] text-gray-400 leading-relaxed pt-4"
              style={{ borderTop: '1px solid #e5e7eb' }}
            >
              {isVatExempt && (
                <p>TVA non applicable — Art. 293 B du CGI (Franchise en base de TVA)</p>
              )}
              {userProfile.legalMentions && <p>{userProfile.legalMentions}</p>}
              <p className="mt-1">
                {userProfile.companyName} — SIRET {userProfile.siret}
                {userProfile.tvaNumber && ` — TVA ${userProfile.tvaNumber}`}
              </p>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoicePaper;
