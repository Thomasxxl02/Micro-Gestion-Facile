/**
 * SettingsManager - Gestion du profil et des paramètres d'entreprise
 * ✅ Accessibilité intégrée (WCAG 2.1 AA)
 * ✅ Composants modulaires (FormFields, Dialogs)
 * ✅ Anti-patterns corrigés (window.confirm → ConfirmDialog, parseFloat → Number.parseFloat)
 */

import React, { useRef, useState } from 'react';
import type { UserProfile, Invoice, Client, Supplier, Product, Expense, InvoiceStatus } from '../types';
import {
  Building, Wallet, Mail, CheckCircle2, Globe, Phone,
  MapPin, CreditCard, ShieldCheck, Download, Upload,
  Hash, Palette, Briefcase, Database, Sparkles, Trash2, Save,
  ShieldAlert, RefreshCw, Zap, Calculator, Mail as MailIcon, Phone as PhoneIcon
} from 'lucide-react';
import { FormField, TextAreaField, SelectField, ToggleSwitch, ColorPicker } from './FormFields';
import { ConfirmDialog, AlertDialog } from './Dialogs';

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

const SettingsManager: React.FC<SettingsManagerProps> = ({
  userProfile,
  setUserProfile,
  onSaveProfile,
  allData,
  setAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'data' | 'preferences'>('profile');
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  // ─── DIALOG STATES ───
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDangerous?: boolean;
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', description: '' });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', description: '', type: 'info' });

  // ─── HANDLERS ───
  const handleChange = (field: keyof UserProfile, value: string | number | boolean) => {
    const updatedProfile = { ...userProfile, [field]: value };
    setUserProfile(updatedProfile);
    if (onSaveProfile) onSaveProfile(updatedProfile);
    showSaveMessage('✓ Profil sauvegardé');
  };

  const showSaveMessage = (message: string) => {
    setAlertDialog({ isOpen: true, title: message, description: '', type: 'success' });
    setTimeout(() => {
      setAlertDialog({ isOpen: false, title: '', description: '', type: 'info' });
    }, 2000);
  };

  // ─── EXPORT / IMPORT HANDLERS ───
  const handleExportAll = () => {
    const data = { profile: userProfile, ...allData };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_micro_gestion_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showSaveMessage('✓ Données exportées avec succès');
  };

  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text(); // Modern API, replaces FileReader
      const data = JSON.parse(text);
      
      if (data.profile) setUserProfile(data.profile);
      if (data.invoices) setAllData.setInvoices(data.invoices);
      if (data.clients) setAllData.setClients(data.clients);
      if (data.suppliers) setAllData.setSuppliers(data.suppliers);
      if (data.products) setAllData.setProducts(data.products);
      if (data.expenses) setAllData.setExpenses(data.expenses);
      
      showSaveMessage('✓ Données importées avec succès');
    } catch (err) {
      setAlertDialog({
        isOpen: true,
        title: '⚠️ Erreur d\'importation',
        description: 'Le fichier est invalide ou corrompu. Vérifiez le format JSON.',
        type: 'error',
      });
    }
  };

  const handleResetApp = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Réinitialiser l\'application ?',
      description: 'ÊTES-VOUS SÛR ? Cette action supprimera TOUTES vos données (factures, clients, etc.) de manière irréversible.',
      isDangerous: true,
      onConfirm: () => {
        setAllData.setInvoices([]);
        setAllData.setClients([]);
        setAllData.setSuppliers([]);
        setAllData.setProducts([]);
        setAllData.setExpenses([]);
        setConfirmDialog({ isOpen: false, title: '', description: '' });
        setAlertDialog({
          isOpen: true,
          title: '✓ Données réinitialisées',
          description: 'Pour une suppression complète de votre compte, veuillez nous contacter.',
          type: 'info',
        });
      },
    });
  };

  const generateSampleData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Générer des données de test ?',
      description: 'Cela ajoutera des clients, produits et factures fictives à votre application.',
      onConfirm: () => {
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
            status: 'paid' as InvoiceStatus,
            total: 3250
          }
        ];

        setAllData.setClients([...allData.clients, ...sampleClients]);
        setAllData.setProducts([...allData.products, ...sampleProducts]);
        setAllData.setInvoices([...allData.invoices, ...sampleInvoices]);
        setConfirmDialog({ isOpen: false, title: '', description: '' });
        showSaveMessage('✓ Données de test générées');
      },
    });
  };

  const activityOptions = [
    { value: 'SALE', label: 'Vente de marchandises (BIC)' },
    { value: 'SERVICE_BIC', label: 'Prestations de services (BIC)' },
    { value: 'SERVICE_BNC', label: 'Prestations de services (BNC)' },
    { value: 'LIBERAL', label: 'Profession libérale réglementée' },
  ];

  const eInvoiceFormatOptions = [
    { value: 'Factur-X', label: 'Factur-X (Recommandé)' },
    { value: 'UBL', label: 'UBL' },
    { value: 'CII', label: 'CII' },
  ];

  const operationCategoryOptions = [
    { value: 'BIENS', label: 'Livraison de biens' },
    { value: 'SERVICES', label: 'Prestation de services' },
    { value: 'MIXTE', label: 'Opération mixte' },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-brand-900 dark:text-white font-display tracking-tight">Paramètres</h2>
          <p className="text-brand-500 dark:text-brand-400 mt-1">Gérez votre profil, votre image de marque et vos données.</p>
        </div>
        
        {/* TAB BUTTONS */}
        <div className="flex bg-brand-100/50 dark:bg-brand-900/30 p-1 rounded-2xl border border-brand-100 dark:border-brand-800 overflow-x-auto no-scrollbar">
          {['profile', 'billing', 'preferences', 'data'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              aria-selected={activeTab === tab}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm'
                  : 'bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300'
              }`}
            >
              {{ profile: 'Profil', billing: 'Facturation', preferences: 'Préférences', data: 'Données' }[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* MAIN CONTENT */}
        <div className="xl:col-span-2 space-y-8">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-slide-up">
              {/* Identity Card */}
              <div className="bg-white dark:bg-brand-900/50 rounded-[2rem] p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Building size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">Identité Professionnelle</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <FormField
                      label="Nom commercial / Raison sociale"
                      value={userProfile.companyName}
                      onChange={(val) => handleChange('companyName', val)}
                      placeholder="Ex: Mon Entreprise Digitale"
                      required
                    />
                  </div>
                  <FormField
                    label="Titre Professionnel"
                    value={userProfile.professionalTitle || ''}
                    onChange={(val) => handleChange('professionalTitle', val)}
                    placeholder="Ex: Consultant IT, Photographe..."
                    icon={Briefcase}
                  />
                  <FormField
                    label="SIRET"
                    value={userProfile.siret}
                    onChange={(val) => handleChange('siret', val)}
                    placeholder="123 456 789 00012"
                    icon={Hash}
                  />
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-white dark:bg-brand-900/50 rounded-[2rem] p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <MailIcon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">Coordonnées & Web</h3>
                </div>

                <div className="space-y-8">
                  <TextAreaField
                    label="Adresse du siège"
                    value={userProfile.address}
                    onChange={(val) => handleChange('address', val)}
                    placeholder="123 Avenue de la République, 75001 Paris"
                    icon={MapPin}
                    rows={2}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      label="Email Professionnel"
                      type="email"
                      value={userProfile.email}
                      onChange={(val) => handleChange('email', val)}
                      icon={MailIcon}
                    />
                    <FormField
                      label="Téléphone"
                      type="tel"
                      value={userProfile.phone}
                      onChange={(val) => handleChange('phone', val)}
                      icon={PhoneIcon}
                    />
                    <FormField
                      label="Site Web"
                      type="url"
                      value={userProfile.website || ''}
                      onChange={(val) => handleChange('website', val)}
                      placeholder="www.mon-site.fr"
                      icon={Globe}
                    />
                    <FormField
                      label="LinkedIn"
                      value={userProfile.linkedin || ''}
                      onChange={(val) => handleChange('linkedin', val)}
                      placeholder="linkedin.com/in/profil"
                      icon={Briefcase}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-slide-up">
              {/* Branding */}
              <div className="bg-white dark:bg-brand-900/50 rounded-[2rem] p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Palette size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">Identité Visuelle</h3>
                </div>

                <ColorPicker
                  label="Couleur de l'entreprise"
                  value={userProfile.logoColor || '#102a43'}
                  onChange={(val) => handleChange('logoColor', val)}
                  presets={['#102a43', '#0f172a', '#1e293b', '#334155', '#059669', '#0891b2', '#4f46e5', '#7c3aed']}
                />
              </div>

              {/* Financial */}
              <div className="bg-white dark:bg-brand-900/50 rounded-[2rem] p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-xl">
                    <Wallet size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">Bancaire & Légal</h3>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      label="IBAN"
                      value={userProfile.bankAccount}
                      onChange={(val) => handleChange('bankAccount', val)}
                      placeholder="FR76 ..."
                      icon={CreditCard}
                    />
                    <FormField
                      label="BIC / SWIFT"
                      value={userProfile.bic || ''}
                      onChange={(val) => handleChange('bic', val)}
                      placeholder="TRPUFRPPXXX"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SelectField
                      label="Devise"
                      value={userProfile.currency || '€'}
                      onChange={(val) => handleChange('currency', val)}
                      options={[
                        { value: '€', label: 'Euro (€)' },
                        { value: '$', label: 'Dollar ($)' },
                        { value: '£', label: 'Livre (£)' },
                        { value: 'CHF', label: 'Franc Suisse' },
                      ]}
                    />
                    <FormField
                      label="TVA par défaut (%)"
                      type="number"
                      value={String(userProfile.defaultVatRate || 0)}
                      onChange={(val) => handleChange('defaultVatRate', Number.parseFloat(val))}
                    />
                  </div>

                  <FormField
                    label="Numéro de TVA Intracommunautaire"
                    value={userProfile.tvaNumber || ''}
                    onChange={(val) => handleChange('tvaNumber', val)}
                    placeholder="FRXX 123456789"
                    description="Laissez vide si vous bénéficiez de la franchise en base de TVA."
                  />

                  {/* URSSAF Settings */}
                  <div className="pt-8 border-t border-brand-50 dark:border-brand-800">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                        <Calculator size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-900 dark:text-white uppercase tracking-wider">Régime Micro-Entrepreneur</h4>
                        <p className="text-[10px] text-brand-400 dark:text-brand-500 font-medium">Configurez vos calculs de cotisations et seuils</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <SelectField
                        label="Type d'activité (URSSAF)"
                        value={userProfile.activityType || 'SERVICE_BNC'}
                        onChange={(val) => handleChange('activityType', val)}
                        options={activityOptions}
                      />
                    </div>

                    <div className="space-y-4">
                      <ToggleSwitch
                        label="Bénéficiaire ACRE"
                        checked={userProfile.isAcreBeneficiary || false}
                        onChange={(val) => handleChange('isAcreBeneficiary', val)}
                        description="Taux réduit de cotisations"
                      />
                      <ToggleSwitch
                        label="Alertes seuil TVA"
                        checked={userProfile.vatThresholdAlert || true}
                        onChange={(val) => handleChange('vatThresholdAlert', val)}
                        description="Notifier à l'approche du seuil"
                      />
                      <ToggleSwitch
                        label="Alertes plafond CA"
                        checked={userProfile.revenueThresholdAlert || true}
                        onChange={(val) => handleChange('revenueThresholdAlert', val)}
                        description="Notifier à l'approche du plafond"
                      />
                    </div>
                  </div>

                  {/* E-Invoicing 2026 */}
                  <div className="pt-8 border-t border-brand-50 dark:border-brand-800">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-xl">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-brand-900 dark:text-white uppercase tracking-wider">Facturation Électronique 2026</h4>
                        <p className="text-[10px] text-brand-400 dark:text-brand-500 font-medium">Préparez votre conformité au PPF / PDP</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <SelectField
                        label="Format d'échange par défaut"
                        value={userProfile.defaultEInvoiceFormat || 'Factur-X'}
                        onChange={(val) => handleChange('defaultEInvoiceFormat', val)}
                        options={eInvoiceFormatOptions}
                      />
                      <SelectField
                        label="Catégorie d'activité"
                        value={userProfile.defaultOperationCategory || 'SERVICES'}
                        onChange={(val) => handleChange('defaultOperationCategory', val)}
                        options={operationCategoryOptions}
                      />
                    </div>

                    <div className="mt-6 p-4 bg-accent-50 dark:bg-accent-900/20 rounded-2xl border border-accent-100 dark:border-accent-900/30 flex items-start gap-3">
                      <ShieldCheck size={18} className="text-accent-600 dark:text-accent-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-accent-700 dark:text-accent-300 leading-relaxed">
                        Ces paramètres seront appliqués par défaut à vos nouveaux documents. En 2026, la transmission électronique sera obligatoire pour toutes les transactions B2B assujetties à la TVA.
                      </p>
                    </div>

                    <div className="mt-8">
                      <TextAreaField
                        label="Mentions légales bas de page"
                        value={userProfile.legalMentions || ''}
                        onChange={(val) => handleChange('legalMentions', val)}
                        placeholder="Ex: Dispensé d'immatriculation au registre du commerce et des sociétés..."
                        icon={ShieldCheck}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Numbering */}
              <div className="bg-white dark:bg-brand-900/50 rounded-[2rem] p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Hash size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">Préfixes de Numérotation</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <FormField
                    label="Facture"
                    value={userProfile.invoicePrefix || 'FAC-'}
                    onChange={(val) => handleChange('invoicePrefix', val)}
                  />
                  <FormField
                    label="Devis"
                    value={userProfile.quotePrefix || 'DEV-'}
                    onChange={(val) => handleChange('quotePrefix', val)}
                  />
                  <FormField
                    label="Commande"
                    value={userProfile.orderPrefix || 'COM-'}
                    onChange={(val) => handleChange('orderPrefix', val)}
                  />
                  <FormField
                    label="Avoir"
                    value={userProfile.creditNotePrefix || 'AVO-'}
                    onChange={(val) => handleChange('creditNotePrefix', val)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === 'data' && (
            <div className="space-y-8 animate-slide-up">
              {/* Data Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Factures', value: allData.invoices.length, icon: Hash },
                  { label: 'Clients', value: allData.clients.length, icon: Briefcase },
                  { label: 'Produits', value: allData.products.length, icon: Palette },
                  { label: 'Dépenses', value: allData.expenses.length, icon: Wallet },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white dark:bg-brand-900/50 p-6 rounded-[2rem] border border-brand-100 dark:border-brand-800 shadow-sm text-center">
                    <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-brand-900 dark:text-white font-display">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Backup & Maintenance */}
              <div className="bg-white dark:bg-brand-900/50 p-8 rounded-[2.5rem] border border-brand-100 dark:border-brand-800 shadow-sm">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Database size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">Sauvegarde & Maintenance</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <button
                    onClick={handleExportAll}
                    aria-label="Exporter toutes les données"
                    className="flex items-center justify-center gap-3 p-5 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl hover:bg-brand-950 dark:hover:bg-brand-100 transition-all font-bold text-sm shadow-xl shadow-brand-900/10"
                  >
                    <Download size={20} /> Exporter (.json)
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Importer un fichier"
                    className="flex items-center justify-center gap-3 p-5 bg-white dark:bg-brand-800 border border-brand-100 dark:border-brand-700 text-brand-700 dark:text-brand-200 rounded-2xl hover:bg-brand-50 dark:hover:bg-brand-700/50 transition-all font-bold text-sm"
                  >
                    <Upload size={20} /> Importer (.json)
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleImportAll}
                    aria-label="Sélectionner un fichier à importer"
                  />
                </div>

                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 mb-8 flex gap-4">
                  <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1">Sécurité des données</p>
                    <p className="text-xs text-amber-700 dark:text-amber-200 leading-relaxed">
                      Vos données sont stockées localement dans votre navigateur. Elles ne sont jamais envoyées sur un serveur externe.
                      Pensez à faire des exports réguliers pour éviter toute perte en cas de suppression de l'historique.
                    </p>
                  </div>
                </div>

                <div className="border-t border-brand-50 dark:border-brand-800 pt-8">
                  <p className="text-sm font-bold text-brand-900 dark:text-white mb-4">Actions avancées</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={generateSampleData}
                      aria-label="Générer des données de test"
                      className="flex items-center justify-center gap-2 p-4 bg-brand-50 dark:bg-brand-800 text-brand-700 dark:text-brand-200 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-700 transition-all text-xs font-bold"
                    >
                      <RefreshCw size={16} /> Test data
                    </button>
                    <button
                      onClick={handleResetApp}
                      aria-label="Réinitialiser toutes les données"
                      className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-xs font-bold"
                    >
                      <Trash2 size={16} /> Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - PREVIEW */}
        <div className="xl:col-span-1">
          <div className="sticky top-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h4 className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-[0.2em]">Aperçu Facture</h4>
              <div className="flex items-center gap-2 text-[10px] font-bold text-accent-600 dark:text-accent-400 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 dark:bg-accent-400 animate-pulse"></span> Live
              </div>
            </div>

            <div className="bg-white dark:bg-brand-900/30 p-8 rounded-[2.5rem] shadow-2xl shadow-brand-200/50 dark:shadow-black/30 border border-brand-100 dark:border-brand-800 min-h-[500px] flex flex-col relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-bl-[5rem] -mr-10 -mt-10 opacity-20"
                style={{ backgroundColor: userProfile.logoColor || '#102a43' }}
              />

              {/* Header */}
              <div className="border-b border-brand-100 dark:border-brand-800 pb-8 mb-8 relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl font-bold text-2xl"
                  style={{ backgroundColor: userProfile.logoColor || '#102a43' }}
                >
                  {userProfile.companyName.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-bold text-brand-900 dark:text-white text-xl leading-tight mb-1 font-display">
                  {userProfile.companyName || 'Votre Entreprise'}
                </h2>
                {userProfile.professionalTitle && (
                  <p className="text-xs font-bold text-brand-400 dark:text-brand-500 uppercase tracking-wider mb-4">
                    {userProfile.professionalTitle}
                  </p>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-brand-500 dark:text-brand-400">
                    <MailIcon size={12} className="text-brand-300 dark:text-brand-600" />
                    {userProfile.email}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-brand-500 dark:text-brand-400">
                    <PhoneIcon size={12} className="text-brand-300 dark:text-brand-600" />
                    {userProfile.phone}
                  </div>
                  {userProfile.website && (
                    <div className="flex items-center gap-2 text-[11px] font-bold" style={{ color: userProfile.logoColor || '#102a43' }}>
                      <Globe size={12} /> {userProfile.website}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Placeholder */}
              <div className="space-y-5 opacity-30 mb-auto">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <div className="h-4 bg-brand-100 dark:bg-brand-800 rounded-full w-32"></div>
                    <div className="h-3 bg-brand-50 dark:bg-brand-900 rounded-full w-24"></div>
                  </div>
                  <div className="h-10 bg-brand-50 dark:bg-brand-900 rounded-xl w-24 border border-brand-100 dark:border-brand-800"></div>
                </div>
                <div className="h-32 bg-brand-50 dark:bg-brand-900/50 rounded-3xl w-full border border-brand-100 dark:border-brand-800 border-dashed"></div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-brand-100 dark:border-brand-800 text-[9px] text-center text-brand-400 dark:text-brand-500 leading-relaxed">
                <p className="font-bold text-brand-600 dark:text-brand-400 mb-1 uppercase tracking-widest">
                  {userProfile.companyName}
                </p>
                <p className="max-w-[200px] mx-auto">{userProfile.address}</p>
                <div className="flex items-center justify-center gap-3 mt-2 font-bold text-brand-500 dark:text-brand-400 text-[8px]">
                  <span>SIRET: {userProfile.siret}</span>
                  {userProfile.tvaNumber && <span>TVA: {userProfile.tvaNumber}</span>}
                </div>
                {!userProfile.tvaNumber && (
                  <p className="mt-1 italic text-brand-400 dark:text-brand-600">TVA non applicable, art. 293 B du CGI</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOGS */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isDangerous={confirmDialog.isDangerous}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', description: '' })}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        description={alertDialog.description}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ isOpen: false, title: '', description: '', type: 'info' })}
      />
    </div>
  );
};

export default SettingsManager;
