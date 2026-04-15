/**
 * Schémas de validation et validateurs de formulaire
 * Utilisés par useFormValidation, FormFieldValidated et les managers
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export type ValidationRule = (value: unknown) => ValidationResult | boolean;

// ─── Validateurs individuels ─────────────────────────────────────────────────

export function validateRequired(value: unknown): ValidationResult {
  const valid =
    value !== null && value !== undefined && String(value).trim() !== "";
  return { valid, error: valid ? undefined : "Ce champ est obligatoire." };
}

export function validateName(value: unknown): ValidationResult {
  const v = String(value ?? "").trim();
  if (!v) return { valid: false, error: "Le nom est obligatoire." };
  if (v.length < 2)
    return {
      valid: false,
      error: "Le nom doit contenir au moins 2 caractères.",
    };
  return { valid: true };
}

export function validateEmailForm(value: unknown): ValidationResult {
  const v = String(value ?? "").trim();
  if (!v) return { valid: false, error: "L'email est obligatoire." };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(v)
    ? { valid: true }
    : { valid: false, error: "Format d'email invalide." };
}

export function validatePhoneForm(value: unknown): ValidationResult {
  const v = String(value ?? "").replace(/\s/g, "");
  if (!v) return { valid: true }; // Optionnel
  const re = /^(\+33|0)[1-9](\d{8})$/;
  return re.test(v)
    ? { valid: true }
    : { valid: false, error: "Numéro de téléphone français invalide." };
}

export function validateSIRETForm(value: unknown): ValidationResult {
  const v = String(value ?? "").replace(/\s/g, "");
  if (!v) return { valid: true }; // Optionnel
  if (!/^\d{14}$/.test(v))
    return { valid: false, error: "Le SIRET doit contenir 14 chiffres." };
  // Algorithme de Luhn pour SIRET
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = parseInt(v[i], 10);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0
    ? { valid: true }
    : { valid: false, error: "SIRET invalide (vérification Luhn échouée)." };
}

export function validateSIREN(value: unknown): ValidationResult {
  const v = String(value ?? "").replace(/\s/g, "");
  if (!v) return { valid: true }; // Optionnel
  if (!/^\d{9}$/.test(v))
    return { valid: false, error: "Le SIREN doit contenir 9 chiffres." };
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = parseInt(v[i], 10);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0
    ? { valid: true }
    : { valid: false, error: "SIREN invalide." };
}

export function validateIBAN(value: unknown): ValidationResult {
  const v = String(value ?? "")
    .replace(/\s/g, "")
    .toUpperCase();
  if (!v) return { valid: true }; // Optionnel
  const re = /^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/;
  if (!re.test(v))
    return {
      valid: false,
      error: "Format IBAN invalide (ex: FR76 3000 6000 0112 3456 7890 189).",
    };
  return { valid: true };
}

export function validateTVANumberForm(value: unknown): ValidationResult {
  const v = String(value ?? "").replace(/\s/g, "");
  if (!v) return { valid: true }; // Optionnel
  const re = /^FR[0-9A-Z]{2}\d{9}$/;
  return re.test(v)
    ? { valid: true }
    : {
        valid: false,
        error: "Format TVA intracommunautaire invalide (ex: FR12345678901).",
      };
}

export function validateFrenchPostalCode(value: unknown): ValidationResult {
  const v = String(value ?? "").trim();
  if (!v) return { valid: true }; // Optionnel
  return /^\d{5}$/.test(v)
    ? { valid: true }
    : { valid: false, error: "Code postal invalide (5 chiffres)." };
}

export function validateWebsiteForm(value: unknown): ValidationResult {
  const v = String(value ?? "").trim();
  if (!v) return { valid: true }; // Optionnel
  try {
    new URL(v.startsWith("http") ? v : `https://${v}`);
    return { valid: true };
  } catch {
    return { valid: false, error: "URL invalide." };
  }
}

export function validateAddressForm(value: unknown): ValidationResult {
  const v = String(value ?? "").trim();
  if (!v) return { valid: false, error: "L'adresse est obligatoire." };
  if (v.length < 10)
    return { valid: false, error: "L'adresse doit être plus détaillée." };
  return { valid: true };
}

export function validateAmount(value: unknown): ValidationResult {
  const n = Number(value);
  if (isNaN(n)) return { valid: false, error: "Montant invalide." };
  if (n < 0)
    return { valid: false, error: "Le montant ne peut pas être négatif." };
  return { valid: true };
}

export function validateDate(value: unknown): ValidationResult {
  const v = String(value ?? "").trim();
  if (!v) return { valid: false, error: "La date est obligatoire." };
  const d = new Date(v);
  return isNaN(d.getTime())
    ? { valid: false, error: "Date invalide." }
    : { valid: true };
}

// ─── Schémas simplifiés (API compatible zod) ─────────────────────────────────

type Schema<T> = {
  _type?: T;
  fields: Record<string, ValidationRule[]>;
};

export function createSchema<T>(
  fields: Record<string, ValidationRule[]>,
): Schema<T> {
  return { fields };
}

export function schemaToRules<T>(
  schema: Schema<T>,
): Record<string, ValidationRule[]> {
  return schema.fields;
}

// ─── Schémas prédéfinis ───────────────────────────────────────────────────────

export const ClientSchema = createSchema({
  name: [validateRequired, validateName],
  email: [validateEmailForm],
  address: [(v) => validateRequired(v)],
  siret: [validateSIRETForm],
  siren: [validateSIREN],
  phone: [validatePhoneForm],
  tvaNumber: [validateTVANumberForm],
  website: [validateWebsiteForm],
});

export const SupplierSchema = createSchema({
  name: [validateRequired, validateName],
  email: [validateEmailForm],
  siret: [validateSIRETForm],
  phone: [validatePhoneForm],
});

export const ProductSchema = createSchema({
  name: [validateRequired],
  description: [validateRequired],
  price: [validateAmount],
});

export const ExpenseSchema = createSchema({
  description: [validateRequired],
  amount: [validateRequired, validateAmount],
  date: [validateDate],
  category: [validateRequired],
});

export const InvoiceSchema = createSchema({
  clientId: [validateRequired],
  date: [validateDate],
  dueDate: [validateDate],
});
