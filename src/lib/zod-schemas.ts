/**
 * zod-schemas.ts
 * CENTRALIZED VALIDATION usando Zod
 *
 * Phase 2.3: Consolidate custom validators + Zod into single source
 * Replaces: schemas.ts (custom ValidationSchema) + partial validators.ts
 *
 * Benefits:
 * ✅ Single source of truth
 * ✅ Type inference: z.infer<typeof ClientSchema>
 * ✅ Runtime + compile-time safety
 * ✅ Reusable for forms, imports, API validation
 */

import { z } from 'zod';

// ============================================================================
// VALIDATORS (functions for field-level validation)
// ============================================================================

/** French SIRET: 14 digits, validates Luhn (mod 10) checksum, accepts spaces/dashes */
export const validateSIRET = (val: string): boolean => {
  const digits = val.replace(/[\s\-.]/g, '');
  if (!/^\d{14}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = parseInt(digits[i], 10);
    if ((14 - i) % 2 === 0) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
  }
  return sum % 10 === 0;
};

/** French TVA format: FR123456789 */
export const validateTVA = (val: string): boolean => /^(FR|fr)?\d{2}\d{9}$/.test(val);

/** French phone format: 01-05 XXXXX or +33 format */
export const validatePhone = (val: string): boolean =>
  /^(?:\+33[1-9]|0[1-9])\d{8}$/.test(val.replace(/[\s.-]/g, ''));

/** Email validation */
export const validateEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

/** Website must be valid URL */
export const validateWebsite = (val: string): boolean => {
  try {
    new URL(val.includes('://') ? val : `https://${val}`);
    return true;
  } catch {
    return false;
  }
};

/** French address: at least street + city */
export const validateAddress = (val: string): boolean =>
  val.split(',').length >= 2 && val.length >= 10;

// Aliases for backward compatibility
export const validateTVANumber = validateTVA;
export const validateFrenchPhone = validatePhone;

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const ClientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Email valide requis'),
  phone: z.string().refine(validateFrenchPhone, 'Format FR requis').optional().or(z.literal('')),
  siret: z
    .string()
    .refine(validateSIRET, 'Format SIRET invalide (123 456 789 00012)')
    .optional()
    .or(z.literal('')),
  tvaNumber: z
    .string()
    .refine(validateTVA, 'Format TVA invalide (FR123456789)')
    .optional()
    .or(z.literal('')),
  address: z.string().refine(validateAddress, 'Adresse invalide').optional().or(z.literal('')),
  website: z
    .string()
    .refine((val) => !val || validateWebsite(val), 'URL invalide')
    .optional()
    .or(z.literal('')),
  isTest: z.boolean().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const SupplierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Email valide requis').optional().or(z.literal('')),
  phone: z
    .string()
    .refine((val) => !val || validateFrenchPhone(val), 'Format FR requis')
    .optional()
    .or(z.literal('')),
  siret: z
    .string()
    .refine((val) => !val || validateSIRET(val), 'Format SIRET invalide')
    .optional()
    .or(z.literal('')),
  tvaNumber: z
    .string()
    .refine((val) => !val || validateTVA(val), 'Format TVA invalide')
    .optional()
    .or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  isTest: z.boolean().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  description: z.string().optional().or(z.literal('')),
  price: z.number().min(0, 'Prix doit être positif'),
  unitOfMeasure: z.string().optional().or(z.literal('pièce')),
  isTest: z.boolean().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const ExpenseSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(2, 'Description requise'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide'),
  amount: z.number().min(0, 'Montant doit être positif'),
  vatAmount: z.number().min(0, 'Montant TVA doit être positif'),
  category: z.string().optional().or(z.literal('other')),
  isTest: z.boolean().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const InvoiceItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(2),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(100).optional().default(0),
});

export const InvoiceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['invoice', 'quote', 'order', 'creditNote']),
  number: z.string().min(1, 'Numéro requis'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Date invalide'),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Date d'échéance invalide"),
  clientId: z.string().min(1, 'Client requis'),
  items: z.array(InvoiceItemSchema).min(1, 'Au moins une ligne requise'),
  discount: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
  total: z.number().min(0),
  isTest: z.boolean().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT & IMPORT SCHEMAS (for RGPD data portability)
// ─────────────────────────────────────────────────────────────────────────────

export const ExportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  userProfile: z.record(z.string(), z.unknown()),
  invoices: z.array(InvoiceSchema).default([]),
  clients: z.array(ClientSchema).default([]),
  suppliers: z.array(SupplierSchema).default([]),
  products: z.array(ProductSchema).default([]),
  expenses: z.array(ExpenseSchema).default([]),
  emails: z.array(z.record(z.string(), z.unknown())).default([]),
  emailTemplates: z.array(z.record(z.string(), z.unknown())).default([]),
  calendarEvents: z.array(z.record(z.string(), z.unknown())).default([]),
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPE INFERENCE (TypeScript types from schemas)
// ─────────────────────────────────────────────────────────────────────────────

export type ClientInput = z.infer<typeof ClientSchema>;
export type SupplierInput = z.infer<typeof SupplierSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;
export type InvoiceInput = z.infer<typeof InvoiceSchema>;
export type ExportDataInput = z.infer<typeof ExportDataSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS (for use in forms/components)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a single field using Zod schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns { valid: true } or { valid: false, error: string }
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Batch validation rules mapping field names to validator functions */
export type BatchValidationRules = Record<string, (value: unknown) => ValidationResult>;

export const validateWithSchema = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult => {
  try {
    schema.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        valid: false,
        error: firstError.message || 'Validation échouée',
      };
    }
    return { valid: false, error: 'Erreur de validation inconnue' };
  }
};

/**
 * Create a field validator from schema
 * Useful for individual field validation in forms
 * @param schema Zod schema
 * @param fieldName Name of the field to validate
 */
export const createFieldValidator = <T>(schema: z.ZodSchema<T>, fieldName: keyof T) => {
  return (value: unknown): ValidationResult => {
    try {
      if (schema instanceof z.ZodObject) {
        const fieldSchema = (schema as z.ZodObject<z.ZodRawShape>).shape[fieldName as string];
        if (fieldSchema) {
          (fieldSchema as unknown as { parse(v: unknown): unknown }).parse(value);
        }
      }
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: error.issues[0]?.message || 'Validation échouée' };
      }
      return { valid: false, error: 'Erreur de validation' };
    }
  };
};

/**
 * Safe parse (doesn't throw, useful for form fields)
 * @param schema Zod schema
 * @param data Data to parse
 * @returns Parsed data or original data if invalid
 */
export const safeParse = <T>(schema: z.ZodSchema<T>, data: unknown): T | unknown => {
  try {
    return schema.parse(data);
  } catch {
    return data;
  }
};

/**
 * Batch validate multiple fields (backward compatibility for useFormValidation)
 * @param data Form data to validate
 * @param rules Field validators
 * @returns Record of validation results by field name
 */
export const validateBatch = (
  data: Record<string, unknown>,
  rules: Record<string, (value: unknown) => ValidationResult>
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};

  for (const [fieldName, validator] of Object.entries(rules)) {
    const value = data[fieldName];
    results[fieldName] = validator(value);
  }

  return results;
};

/**
 * Check if all validation results are valid
 * @param results Validation results from validateBatch
 * @returns true if all results are valid
 */
export const areAllValid = (results: Record<string, ValidationResult>): boolean => {
  return Object.values(results).every((result) => result.valid === true);
};

/**
 * Check if a single validation result is valid
 * @param result A single validation result
 * @returns true if the result is valid
 */
export const isValid = (result: ValidationResult): boolean => {
  return result.valid === true;
};
// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL VALIDATORS (for backward compatibility with forms)
// ─────────────────────────────────────────────────────────────────────────────

/** Validators for additional field types used in FormFieldValidated */

export const validateSIREN = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: false, error: 'SIREN obligatoire' };
  }
  if (!/^\d{9}$/.test(str)) {
    return { valid: false, error: 'SIREN: 9 chiffres requis' };
  }
  return { valid: true };
};

export const validateIBAN = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: false, error: 'IBAN obligatoire' };
  }
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(str.replace(/\s/g, ''))) {
    return { valid: false, error: 'Format IBAN invalide' };
  }
  return { valid: true };
};

export const validateFrenchPostalCode = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: false, error: 'Code postal obligatoire' };
  }
  if (!/^\d{5}$/.test(str)) {
    return { valid: false, error: 'Code postal: 5 chiffres requis' };
  }
  return { valid: true };
};

export const validateName = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: false, error: 'Nom obligatoire' };
  }
  if (str.length < 2) {
    return { valid: false, error: 'Nom: au moins 2 caractères' };
  }
  return { valid: true };
};

// ValidationResult wrappers for form validators
// (Boolean versions above are used by Zod schemas)

export const validateAddressForm = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (str && str.length < 5) {
    return { valid: false, error: 'Adresse: au moins 5 caractères' };
  }
  return { valid: true };
};

export const validateWebsiteForm = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: true };
  } // Optional field
  try {
    new URL(str.startsWith('http') ? str : `https://${str}`);
    return { valid: true };
  } catch {
    return { valid: false, error: 'URL invalide' };
  }
};

export const validateAmount = (val: unknown): ValidationResult => {
  const num = Number(val);
  if (isNaN(num)) {
    return { valid: false, error: 'Montant doit être un nombre' };
  }
  if (num < 0) {
    return { valid: false, error: 'Montant doit être positif' };
  }
  return { valid: true };
};

export const validateDate = (val: unknown): ValidationResult => {
  const str = String(val || '');
  if (!str) {
    return { valid: false, error: 'Date obligatoire' };
  }
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Date invalide' };
  }
  return { valid: true };
};

export const validateRequired = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: false, error: 'Champ obligatoire' };
  }
  return { valid: true };
};

// ValidationResult wrappers for form validators (compatible with useFormValidation)
// These use the boolean validators above internally
export const validateEmailForm = (val: unknown): ValidationResult => {
  if (validateEmail(val as string)) {
    return { valid: true };
  }
  return { valid: false, error: 'Email invalide' };
};

export const validatePhoneForm = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: true };
  } // Optional
  if (validatePhone(str)) {
    return { valid: true };
  }
  return { valid: false, error: 'Format téléphone invalide' };
};

export const validateSIRETForm = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: true };
  } // Optional
  if (validateSIRET(str)) {
    return { valid: true };
  }
  return { valid: false, error: 'Format SIRET invalide (123 456 789 00012)' };
};

export const validateTVANumberForm = (val: unknown): ValidationResult => {
  const str = String(val || '').trim();
  if (!str) {
    return { valid: true };
  } // Optional
  if (validateTVA(str)) {
    return { valid: true };
  }
  return { valid: false, error: 'Format TVA invalide (FR123456789)' };
};

// ============================================================================
// SCHEMA TO VALIDATION RULES ADAPTER (for useFormValidation)
// ============================================================================

/**
 * Converts a Zod schema into BatchValidationRules for use with useFormValidation
 * Useful for Manager components that use useFormValidation with Zod schemas
 *
 * @param schema Zod schema (e.g., ClientSchema, ExpenseSchema)
 * @returns BatchValidationRules object for field validation
 */
export const schemaToRules = <T>(schema: z.ZodSchema<T>): BatchValidationRules => {
  const rules: BatchValidationRules = {};

  if (schema instanceof z.ZodObject) {
    const shape = (schema as z.ZodObject<z.ZodRawShape>).shape;
    for (const [fieldName, fieldSchema] of Object.entries(shape)) {
      rules[fieldName] = (value: unknown): ValidationResult => {
        try {
          (fieldSchema as unknown as { parse(v: unknown): unknown }).parse(value);
          return { valid: true };
        } catch (error) {
          if (error instanceof z.ZodError) {
            return { valid: false, error: error.issues[0]?.message || 'Validation échouée' };
          }
          return { valid: false, error: 'Erreur de validation inconnue' };
        }
      };
    }
  }

  return rules;
};
