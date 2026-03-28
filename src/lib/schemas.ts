/**
 * Centralisation des schémas de validation pour les entités du projet
 * Permet de réutiliser les mêmes règles dans les hooks useFormValidation
 */

import type { Client, Expense, Invoice, Product, Supplier } from '../types';
import {
  validateAddress,
  validateAmount,
  validateDate,
  validateEmail,
  validateFrenchPhone,
  validateName,
  validateRequired,
  validateSIRET,
  validateVATNumber,
  validateWebsite,
  type ValidationResult,
} from './validators';

export type ValidationSchema<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]?: (value: any) => ValidationResult;
};

/**
 * Schéma pour les Clients
 */
export const ClientSchema: ValidationSchema<Client> = {
  name: (value) => validateName(value as string),
  email: (value) => validateEmail(value as string),
  phone: (val) => (val ? validateFrenchPhone(val as string) : { valid: true }),
  siret: (val) => (val ? validateSIRET(val as string) : { valid: true }),
  tvaNumber: (val) => (val ? validateVATNumber(val as string) : { valid: true }),
  address: (val) => (val ? validateAddress(val as string) : { valid: true }),
  website: (val) => (val ? validateWebsite(val as string) : { valid: true }),
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
