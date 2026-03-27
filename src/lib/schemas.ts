/**
 * Centralisation des schémas de validation pour les entités du projet
 * Permet de réutiliser les mêmes règles dans les hooks useFormValidation
 */

import type { Client, Supplier, Invoice, Expense, Product } from '../types';
import {
  validateEmail,
  validateFrenchPhone,
  validateSIRET,
  validateName,
  validateAddress,
  validateFrenchPostalCode,
  validateVATNumber,
  validateWebsite,
  validateAmount,
  validateDate,
  validateRequired,
  validateIBAN,
  type ValidationResult,
} from './validators';

export type ValidationSchema<T> = {
  [K in keyof T]?: (value: unknown) => ValidationResult;
};

/**
 * Schéma pour les Clients
 */
export const ClientSchema: ValidationSchema<Client> = {
  name: validateName,
  email: validateEmail,
  phone: (val: string) => (val ? validateFrenchPhone(val) : { valid: true }),
  siret: (val: string) => (val ? validateSIRET(val) : { valid: true }),
  tvaNumber: (val: string) => (val ? validateVATNumber(val) : { valid: true }),
  address: (val: string) => (val ? validateAddress(val) : { valid: true }),
  postalCode: (val: string) => (val ? validateFrenchPostalCode(val) : { valid: true }),
  website: (val: string) => (val ? validateWebsite(val) : { valid: true }),
};

/**
 * Schéma pour les Fournisseurs (Suppliers)
 */
export const SupplierSchema: ValidationSchema<Supplier> = {
  name: validateName,
  email: (val: string) => (val ? validateEmail(val) : { valid: true }),
  phone: (val: string) => (val ? validateFrenchPhone(val) : { valid: true }),
  siret: (val: string) => (val ? validateSIRET(val) : { valid: true }),
  tvaNumber: (val: string) => (val ? validateVATNumber(val) : { valid: true }),
  bankAccount: (val: string) => (val ? validateIBAN(val) : { valid: true }),
};

/**
 * Schéma pour les Factures (Invoice)
 */
export const InvoiceSchema: ValidationSchema<Invoice> = {
  number: validateRequired,
  date: validateDate,
  dueDate: validateDate,
  clientId: validateRequired,
  discount: (val: number) => validateAmount(val),
  shipping: (val: number) => validateAmount(val),
};

/**
 * Schéma pour les Dépenses (Expense)
 */
export const ExpenseSchema: ValidationSchema<Expense> = {
  description: validateRequired,
  date: validateDate,
  amount: (val: number) => validateAmount(val),
  vatAmount: (val: number) =>
    val >= 0 ? { valid: true } : { valid: false, error: 'Montant TVA invalide' },
};

/**
 * Schéma pour les Produits
 */
export const ProductSchema: ValidationSchema<Product> = {
  name: validateName,
  price: (val: number) => validateAmount(val),
};
