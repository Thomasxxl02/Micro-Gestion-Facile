/**
 * automation.ts
 * Types pour le module d'automatisation (Relances et Récurrence)
 */

export interface AutomationSettings {
  // Relances automatiques
  autoReminderEnabled: boolean;
  autoReminderDelayDays: number; // Défaut: 5 jours
  autoReminderTemplateId?: string;

  // Génération récurrente
  recurringInvoices: RecurringInvoiceConfig[];
}

export type RecurrenceFrequency = "MONTHLY_END"; // Pour commencer, on supporte la fin de mois

export interface RecurringInvoiceConfig {
  id: string;
  label: string; // Ex: "Abonnement Maintenance", "Loyer Bureau"
  clientId: string;
  templateInvoiceId: string; // ID de la facture servant de modèle
  frequency: RecurrenceFrequency;
  nextGenerationDate: string; // ISO date
  isActive: boolean;
  lastGeneratedDate?: string;
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  type: "REMINDER" | "RECURRING_GEN";
  status: "SUCCESS" | "FAILURE";
  description: string;
  targetId: string; // Invoice ID ou Recurring Config ID
  metadata?: Record<string, any>;
}
