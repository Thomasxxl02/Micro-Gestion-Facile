import type { SecuritySettings } from "./src/types/user";

export type DocumentType = "invoice" | "quote" | "order" | "credit_note";

export enum InvoiceStatus {
  DRAFT = "Brouillon",
  SENT = "Envoyée",
  PAID = "Payée",
  CANCELLED = "Annulée",
  // Status spécifiques aux devis
  ACCEPTED = "Accepté",
  REJECTED = "Refusé",
  // Status spécifiques à la facturation électronique 2026
  DEPOSITED = "Déposée",
  REJECTED_BY_PLATFORM = "Rejetée par plateforme",
  ACCEPTED_BY_CLIENT = "Acceptée par client",
  PENDING_PAYMENT = "En attente de paiement",
}

export type EInvoiceFormat = "Factur-X" | "UBL" | "CII";

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  siret?: string;
  siren?: string; // 9 premiers chiffres du SIRET
  phone?: string;
  notes?: string;
  archived?: boolean;
  contactName?: string;
  website?: string;
  tvaNumber?: string;
  paymentTerms?: string;
  category?: "Particulier" | "Entreprise" | "Association" | "Public";
  isPublicEntity?: boolean; // Pour Chorus Pro
  createdAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  siret?: string;
  siren?: string;
  address?: string;
  category?: string; // ex: "Matériel", "Logiciel", "Assurance"
  notes?: string; // Nouveau champ pour notes internes
  contactName?: string;
  website?: string;
  tvaNumber?: string;
  paymentTerms?: string;
  archived?: boolean;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "service" | "product";
  category?: string;
  sku?: string;
  unit?: string; // ex: "heure", "jour", "unité", "km"
  stock?: number;
  minStock?: number;
  archived?: boolean;
  createdAt?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number; // Montant TTC
  vatAmount?: number;
  vatRate?: number;
  category: string;
  supplierId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  vatRate?: number; // Taux de TVA par article
}

export interface Invoice {
  id: string;
  type: DocumentType;
  number: string;
  linkedDocumentId?: string; // ID du document parent (ex: Facture pour un Avoir)
  date: string;
  dueDate: string;
  clientId: string;
  items: InvoiceItem[];
  status: string; // Changé de InvoiceStatus à string pour permettre la personnalisation
  notes?: string;
  total: number;
  reminderDate?: string; // Nouveau champ pour les rappels

  // Nouveaux champs logiques métiers
  discount?: number; // Pourcentage de remise globale (0-100)
  shipping?: number; // Frais de port / déplacement
  deposit?: number; // Montant de l'acompte déjà versé ou demandé
  vatAmount?: number; // Montant total de la TVA
  taxExempt?: boolean; // Si exonéré de TVA (Franchise en base)

  // Facturation électronique 2026
  eInvoiceFormat?: EInvoiceFormat;
  eInvoiceStatus?: string;
  transmissionDate?: string;
  operationCategory?: "BIENS" | "SERVICES" | "MIXTE";
  deliveryAddress?: string;
}

export type ActivityType = "SERVICE_BNC" | "SERVICE_BIC" | "SALE" | "LIBERAL";

export interface UserProfile {
  companyName: string;
  professionalTitle?: string;
  siret: string;
  siren?: string;
  defaultEInvoiceFormat?: EInvoiceFormat;
  defaultOperationCategory?: "BIENS" | "SERVICES" | "MIXTE";
  address: string;
  email: string;
  phone: string;
  website?: string;
  linkedin?: string;
  bankAccount?: string;
  bic?: string;
  tvaNumber?: string;
  legalMentions?: string;
  currency?: string;
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  quotePrefix?: string;
  orderPrefix?: string;
  creditNotePrefix?: string;
  defaultVatRate?: number;
  logoColor?: string;
  activityType?: ActivityType;
  isAcreBeneficiary?: boolean;
  /** Date de début d'activité (ISO 8601 : YYYY-MM-DD). Sert à calculer l'expiration de l'ACRE (12 mois). */
  businessStartDate?: string;
  vatThresholdAlert?: boolean;
  customVatThresholdPercentage?: number;
  revenueThresholdAlert?: boolean;
  customRevenueThresholdPercentage?: number;
  isVatExempt?: boolean;
  vatExemptionReason?: string;
  taxDeclarationPeriod?: "MONTHLY" | "QUARTERLY";
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  taxSystem?: string;
  vatNumber?: string;
  primaryColor?: string;
  secondaryColor?: string;
  paymentTermsDefault?:
    | "A_RECEPTION"
    | "30_DAYS"
    | "30_EOM"
    | "45_DAYS"
    | "45_EOM"
    | "60_DAYS"
    | "60_EOM";
  latePenaltyRate?: string;
  recoveryIndemnityAmount?: number;
  numberingFormat?: string;
  resetNumberingYearly?: boolean;
  isMixedActivity?: boolean;
  activityTypeSecondary?: ActivityType;
  hasTaxVersantLiberatoire?: boolean;
  socialContributionRate?: number;
  geminiApiKey?: string;

  // Paramètres de facturation avancés (Conformité 2026)
  forcedDraftMode?: boolean; // Bloquer la numérotation automatique tant que non validé
  roundingMode?: "LINE" | "TOTAL"; // Arrondi par ligne ou sur le total (Factur-X)
  smartVatDetection?: boolean; // Détection auto de la TVA selon le client

  // Branding & Documents
  fontFamily?: "sans" | "serif" | "mono" | "slab";
  invoiceTemplate?: "modern" | "classic" | "minimal" | "corporate";
  hiddenInvoiceColumns?: string[]; // Liste des colonnes à masquer (ex: "unit", "vat")

  // Sécurité & Conformité
  auditLogEnabled?: boolean;
  sessionTimeout?: number; // Minutes d'inactivité avant verrouillage
  pinCode?: string; // Code PIN haché
  biometricEnabled?: boolean;

  theme?: "light" | "dark" | "auto";
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat?: "24h" | "12h";
  uiDensity?: "compact" | "normal" | "spacious";
  fontSize?: "small" | "normal" | "large";
  enableNotifications?: boolean;
  enableEmailNotifications?: boolean;
  notificationTypes?: {
    invoiceReminders?: boolean;
    paymentReminders?: boolean;
    expenseAlerts?: boolean;
    systemUpdates?: boolean;
  };
  automation?: {
    defaultPaymentDelay?:
      | "RECEIPT"
      | "30_DAYS"
      | "45_DAYS"
      | "60_DAYS"
      | "CUSTOM";
    customPaymentDelayDays?: number;
    autoReminders?: {
      enabled: boolean;
      after3Days: boolean;
      after7Days: boolean;
    };
  };
  securitySettings?: SecuritySettings;
  preferences?: {
    language?: "fr" | "en";
    theme?: Theme;
    dateFormat?: string;
    currencySymbol?: string;
    currencyPosition?: "before" | "after";
    roundingMode?: "none" | "up" | "down" | "nearest";
    autoSave?: boolean;
    notificationsEnabled?: boolean;
    defaultDueDateDays?: number;
    emailSignature?: string;
    invoiceEmailSubject?: string;
    invoiceEmailTemplate?: string;
    quoteEmailSubject?: string;
    quoteEmailTemplate?: string;
    reminderEmailSubject?: string;
    reminderEmailTemplate?: string;
  };
  integrations?: {
    cloudSync?: {
      provider: "google_drive" | "dropbox" | "onedrive" | "none";
      autoSyncExports: boolean;
      lastSyncDate?: string;
    };
    webhooks?: {
      isEnabled: boolean;
      endpoint: string;
      events: string[];
    };
    autoBackup?: {
      enabled: boolean;
      provider: string;
      lastBackup?: string;
    };
    expenseImport?: {
      dropboxWatchEnabled: boolean;
      dropboxFolder?: string;
    };
    calendarSync?: {
      googleCalendarEnabled: boolean;
      outlookCalendarEnabled: boolean;
      syncFrequency: "realtime" | "daily";
    };
    crmImport?: {
      linkedinEnabled: boolean;
      salesforceEnabled: boolean;
    };
    aiAssistant?: {
      provider: "google_gemini" | "openai" | "anthropic" | "ollama" | "none";
      apiKey?: string;
      model?: string;
      customEndpoint?: string;
      isEnabled: boolean;
    };
    emailSettings?: {
      senderName?: string;
      senderEmail?: string;
      replyTo?: string;
      bccEmail?: string;
      smtpConfig?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
      provider: "internal" | "gmail" | "outlook" | "custom_smtp";
    };
  };
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: number;
}

// Email and EmailTemplate are defined in src/types/email.ts
export type { Email, EmailTemplate } from "./src/types/email";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string; // ISO string
  type: "meeting" | "task" | "deadline" | "other";
  clientId?: string;
  invoiceId?: string;
  color?: string;
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
  | "ai_assistant";

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
