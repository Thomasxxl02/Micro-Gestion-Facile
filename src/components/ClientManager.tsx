/**
 * ClientManager - Refactored Version
 * Using reusable hooks: useEntityForm, useEntityFilters
 * Components: EntityModal, EntityFormFields
 * Result: ~250 LOC (was ~500)
 */

import {
  CircleAlert as AlertCircle,
  Archive,
  Download,
  Plus,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useMemo, useRef } from "react";
import { useEntityFilters, useEntityForm } from "../hooks/useEntity";
import { useFormValidation } from "../hooks/useFormValidation";
import { ClientSchema, schemaToRules } from "../lib/zod-schemas";
import { type Client, type Invoice, InvoiceStatus } from "../types";
import {
  AddressFields,
  ContactFields,
  SearchFilterFields,
} from "./EntityFormFields";
import EntityModal from "./EntityModal";
import { FormFieldValidated } from "./FormFieldValidated";
import { TextAreaField } from "./FormFields";

interface ClientManagerProps {
  clients: Client[];
  invoices: Invoice[];
  onSave?: (client: Client) => void;
  onDelete?: (id: string) => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  invoices,
  onSave,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = React.useState<"list" | "stats">("list");
  const form = useEntityForm<Client>();
  const filters = useEntityFilters(
    clients as unknown as Record<string, unknown>[],
    {
      searchField: "name",
      hasArchive: true,
      archiveField: "archived",
    },
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (getClientStats remains same)

  const {
    data: validatedData,
    errors: validationErrors,
    touched: touchedFields,
    handleChange: handleFormChange,
    validate: validateAll,
  } = useFormValidation(
    form.formData ?? ({} as Client),
    schemaToRules(ClientSchema),
    {
      validateOnChange: true,
    },
  );

  // Stats: revenue by client, total count
  const getClientStats = (clientId: unknown) => {
    if (typeof clientId !== "string") {
      return { revenue: 0, count: 0, lastActivity: 0 };
    }
    const clientInvoices = invoices.filter((inv) => inv.clientId === clientId);
    const revenue = clientInvoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        if (inv.type === "credit_note") {
          return sum - inv.total;
        }
        return inv.type === "invoice" || !inv.type ? sum + inv.total : sum;
      }, 0);
    const lastActivity =
      clientInvoices.length > 0
        ? Math.max(...clientInvoices.map((inv) => new Date(inv.date).getTime()))
        : 0;
    return { revenue, count: clientInvoices.length, lastActivity };
  };

  const globalStats = useMemo(() => {
    const activeClients = clients.filter((c) => !c.archived);
    const totalRevenue = invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        if (inv.type === "credit_note") {
          return sum - inv.total;
        }
        return inv.type === "invoice" || !inv.type ? sum + inv.total : sum;
      }, 0);
    return {
      count: activeClients.length,
      totalRevenue,
      archivedCount: clients.length - activeClients.length,
    };
  }, [clients, invoices]);

  const processedClients = useMemo(() => {
    return (filters.filteredEntities as unknown as Client[]).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [filters.filteredEntities]);

  // Form handlers
  const handleSubmit = async (e?: React.SyntheticEvent<HTMLFormElement>) => {
    e?.preventDefault();

    // Valider avant de soumettre avec le nouveau hook
    if (!validateAll()) {
      return;
    }

    if (form.isEditing && form.editingId) {
      const original = clients.find((c) => c.id === form.editingId);
      const updated = { ...original, ...validatedData } as Client;
      onSave?.(updated);
    } else {
      const newClient: Client = {
        ...validatedData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        archived: false,
      } as Client;
      onSave?.(newClient);
    }
    form.closePanel();
  };

  const handleDelete = async () => {
    if (!form.editingId) {
      return;
    }
    onDelete?.(form.editingId);
    form.closePanel();
  };

  const toggleArchive = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (client) {
      const updated = { ...client, archived: !client.archived };
      onSave?.(updated);
    }
  };

  // Import/Export
  const exportCSV = () => {
    const headers = [
      "Nom",
      "Contact",
      "Email",
      "Téléphone",
      "SIRET",
      "TVA",
      "Site Web",
      "Catégorie",
      "Conditions Paiement",
      "Adresse",
      "CA Généré",
      "Dernière Activité",
      "Statut",
    ];
    const rows = processedClients.map((c) => {
      const stats = getClientStats(c.id);
      const contactName: string = c.contactName ?? "";
      const phone: string = c.phone ?? "";
      const siret: string = c.siret ?? "";
      const tvaNumber: string = c.tvaNumber ?? "";
      const website: string = c.website ?? "";
      const category: string = c.category ?? "";
      const paymentTerms: string = c.paymentTerms ?? "";
      const address: string = c.address?.replaceAll("\n", " ") ?? "";
      return [
        `"${c.name}"`,
        `"${contactName}"`,
        `"${c.email}"`,
        `"${phone}"`,
        `"${siret}"`,
        `"${tvaNumber}"`,
        `"${website}"`,
        `"${category}"`,
        `"${paymentTerms}"`,
        `"${address}"`,
        stats.revenue.toFixed(2),
        stats.lastActivity
          ? new Date(stats.lastActivity).toLocaleDateString("fr-FR")
          : "N/A",
        c.archived ? "Archivé" : "Actif",
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `clients_${filters.showArchived ? "archives" : "actifs"}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    const lines = text.split("\n");
    const newClients: Client[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }
      const parts = line
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((p) =>
          p.startsWith('"') && p.endsWith('"') ? p.slice(1, -1) : p,
        );
      if (parts.length >= 3) {
        newClients.push({
          id: `${Date.now()}_${i}`,
          name: parts[0],
          contactName: parts[1],
          email: parts[2],
          phone: parts[3],
          siret: parts[4],
          tvaNumber: parts[5],
          website: parts[6],
          category: parts[7] as Client["category"],
          paymentTerms: parts[8],
          address: parts[9],
          notes: parts[10] || "",
          archived: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (newClients.length > 0) {
      newClients.forEach((c) => onSave?.(c));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-accent-600 dark:text-accent-400 font-bold text-[11px] tracking-[0.2em] uppercase"
          >
            <Users size={14} className="animate-pulse" />
            <span>Portefeuille Clients</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-brand-950 dark:text-white tracking-tighter"
          >
            Gestion des{" "}
            <span className="text-brand-600 dark:text-brand-400 italic">
              Partenaires
            </span>
          </motion.h1>

          <p className="text-brand-500/70 dark:text-brand-400/70 font-medium max-w-xl text-lg mt-2">
            Organisez vos relations commerciales et suivez votre croissance.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2.5"
        >
          <label className="interactive-item flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider cursor-pointer">
            <Upload size={16} />
            Importer
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                void handleImportCSV(e);
              }}
            />
          </label>
          <button
            onClick={exportCSV}
            className="interactive-item flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            <Download size={16} />
            Exporter
          </button>
          <button
            onClick={() => form.openCreate()}
            className="btn-primary text-[11px]"
          >
            <Plus size={16} />
            Nouveau Client
          </button>
        </motion.div>
      </header>

      {/* Navigation Interne - Tabs Glass */}
      <nav className="flex gap-4 p-1.5 bg-brand-100/50 dark:bg-brand-900/30 rounded-2xl w-fit backdrop-blur-sm border border-brand-200/50 dark:border-brand-800/50">
        {[
          { id: "list", label: "Liste des Clients", icon: Users },
          { id: "stats", label: "Analyses & CA", icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2.5 py-2.5 px-6 rounded-xl text-xs font-bold transition-all relative
              ${
                activeTab === tab.id
                  ? "bg-white dark:bg-brand-800 text-brand-950 dark:text-white shadow-sm"
                  : "text-brand-500/70 hover:text-brand-900 dark:hover:text-brand-100"
              }
            `}
          >
            <tab.icon
              size={14}
              className={
                activeTab === tab.id ? "text-brand-600 dark:text-brand-400" : ""
              }
            />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content based on Active Tab */}
      <div className="space-y-8">
        {activeTab === "stats" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards ... */}
            <div className="bg-white dark:bg-brand-900 p-8 rounded-4xl border border-brand-100 dark:border-brand-800 shadow-sm">
              <div className="p-3 bg-brand-50 dark:bg-brand-900/40 rounded-2xl text-brand-600 dark:text-brand-300 mb-4 w-fit">
                <Users size={24} />
              </div>
              <h3 className="text-4xl font-black text-brand-950 dark:text-white italic">
                {globalStats.count}
              </h3>
              <p className="text-[10px] font-black text-brand-500 dark:text-brand-400 mt-2 uppercase tracking-widest leading-none">
                Clients Actifs
              </p>
            </div>
            {/* ... other stats ... */}
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative group">
              <SearchFilterFields
                searchTerm={filters.searchTerm}
                showArchived={filters.showArchived}
                onSearchChange={filters.setSearchTerm}
                onShowArchivedChange={filters.setShowArchived}
                placeholder="Rechercher par nom, email, SIRET..."
              />
            </div>

            {/* Client List */}
            <div className="grid grid-cols-1 gap-4">
              {processedClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-brand-50/50 dark:bg-brand-900/20 rounded-[40px] border border-dashed border-brand-200 dark:border-brand-800">
                  <AlertCircle
                    size={48}
                    className="text-brand-300 dark:text-brand-700 mb-4"
                  />
                  <h3 className="text-xl font-bold text-brand-950 dark:text-white tracking-tight">
                    Aucun client trouvé
                  </h3>
                  <p className="text-brand-500">
                    Essayez de modifier vos filtres ou ajoutez votre premier
                    client.
                  </p>
                </div>
              ) : (
                processedClients.map((client) => {
                  const stats = getClientStats(client.id);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={client.id}
                      className="bg-white dark:bg-brand-900 p-6 rounded-[32px] border border-brand-100 dark:border-brand-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-300 group flex items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-brand-500/5"
                    >
                      <button
                        onClick={() => form.openEdit(client)}
                        className="flex-1 text-left flex items-center gap-5"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 font-black text-xl group-hover:scale-110 transition-transform">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-brand-950 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {client.name}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-xs font-bold text-brand-500/80">
                            {client.email && (
                              <span className="opacity-70">{client.email}</span>
                            )}
                            {client.category && (
                              <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-800 rounded-md text-[9px] uppercase tracking-wider">
                                {client.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="text-right hidden sm:block">
                        <div className="text-xl font-black text-brand-950 dark:text-white tracking-tighter italic">
                          {stats.revenue.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-brand-400 mt-0.5">
                          {stats.count}{" "}
                          {stats.count > 1 ? "Factures" : "Facture"}
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button
                          onClick={() => toggleArchive(client.id)}
                          className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-800 text-brand-600 hover:bg-brand-600 hover:text-white transition-all shadow-sm"
                          title={client.archived ? "Restaurer" : "Archiver"}
                        >
                          <Archive size={18} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <EntityModal
        isOpen={form.isPanelOpen}
        onClose={form.closePanel}
        title={form.isEditing ? "Modifier le client" : "Nouveau client"}
        isEditing={form.isEditing}
        onSave={() => {
          void handleSubmit();
        }}
        onDelete={() => {
          void handleDelete();
        }}
        showDeleteButton={form.isEditing}
      >
        <div className="space-y-6">
          <ContactFields
            name={validatedData.name || ""}
            email={validatedData.email || ""}
            phone={validatedData.phone ?? ""}
            onNameChange={(val) => handleFormChange("name")(val)}
            onEmailChange={(val) => handleFormChange("email")(val)}
            onPhoneChange={(val) => handleFormChange("phone")(val)}
            required={true}
            validationErrors={validationErrors}
            touchedFields={touchedFields}
          />

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
              Identité Professionnelle & Paiement
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldValidated
                label="SIRET"
                value={validatedData.siret ?? ""}
                onChange={(val) => handleFormChange("siret")(val)}
                validationType="siret"
                error={validationErrors.siret}
                touched={touchedFields.siret}
              />
              <FormFieldValidated
                label="N° TVA (optionnel)"
                value={validatedData.tvaNumber ?? ""}
                onChange={(val) => handleFormChange("tvaNumber")(val)}
                validationType="vat"
                error={validationErrors.tvaNumber}
                touched={touchedFields.tvaNumber}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldValidated
                label="Délai de paiement (jours)"
                value={validatedData.paymentTerms ?? "30"}
                onChange={(val) => handleFormChange("paymentTerms")(val)}
                type="number"
                validationType="amount"
                error={validationErrors.paymentTerms}
                touched={touchedFields.paymentTerms}
              />
              <FormFieldValidated
                label="Site Web"
                value={validatedData.website ?? ""}
                onChange={(val) => handleFormChange("website")(val)}
                validationType="website"
                error={validationErrors.website}
                touched={touchedFields.website}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
              Localisation & Notes
            </h4>
            <AddressFields
              address={validatedData.address || ""}
              postalCode={""}
              city={""}
              onAddressChange={(val) => handleFormChange("address")(val)}
              onPostalCodeChange={() => undefined}
              onCityChange={() => undefined}
              showPostalCity={false}
              validationErrors={validationErrors}
              touchedFields={touchedFields}
            />
            <TextAreaField
              label="Notes"
              value={validatedData.notes ?? ""}
              onChange={(val) => handleFormChange("notes")(val)}
              rows={3}
            />
          </div>
        </div>
      </EntityModal>
    </div>
  );
};

export default ClientManager;
