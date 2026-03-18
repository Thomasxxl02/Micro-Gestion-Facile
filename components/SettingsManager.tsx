import React, { useRef, useState } from 'react';
import { UserProfile, Invoice, Client, Supplier, Product, Expense, InvoiceStatus } from '../types';
import { 
  Building, Wallet, Mail, FileText, CheckCircle2, Globe, Phone, 
  MapPin, CreditCard, ShieldCheck, Download, Upload, RotateCcw, 
  Hash, Palette, Coins, AlertTriangle, Linkedin, Briefcase,
  Database, Sparkles, Trash2, Save, ShieldAlert, RefreshCw, Zap, Calculator
} from 'lucide-react';

interface SettingsManagerProps {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onSaveProfile?: (profile: UserProfile) => void;
  allData: {
    invoices: Invoice[];
    clients: Client[];
    suppliers: Supplier[];
    products: Product[];
    expenses: Expense[];
  };
  setAllData: {
    setInvoices: (data: Invoice[]) => void;
    setClients: (data: Client[]) => void;
    setSuppliers: (data: Supplier[]) => void;
    setProducts: (data: Product[]) => void;
    setExpenses: (data: Expense[]) => void;
  };
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ userProfile, setUserProfile, onSaveProfile, allData, setAllData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'data' | 'preferences'>('profile');
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  const handleChange = (field: keyof UserProfile, value: string | number | boolean) => {
    const updatedProfile = { ...userProfile, [field]: value };
    setUserProfile(updatedProfile);
    if (onSaveProfile) onSaveProfile(updatedProfile);
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
  };

  const handleExportAll = () => {
    const data = {
      profile: userProfile,
      ...allData
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_micro_gestion_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.profile) setUserProfile(data.profile);
        if (data.invoices) setAllData.setInvoices(data.invoices);
        if (data.clients) setAllData.setClients(data.clients);
        if (data.suppliers) setAllData.setSuppliers(data.suppliers);
        if (data.products) setAllData.setProducts(data.products);
        if (data.expenses) setAllData.setExpenses(data.expenses);
        alert('Données importées avec succès !');
      } catch (err) {
        alert('Erreur lors de l\'importation. Fichier invalide.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetApp = () => {
    if (window.confirm('ÊTES-VOUS SÛR ? Cette action supprimera TOUTES vos données (factures, clients, etc.) de manière irréversible.')) {
      setAllData.setInvoices([]);
      setAllData.setClients([]);
      setAllData.setSuppliers([]);
      setAllData.setProducts([]);
      setAllData.setExpenses([]);
      // Note: Full deletion from Firestore would require a batch delete or multiple calls
      alert('Données réinitialisées localement. Pour une suppression complète de votre compte, veuillez nous contacter.');
      window.location.reload();
    }
  };

  const generateSampleData = () => {
    if (!window.confirm('Générer des données de test ? Cela ajoutera des clients, produits et factures fictives.')) return;

    const sampleClients: Client[] = [
      { id: 'c1', name: 'Acme Corp', email: 'contact@acme.com', address: '10 Rue de la Paix, Paris', category: 'Entreprise' },
      { id: 'c2', name: 'Jean Dupont', email: 'jean.dupont@gmail.com', address: '5 Avenue des Champs, Lyon', category: 'Particulier' }
    ];

    const sampleProducts: Product[] = [
      { id: 'p1', name: 'Consulting IT', description: 'Prestation de conseil technique', price: 650, type: 'service', unit: 'jour' },
      { id: 'p2', name: 'Développement Web', description: 'Création de site vitrine', price: 2500, type: 'service', unit: 'unité' }
    ];

    const sampleInvoices: Invoice[] = [
      { 
        id: 'i1', 
        type: 'invoice', 
        number: 'FAC-2024-001', 
        date: new Date().toISOString().split('T')[0], 
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        clientId: 'c1',
        items: [{ id: 'it1', description: 'Consulting IT', quantity: 5, unitPrice: 650, unit: 'jour' }],
        status: InvoiceStatus.PAID,
        total: 3250
      }
    ];

    setAllData.setClients([...allData.clients, ...sampleClients]);
    setAllData.setProducts([...allData.products, ...sampleProducts]);
    setAllData.setInvoices([...allData.invoices, ...sampleInvoices]);
    
    alert('Données de test générées !');
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-brand-900 font-display tracking-tight">Paramètres</h2>
          <p className="text-brand-500 mt-1">Gérez votre profil, votre image de marque et vos données.</p>
        </div>
        <div className="flex bg-brand-100/50 p-1 rounded-2xl border border-brand-100 overflow-x-auto no-scrollbar">
           <button 
             onClick={() => setActiveTab('profile')}
             className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-white text-brand-900 shadow-sm' : 'bg-transparent text-brand-500 hover:text-brand-700'}`}
           >
             Profil
           </button>
           <button 
             onClick={() => setActiveTab('billing')}
             className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'billing' ? 'bg-white text-brand-900 shadow-sm' : 'bg-transparent text-brand-500 hover:text-brand-700'}`}
           >
             Facturation
           </button>
           <button 
             onClick={() => setActiveTab('preferences')}
             className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'preferences' ? 'bg-white text-brand-900 shadow-sm' : 'bg-transparent text-brand-500 hover:text-brand-700'}`}
           >
             Préférences
           </button>
           <button 
             onClick={() => setActiveTab('data')}
             className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-white text-brand-900 shadow-sm' : 'bg-transparent text-brand-500 hover:text-brand-700'}`}
           >
             Données
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left Column: Forms */}
        <div className="xl:col-span-2 space-y-8">
            
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-slide-up">
                {/* Identity Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-brand-50 pb-4">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                            <Building size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-900 font-display">Identité Professionnelle</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Nom commercial / Raison sociale</label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900" 
                                value={userProfile.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                placeholder="Ex: Mon Entreprise Digitale"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Titre Professionnel</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-semibold text-brand-900" 
                                    value={userProfile.professionalTitle || ''}
                                    onChange={(e) => handleChange('professionalTitle', e.target.value)}
                                    placeholder="Ex: Consultant IT, Photographe..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Numéro SIRET</label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm" 
                                value={userProfile.siret}
                                onChange={(e) => handleChange('siret', e.target.value)}
                                placeholder="123 456 789 00012"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Numéro SIREN</label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm" 
                                value={userProfile.siren || ''}
                                onChange={(e) => handleChange('siren', e.target.value)}
                                placeholder="123 456 789"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-brand-50 pb-4">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                            <Mail size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-900 font-display">Coordonnées & Web</h3>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Adresse du siège</label>
                             <div className="relative">
                                <MapPin className="absolute left-4 top-4 text-brand-300" size={18} />
                                <textarea 
                                    className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all resize-none font-medium" 
                                    rows={2}
                                    value={userProfile.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="123 Avenue de la République, 75001 Paris"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Email Professionnel</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" size={18} />
                                    <input 
                                        type="email" 
                                        className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium" 
                                        value={userProfile.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium" 
                                        value={userProfile.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Site Web</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium" 
                                        value={userProfile.website || ''}
                                        onChange={(e) => handleChange('website', e.target.value)}
                                        placeholder="www.mon-site.fr"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">LinkedIn</label>
                                <div className="relative">
                                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-medium" 
                                        value={userProfile.linkedin || ''}
                                        onChange={(e) => handleChange('linkedin', e.target.value)}
                                        placeholder="linkedin.com/in/profil"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-8 animate-slide-up">
                {/* Branding Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-brand-50 pb-4">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                            <Palette size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-900 font-display">Identité Visuelle</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Couleur de l'entreprise</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center gap-6 p-6 bg-brand-50/50 border border-brand-100 rounded-[2rem]">
                                <input 
                                    type="color" 
                                    className="w-20 h-20 rounded-2xl cursor-pointer bg-transparent border-none shadow-lg" 
                                    value={userProfile.logoColor || '#102a43'}
                                    onChange={(e) => handleChange('logoColor', e.target.value)}
                                />
                                <div>
                                    <p className="text-sm font-bold text-brand-900 uppercase font-mono mb-1">{userProfile.logoColor || '#102a43'}</p>
                                    <p className="text-[10px] text-brand-400 font-medium">Couleur personnalisée</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {['#102a43', '#0f172a', '#1e293b', '#334155', '#059669', '#0891b2', '#4f46e5', '#7c3aed'].map(color => (
                                    <button 
                                        key={color}
                                        onClick={() => handleChange('logoColor', color)}
                                        className={`w-full aspect-square rounded-xl border-2 transition-all ${userProfile.logoColor === color ? 'border-brand-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-brand-50 pb-4">
                        <div className="p-2 bg-accent-50 text-accent-600 rounded-xl">
                            <Wallet size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-900 font-display">Bancaire & Légal</h3>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">IBAN</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm uppercase" 
                                        value={userProfile.bankAccount}
                                        onChange={(e) => handleChange('bankAccount', e.target.value)}
                                        placeholder="FR76 ..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">BIC / SWIFT</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm uppercase" 
                                    value={userProfile.bic || ''}
                                    onChange={(e) => handleChange('bic', e.target.value)}
                                    placeholder="TRPUFRPPXXX"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Devise</label>
                                <select 
                                    className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 appearance-none cursor-pointer"
                                    value={userProfile.currency || '€'}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                >
                                    <option value="€">Euro (€)</option>
                                    <option value="$">Dollar ($)</option>
                                    <option value="£">Livre (£)</option>
                                    <option value="CHF">Franc Suisse (CHF)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">TVA par défaut (%)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900" 
                                    value={userProfile.defaultVatRate || 0}
                                    onChange={(e) => handleChange('defaultVatRate', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Numéro de TVA Intracommunautaire</label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-mono text-sm" 
                                value={userProfile.tvaNumber || ''}
                                onChange={(e) => handleChange('tvaNumber', e.target.value)}
                                placeholder="FRXX 123456789"
                            />
                             <p className="text-[10px] text-brand-400 mt-2 font-medium italic">Laissez vide si vous bénéficiez de la franchise en base de TVA.</p>
                        </div>

                        {/* Activity & Social Charges */}
                        <div className="pt-8 border-t border-brand-50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                                    <Calculator size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Régime Micro-Entrepreneur</h4>
                                    <p className="text-[10px] text-brand-400 font-medium">Configurez vos calculs de cotisations et seuils</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Type d'activité (URSSAF)</label>
                                    <select 
                                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 cursor-pointer"
                                        value={userProfile.activityType || 'SERVICE_BNC'}
                                        onChange={(e) => handleChange('activityType', e.target.value)}
                                    >
                                        <option value="SALE">Vente de marchandises (BIC)</option>
                                        <option value="SERVICE_BIC">Prestations de services (BIC)</option>
                                        <option value="SERVICE_BNC">Prestations de services (BNC)</option>
                                        <option value="LIBERAL">Profession libérale réglementée</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-brand-900">Bénéficiaire ACRE</p>
                                        <p className="text-[10px] text-brand-400">Taux réduit de cotisations</p>
                                    </div>
                                    <button 
                                        onClick={() => handleChange('isAcreBeneficiary', !userProfile.isAcreBeneficiary)}
                                        className={`w-12 h-6 rounded-full relative transition-all ${userProfile.isAcreBeneficiary ? 'bg-brand-900' : 'bg-brand-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.isAcreBeneficiary ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-brand-900">Alertes seuil TVA</p>
                                        <p className="text-[10px] text-brand-400">Notifier à l'approche du seuil</p>
                                    </div>
                                    <button 
                                        onClick={() => handleChange('vatThresholdAlert', !userProfile.vatThresholdAlert)}
                                        className={`w-12 h-6 rounded-full relative transition-all ${userProfile.vatThresholdAlert ? 'bg-brand-900' : 'bg-brand-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.vatThresholdAlert ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-brand-900">Alertes plafond CA</p>
                                        <p className="text-[10px] text-brand-400">Notifier à l'approche du plafond</p>
                                    </div>
                                    <button 
                                        onClick={() => handleChange('revenueThresholdAlert', !userProfile.revenueThresholdAlert)}
                                        className={`w-12 h-6 rounded-full relative transition-all ${userProfile.revenueThresholdAlert ? 'bg-brand-900' : 'bg-brand-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.revenueThresholdAlert ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* E-Invoicing 2026 Settings */}
                        <div className="pt-8 border-t border-brand-50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-accent-50 text-accent-600 rounded-xl">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Facturation Électronique 2026</h4>
                                    <p className="text-[10px] text-brand-400 font-medium">Préparez votre conformité au PPF / PDP</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Format d'échange par défaut</label>
                                    <select 
                                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 cursor-pointer"
                                        value={userProfile.defaultEInvoiceFormat || 'Factur-X'}
                                        onChange={(e) => handleChange('defaultEInvoiceFormat', e.target.value)}
                                    >
                                        <option value="Factur-X">Factur-X (Recommandé)</option>
                                        <option value="UBL">UBL</option>
                                        <option value="CII">CII</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Catégorie d'activité</label>
                                    <select 
                                        className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all font-bold text-brand-900 cursor-pointer"
                                        value={userProfile.defaultOperationCategory || 'SERVICES'}
                                        onChange={(e) => handleChange('defaultOperationCategory', e.target.value)}
                                    >
                                        <option value="BIENS">Livraison de biens</option>
                                        <option value="SERVICES">Prestation de services</option>
                                        <option value="MIXTE">Opération mixte</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="mt-6 p-4 bg-accent-50/50 rounded-2xl border border-accent-100 flex items-start gap-3">
                                <ShieldCheck size={18} className="text-accent-600 mt-0.5" />
                                <p className="text-[10px] text-accent-700 leading-relaxed">
                                    Ces paramètres seront appliqués par défaut à vos nouveaux documents. En 2026, la transmission électronique sera obligatoire pour toutes les transactions B2B assujetties à la TVA.
                                </p>
                            </div>
                        </div>

                         <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Mentions légales bas de page</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-4 text-brand-300" size={18} />
                                <textarea 
                                    className="w-full pl-12 p-4 bg-brand-50/50 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 transition-all resize-none text-sm font-medium" 
                                    rows={3}
                                    value={userProfile.legalMentions || ''}
                                    onChange={(e) => handleChange('legalMentions', e.target.value)}
                                    placeholder="Ex: Dispensé d'immatriculation au registre du commerce et des sociétés (RCS) et au répertoire des métiers (RM)..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Numbering Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-brand-50 pb-4">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                            <Hash size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-900 font-display">Préfixes de Numérotation</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase mb-2">Facture</label>
                            <input type="text" className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-mono font-bold text-brand-900" value={userProfile.invoicePrefix || 'FAC-'} onChange={e => handleChange('invoicePrefix', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase mb-2">Devis</label>
                            <input type="text" className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-mono font-bold text-brand-900" value={userProfile.quotePrefix || 'DEV-'} onChange={e => handleChange('quotePrefix', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase mb-2">Commande</label>
                            <input type="text" className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-mono font-bold text-brand-900" value={userProfile.orderPrefix || 'COM-'} onChange={e => handleChange('orderPrefix', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase mb-2">Avoir</label>
                            <input type="text" className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl text-sm font-mono font-bold text-brand-900" value={userProfile.creditNotePrefix || 'AVO-'} onChange={e => handleChange('creditNotePrefix', e.target.value)} />
                        </div>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8 animate-slide-up">
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-brand-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-brand-50 pb-4">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-900 font-display">Interface & Préférences</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Langue de l'interface</label>
                            <select className="w-full p-4 bg-brand-50/50 border border-brand-100 rounded-2xl font-bold text-brand-900 outline-none">
                                <option value="fr">Français</option>
                                <option value="en">Anglais (Bientôt)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Thème</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="p-4 bg-brand-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                                    Clair
                                </button>
                                <button className="p-4 bg-brand-50 text-brand-400 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-brand-100 cursor-not-allowed opacity-50">
                                    Sombre (Bientôt)
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Notifications</label>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                                    <div>
                                        <p className="text-sm font-bold text-brand-900">Rappels de paiement</p>
                                        <p className="text-[10px] text-brand-400">Recevoir des alertes pour les factures en retard</p>
                                    </div>
                                    <div 
                                        onClick={() => {
                                            setShowSaveIndicator(true);
                                            setTimeout(() => setShowSaveIndicator(false), 2000);
                                        }}
                                        className="w-12 h-6 bg-brand-900 rounded-full relative cursor-pointer"
                                    >
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-brand-50/50 rounded-2xl border border-brand-100">
                                    <div>
                                        <p className="text-sm font-bold text-brand-900">Alertes de stock</p>
                                        <p className="text-[10px] text-brand-400">Recevoir des alertes quand le stock est bas</p>
                                    </div>
                                    <div 
                                        onClick={() => {
                                            setShowSaveIndicator(true);
                                            setTimeout(() => setShowSaveIndicator(false), 2000);
                                        }}
                                        className="w-12 h-6 bg-brand-900 rounded-full relative cursor-pointer"
                                    >
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8 animate-slide-up">
                {/* Data Stats Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Factures</p>
                        <p className="text-2xl font-bold text-brand-900 font-display">{allData.invoices.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Clients</p>
                        <p className="text-2xl font-bold text-brand-900 font-display">{allData.clients.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Produits</p>
                        <p className="text-2xl font-bold text-brand-900 font-display">{allData.products.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Dépenses</p>
                        <p className="text-2xl font-bold text-brand-900 font-display">{allData.expenses.length}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-brand-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8 border-b border-brand-50 pb-4">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                            <Database size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-900 font-display">Sauvegarde & Maintenance</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <button 
                            onClick={handleExportAll}
                            className="flex items-center justify-center gap-3 p-5 bg-brand-900 text-white rounded-2xl hover:bg-brand-950 transition-all font-bold text-sm shadow-xl shadow-brand-900/10"
                        >
                            <Download size={20} /> Exporter mes données (.json)
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-3 p-5 bg-white border border-brand-100 text-brand-700 rounded-2xl hover:bg-brand-50 transition-all font-bold text-sm shadow-sm"
                        >
                            <Upload size={20} /> Importer un fichier (.json)
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".json" 
                            onChange={handleImportAll}
                        />
                    </div>

                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 mb-8">
                        <div className="flex gap-4">
                            <div className="p-2 bg-white rounded-xl text-amber-600 h-fit">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900 mb-1">Sécurité des données</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Vos données sont stockées localement dans votre navigateur. Elles ne sont jamais envoyées sur un serveur externe. 
                                    Pensez à faire des exports réguliers pour éviter toute perte en cas de suppression de l'historique de votre navigateur.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-brand-50 pt-8">
                        <p className="text-sm font-bold text-brand-900 mb-4">Actions avancées</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                                onClick={generateSampleData}
                                className="flex items-center justify-center gap-2 p-4 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 transition-all text-xs font-bold"
                            >
                                <RefreshCw size={16} /> Générer des données de test
                            </button>
                            <button 
                                onClick={handleResetApp}
                                className="flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-xs font-bold"
                            >
                                <Trash2 size={16} /> Réinitialiser l'application
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            )}
        </div>

        {/* Right Column: Preview */}
        <div className="xl:col-span-1">
            <div className="sticky top-10">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em]">Aperçu Facture</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-accent-600 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
                        En direct
                    </div>
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-brand-200/50 border border-brand-100 min-h-[500px] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-[5rem] -mr-10 -mt-10 opacity-20" style={{ backgroundColor: userProfile.logoColor || '#102a43' }}></div>
                    
                    {/* Fake Header */}
                    <div className="border-b border-brand-100 pb-8 mb-8 relative z-10">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl" style={{ backgroundColor: userProfile.logoColor || '#102a43', boxShadow: `0 12px 20px -5px ${userProfile.logoColor || '#102a43'}50` }}>
                             <span className="font-bold text-2xl">{userProfile.companyName.charAt(0)}</span>
                        </div>
                        <h2 className="font-bold text-brand-900 text-xl leading-tight mb-1 font-display">{userProfile.companyName || 'Votre Entreprise'}</h2>
                        {userProfile.professionalTitle && <p className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">{userProfile.professionalTitle}</p>}
                        
                        <div className="space-y-1 mt-4">
                            <div className="flex items-center gap-2 text-[11px] text-brand-500">
                                <Mail size={12} className="text-brand-300" /> {userProfile.email || 'email@exemple.com'}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-brand-500">
                                <Phone size={12} className="text-brand-300" /> {userProfile.phone || '01 02 03 04 05'}
                            </div>
                            {userProfile.website && (
                                <div className="flex items-center gap-2 text-[11px] font-bold" style={{ color: userProfile.logoColor || '#102a43' }}>
                                    <Globe size={12} /> {userProfile.website}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fake Content */}
                    <div className="space-y-5 opacity-30 mb-auto">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2">
                                <div className="h-4 bg-brand-100 rounded-full w-32"></div>
                                <div className="h-3 bg-brand-50 rounded-full w-24"></div>
                            </div>
                            <div className="h-10 bg-brand-50 rounded-xl w-24 border border-brand-100"></div>
                        </div>
                        <div className="h-32 bg-brand-50/50 rounded-3xl w-full border border-brand-100 border-dashed"></div>
                        <div className="space-y-3">
                            <div className="h-2 bg-brand-100 rounded-full w-full"></div>
                            <div className="h-2 bg-brand-100 rounded-full w-5/6"></div>
                            <div className="h-2 bg-brand-100 rounded-full w-4/6"></div>
                        </div>
                    </div>

                    {/* Fake Footer */}
                    <div className="mt-12 pt-6 border-t border-brand-100 text-[9px] text-center text-brand-400 leading-relaxed">
                         <p className="font-bold text-brand-600 mb-1 uppercase tracking-widest">{userProfile.companyName}</p>
                         <p className="max-w-[200px] mx-auto">{userProfile.address}</p>
                         <div className="flex items-center justify-center gap-3 mt-2 font-bold text-brand-500">
                            <span>SIRET: {userProfile.siret}</span>
                            {userProfile.tvaNumber && <span>TVA: {userProfile.tvaNumber}</span>}
                         </div>
                         {!userProfile.tvaNumber && <p className="mt-1 italic">TVA non applicable, art. 293 B du CGI</p>}
                         {userProfile.legalMentions && <p className="mt-3 text-[8px] opacity-60 italic leading-tight">{userProfile.legalMentions}</p>}
                    </div>
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-3 text-accent-600 bg-white p-4 rounded-2xl border border-brand-100 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all">
                    {showSaveIndicator ? (
                        <>
                            <CheckCircle2 size={14} className="animate-bounce" />
                            <span>Modifications enregistrées</span>
                        </>
                    ) : (
                        <>
                            <Save size={14} />
                            <span>Sauvegarde automatique</span>
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
