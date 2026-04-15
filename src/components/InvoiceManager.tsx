import {
  ArrowRightLeft,
  Calendar,
  Copy,
  Lock,
  Mail,
  MailWarning,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from "lucide-react";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useInvoiceActions } from "../hooks/useInvoiceActions";
import { signInvoice } from "../lib/electronicSignature";
import { useAppStore } from "../store/appStore";
import type {
  Client,
  DocumentType,
  Invoice,
  Product,
  UserProfile,
} from "../types";
import { InvoiceStatus } from "../types/invoice";
import { TableRowSkeleton } from "./Skeleton";

const InvoicePaper = React.lazy(() => import("./InvoicePaper"));

type FilterStatus = "all" | InvoiceStatus | string;

interface InvoiceManagerProps {
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  clients: Client[];
  userProfile: UserProfile;
  products: Product[];
  onSave?: (invoice: Invoice) => void;
  onDelete?: (id: string) => void;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices,
  setInvoices,
  clients,
  userProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  products,
  onSave,
  onDelete,
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<DocumentType | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "number" | "total">("date");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);

  const isSyncing = useAppStore((state) => state.isSyncing);

  // ─── ACTIONS ───
  const {
    getDocumentLabel,
    duplicateInvoice,
    sendByEmail,
    deleteInvoice,
    updateInvoiceStatus,
    exportToCSV,
    convertQuoteToInvoice,
    sendReminderByEmail,
  } = useInvoiceActions({
    invoices,
    setInvoices,
    clients,
    userProfile,
    onSave,
    onDelete,
  });

  // ─── STATISTIQUES ───
  const stats = useMemo(() => {
    const now = new Date();
    return invoices.reduce(
      (acc, inv) => {
        if (inv.type === "invoice") {
          acc.totalInvoiced += inv.total;
          if (
            inv.status !== InvoiceStatus.PAID &&
            inv.status !== InvoiceStatus.CANCELLED
          ) {
            acc.pendingPayment += inv.total;
            if (inv.dueDate && new Date(inv.dueDate) < now) {
              acc.overdueCount += 1;
            }
          }
        } else if (inv.type === "quote" && inv.status === InvoiceStatus.DRAFT) {
          acc.quotesToFollowUp += 1;
        }
        return acc;
      },
      {
        totalInvoiced: 0,
        pendingPayment: 0,
        overdueCount: 0,
        quotesToFollowUp: 0,
      },
    );
  }, [invoices]);

  // ─── FILTRAGE & TRI ───
  const filtered = useMemo(() => {
    const result = invoices.filter((inv) => {
      if (filterStatus !== "all" && inv.status !== filterStatus) {
        return false;
      }
      if (filterType !== "all" && inv.type !== filterType) {
        return false;
      }

      if (searchTerm) {
        const client = clients.find((c) => c.id === inv.clientId);
        const searchLower = searchTerm.toLowerCase();
        if (
          !inv.number.toLowerCase().includes(searchLower) &&
          !client?.name.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "number") {
        return b.number.localeCompare(a.number);
      }
      if (sortBy === "total") {
        return b.total - a.total;
      }
      return 0;
    });

    return result;
  }, [invoices, filterStatus, filterType, searchTerm, clients, sortBy]);

  // ─── HANDLERS ───
  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Supprimer ce document?")) {
        deleteInvoice(id);
      }
    },
    [deleteInvoice],
  );

  const handleStatusChange = useCallback(
    (id: string, status: string) => {
      updateInvoiceStatus(id, status);
    },
    [updateInvoiceStatus],
  );

  const handleBulkExport = useCallback(() => {
    if (selectedIds.size === 0) {
      alert("Sélectionnez au moins un document");
      return;
    }

    const selectedDocs = invoices.filter((i) => selectedIds.has(i.id));
    exportToCSV(selectedDocs, selectedDocs[0]?.type || "invoice");
  }, [selectedIds, invoices, exportToCSV]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) {
      alert("Sélectionnez au moins un document");
      return;
    }

    if (confirm(`Supprimer ${selectedIds.size} document(s)?`)) {
      selectedIds.forEach((id) => deleteInvoice(id));
      setSelectedIds(new Set());
    }
  }, [selectedIds, deleteInvoice]);

  const handleSign = useCallback(
    async (inv: Invoice) => {
      setSigningId(inv.id);
      try {
        const sig = await signInvoice(inv, userProfile);
        toast.success(`Facture ${inv.number} signée`, {
          description: `Empreinte : ${sig.signature.slice(0, 16)}…`,
        });
      } catch {
        toast.error("Erreur lors de la signature numérique");
      } finally {
        setSigningId(null);
      }
    },
    [userProfile],
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-brand-900 dark:text-white">
          Documents
        </h2>
        <button className="bg-brand-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-brand-800">
          <Plus size={20} />
          Nouveau
        </button>
      </div>

      {/* STATS WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Facturé HT
              </p>
              <p className="text-xl font-bold dark:text-white">
                {stats.totalInvoiced.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}{" "}
                €
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                En attente paiement
              </p>
              <p className="text-xl font-bold dark:text-white">
                {stats.pendingPayment.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}{" "}
                €
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Factures en retard
              </p>
              <p className="text-xl font-bold dark:text-white">
                {stats.overdueCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Devis à relancer
              </p>
              <p className="text-xl font-bold dark:text-white">
                {stats.quotesToFollowUp}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Rechercher... (numéro ou client)"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          />

          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilterType(e.target.value as DocumentType | "all")
            }
            className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            title="Filtrer par type de document"
          >
            <option value="all">Tous types</option>
            <option value="invoice">Factures</option>
            <option value="quote">Devis</option>
            <option value="order">Commandes</option>
            <option value="credit_note">Avoirs</option>
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilterStatus(e.target.value as FilterStatus)
            }
            className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            title="Filtrer par statut"
          >
            <option value="all">Tous statuts</option>
            <option value="Brouillon">Brouillon</option>
            <option value="Envoyée">Envoyée</option>
            <option value="Payée">Payée</option>
            <option value="Annulée">Annulée</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSortBy(e.target.value as "date" | "number" | "total")
            }
            className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            title="Trier par"
          >
            <option value="date">Date ↓</option>
            <option value="number">Numéro</option>
            <option value="total">Total €</option>
          </select>
        </div>

        {/* BULK ACTIONS */}
        {selectedIds.size > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={handleBulkExport}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Exporter ({selectedIds.size})
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* RESULTS COUNT */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filtered.length} document{filtered.length !== 1 ? "s" : ""} trouvé
        {filtered.length !== 1 ? "s" : ""}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        {isSyncing ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[...Array(6)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun document trouvé
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filtered.length &&
                      filtered.length > 0
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filtered.map((i) => i.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    className="cursor-pointer"
                    title="Sélectionner/désélectionner tous les documents"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Numéro</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Client</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-left font-semibold">Statut</th>
                <th className="px-4 py-3 text-left font-semibold">Échéance</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                const isOverdue =
                  inv.type === "invoice" &&
                  inv.status !== InvoiceStatus.PAID &&
                  inv.dueDate &&
                  new Date(inv.dueDate) < new Date();
                const isUrgent =
                  inv.type === "invoice" &&
                  inv.status !== InvoiceStatus.PAID &&
                  inv.dueDate &&
                  !isOverdue &&
                  new Date(inv.dueDate).getTime() - new Date().getTime() <
                    3 * 24 * 60 * 60 * 1000;

                const isLocked =
                  inv.type === "invoice" &&
                  (inv.status === InvoiceStatus.SENT ||
                    inv.status === InvoiceStatus.PAID);

                return (
                  <tr
                    key={inv.id}
                    className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                      isLocked ? "opacity-90" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(inv.id)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newSet = new Set(selectedIds);
                          if (e.target.checked) {
                            newSet.add(inv.id);
                          } else {
                            newSet.delete(inv.id);
                          }
                          setSelectedIds(newSet);
                        }}
                        className="cursor-pointer"
                        title={`Sélectionner le document ${inv.number}`}
                        aria-label={`Sélectionner le document ${inv.number}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold flex items-center gap-2">
                      {inv.number}
                      {isLocked && (
                        <span title="Document verrouillé">
                          <Lock size={12} className="text-gray-400" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-nowrap">
                        {getDocumentLabel(inv.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{client?.name || "N/A"}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {inv.total.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      €
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={inv.status}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleStatusChange(inv.id, e.target.value)
                        }
                        className={`px-2 py-1 rounded border text-sm dark:bg-gray-700 dark:text-white ${
                          inv.status === InvoiceStatus.PAID
                            ? "border-green-500 text-green-700 bg-green-50"
                            : ""
                        }`}
                        title={`Changer le statut du document ${inv.number}`}
                        aria-label={`Changer le statut du document ${inv.number}`}
                      >
                        <option value={InvoiceStatus.DRAFT}>Brouillon</option>
                        <option value={InvoiceStatus.SENT}>Envoyée</option>
                        <option value={InvoiceStatus.PAID}>Payée</option>
                        <option value={InvoiceStatus.PARTIALLY_PAID}>
                          Partiellement payée
                        </option>
                        <option value={InvoiceStatus.CANCELLED}>Annulée</option>
                        {inv.type === "quote" && (
                          <>
                            <option value={InvoiceStatus.ACCEPTED}>
                              Accepté
                            </option>
                            <option value={InvoiceStatus.REJECTED}>
                              Refusé
                            </option>
                          </>
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {inv.dueDate ? (
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            isOverdue
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : isUrgent
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {new Date(inv.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(inv.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {inv.type === "quote" &&
                          inv.status === InvoiceStatus.ACCEPTED && (
                            <button
                              onClick={() => convertQuoteToInvoice(inv)}
                              className="p-2 hover:bg-brand-100 dark:hover:bg-brand-900 rounded text-brand-600"
                              title="Convertir en Facture"
                              aria-label={`Convertir le devis ${inv.number} en facture`}
                            >
                              <ArrowRightLeft size={16} />
                            </button>
                          )}
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Aperçu / Imprimer"
                          aria-label={`Aperçu du document ${inv.number}`}
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => handleSign(inv)}
                          disabled={signingId === inv.id}
                          className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 disabled:opacity-50"
                          title="Signer numériquement"
                          aria-label={`Signer numériquement le document ${inv.number}`}
                        >
                          <ShieldCheck size={16} />
                        </button>
                        <button
                          onClick={() => duplicateInvoice(inv)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Dupliquer"
                          aria-label={`Dupliquer le document ${inv.number}`}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => sendByEmail(inv)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Envoyer par email"
                          aria-label={`Envoyer le document ${inv.number} par email`}
                        >
                          <Mail size={16} />
                        </button>
                        {isOverdue && (
                          <button
                            onClick={() => sendReminderByEmail(inv)}
                            className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900 rounded text-orange-600"
                            title="Relance de paiement"
                            aria-label={`Relancer la facture ${inv.number} par email`}
                          >
                            <MailWarning size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
                          title={isLocked ? "Document verrouillé" : "Supprimer"}
                          aria-label={`Supprimer le document ${inv.number}`}
                          disabled={isLocked}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── APERÇU IMPRESSION ─────────────────────────────────────────────── */}
      {previewInvoice && (
        <Suspense fallback={null}>
          <InvoicePaper
            invoice={previewInvoice}
            client={clients.find((c) => c.id === previewInvoice.clientId)}
            userProfile={userProfile}
            onClose={() => setPreviewInvoice(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default React.memo(InvoiceManager);
