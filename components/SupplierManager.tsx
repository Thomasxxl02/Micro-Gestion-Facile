import React, { useState, useMemo } from 'react';
import { Supplier, Expense } from '../types';
import { Plus, Search, Trash2, Mail, MapPin, Phone, Truck, Package, X, Edit2, Wallet, ArrowDownRight, Download, SortAsc, StickyNote, Tag, Filter, Upload, Globe, CreditCard, User, Calendar, Archive, RotateCcw } from 'lucide-react';

interface SupplierManagerProps {
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  expenses: Expense[];
  onSave?: (supplier: Supplier) => void;
  onDelete?: (id: string) => void;
}

type SortOption = 'name' | 'spending' | 'category';

const SupplierManager: React.FC<SupplierManagerProps> = ({ suppliers, setSuppliers, expenses, onSave, onDelete }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    email: '',
    address: '',
    phone: '',
    category: '',
    notes: '',
    contactName: '',
    website: '',
    tvaNumber: '',
    paymentTerms: '',
    siret: ''
  });

  // --- STATS HELPERS ---

  const getSupplierStats = (supplierId: string) => {
    const supplierExpenses = expenses.filter(exp => exp.supplierId === supplierId);
    const totalSpent = supplierExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return {
      totalSpent,
      count: supplierExpenses.length
    };
  };

  // --- SORTING & FILTERING ---
  
  // Extraire les catégories uniques pour le filtre
  const categories = useMemo(() => {
    const cats = new Set(suppliers.map(s => s.category).filter(Boolean));
    return Array.from(cats);
  }, [suppliers]);

  const processedSuppliers = useMemo(() => {
    let result = suppliers.filter(s => 
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (showArchived ? s.archived === true : !s.archived)
    );

    if (selectedCategory) {
        result = result.filter(s => s.category === selectedCategory);
    }

    return result.sort((a, b) => {
      if (sortBy === 'spending') {
        return getSupplierStats(b.id).totalSpent - getSupplierStats(a.id).totalSpent;
      }
      if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return a.name.localeCompare(b.name);
    });
  }, [suppliers, searchTerm, sortBy, selectedCategory, expenses]);

  // --- ACTIONS ---

  const openCreate = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      email: '', 
      address: '', 
      phone: '', 
      category: '', 
      notes: '',
      contactName: '',
      website: '',
      tvaNumber: '',
      paymentTerms: '',
      siret: ''
    });
    setIsPanelOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData({ ...supplier });
    setIsPanelOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
        const updated = { ...suppliers.find(s => s.id === editingId), ...formData } as Supplier;
        setSuppliers(suppliers.map(s => s.id === editingId ? updated : s));
        if (onSave) onSave(updated);
    } else {
        const supplier: Supplier = {
            id: Date.now().toString(),
            name: formData.name,
            email: formData.email,
            address: formData.address,
            phone: formData.phone,
            category: formData.category,
            notes: formData.notes,
            contactName: formData.contactName,
            website: formData.website,
            tvaNumber: formData.tvaNumber,
            paymentTerms: formData.paymentTerms,
            siret: formData.siret,
            createdAt: new Date().toISOString(),
            archived: false
        };
        setSuppliers([...suppliers, supplier]);
        if (onSave) onSave(supplier);
    }
    setIsPanelOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer définitivement ce fournisseur ?')) {
      setSuppliers(suppliers.filter(s => s.id !== id));
      if (onDelete) onDelete(id);
    }
  };

  const toggleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
        const updated = { ...supplier, archived: !supplier.archived };
        setSuppliers(suppliers.map(s => s.id === id ? updated : s));
        if (onSave) onSave(updated);
    }
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Contact', 'Catégorie', 'Email', 'Téléphone', 'Adresse', 'SIRET', 'TVA', 'Site Web', 'Conditions Paiement', 'Notes', 'Total Dépensé', 'Date Création', 'Statut'];
    const rows = processedSuppliers.map(s => {
        const stats = getSupplierStats(s.id);
        return [
            `"${s.name}"`,
            `"${s.contactName || ''}"`,
            `"${s.category || ''}"`,
            `"${s.email || ''}"`,
            `"${s.phone || ''}"`,
            `"${s.address?.replace(/\n/g, ' ') || ''}"`,
            `"${s.siret || ''}"`,
            `"${s.tvaNumber || ''}"`,
            `"${s.website || ''}"`,
            `"${s.paymentTerms || ''}"`,
            `"${s.notes?.replace(/\n/g, ' ') || ''}"`,
            stats.totalSpent.toFixed(2),
            `"${s.createdAt || ''}"`,
            s.archived ? '"Archivé"' : '"Actif"'
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fournisseurs_${showArchived ? 'archives' : 'actifs'}_export_${new Date().toISOString().split('T')[0]}.csv`);
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
        const newSuppliers: Supplier[] = [];

        // Skip header
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Basic CSV parser (handles simple quotes)
            const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));
            
            if (parts.length >= 1) {
                newSuppliers.push({
                    id: (Date.now() + i).toString(),
                    name: parts[0],
                    contactName: parts[1] || '',
                    category: parts[2] || '',
                    email: parts[3] || '',
                    phone: parts[4] || '',
                    address: parts[5] || '',
                    siret: parts[6] || '',
                    tvaNumber: parts[7] || '',
                    website: parts[8] || '',
                    paymentTerms: parts[9] || '',
                    notes: parts[10] || '',
                    createdAt: parts[12] || new Date().toISOString()
                });
            }
        }

        if (newSuppliers.length > 0) {
            setSuppliers([...suppliers, ...newSuppliers]);
            alert(`${newSuppliers.length} fournisseurs importés avec succès.`);
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto relative pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-900 tracking-tight font-display">Fournisseurs</h2>
          <p className="text-brand-500 mt-1 text-sm">Gérez vos partenaires et suivez vos achats.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <div className="flex bg-brand-100 p-1 rounded-xl mr-2">
                <button 
                  onClick={() => setShowArchived(false)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${!showArchived ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-500 hover:text-brand-700'}`}
                >
                  Actifs
                </button>
                <button 
                  onClick={() => setShowArchived(true)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${showArchived ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-500 hover:text-brand-700'}`}
                >
                  Archivés
                </button>
            </div>
            <label className="bg-white hover:bg-brand-50 text-brand-600 border border-brand-100 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all text-sm font-bold uppercase tracking-wider shadow-sm cursor-pointer">
                <Upload size={16} />
                <span className="hidden sm:inline">Import</span>
                <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
            </label>
            <button 
                onClick={exportCSV}
                className="bg-white hover:bg-brand-50 text-brand-600 border border-brand-100 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all text-sm font-bold uppercase tracking-wider shadow-sm"
                title={showArchived ? "Exporter les fournisseurs archivés en CSV" : "Exporter les fournisseurs actifs en CSV"}
            >
                <Download size={16} />
                <span className="hidden sm:inline">{showArchived ? 'Export Archivés' : 'Export Actifs'}</span>
            </button>
            <button 
            onClick={openCreate}
            className="bg-brand-900 hover:bg-brand-950 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-brand-900/20 text-sm font-bold uppercase tracking-wider"
            >
            <Plus size={16} />
            <span className="hidden sm:inline">Nouveau Fournisseur</span>
            <span className="sm:hidden">Nouveau</span>
            </button>
        </div>
      </div>

       {/* Side Panel Form */}
       <div className={`fixed inset-y-0 right-0 w-full sm:w-[540px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out z-50 border-l border-brand-100 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="p-8 border-b border-brand-50 flex justify-between items-center bg-brand-50/30">
                <div>
                    <h3 className="text-2xl font-bold text-brand-900 font-display">{editingId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
                    <p className="text-brand-500 text-xs mt-1 font-medium uppercase tracking-wider">Informations du partenaire</p>
                </div>
                <button onClick={() => setIsPanelOpen(false)} className="p-2.5 hover:bg-brand-100 rounded-full text-brand-400 transition-all hover:rotate-90">
                    <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-brand-50">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                            <Truck size={16} />
                        </div>
                        <h4 className="text-xs font-bold text-brand-900 uppercase tracking-[0.15em]">Identité & Contact</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">Nom / Société <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                required
                                className="w-full p-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Ex: Fournisseur SARL"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">Contact Principal</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-300" size={16} />
                                <input 
                                    type="text" 
                                    className="w-full pl-11 pr-4 py-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900"
                                    value={formData.contactName || ''}
                                    onChange={e => setFormData({...formData, contactName: e.target.value})}
                                    placeholder="Nom du contact"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">Catégorie</label>
                            <select 
                                className="w-full p-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 appearance-none cursor-pointer"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="">Sélectionner...</option>
                                <option value="Matériel">Matériel</option>
                                <option value="Logiciel">Logiciel / SaaS</option>
                                <option value="Services">Services / Prestations</option>
                                <option value="Logistique">Logistique / Transport</option>
                                <option value="Marketing">Marketing / Pub</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-300" size={16} />
                                <input 
                                    type="email" 
                                    className="w-full pl-11 pr-4 py-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    placeholder="contact@email.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">Téléphone</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-300" size={16} />
                                <input 
                                    type="tel" 
                                    className="w-full pl-11 pr-4 py-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="01 23 45 67 89"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-brand-50">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                            <MapPin size={16} />
                        </div>
                        <h4 className="text-xs font-bold text-brand-900 uppercase tracking-[0.15em]">Localisation & Légal</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">Adresse Postale</label>
                            <textarea 
                                className="w-full p-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 resize-none"
                                rows={3}
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                placeholder="Adresse complète..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">SIRET</label>
                            <input 
                                type="text" 
                                className="w-full p-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900"
                                value={formData.siret || ''}
                                onChange={e => setFormData({...formData, siret: e.target.value})}
                                placeholder="14 chiffres"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">N° TVA</label>
                            <input 
                                type="text" 
                                className="w-full p-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900"
                                value={formData.tvaNumber || ''}
                                onChange={e => setFormData({...formData, tvaNumber: e.target.value})}
                                placeholder="FR..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">Site Web</label>
                            <div className="relative">
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-300" size={16} />
                                <input 
                                    type="url" 
                                    className="w-full pl-11 pr-4 py-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900"
                                    value={formData.website || ''}
                                    onChange={e => setFormData({...formData, website: e.target.value})}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-brand-50">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
                            <CreditCard size={16} />
                        </div>
                        <h4 className="text-xs font-bold text-brand-900 uppercase tracking-[0.15em]">Paiement & Notes</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">Conditions de Paiement</label>
                            <select 
                                className="w-full p-3.5 bg-brand-50/50 border border-brand-100 rounded-xl focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 outline-none transition-all font-medium text-brand-900 appearance-none cursor-pointer"
                                value={formData.paymentTerms || ''}
                                onChange={e => setFormData({...formData, paymentTerms: e.target.value})}
                            >
                                <option value="">Par défaut...</option>
                                <option value="À réception">À réception</option>
                                <option value="15 jours">15 jours</option>
                                <option value="30 jours">30 jours</option>
                                <option value="30 jours fin de mois">30 jours fin de mois</option>
                                <option value="45 jours">45 jours</option>
                                <option value="60 jours">60 jours</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <StickyNote size={12} className="text-brand-300"/> Notes privées
                            </label>
                            <textarea 
                                className="w-full p-4 bg-amber-50/30 border border-amber-100 rounded-xl focus:ring-4 focus:ring-amber-500/5 focus:border-amber-200 outline-none transition-all resize-none text-sm text-brand-800 font-medium"
                                rows={3}
                                value={formData.notes || ''}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                placeholder="Informations internes, SAV, références..."
                            />
                        </div>
                    </div>
                </div>
            </form>

            <div className="p-8 border-t border-brand-50 bg-brand-50/30 flex justify-end gap-4">
                 <button 
                    type="button" 
                    onClick={() => setIsPanelOpen(false)}
                    className="px-8 py-3 text-brand-600 hover:bg-white border border-transparent hover:border-brand-100 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                >
                    Annuler
                </button>
                <button 
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-brand-900 text-white rounded-xl hover:bg-brand-950 text-sm font-bold uppercase tracking-wider shadow-lg shadow-brand-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
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

      {/* List */}
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
                <input 
                type="text" 
                placeholder="Rechercher par nom, catégorie..."
                className="w-full pl-12 pr-4 py-3.5 border border-brand-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 bg-white shadow-sm transition-all font-medium text-brand-900"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-3 bg-white px-5 py-2 border border-brand-100 rounded-2xl shadow-sm">
                <Filter size={16} className="text-brand-400" />
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Filtre</span>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-sm font-bold text-brand-900 outline-none cursor-pointer min-w-[100px]"
                >
                    <option value="">Toutes</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat as string}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-3 bg-white px-5 py-2 border border-brand-100 rounded-2xl shadow-sm">
                <SortAsc size={16} className="text-brand-400" />
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Trier</span>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-sm font-bold text-brand-900 outline-none cursor-pointer"
                >
                    <option value="name">Nom (A-Z)</option>
                    <option value="spending">Dépenses</option>
                    <option value="category">Catégorie</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedSuppliers.map(supplier => {
            const stats = getSupplierStats(supplier.id);
            return (
            <div 
                key={supplier.id} 
                className="card-modern p-6 group relative flex flex-col"
            >
               {/* Actions Top Right */}
               <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 translate-y-1 group-hover:translate-y-0">
                    <button 
                        onClick={() => openEdit(supplier)}
                        className="p-2 text-brand-400 hover:text-brand-900 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Modifier"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button 
                        onClick={(e) => toggleArchive(supplier.id, e)}
                        className="p-2 text-brand-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title={supplier.archived ? "Restaurer" : "Archiver"}
                    >
                        {supplier.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                    </button>
                    <button 
                        onClick={(e) => handleDelete(supplier.id, e)}
                        className="p-2 text-brand-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 size={14} />
                    </button>
               </div>
               
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center border border-brand-100 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-500">
                   <Truck size={24} className="opacity-80" />
                 </div>
                 <div className="overflow-hidden">
                   <h4 className="font-bold text-brand-900 truncate pr-8 text-lg font-display tracking-tight">{supplier.name}</h4>
                   <div className="flex flex-wrap gap-2 mt-1.5">
                        {supplier.contactName && (
                            <div className="flex items-center gap-1.5">
                                <User size={10} className="text-brand-400" />
                                <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">{supplier.contactName}</p>
                            </div>
                        )}
                        {supplier.category && (
                            <div className="flex items-center gap-1.5 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                                <Tag size={10} className="text-brand-500" />
                                <p className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">{supplier.category}</p>
                            </div>
                        )}
                   </div>
                 </div>
               </div>
               
               {/* Mini Stats */}
               <div className="mb-6 pb-6 border-b border-brand-50">
                    <div className="bg-brand-50/50 rounded-2xl p-4 flex justify-between items-center border border-brand-50">
                        <div>
                            <p className="text-[9px] uppercase text-brand-400 font-bold mb-1 flex items-center gap-1 tracking-widest">
                                <Wallet size={10} /> Total Dépensé
                            </p>
                            <p className="text-lg font-bold text-brand-900 font-display">
                                {stats.totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                        </div>
                        <div className="text-right">
                             <p className="text-[9px] uppercase text-brand-400 font-bold mb-1 tracking-widest">Transactions</p>
                             <p className="text-lg font-bold text-brand-900 font-display">{stats.count}</p>
                        </div>
                    </div>
               </div>
               
               <div className="space-y-3.5 text-sm text-brand-600 mb-6">
                 {supplier.address && (
                   <div className="flex items-start gap-3">
                      <MapPin size={14} className="text-brand-300 mt-0.5 shrink-0" />
                     <span className="line-clamp-2 text-xs font-medium leading-relaxed">{supplier.address}</span>
                   </div>
                 )}
                 {supplier.website && (
                    <div className="flex items-center gap-3">
                        <Globe size={14} className="text-brand-300 shrink-0" />
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-900 hover:underline truncate">
                            {supplier.website.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                 )}
                 <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-brand-300 shrink-0" />
                    <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">
                        Depuis le {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                 </div>
               </div>

                {/* Quick Actions Footer */}
               <div className="mt-auto flex gap-2 pt-4 border-t border-brand-50">
                    {supplier.email ? (
                    <a 
                        href={`mailto:${supplier.email}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-50 text-brand-900 text-[10px] font-bold uppercase tracking-wider hover:bg-brand-100 transition-all active:scale-95"
                    >
                        <Mail size={14} /> Email
                    </a>
                    ) : (
                        <span className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-50 text-brand-200 text-[10px] font-bold uppercase tracking-wider cursor-not-allowed">
                             <Mail size={14} /> Email
                        </span>
                    )}
                    {supplier.phone ? (
                        <a 
                            href={`tel:${supplier.phone}`}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-50 text-brand-900 text-[10px] font-bold uppercase tracking-wider hover:bg-brand-100 transition-all active:scale-95"
                        >
                            <Phone size={14} /> Appeler
                        </a>
                    ) : (
                         <span className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-50 text-brand-200 text-[10px] font-bold uppercase tracking-wider cursor-not-allowed">
                             <Phone size={14} /> Appeler
                        </span>
                    )}
               </div>
            </div>
          )})}
          
          {processedSuppliers.length === 0 && (
             <div className="col-span-full py-24 text-center card-modern border-dashed bg-brand-50/20">
               <div className="inline-block p-8 rounded-3xl bg-white shadow-sm mb-6">
                   <Package size={40} className="text-brand-200" />
               </div>
               <h3 className="text-brand-900 font-bold text-lg font-display tracking-tight mb-2">Aucun fournisseur trouvé</h3>
               <p className="text-brand-500 text-sm max-w-xs mx-auto font-medium">Affinez votre recherche ou ajoutez un nouveau partenaire pour commencer.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierManager;
