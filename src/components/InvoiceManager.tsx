import {
  ArrowRightLeft,
  Calendar,
  Copy,
  Download,
  Lock,
  Mail,
  MailWarning,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X,
  User,
  Hash,
  Euro,
} from "lucide-react";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useInvoiceActions } from "../hooks/useInvoiceActions";
import { calculateDueDate } from "../lib/invoiceDates";
import { generateInvoiceNumber } from "../lib/invoiceNumbering";
import { useMixedActivityDetection } from "../hooks/useMixedActivityDetection";
import useNotificationsSound from "../hooks/useNotificationsSound";
import { signInvoice } from "../lib/electronicSignature";
import { useAppStore } from "../store/appStore";
import { useDataStore } from "../store/useDataStore";
import Combobox from "./Combobox";
import type {
  Client,
  DocumentType,
  Invoice,
  InvoiceItem,
  Product,
  UserProfile,
} from "../types";
import { InvoiceStatus } from "../types/invoice";
import MixedActivitySuggestionBanner from "./MixedActivitySuggestionBanner";
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
  /** Callback pour persister la mise à jour du profil (ex. activation du mode Mixte) */
  onSaveProfile?: (profile: UserProfile) => void;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({
  invoices,
  setInvoices,
  clients,
  userProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  products,
  onSaveProfile,
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

  // ─── NOUVEAU DOCUMENT ───
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDocType, setNewDocType] = useState<DocumentType>("invoice");
  const [newClientId, setNewClientId] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [newDate, setNewDate] = useState(today);
  const [newDueDate, setNewDueDate] = useState(() =>
    calculateDueDate(today, userProfile),
  );
  const [newItems, setNewItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [newNotes, setNewNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const resetNewForm = useCallback(() => {
    const d = new Date().toISOString().split("T")[0];
    setNewDocType("invoice");
    setNewClientId("");
    setNewDate(d);
    setNewDueDate(calculateDueDate(d, userProfile));
    setNewItems([
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);
    setNewNotes("");
  }, [userProfile]);

  const handleOpenNewForm = useCallback(() => {
    resetNewForm();
    setShowNewForm(true);
  }, [resetNewForm]);

  const handleCreateDocument = useCallback(async () => {
    if (!newClientId) {
      toast.error("Sélectionnez un client");
      return;
    }
    const validItems = newItems.filter((it) => it.description.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Ajoutez au moins une ligne");
      return;
    }
    setIsCreating(true);
    try {
      const number = await generateInvoiceNumber(newDocType, userProfile);
      const subtotal = validItems.reduce(
        (s, it) => s + it.quantity * it.unitPrice,
        0,
      );
      const newInvoice: Invoice = {
        id: crypto.randomUUID(),
        type: newDocType,
        number,
        date: newDate,
        dueDate: newDueDate,
        clientId: newClientId,
        items: validItems,
        status: InvoiceStatus.DRAFT,
        notes: newNotes,
        total: subtotal,
        subtotal,
        vatAmount: 0,
        updatedAt: new Date().toISOString(),
      };
      if (onSave) onSave(newInvoice);
      setInvoices([newInvoice, ...invoices]);
      toast.success(`${newDocType === "invoice" ? "Facture" : "Devis"} ${number} créé`);
      setShowNewForm(false);
      resetNewForm();
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  }, [
    newClientId,
    newItems,
    newDocType,
    newDate,
    newDueDate,
    newNotes,
    userProfile,
    invoices,
    setInvoices,
    onSave,
    resetNewForm,
  ]);

  const { playSound } = useNotificationsSound();
  const isSyncing = useAppStore((state) => state.isSyncing);
  const updateUserProfile = useDataStore((state) => state.updateUserProfile);

  // ─── DÉTECTION ACTIVITÉ MIXTE ───
  const {
    shouldShowSuggestion: showMixedBanner,
    ventilation: mixedVentilation,
    dismiss: dismissMixedBanner,
  } = useMixedActivityDetection(invoices, userProfile);

  const handleActivateMixedProfile = useCallback(
    (update: Partial<UserProfile>) => {
      updateUserProfile(() => update);
      if (onSaveProfile) {
        onSaveProfile({ ...userProfile, ...update });
      }
      toast.success("Profil Mixte activé", {
        description:
          "La ventilation Ventes / Services est maintenant prise en compte pour vos déclarations URSSAF.",
      });
    },
    [userProfile, updateUserProfile, onSaveProfile],
  );

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
      if (status === InvoiceStatus.PAID) {
        void playSound("success");
      }
    },
    [updateInvoiceStatus, playSound],
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
        void playSound("success");
        toast.success(`Facture ${inv.number} signée`, {
          description: `Empreinte : ${sig.signature.slice(0, 16)}…`,
        });
      } catch {
        void playSound("error");
        toast.error("Erreur lors de la signature numérique");
      } finally {
        setSigningId(null);
      }
    },
    [userProfile, playSound],
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-brand-900 dark:text-white font-display tracking-tight">
            Documents
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">
            Gérez vos devis, factures et avoirs en toute simplicité.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkExport}
            className="btn-secondary"
            title="Exporter la sélection"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleOpenNewForm}
            className="btn-primary"
          >
            <Plus size={20} />
            <span>Nouveau Document</span>
          </button>
        </div>
      </div>

      {/* ── BANNIÈRE ACTIVITÉ MIXTE ──────────────────────────────────────────── */}
      {showMixedBanner && mixedVentilation && (
        <MixedActivitySuggestionBanner
          ventilation={mixedVentilation}
          userProfile={userProfile}
          onActivate={handleActivateMixedProfile}
          onDismiss={dismissMixedBanner}
        />
      )}

      {/* STATS WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-modern p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Total HT
              </p>
              <p className="text-xl font-black text-brand-900 dark:text-white font-display mt-0.5">
                {stats.totalInvoiced.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}{" "}
                €
              </p>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                En attente HT
              </p>
              <p className="text-xl font-black text-brand-900 dark:text-white font-display mt-0.5">
                {stats.pendingPayment.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                })}{" "}
                €
              </p>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                En retard
              </p>
              <p className="text-xl font-black text-brand-900 dark:text-white font-display mt-0.5">
                {stats.overdueCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card-modern p-6 border-l-4 border-l-brand-600">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Devis ouverts
              </p>
              <p className="text-xl font-black text-brand-900 dark:text-white font-display mt-0.5">
                {stats.quotesToFollowUp}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white/50 dark:bg-neutral-900/50 p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="input-modern"
            />
          </div>

          <select
            value={filterType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilterType(e.target.value as DocumentType | "all")
            }
            className="input-modern"
            title="Filtrer par type de document"
          >
            <option value="all">Tous types</option>
            <option value="invoice">Factures</option>
            <option value="quote">Devis</option>
            <option value="order">Commandes</option>
            <option value="credit_note">Avoirs</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilterStatus(e.target.value as FilterStatus)
            }
            className="input-modern"
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
        {/* eslint-disable-next-line no-nested-ternary */}
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
              {/* eslint-disable-next-line complexity */}
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

                const dueBadgeClass = isOverdue
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  : (isUrgent &&
                      "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300") ||
                    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";

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
                    <td className="px-4 py-3">{client?.name ?? "N/A"}</td>
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
                        className={`px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider dark:bg-gray-700 dark:text-white transition-all ${
                          inv.status === InvoiceStatus.PAID
                            ? "badge-paid-minimal"
                            : "border-gray-200"
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
                          className={`text-xs font-semibold px-2 py-1 rounded ${dueBadgeClass}`}
                        >
                          {new Date(inv.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {userProfile.dateFormat === "YYYY-MM-DD"
                        ? new Date(inv.date).toISOString().split("T")[0]
                        : new Date(inv.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {inv.type === "quote" &&
                          inv.status === InvoiceStatus.ACCEPTED && (
                            <button
                              onClick={() => {
                                void convertQuoteToInvoice(inv);
                              }}
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
                          onClick={() => {
                            void handleSign(inv);
                          }}
                          disabled={signingId === inv.id}
                          className="p-2 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded text-sky-600 dark:text-sky-400 disabled:opacity-50 transition-colors"
                          title="Signer numériquement"
                          aria-label={`Signer numériquement le document ${inv.number}`}
                        >
                          <ShieldCheck size={16} />
                        </button>
                        <button
                          onClick={() => {
                            void duplicateInvoice(inv);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Dupliquer"
                          aria-label={`Dupliquer le document ${inv.number}`}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => {
                            void sendByEmail(inv);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Envoyer par email"
                          aria-label={`Envoyer le document ${inv.number} par email`}
                        >
                          <Mail size={16} />
                        </button>
                        {isOverdue && (
                          <button
                            onClick={() => {
                              void sendReminderByEmail(inv);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded text-gray-600"
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

      {/* ── FORMULAIRE NOUVEAU DOCUMENT ──────────────────────────────────── */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm w-full h-full border-none cursor-default transition-opacity"
            onClick={() => setShowNewForm(false)}
            aria-label="Fermer"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-doc-title"
            className="relative w-full max-w-2xl max-h-[95vh] flex flex-col rounded-3xl bg-white dark:bg-brand-900 shadow-2xl border border-brand-100 dark:border-brand-800 animate-in fade-in zoom-in duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-brand-100 dark:border-brand-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 dark:bg-brand-800/50 text-brand-600 dark:text-brand-400 rounded-2xl">
                  <Plus size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2
                    id="new-doc-title"
                    className="text-xl font-black text-brand-950 dark:text-white tracking-tight"
                  >
                    Nouveau document
                  </h2>
                  <p className="text-[11px] font-bold text-brand-400 uppercase tracking-widest">
                    Vente & Prestation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewForm(false)}
                className="p-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-800 text-brand-400 hover:text-brand-600 transition-colors"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
              {/* Type Selector - Chips Modernes */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Hash size={12} /> Type de document
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: "invoice", label: "Facture" },
                      { value: "quote", label: "Devis" },
                      { value: "order", label: "Commande" },
                      { value: "credit_note", label: "Avoir" },
                    ] as { value: DocumentType; label: string }[]
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewDocType(value)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                        newDocType === value
                          ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/20"
                          : "bg-white dark:bg-brand-900 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800 hover:border-brand-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Choice - Combobox */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <User size={12} /> Client
                </label>
                <Combobox
                  options={clients.map((c) => ({
                    id: c.id,
                    label: c.name,
                    subLabel: c.email || c.phone || "Pas de contact",
                  }))}
                  value={newClientId}
                  onChange={setNewClientId}
                  placeholder="Rechercher un client..."
                />
              </div>

              {/* Dates - Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={12} /> Émission
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      setNewDueDate(
                        calculateDueDate(e.target.value, userProfile),
                      );
                    }}
                    className="input-modern w-full"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={12} /> Échéance
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="input-modern w-full"
                  />
                </div>
              </div>

              {/* Items Lignes - Style Premium */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em]">
                    Détail des prestations
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewItems((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          description: "",
                          quantity: 1,
                          unitPrice: 0,
                        },
                      ])
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-wider hover:bg-brand-100 transition-colors"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                </div>

                <div className="space-y-3">
                  {newItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-800/20 border border-brand-100/50 dark:border-brand-700/30 transition-all hover:border-brand-200"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Libellé de la prestation ou produit..."
                          value={item.description}
                          onChange={(e) =>
                            setNewItems((prev) =>
                              prev.map((it, i) =>
                                i === idx
                                  ? { ...it, description: e.target.value }
                                  : it,
                              ),
                            )
                          }
                          className="w-full bg-transparent border-none p-0 text-sm font-bold text-brand-900 dark:text-brand-50 focus:ring-0 placeholder:text-brand-300"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-brand-900 px-2 py-1 rounded-xl border border-brand-100 dark:border-brand-700">
                          <input
                            type="number"
                            placeholder="Qté"
                            min={0}
                            value={item.quantity}
                            onChange={(e) =>
                              setNewItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        quantity: parseFloat(e.target.value) || 0,
                                      }
                                    : it,
                                ),
                              )
                            }
                            className="w-12 bg-transparent border-none p-1 text-sm font-bold text-center focus:ring-0"
                          />
                          <span className="text-[10px] font-black text-brand-300 uppercase">
                            Qté
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-brand-900 px-3 py-1 rounded-xl border border-brand-100 dark:border-brand-700">
                          <input
                            type="number"
                            placeholder="Prix"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={(e) =>
                              setNewItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        unitPrice:
                                          parseFloat(e.target.value) || 0,
                                      }
                                    : it,
                                ),
                              )
                            }
                            className="w-20 bg-transparent border-none p-1 text-sm font-bold text-right focus:ring-0"
                          />
                          <Euro size={12} className="text-brand-300" />
                        </div>
                        <div className="w-20 text-right text-sm font-black text-brand-950 dark:text-brand-50">
                          {(item.quantity * item.unitPrice).toLocaleString(
                            "fr-FR",
                            { minimumFractionDigits: 2 },
                          )}
                        </div>
                        {newItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewItems((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="p-2 text-brand-300 hover:text-rose-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end p-4 rounded-2xl bg-brand-950 dark:bg-white text-white dark:text-brand-950 shadow-xl">
                  <div className="flex items-baseline gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      Total HT
                    </span>
                    <span className="text-2xl font-black">
                      {newItems
                        .reduce((s, it) => s + it.quantity * it.unitPrice, 0)
                        .toLocaleString("fr-FR", { minimumFractionDigits: 2 })}{" "}
                      €
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em]">
                  Notes & Conditions
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Précisez ici vos conditions, RIB ou autres mentions..."
                  className="input-modern w-full resize-none text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-8 py-6 border-t border-brand-100 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-800/20">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-6 py-3 text-sm font-bold rounded-2xl border border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:bg-white dark:hover:bg-brand-800 transition-all"
              >
                Plus tard
              </button>
              <button
                type="button"
                onClick={() => void handleCreateDocument()}
                disabled={isCreating}
                className="px-8 py-3 text-sm font-black rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {isCreating ? "Finalisation..." : "Générer le document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(InvoiceManager);
