import type { ActivityType } from "./common";
import type { EInvoiceFormat } from "./invoice";

export type { ActivityType };

/**
 * Clé API sécurisée
 */
export interface SecurityAPIKey {
  id: string;
  name: string;
  service: "GEMINI" | "FIREBASE" | "CUSTOM";
  keyHash: string; // Hash SHA-256 (jamais la clé en clair)
  prefix: string; // Aperçu visible des premiers caractères seulement
  createdAt: number;
  lastUsedAt?: number;
  expiresAt?: number;
  isActive: boolean;
  rotationRequired: boolean;
}

/**
 * Paramètres de sécurité de l'utilisateur
 */
export interface SecuritySettings {
  isTwoFactorEnabled?: boolean;
  twoFactorMethod?: "TOTP" | "SMS"; // TOTP (Google Authenticator) ou SMS
  totpSecret?: string; // Stocké chiffré
  phoneNumber?: string; // Pour SMS 2FA
  apiKeys?: SecurityAPIKey[]; // Gestion des clés API
  encryptedDataPassword?: string; // Hash du mot de passe pour chiffrement
}

export interface LogEntry {
  id: string;
  action: string;
  category: "AUTH" | "DATABASE" | "SERVICES" | "SYSTEM" | "DATA" | "SECURITY";
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  details: string;
  timestamp: number;
  userId?: string;
  ip?: string;
  device?: string;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  companyName: string;
  professionalTitle?: string; // Ex: Consultant IT, Photographe...
  siret: string;
  siren?: string;
  defaultEInvoiceFormat?: EInvoiceFormat;
  defaultOperationCategory?: "BIENS" | "SERVICES" | "MIXTE";
  address: string;
  email: string;
  phone: string;
  website?: string;
  linkedin?: string;
  bankAccount?: string; // IBAN
  bic?: string; // BIC/SWIFT
  tvaNumber?: string; // Numéro TVA Intracom
  legalMentions?: string; // Mentions spécifiques bas de page
  currency?: string;
  invoicePrefix?: string;
  invoiceStartNumber?: number; // Prochain numéro séquentiel de facture (conformité fiscale art. L441-9)
  quotePrefix?: string;
  orderPrefix?: string;
  creditNotePrefix?: string;
  defaultVatRate?: number;
  logoColor?: string;

  // Nouveaux champs métiers
  activityType?: ActivityType;
  isAcreBeneficiary?: boolean;
  vatThresholdAlert?: boolean;
  customVatThresholdPercentage?: number; // Seuil personnalisé pour alerte TVA (ex: 80%)
  revenueThresholdAlert?: boolean;
  customRevenueThresholdPercentage?: number; // Seuil personnalisé pour alerte CA (ex: 90%)
  isVatExempt?: boolean; // Changé de isTaxExempt pour correspondre à SettingsManager
  vatExemptionReason?: string; // Raison légale (Art 293 B CGI etc)
  taxDeclarationPeriod?: "MONTHLY" | "QUARTERLY"; // Périodicité des déclarations URSSAF
  logoUrl?: string;
  signatureUrl?: string; // URL ou Base64 de la signature numérique (PNG)
  stampUrl?: string; // URL ou Base64 du cachet commercial
  taxSystem?: string;
  vatNumber?: string;
  primaryColor?: string;
  secondaryColor?: string;

  // Paramètres de productivité et automatisation
  autoOpenPdfPreview?: boolean;
  defaultServiceCategory?: "SERVICE" | "VENTE";
  sidebarFavorites?: string[]; // Liste des IDs d'onglets affichés/ordonnés

  // Champs critiques pour SettingsManager et AIAssistant
  socialContributionRate?: number; // Taux de cotisation sociale (ex: 21.1)
  geminiApiKey?: string; // Clé API pour Gemini AI
  preferences?: Record<string, unknown>; // Préférences globales UI/Style

  // Paramètres de facturation avancés (Conformité 2026)
  paymentTermsDefault?:
    | "A_RECEPTION"
    | "30_DAYS"
    | "30_EOM"
    | "45_DAYS"
    | "45_EOM"
    | "60_DAYS"
    | "60_EOM";
  latePenaltyRate?: string;
  recoveryIndemnityAmount?: number; // Indemnité forfaitaire de recouvrement (40€ par défaut entre pros)
  numberingFormat?: string; // Ex: [YYYY]-[MM]-[SEQ]
  resetNumberingYearly?: boolean;
  isMixedActivity?: boolean;
  activityTypeSecondary?: ActivityType;
  hasTaxVersantLiberatoire?: boolean;

  fontFamily?: string;
  invoiceTemplate?: "modern" | "classic" | "minimal" | "corporate";

  // Préférences UI/UX
  theme?: "light" | "dark" | "auto";
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat?: "24h" | "12h";
  uiDensity?: "compact" | "normal" | "spacious";
  borderRadius?: number; // en px, ex: 0 (carré), 8 (arrondi), 16 (très arrondi)
  isZenMode?: boolean; // Mode focus pour masquer les aides
  fontSize?: "small" | "normal" | "large";
  enableNotifications?: boolean;
  enableEmailNotifications?: boolean;
  notificationTypes?: {
    invoiceReminders?: boolean;
    paymentReminders?: boolean;
    expenseAlerts?: boolean;
    systemUpdates?: boolean;
  };
  notifications?: {
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    browserPushEnabled?: boolean;
  };
  reducedMotion?: boolean;
  // Automatisation
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
  // Paramètres de sécurité
  securitySettings?: SecuritySettings;

  // Intégrations externes
  integrations?: {
    cloudSync?: {
      provider: "google_drive" | "dropbox" | "onedrive" | "none";
      autoSyncExports: boolean;
      lastSyncDate?: string;
    };
    webhooks?: {
      isEnabled: boolean;
      paymentUrl?: string;
      invoiceCreationUrl?: string;
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
  };
}
