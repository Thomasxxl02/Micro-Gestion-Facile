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
