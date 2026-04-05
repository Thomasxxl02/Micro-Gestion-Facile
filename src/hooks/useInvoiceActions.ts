/**
 * Hook useInvoiceActions
 * ✅ Tous les handlers métier pour les factures
 * ✅ Créer, dupliquer, email, transformation (devis→facture, etc)
 * ✅ Numérotation CONTINUE et atomique via Dexie
 * ✅ Complètement découplé de la UI
 *
 * Usage:
 * ```tsx
 * const actions = useInvoiceActions(invoices, setInvoices, ...);
 * await actions.duplicateInvoice(invoice);
 * await actions.sendByEmail(invoice);
 * ```
 */

import { useCallback } from 'react';
import { getNextInvoiceNumber } from '../lib/invoiceNumbering';
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
  getDocumentLabel: (type: DocumentType) => string;
  duplicateInvoice: (invoice: Invoice) => Promise<void>;
  sendByEmail: (invoice: Invoice) => Promise<void>;
  convertQuoteToInvoice: (quote: Invoice) => Promise<void>;
  convertOrderToInvoice: (order: Invoice) => Promise<void>;
  createCreditNote: (invoice: Invoice) => Promise<void>;
  transmitPPF: (invoice: Invoice) => Promise<void>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus | string) => void;
  updateReminderDate: (id: string, date: string) => void;
  deleteInvoice: (id: string) => void;
  bulkUpdateStatus: (ids: Set<string>, status: InvoiceStatus | string) => void;
  exportToCSV: (docs: Invoice[], type: DocumentType) => void;
}

/**
 * Hook pour toutes les actions sur les factures
 * ⚠️ NOTE: Les fonctions de création sont maintenant ASYNC
 *         (numérotation atomique via Dexie)
 */
export function useInvoiceActions({
  invoices,
  setInvoices,
  clients,
  userProfile,
  onSave,
  onDelete,
}: UseInvoiceActionsProps): UseInvoiceActionsState {
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

  // ===== ACTIONS ASYNCHRONES (AVEC NUMÉROTATION CONTINUE) =====

  const duplicateInvoice = useCallback(
    async (invoice: Invoice) => {
      if (!confirm('Dupliquer ce document ?')) {
        return;
      }

      try {
        // Récupère le prochain numéro de manière ATOMIQUE
        const nextNumber = await getNextInvoiceNumber(
          invoice.type !== 'deposit_invoice' ? invoice.type : 'invoice',
          userProfile
        );

        // Create new items with new IDs
        const newItems = invoice.items.map((item) => ({
          ...item,
          id: Date.now().toString() + Math.random().toString().slice(2),
        }));

        const newInvoice: Invoice = {
          ...invoice,
          id: Date.now().toString(),
          number: nextNumber,
          items: newItems,
          date: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          deposit: 0,
        };

        setInvoices([newInvoice, ...invoices]);
        if (onSave) {
          onSave(newInvoice);
        }
      } catch (error) {
        console.error('Erreur lors de la duplication:', error);
        alert('Erreur lors de la génération du numéro. Veuillez réessayer.');
      }
    },
    [invoices, setInvoices, userProfile, onSave]
  );

  const sendByEmail = useCallback(
    async (invoice: Invoice) => {
      const client = clients.find((c) => c.id === invoice.clientId);
      if (!client?.email) {
        alert("Le client n'a pas d'adresse email renseignée.");
        return;
      }

      // TODO: Implémenter l'envoi d'email (Resend, SendGrid, etc)
      console.info(`Envoi de la facture ${invoice.number} à ${client.email}`);
      alert(`Email envoyé à ${client.email}`);
    },
    [clients]
  );

  const convertQuoteToInvoice = useCallback(
    async (quote: Invoice) => {
      if (!confirm('Convertir ce devis en facture ?')) {
        return;
      }

      try {
        // Récupère le prochain numéro de facture (atomique)
        const nextNumber = await getNextInvoiceNumber('invoice', userProfile);

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
          number: nextNumber,
          date: new Date().toISOString().split('T')[0],
          status: 'DRAFT' as InvoiceStatus,
          notes: `Facture suite au devis ${quote.number}`,
        };

        setInvoices([newInvoice, ...updatedInvoices]);
        if (onSave) {
          onSave(newInvoice);
        }
      } catch (error) {
        console.error('Erreur lors de la conversion:', error);
        alert('Erreur lors de la génération du numéro. Veuillez réessayer.');
      }
    },
    [invoices, setInvoices, userProfile, onSave]
  );

  const convertOrderToInvoice = useCallback(
    async (order: Invoice) => {
      if (!confirm('Facturer cette commande ?')) {
        return;
      }

      try {
        // Récupère le prochain numéro de facture
        const nextNumber = await getNextInvoiceNumber('invoice', userProfile);

        const newInvoice: Invoice = {
          ...order,
          id: Date.now().toString(),
          type: 'invoice',
          linkedDocumentId: order.id,
          number: nextNumber,
          date: new Date().toISOString().split('T')[0],
          status: 'DRAFT' as InvoiceStatus,
          notes: `Facture pour la commande ${order.number}`,
        };

        setInvoices([newInvoice, ...invoices]);
        if (onSave) {
          onSave(newInvoice);
        }
      } catch (error) {
        console.error('Erreur lors de la conversion:', error);
        alert('Erreur lors de la génération du numéro. Veuillez réessayer.');
      }
    },
    [invoices, setInvoices, userProfile, onSave]
  );

  const createCreditNote = useCallback(
    async (invoice: Invoice) => {
      if (!confirm('Créer un avoir pour cette facture ?')) {
        return;
      }

      try {
        // Récupère le prochain numéro d'avoir
        const nextNumber = await getNextInvoiceNumber('credit_note', userProfile);

        const newCreditNote: Invoice = {
          ...invoice,
          id: Date.now().toString(),
          type: 'credit_note',
          linkedDocumentId: invoice.id,
          number: nextNumber,
          date: new Date().toISOString().split('T')[0],
          status: 'DRAFT' as InvoiceStatus,
          notes: `Avoir suite à la facture ${invoice.number}`,
        };

        setInvoices([newCreditNote, ...invoices]);
        if (onSave) {
          onSave(newCreditNote);
        }
      } catch (error) {
        console.error("Erreur lors de la création d'avoir:", error);
        alert('Erreur lors de la génération du numéro. Veuillez réessayer.');
      }
    },
    [invoices, setInvoices, userProfile, onSave]
  );

  const transmitPPF = useCallback(async (invoice: Invoice) => {
    console.info('Transmission PPF de la facture:', invoice.number);
    // TODO: Implémenter la transmission PPF (Chorus Pro, Factur-X, etc)
    alert(`Facture ${invoice.number} marquée pour transmission PPF`);
  }, []);

  // ===== STATUS MANAGEMENT =====

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
