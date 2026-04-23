/**
 * DataTab - Gestion des données, export/import, synchronisation
 * ✅ RGPD Art.20 (Portabilité)
 * ✅ Nettoyage & gouvernance des données
 */

import {
  Archive,
  ArrowRight,
  Cloud,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  Upload,
  User,
  Zap,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import type {
  Client,
  Expense,
  Invoice,
  Product,
  Supplier,
  UserProfile,
} from "../../types";

interface DataTabProps {
  userProfile: UserProfile;
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
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  onGenerateSampleData: (callback: () => void) => void;
  onResetData: (callback: () => void) => void;
  isSyncing: boolean;
  lastSyncTime: number;
  onForceSync: () => Promise<void>;
  activityLogs: Array<{
    id: string;
    action: string;
    category: string;
    timestamp: number;
  }>;
}

/**
 * DataTab - Onglet Données & Exports
 * Responsabilités :
 * - Résumé des données (nombre de factures, clients, etc.)
 * - Export/Import RGPD (format JSON)
 * - Nettoyage des données (doublons, produits inutilisés)
 * - Synchronisation Cloud
 */
export const DataTab: React.FC<DataTabProps> = ({
  userProfile,
  allData,
  setAllData,
  onExport,
  onImport,
  onGenerateSampleData,
  onResetData,
  isSyncing,
  lastSyncTime,
  onForceSync,
  activityLogs,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onImport(file);
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Erreur d'importation");
      }
    }
  };

  const handleCleanData = (type: "clients" | "products") => {
    if (type === "clients") {
      const namesMap = new Map<string, Client>();
      const toKeep: Client[] = [];
      const duplicatesCount = { total: 0 };

      allData.clients.forEach((client) => {
        const normalized = client.name.trim().toLowerCase();
        if (namesMap.has(normalized)) {
          duplicatesCount.total++;
        } else {
          namesMap.set(normalized, client);
          toKeep.push(client);
        }
      });

      if (duplicatesCount.total === 0) {
        toast.info("Aucun client en doublon détecté.");
        return;
      }

      setAllData.setClients(toKeep);
      toast.success(`${duplicatesCount.total} clients fusionnés`);
    } else if (type === "products") {
      const usedProductIds = new Set<string>();
      allData.invoices.forEach((inv) => {
        inv.items.forEach((item) => {
          if (item.id) {
            usedProductIds.add(item.id);
          }
        });
      });

      const unusedProducts = allData.products.filter(
        (p) => !usedProductIds.has(p.id),
      );

      if (unusedProducts.length === 0) {
        toast.info("Tous vos produits sont actuellement utilisés.");
        return;
      }

      const keptProducts = allData.products.filter((p) =>
        usedProductIds.has(p.id),
      );
      setAllData.setProducts(keptProducts);
      toast.success(`${unusedProducts.length} produits supprimés`);
    }
  };

  const cleanOldData = (type: "10years" | "drafts") => {
    const now = new Date();
    if (type === "10years") {
      const tenYearsAgo = new Date(now.setFullYear(now.getFullYear() - 10));
      const oldInvoices = allData.invoices.filter(
        (inv) => new Date(inv.date) < tenYearsAgo,
      );
      if (oldInvoices.length === 0) {
        toast.info("Aucune donnée de plus de 10 ans trouvée.");
        return;
      }

      const remaining = allData.invoices.filter(
        (inv) => new Date(inv.date) >= tenYearsAgo,
      );
      setAllData.setInvoices(remaining);
      toast.success(`${oldInvoices.length} factures archivées.`);
    } else {
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
      const oldDrafts = allData.invoices.filter(
        (inv) => inv.status === "draft" && new Date(inv.date) < sixMonthsAgo,
      );
      if (oldDrafts.length === 0) {
        toast.info("Aucun brouillon de plus de 6 mois trouvé.");
        return;
      }

      const remaining = allData.invoices.filter(
        (inv) => !(inv.status === "draft" && new Date(inv.date) < sixMonthsAgo),
      );
      setAllData.setInvoices(remaining);
      toast.success(`${oldDrafts.length} brouillons supprimés.`);
    }
  };

  const dataLogs = activityLogs.filter(
    (log) =>
      (log.category as string) === "SYSTEM" ||
      (log.category as string) === "DATA",
  );

  return (
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
              { label: "Factures", count: allData.invoices.length },
              { label: "Clients", count: allData.clients.length },
              { label: "Fournisseurs", count: allData.suppliers.length },
              { label: "Produits", count: allData.products.length },
              { label: "Dépenses", count: allData.expenses.length },
            ] as { label: string; count: number }[]
          ).map(({ label, count }) => (
            <div
              key={label}
              className="p-4 bg-brand-50/50 dark:bg-brand-800/30 rounded-2xl text-center"
            >
              <p className="text-2xl font-bold text-brand-900 dark:text-white">
                {count}
              </p>
              <p className="text-[10px] uppercase font-bold text-brand-400 mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Export / Import Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={onExport}
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
          onChange={(e) => {
            void handleImportAll(e);
          }}
          aria-label="Sélectionner un fichier de sauvegarde JSON"
        />
      </div>

      {/* Sample Data & Reset */}
      <div className="pt-4 border-t border-brand-100 dark:border-brand-800 space-y-3">
        <button
          onClick={() =>
            onGenerateSampleData(() => {
              setAllData.setClients([
                ...allData.clients,
                {
                  id: "c1",
                  name: "Acme Corp",
                  email: "contact@acme.com",
                  address: "10 Rue de la Paix, Paris",
                  category: "Entreprise",
                },
              ]);
            })
          }
          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-brand-200 dark:border-brand-700 rounded-2xl text-brand-500 dark:text-brand-400 font-bold text-xs hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-200 transition-colors"
        >
          <Zap size={16} /> Données de Test
        </button>
        <p className="text-[11px] text-brand-400 text-center">
          Ajoute des clients, produits et factures fictives.
        </p>
        <button
          onClick={() => onResetData(() => {})}
          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-red-200 dark:border-red-900/50 rounded-2xl text-red-500 dark:text-red-400 font-bold text-xs hover:border-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={16} /> Réinitialiser toutes les données
        </button>
        <p className="text-[11px] text-brand-400 text-center">
          Supprime définitivement toutes les données.
        </p>
      </div>

      {/* Cloud Synchronization */}
      <div className="bg-linear-to-br from-brand-50 to-white dark:from-brand-900/40 dark:to-brand-800/20 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-xl">
              <Cloud size={20} />
            </div>
            <h3 className="text-sm font-bold text-brand-900 dark:text-white font-display uppercase tracking-widest">
              Synchronisation Cloud
            </h3>
          </div>
          <div className="flex items-center gap-2 group">
            <div
              className={`w-2 h-2 rounded-full ${
                isSyncing
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              }`}
            />
            <span className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-tighter">
              {isSyncing ? "Synchro..." : "Connecté"}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white/50 dark:bg-black/20 rounded-3xl border border-brand-100/50 dark:border-brand-700/50">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] text-brand-400 font-bold uppercase mb-1">
              Dernière synchronisation
            </p>
            <p className="text-sm font-bold text-brand-900 dark:text-white">
              Il y a {Math.floor((Date.now() - lastSyncTime) / 60000)} minutes
            </p>
          </div>
          <button
            onClick={() => {
              void onForceSync();
            }}
            disabled={isSyncing}
            className="flex items-center gap-2 px-6 py-3 bg-brand-900 hover:bg-brand-800 dark:bg-white dark:text-brand-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            Forcer la synchro
          </button>
        </div>
      </div>

      {/* Data Governance */}
      <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-3 mb-6 border-b border-brand-50 dark:border-brand-800 pb-4">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Archive size={20} />
          </div>
          <h3 className="text-sm font-bold text-brand-900 dark:text-white font-display uppercase tracking-widest">
            Gouvernance des données
          </h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => cleanOldData("10years")}
              className="p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all text-left"
            >
              <p className="text-xs font-bold text-brand-900 dark:text-white">
                Archiver (10 ans+)
              </p>
              <p className="text-[9px] text-brand-400 mt-1 uppercase tracking-tighter">
                Conformité RGPD / Fiscale
              </p>
            </button>
            <button
              onClick={() => cleanOldData("drafts")}
              className="p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all text-left"
            >
              <p className="text-xs font-bold text-brand-900 dark:text-white">
                Nettoyer Brouillons
              </p>
              <p className="text-[9px] text-brand-400 mt-1 uppercase tracking-tighter">
                Inutilisés depuis 6 mois
              </p>
            </button>
          </div>

          <div className="pt-4 mt-2 space-y-3">
            <button
              onClick={() => {
                handleCleanData("clients");
              }}
              className="w-full flex items-center justify-between p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all group"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-brand-900 dark:text-white">
                  Clients en doublon
                </p>
                <p className="text-[10px] text-brand-400 mt-0.5">
                  Fusionner par nom identique
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-brand-300 group-hover:translate-x-1 transition-transform"
              />
            </button>
            <button
              onClick={() => {
                handleCleanData("products");
              }}
              className="w-full flex items-center justify-between p-4 bg-brand-50/50 dark:bg-brand-800/30 border border-brand-100 dark:border-brand-700 rounded-2xl hover:bg-brand-100 transition-all group"
            >
              <div className="text-left">
                <p className="text-sm font-bold text-brand-900 dark:text-white">
                  Produits inutilisés
                </p>
                <p className="text-[10px] text-brand-400 mt-0.5">
                  Supprimer les produits jamais facturés
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-brand-300 group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      {dataLogs.length > 0 && (
        <div className="bg-white dark:bg-brand-900/50 rounded-4xl p-8 shadow-sm border border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-3 mb-6 border-b border-brand-50 dark:border-brand-800 pb-4">
            <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-300 rounded-xl">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-brand-900 dark:text-white font-display">
              Dernières activités (Données)
            </h3>
          </div>
          <div className="space-y-3">
            {dataLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 p-3 bg-brand-50/30 dark:bg-brand-800/20 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-brand-800 flex items-center justify-center text-brand-400">
                  {log.action.includes("Export") ? (
                    <Download size={14} />
                  ) : (
                    <Upload size={14} />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-brand-700 dark:text-brand-300 truncate">
                    {log.action}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-brand-400">
                      {new Date(log.timestamp).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[9px] text-brand-300">•</span>
                    <span className="text-[9px] text-brand-400 flex items-center gap-1">
                      <User size={8} />{" "}
                      {userProfile.companyName ?? "Utilisateur"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTab;
