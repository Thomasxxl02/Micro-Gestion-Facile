/**
 * AutomationManager.tsx
 * Interface de gestion des automatisations (Relances et Récurrences)
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Zap, 
  RotateCw, 
  Plus,
  Trash2,
  Mail,
  Clock,
  AlertCircle
} from "lucide-react";
import { useDataStore } from "../store/useDataStore";

const AutomationManager: React.FC = () => {
  const { 
    automationSettings, 
    setAutomationSettings, 
    automationLogs,
    invoices: _invoices,
    clients: _clients
  } = useDataStore();
  
  const [activeTab, setActiveTab] = useState<"reminders" | "recurring" | "logs">("reminders");

  const toggleAutoReminders = () => {
    setAutomationSettings({
      ...automationSettings,
      autoReminderEnabled: !automationSettings.autoReminderEnabled
    });
  };

  const updateDelay = (delay: number) => {
    setAutomationSettings({
      ...automationSettings,
      autoReminderDelayDays: delay
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
            <Zap className="text-brand-500" />
            Automatisation
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Gagnez du temps en automatisant vos tâches récurrentes et vos relances.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab("reminders")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === "reminders" 
              ? "border-brand-500 text-brand-600 dark:text-brand-400" 
              : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          Relances Automatiques
        </button>
        <button
          onClick={() => setActiveTab("recurring")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === "recurring" 
              ? "border-brand-500 text-brand-600 dark:text-brand-400" 
              : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          Générations Récurrentes
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === "logs" 
              ? "border-brand-500 text-brand-600 dark:text-brand-400" 
              : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          Historique
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "reminders" && (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${automationSettings.autoReminderEnabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'}`}>
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Emails de relance automatique</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Envoie automatiquement un email aux clients dont la facture est en retard.
                  </p>
                </div>
              </div>
              <button 
                onClick={toggleAutoReminders}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${automationSettings.autoReminderEnabled ? 'bg-brand-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${automationSettings.autoReminderEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {automationSettings.autoReminderEnabled && (
              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Déclenchement (jours après l'échéance)
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      value={automationSettings.autoReminderDelayDays}
                      onChange={(e) => updateDelay(parseInt(e.target.value) || 0)}
                      className="w-20 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-brand-500 text-center font-bold"
                      min="1"
                      max="30"
                    />
                    <span className="text-neutral-600 dark:text-neutral-400">jours après la date d'échéance</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex gap-3 text-blue-800 dark:text-blue-300 text-sm">
                    <Clock className="shrink-0" size={18} />
                    <p>
                      Les factures seront vérifiées quotidiennement à 09:00. Un email sera envoyé via votre service de messagerie configuré.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Aperçu du comportement
                  </label>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 mt-2 rounded-full bg-brand-500" />
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Si Facture #123 arrive à échéance le 01/05/2026, l'email sera envoyé le {new Date(new Date("2026-05-01").getTime() + automationSettings.autoReminderDelayDays * 24 * 60 * 60 * 1000).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "recurring" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <RotateCw className="text-brand-500" />
                  <h3 className="text-xl font-bold">Générations Récurrentes</h3>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-2xl hover:bg-brand-500 transition-all font-medium text-sm">
                  <Plus size={18} />
                  Nouvelle configuration
                </button>
              </div>

              {automationSettings.recurringInvoices.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="inline-flex p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                    <RotateCw size={32} />
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Aucune configuration récurrente trouvée. Paramétrez ici vos factures d'abonnements ou de maintenance.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 dark:border-neutral-800">
                        <th className="py-4 px-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Libellé</th>
                        <th className="py-4 px-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Fréquence</th>
                        <th className="py-4 px-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Prochaine génération</th>
                        <th className="py-4 px-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Statut</th>
                        <th className="py-4 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {automationSettings.recurringInvoices.map((config) => (
                        <tr key={config.id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                          <td className="py-4 px-2 font-medium">{config.label}</td>
                          <td className="py-4 px-2 text-sm text-neutral-500">
                            {config.frequency === "MONTHLY_END" ? "Chaque fin de mois" : config.frequency}
                          </td>
                          <td className="py-4 px-2 text-sm">
                            {new Date(config.nextGenerationDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-2 text-sm">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${config.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                              {config.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <button className="p-2 text-neutral-400 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-200 dark:border-amber-800/50 flex gap-4">
              <AlertCircle className="text-amber-600 shrink-0" size={24} />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 dark:text-amber-200">Comment ça marche ?</h4>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  La génération récurrente crée une copie d'une facture existante (votre modèle) à chaque période. 
                  Vous recevez une notification une fois le document créé en mode "Brouillon" pour vérification finale.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="text-neutral-400" />
              Journal d'activité robotique
            </h3>
            
            {automationLogs.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                L'historique est vide pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {automationLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                    <div className={`p-2 rounded-xl h-fit ${log.status === 'SUCCESS' ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {log.type === 'REMINDER' ? <Mail size={16} /> : <RotateCw size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm">{log.description}</p>
                        <span className="text-xs text-neutral-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Cible : {log.targetId}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AutomationManager;
