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
