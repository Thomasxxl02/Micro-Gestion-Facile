/**
 * SettingsManager - Orchestration des paramètres
 * ✅ Architecture modulaire (tabs isolés)
 * ✅ SRP: Orchestration + état global
 *
 * À diviser en sous-composants :
 * src/components/tabs/
 *   ├── ProfileTab.tsx     (Identité, coordonnées)
 *   ├── BillingTab.tsx     (Fiscalité, documents)
 *   ├── PreferencesTab.tsx (Style, ergonomie)
 *   ├── DataTab.tsx        (Export, nettoyage)
 *   └── SecurityTab.tsx    (Sécurité — existant ✓)
 */

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseImportJSON, validateImportData } from "../lib/exportUtils";
import { useAppStore } from "../store/appStore";
import useLogStore from "../store/useLogStore";
import useUIStore from "../store/useUIStore";
import type {
  Client,
  Expense,
  Invoice,
  Product,
  Supplier,
  UserProfile,
} from "../types";
import { ConfirmDialog } from "./Dialogs";
import ExportModal from "./ExportModal";
import SecurityTab from "./SecurityTab";
import { BillingTab } from "./tabs/BillingTab";
import { DataTab } from "./tabs/DataTab";
import { PreferencesTab } from "./tabs/PreferencesTab";
import { ProfileTab } from "./tabs/ProfileTab";

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

const SETTINGS_TABS = [
  "profile",
  "billing",
  "preferences",
  "security",
  "data",
] as const;

/**
 * SettingsManager - Orchestration principale
 * Responsabilités :
 * - Navigation entre les onglets (keyboard + mouse)
 * - Gestion d'état global (validation, dirty state)
 * - Dispatch des handlers aux onglets
 * - Affichage du panneau preview (sidebar sticky)
 */
const SettingsManager: React.FC<SettingsManagerProps> = ({
  userProfile,
  setUserProfile,
  onSaveProfile,
  allData,
  setAllData,
   
}) => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "billing" | "data" | "preferences" | "security"
  >("profile");

  const { addLog, fontSize, setFontSize } = useAppStore();
  const user = useAppStore((s) => s.user);
  const {
    reducedMotion,
    setReducedMotion,
    soundEnabled,
    setSoundEnabled,
    highVisibility,
    setHighVisibility,
    offlinePriority,
    setOfflinePriority,
  } = useUIStore();
  const { activityLogs } = useLogStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now() - 120000);
  const [isDirty, setIsDirty] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(
    localStorage.getItem("mgf_last_backup_date"),
  );

  const [validationErrors, setValidationErrors] = useState<{
    siret?: string;
    bankAccount?: string;
    email?: string;
  }>({});

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDangerous?: boolean;
    onConfirm?: () => void;
  }>({ isOpen: false, title: "", description: "" });

  // Synchroniser les variables CSS pour personnalisation
  useEffect(() => {
    const root = document.documentElement;
    if (userProfile.uiDensity) {
      root.setAttribute("data-density", userProfile.uiDensity);
    }
    if (userProfile.borderRadius !== undefined) {
      root.style.setProperty(
        "--app-border-radius",
        `${userProfile.borderRadius}px`,
      );
    }
    root.setAttribute(
      "data-zen-mode",
      userProfile.isZenMode ? "true" : "false",
    );
  }, [userProfile.uiDensity, userProfile.borderRadius, userProfile.isZenMode]);

  // Appliquer le thème
  useEffect(() => {
    const theme = userProfile.theme ?? "auto";
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [userProfile.theme]);

  // ─── HANDLERS ───
  const handleChange = (
    field: keyof UserProfile,
    value: string | number | boolean | string[] | Record<string, unknown>,
  ) => {
    const updatedProfile = { ...userProfile, [field]: value };
    setUserProfile(updatedProfile);
    setIsDirty(true);

    // Validation
    if (field === "siret") {
      setValidationErrors((prev) => ({
        ...prev,
        siret: validateSIRET(value as string),
      }));
    } else if (field === "bankAccount") {
      setValidationErrors((prev) => ({
        ...prev,
        bankAccount: validateIBAN(value as string),
      }));
    } else if (field === "email") {
      setValidationErrors((prev) => ({
        ...prev,
        email: validateEmail(value as string),
      }));
    }
  };

  const validateSIRET = (value: string): string | undefined => {
    if (!value) return undefined;
    const digits = value.replace(/[\s-]/g, "");
    if (!/^\d{14}$/.test(digits)) {
      return "Le SIRET doit contenir exactement 14 chiffres";
    }
    // Algorithme de Luhn adapté au SIRET (norme INSEE)
    // Chaque chiffre en position paire (depuis la droite) est doublé ;
    // si le résultat > 9, on soustrait 9. La somme totale doit être divisible par 10.
    let sum = 0;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits[i], 10);
      if ((digits.length - 1 - i) % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    if (sum % 10 !== 0) {
      return "Numéro SIRET invalide (clé de contrôle incorrecte)";
    }
    return undefined;
  };

  const validateIBAN = (value: string): string | undefined => {
    if (!value) return undefined;
    const normalized = value.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(normalized)) {
      return "Format IBAN invalide (ex : FR76 3000 6000 0112 3456 7890 189)";
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    if (!value) return undefined;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Adresse email invalide";
    }
    return undefined;
  };

  const handleSave = () => {
    if (onSaveProfile) {
      onSaveProfile(userProfile);
    }
    toast.success("Profil sauvegardé");
    setIsDirty(false);
  };

  const handleForceSync = async () => {
    if (!user) {
      toast.info("Synchronisation Cloud non disponible", {
        description:
          "Connectez-vous à un compte pour synchroniser vos données dans le cloud.",
      });
      return;
    }
    setIsSyncing(true);
    try {
      const { doc: firestoreDoc, getDocFromServer } =
        await import("firebase/firestore");
      const { db: firestoreDb } = await import("../firebase");
      await getDocFromServer(
        firestoreDoc(firestoreDb, `users/${user.uid}/profile/main`),
      );
      setLastSyncTime(Date.now());
      toast.success("Synchronisation Cloud terminée");
    } catch (err) {
      toast.error("Erreur de synchronisation", {
        description:
          err instanceof Error ? err.message : "Vérifiez votre connexion.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const raw = await parseImportJSON(file);
      if (!raw || Object.keys(raw).length === 0) {
        addLog("Échec de l'importation de données", "DATA", "ERROR");
        toast.error("Erreur d'importation", {
          description: "Fichier invalide ou vide",
        });
        return;
      }

      // ── Validation de version / schéma (#10) ──────────────────────────────
      const validation = validateImportData(raw);
      if (!validation.isValid) {
        addLog("Échec de l'importation : format non reconnu", "DATA", "ERROR");
        toast.error("Format non reconnu", {
          description: validation.warnings.join(" "),
        });
        return;
      }
      if (validation.warnings.length > 0) {
        // Avertissement non bloquant (version ancienne, champ version absent…)
        toast.warning("Avertissement à l'import", {
          description: validation.warnings.join(" "),
        });
      }

      // ── Import des données — geminiApiKey jamais restaurée (#15) ──────────
      if (raw.userProfile) {
        const { geminiApiKey: _stripped, ...safeProfile } = raw.userProfile;
        setUserProfile(safeProfile as UserProfile);
      }
      if (raw.invoices) setAllData.setInvoices(raw.invoices as Invoice[]);
      if (raw.clients) setAllData.setClients(raw.clients as Client[]);
      if (raw.suppliers) setAllData.setSuppliers(raw.suppliers as Supplier[]);
      if (raw.products) setAllData.setProducts(raw.products as Product[]);
      if (raw.expenses) setAllData.setExpenses(raw.expenses as Expense[]);

      addLog("Importation de données externe réussie", "DATA", "INFO");
      toast.success("Données importées avec succès");
    } catch {
      addLog("Échec de l'importation de données", "DATA", "ERROR");
      toast.error("Erreur d'importation", {
        description: "Le fichier est invalide ou corrompu.",
      });
    }
  };

  const handlePreviewPDF = async () => {
    const sampleInvoice: Invoice = {
      id: "test-preview",
      number: "TEST-" + new Date().getFullYear() + "-0001",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      type: "invoice",
      status: "draft",
      items: [
        {
          id: "item-1",
          description: "Prestation de service (Exemple)",
          quantity: 1,
          unitPrice: 1500,
        },
      ],
      total: 1500,
      subtotal: 1500,
      vatAmount: 0,
      clientId: "client-test",
    };
    const sampleClient: Client = {
      id: "client-test",
      name: "Client Démo SARL",
      address: "123 Avenue du Test, 75000 Paris",
      email: "contact@client-demo.fr",
    };
    try {
      const { generatePDFWithFacturX } = await import("../lib/facturX");
      const doc = await generatePDFWithFacturX(
        sampleInvoice,
        sampleClient,
        userProfile,
      );
      const pdfUrl = doc.output("bloburl");
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération de l'aperçu");
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = SETTINGS_TABS.indexOf(
      activeTab as (typeof SETTINGS_TABS)[number],
    );
    const next = (() => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          return (idx + 1) % SETTINGS_TABS.length;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          return (idx - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length;
        case "Home":
          e.preventDefault();
          return 0;
        case "End":
          e.preventDefault();
          return SETTINGS_TABS.length - 1;
        default:
          return null;
      }
    })();
    if (next === null) return;
    setActiveTab(SETTINGS_TABS[next]);
    const buttons =
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons[next]?.focus();
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
          {(
            [
              { id: "profile", label: "🏢 Profil" },
              { id: "billing", label: "💳 Facturation" },
              { id: "preferences", label: "🎨 Style" },
              { id: "security", label: "🔐 Sécurité" },
              { id: "data", label: "💾 Données" },
            ] as { id: typeof activeTab; label: string }[]
          ).map(({ id: tabId, label }) => {
            const isTabSelected = activeTab === tabId;
            return (
              <button
                key={tabId}
                id={`tab-${tabId}`}
                aria-controls={`panel-${tabId}`}
                onClick={() => setActiveTab(tabId)}
                role="tab"
                aria-selected={isTabSelected}
                tabIndex={isTabSelected ? 0 : -1}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  isTabSelected
                    ? "bg-white dark:bg-brand-800 text-brand-900 dark:text-white shadow-sm"
                    : "bg-transparent text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* MAIN CONTENT */}
        <div className="xl:col-span-2 space-y-8">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <ProfileTab
              userProfile={userProfile}
              handleChange={handleChange}
              validationErrors={validationErrors}
            />
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <BillingTab
              userProfile={userProfile}
              handleChange={handleChange}
              validationErrors={validationErrors}
            />
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <PreferencesTab
              userProfile={userProfile}
              handleChange={handleChange}
              onPreviewPDF={handlePreviewPDF}
              uiState={{
                fontSize,
                setFontSize,
                reducedMotion,
                setReducedMotion,
                soundEnabled,
                setSoundEnabled,
                highVisibility,
                setHighVisibility,
                offlinePriority,
                setOfflinePriority,
              }}
            />
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <SecurityTab
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              onSaveProfile={onSaveProfile}
            />
          )}

          {/* DATA TAB */}
          {activeTab === "data" && (
            <DataTab
              userProfile={userProfile}
              allData={allData}
              setAllData={setAllData}
              onExport={() => setIsExportModalOpen(true)}
              onImport={handleImportFile}
              onGenerateSampleData={(callback) => {
                setConfirmDialog({
                  isOpen: true,
                  title: "Générer des données de test ?",
                  description:
                    "Cela ajoutera des clients, produits et factures fictives.",
                  onConfirm: callback,
                });
              }}
              onResetData={(callback) => {
                setConfirmDialog({
                  isOpen: true,
                  title: "Réinitialiser toutes les données ?",
                  description:
                    "Cette action est irréversible. Toutes vos données seront supprimées.",
                  isDangerous: true,
                  onConfirm: callback,
                });
              }}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
              onForceSync={handleForceSync}
              isFirebaseConnected={user !== null}
              connectedEmail={user?.email ?? null}
              lastBackupDate={lastBackupDate}
              activityLogs={activityLogs}
            />
          )}
        </div>

        {/* PREVIEW COLUMN (SIDEBAR) */}
        <div className="xl:col-span-1">
          <div className="sticky top-10">
            <div
              style={
                {
                  "--preview-primary": userProfile.primaryColor ?? "#102a43",
                  "--preview-secondary":
                    userProfile.secondaryColor ?? "#059669",
                } as React.CSSProperties
              }
              className="bg-white dark:bg-brand-900/30 p-8 rounded-4xl shadow-2xl border-t-4 border-t-(--preview-primary) min-h-125 flex flex-col relative overflow-hidden"
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base mb-3 bg-(--preview-primary)"
                    aria-hidden="true"
                  >
                    {(userProfile.companyName ?? "E").charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="font-bold text-brand-900 dark:text-white text-xl">
                  {userProfile.companyName ?? "Votre Entreprise"}
                </h2>

                {/* Contexte selon onglet */}
                {activeTab === "profile" && (
                  <div className="mt-4 space-y-1 text-[11px] text-brand-500">
                    {userProfile.email && <p>{userProfile.email}</p>}
                    {userProfile.phone && <p>{userProfile.phone}</p>}
                    {userProfile.address && (
                      <p className="line-clamp-2">{userProfile.address}</p>
                    )}
                  </div>
                )}
                {activeTab === "billing" && (
                  <div className="mt-4 space-y-1.5 text-[11px] text-brand-500">
                    <p>
                      Régime :{" "}
                      <span className="font-semibold">
                        {userProfile.taxSystem ?? "MICRO-BNC"}
                      </span>
                    </p>
                    {userProfile.bankAccount && (
                      <p>
                        IBAN :{" "}
                        <span className="font-mono">
                          ····{" "}
                          {(userProfile.bankAccount ?? "")
                            .replace(/\s/g, "")
                            .slice(-4)}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                {activeTab === "data" && (
                  <div className="mt-4 space-y-1 text-[11px] text-brand-500">
                    <p>
                      {allData.invoices.length} facture
                      {allData.invoices.length !== 1 ? "s" : ""}
                    </p>
                    <p>
                      {allData.clients.length} client
                      {allData.clients.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-6 text-[9px] text-center text-brand-400">
                <p className="font-bold uppercase">{userProfile.companyName}</p>
                {userProfile.siret && (
                  <p className="mt-2">SIRET : {userProfile.siret}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <button
                onClick={handleSave}
                className={`btn-primary w-full py-4 rounded-2xl transition-all ${
                  isDirty ? "ring-2 ring-amber-400 ring-offset-2" : ""
                }`}
              >
                {isDirty && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" />
                )}
                Enregistrer
              </button>
              {isDirty && (
                <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 -mt-1">
                  Modifications non enregistrées
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportSuccess={() => {
          const d = localStorage.getItem("mgf_last_backup_date");
          setLastBackupDate(d);
        }}
        data={{
          version: "1.0",
          exportedAt: new Date().toISOString(),
          // geminiApiKey exclue de l'export (#15 — clé sensible jamais persistée)
          userProfile: (({ geminiApiKey: _k, ...safe }) => safe)(
            userProfile,
          ) as UserProfile,
          invoices: allData.invoices,
          clients: allData.clients,
          suppliers: allData.suppliers,
          products: allData.products,
          expenses: allData.expenses,
          emails: [],
          emailTemplates: [],
          calendarEvents: [],
        }}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isDangerous={confirmDialog.isDangerous}
        onConfirm={confirmDialog.onConfirm ?? (() => {})}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default SettingsManager;
