import React, { useState, useMemo } from 'react';
import { Client, Invoice, InvoiceStatus } from '../types';
import { Plus, Search, Trash2, Mail, MapPin, Phone, Users, X, Edit2, TrendingUp, FileText, Download, SortAsc, Calendar, StickyNote, Archive, RefreshCcw, Globe, User, CreditCard, Clock, Tag, Upload, Zap, ArrowRightCircle } from 'lucide-react';

interface ClientManagerProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  invoices: Invoice[];
  onSave?: (client: Client) => void;
  onDelete?: (id: string) => void;
}

type SortOption = 'name' | 'revenue' | 'activity' | 'date' | 'siret_asc' | 'siret_desc';

const ClientManager: React.FC<ClientManagerProps> = ({ clients, setClients, invoices, onSave, onDelete }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    address: '',
    siret: '',
    siren: '',
    isPublicEntity: false,
    phone: '',
    notes: '',
    contactName: '',
    website: '',
    tvaNumber: '',
    paymentTerms: '30 jours',
    category: 'Entreprise'
  });

  // --- STATISTICS HELPERS ---
  const globalStats = useMemo(() => {
    const activeClients = clients.filter(c => !c.archived);
    const totalRevenue = invoices
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
         if (inv.type === 'credit_note') return sum - inv.total;
         if (!inv.type || inv.type === 'invoice') return sum + inv.total;
         return sum;
      }, 0);
    
    return {
        count: activeClients.length,
        totalRevenue,
        archivedCount: clients.length - activeClients.length
    };
  }, [clients, invoices]);

  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    
    // Revenue (Paid invoices - Credit Notes)
    const revenue = clientInvoices
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
         if (inv.type === 'credit_note') return sum - inv.total;
         if (!inv.type || inv.type === 'invoice') return sum + inv.total;
         return sum;
      }, 0);

    // Last Activity Date
    const dates = clientInvoices.map(inv => new Date(inv.date).getTime());
    const lastActivity = dates.length > 0 ? Math.max(...dates) : 0;

    return {
      revenue,
      count: clientInvoices.length,
      lastActivity
    };
  };

  // --- SORTING & FILTERING ---

  const processedClients = useMemo(() => {
    // 1. Filter by Archive Status
    let result = clients.filter(c => !!c.archived === showArchived);

    // 2. Filter by Search (Name, Email, SIRET, Notes)
    const term = searchTerm.toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term) ||
      (c.siret && c.siret.includes(term)) ||
      (c.notes && c.notes.toLowerCase().includes(term))
    );

    // 3. Sort
    return result.sort((a, b) => {
      const statsA = getClientStats(a.id);
      const statsB = getClientStats(b.id);

      if (sortBy === 'revenue') return statsB.revenue - statsA.revenue;
      if (sortBy === 'activity') return statsB.lastActivity - statsA.lastActivity;
      if (sortBy === 'date') return parseInt(b.id) - parseInt(a.id); // Descending (Newest first)
      if (sortBy === 'siret_asc') return (a.siret || '').localeCompare(b.siret || '');
      if (sortBy === 'siret_desc') return (b.siret || '').localeCompare(a.siret || '');
      return a.name.localeCompare(b.name);
    });
  }, [clients, searchTerm, sortBy, invoices, showArchived]);

  // --- ACTIONS ---

  const openCreate = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      email: '', 
      address: '', 
      siret: '', 
      siren: '',
      isPublicEntity: false,
      phone: '', 
      notes: '',
      contactName: '',
      website: '',
      tvaNumber: '',
      paymentTerms: '30 jours',
      category: 'Entreprise'
    });
    setIsPanelOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({ ...client });
    setIsPanelOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingId) {
        const updatedClient = { ...clients.find(c => c.id === editingId), ...formData } as Client;
        setClients(clients.map(c => c.id === editingId ? updatedClient : c));
        if (onSave) onSave(updatedClient);
    } else {
        const client: Client = {
            id: Date.now().toString(),
            name: formData.name || '',
            email: formData.email || '',
            address: formData.address || '',
            siret: formData.siret,
            siren: formData.siren,
            isPublicEntity: formData.isPublicEntity,
            phone: formData.phone,
            notes: formData.notes,
            contactName: formData.contactName,
            website: formData.website,
            tvaNumber: formData.tvaNumber,
            paymentTerms: formData.paymentTerms,
            category: formData.category as any,
            createdAt: new Date().toISOString(),
            archived: false
        };
        setClients([...clients, client]);
        if (onSave) onSave(client);
    }
    setIsPanelOpen(false);
  };

  const toggleArchiveClient = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const client = clients.find(c => c.id === id);
      if (client) {
          const updated = { ...client, archived: !client.archived };
          setClients(clients.map(c => c.id === id ? updated : c));
          if (onSave) onSave(updated);
      }
  };

  const handleDeleteClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client DÉFINITIVEMENT ? Cette action est irréversible.')) {
      setClients(clients.filter(c => c.id !== id));
      if (onDelete) onDelete(id);
    }
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Contact', 'Email', 'Téléphone', 'SIRET', 'TVA', 'Site Web', 'Catégorie', 'Conditions Paiement', 'Adresse', 'Notes', 'CA Généré', 'Dernière Activité', 'Statut', 'Date Création'];
    const rows = processedClients.map(c => {
        const stats = getClientStats(c.id);
        return [
            `"${c.name}"`,
            `"${c.contactName || ''}"`,
            `"${c.email}"`,
            `"${c.phone || ''}"`,
            `"${c.siret || ''}"`,
            `"${c.tvaNumber || ''}"`,
            `"${c.website || ''}"`,
            `"${c.category || ''}"`,
            `"${c.paymentTerms || ''}"`,
            `"${c.address?.replace(/\n/g, ' ') || ''}"`,
            `"${c.notes?.replace(/\n/g, ' ') || ''}"`,
            stats.revenue.toFixed(2),
            stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Jamais',
            c.archived ? 'Archivé' : 'Actif',
            c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clients_${showArchived ? 'archives' : 'actifs'}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newClients: Client[] = [];

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser (doesn't handle commas inside quotes perfectly but good enough for basic import)
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, ''));
        
        if (parts.length >= 3) {
          newClients.push({
            id: (Date.now() + i).toString(),
            name: parts[0],
            contactName: parts[1],
            email: parts[2],
            phone: parts[3],
            siret: parts[4],
            tvaNumber: parts[5],
            website: parts[6],
            category: parts[7] as any,
            paymentTerms: parts[8],
            address: parts[9],
            notes: parts[10],
            archived: false,
            createdAt: new Date().toISOString()
          });
        }
      }

      if (newClients.length > 0) {
        setClients([...clients, ...newClients]);
        alert(`${newClients.length} clients importés avec succès.`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto relative pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-brand-900 dark:text-white tracking-tight font-display text-gradient">Gestion Clients</h2>
          <p className="text-brand-500 dark:text-brand-400 mt-1">Gérez votre portefeuille et suivez les revenus par client.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
            {/* Archive Toggle */}
            <div className="bg-white dark:bg-brand-900 p-1.5 rounded-2xl shadow-sm border border-brand-200 dark:border-brand-800 flex gap-1">
               <button 
                 onClick={() => setShowArchived(false)}
                 className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${!showArchived ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900 shadow-lg' : 'text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800'}`}
               >
                 Actifs
               </button>
               <button 
                 onClick={() => setShowArchived(true)}
                 className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${showArchived ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900 shadow-lg' : 'text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-800'}`}
               >
                 Archivés
               </button>
            </div>

            <div className="flex gap-2">
                <label className="btn-secondary px-4 py-2.5 cursor-pointer" title="Importer des clients depuis un CSV">
                    <Upload size={18} />
                    <span className="hidden sm:inline">Import</span>
                    <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
                </label>
                <button 
                    onClick={exportCSV}
                    className="btn-secondary px-4 py-2.5"
                    title={showArchived ? "Exporter les clients archivés" : "Exporter les clients actifs"}
                >
                    <Download size={18} />
                    <span className="hidden sm:inline">Export</span>
                </button>
                <button 
                    onClick={openCreate}
                    className="btn-primary px-6 py-2.5"
                >
                    <Plus size={18} />
                    Nouveau
                </button>
            </div>
        </div>
      </div>

      {/* Stats Summary Bento */}
      <div className="bento-grid">
          <div className="bento-item">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[var(--bg-main)] rounded-2xl text-[var(--text-main)]">
                      <Users size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Clients Actifs</span>
              </div>
              <div>
                  <h3 className="text-2xl font-bold text-[var(--text-main)] font-display">{globalStats.count}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Portefeuille client actuel</p>
              </div>
          </div>
          <div className="bento-item">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-accent-100 dark:bg-accent-900/30 rounded-2xl text-accent-600 dark:text-accent-400">
                      <TrendingUp size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">CA Total Encaissé</span>
              </div>
              <div>
                  <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400 font-display">{globalStats.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Revenu cumulé</p>
              </div>
          </div>
          <div className="bento-item">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[var(--bg-main)] rounded-2xl text-[var(--text-main)]">
                      <Archive size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Clients Archivés</span>
              </div>
              <div>
                  <h3 className="text-2xl font-bold text-[var(--text-main)] font-display">{globalStats.archivedCount}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Clients inactifs</p>
              </div>
          </div>
          <div className="bento-item bg-brand-900 dark:bg-white text-white dark:text-brand-900">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/10 dark:bg-brand-100 rounded-2xl">
                      <Zap size={24} className="text-white dark:text-brand-900" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-300 dark:text-brand-500 uppercase tracking-widest">Action Rapide</span>
              </div>
              <div>
                  <h3 className="text-lg font-bold font-display">Besoin d'aide ?</h3>
                  <button className="mt-2 text-xs font-bold flex items-center gap-2 hover:underline">
                      Consulter l'assistant IA <ArrowRightCircle size={14} />
                  </button>
              </div>
          </div>
      </div>

      {/* Side Panel Form */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[var(--card-bg)] shadow-2xl transform transition-transform duration-500 ease-in-out z-50 border-l border-[var(--card-border)] ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="p-8 border-b border-[var(--card-border)] flex justify-between items-center bg-[var(--bg-main)]/30">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] font-display">{editingId ? 'Modifier le client' : 'Nouveau client'}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Remplissez les informations détaillées ci-dessous.</p>
                </div>
                <button onClick={() => setIsPanelOpen(false)} className="p-2.5 hover:bg-[var(--bg-main)] rounded-xl text-[var(--text-muted)] transition-all">
                    <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] border-b border-[var(--card-border)] pb-2">Informations Générales</div>
                    <div>
                        <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Nom / Société <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-4 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="Ex: Entreprise SAS"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <User size={12} className="text-brand-400" /> Contact Principal
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300"
                                value={formData.contactName}
                                onChange={e => setFormData({...formData, contactName: e.target.value})}
                                placeholder="Prénom Nom"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Tag size={12} className="text-brand-400" /> Catégorie
                            </label>
                            <select 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 appearance-none cursor-pointer"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value as any})}
                            >
                                <option value="Entreprise">Entreprise</option>
                                <option value="Particulier">Particulier</option>
                                <option value="Association">Association</option>
                                <option value="Public">Secteur Public</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] border-b border-brand-50 pb-2">Coordonnées</div>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">Email Contact <span className="text-red-500">*</span></label>
                        <input 
                            type="email" 
                            required
                            className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            placeholder="contact@exemple.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">Téléphone</label>
                            <input 
                                type="tel" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                placeholder="06 00 00 00 00"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Globe size={12} className="text-brand-400" /> Site Web
                            </label>
                            <input 
                                type="url" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300"
                                value={formData.website}
                                onChange={e => setFormData({...formData, website: e.target.value})}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">Adresse de facturation</label>
                        <textarea 
                            className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300 resize-none"
                            rows={3}
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            placeholder="123 Rue de la Paix..."
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] border-b border-brand-50 pb-2">Informations Légales & Paiement</div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">SIRET</label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300"
                                value={formData.siret}
                                onChange={e => setFormData({...formData, siret: e.target.value})}
                                placeholder="14 chiffres"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">SIREN</label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300"
                                value={formData.siren}
                                onChange={e => setFormData({...formData, siren: e.target.value})}
                                placeholder="9 chiffres"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-3 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl cursor-pointer hover:bg-brand-50 transition-all">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-lg text-brand-900 focus:ring-brand-900 border-brand-200"
                                checked={formData.isPublicEntity || false}
                                onChange={e => setFormData({...formData, isPublicEntity: e.target.checked})}
                            />
                            <div>
                                <p className="text-xs font-bold text-brand-900">Entité Publique (Chorus Pro)</p>
                                <p className="text-[10px] text-brand-400 font-medium">Cochez si ce client est une administration ou un organisme public.</p>
                            </div>
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <CreditCard size={12} className="text-brand-400" /> N° TVA
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300"
                                value={formData.tvaNumber}
                                onChange={e => setFormData({...formData, tvaNumber: e.target.value})}
                                placeholder="FR..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Clock size={12} className="text-brand-400" /> Conditions de paiement
                        </label>
                        <select 
                            className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 appearance-none cursor-pointer"
                            value={formData.paymentTerms}
                            onChange={e => setFormData({...formData, paymentTerms: e.target.value})}
                        >
                            <option value="À réception">À réception</option>
                            <option value="15 jours">15 jours</option>
                            <option value="30 jours">30 jours</option>
                            <option value="30 jours fin de mois">30 jours fin de mois</option>
                            <option value="45 jours">45 jours</option>
                            <option value="60 jours">60 jours</option>
                        </select>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] border-b border-brand-50 pb-2">Notes Internes</div>
                    <textarea 
                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 placeholder:text-brand-300 resize-none italic text-sm"
                        rows={3}
                        value={formData.notes || ''}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        placeholder="Code porte, préférences, contact secondaire..."
                    />
                </div>
            </form>

            <div className="p-8 border-t border-brand-50 bg-brand-50/30 flex justify-end gap-4">
                 <button 
                    type="button" 
                    onClick={() => setIsPanelOpen(false)}
                    className="px-8 py-3 text-brand-600 hover:bg-white border border-transparent hover:border-brand-100 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                    Annuler
                </button>
                <button 
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-brand-900 text-white rounded-2xl hover:bg-brand-950 font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-brand-900/10 transition-all hover:scale-[1.02]"
                >
                    {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
            </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isPanelOpen && (
        <div 
            className="fixed inset-0 bg-brand-950/20 backdrop-blur-sm z-40 transition-opacity duration-500"
            onClick={() => setIsPanelOpen(false)}
        />
      )}

      {/* Filter & List */}
      <div className="space-y-8">
        {/* Search & Sort Toolbar */}
        <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-400 dark:text-brand-500" size={20} />
                <input 
                type="text" 
                placeholder={showArchived ? "Rechercher dans les archives..." : "Rechercher par nom, email, SIRET..."}
                className="w-full pl-14 pr-6 py-4 border border-brand-100 dark:border-brand-800 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-900/5 bg-white dark:bg-brand-900 shadow-sm transition-all font-medium text-brand-900 dark:text-white placeholder:text-brand-300 dark:placeholder:text-brand-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-4 bg-white dark:bg-brand-900 px-6 py-2 border border-brand-100 dark:border-brand-800 rounded-3xl shadow-sm">
                <SortAsc size={18} className="text-brand-400 dark:text-brand-500" />
                <span className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-wider">Trier par</span>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-sm font-bold text-brand-900 dark:text-white outline-none cursor-pointer appearance-none pr-4"
                >
                    <option value="name">Nom (A-Z)</option>
                    <option value="revenue">Chiffre d'Affaires</option>
                    <option value="activity">Activité Récente</option>
                    <option value="date">Date de création</option>
                    <option value="siret_asc">SIRET (Croissant)</option>
                    <option value="siret_desc">SIRET (Décroissant)</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {processedClients.map(client => {
            const stats = getClientStats(client.id);
            
            return (
            <div 
                key={client.id} 
                className={`card-modern p-8 group relative flex flex-col border-l-4 border-l-violet-500 dark:border-l-violet-400 ${client.archived ? 'grayscale-[0.5] opacity-80' : ''}`}
            >
               {/* Actions Top Right */}
               <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                    <button 
                        onClick={() => openEdit(client)}
                        className="p-2.5 text-brand-400 dark:text-brand-500 hover:text-brand-900 dark:hover:text-white hover:bg-brand-50 dark:hover:bg-brand-800 rounded-xl transition-all"
                        title="Modifier"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={(e) => toggleArchiveClient(client.id, e)}
                        className={`p-2.5 rounded-xl transition-all ${client.archived ? 'text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                        title={client.archived ? "Restaurer" : "Archiver"}
                    >
                        {client.archived ? <RefreshCcw size={16} /> : <Archive size={16} />}
                    </button>
                    <button 
                        onClick={(e) => handleDeleteClient(client.id, e)}
                        className="p-2.5 text-brand-400 dark:text-brand-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                        title="Supprimer"
                    >
                        <Trash2 size={16} />
                    </button>
               </div>
               
                <div className="flex items-center gap-5 mb-8">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-bold text-2xl shadow-sm shrink-0 font-display transition-transform group-hover:scale-110
                     ${client.archived ? 'bg-brand-100 dark:bg-brand-800 text-brand-400 dark:text-brand-600' : 'bg-brand-900 dark:bg-white text-white dark:text-brand-900'}`}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-bold text-brand-900 dark:text-white truncate pr-10 text-xl font-display" title={client.name}>{client.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-medium text-brand-400 dark:text-brand-500 truncate">{client.email}</p>
                    </div>
                    <div className="flex gap-2 mt-2">
                        {client.category && (
                            <span className="text-[9px] font-black bg-brand-50 dark:bg-brand-800 text-brand-500 dark:text-brand-400 border border-brand-100 dark:border-brand-700 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                                {client.category}
                            </span>
                        )}
                        {client.archived && <span className="text-[9px] font-black text-brand-400 dark:text-brand-500 uppercase tracking-widest border border-brand-100 dark:border-brand-700 px-2.5 py-1 rounded-lg">Archivé</span>}
                    </div>
                  </div>
                </div>
               
               {/* Mini Stats */}
               <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-brand-50 dark:border-brand-800">
                    <div className="bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl p-4 border border-brand-50/50 dark:border-brand-800/50">
                        <p className="text-[9px] uppercase text-brand-400 dark:text-brand-500 font-black mb-1.5 flex items-center gap-1.5 tracking-widest">
                            <TrendingUp size={12} /> CA Net
                        </p>
                        <p className={`text-lg font-bold ${stats.revenue > 0 ? 'text-accent-600 dark:text-accent-400' : 'text-brand-900 dark:text-white'} font-display`}>{stats.revenue.toLocaleString()} €</p>
                    </div>
                    <div className="bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl p-4 border border-brand-50/50 dark:border-brand-800/50">
                        <p className="text-[9px] uppercase text-brand-400 dark:text-brand-500 font-black mb-1.5 flex items-center gap-1.5 tracking-widest">
                            <Calendar size={12} /> Activité
                        </p>
                        <p className="font-bold text-brand-900 dark:text-white text-sm mt-1">
                            {stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Aucune'}
                        </p>
                    </div>
               </div>
               
                <div className="space-y-4 text-sm text-brand-500 dark:text-brand-400 mb-6 flex-1">
                  {client.contactName && (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-800 rounded-lg text-brand-400 dark:text-brand-500"><User size={14} /></div>
                      <span className="font-bold text-brand-900 dark:text-white text-[10px] uppercase tracking-widest">{client.contactName}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-800 rounded-lg text-brand-400 dark:text-brand-500"><Phone size={14} /></div>
                      <span className="font-medium text-brand-700 dark:text-brand-300">{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-800 rounded-lg text-brand-400 dark:text-brand-500"><Globe size={14} /></div>
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:text-brand-900 dark:hover:text-white font-medium truncate">{client.website.replace(/^https?:\/\//, '')}</a>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-brand-50 dark:bg-brand-800 rounded-lg text-brand-400 dark:text-brand-500 mt-0.5"><MapPin size={14} /></div>
                      <span className="line-clamp-2 text-xs leading-relaxed text-brand-600 dark:text-brand-400">{client.address}</span>
                    </div>
                  )}
                  {client.notes && (
                    <div className="flex items-start gap-3 pt-4 border-t border-brand-50 dark:border-brand-800 mt-4">
                      <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-400 dark:text-amber-500 mt-0.5"><StickyNote size={14} /></div>
                      <span className="line-clamp-2 text-xs italic text-brand-400 dark:text-brand-500 leading-relaxed">{client.notes}</span>
                    </div>
                  )}
                </div>

               {/* Quick Actions Footer */}
               <div className="mt-auto flex gap-3 pt-6 border-t border-brand-50 dark:border-brand-800">
                    <a 
                        href={`mailto:${client.email}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-50 dark:bg-brand-800 text-brand-900 dark:text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-100 dark:hover:bg-brand-700 transition-all"
                    >
                        <Mail size={14} /> Email
                    </a>
                    {client.phone && (
                        <a 
                            href={`tel:${client.phone}`}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-900 dark:bg-white text-white dark:text-brand-900 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-950 dark:hover:bg-brand-100 transition-all shadow-md shadow-brand-900/10"
                        >
                            <Phone size={14} /> Appeler
                        </a>
                    )}
               </div>
            </div>
          )})}
          
          {processedClients.length === 0 && (
             <div className="col-span-full py-32 text-center">
               <div className="inline-block p-10 rounded-[2.5rem] bg-brand-50 dark:bg-brand-800/50 mb-8 animate-pulse">
                   <Users size={48} className="text-brand-200 dark:text-brand-700" />
               </div>
               <h3 className="text-brand-900 dark:text-white font-bold text-xl font-display mb-2">{showArchived ? 'Aucun client archivé' : 'Aucun client actif'}</h3>
               <p className="text-brand-400 dark:text-brand-500 text-sm max-w-xs mx-auto">{showArchived ? 'Vos clients archivés apparaîtront ici.' : 'Commencez par ajouter votre premier client pour gérer votre activité.'}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientManager;