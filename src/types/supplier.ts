export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  siret?: string;
  siren?: string;
  address?: string;
  category?: string; // ex: "Matériel", "Logiciel", "Assurance"
  notes?: string;
  contactName?: string;
  website?: string;
  tvaNumber?: string;
  paymentTerms?: string;
  archived?: boolean;
  createdAt?: string;
}
