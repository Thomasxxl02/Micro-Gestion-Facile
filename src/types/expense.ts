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
