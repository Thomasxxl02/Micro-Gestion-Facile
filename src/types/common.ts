export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export type ViewState =
  | 'dashboard'
  | 'invoices'
  | 'clients'
  | 'suppliers'
  | 'products'
  | 'accounting'
  | 'bank_reconciliation'
  | 'vat_dashboard'
  | 'emails'
  | 'calendar'
  | 'settings'
  | 'ai_assistant';
