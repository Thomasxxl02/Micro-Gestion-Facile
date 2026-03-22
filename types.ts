
export type DocumentType = 'invoice' | 'quote' | 'order' | 'credit_note' | 'deposit_invoice';

export enum InvoiceStatus {
  DRAFT = 'Brouillon',
  SENT = 'Envoyée',
  PAID = 'Payée',
  PARTIALLY_PAID = 'Partiellement payée',
  CANCELLED = 'Annulée',
  // Status spécifiques aux devis
  ACCEPTED = 'Accepté',
  REJECTED = 'Refusé',
  // Status spécifiques à la facturation électronique 2026
  DEPOSITED = 'Déposée',
  REJECTED_BY_PLATFORM = 'Rejetée par plateforme',
  ACCEPTED_BY_CLIENT = 'Acceptée par client',
  PENDING_PAYMENT = 'En attente de paiement'
}

export type EInvoiceFormat = 'Factur-X' | 'UBL' | 'CII';

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
  category?: 'Particulier' | 'Entreprise' | 'Association' | 'Public';
  isPublicEntity?: boolean; // Pour Chorus Pro
  createdAt?: string;
  isTest?: boolean;
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
  type: 'service' | 'product';
  category?: string;
  sku?: string;
  unit?: string; // ex: "heure", "jour", "unité", "km"
  stock?: number;
  minStock?: number;
  archived?: boolean;
  createdAt?: string;
  isTest?: boolean;
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
  operationCategory?: 'BIENS' | 'SERVICES' | 'MIXTE';
  deliveryAddress?: string;
  isTest?: boolean;
  subtotal?: number;
}

export type ActivityType = 'SERVICE_BNC' | 'SERVICE_BIC' | 'SALE' | 'LIBERAL';

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
  fontFamily?: string;

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

  // Nouveaux champs de sécurité
  securitySettings?: SecuritySettings;
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

/**
 * Clé API sécurisée
 */
export interface SecurityAPIKey {
  id: string;
  name: string;
  service: 'GEMINI' | 'FIREBASE' | 'CUSTOM';
  keyHash: string; // Hash SHA-256 (jamais la clé en clair)
  prefix: string; // Aperçu visible (ex: "sk_live_abc...")
  createdAt: number;
  lastUsedAt?: number;
  expiresAt?: number;
  isActive: boolean;
  rotationRequired: boolean;
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

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'draft';
  type: 'invoice' | 'quote' | 'reminder' | 'custom';
  relatedId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'invoice' | 'quote' | 'reminder' | 'custom';
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO string
  end: string; // ISO string
  type: 'meeting' | 'task' | 'deadline' | 'other';
  clientId?: string;
  invoiceId?: string;
  color?: string;
}

export type ViewState = 'dashboard' | 'invoices' | 'clients' | 'suppliers' | 'products' | 'accounting' | 'emails' | 'calendar' | 'settings' | 'ai_assistant';
