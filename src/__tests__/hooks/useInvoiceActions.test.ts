/**
 * Tests pour useInvoiceActions.ts
 * Hook centralisant toutes les actions métier sur les factures
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInvoiceActions } from '../../hooks/useInvoiceActions';
import type { Client, Invoice, UserProfile } from '../../types';

// ─── Mock getNextInvoiceNumber ────────────────────────────────────────────────

vi.mock('../../lib/invoiceNumbering', () => ({
  getNextInvoiceNumber: vi.fn().mockResolvedValue('FAC-TEST-001'),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUserProfile: UserProfile = {
  companyName: 'Test SARL',
  siret: '12345678901234',
  address: '1 rue de la Paix, 75001 Paris',
  email: 'contact@test.fr',
  phone: '0102030405',
  invoicePrefix: 'FAC',
  quotePrefix: 'DEV',
  orderPrefix: 'CMD',
  creditNotePrefix: 'AV',
  currency: 'EUR',
};

const mockClient: Client = {
  id: 'cli-1',
  name: 'Client Test',
  email: 'client@test.fr',
  phone: '0607080910',
  address: '2 avenue du Test',
  siret: '98765432100001',
  archived: false,
};

const baseInvoice: Invoice = {
  id: 'inv-1',
  number: 'FAC-001',
  date: '2026-01-15',
  dueDate: '2026-02-15',
  clientId: 'cli-1',
  items: [
    {
      id: 'item-1',
      description: 'Prestation de service',
      quantity: 10,
      unitPrice: 150,
      vatRate: 20,
    },
  ],
  total: 1800,
  status: 'DRAFT',
  type: 'invoice',
  notes: 'Note de test',
  discount: 0,
};

const mockQuote: Invoice = {
  ...baseInvoice,
  id: 'quote-1',
  number: 'DEV-001',
  type: 'quote',
  status: 'DRAFT',
};

const mockOrder: Invoice = {
  ...baseInvoice,
  id: 'order-1',
  number: 'CMD-001',
  type: 'order',
  status: 'DRAFT',
};

// ─── Helper pour créer le hook ────────────────────────────────────────────────

function createHook(
  overrides: {
    invoices?: Invoice[];
    clients?: Client[];
    onSave?: (inv: Invoice) => void;
    onDelete?: (id: string) => void;
  } = {}
) {
  const setInvoices = vi.fn();
  const onSave = overrides.onSave ?? vi.fn();
  const onDelete = overrides.onDelete ?? vi.fn();

  const { result } = renderHook(() =>
    useInvoiceActions({
      invoices: overrides.invoices ?? [baseInvoice],
      setInvoices,
      clients: overrides.clients ?? [mockClient],
      userProfile: mockUserProfile,
      onSave,
      onDelete,
    })
  );

  return { result, setInvoices, onSave, onDelete };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useInvoiceActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── getDocumentLabel ──────────────────────────────────────────────────────

  describe('getDocumentLabel', () => {
    it('retourne "Facture" pour invoice', () => {
      const { result } = createHook();
      expect(result.current.getDocumentLabel('invoice')).toBe('Facture');
    });

    it('retourne "Devis" pour quote', () => {
      const { result } = createHook();
      expect(result.current.getDocumentLabel('quote')).toBe('Devis');
    });

    it('retourne "Commande" pour order', () => {
      const { result } = createHook();
      expect(result.current.getDocumentLabel('order')).toBe('Commande');
    });

    it('retourne "Avoir" pour credit_note', () => {
      const { result } = createHook();
      expect(result.current.getDocumentLabel('credit_note')).toBe('Avoir');
    });

    it('retourne "Document" pour un type inconnu', () => {
      const { result } = createHook();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.current.getDocumentLabel('unknown' as any)).toBe('Document');
    });
  });

  // ─── duplicateInvoice ─────────────────────────────────────────────────────

  describe('duplicateInvoice', () => {
    it('crée une copie avec un nouveau numéro et status DRAFT', async () => {
      const { result, setInvoices, onSave } = createHook();

      await act(async () => {
        await result.current.duplicateInvoice(baseInvoice);
      });

      expect(setInvoices).toHaveBeenCalled();
      const newList: Invoice[] = setInvoices.mock.calls[0][0];
      const newDoc = newList[0];
      expect(newDoc.number).toBe('FAC-TEST-001');
      expect(newDoc.status).toBe('DRAFT');
      expect(newDoc.id).not.toBe(baseInvoice.id);
      expect(onSave).toHaveBeenCalledWith(newDoc);
    });

    it("ne duplique pas si l'utilisateur annule confirm", async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { result, setInvoices } = createHook();

      await act(async () => {
        await result.current.duplicateInvoice(baseInvoice);
      });

      expect(setInvoices).not.toHaveBeenCalled();
    });

    it('crée de nouveaux IDs pour chaque item', async () => {
      const { result, setInvoices } = createHook();

      await act(async () => {
        await result.current.duplicateInvoice(baseInvoice);
      });

      const newList: Invoice[] = setInvoices.mock.calls[0][0];
      const newDoc = newList[0];
      expect(newDoc.items[0].id).not.toBe(baseInvoice.items[0].id);
    });

    it('affiche une alerte si getNextInvoiceNumber échoue', async () => {
      const { getNextInvoiceNumber } = await import('../../lib/invoiceNumbering');
      vi.mocked(getNextInvoiceNumber).mockRejectedValueOnce(new Error('DB error'));
      const { result, setInvoices } = createHook();

      await act(async () => {
        await result.current.duplicateInvoice(baseInvoice);
      });

      expect(setInvoices).not.toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalled();
    });
  });

  // ─── sendByEmail ──────────────────────────────────────────────────────────

  describe('sendByEmail', () => {
    it("affiche une alerte avec l'email du client", async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.sendByEmail(baseInvoice);
      });

      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('client@test.fr'));
    });

    it("affiche un avertissement si le client n'a pas d'email", async () => {
      const clientSansEmail: Client = { ...mockClient, email: '' };
      const { result } = createHook({ clients: [clientSansEmail] });

      await act(async () => {
        await result.current.sendByEmail(baseInvoice);
      });

      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("n'a pas d'adresse email"));
    });

    it('affiche un avertissement si le client est introuvable', async () => {
      const invoiceWithUnknownClient: Invoice = { ...baseInvoice, clientId: 'unknown-id' };
      const { result } = createHook();

      await act(async () => {
        await result.current.sendByEmail(invoiceWithUnknownClient);
      });

      expect(window.alert).toHaveBeenCalled();
    });
  });

  // ─── convertQuoteToInvoice ─────────────────────────────────────────────────

  describe('convertQuoteToInvoice', () => {
    it("crée une facture de type invoice à partir d'un devis", async () => {
      const { result, setInvoices, onSave } = createHook({
        invoices: [mockQuote],
      });

      await act(async () => {
        await result.current.convertQuoteToInvoice(mockQuote);
      });

      expect(setInvoices).toHaveBeenCalled();
      const newList: Invoice[] = setInvoices.mock.calls[0][0];
      const converted = newList[0];
      expect(converted.type).toBe('invoice');
      expect(converted.number).toBe('FAC-TEST-001');
      expect(converted.linkedDocumentId).toBe(mockQuote.id);
      expect(onSave).toHaveBeenCalledWith(converted);
    });

    it("ne convertit pas si l'utilisateur annule", async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { result, setInvoices } = createHook({ invoices: [mockQuote] });

      await act(async () => {
        await result.current.convertQuoteToInvoice(mockQuote);
      });

      expect(setInvoices).not.toHaveBeenCalled();
    });

    it('marque le devis comme ACCEPTED lors de la conversion', async () => {
      const { result, setInvoices } = createHook({ invoices: [mockQuote] });

      await act(async () => {
        await result.current.convertQuoteToInvoice(mockQuote);
      });

      const newList: Invoice[] = setInvoices.mock.calls[0][0];
      // Le devis original doit être mis à jour à ACCEPTED dans la liste
      const originalQuote = newList.find((i) => i.id === mockQuote.id);
      expect(originalQuote?.status).toBe('ACCEPTED');
    });
  });

  // ─── convertOrderToInvoice ─────────────────────────────────────────────────

  describe('convertOrderToInvoice', () => {
    it("crée une facture à partir d'une commande", async () => {
      const { result, setInvoices } = createHook({ invoices: [mockOrder] });

      await act(async () => {
        await result.current.convertOrderToInvoice(mockOrder);
      });

      expect(setInvoices).toHaveBeenCalled();
      const newList: Invoice[] = setInvoices.mock.calls[0][0];
      const converted = newList[0];
      expect(converted.type).toBe('invoice');
      expect(converted.linkedDocumentId).toBe(mockOrder.id);
    });

    it("ne convertit pas si l'utilisateur annule", async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { result, setInvoices } = createHook({ invoices: [mockOrder] });

      await act(async () => {
        await result.current.convertOrderToInvoice(mockOrder);
      });

      expect(setInvoices).not.toHaveBeenCalled();
    });
  });

  // ─── createCreditNote ─────────────────────────────────────────────────────

  describe('createCreditNote', () => {
    it('crée un avoir de type credit_note', async () => {
      const { result, setInvoices, onSave } = createHook();

      await act(async () => {
        await result.current.createCreditNote(baseInvoice);
      });

      expect(setInvoices).toHaveBeenCalled();
      const newList: Invoice[] = setInvoices.mock.calls[0][0];
      const creditNote = newList[0];
      expect(creditNote.type).toBe('credit_note');
      expect(creditNote.linkedDocumentId).toBe(baseInvoice.id);
      expect(onSave).toHaveBeenCalledWith(creditNote);
    });

    it("ne crée pas l'avoir si l'utilisateur annule", async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { result, setInvoices } = createHook();

      await act(async () => {
        await result.current.createCreditNote(baseInvoice);
      });

      expect(setInvoices).not.toHaveBeenCalled();
    });
  });

  // ─── transmitPPF ──────────────────────────────────────────────────────────

  describe('transmitPPF', () => {
    it('affiche une alerte de confirmation PPF', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.transmitPPF(baseInvoice);
      });

      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining(baseInvoice.number));
    });
  });

  // ─── updateInvoiceStatus ──────────────────────────────────────────────────

  describe('updateInvoiceStatus', () => {
    it("met à jour le statut d'une facture", () => {
      const { result, setInvoices, onSave } = createHook();

      act(() => {
        result.current.updateInvoiceStatus('inv-1', 'SENT');
      });

      expect(setInvoices).toHaveBeenCalled();
      const updatedList: Invoice[] = setInvoices.mock.calls[0][0];
      expect(updatedList.find((i) => i.id === 'inv-1')?.status).toBe('SENT');
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: 'SENT' }));
    });

    it('ne fait rien si la facture est introuvable', () => {
      const { result, setInvoices } = createHook();

      act(() => {
        result.current.updateInvoiceStatus('nonexistent-id', 'PAID');
      });

      expect(setInvoices).not.toHaveBeenCalled();
    });
  });

  // ─── updateReminderDate ───────────────────────────────────────────────────

  describe('updateReminderDate', () => {
    it('met à jour la date de relance', () => {
      const { result, setInvoices, onSave } = createHook();

      act(() => {
        result.current.updateReminderDate('inv-1', '2026-03-01');
      });

      expect(setInvoices).toHaveBeenCalled();
      const updatedList: Invoice[] = setInvoices.mock.calls[0][0];
      expect(updatedList.find((i) => i.id === 'inv-1')?.reminderDate).toBe('2026-03-01');
      expect(onSave).toHaveBeenCalled();
    });

    it('ne fait rien si la facture est introuvable', () => {
      const { result, setInvoices } = createHook();

      act(() => {
        result.current.updateReminderDate('unknown', '2026-03-01');
      });

      expect(setInvoices).not.toHaveBeenCalled();
    });
  });

  // ─── deleteInvoice ────────────────────────────────────────────────────────

  describe('deleteInvoice', () => {
    it('supprime la facture après confirmation', () => {
      const { result, setInvoices, onDelete } = createHook();

      act(() => {
        result.current.deleteInvoice('inv-1');
      });

      expect(setInvoices).toHaveBeenCalled();
      const updatedList: Invoice[] = setInvoices.mock.calls[0][0];
      expect(updatedList.find((i) => i.id === 'inv-1')).toBeUndefined();
      expect(onDelete).toHaveBeenCalledWith('inv-1');
    });

    it("ne supprime pas si l'utilisateur annule", () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { result, setInvoices } = createHook();

      act(() => {
        result.current.deleteInvoice('inv-1');
      });

      expect(setInvoices).not.toHaveBeenCalled();
    });
  });

  // ─── bulkUpdateStatus ─────────────────────────────────────────────────────

  describe('bulkUpdateStatus', () => {
    it('met à jour le statut de plusieurs factures', () => {
      const invoice2: Invoice = { ...baseInvoice, id: 'inv-2', number: 'FAC-002', status: 'DRAFT' };
      const { result, setInvoices } = createHook({ invoices: [baseInvoice, invoice2] });

      act(() => {
        result.current.bulkUpdateStatus(new Set(['inv-1', 'inv-2']), 'PAID');
      });

      expect(setInvoices).toHaveBeenCalled();
      const updatedList: Invoice[] = setInvoices.mock.calls[0][0];
      expect(updatedList.every((i) => i.status === 'PAID')).toBe(true);
    });

    it('ne met pas à jour sans confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { result, setInvoices } = createHook();

      act(() => {
        result.current.bulkUpdateStatus(new Set(['inv-1']), 'PAID');
      });

      expect(setInvoices).not.toHaveBeenCalled();
    });

    it('appelle onSave pour chaque facture modifiée', () => {
      const invoice2: Invoice = { ...baseInvoice, id: 'inv-2', number: 'FAC-002', status: 'DRAFT' };
      const onSave = vi.fn();
      const { result } = createHook({ invoices: [baseInvoice, invoice2], onSave });

      act(() => {
        result.current.bulkUpdateStatus(new Set(['inv-1', 'inv-2']), 'SENT');
      });

      expect(onSave).toHaveBeenCalledTimes(2);
    });
  });

  // ─── exportToCSV ─────────────────────────────────────────────────────────

  describe('exportToCSV', () => {
    it('crée un lien de téléchargement et déclenche le click', () => {
      // Rendre le hook AVANT d'intercepter createElement
      const { result } = createHook();

      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn(),
        href: '',
        download: '',
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);

      act(() => {
        result.current.exportToCSV([baseInvoice], 'invoice');
      });

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.remove).toHaveBeenCalled();
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        expect.stringContaining('factures_export_')
      );
    });

    it('inclut les données du document dans le CSV', () => {
      const { result } = createHook();

      let csvContent = '';
      const mockLink = {
        setAttribute: vi.fn((attr: string, val: string) => {
          if (attr === 'href') csvContent = val;
        }),
        click: vi.fn(),
        remove: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);

      act(() => {
        result.current.exportToCSV([baseInvoice], 'invoice');
      });

      // Le CSV doit contenir le numéro de la facture
      expect(decodeURIComponent(csvContent)).toContain('FAC-001');
    });

    it('utilise le bon nom de fichier selon le type', () => {
      const { result } = createHook();

      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);

      act(() => {
        result.current.exportToCSV([mockQuote], 'quote');
      });

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        'download',
        expect.stringContaining('devis_export_')
      );
    });
  });
});
