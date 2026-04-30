/**
 * automationService.ts
 * Service gérant la logique d'automatisation (relances et factures récurrentes)
 */

import { Invoice, type RecurringInvoiceConfig, AutomationSettings } from "../types";

export const automationService = {
  /**
   * Vérifie quelles factures nécessitent une relance automatique
   */
  checkDueReminders: (invoices: Invoice[], settings: AutomationSettings): Invoice[] => {
    if (!settings.autoReminderEnabled) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return invoices.filter(invoice => {
      if (invoice.status !== "Envoyée" && invoice.status !== "Partiellement payée") return false;
      
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays === settings.autoReminderDelayDays;
    });
  },

  /**
   * Vérifie quelles factures récurrentes doivent être générées
   */
  checkRecurringGenerations: (configs: RecurringInvoiceConfig[]): RecurringInvoiceConfig[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return configs.filter(config => 
      config.isActive && config.nextGenerationDate <= todayStr
    );
  },

  /**
   * Calcule la prochaine date de génération pour une récurrence fin de mois
   */
  calculateNextMonthEnd: (currentDateStr: string): string => {
    const [year, month] = currentDateStr.split('-').map(Number);
    // On passe au mois suivant (month est 1-indexed, mais Date attend 0-indexed)
    // Pour aller au mois suivant m+1, on demande le dernier jour de m+2
    const lastDayNextMonth = new Date(year, month + 1, 0);
    
    // Format YYYY-MM-DD local
    const y = lastDayNextMonth.getFullYear();
    const m = String(lastDayNextMonth.getMonth() + 1).padStart(2, '0');
    const d = String(lastDayNextMonth.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};
