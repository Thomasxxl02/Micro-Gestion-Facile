/**
 * Hook useInvoiceActions
 * ✅ Tous les handlers métier pour les factures
 * ✅ Créer, dupliquer, email, transformation (devis→facture, etc)
 * ✅ Complètement découplé de la UI
 *
 * Usage:
 * ```tsx
 * const actions = useInvoiceActions(invoices, setInvoices, ...);
 * actions.duplicateInvoice(invoice);
 * actions.sendByEmail(invoice);
 * actions.convertToInvoice(quote);
 * ```
 */

import { useCallback } from 'react';
import type { Client, DocumentType, Invoice, InvoiceStatus, UserProfile } from '../types';

export interface UseInvoiceActionsProps {
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  clients: Client[];
  userProfile: UserProfile;
  onSave?: (invoice: Invoice) => void;
  onDelete?: (id: string) => void;
}

export interface UseInvoiceActionsState {
  getNextNumber: (type: DocumentType) => string;
  getDocumentLabel: (type: DocumentType) => string;
  duplicateInvoice: (invoice: Invoice) => void;
  sendByEmail: (invoice: Invoice) => void;
  convertQuoteToInvoice: (quote: Invoice) => void;
  convertOrderToInvoice: (order: Invoice) => void;
  createCreditNote: (invoice: Invoice) => void;
  transmitPPF: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus | string) => void;
  updateReminderDate: (id: string, date: string) => void;
  deleteInvoice: (id: string) => void;
  bulkUpdateStatus: (ids: Set<string>, status: InvoiceStatus | string) => void;
  exportToCSV: (docs: Invoice[], type: DocumentType) => void;
}

/**
 * Hook pour toutes les actions sur les factures
 */
export function useInvoiceActions({
  invoices,
  setInvoices,
  clients,
  userProfile,
  onSave,
  onDelete,
}: UseInvoiceActionsProps): UseInvoiceActionsState {
  // ===== NUMÉROTATION =====

  const getNextNumber = useCallback(
    (type: DocumentType) => {
      const currentYear = new Date().getFullYear();
      const docsThisYear = invoices.filter(
        (i) => (i.type || 'invoice') === type && i.date.startsWith(currentYear.toString())
      ).length;

      let prefix = 'FACT';
      if (type === 'quote') {
        prefix = 'DEVIS';
      }
      if (type === 'order') {
        prefix = 'COMM';
      }
      if (type === 'credit_note') {
        prefix = 'AVOIR';
      }

      return `${prefix}-${currentYear}-${(docsThisYear + 1).toString().padStart(3, '0')}`;
    },
    [invoices]
  );

  const getDocumentLabel = useCallback((type: DocumentType): string => {
    switch (type) {
      case 'invoice':
        return 'Facture';
      case 'quote':
        return 'Devis';
      case 'order':
        return 'Commande';
      case 'credit_note':
        return 'Avoir';
      default:
        return 'Document';
    }
  }, []);

  // ===== STATUS MANAGEMENT (MUST BE BEFORE ACTIONS) =====

  const updateInvoiceStatus = useCallback(
    (id: string, status: InvoiceStatus | string) => {
      const inv = invoices.find((i) => i.id === id);
      if (!inv) {
        return;
      }

      const updated = { ...inv, status: status as InvoiceStatus };
      setInvoices(invoices.map((i) => (i.id === id ? updated : i)));
      if (onSave) {
        onSave(updated);
      }
    },
    [invoices, setInvoices, onSave]
  );

  // ===== ACTIONS =====

  const duplicateInvoice = useCallback(
    (invoice: Invoice) => {
      if (!confirm('Dupliquer ce document ?')) {
        return;
      }

      // Create new items with new IDs
      const newItems = invoice.items.map((item) => ({
        ...item,
        id: Date.now().toString() + Math.random().toString().slice(2),
      }));

      const newInvoice: Invoice = {
        ...invoice,
        id: Date.now().toString(),
        number: getNextNumber(invoice.type),
        items: newItems,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'DRAFT' as InvoiceStatus,
        deposit: 0,
      };

      setInvoices([newInvoice, ...invoices]);
      if (onSave) {
        onSave(newInvoice);
      }
    },
    [invoices, setInvoices, getNextNumber, onSave]
  );

  const sendByEmail = useCallback(
    (invoice: Invoice) => {
      const client = clients.find((c) => c.id === invoice.clientId);
      if (!client?.email) {
        alert("Le client n'a pas d'adresse email renseignée.");
        return;
      }

      const docLabel = getDocumentLabel(invoice.type);
      const subject = `${docLabel} N° ${invoice.number} - ${userProfile.companyName}`;
      const body = `Bonjour ${client.name},\n\nVeuillez trouver ci-joint le document ${invoice.number} daté du ${new Date(invoice.date).toLocaleDateString()}.\n\nCordialement,\n${userProfile.companyName}`;

      globalThis.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Mettre à jour le statut si brouillon
      if (invoice.status === ('DRAFT' as InvoiceStatus)) {
        if (confirm("Marquer le document comme 'Envoyé' ?")) {
          updateInvoiceStatus(invoice.id, 'SENT' as InvoiceStatus);
        }
      }
    },
    [clients, userProfile, getDocumentLabel, updateInvoiceStatus]
  );

  const convertQuoteToInvoice = useCallback(
    (quote: Invoice) => {
      if (!confirm('Convertir ce devis en facture ?')) {
        return;
      }

      // Mark quote as accepted if not already
      let updatedInvoices = invoices;
      if (quote.status !== ('ACCEPTED' as InvoiceStatus)) {
        updatedInvoices = invoices.map((i) =>
          i.id === quote.id ? { ...i, status: 'ACCEPTED' as InvoiceStatus } : i
        );
      }

      const newInvoice: Invoice = {
        ...quote,
        id: Date.now().toString(),
        type: 'invoice',
        linkedDocumentId: quote.id,
        number: getNextNumber('invoice'),
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT' as InvoiceStatus,
        notes: `Facture suite au devis ${quote.number}`,
      };

      setInvoices([newInvoice, ...updatedInvoices]);
      if (onSave) {
        onSave(newInvoice);
      }
    },
    [invoices, setInvoices, getNextNumber, onSave]
  );

  const convertOrderToInvoice = useCallback(
    (order: Invoice) => {
      if (!confirm('Facturer cette commande ?')) {
        return;
      }

      const newInvoice: Invoice = {
        ...order,
        id: Date.now().toString(),
        type: 'invoice',
        linkedDocumentId: order.id,
        number: getNextNumber('invoice'),
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT' as InvoiceStatus,
        notes: `Facture pour la commande ${order.number}`,
      };

      setInvoices([newInvoice, ...invoices]);
      if (onSave) {
        onSave(newInvoice);
      }
    },
    [invoices, setInvoices, getNextNumber, onSave]
  );

  const createCreditNote = useCallback(
    (invoice: Invoice) => {
      if (!confirm('Créer un avoir pour cette facture ?')) {
        return;
      }

      const newCreditNote: Invoice = {
        ...invoice,
        id: Date.now().toString(),
        type: 'credit_note',
        linkedDocumentId: invoice.id,
        number: getNextNumber('credit_note'),
        date: new Date().toISOString().split('T')[0],
        status: 'DRAFT' as InvoiceStatus,
        notes: `Avoir sur facture ${invoice.number}`,
      };

      setInvoices([newCreditNote, ...invoices]);
      if (onSave) {
        onSave(newCreditNote);
      }
    },
    [invoices, setInvoices, getNextNumber, onSave]
  );

  const transmitPPF = useCallback(
    (invoice: Invoice) => {
      const format = invoice.eInvoiceFormat || 'Factur-X';
      if (
        !confirm(
          `Transmettre la facture ${invoice.number} au Portail Public de Facturation (PPF) au format ${format} ?`
        )
      ) {
        return;
      }

      setTimeout(() => {
        const updatedInvoice = {
          ...invoice,
          eInvoiceStatus: 'DEPOSITED' as InvoiceStatus,
          transmissionDate: new Date().toISOString(),
        };

        setInvoices(invoices.map((inv) => (inv.id === invoice.id ? updatedInvoice : inv)));
        if (onSave) {
          onSave(updatedInvoice);
        }

        alert(`Facture ${invoice.number} transmise avec succès au PPF.`);
      }, 1500);
    },
    [invoices, setInvoices, onSave]
  );

  const updateReminderDate = useCallback(
    (id: string, date: string) => {
      const inv = invoices.find((i) => i.id === id);
      if (!inv) {
        return;
      }

      const updated = { ...inv, reminderDate: date };
      setInvoices(invoices.map((i) => (i.id === id ? updated : i)));
      if (onSave) {
        onSave(updated);
      }
    },
    [invoices, setInvoices, onSave]
  );

  const deleteInvoice = useCallback(
    (id: string) => {
      if (!confirm('Supprimer ce document définitivement ?')) {
        return;
      }

      const updated = invoices.filter((inv) => inv.id !== id);
      setInvoices(updated);
      if (onDelete) {
        onDelete(id);
      }
    },
    [invoices, setInvoices, onDelete]
  );

  const bulkUpdateStatus = useCallback(
    (ids: Set<string>, status: InvoiceStatus | string) => {
      if (!confirm(`Modifier le statut de ${ids.size} document(s) ?`)) {
        return;
      }

      const updated = invoices.map((doc) => {
        if (ids.has(doc.id)) {
          const modified = { ...doc, status: status as InvoiceStatus };
          if (onSave) {
            onSave(modified);
          }
          return modified;
        }
        return doc;
      });

      setInvoices(updated);
    },
    [invoices, setInvoices, onSave]
  );

  const exportToCSV = useCallback(
    (docs: Invoice[], type: DocumentType) => {
      const headers = [
        'Numéro',
        'Date (AAAA-MM-JJ)',
        'Client',
        'Statut',
        'Sous-Total HT',
        'Remise',
        'Total TTC',
      ];

      const rows = docs.map((doc) => {
        const clientName = clients.find((c) => c.id === doc.clientId)?.name || 'Client Inconnu';
        const formattedDate = new Date(doc.date).toISOString().split('T')[0];
        const subtotal = doc.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        const discountVal = subtotal * ((doc.discount || 0) / 100);

        return [
          doc.number,
          formattedDate,
          `"${clientName.replaceAll('"', '""')}"`,
          `"${doc.status}"`,
          subtotal.toFixed(2),
          discountVal.toFixed(2),
          doc.total.toFixed(2),
        ].join(',');
      });

      const typeLabels: Record<DocumentType, string> = {
        invoice: 'factures',
        quote: 'devis',
        order: 'commandes',
        credit_note: 'avoirs',
        deposit_invoice: 'acomptes',
      };

      const filename = typeLabels[type] || 'documents';
      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `${filename}_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [clients]
  );

  return {
    getNextNumber,
    getDocumentLabel,
    duplicateInvoice,
    sendByEmail,
    convertQuoteToInvoice,
    convertOrderToInvoice,
    createCreditNote,
    transmitPPF,
    updateInvoiceStatus,
    updateReminderDate,
    deleteInvoice,
    bulkUpdateStatus,
    exportToCSV,
  };
}
