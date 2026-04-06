/**
 * @deprecated Use zod-schemas.ts instead
 * This file is kept for backward compatibility during migration.
 * All new validation should use the centralized Zod schemas in zod-schemas.ts
 *
 * Migration guide:
 * - Replace: import { validateEmail } from './validators'
 * - With: import { validateEmail } from './zod-schemas'
 */

// Re-export from zod-schemas for backward compatibility
export {
  areAllValid,
  createFieldValidator,
  isValid,
  safeParse,
  schemaToRules,
  validateAddress,
  validateAddressForm,
  validateAmount,
  validateBatch,
  validateDate,
  validateEmail,
  validateEmailForm,
  validateFrenchPhone,
  validateFrenchPostalCode,
  validateIBAN,
  validateName,
  validatePhone,
  validatePhoneForm,
  validateRequired,
  validateSIREN,
  validateSIRET,
  validateSIRETForm,
  validateTVANumber,
  validateTVANumberForm,
  validateWebsite,
  validateWebsiteForm,
  validateWithSchema,
  type BatchValidationRules,
  type ValidationResult,
} from './zod-schemas';

/*
   OLD CODE ARCHIVED
   All functions previously defined here have been migrated to zod-schemas.ts
   Please see zod-schemas.ts for the current implementation.
   This file will be deleted once all imports have been updated.
*/
