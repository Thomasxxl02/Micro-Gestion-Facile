export type ActivityType = "SERVICE_BNC" | "SERVICE_BIC" | "SALE" | "LIBERAL";

export type Theme = "light" | "dark" | "system";

export interface UserPreferences {
  theme: Theme;
  language: "fr" | "en";
  dateFormat: string;
  currencySymbol: string;
  currencyPosition: "before" | "after";
  roundingMode: "none" | "up" | "down" | "nearest";
  autoSave: boolean;
  notificationsEnabled: boolean;
  defaultDueDateDays: number;
  emailSignature?: string;
  invoiceEmailSubject?: string;
  invoiceEmailTemplate?: string;
  reminderEmailSubject?: string;
  reminderEmailTemplate?: string;
  quoteEmailSubject?: string;
  quoteEmailTemplate?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

export type ViewState =
  | "dashboard"
  | "invoices"
  | "clients"
  | "suppliers"
  | "products"
  | "accounting"
  | "emails"
  | "calendar"
  | "settings"
  | "ai_assistant"
  | "bank_reconciliation"
  | "vat_dashboard"
  | "automation";
