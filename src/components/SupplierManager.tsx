import React, { useMemo, useRef } from 'react';
import type { Supplier, Expense } from '../types';
import { Plus, Download, Upload, Truck, AlertCircle, Wallet, Archive } from 'lucide-react';
import EntityModal from './EntityModal';
import { ContactFields, SearchFilterFields, AddressFields } from './EntityFormFields';
import { useEntityForm, useEntityFilters } from '../hooks/useEntity';
import { useFormValidation } from '../hooks/useFormValidation';
import { SupplierSchema } from '../lib/schemas';
import { FormFieldValidated } from './FormFieldValidated';

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
  const filters = useEntityFilters(suppliers, {
    searchField: 'name',
    hasArchive: true,
    archiveField: 'archived',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: validatedData,
    errors: _validationErrors,
    handleChange,
    validate: validateAll,
  } = useFormValidation(form.formData || ({} as Supplier), SupplierSchema, {
    validateOnChange: true,
  });

  // Stats: spending by supplier
  const getSupplierStats = (supplierId: string) => {
    const supplierExpenses = expenses.filter((exp) => exp.supplierId === supplierId);
    const totalSpent = supplierExpenses.reduce((sum, exp) => sum + exp.amount, 0);
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
    return filters.filteredEntities.sort((a, b) => a.name.localeCompare(b.name));
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
      setSuppliers(suppliers.map((s) => (s.id === form.editingId ? updated : s)));
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
      'Nom',
      'Contact',
      'Catégorie',
      'Email',
      'Téléphone',
      'Adresse',
      'SIRET',
      'TVA',
      'Site Web',
      'Conditions Paiement',
      'Notes',
      'Total Dépensé',
      'Date Création',
      'Statut',
    ];
    const rows = processedSuppliers.map((s) => {
      const stats = getSupplierStats(s.id);
      const contactName: string = s.contactName ?? '';
      const category: string = s.category ?? '';
      const email: string = s.email ?? '';
      const phone: string = s.phone ?? '';
      const address: string = s.address?.replaceAll('\n', ' ') ?? '';
      const siret: string = s.siret ?? '';
      const tvaNumber: string = s.tvaNumber ?? '';
      const website: string = s.website ?? '';
      const paymentTerms: string = s.paymentTerms ?? '';
      const notes: string = s.notes?.replaceAll('\n', ' ') ?? '';
      const createdAt: string = s.createdAt ?? '';
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
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `fournisseurs_${filters.showArchived ? 'archives' : 'actifs'}_${new Date().toISOString().split('T')[0]}.csv`;
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
    const lines = text.split('\n');
    const newSuppliers: Supplier[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.replaceAll('"', ''));
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-brand-900 dark:text-white font-display">
            Gestion Fournisseurs
          </h2>
          <p className="text-brand-500 dark:text-brand-400 mt-1">
            Gérez vos partenaires et suivez vos achats.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-white dark:bg-brand-900 p-1.5 rounded-2xl border border-brand-200 dark:border-brand-800 flex gap-1">
            <button
              onClick={() => filters.setShowArchived(false)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                filters.showArchived
                  ? 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
                  : 'text-brand-500'
              }`}
            >
              Actifs
            </button>
            <button
              onClick={() => filters.setShowArchived(true)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                filters.showArchived
                  ? 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
                  : 'text-brand-500'
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
              onChange={handleImportCSV}
            />
          </label>
          <button onClick={exportCSV} className="btn-secondary px-4 py-2.5">
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => form.openCreate()} className="btn-primary px-6 py-2.5">
            <Plus size={18} />
            Nouveau
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bento-grid">
        <div className="bento-item">
          <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-300 mb-4">
            <Truck size={24} />
          </div>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white">{globalStats.count}</h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">Fournisseurs Actifs</p>
        </div>
        <div className="bento-item">
          <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-2xl text-accent-600 dark:text-accent-400 mb-4">
            <Wallet size={24} />
          </div>
          <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400">
            {globalStats.totalExpenses.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            })}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">Total Dépensé</p>
        </div>
        <div className="bento-item">
          <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-2xl text-brand-600 dark:text-brand-300 mb-4">
            <Archive size={24} />
          </div>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white">
            {globalStats.archivedCount}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">Archivés</p>
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
      <div className="space-y-3">
        {processedSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={48} className="text-brand-300 dark:text-brand-700 mb-4" />
            <h3 className="text-lg font-semibold text-brand-900 dark:text-white">
              Aucun fournisseur trouvé
            </h3>
          </div>
        ) : (
          processedSuppliers.map((supplier) => {
            const stats = getSupplierStats(supplier.id);
            return (
              <div
                key={supplier.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-brand-200 dark:border-slate-700 hover:shadow-md transition-all flex justify-between items-center group"
              >
                <button
                  onClick={() => form.openEdit(supplier)}
                  className="flex-1 text-left rounded-lg p-2 -m-2 hover:bg-brand-50 dark:hover:bg-brand-900/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  title="Cliquez pour modifier le fournisseur"
                >
                  <div>
                    <h4 className="font-semibold text-brand-900 dark:text-white">
                      {supplier.name}
                    </h4>
                    <p className="text-sm text-brand-500 dark:text-brand-400">
                      {supplier.category || '—'} • {supplier.email}
                    </p>
                    <p className="text-xs text-brand-400 dark:text-brand-500 mt-1">
                      Total dépensé:{' '}
                      <span className="font-bold">
                        {stats.totalSpent.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </p>
                  </div>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleArchive(supplier.id)}
                    title={
                      supplier.archived ? 'Restaurer le fournisseur' : 'Archiver le fournisseur'
                    }
                    className={`p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${supplier.archived ? 'bg-amber-50 text-amber-600' : 'hover:bg-brand-50 text-brand-400'}`}
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
        title={form.isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        isEditing={form.isEditing}
        onClose={form.closePanel}
        onSave={handleSubmit}
        onDelete={handleDelete}
        showDeleteButton={form.isEditing}
      >
        <div className="space-y-6">
          <ContactFields
            name={validatedData.name || ''}
            email={validatedData.email || ''}
            phone={validatedData.phone || ''}
            onNameChange={(val) => handleChange('name')(val)}
            onEmailChange={(val) => handleChange('email')(val)}
            onPhoneChange={(val) => handleChange('phone')(val)}
            contactNameLabel="Nom du fournisseur"
            required={true}
          />

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
              Identité Professionnelle
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldValidated
                label="SIRET"
                value={validatedData.siret || ''}
                onChange={(val) => handleChange('siret')(val)}
                validationType="siret"
              />
              <FormFieldValidated
                label="N° TVA (optionnel)"
                value={validatedData.tvaNumber || ''}
                onChange={(val) => handleChange('tvaNumber')(val)}
                validationType="vat"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldValidated
                label="IBAN"
                value={validatedData.bankAccount || ''}
                onChange={(val) => handleChange('bankAccount')(val)}
                validationType="iban"
                placeholder="FR14..."
              />
              <FormFieldValidated
                label="Site Web"
                value={validatedData.website || ''}
                onChange={(val) => handleChange('website')(val)}
                validationType="website"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
              Localisation & Paiement
            </h4>
            <AddressFields
              address={validatedData.address || ''}
              postalCode={validatedData.postalCode || ''}
              city={validatedData.city || ''}
              onAddressChange={(val) => handleChange('address')(val)}
              onPostalCodeChange={(val) => handleChange('postalCode')(val)}
              onCityChange={(val) => handleChange('city')(val)}
            />
            <FormFieldValidated
              label="Délai de paiement (jours)"
              value={validatedData.paymentTerms || '30'}
              onChange={(val) => handleChange('paymentTerms')(val)}
              type="number"
              validationType="amount"
            />
          </div>
        </div>
      </EntityModal>
    </div>
  );
};

export default SupplierManager;
