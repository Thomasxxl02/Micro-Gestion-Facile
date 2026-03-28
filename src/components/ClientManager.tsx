/**
 * ClientManager - Refactored Version
 * Using reusable hooks: useEntityForm, useEntityFilters
 * Components: EntityModal, EntityFormFields
 * Result: ~250 LOC (was ~500)
 */

import { AlertCircle, Archive, Download, Plus, TrendingUp, Upload, Users } from 'lucide-react';
import React, { useMemo, useRef } from 'react';
import { useEntityFilters, useEntityForm } from '../hooks/useEntity';
import { useFormValidation } from '../hooks/useFormValidation';
import { ClientSchema } from '../lib/schemas';
import { type Client, type Invoice, InvoiceStatus } from '../types';
import { AddressFields, ContactFields, SearchFilterFields } from './EntityFormFields';
import EntityModal from './EntityModal';
import { FormFieldValidated } from './FormFieldValidated';

interface ClientManagerProps {
  clients: Client[];
  invoices: Invoice[];
  onSave?: (client: Client) => void;
  onDelete?: (id: string) => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, invoices, onSave, onDelete }) => {
  const form = useEntityForm<Client>();
  const filters = useEntityFilters(clients as unknown as Record<string, unknown>[], {
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
  } = useFormValidation(form.formData || ({} as Client), ClientSchema, { validateOnChange: true });

  // Stats: revenue by client, total count
  const getClientStats = (clientId: unknown) => {
    if (typeof clientId !== 'string') {
      return { revenue: 0, count: 0, lastActivity: 0 };
    }
    const clientInvoices = invoices.filter((inv) => inv.clientId === clientId);
    const revenue = clientInvoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        if (inv.type === 'credit_note') {
          return sum - inv.total;
        }
        return inv.type === 'invoice' || !inv.type ? sum + inv.total : sum;
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
        if (inv.type === 'credit_note') {
          return sum - inv.total;
        }
        return inv.type === 'invoice' || !inv.type ? sum + inv.total : sum;
      }, 0);
    return {
      count: activeClients.length,
      totalRevenue,
      archivedCount: clients.length - activeClients.length,
    };
  }, [clients, invoices]);

  const processedClients = useMemo(() => {
    return (filters.filteredEntities as unknown as Client[]).sort((a, b) =>
      a.name.localeCompare(b.name)
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
      'Nom',
      'Contact',
      'Email',
      'Téléphone',
      'SIRET',
      'TVA',
      'Site Web',
      'Catégorie',
      'Conditions Paiement',
      'Adresse',
      'CA Généré',
      'Dernière Activité',
      'Statut',
    ];
    const rows = processedClients.map((c) => {
      const stats = getClientStats(c.id);
      const contactName: string = c.contactName ?? '';
      const phone: string = c.phone ?? '';
      const siret: string = c.siret ?? '';
      const tvaNumber: string = c.tvaNumber ?? '';
      const website: string = c.website ?? '';
      const category: string = c.category ?? '';
      const paymentTerms: string = c.paymentTerms ?? '';
      const address: string = c.address?.replaceAll('\n', ' ') ?? '';
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
        stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString('fr-FR') : 'N/A',
        c.archived ? 'Archivé' : 'Actif',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `clients_${filters.showArchived ? 'archives' : 'actifs'}_${new Date().toISOString().split('T')[0]}.csv`;
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
    const newClients: Client[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }
      const parts = line
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((p) => (p.startsWith('"') && p.endsWith('"') ? p.slice(1, -1) : p));
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
          category: parts[7] as Client['category'],
          paymentTerms: parts[8],
          address: parts[9],
          notes: parts[10] || '',
          archived: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (newClients.length > 0) {
      newClients.forEach((c) => onSave?.(c));
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
            Gestion Clients
          </h2>
          <p className="text-brand-500 dark:text-brand-400 mt-1">
            Gérez votre portefeuille client et suivez les revenus.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-white dark:bg-brand-900 p-1.5 rounded-2xl border border-brand-200 dark:border-brand-800 flex gap-1">
            <button
              onClick={() => filters.setShowArchived(false)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                filters.showArchived
                  ? 'text-brand-500'
                  : 'bg-brand-900 text-white dark:bg-white dark:text-brand-900'
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
            <Users size={24} />
          </div>
          <h3 className="text-2xl font-bold text-brand-900 dark:text-white">{globalStats.count}</h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">Clients Actifs</p>
        </div>
        <div className="bento-item">
          <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-2xl text-accent-600 dark:text-accent-400 mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400">
            {globalStats.totalRevenue.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            })}
          </h3>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">CA Total Encaissé</p>
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

      {/* Client List */}
      <div className="space-y-3">
        {processedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={48} className="text-brand-300 dark:text-brand-700 mb-4" />
            <h3 className="text-lg font-semibold text-brand-900 dark:text-white">
              Aucun client trouvé
            </h3>
          </div>
        ) : (
          processedClients.map((client) => {
            const stats = getClientStats(client.id);
            return (
              <div
                key={client.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-brand-200 dark:border-slate-700 hover:shadow-md transition-all flex justify-between items-center group"
              >
                <button
                  onClick={() => form.openEdit(client)}
                  className="flex-1 text-left rounded-lg p-2 -m-2 hover:bg-brand-50 dark:hover:bg-brand-900/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  title="Cliquez pour modifier le client"
                >
                  <div>
                    <h4 className="font-semibold text-brand-900 dark:text-white">
                      {(client as Client).name}
                    </h4>
                    <div className="flex gap-4 mt-1 text-xs text-brand-600 dark:text-brand-300">
                      {(client as Client).email && <span>{(client as Client).email}</span>}
                      {(client as Client).phone && <span>{(client as Client).phone}</span>}
                    </div>
                  </div>
                </button>
                <div className="text-right mr-4">
                  <div className="font-semibold text-accent-600 dark:text-accent-400">
                    {stats.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                  <div className="text-xs text-brand-500 dark:text-brand-400">
                    {stats.count} facture(s)
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleArchive(client.id)}
                    className="text-xs px-3 py-1 rounded bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 transition-colors"
                    title={client.archived ? 'Restaurer le client' : 'Archiver le client'}
                  >
                    {client.archived ? 'Restaurer' : 'Archiver'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <EntityModal
        isOpen={form.isPanelOpen}
        onClose={form.closePanel}
        title={form.isEditing ? 'Modifier le client' : 'Nouveau client'}
        isEditing={form.isEditing}
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
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
              Adresse & Coordonnées
            </h4>
            <AddressFields
              address={validatedData.address || ''}
              postalCode={''}
              city={''}
              onAddressChange={(val) => handleChange('address')(val)}
              onPostalCodeChange={() => undefined}
              onCityChange={() => undefined}
            />
          </div>
        </div>
      </EntityModal>
    </div>
  );
};

export default ClientManager;
