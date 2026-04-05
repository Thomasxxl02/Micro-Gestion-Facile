/**
 * SettingsManager - Gestion du profil et des paramètres d'entreprise
 * ✅ Accessibilité intégrée (WCAG 2.1 AA)
 * ✅ Composants modulaires (FormFields, Dialogs)
 * ✅ Anti-patterns corrigés (window.confirm → ConfirmDialog, parseFloat → Number.parseFloat)
 */

import {
  Briefcase,
  Building,
  CreditCard,
  Download,
  Globe,
  Hash,
  Mail as MailIcon,
  MapPin,
  Palette,
  Phone as PhoneIcon,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet,
  Zap,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { parseImportJSON } from '../lib/exportUtils';
import { useAppStore } from '../store/appStore';
import type {
  Client,
  Expense,
  Invoice,
  InvoiceStatus,
  Product,
  Supplier,
  UserProfile,
} from '../types';
import { ConfirmDialog } from './Dialogs';
import {
  ColorPicker,
  FormField,
  LogoUploader,
  SelectField,
  TextAreaField,
  ToggleSwitch,
} from './FormFields';
import SecurityTab from './SecurityTab';

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

const SETTINGS_TABS = ['profile', 'billing', 'preferences', 'security', 'data'] as const;

const SettingsManager: React.FC<SettingsManagerProps> = ({
  userProfile,
  setUserProfile,
  onSaveProfile,
  allData,
  setAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'billing' | 'data' | 'preferences' | 'security'
  >('profile');
  const { addLog } = useAppStore();

  // ─── KEYBOARD NAVIGATION (ARIA tablist pattern) ───
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = SETTINGS_TABS.indexOf(activeTab as (typeof SETTINGS_TABS)[number]);
    const next = (() => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          return (idx + 1) % SETTINGS_TABS.length;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          return (idx - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length;
        case 'Home':
          e.preventDefault();
          return 0;
        case 'End':
          e.preventDefault();
          return SETTINGS_TABS.length - 1;
        default:
          return null;
      }
    })();
    if (next === null) {
      return;
    }
    setActiveTab(SETTINGS_TABS[next]);
    const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons[next]?.focus();
  };

  // ─── DIALOG STATES ───
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDangerous?: boolean;
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', description: '' });

  const [isDirty, setIsDirty] = useState(false);

  // ─── VALIDATION STATE ───
  const [validationErrors, setValidationErrors] = useState<{
    siret?: string;
    bankAccount?: string;
    email?: string;
  }>({});

  // ─── LAST BACKUP DATE ───
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(
    localStorage.getItem('mgf_last_backup_date')
  );

  // ─── VALIDATION FUNCTIONS ───
  const validateSIRET = (value: string): string | undefined => {
    if (!value) {
      return undefined;
    }
    const digits = value.replace(/[\s-]/g, '');
    if (!/^\d{14}$/.test(digits)) {
      return 'Le SIRET doit contenir exactement 14 chiffres';
    }
    return undefined;
  };

  const validateIBAN = (value: string): string | undefined => {
    if (!value) {
      return undefined;
    }
    const normalized = value.replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(normalized)) {
      return 'Format IBAN invalide (ex : FR76 3000 6000 0112 3456 7890 189)';
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value) {
      return undefined;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Adresse email invalide';
    }
    return undefined;
  };

  // ─── HANDLERS ───
  const handleChange = (
    field: keyof UserProfile,
    value: string | number | boolean | Record<string, unknown>
  ) => {
    const updatedProfile = { ...userProfile, [field]: value };
    setUserProfile(updatedProfile);
    setIsDirty(true);
    if (field === 'siret') {
      setValidationErrors((prev) => ({ ...prev, siret: validateSIRET(value as string) }));
    } else if (field === 'bankAccount') {
      setValidationErrors((prev) => ({ ...prev, bankAccount: validateIBAN(value as string) }));
    } else if (field === 'email') {
      setValidationErrors((prev) => ({ ...prev, email: validateEmail(value as string) }));
    }
  };

  const handleSave = () => {
    if (onSaveProfile) {
      onSaveProfile(userProfile);
    }
    toast.success('Profil sauvegardé');
    setIsDirty(false);
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
    const now = new Date().toISOString();
    localStorage.setItem('mgf_last_backup_date', now);
    setLastBackupDate(now);
    addLog('Export complet des données effectué', 'DATA', 'INFO');
    toast.success('Données exportées avec succès');
  };

  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const result = parseImportJSON(text);

      if (!result.valid || !result.data) {
        addLog("Échec de l'importation de données", 'DATA', 'ERROR');
        toast.error("Erreur d'importation", {
          description: `Fichier invalide : ${result.error ?? 'Format JSON non reconnu'}`,
        });
        return;
      }

      const { data } = result;
      if (data.userProfile) {
        setUserProfile(data.userProfile as UserProfile);
      }
      if (data.invoices) {
        setAllData.setInvoices(data.invoices as Invoice[]);
      }
      if (data.clients) {
        setAllData.setClients(data.clients as Client[]);
      }
      if (data.suppliers) {
        setAllData.setSuppliers(data.suppliers as Supplier[]);
      }
      if (data.products) {
        setAllData.setProducts(data.products as Product[]);
      }
      if (data.expenses) {
        setAllData.setExpenses(data.expenses as Expense[]);
      }

      addLog('Importation de données externe réussie', 'DATA', 'INFO');
      toast.success('Données importées avec succès');
    } catch {
      addLog("Échec de l'importation de données", 'DATA', 'ERROR');
      toast.error("Erreur d'importation", {
        description: 'Le fichier est invalide ou corrompu. Vérifiez le format JSON.',
      });
    }
  };

  const generateSampleData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Générer des données de test ?',
      description: 'Cela ajoutera des clients, produits et factures fictives à votre application.',
      onConfirm: () => {
        const sampleClients: Client[] = [
          {
            id: 'c1',
            name: 'Acme Corp',
            email: 'contact@acme.com',
            address: '10 Rue de la Paix, Paris',
            category: 'Entreprise',
          },
          {
            id: 'c2',
            name: 'Jean Dupont',
            email: 'jean.dupont@gmail.com',
            address: '5 Avenue des Champs, Lyon',
            category: 'Particulier',
          },
        ];

        const sampleProducts: Product[] = [
          {
            id: 'p1',
            name: 'Consulting IT',
            description: 'Prestation de conseil technique',
            price: 650,
            type: 'service',
            unit: 'jour',
          },
          {
            id: 'p2',
            name: 'Développement Web',
            description: 'Création de site vitrine',
            price: 2500,
            type: 'service',
            unit: 'unité',
          },
        ];

        const sampleInvoices: Invoice[] = [
          {
            id: 'i1',
            type: 'invoice',
            number: 'FAC-2024-001',
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            clientId: 'c1',
            items: [
              {
                id: 'it1',
                description: 'Consulting IT',
                quantity: 5,
                unitPrice: 650,
                unit: 'jour',
              },
            ],
            status: 'paid' as InvoiceStatus,
            total: 3250,
          },
        ];

        setAllData.setClients([...allData.clients, ...sampleClients]);
        setAllData.setProducts([...allData.products, ...sampleProducts]);
        setAllData.setInvoices([...allData.invoices, ...sampleInvoices]);
        setConfirmDialog({ isOpen: false, title: '', description: '' });
        toast.success('Données de test générées');
      },
    });
  };

  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Réinitialiser toutes les données ?',
      description:
        'Cette action est irréversible. Toutes les factures, clients, fournisseurs, produits et dépenses seront supprimés définitivement. Votre profil sera conservé.',
      isDangerous: true,
      onConfirm: () => {
        setAllData.setInvoices([]);
        setAllData.setClients([]);
        setAllData.setSuppliers([]);
        setAllData.setProducts([]);
        setAllData.setExpenses([]);
        setConfirmDialog({ isOpen: false, title: '', description: '' });
        addLog('Réinitialisation complète des données effectuée', 'DATA', 'WARNING');
        toast.success('Données réinitialisées');
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-brand-900 dark:text-white font-display tracking-tight">
            Paramètres
          </h1>
          <p className="text-brand-500 dark:text-brand-400 mt-1">
            Gérez votre profil, votre image de marque et vos données.
          </p>
        </div>

        {/* TAB BUTTONS */}
        <div
          role="tablist"
          aria-label="Paramètres de l'application"
          onKeyDown={handleTabKeyDown}
          className="flex bg-brand-100/50 dark:bg-brand-900/30 p-1 rounded-2xl border border-brand-100 dark:border-brand-800 overflow-x-auto no-scrollbar"
        >
          {activeTab === 'profile' ? (
            <button
              id="tab-profile-active"
              aria-controls="panel-profile"
              onClick={() => setActiveTab('profile')}
              role="tab"
              aria-selected="true"
              tabIndex={0}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm"
            >
              Profil
            </button>
          ) : (
            <button
              id="tab-profile-inactive"
              aria-controls="panel-profile"
              onClick={() => setActiveTab('profile')}
              role="tab"
              aria-selected="false"
              tabIndex={-1}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Profil
            </button>
          )}

          {activeTab === 'billing' ? (
            <button
              id="tab-billing-active"
              aria-controls="panel-billing"
              onClick={() => setActiveTab('billing')}
              role="tab"
              aria-selected="true"
              tabIndex={0}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm"
            >
              Facturation
            </button>
          ) : (
            <button
              id="tab-billing-inactive"
              aria-controls="panel-billing"
              onClick={() => setActiveTab('billing')}
              role="tab"
              aria-selected="false"
              tabIndex={-1}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Facturation
            </button>
          )}

          {activeTab === 'preferences' ? (
            <button
              id="tab-preferences-active"
              aria-controls="panel-preferences"
              onClick={() => setActiveTab('preferences')}
              role="tab"
              aria-selected="true"
              tabIndex={0}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm"
            >
              Style
            </button>
          ) : (
            <button
              id="tab-preferences-inactive"
              aria-controls="panel-preferences"
              onClick={() => setActiveTab('preferences')}
              role="tab"
              aria-selected="false"
              tabIndex={-1}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Style
            </button>
          )}

          {activeTab === 'security' ? (
            <button
              id="tab-security-active"
              onClick={() => setActiveTab('security')}
              role="tab"
              aria-selected="true"
              tabIndex={0}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm"
            >
              Sécurité
            </button>
          ) : (
            <button
              id="tab-security-inactive"
              onClick={() => setActiveTab('security')}
              role="tab"
              aria-selected="false"
              tabIndex={-1}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Sécurité
            </button>
          )}

          {activeTab === 'data' ? (
            <button
              id="tab-data-active"
              aria-controls="panel-data"
              onClick={() => setActiveTab('data')}
              role="tab"
              aria-selected="true"
              tabIndex={0}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm"
            >
              Données
            </button>
          ) : (
            <button
              id="tab-data-inactive"
              aria-controls="panel-data"
              onClick={() => setActiveTab('data')}
              role="tab"
              aria-selected="false"
              tabIndex={-1}
              className="px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Données
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* MAIN CONTENT */}
        <div className="xl:col-span-2 space-y-8">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div
              id="panel-profile"
              role="tabpanel"
              aria-labelledby="tab-profile"
              className="space-y-8 animate-slide-up"
            >
              {/* Image de marque */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Palette size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Image de marque
                  </h3>
                </div>
                <LogoUploader
                  logoUrl={userProfile.logoUrl}
                  onChange={(url) => handleChange('logoUrl', url)}
                  onRemove={() => handleChange('logoUrl', '')}
                />
              </div>

              {/* Identity Card */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Building size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Identité Professionnelle
                  </h3>
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
                    error={validationErrors.siret}
                    description="14 chiffres obligatoires (art. L123-1 Code de commerce)"
                  />
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <MailIcon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Coordonnées & Web
                  </h3>
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
                      error={validationErrors.email}
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
            <div
              id="panel-billing"
              role="tabpanel"
              aria-labelledby="tab-billing"
              className="space-y-8 animate-slide-up"
            >
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Conformité Fiscale
                  </h3>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SelectField
                      label="Régime d'imposition"
                      value={userProfile.taxSystem || 'MICRO-BNC'}
                      onChange={(val) => handleChange('taxSystem', val)}
                      options={[
                        { value: 'MICRO-BNC', label: 'Micro-BNC (Services libéraux)' },
                        { value: 'MICRO-BIC', label: 'Micro-BIC (Artisanat / Vente)' },
                        { value: 'LIBERAL', label: 'Profession libérale' },
                      ]}
                    />
                  </div>
                  <ToggleSwitch
                    label="Franchise en base de TVA"
                    description="Active la mention automatique 'TVA non applicable, art. 293 B du CGI' sur vos documents"
                    checked={userProfile.isVatExempt || false}
                    onChange={(val) => handleChange('isVatExempt', val)}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-xl">
                    <Wallet size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Bancaire & Légal
                  </h3>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      label="IBAN"
                      value={userProfile.bankAccount || ''}
                      onChange={(val) => handleChange('bankAccount', val)}
                      placeholder="FR76 3000 6000 0112 3456 7890 189"
                      icon={CreditCard}
                      error={validationErrors.bankAccount}
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
                      onChange={(val) => {
                        const parsed = Number.parseFloat(val);
                        handleChange('defaultVatRate', Number.isNaN(parsed) ? 0 : parsed);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ─── Numérotation des Documents ─── */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Hash size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                      Numérotation des Documents
                    </h3>
                    <p className="text-xs text-brand-400 dark:text-brand-500 mt-0.5">
                      Conformité fiscale française — art. L441-9 du Code de commerce
                    </p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      label="Préfixe des Factures"
                      value={userProfile.invoicePrefix || 'FAC-'}
                      onChange={(val) => handleChange('invoicePrefix', val)}
                      placeholder="FAC-2026-"
                      icon={Hash}
                      description="Préfixe auto-ajouté avant le numéro séquentiel"
                    />
                    <FormField
                      label="Prochain N° de Facture"
                      type="number"
                      value={String(userProfile.invoiceStartNumber ?? 1)}
                      onChange={(val) => {
                        const parsed = parseInt(val, 10);
                        handleChange(
                          'invoiceStartNumber',
                          Number.isNaN(parsed) ? 1 : Math.max(1, parsed)
                        );
                      }}
                      min={1}
                      placeholder="1"
                      description="Numéro de la prochaine facture émise"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      label="Préfixe des Devis"
                      value={userProfile.quotePrefix || 'DEV-'}
                      onChange={(val) => handleChange('quotePrefix', val)}
                      placeholder="DEV-2026-"
                      icon={Hash}
                    />
                    <FormField
                      label="Préfixe des Avoirs"
                      value={userProfile.creditNotePrefix || 'AV-'}
                      onChange={(val) => handleChange('creditNotePrefix', val)}
                      placeholder="AV-2026-"
                      icon={Hash}
                    />
                  </div>
                  <div className="p-4 bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl border border-dashed border-brand-200 dark:border-brand-700">
                    <p className="text-[10px] uppercase font-bold text-brand-400 mb-2">
                      Aperçu du numéro généré
                    </p>
                    <p className="text-base font-mono font-bold text-brand-700 dark:text-brand-300">
                      {userProfile.invoicePrefix || 'FAC-'}
                      {String(userProfile.invoiceStartNumber ?? 1).padStart(3, '0')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div
              id="panel-preferences"
              role="tabpanel"
              aria-labelledby="tab-preferences"
              className="space-y-8 animate-slide-up"
            >
              {/* Colors Card */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Palette size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Apparence
                  </h3>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SelectField
                      label="Thème"
                      value={userProfile.theme || 'auto'}
                      onChange={(val) => handleChange('theme', val)}
                      options={[
                        { value: 'light', label: '☀️ Clair (Light)' },
                        { value: 'dark', label: '🌙 Sombre (Dark)' },
                        { value: 'auto', label: '🔄 Auto (selon système)' },
                      ]}
                    />
                    <div>
                      <ColorPicker
                        label="Couleur Primaire"
                        value={userProfile.primaryColor || userProfile.logoColor || '#102a43'}
                        onChange={(val) => handleChange('primaryColor', val)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Card */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Globe size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Affichage
                  </h3>
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SelectField
                      label="Taille de Police"
                      value={userProfile.fontSize || 'normal'}
                      onChange={(val) => handleChange('fontSize', val)}
                      options={[
                        { value: 'small', label: '🔤 Petite' },
                        { value: 'normal', label: '🔤 Normale' },
                        { value: 'large', label: '🔤 Grande' },
                      ]}
                    />
                    <SelectField
                      label="Densité de l'interface"
                      value={userProfile.uiDensity || 'normal'}
                      onChange={(val) => handleChange('uiDensity', val)}
                      options={[
                        { value: 'compact', label: '📦 Compacte' },
                        { value: 'normal', label: '📑 Normale' },
                        { value: 'spacious', label: '🌬️ Spacieuse' },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SelectField
                      label="Format de date"
                      value={userProfile.dateFormat || 'DD/MM/YYYY'}
                      onChange={(val) => handleChange('dateFormat', val)}
                      options={[
                        { value: 'DD/MM/YYYY', label: '📅 DD/MM/YYYY (Français)' },
                        { value: 'MM/DD/YYYY', label: '📅 MM/DD/YYYY (International)' },
                        { value: 'YYYY-MM-DD', label: '📅 YYYY-MM-DD (ISO)' },
                      ]}
                    />
                    <SelectField
                      label="Format de l'heure"
                      value={userProfile.timeFormat || '24h'}
                      onChange={(val) => handleChange('timeFormat', val)}
                      options={[
                        { value: '24h', label: '🕐 24h (00:00-23:59)' },
                        { value: '12h', label: '🕐 12h (12:00 AM-11:59 PM)' },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Notifications Card */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <div className="flex items-center gap-3 mb-8 border-b border-brand-50 dark:border-brand-800 pb-4">
                  <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-brand-900 dark:text-white font-display">
                    Notifications
                  </h3>
                </div>
                <div className="space-y-6">
                  <ToggleSwitch
                    label="Activer les notifications"
                    description="Notifications dans l'app et push"
                    checked={userProfile.enableNotifications !== false}
                    onChange={(val) => handleChange('enableNotifications', val)}
                  />

                  {userProfile.enableNotifications !== false && (
                    <div className="pl-4 border-l-2 border-brand-200 dark:border-brand-700 space-y-4">
                      <ToggleSwitch
                        label="Rappels d'échéances"
                        description="Vous alerter avant la date d'exigibilité des factures"
                        checked={userProfile.notificationTypes?.invoiceReminders !== false}
                        onChange={(val) =>
                          handleChange('notificationTypes', {
                            ...userProfile.notificationTypes,
                            invoiceReminders: val,
                          })
                        }
                      />

                      <ToggleSwitch
                        label="Rappels de paiement"
                        description="Vous notifier des paiements en attente"
                        checked={userProfile.notificationTypes?.paymentReminders !== false}
                        onChange={(val) =>
                          handleChange('notificationTypes', {
                            ...userProfile.notificationTypes,
                            paymentReminders: val,
                          })
                        }
                      />

                      <ToggleSwitch
                        label="Alertes de dépenses"
                        description="Vous avertir des seuils de dépenses dépassés"
                        checked={userProfile.notificationTypes?.expenseAlerts !== false}
                        onChange={(val) =>
                          handleChange('notificationTypes', {
                            ...userProfile.notificationTypes,
                            expenseAlerts: val,
                          })
                        }
                      />

                      <ToggleSwitch
                        label="Mises à jour système"
                        description="Informations sur les nouvelles fonctionnalités"
                        checked={userProfile.notificationTypes?.systemUpdates !== false}
                        onChange={(val) =>
                          handleChange('notificationTypes', {
                            ...userProfile.notificationTypes,
                            systemUpdates: val,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-brand-100 dark:border-brand-800">
                    <ToggleSwitch
                      label="Notifications par email"
                      description="Recevoir un résumé hebdomadaire par email"
                      checked={userProfile.enableEmailNotifications || false}
                      onChange={(val) => handleChange('enableEmailNotifications', val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <SecurityTab
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              onSaveProfile={onSaveProfile}
            />
          )}

          {/* DATA TAB */}
          {activeTab === 'data' && (
            <div
              id="panel-data"
              role="tabpanel"
              aria-labelledby="tab-data"
              className="space-y-8 animate-slide-up"
            >
              {/* Résumé statistiques */}
              <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
                <h3 className="text-sm font-bold text-brand-900 dark:text-white mb-6">
                  Résumé des données
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(
                    [
                      { label: 'Factures', count: allData.invoices.length },
                      { label: 'Clients', count: allData.clients.length },
                      { label: 'Fournisseurs', count: allData.suppliers.length },
                      { label: 'Produits', count: allData.products.length },
                      { label: 'Dépenses', count: allData.expenses.length },
                    ] as { label: string; count: number }[]
                  ).map(({ label, count }) => (
                    <div
                      key={label}
                      className="p-4 bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl text-center"
                    >
                      <p className="text-2xl font-bold text-brand-900 dark:text-white">{count}</p>
                      <p className="text-[10px] uppercase font-bold text-brand-400 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                {lastBackupDate && (
                  <p className="text-[11px] text-brand-400 mt-5 text-center">
                    Dernier export :{' '}
                    <span className="font-semibold">
                      {new Date(lastBackupDate).toLocaleString('fr-FR')}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={handleExportAll}
                  className="flex items-center justify-center gap-3 p-5 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl font-bold text-sm shadow-xl shadow-brand-900/10"
                >
                  <Download size={20} /> Exporter (.json)
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-3 p-5 bg-white dark:bg-brand-800 border border-brand-100 text-brand-700 rounded-2xl font-bold text-sm"
                >
                  <Upload size={20} /> Importer (.json)
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleImportAll}
                  aria-label="Sélectionner un fichier de sauvegarde JSON pour l'importation"
                />
              </div>
              <div className="pt-4 border-t border-brand-100 dark:border-brand-800 space-y-3">
                <button
                  onClick={generateSampleData}
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-brand-200 dark:border-brand-700 rounded-2xl text-brand-500 dark:text-brand-400 font-bold text-xs hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-200 transition-colors"
                >
                  <Zap size={16} /> Données de Test
                </button>
                <p className="text-[11px] text-brand-400 text-center">
                  Ajoute des clients, produits et factures fictives.
                </p>
                <button
                  onClick={handleResetData}
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-red-200 dark:border-red-900/50 rounded-2xl text-red-500 dark:text-red-400 font-bold text-xs hover:border-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={16} /> Réinitialiser toutes les données
                </button>
                <p className="text-[11px] text-brand-400 text-center">
                  Supprime définitivement toutes les factures, clients, fournisseurs et produits.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PREVIEW COLUMN */}
        <div className="xl:col-span-1">
          <div className="sticky top-10">
            <div
              className={`bg-white dark:bg-brand-900/30 p-8 rounded-4xl shadow-2xl border-t-4 border-brand-100 dark:border-brand-800 min-h-125 flex flex-col relative overflow-hidden border-t-[${userProfile.primaryColor ?? '#102a43'}]`}
            >
              <div className="border-b border-brand-100 dark:border-brand-800 pb-8 mb-8">
                {userProfile.logoUrl ? (
                  <img
                    src={userProfile.logoUrl}
                    alt={`Logo ${userProfile.companyName}`}
                    className="h-12 object-contain mb-3"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base mb-3 bg-[${userProfile.primaryColor ?? '#102a43'}]`}
                    aria-hidden="true"
                  >
                    {(userProfile.companyName || 'E').charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="font-bold text-brand-900 dark:text-white text-xl">
                  {userProfile.companyName || 'Votre Entreprise'}
                </h2>

                {/* Contenu contextuel selon l'onglet actif */}
                {activeTab === 'profile' && (
                  <div className="mt-4 space-y-1 text-[11px] text-brand-500">
                    {userProfile.email && <p>{userProfile.email}</p>}
                    {userProfile.phone && <p>{userProfile.phone}</p>}
                    {userProfile.address && <p className="line-clamp-2">{userProfile.address}</p>}
                  </div>
                )}
                {activeTab === 'billing' && (
                  <div className="mt-4 space-y-1.5 text-[11px] text-brand-500">
                    <p>
                      Régime :{' '}
                      <span className="font-semibold">{userProfile.taxSystem || 'MICRO-BNC'}</span>
                    </p>
                    {userProfile.bankAccount && (
                      <p>
                        IBAN :{' '}
                        <span className="font-mono">
                          ···· {userProfile.bankAccount.replace(/\s/g, '').slice(-4)}
                        </span>
                      </p>
                    )}
                    <p>
                      N° facture :{' '}
                      <span className="font-mono font-semibold">
                        {userProfile.invoicePrefix || 'FAC-'}
                        {String(userProfile.invoiceStartNumber ?? 1).padStart(3, '0')}
                      </span>
                    </p>
                    {userProfile.isVatExempt && (
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Franchise TVA (art. 293 B)
                      </p>
                    )}
                  </div>
                )}
                {activeTab === 'preferences' && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg border border-brand-100 dark:border-brand-700 bg-[${userProfile.primaryColor ?? '#102a43'}]`}
                        aria-label={`Couleur primaire : ${userProfile.primaryColor ?? '#102a43'}`}
                      />
                      <p className="text-[11px] text-brand-500 font-mono">
                        {userProfile.primaryColor ?? '#102a43'}
                      </p>
                    </div>
                    <p className="text-[11px] text-brand-500">
                      Thème :{' '}
                      <span className="font-semibold capitalize">
                        {userProfile.theme || 'auto'}
                      </span>
                    </p>
                  </div>
                )}
                {activeTab === 'data' && (
                  <div className="mt-4 space-y-1 text-[11px] text-brand-500">
                    <p>
                      {allData.invoices.length} facture
                      {allData.invoices.length !== 1 ? 's' : ''}
                    </p>
                    <p>
                      {allData.clients.length} client
                      {allData.clients.length !== 1 ? 's' : ''}
                    </p>
                    <p>
                      {allData.suppliers.length} fournisseur
                      {allData.suppliers.length !== 1 ? 's' : ''}
                    </p>
                    <p>
                      {allData.products.length} produit
                      {allData.products.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                {activeTab === 'security' && (
                  <div className="mt-4 text-[11px] text-brand-500">
                    <p>
                      {userProfile.securitySettings?.isTwoFactorEnabled
                        ? '🔒 Authentification 2FA activée'
                        : '🔓 2FA non configuré'}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-6 text-[9px] text-center text-brand-400">
                <p className="font-bold uppercase">{userProfile.companyName}</p>
                {userProfile.address && <p>{userProfile.address}</p>}
                {userProfile.siret && <p className="mt-2">SIRET : {userProfile.siret}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <div className="relative">
                <button
                  onClick={handleSave}
                  className={`btn-primary w-full py-4 rounded-2xl transition-all ${
                    isDirty ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                  }`}
                >
                  {isDirty && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                  Enregistrer
                </button>
              </div>
              {isDirty && (
                <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 -mt-1">
                  Modifications non enregistrées
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isDangerous={confirmDialog.isDangerous}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default SettingsManager;
