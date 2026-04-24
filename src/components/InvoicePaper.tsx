import { X } from "lucide-react";
import React from "react";
import type { Client, Invoice, UserProfile } from "../types";

interface InvoicePaperProps {
  invoice: Invoice;
  client?: Client;
  userProfile: UserProfile;
  onClose: () => void;
}

const InvoicePaper: React.FC<InvoicePaperProps> = ({
  invoice,
  client,
  userProfile,
  onClose,
}) => {
  const handlePrint = () => window.print();

  const invoiceTypeLabel =
    (
      {
        quote: "Devis",
        credit_note: "Avoir",
        deposit_invoice: "Facture d'acompte",
      } as Record<string, string>
    )[invoice.type] ?? "Facture";

  return (
    <div className="fixed inset-0 bg-brand-900/70 backdrop-blur-sm z-70 flex items-center justify-center p-4 print:p-0 print:bg-transparent print:backdrop-blur-none">
      <div className="bg-white w-full max-w-2xl rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:rounded-none print:shadow-none print:overflow-visible">
        {/* Toolbar — hidden on print */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-brand-100 print:hidden">
          <h3 className="text-lg font-bold text-brand-900">Aperçu</h3>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-brand-900 text-white rounded-xl text-sm font-bold hover:bg-brand-800 transition-all"
            >
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-brand-100 rounded-xl text-brand-500 transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div
          className="overflow-y-auto flex-1 p-10 print:overflow-visible print:p-12"
          id="invoice-print-area"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-black text-brand-900">
                {userProfile.companyName}
              </h1>
              <p className="text-sm text-brand-500 mt-1 whitespace-pre-line">
                {userProfile.address}
              </p>
              {userProfile.siret && (
                <p className="text-xs text-brand-400 mt-0.5">
                  SIRET : {userProfile.siret}
                </p>
              )}
              {userProfile.email && (
                <p className="text-xs text-brand-400">{userProfile.email}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-900 uppercase tracking-wider">
                {invoiceTypeLabel}
              </div>
              <div className="text-lg font-bold text-brand-600 mt-1">
                {invoice.number}
              </div>
              <div className="text-sm text-brand-400 mt-2">
                Date : {new Date(invoice.date).toLocaleDateString("fr-FR")}
              </div>
              {invoice.dueDate && (
                <div className="text-sm text-brand-400">
                  Échéance :{" "}
                  {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>
          </div>

          {/* Client block */}
          {client && (
            <div className="mb-8 p-6 bg-brand-50 rounded-2xl">
              <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">
                Facturé à
              </div>
              <div className="font-bold text-brand-900">{client.name}</div>
              {client.address && (
                <div className="text-sm text-brand-600 whitespace-pre-line mt-1">
                  {client.address}
                </div>
              )}
              {client.siret && (
                <div className="text-xs text-brand-400 mt-1">
                  SIRET : {client.siret}
                </div>
              )}
              {client.tvaNumber && (
                <div className="text-xs text-brand-400">
                  N° TVA : {client.tvaNumber}
                </div>
              )}
            </div>
          )}

          {/* Items table */}
          <table className="w-full border-collapse mb-8">
            <thead>
              <tr className="bg-brand-900 text-white text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 rounded-tl-xl">
                  Description
                </th>
                <th className="text-right px-4 py-3">Qté</th>
                <th className="text-right px-4 py-3">Prix unitaire</th>
                <th className="text-right px-4 py-3 rounded-tr-xl">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr
                  key={idx}
                  className={`text-sm ${idx % 2 === 0 ? "" : "bg-brand-50"}`}
                >
                  <td className="px-4 py-3 text-brand-800">
                    <div className="font-medium">{item.description}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-brand-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-brand-600">
                    {item.unitPrice.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-900">
                    {(item.quantity * item.unitPrice).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-brand-600">
                <span>Total HT</span>
                <span>
                  {invoice.total.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>
              {invoice.vatAmount !== null &&
              invoice.vatAmount !== undefined &&
              invoice.vatAmount > 0 ? (
                <>
                  <div className="flex justify-between text-sm text-brand-600">
                    <span>TVA</span>
                    <span>
                      {invoice.vatAmount.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black text-brand-900 border-t border-brand-200 pt-2">
                    <span>Total TTC</span>
                    <span>
                      {(invoice.total + invoice.vatAmount).toLocaleString(
                        "fr-FR",
                        { style: "currency", currency: "EUR" },
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm text-brand-400 italic">
                    <span>TVA non applicable, art. 293 B du CGI</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-brand-900 border-t border-brand-200 pt-2">
                    <span>Total</span>
                    <span>
                      {invoice.total.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="text-sm text-brand-500 border-t border-brand-100 pt-4">
              <p className="font-bold text-brand-700 mb-1">Notes :</p>
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePaper;
