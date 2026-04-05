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
  PENDING_PAYMENT = 'En attente de paiement',
}

export type EInvoiceFormat = 'Factur-X' | 'UBL' | 'CII';

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
