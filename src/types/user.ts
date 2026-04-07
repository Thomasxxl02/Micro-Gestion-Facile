import type { EInvoiceFormat } from './invoice';

export type ActivityType = 'SERVICE_BNC' | 'SERVICE_BIC' | 'SALE' | 'LIBERAL';

/**
 * Clé API sécurisée
 */
export interface SecurityAPIKey {
  id: string;
  name: string;
  service: 'GEMINI' | 'FIREBASE' | 'CUSTOM';
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
  twoFactorMethod?: 'TOTP' | 'SMS'; // TOTP (Google Authenticator) ou SMS
  totpSecret?: string; // Stocké chiffré
  phoneNumber?: string; // Pour SMS 2FA
  apiKeys?: SecurityAPIKey[]; // Gestion des clés API
  encryptedDataPassword?: string; // Hash du mot de passe pour chiffrement
}

export interface LogEntry {
  id: string;
  action: string;
  category: 'AUTH' | 'DATABASE' | 'SERVICES' | 'SYSTEM' | 'DATA';
  severity: 'INFO' | 'WARNING' | 'ERROR';
  details: string;
  timestamp: number;
  userId?: string;
}

export interface UserProfile {
  companyName: string;
  professionalTitle?: string; // Ex: Consultant IT, Photographe...
  siret: string;
  siren?: string;
  defaultEInvoiceFormat?: EInvoiceFormat;
  defaultOperationCategory?: 'BIENS' | 'SERVICES' | 'MIXTE';
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
  revenueThresholdAlert?: boolean;
  isVatExempt?: boolean; // Changé de isTaxExempt pour correspondre à SettingsManager
  vatExemptionReason?: string; // Raison légale (Art 293 B CGI etc)
  logoUrl?: string;
  taxSystem?: string;
  vatNumber?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  invoiceTemplate?: 'modern' | 'classic' | 'minimal' | 'corporate';

  // Préférences UI/UX
  theme?: 'light' | 'dark' | 'auto';
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '24h' | '12h';
  uiDensity?: 'compact' | 'normal' | 'spacious';
  fontSize?: 'small' | 'normal' | 'large';
  enableNotifications?: boolean;
  enableEmailNotifications?: boolean;
  notificationTypes?: {
    invoiceReminders?: boolean;
    paymentReminders?: boolean;
    expenseAlerts?: boolean;
    systemUpdates?: boolean;
  };

  // Paramètres de sécurité
  securitySettings?: SecuritySettings;
}
