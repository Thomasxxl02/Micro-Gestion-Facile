import {
  CircleAlert as AlertCircle,
  Archive,
  Download,
  Plus,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";
import React, { useMemo, useRef } from "react";
import { useEntityFilters, useEntityForm } from "../hooks/useEntity";
import { useFormValidation } from "../hooks/useFormValidation";
import { schemaToRules, SupplierSchema, type ValidationResult } from "../lib/zod-schemas";
import type { Expense, Supplier } from "../types";
import {
  AddressFields,
  ContactFields,
  SearchFilterFields,
} from "./EntityFormFields";
import EntityModal from "./EntityModal";
import { FormFieldValidated } from "./FormFieldValidated";
import { TextAreaField } from "./FormFields";

interface SupplierManagerProps {
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  expenses: Expense[];
  onSave?: (supplier: Supplier) => void;
  onDelete?: (id: string) => void;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({
  suppliers,
  setSuppliers,
  expenses,
  onSave,
  onDelete,
}) => {
  const form = useEntityForm<Supplier>();
  const filters = useEntityFilters(
    suppliers as unknown as Record<string, unknown>[],
    {
      searchField: "name",
      hasArchive: true,
      archiveField: "archived",
    },
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: validatedData,
    errors: validationErrors,
    touched: touchedFields,
    handleChange: handleFormChange,
    validate: validateAll,
  } = useFormValidation(
    form.formData ?? ({} as Supplier),
    schemaToRules(SupplierSchema),
    {
      validateOnChange: true,
    },
  );

  // Stats: spending by supplier
  const getSupplierStats = (supplierId: unknown) => {
    if (typeof supplierId !== "string") {
      return { totalSpent: 0, count: 0 };
    }
    const supplierExpenses = expenses.filter(
      (exp) => exp.supplierId === supplierId,
    );
    const totalSpent = supplierExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    return { totalSpent, count: supplierExpenses.length };
  };

  const globalStats = useMemo(() => {
    const activeSuppliers = suppliers.filter((s) => !s.archived);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return {
      count: activeSuppliers.length,
      totalExpenses,
      archivedCount: suppliers.length - activeSuppliers.length,
    };
  }, [suppliers, expenses]);

  const processedSuppliers = useMemo(() => {
    return (filters.filteredEntities as unknown as Supplier[]).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [filters.filteredEntities]);

  // Form handlers
  const handleSubmit = async (e?: React.SyntheticEvent<HTMLFormElement>) => {
    e?.preventDefault();

    // Valider avant de soumettre
    if (!validateAll()) {
      return;
    }

    if (form.isEditing && form.editingId) {
      const original = suppliers.find((s) => s.id === form.editingId);
      const updated = { ...original, ...validatedData } as Supplier;
      setSuppliers(
        suppliers.map((s) => (s.id === form.editingId ? updated : s)),
      );
      onSave?.(updated);
    } else {
      const newSupplier: Supplier = {
        ...validatedData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        archived: false,
      } as Supplier;
      setSuppliers([...suppliers, newSupplier]);
      onSave?.(newSupplier);
    }
    form.closePanel();
  };

  const handleDelete = async () => {
    if (!form.editingId) {
      return;
    }
    setSuppliers(suppliers.filter((s) => s.id !== form.editingId));
    onDelete?.(form.editingId);
    form.closePanel();
  };

  const toggleArchive = (id: string) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (supplier) {
      const updated = { ...supplier, archived: !supplier.archived };
      setSuppliers(suppliers.map((s) => (s.id === id ? updated : s)));
      onSave?.(updated);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Nom",
      "Contact",
      "Catégorie",
      "Email",
      "Téléphone",
      "Adresse",
      "SIRET",
      "TVA",
      "Site Web",
      "Conditions Paiement",
      "Notes",
      "Total Dépensé",
      "Date Création",
      "Statut",
    ];
    const rows = processedSuppliers.map((s) => {
      const supplier = s as Supplier;
      const stats = getSupplierStats(supplier.id);
      const contactName: string = supplier.contactName ?? "";
      const category: string = supplier.category ?? "";
      const email: string = supplier.email ?? "";
      const phone: string = supplier.phone ?? "";
      const address: string = supplier.address?.replaceAll("\n", " ") ?? "";
      const siret: string = supplier.siret ?? "";
      const tvaNumber: string = supplier.tvaNumber ?? "";
      const website: string = supplier.website ?? "";
      const paymentTerms: string = supplier.paymentTerms ?? "";
      const notes: string = supplier.notes?.replaceAll("\n", " ") ?? "";
      const createdAt: string = supplier.createdAt ?? "";
      return [
        '"' + s.name + '"',
        '"' + contactName + '"',
        '"' + category + '"',
        '"' + email + '"',
        '"' + phone + '"',
        '"' + address + '"',
        '"' + siret + '"',
        '"' + tvaNumber + '"',
        '"' + website + '"',
        '"' + paymentTerms + '"',
        '"' + notes + '"',
        stats.totalSpent.toFixed(2),
        '"' + createdAt + '"',
        s.archived ? '"Archivé"' : '"Actif"',
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `fournisseurs_${filters.showArchived ? "archives" : "actifs"}_${new Date().toISOString().split("T")[0]}.csv`;
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
    const newSuppliers: Supplier[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }
      const parts = line
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((p) => p.replaceAll('"', ""));
      if (parts.length >= 1) {
        newSuppliers.push({
          id: `${Date.now()}_${i}`,
          name: parts[0],
          contactName: parts[1],
          category: parts[2],
          email: parts[3],
          phone: parts[4],
          address: parts[5],
          siret: parts[6],
          tvaNumber: parts[7],
          website: parts[8],
          paymentTerms: parts[9],
          notes: parts[10],
          archived: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (newSuppliers.length > 0) {
      setSuppliers([...suppliers, ...newSuppliers]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header Premium */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-brand-950 dark:text-white font-display tracking-tight uppercase">
            Fournisseurs
          </h2>
          <p className="text-brand-400 dark:text-brand-500 font-medium mt-1">
            Gérez votre réseau de partenaires et leurs coordonnées.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-white dark:bg-brand-900 p-1.5 rounded-2xl border border-brand-200 dark:border-brand-800 flex gap-1">
            <button
              onClick={() => filters.setShowArchived(false)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                filters.showArchived
                  ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900"
                  : "text-brand-500"
              }`}
            >
              Actifs
            </button>
            <button
              onClick={() => filters.setShowArchived(true)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                filters.showArchived
                  ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900"
                  : "text-brand-500"
              }`}
            >
              Archivés
            </button>
          </div>

          <label className="btn-secondary px-4 py-2.5 cursor-pointer">
            <Upload size={18} />
            <span className="hidden sm:inline">Import</span>
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
          <button onClick={exportCSV} className="btn-secondary px-4 py-2.5">
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => form.openCreate()}
            className="btn-primary px-6 py-2.5"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>Nouveau Fournisseur</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bento-grid">
        <div className="bento-item">
          <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-300 mb-4">
            <Truck size={24} />
          </div>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white">
            {globalStats.count}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
            Fournisseurs Actifs
          </p>
        </div>
        <div className="bento-item">
          <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-2xl text-accent-600 dark:text-accent-400 mb-4">
            <Wallet size={24} />
          </div>
          <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400">
            {globalStats.totalExpenses.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
            Total Dépensé
          </p>
        </div>
        <div className="bento-item">
          <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-300 mb-4">
            <Archive size={24} />
          </div>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white">
            {globalStats.archivedCount}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">
            Archivés
          </p>
        </div>
      </div>

      {/* Search */}
      <SearchFilterFields
        searchTerm={filters.searchTerm}
        showArchived={filters.showArchived}
        onSearchChange={filters.setSearchTerm}
        onShowArchivedChange={filters.setShowArchived}
        placeholder="Rechercher par nom, email, SIRET..."
      />

      {/* Supplier List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedSuppliers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle
              size={48}
              className="text-brand-300 dark:text-brand-700 mb-4"
            />
            <h3 className="text-lg font-semibold text-brand-900 dark:text-white">
              Aucun fournisseur trouvé
            </h3>
          </div>
        ) : (
          processedSuppliers.map((supplier) => {
            const stats = getSupplierStats(supplier.id);
            return (
              <div
                key={(supplier as Supplier).id}
                className="card-modern p-6 flex flex-col justify-between group hover:border-brand-500 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 font-black text-xl shadow-inner border border-brand-100 dark:border-brand-800">
                    <Truck size={28} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${supplier.archived ? "bg-neutral-100 text-neutral-400" : "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400"}`}
                    >
                      {supplier.archived ? "Inactif" : "Partenaire"}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-xl font-black text-brand-950 dark:text-white tracking-tight leading-tight group-hover:text-brand-600 transition-colors">
                    {supplier.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500 font-bold uppercase tracking-wider">
                      {supplier.category || "Général"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-5 border-y border-neutral-100 dark:border-neutral-800/60 mb-6 group-hover:bg-neutral-50/50 dark:group-hover:bg-brand-900/10 transition-colors rounded-xl px-2 -mx-2">
                  <div>
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                      Dépenses
                    </p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                      {stats.totalSpent.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                      Opérations
                    </p>
                    <p className="text-lg font-black text-neutral-800 dark:text-neutral-200">
                      {stats.count} fact.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => form.openEdit(supplier as Supplier)}
                    className="flex-1 px-4 py-2.5 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:bg-brand-700 hover:scale-[1.02] transition-all"
                  >
                    Détails
                  </button>
                  <button
                    onClick={() => toggleArchive((supplier as Supplier).id)}
                    className={`p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 transition-all shadow-sm ${supplier.archived ? "bg-amber-50 text-amber-600 border-amber-200" : "text-neutral-400 hover:text-rose-500 hover:bg-rose-50"}`}
                    title={supplier.archived ? "Désarchiver" : "Archiver"}
                  >
                    <Archive size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Form */}
      <EntityModal
        isOpen={form.isPanelOpen}
        title={
          form.isEditing ? "Modifier le fournisseur" : "Nouveau fournisseur"
        }
        isEditing={form.isEditing}
        onClose={form.closePanel}
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
            name={validatedData.contactName || ""}
            email={validatedData.email ?? ""}
            phone={validatedData.phone ?? ""}
            onNameChange={(val) => handleFormChange("contactName")(val)}
            onEmailChange={(val) => handleFormChange("email")(val)}
            onPhoneChange={(val) => handleFormChange("phone")(val)}
            contactNameLabel="Nom du contact"
            required={true}
            validationErrors={validationErrors as Record<string, ValidationResult | undefined>}
            touchedFields={touchedFields as Record<string, boolean>}
          />

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
              Identité Professionnelle & Liens
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldValidated
                label="N° TVA (optionnel)"
                value={validatedData.tvaNumber ?? ""}
                onChange={(val) => handleFormChange("tvaNumber")(val)}
                validationType="vat"
                error={validationErrors.tvaNumber}
                touched={touchedFields.tvaNumber}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldValidated
                label="IBAN"
                value={validatedData.iban ?? ""}
                onChange={(val) => handleFormChange("iban")(val)}
                validationType="iban"
                placeholder="FR14..."
                error={validationErrors.iban}
                touched={touchedFields.iban}
              />
              <FormFieldValidated
                label="Catégorie"
                value={validatedData.category ?? ""}
                onChange={(val) => handleFormChange("category")(val)}
                type="text"
                validationType="name"
                placeholder="Ex: Matériel, Logiciel..."
                error={validationErrors.category}
                touched={touchedFields.category}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
              Localisation & Notes
            </h4>
            <AddressFields
              address={validatedData.address ?? ""}
              postalCode={""}
              city={""}
              onAddressChange={(val) => handleFormChange("address")(val)}
              onPostalCodeChange={() => undefined}
              onCityChange={() => undefined}
              showPostalCity={false}
              validationErrors={validationErrors as Record<string, ValidationResult | undefined>}
              touchedFields={touchedFields as Record<string, boolean>}
            />
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
                label="SIRET"
                value={validatedData.siret ?? ""}
                onChange={(val) => handleFormChange("siret")(val)}
                validationType="siret"
                error={validationErrors.siret}
                touched={touchedFields.siret}
              />
            </div>
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

export default SupplierManager;
