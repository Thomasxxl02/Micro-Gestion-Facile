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
  Upload,
  Wallet,
  Zap,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
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
import { AlertDialog, ConfirmDialog } from './Dialogs';
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
  const handleChange = (
    field: keyof UserProfile,
    value: string | number | boolean | Record<string, unknown>
  ) => {
    const updatedProfile = { ...userProfile, [field]: value };
    setUserProfile(updatedProfile);
    if (onSaveProfile) {
      onSaveProfile(updatedProfile);
    }
    showSaveMessage('✓ Profil sauvegardé');
  };

  const showSaveMessage = (message: string) => {
    setAlertDialog({ isOpen: true, title: message, description: '', type: 'success' });
    setTimeout(() => {
      setAlertDialog((prev) => ({ ...prev, isOpen: false }));
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
    addLog('Export complet des données effectué', 'DATA', 'INFO');
    showSaveMessage('✓ Données exportées avec succès');
  };

  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.profile) {
        setUserProfile(data.profile);
      }
      if (data.invoices) {
        setAllData.setInvoices(data.invoices);
      }
      if (data.clients) {
        setAllData.setClients(data.clients);
      }
      if (data.suppliers) {
        setAllData.setSuppliers(data.suppliers);
      }
      if (data.products) {
        setAllData.setProducts(data.products);
      }
      if (data.expenses) {
        setAllData.setExpenses(data.expenses);
      }

      addLog('Importation de données externe réussie', 'DATA', 'INFO');
      showSaveMessage('✓ Données importées avec succès');
    } catch {
      addLog("Échec de l'importation de données", 'DATA', 'ERROR');
      setAlertDialog({
        isOpen: true,
        title: "⚠️ Erreur d'importation",
        description: 'Le fichier est invalide ou corrompu. Vérifiez le format JSON.',
        type: 'error',
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
        showSaveMessage('✓ Données de test générées');
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-brand-900 dark:text-white font-display tracking-tight">
            Paramètres
          </h2>
          <p className="text-brand-500 dark:text-brand-400 mt-1">
            Gérez votre profil, votre image de marque et vos données.
          </p>
        </div>

        {/* TAB BUTTONS */}
        <div
          role="tablist"
          aria-label="Paramètres de l'application"
          className="flex bg-brand-100/50 dark:bg-brand-900/30 p-1 rounded-2xl border border-brand-100 dark:border-brand-800 overflow-x-auto no-scrollbar"
        >
          <button
            id="tab-profile"
            aria-controls="panel-profile"
            onClick={() => setActiveTab('profile')}
            role="tab"
            aria-selected="true"
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm'
                : 'bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300'
            }`}
          >
            Profil
          </button>
          <button
            id="tab-billing"
            aria-controls="panel-billing"
            onClick={() => setActiveTab('billing')}
            role="tab"
            aria-selected="false"
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'billing'
                ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm'
                : 'bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300'
            }`}
          >
            Facturation
          </button>
          <button
            id="tab-preferences"
            aria-controls="panel-preferences"
            onClick={() => setActiveTab('preferences')}
            role="tab"
            aria-selected="false"
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm'
                : 'bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300'
            }`}
          >
            Style
          </button>
          <button
            id="tab-security"
            aria-controls="panel-security"
            onClick={() => setActiveTab('security')}
            role="tab"
            aria-selected="false"
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm'
                : 'bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300'
            }`}
          >
            Sécurité
          </button>
          <button
            id="tab-data"
            aria-controls="panel-data"
            onClick={() => setActiveTab('data')}
            role="tab"
            aria-selected="false"
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'data'
                ? 'bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm'
                : 'bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300'
            }`}
          >
            Données
          </button>
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
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div id="panel-preferences" role="tabpanel" className="space-y-8 animate-slide-up">
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
            <div id="panel-data" role="tabpanel" className="space-y-8 animate-slide-up">
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
            </div>
          )}
        </div>

        {/* PREVIEW COLUMN */}
        <div className="xl:col-span-1">
          <div className="sticky top-10">
            <div className="bg-white dark:bg-brand-900/30 p-8 rounded-4xl shadow-2xl border border-brand-100 dark:border-brand-800 min-h-125 flex flex-col relative overflow-hidden">
              <div className="border-b border-brand-100 dark:border-brand-800 pb-8 mb-8">
                <h2 className="font-bold text-brand-900 dark:text-white text-xl">
                  {userProfile.companyName || 'Votre Entreprise'}
                </h2>
                <div className="mt-4 space-y-1 text-[11px] text-brand-500">
                  <p>{userProfile.email}</p>
                  <p>{userProfile.phone}</p>
                </div>
              </div>
              <div className="mt-auto pt-6 text-[9px] text-center text-brand-400">
                <p className="font-bold uppercase">{userProfile.companyName}</p>
                <p>{userProfile.address}</p>
                <p className="mt-2">SIRET: {userProfile.siret}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={onSaveProfile ? () => onSaveProfile(userProfile) : undefined}
                className="btn-primary w-full py-4 rounded-2xl"
              >
                Enregistrer
              </button>
              <button
                onClick={generateSampleData}
                className="w-full p-4 border-2 border-dashed border-brand-200 rounded-2xl text-brand-500 font-bold text-xs"
              >
                <Zap size={16} /> Données de Test
              </button>
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

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        description={alertDialog.description}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </div>
  );
};

export default SettingsManager;
