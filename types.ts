
export type DocumentType = 'invoice' | 'quote' | 'order' | 'credit_note';

export enum InvoiceStatus {
  DRAFT = 'Brouillon',
  SENT = 'Envoyée',
  PAID = 'Payée',
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
  logoUrl?: string; // URL ou Base64 du logo
  socialContributionRate?: number; // Taux de cotisations sociales (ex: 21.1)
  geminiApiKey?: string; // Clé API pour l'assistant IA
  
  // Nouveaux champs métiers
  activityType?: ActivityType;
  isAcreBeneficiary?: boolean;
  vatThresholdAlert?: boolean;
  revenueThresholdAlert?: boolean;
  preferences?: UserPreferences;
}

export interface ChatMessage {
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

export type Theme = 'light' | 'dark' | 'system';

export interface UserPreferences {
  theme: Theme;
  language: 'fr' | 'en';
  dateFormat: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  roundingMode: 'none' | 'up' | 'down' | 'nearest';
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
