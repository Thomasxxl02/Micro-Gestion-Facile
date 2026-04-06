/**
 * Test pour la validation du projet
 * Vérifie la migration des anciens validators vers les zod-schemas
 */

import { describe, expect, it } from 'vitest';
import {
  // New Zod-based validation functions (Form-suffixed return ValidationResult)
  areAllValid,
  ClientSchema,
  createFieldValidator,
  isValid,
  safeParse,
  validateBatch,
  validateEmailForm,
  validatePhoneForm,
  validateSIRETForm,
  validateTVANumberForm,
  validateWithSchema,
  type ValidationResult,
} from '../../lib/zod-schemas';

describe('✅ Validation Migration Tests - Custom to Zod', () => {
  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const result = validateEmailForm('john@example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = validateEmailForm('not-an-email');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty email', () => {
      const result = validateEmailForm('');
      expect(result.valid).toBe(false);
    });
  });

  describe('Phone Number Validation (French)', () => {
    it('should validate French mobile number', () => {
      const result = validatePhoneForm('0612345678');
      expect(result.valid).toBe(true);
    });

    it('should validate French landline number', () => {
      const result = validatePhoneForm('0123456789');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const result = validatePhoneForm('123');
      expect(result.valid).toBe(false);
    });
  });

  describe('SIRET Validation (French Registration Number)', () => {
    it('should validate correct SIRET with Luhn checksum', () => {
      const result = validateSIRETForm('73282932000074');
      expect(result.valid).toBe(true);
    });

    it('should reject SIRET with wrong length', () => {
      const result = validateSIRETForm('123456');
      expect(result.valid).toBe(false);
    });

    it('should reject SIRET with invalid checksum', () => {
      const result = validateSIRETForm('73282932000075');
      expect(result.valid).toBe(false);
    });

    it('should accept SIRET with formatting characters', () => {
      const result = validateSIRETForm('732 829 320 000 74');
      expect(result.valid).toBe(true);
    });
  });

  describe('TVA Number Validation (French VAT)', () => {
    it('should validate correct French TVA number format', () => {
      const result = validateTVANumberForm('FR12345678901');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid TVA format', () => {
      const result = validateTVANumberForm('GB12345678901');
      expect(result.valid).toBe(false);
    });
  });

  describe('Schema-Based Validation', () => {
    it('should validate complete client data against schema', () => {
      const clientData = {
        id: '1',
        name: 'Acme Corp',
        email: 'contact@acmecorp.fr',
      };
      const result = validateWithSchema(ClientSchema, clientData);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid client data', () => {
      const invalidData = {
        id: '1',
        name: '', // Empty name should fail
        email: 'invalid-email',
      };
      const result = validateWithSchema(ClientSchema, invalidData);
      expect(result.valid).toBe(false);
    });
  });

  describe('Batch Validation Helpers', () => {
    it('should validate multiple fields at once', () => {
      const rules = {
        email: validateEmailForm,
        phone: validatePhoneForm,
      };
      const results = validateBatch({ email: 'test@example.com', phone: '0612345678' }, rules);
      expect(areAllValid(results)).toBe(true);
    });

    it('should detect partial validation failures', () => {
      const rules = {
        email: validateEmailForm,
        phone: validatePhoneForm,
      };
      const results = validateBatch({ email: 'invalid-email', phone: '0612345678' }, rules);
      expect(areAllValid(results)).toBe(false);
      expect(isValid(results.email)).toBe(false);
      expect(isValid(results.phone)).toBe(true);
    });
  });

  describe('Safe Parse Helper', () => {
    it('should parse valid data without throwing', () => {
      const validData = {
        id: '1',
        name: 'Test Company',
        email: 'test@example.com',
      };
      const parsed = safeParse(ClientSchema, validData);
      expect(parsed).toEqual(validData);
    });

    it('should return original data if parse fails', () => {
      const invalidData = {
        id: '1',
        name: '', // Invalid: empty name
        email: 'invalid',
      };
      const parsed = safeParse(ClientSchema, invalidData);
      expect(parsed).toEqual(invalidData); // Returns input as-is
    });
  });

  describe('Field Validator Creator', () => {
    it('should create working field validator', () => {
      const emailValidator = createFieldValidator(ClientSchema, 'email');
      const result = emailValidator('test@example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid field values', () => {
      const emailValidator = createFieldValidator(ClientSchema, 'email');
      const result = emailValidator('not-an-email');
      expect(result.valid).toBe(false);
    });
  });
});

describe('🔄 Backward Compatibility', () => {
  it('should export helper functions', () => {
    expect(validateBatch).toBeDefined();
    expect(areAllValid).toBeDefined();
    expect(isValid).toBeDefined();
    expect(validateEmailForm).toBeDefined();
    expect(validatePhoneForm).toBeDefined();
    expect(validateSIRETForm).toBeDefined();
    expect(validateTVANumberForm).toBeDefined();
  });

  it('should maintain ValidationResult type compatibility', () => {
    const result: ValidationResult = { valid: true };
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();

    const errorResult: ValidationResult = {
      valid: false,
      error: 'Validation failed',
    };
    expect(errorResult.valid).toBe(false);
    expect(errorResult.error).toBe('Validation failed');
  });
});
