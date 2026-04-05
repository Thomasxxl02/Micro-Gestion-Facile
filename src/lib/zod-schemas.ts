/**
 * Schémas de validation Zod pour Micro-Gestion-Facile
 * Remplace schemas.ts custom - fournit validation runtime typée
 *
 * Inclut: Client, Supplier, Invoice, Expense, Product avec règles métier françaises
 * Chaque schéma peut être utilisé avec .parse(), .safeParse() ou inféré pour TypeScript
 */

import { z } from 'zod';

/**
 * Validateurs personnalisés français
 */

const _SIRET_VALIDATION = /^[\d\s-]*$/;
const _SIREN_VALIDATION = /^[\d\s-]*$/;
const _IBAN_VALIDATION = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
const PHONE_VALIDATION = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]?\d{2}){4}$/;
const _POSTAL_CODE_VALIDATION = /^[\d]{5}$/;
const VAT_NUMBER_VALIDATION = /^[A-Z]{2}\d{10}$/;

/**
 * Schéma Client
 */
export const ClientSchema = z
  .object({
    id: z.string().uuid(),
    name: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    email: z.string().email('Adresse email invalide'),
    address: z.string().min(5, 'Adresse trop courte').max(200, 'Adresse trop longue'),
    phone: z
      .string()
      .regex(PHONE_VALIDATION, 'Numéro de téléphone français invalide')
      .optional()
      .or(z.literal('')),
    siret: z.string().length(14, 'SIRET doit contenir 14 chiffres').optional().or(z.literal('')),
    siren: z.string().length(9, 'SIREN doit contenir 9 chiffres').optional().or(z.literal('')),
    notes: z.string().max(500, 'Les notes ne peuvent pas dépasser 500 caractères').optional(),
    archived: z.boolean().optional(),
    contactName: z.string().max(100).optional().or(z.literal('')),
    website: z.string().url('URL invalide').optional().or(z.literal('')),
    tvaNumber: z
      .string()
      .regex(VAT_NUMBER_VALIDATION, 'Numéro TVA invalide')
      .optional()
      .or(z.literal('')),
    paymentTerms: z.string().optional(),
    category: z.enum(['Particulier', 'Entreprise', 'Association', 'Public']).optional(),
    isPublicEntity: z.boolean().optional(),
    createdAt: z.string().datetime().optional(),
    isTest: z.boolean().optional(),
  })
  .strict();

export type Client = z.infer<typeof ClientSchema>;

/**
 * Schéma Supplier
 */
export const SupplierSchema = z
  .object({
    id: z.string().uuid(),
    name: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    email: z.string().email('Adresse email invalide').optional().or(z.literal('')),
    phone: z
      .string()
      .regex(PHONE_VALIDATION, 'Numéro de téléphone français invalide')
      .optional()
      .or(z.literal('')),
    siret: z.string().length(14, 'SIRET doit contenir 14 chiffres').optional().or(z.literal('')),
    siren: z.string().length(9, 'SIREN doit contenir 9 chiffres').optional().or(z.literal('')),
    address: z.string().max(200, 'Adresse trop longue').optional(),
    category: z.string().optional(),
    notes: z.string().max(500, 'Les notes ne peuvent pas dépasser 500 caractères').optional(),
    contactName: z.string().max(100).optional().or(z.literal('')),
    website: z.string().url('URL invalide').optional().or(z.literal('')),
    tvaNumber: z
      .string()
      .regex(VAT_NUMBER_VALIDATION, 'Numéro TVA invalide')
      .optional()
      .or(z.literal('')),
    paymentTerms: z.string().optional(),
    archived: z.boolean().optional(),
    createdAt: z.string().datetime().optional(),
  })
  .strict();

export type Supplier = z.infer<typeof SupplierSchema>;

/**
 * Schéma Product
 */
export const ProductSchema = z
  .object({
    id: z.string().uuid(),
    name: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
    description: z.string().max(500, 'Description trop longue').optional(),
    price: z
      .number()
      .positive('Le prix doit être positif')
      .finite('Le prix doit être un nombre fini'),
    type: z.enum(['service', 'product']),
    category: z.string().optional(),
    sku: z.string().max(50, 'SKU trop long').optional().or(z.literal('')),
    unit: z.string().optional(), // ex: "heure", "jour", "unité"
    stock: z.number().int().nonnegative().optional(),
    minStock: z.number().int().nonnegative().optional(),
    archived: z.boolean().optional(),
    createdAt: z.string().datetime().optional(),
    isTest: z.boolean().optional(),
  })
  .strict();

export type Product = z.infer<typeof ProductSchema>;

/**
 * Schéma InvoiceItem
 */
export const InvoiceItemSchema = z
  .object({
    id: z.string().uuid(),
    description: z.string().min(1, 'Description obligatoire').max(500, 'Description trop longue'),
    quantity: z.number().positive('Quantité doit être positive').finite('Quantité invalide'),
    unitPrice: z
      .number()
      .positive('Prix unitaire doit être positif')
      .finite('Prix unitaire invalide'),
    unit: z.string().optional(),
    vatRate: z
      .number()
      .min(0, 'Taux TVA ne peut pas être négatif')
      .max(100, 'Taux TVA invalide')
      .optional(),
  })
  .strict();

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

/**
 * Schéma Invoice
 */
export const InvoiceSchema = z
  .object({
    id: z.string().uuid(),
    type: z.enum(['invoice', 'quote', 'order', 'credit_note', 'deposit_invoice']),
    number: z.string().min(1, 'Numéro de facture obligatoire').max(50, 'Numéro trop long'),
    linkedDocumentId: z.string().uuid().optional(),
    date: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide')),
    dueDate: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide')),
    clientId: z.string().uuid('ID client invalide'),
    items: z.array(InvoiceItemSchema).min(1, 'Au moins un article obligatoire'),
    status: z.string(),
    notes: z.string().max(1000).optional(),
    total: z.number().nonnegative('Total ne peut pas être négatif').finite('Total invalide'),
    reminderDate: z.string().datetime().optional(),
    discount: z
      .number()
      .min(0, 'Remise ne peut pas être négative')
      .max(100, 'Remise invalide')
      .optional(),
    shipping: z
      .number()
      .nonnegative('Frais de port invalides')
      .finite('Frais de port invalides')
      .optional(),
    deposit: z.number().nonnegative('Acompte invalide').finite('Acompte invalide').optional(),
    vatAmount: z.number().nonnegative('TVA invalide').finite('TVA invalide').optional(),
    taxExempt: z.boolean().optional(),
    eInvoiceFormat: z.enum(['Factur-X', 'UBL', 'CII']).optional(),
    eInvoiceStatus: z.string().optional(),
    transmissionDate: z.string().datetime().optional(),
    operationCategory: z.enum(['BIENS', 'SERVICES', 'MIXTE']).optional(),
    deliveryAddress: z.string().optional(),
    isTest: z.boolean().optional(),
    subtotal: z
      .number()
      .nonnegative('Sous-total invalide')
      .finite('Sous-total invalide')
      .optional(),
  })
  .strict()
  .refine((data) => {
    try {
      return new Date(data.dueDate as string) >= new Date(data.date as string);
    } catch {
      return true; // Validation de date va échouer avant cette règle
    }
  }, "La date d'échéance doit être après ou égale à la date de facture");

export type Invoice = z.infer<typeof InvoiceSchema>;

/**
 * Schéma Expense
 */
export const ExpenseSchema = z
  .object({
    id: z.string().uuid(),
    date: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide')),
    description: z.string().min(1, 'Description obligatoire').max(500, 'Description trop longue'),
    amount: z.number().positive('Montant doit être positif').finite('Montant invalide'),
    vatAmount: z.number().nonnegative('TVA invalide').finite('TVA invalide').optional(),
    vatRate: z
      .number()
      .min(0, 'Taux TVA ne peut pas être négatif')
      .max(100, 'Taux TVA invalide')
      .optional(),
    category: z.string().min(1, 'Catégorie obligatoire'),
    supplierId: z.string().uuid().optional(),
  })
  .strict();

export type Expense = z.infer<typeof ExpenseSchema>;

/**
 * Schémas pour formes - versions sans UUID (création)
 */

export const ClientCreateSchema = ClientSchema.omit({ id: true, createdAt: true });
export type ClientCreate = z.infer<typeof ClientCreateSchema>;

export const SupplierCreateSchema = SupplierSchema.omit({ id: true, createdAt: true });
export type SupplierCreate = z.infer<typeof SupplierCreateSchema>;

export const ProductCreateSchema = ProductSchema.omit({ id: true, createdAt: true });
export type ProductCreate = z.infer<typeof ProductCreateSchema>;

// InvoiceCreateSchema: For creation forms, use type definition instead of schema
// because omit() doesn't work with ZodEffects (from refine)
export type InvoiceCreate = Omit<Invoice, 'id'>;

export const ExpenseCreateSchema = ExpenseSchema.omit({ id: true });
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;

/**
 * Utilitaires pour validation sûre
 */

export const validateClient = (data: unknown) => ClientSchema.safeParse(data);
export const validateSupplier = (data: unknown) => SupplierSchema.safeParse(data);
export const validateProduct = (data: unknown) => ProductSchema.safeParse(data);
export const validateInvoice = (data: unknown) => InvoiceSchema.safeParse(data);
export const validateExpense = (data: unknown) => ExpenseSchema.safeParse(data);

export const validateClientCreate = (data: unknown) => ClientCreateSchema.safeParse(data);
export const validateSupplierCreate = (data: unknown) => SupplierCreateSchema.safeParse(data);
export const validateProductCreate = (data: unknown) => ProductCreateSchema.safeParse(data);
// validateInvoiceCreate: Parse against base InvoiceSchema, the 'id' field is ignored by client
export const validateInvoiceCreate = (data: unknown) => {
  const validated = InvoiceSchema.safeParse(data);
  if (validated.success) {
    // Remove id if present to ensure it's not included
    const { id: _id, ...withoutId } = validated.data;
    return { success: true, data: withoutId } as z.SafeParseReturnType<
      InvoiceCreate,
      InvoiceCreate
    >;
  }
  return validated;
};
export const validateExpenseCreate = (data: unknown) => ExpenseCreateSchema.safeParse(data);
