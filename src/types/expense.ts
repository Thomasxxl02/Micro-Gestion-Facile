export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number; // Montant TTC
  vatAmount?: number;
  vatRate?: number;
  category: string;
  supplierId?: string;
  updatedAt?: string; // ISO timestamp — indexé dans IndexedDB pour sync LWW
}
