/**
 * Composant InvoicePaper
 * ✅ Affichage pur des factures/devis/commandes
 * ✅ Aucune logique métier
 * ✅ Réutilisable pour aperçu PDF, impression
 *
 * Props:
 * - invoice: Facture à afficher
 * - userProfile: Profil utilisateur (entête, infos paiement)
 * - clients: Liste des clients (pour chercher le client)
 * - linkedDocuments?: Documents liés (devis → facture)
 * - isPreview?: Mode aperçu (affiche banneau)
 * - onLinkedDocumentClick?: Callback pour ouvrir un document lié
 */

import {
  ArrowRightCircle,
  FileCheck,
  FileText,
  LinkIcon,
  Receipt,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import { useInvoiceTotals } from '../hooks/useInvoiceTotals';
import { CURRENCY_SYMBOLS, type SupportedCurrency } from '../services/currencyService';
import type { Client, Invoice, UserProfile } from '../types';

export interface InvoicePaperProps {
  invoice: Invoice;
  userProfile: UserProfile;
  clients: Client[];
  linkedInvoices?: Invoice[];
  isPreview?: boolean;
  onLinkedDocumentClick?: (invoiceId: string) => void;
}

/**
 * Utilitaire: Obtenir le titre et l'icône du type de document
 */
const getDocumentLabel = (
  type: 'invoice' | 'quote' | 'order' | 'credit_note' | 'deposit_invoice'
): { title: string; icon: React.ReactNode } => {
  const iconProps = { size: 24 };
  switch (type) {
    case 'quote':
      return { title: 'DEVIS', icon: <FileCheck {...iconProps} /> };
    case 'order':
      return { title: 'COMMANDE', icon: <ShoppingBag {...iconProps} /> };
    case 'credit_note':
      return { title: 'AVOIR', icon: <Receipt {...iconProps} /> };
    case 'deposit_invoice':
      return { title: "FACTURE D'ACOMPTE", icon: <Receipt {...iconProps} /> };
    default:
      return { title: 'FACTURE', icon: <FileText {...iconProps} /> };
  }
};

/**
 * Composant de rendu de la facture au format A4
 */
export const InvoicePaper: React.FC<InvoicePaperProps> = ({
  invoice,
  userProfile,
  clients,
  linkedInvoices = [],
  isPreview = false,
  onLinkedDocumentClick,
}) => {
  const client = clients.find((c) => c.id === invoice.clientId);
  const docType = invoice.type || 'invoice';
  const { title, icon } = getDocumentLabel(docType);

  // Trouver le document lié (parent)
  const linkedDoc = invoice.linkedDocumentId
    ? linkedInvoices.find((i) => i.id === invoice.linkedDocumentId)
    : null;

  // ===================================================
  // CALCULS DE MONTANTS (via hook réactif)
  // ===================================================
  const totals = useInvoiceTotals(invoice, userProfile);
  const { subtotalHT, discountAmount, vatAmount, total: totalTTC, balanceDue } = totals;

  // Symbole de devise du profil (€ par défaut)
  const rawCurrency = (userProfile.currency ?? 'EUR').toUpperCase();
  const baseCurrency: SupportedCurrency =
    rawCurrency === 'USD' || rawCurrency === 'GBP' ? rawCurrency : 'EUR';
  const sym = CURRENCY_SYMBOLS[baseCurrency];

  return (
    <div
      className="bg-white p-12 shadow-2xl shadow-brand-200/50 rounded-xl min-h-250 relative mx-auto print:shadow-none print:w-full print:m-0 border border-brand-100 invoice-a4"
      id="invoice-preview"
    >
      {/* Banneau Mode Aperçu */}
      {isPreview && (
        <div className="absolute top-0 right-0 left-0 bg-brand-900 text-white text-center py-1 text-[10px] font-bold uppercase tracking-[0.2em] no-print rounded-t-xl">
          Mode Aperçu
        </div>
      )}

      {/* Banneau Document Lié */}
      {linkedDoc && (
        <button
          type="button"
          className="w-full bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-8 flex items-center justify-between cursor-pointer hover:bg-brand-100 transition-all print:hidden no-print text-left"
          onClick={() => onLinkedDocumentClick?.(linkedDoc.id)}
          disabled={isPreview}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-brand-600 shadow-sm">
              <LinkIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                Document lié :{' '}
                {({ quote: 'Devis', order: 'Commande' } as Record<string, string>)[
                  linkedDoc.type
                ] ?? 'Facture'}{' '}
                #{linkedDoc.number}
              </p>
              <p className="text-[10px] text-brand-500 font-medium">
                {isPreview ? 'Document original' : 'Cliquez pour voir le document original'}
              </p>
            </div>
          </div>
          {!isPreview && <ArrowRightCircle size={18} className="text-brand-300" />}
        </button>
      )}

      {/* En-tête : Logo + Infos Entreprise + Client */}
      <div className="flex justify-between items-start mb-16">
        {/* Colonne Gauche : Données Entreprise */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-brand-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-900/10">
              {icon}
            </div>
            <h1 className="text-2xl font-bold text-brand-900 tracking-tight uppercase font-display">
              {userProfile.companyName}
            </h1>
          </div>
          <div className="text-sm text-brand-500 leading-relaxed font-medium">
            <p>{userProfile.address}</p>
            <p>
              {userProfile.email} • {userProfile.phone}
            </p>
            <p className="mt-2 font-mono text-[10px] text-brand-400 uppercase tracking-wider">
              SIRET: {userProfile.siret}
            </p>
          </div>
        </div>

        {/* Colonne Droite : Type + N° + Client */}
        <div className="text-right">
          <h2 className="text-5xl font-bold text-brand-900 mb-2 tracking-tighter font-display">
            {title}
          </h2>
          <p className="text-brand-500 font-mono font-bold text-lg tracking-wider">
            #{invoice.number}
          </p>

          <div className="mt-10 text-right bg-brand-50/50 p-6 rounded-3xl border border-brand-100 inline-block min-w-60">
            <h3 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-3">
              Client
            </h3>
            <p className="font-bold text-brand-900 text-lg font-display">{client?.name}</p>
            {client?.contactName && (
              <p className="text-sm text-brand-600 font-semibold">{client.contactName}</p>
            )}
            <p className="text-sm text-brand-500 whitespace-pre-line mt-2 leading-relaxed">
              {client?.address}
            </p>
            <div className="mt-4 space-y-1">
              {client?.siret && (
                <p className="text-[10px] text-brand-400 font-mono uppercase tracking-wider">
                  SIRET: {client.siret}
                </p>
              )}
              {client?.tvaNumber && (
                <p className="text-[10px] text-brand-400 font-mono uppercase tracking-wider">
                  TVA: {client.tvaNumber}
                </p>
              )}
              {client?.website && (
                <p className="text-[10px] text-brand-600 font-mono font-bold">
                  {client.website.replace(/^https?:\/\//, '')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dates d'Émission et Échéance */}
      <div className="flex gap-16 mb-12 border-y border-brand-100 py-8">
        <div>
          <span className="block text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-2">
            Date d&apos;émission
          </span>
          <span className="font-bold text-brand-900 text-lg font-display">
            {new Date(invoice.date).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-2">
            {docType === 'quote' ? 'Validité' : 'Échéance'}
          </span>
          <span className="font-bold text-brand-900 text-lg font-display">
            {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Tableau des Articles */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-brand-900 text-left text-[10px] font-bold text-brand-900 uppercase tracking-[0.2em]">
            <th className="py-4">Description</th>
            <th className="py-4 text-right">Qté</th>
            <th className="py-4 text-right">Prix Unitaire</th>
            {!invoice.taxExempt && <th className="py-4 text-right">TVA</th>}
            <th className="py-4 text-right">Total HT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-50 text-sm">
          {invoice.items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-6 text-brand-800 font-semibold leading-relaxed">
                {item.description}
              </td>
              <td className="py-6 text-right text-brand-500 font-medium">
                {item.quantity} {item.unit}
              </td>
              <td className="py-6 text-right text-brand-500 font-medium">
                {item.unitPrice.toFixed(2)} {sym}
              </td>
              {!invoice.taxExempt && (
                <td className="py-6 text-right text-brand-500 font-medium">
                  {item.vatRate || userProfile.defaultVatRate || 0}%
                </td>
              )}
              <td className="py-6 text-right font-bold text-brand-900 font-display">
                {(item.quantity * item.unitPrice).toFixed(2)} {sym}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Résumé Financier */}
      <div className="flex justify-end mb-16">
        <div className="w-1/2">
          <div className="space-y-4 pb-6 border-b border-brand-100">
            <div className="flex justify-between text-sm">
              <span className="text-brand-500 font-medium">Sous-Total HT</span>
              <span className="font-bold text-brand-900">
                {subtotalHT.toFixed(2)} {sym}
              </span>
            </div>

            {(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-sm text-accent-600">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Remise ({invoice.discount}%)
                </span>
                <span className="font-bold">
                  - {discountAmount.toFixed(2)} {sym}
                </span>
              </div>
            )}

            {(invoice.shipping || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-500 font-medium">Frais de port</span>
                <span className="font-bold text-brand-900">
                  + {invoice.shipping?.toFixed(2)} {sym}
                </span>
              </div>
            )}

            {invoice.taxExempt ? (
              <div className="flex justify-between text-[10px] text-brand-400 italic">
                <span>TVA non applicable, art. 293 B du CGI</span>
                <span>0.00 {sym}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-brand-500 font-medium">TVA</span>
                <span className="font-bold text-brand-900">
                  {vatAmount.toFixed(2)} {sym}
                </span>
              </div>
            )}
          </div>

          {/* Total TTC */}
          <div className="pt-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-brand-900 font-bold text-xl font-display uppercase tracking-tight">
                Total TTC
              </span>
              <span className="text-brand-900 font-bold text-3xl font-display">
                {totalTTC.toFixed(2)} {sym}
              </span>
            </div>

            {/* Acompte si existant */}
            {(invoice.deposit || 0) > 0 && (
              <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100 mt-6">
                <div className="flex justify-between text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">
                  <span>Acompte {docType === 'quote' ? 'demandé' : 'déjà réglé'}</span>
                  <span className="font-mono">
                    - {invoice.deposit?.toFixed(2)} {sym}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-xl text-brand-900 border-t border-brand-200 pt-3 font-display">
                  <span>Reste à payer</span>
                  <span>
                    {balanceDue.toFixed(2)} {sym}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="mt-auto pt-12">
        {/* Statut E-Facture 2026 */}
        {invoice.eInvoiceStatus && (
          <div className="mb-6 flex items-center justify-between p-4 bg-brand-50 rounded-2xl border border-brand-100 no-print">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl text-accent-600 shadow-sm">
                <Zap size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                  Statut E-Facture 2026
                </p>
                <p className="text-xs font-bold text-brand-900">{invoice.eInvoiceStatus}</p>
              </div>
            </div>
            {invoice.transmissionDate && (
              <div className="text-right">
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                  Transmis le
                </p>
                <p className="text-xs font-bold text-brand-900">
                  {new Date(invoice.transmissionDate).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notes et Conditions */}
        {invoice.notes && (
          <div className="mb-12 bg-brand-50/50 p-6 rounded-3xl text-sm text-brand-600 text-left border border-brand-100 relative">
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] block mb-3">
              Notes & Conditions
            </span>
            <p className="leading-relaxed">{invoice.notes}</p>
          </div>
        )}

        {/* Informations Paiement + Mentions Légales */}
        <div className="mt-12 pt-10 border-t border-brand-100 grid grid-cols-2 gap-12 text-[9px] text-brand-400 leading-relaxed font-medium uppercase tracking-wider">
          <div>
            <h4 className="font-bold text-brand-900 mb-3 tracking-[0.2em]">
              Informations de Paiement
            </h4>
            <div className="space-y-1.5 font-mono">
              <p>IBAN: {userProfile.bankAccount || 'Non renseigné'}</p>
              <p>BIC: {userProfile.bic || 'Non renseigné'}</p>
              <p className="mt-4 text-brand-500 font-sans font-bold italic">
                Règlement par virement bancaire à réception.
              </p>
            </div>
          </div>

          <div className="text-right">
            <h4 className="font-bold text-brand-900 mb-3 tracking-[0.2em]">Mentions Légales</h4>
            <div className="space-y-1.5">
              {invoice.taxExempt && (
                <p className="font-bold text-brand-600 italic">
                  TVA non applicable, art. 293 B du CGI
                </p>
              )}
              <p>Dispensé d&apos;immatriculation au RCS et au RM.</p>
              <p>Pénalités de retard : 3 fois le taux d&apos;intérêt légal.</p>
              <p>Indemnité forfaitaire pour frais de recouvrement : 40 €.</p>
              {userProfile.legalMentions && (
                <p className="mt-4 text-brand-500 italic lowercase first-letter:uppercase">
                  {userProfile.legalMentions}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* QR Code + Pied de page final */}
        <div className="mt-12 border-t border-brand-50 pt-6 flex items-end justify-between gap-8">
          {/* Identité de l'entreprise */}
          <div className="text-center text-[8px] text-brand-300 font-bold uppercase tracking-[0.3em]">
            {userProfile.companyName} • SIRET {userProfile.siret} • {userProfile.address}
          </div>

          {/* QR Code pour Chorus Pro / Factur-X */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 qr-code-print">
            <QRCodeSVG
              value={[
                `Facture:${invoice.number}`,
                `Emetteur:${userProfile.companyName}`,
                `SIRET:${userProfile.siret}`,
                `Client:${client?.name ?? ''}`,
                `Montant:${totalTTC.toFixed(2)}EUR`,
                `Date:${invoice.date}`,
                `Echeance:${invoice.dueDate}`,
              ].join('\n')}
              size={64}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
              aria-label={`QR Code facture ${invoice.number}`}
            />
            <span className="text-[7px] text-brand-300 font-mono uppercase tracking-widest">
              #{invoice.number}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePaper;
