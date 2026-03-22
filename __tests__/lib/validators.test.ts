/**
 * Tests pour le module de validation
 * Couvre tous les cas: valides, invalides, edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  validateSIRET,
  validateSIREN,
  validateIBAN,
  validateEmail,
  validateFrenchPostalCode,
  validateFrenchPhone,
  validateVATNumber,
  validateWebsite,
  validateName,
  validateAmount,
  validateDate,
  validateRequired,
  validateAddress,
  validateBatch,
  isValid,
  areAllValid,
} from '../../lib/validators';

describe('Validators - SIRET', () => {
  it('should validate correct SIRET', () => {
    const result = validateSIRET('73282932000074');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject SIRET with incorrect length', () => {
    const result = validateSIRET('123456789');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('14 chiffres');
  });

  it('should reject SIRET with non-digits', () => {
    const result = validateSIRET('7328293200007A');
    expect(result.valid).toBe(false);
  });

  it('should reject SIRET with repeated digits', () => {
    const result = validateSIRET('11111111111111');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('répétés');
  });

  it('should accept SIRET with spaces/dashes', () => {
    const result = validateSIRET('732 829 320 00074');
    expect(result.valid).toBe(true);
  });

  it('should reject empty SIRET', () => {
    const result = validateSIRET('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('obligatoire');
  });

  it('should reject invalid checksum', () => {
    const result = validateSIRET('73282932000075'); // Last digit wrong
    expect(result.valid).toBe(false);
  });
});

describe('Validators - SIREN', () => {
  it('should validate correct SIREN', () => {
    const result = validateSIREN('732829320');
    expect(result.valid).toBe(true);
  });

  it('should reject SIREN with incorrect length', () => {
    const result = validateSIREN('12345');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('9 chiffres');
  });

  it('should reject SIREN with repeated digits', () => {
    const result = validateSIREN('333333333');
    expect(result.valid).toBe(false);
  });

  it('should accept SIREN with formatting', () => {
    const result = validateSIREN('732 829 320');
    expect(result.valid).toBe(true);
  });
});

describe('Validators - IBAN', () => {
  it('should validate correct French IBAN', () => {
    const result = validateIBAN('FR1420041010050500013M02800');
    expect(result.valid).toBe(true);
  });

  it('should reject IBAN with incorrect checksum', () => {
    const result = validateIBAN('FR1420041010050500013M02801');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('checksum');
  });

  it('should reject IBAN with incorrect length for France', () => {
    const result = validateIBAN('FR142004101005050001');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('27 caractères');
  });

  it('should reject IBAN without country code', () => {
    const result = validateIBAN('20041010050500013M02800');
    expect(result.valid).toBe(false);
  });

  it('should accept IBAN with spaces', () => {
    const result = validateIBAN('FR14 2004 1010 0505 0001 3M02 800');
    expect(result.valid).toBe(true);
  });

  it('should validate German IBAN', () => {
    // Common German IBAN format (22 chars)
    const result = validateIBAN('DE89370400440532013000');
    expect(result.valid).toBe(true);
  });
});

describe('Validators - Email', () => {
  it('should validate standard email', () => {
    const result = validateEmail('contact@example.com');
    expect(result.valid).toBe(true);
  });

  it('should validate email with plus sign', () => {
    const result = validateEmail('test+tag@example.com');
    expect(result.valid).toBe(true);
  });

  it('should reject email without @', () => {
    const result = validateEmail('contactexample.com');
    expect(result.valid).toBe(false);
  });

  it('should reject email without domain', () => {
    const result = validateEmail('contact@');
    expect(result.valid).toBe(false);
  });

  it('should reject email with spaces', () => {
    const result = validateEmail('contact @example.com');
    expect(result.valid).toBe(false);
  });

  it('should reject email with double dot', () => {
    const result = validateEmail('contact..name@example.com');
    expect(result.valid).toBe(false);
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('obligatoire');
  });

  it('should reject very long email', () => {
    const longEmail = 'a'.repeat(100) + '@example.com';
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
  });
});

describe('Validators - French Postal Code', () => {
  it('should validate Paris postal code', () => {
    const result = validateFrenchPostalCode('75001');
    expect(result.valid).toBe(true);
  });

  it('should validate Marseille postal code', () => {
    const result = validateFrenchPostalCode('13000');
    expect(result.valid).toBe(true);
  });

  it('should validate Guadeloupe postal code', () => {
    const result = validateFrenchPostalCode('97110');
    expect(result.valid).toBe(true);
  });

  it('should reject postal code with non-digits', () => {
    const result = validateFrenchPostalCode('7500A');
    expect(result.valid).toBe(false);
  });

  it('should reject postal code with incorrect length', () => {
    const result = validateFrenchPostalCode('750');
    expect(result.valid).toBe(false);
  });

  it('should accept postal code with spaces', () => {
    const result = validateFrenchPostalCode('75 001');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid department code', () => {
    const result = validateFrenchPostalCode('96000'); // Invalid dept
    expect(result.valid).toBe(false);
  });
});

describe('Validators - French Phone', () => {
  it('should validate standard French phone', () => {
    const result = validateFrenchPhone('0123456789');
    expect(result.valid).toBe(true);
  });

  it('should validate mobile number', () => {
    const result = validateFrenchPhone('0612345678');
    expect(result.valid).toBe(true);
  });

  it('should validate phone with formatting', () => {
    const result = validateFrenchPhone('01-23-45-67-89');
    expect(result.valid).toBe(true);
  });

  it('should validate phone with spaces', () => {
    const result = validateFrenchPhone('01 23 45 67 89');
    expect(result.valid).toBe(true);
  });

  it('should reject phone without leading 0', () => {
    const result = validateFrenchPhone('1234567890');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('commencer par 0');
  });

  it('should reject phone with incorrect length', () => {
    const result = validateFrenchPhone('012345678');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10 chiffres');
  });

  it('should reject phone with invalid second digit', () => {
    const result = validateFrenchPhone('0023456789');
    expect(result.valid).toBe(false);
  });
});

describe('Validators - VAT Number', () => {
  it('should validate French VAT number', () => {
    const result = validateVATNumber('FR12345678901');
    expect(result.valid).toBe(true);
  });

  it('should validate French VAT with SIREN+2 chars', () => {
    const result = validateVATNumber('FR732829320AB');
    expect(result.valid).toBe(true);
  });

  it('should reject VAT without country code', () => {
    const result = validateVATNumber('12345678901');
    expect(result.valid).toBe(false);
  });

  it('should reject French VAT with wrong length', () => {
    const result = validateVATNumber('FR123456789'); // Only 9 digits after FR
    expect(result.valid).toBe(false);
  });

  it('should accept empty VAT (optional)', () => {
    const result = validateVATNumber('');
    expect(result.valid).toBe(true);
  });

  it('should accept VAT with spaces', () => {
    const result = validateVATNumber('FR 12 345 678 901');
    expect(result.valid).toBe(true);
  });
});

describe('Validators - Website', () => {
  it('should validate HTTP URL', () => {
    const result = validateWebsite('http://example.com');
    expect(result.valid).toBe(true);
  });

  it('should validate HTTPS URL', () => {
    const result = validateWebsite('https://www.example.com');
    expect(result.valid).toBe(true);
  });

  it('should reject FTP URL', () => {
    const result = validateWebsite('ftp://example.com');
    expect(result.valid).toBe(false);
  });

  it('should accept empty website (optional)', () => {
    const result = validateWebsite('');
    expect(result.valid).toBe(true);
  });

  it('should reject URL without protocol', () => {
    const result = validateWebsite('example.com');
    expect(result.valid).toBe(false);
  });
});

describe('Validators - Name', () => {
  it('should validate standard name', () => {
    const result = validateName('John Doe');
    expect(result.valid).toBe(true);
  });

  it('should validate name with accents', () => {
    const result = validateName('François Müller');
    expect(result.valid).toBe(true);
  });

  it('should validate name with hyphen', () => {
    const result = validateName("Jean-Claude O'Brien");
    expect(result.valid).toBe(true);
  });

  it('should reject single character name', () => {
    const result = validateName('A');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2 caractères');
  });

  it('should reject empty name', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
  });

  it('should reject very long name', () => {
    const result = validateName('A'.repeat(200));
    expect(result.valid).toBe(false);
  });
});

describe('Validators - Amount', () => {
  it('should validate positive amount', () => {
    const result = validateAmount('100.50');
    expect(result.valid).toBe(true);
  });

  it('should validate integer amount', () => {
    const result = validateAmount('100');
    expect(result.valid).toBe(true);
  });

  it('should validate zero', () => {
    const result = validateAmount('0');
    expect(result.valid).toBe(true);
  });

  it('should validate numeric amount', () => {
    const result = validateAmount(100.50);
    expect(result.valid).toBe(true);
  });

  it('should reject negative amount', () => {
    const result = validateAmount('-100');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('positif');
  });

  it('should reject too many decimals', () => {
    const result = validateAmount('100.999');
    expect(result.valid).toBe(false);
  });

  it('should reject empty amount', () => {
    const result = validateAmount('');
    expect(result.valid).toBe(false);
  });

  it('should reject non-numeric amount', () => {
    const result = validateAmount('abc');
    expect(result.valid).toBe(false);
  });
});

describe('Validators - Date', () => {
  it('should validate ISO date string', () => {
    const result = validateDate('2024-03-21');
    expect(result.valid).toBe(true);
  });

  it('should validate Date object', () => {
    const result = validateDate(new Date());
    expect(result.valid).toBe(true);
  });

  it('should reject invalid date string', () => {
    const result = validateDate('invalid');
    expect(result.valid).toBe(false);
  });

  it('should reject empty date', () => {
    const result = validateDate('');
    expect(result.valid).toBe(false);
  });

  it('should reject date too far in past', () => {
    const result = validateDate('1800-01-01');
    expect(result.valid).toBe(false);
  });

  it('should reject date too far in future', () => {
    const result = validateDate('2150-01-01');
    expect(result.valid).toBe(false);
  });
});

describe('Validators - Required', () => {
  it('should validate non-empty string', () => {
    const result = validateRequired('test');
    expect(result.valid).toBe(true);
  });

  it('should validate number', () => {
    const result = validateRequired(123);
    expect(result.valid).toBe(true);
  });

  it('should reject empty string', () => {
    const result = validateRequired('');
    expect(result.valid).toBe(false);
  });

  it('should reject whitespace only', () => {
    const result = validateRequired('   ');
    expect(result.valid).toBe(false);
  });

  it('should reject undefined', () => {
    const result = validateRequired(undefined);
    expect(result.valid).toBe(false);
  });
});

describe('Validators - Address', () => {
  it('should validate standard address', () => {
    const result = validateAddress('123 Main Street');
    expect(result.valid).toBe(true);
  });

  it('should reject too short address', () => {
    const result = validateAddress('123');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5 caractères');
  });

  it('should reject empty address', () => {
    const result = validateAddress('');
    expect(result.valid).toBe(false);
  });

  it('should reject very long address', () => {
    const result = validateAddress('A'.repeat(300));
    expect(result.valid).toBe(false);
  });
});

describe('Validators - Batch validation', () => {
  it('should validate multiple fields', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      amount: '100.50',
    };

    const rules = {
      name: validateName,
      email: validateEmail,
      amount: validateAmount,
    };

    const results = validateBatch(data, rules);

    expect(results.name.valid).toBe(true);
    expect(results.email.valid).toBe(true);
    expect(results.amount.valid).toBe(true);
  });

  it('should report multiple errors', () => {
    const data = {
      name: 'A',
      email: 'invalid-email',
      amount: '-100',
    };

    const rules = {
      name: validateName,
      email: validateEmail,
      amount: validateAmount,
    };

    const results = validateBatch(data, rules);

    expect(results.name.valid).toBe(false);
    expect(results.email.valid).toBe(false);
    expect(results.amount.valid).toBe(false);
  });
});

describe('Validators - Utility functions', () => {
  it('isValid should return true for valid result', () => {
    const result = { valid: true };
    expect(isValid(result)).toBe(true);
  });

  it('isValid should return false for invalid result', () => {
    const result = { valid: false, error: 'Error' };
    expect(isValid(result)).toBe(false);
  });

  it('areAllValid should return true when all valid', () => {
    const results = {
      field1: { valid: true },
      field2: { valid: true },
      field3: { valid: true },
    };

    expect(areAllValid(results)).toBe(true);
  });

  it('areAllValid should return false when any invalid', () => {
    const results = {
      field1: { valid: true },
      field2: { valid: false, error: 'Error' },
      field3: { valid: true },
    };

    expect(areAllValid(results)).toBe(false);
  });
});
