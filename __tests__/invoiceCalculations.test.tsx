import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateInvoiceTax,
  calculateHTFromTTC,
  calculateMicroEntrepreneurCharges,
  calculateFullInvoice,
  applyDiscount,
  applyFixedDiscount,
  formatCurrency,
  roundToCents,
  isWithinMicroThreshold,
  MICRO_THRESHOLDS,
  SOCIAL_CONTRIBUTION_RATES,
  VAT_RATES,
  MICRO_INCOME_TAX_RATE,
} from '../lib/invoiceCalculations';

/**
 * Suite de tests complète pour les calculs de factures
 * Couverture 100% des fonctions et branches logiques
 */

// ============================================================================
// TESTS: calculateInvoiceTax
// ============================================================================

describe('calculateInvoiceTax', () => {
  describe('Cas normaux', () => {
    it('calcule correctement la TVA avec taux normal (20%)', () => {
      const result = calculateInvoiceTax({
        amountHT: 100,
        taxRate: VAT_RATES.NORMAL,
      });

      expect(result.amountHT).toEqual(new Decimal('100'));
      expect(result.tva).toEqual(new Decimal('20'));
      expect(result.amountTTC).toEqual(new Decimal('120'));
      expect(result.taxRate).toBe(20);
    });

    it('calcule correctement la TVA avec taux réduit (5.5%)', () => {
      const result = calculateInvoiceTax({
        amountHT: 200,
        taxRate: VAT_RATES.REDUCED,
      });

      expect(result.tva).toEqual(new Decimal('11'));
      expect(result.amountTTC).toEqual(new Decimal('211'));
    });

    it('calcule correctement la TVA avec taux super réduit (2.1%)', () => {
      const result = calculateInvoiceTax({
        amountHT: 1000,
        taxRate: VAT_RATES.REDUCED_LOW,
      });

      expect(result.tva).toEqual(new Decimal('21'));
      expect(result.amountTTC).toEqual(new Decimal('1021'));
    });

    it('calcule correctement avec TVA exonérée (0%)', () => {
      const result = calculateInvoiceTax({
        amountHT: 500,
        taxRate: VAT_RATES.EXEMPT,
      });

      expect(result.tva).toEqual(new Decimal('0'));
      expect(result.amountTTC).toEqual(new Decimal('500'));
    });

    it('accepte les entrées Decimal', () => {
      const result = calculateInvoiceTax({
        amountHT: new Decimal('99.99'),
        taxRate: 20,
      });

      expect(result.amountHT).toEqual(new Decimal('99.99'));
      expect(result.tva).toEqual(new Decimal('20'));
      expect(result.amountTTC).toEqual(new Decimal('119.99'));
    });

    it('accepte les entrées string', () => {
      const result = calculateInvoiceTax({
        amountHT: '150.50',
        taxRate: 20,
      });

      expect(result.amountHT).toEqual(new Decimal('150.50'));
      expect(result.tva).toEqual(new Decimal('30.10'));
    });

    it('arrondit correctement à 2 décimales', () => {
      const result = calculateInvoiceTax({
        amountHT: 33.33,
        taxRate: 20,
      });

      expect(result.tva.toString()).toContain('6.67');
      expect(result.amountTTC.decimalPlaces()).toBeLessThanOrEqual(2);
    });

    it('gère les montants décimaux complexes', () => {
      const result = calculateInvoiceTax({
        amountHT: '1234.56',
        taxRate: 20,
      });

      expect(result.tva).toEqual(new Decimal('246.912').toDecimalPlaces(2));
      expect(result.amountTTC).toEqual(new Decimal('1481.472').toDecimalPlaces(2));
    });
  });

  describe('Validation des entrées', () => {
    it('rejette les montants négatifs', () => {
      expect(() => {
        calculateInvoiceTax({
          amountHT: -100,
          taxRate: 20,
        });
      }).toThrow('Le montant HT ne peut pas être négatif');
    });

    it('rejette les taux de TVA invalides', () => {
      expect(() => {
        calculateInvoiceTax({
          amountHT: 100,
          taxRate: 15, // Taux invalide
        });
      }).toThrow('Taux de TVA invalide');
    });

    it('accepte le montant 0', () => {
      const result = calculateInvoiceTax({
        amountHT: 0,
        taxRate: 20,
      });

      expect(result.tva).toEqual(new Decimal('0'));
      expect(result.amountTTC).toEqual(new Decimal('0'));
    });
  });

  describe('Types de retour', () => {
    it('retourne un objet InvoiceCalculationResult valide', () => {
      const result = calculateInvoiceTax({
        amountHT: 100,
        taxRate: 20,
      });

      expect(result).toHaveProperty('amountHT');
      expect(result).toHaveProperty('tva');
      expect(result).toHaveProperty('amountTTC');
      expect(result).toHaveProperty('taxRate');
      expect(result.amountHT instanceof Decimal).toBe(true);
      expect(result.tva instanceof Decimal).toBe(true);
      expect(result.amountTTC instanceof Decimal).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: calculateHTFromTTC
// ============================================================================

describe('calculateHTFromTTC', () => {
  describe('Cas normaux', () => {
    it('retrouve HT à partir de TTC avec taux 20%', () => {
      const result = calculateHTFromTTC(120, 20);
      expect(result).toEqual(new Decimal('100'));
    });

    it('retrouve HT à partir de TTC avec taux 5.5%', () => {
      const result = calculateHTFromTTC(211, 5.5);
      expect(result).toEqual(new Decimal('200'));
    });

    it('retrouve HT avec TVA exonérée', () => {
      const result = calculateHTFromTTC(500, 0);
      expect(result).toEqual(new Decimal('500'));
    });

    it('retrouve HT avec montants décimaux complexes', () => {
      const result = calculateHTFromTTC('1481.47', 20);
      expect(result.toString()).toMatch(/^1234\.56/);
    });

    it('accepte les entrées Decimal', () => {
      const result = calculateHTFromTTC(new Decimal('120'), 20);
      expect(result).toEqual(new Decimal('100'));
    });

    it('accepte les entrées string', () => {
      const result = calculateHTFromTTC('120', 20);
      expect(result).toEqual(new Decimal('100'));
    });

    it('arrondit correctement à 2 décimales', () => {
      const result = calculateHTFromTTC('150.75', 20);
      expect(result.decimalPlaces()).toBeLessThanOrEqual(2);
    });
  });

  describe('Validation des entrées', () => {
    it('rejette les montants TTC négatifs', () => {
      expect(() => {
        calculateHTFromTTC(-100, 20);
      }).toThrow('Le montant TTC ne peut pas être négatif');
    });

    it('accepte montant 0', () => {
      const result = calculateHTFromTTC(0, 20);
      expect(result).toEqual(new Decimal('0'));
    });
  });

  describe('Réciprocité avec calculateInvoiceTax', () => {
    it("est l'inverse de calculateInvoiceTax", () => {
      const original = calculateInvoiceTax({
        amountHT: 500.75,
        taxRate: 20,
      });

      const recovered = calculateHTFromTTC(original.amountTTC, 20);
      expect(recovered).toEqual(original.amountHT);
    });

    it('récupère correctement avec taux variable', () => {
      [20, 5.5, 2.1, 0].forEach((taxRate) => {
        const original = calculateInvoiceTax({
          amountHT: 1000,
          taxRate,
        });

        const recovered = calculateHTFromTTC(original.amountTTC, taxRate);
        expect(recovered).toEqual(original.amountHT);
      });
    });
  });
});

// ============================================================================
// TESTS: calculateMicroEntrepreneurCharges
// ============================================================================

describe('calculateMicroEntrepreneurCharges', () => {
  describe('Cas normaux - Prestataires (SERVICES)', () => {
    it('calcule correctement les charges pour type SERVICES', () => {
      const result = calculateMicroEntrepreneurCharges(50000, 'SERVICES');

      expect(result.revenue).toEqual(new Decimal('50000'));
      expect(result.socialContributions).toEqual(
        new Decimal(50000 * SOCIAL_CONTRIBUTION_RATES.SERVICES).toDecimalPlaces(2)
      );
      expect(result.incomeTax).toEqual(
        new Decimal(50000 * MICRO_INCOME_TAX_RATE).toDecimalPlaces(2)
      );
      expect(result.exceedsThreshold).toBe(false);
      expect(result.excessAmount).toEqual(new Decimal('0'));
    });

    it('applique le taux de cotisations SERVICES (23.2%)', () => {
      const result = calculateMicroEntrepreneurCharges(10000, 'SERVICES');

      const expectedCotisations = new Decimal(10000)
        .times(new Decimal(SOCIAL_CONTRIBUTION_RATES.SERVICES))
        .toDecimalPlaces(2);

      expect(result.socialContributions).toEqual(expectedCotisations);
    });

    it("calcule correctement l'impôt sur le revenu (22%)", () => {
      const result = calculateMicroEntrepreneurCharges(10000, 'SERVICES');

      const expectedTax = new Decimal(10000 * MICRO_INCOME_TAX_RATE).toDecimalPlaces(2);
      expect(result.incomeTax).toEqual(expectedTax);
    });

    it('calcule le revenu net correct', () => {
      const result = calculateMicroEntrepreneurCharges(10000, 'SERVICES');

      const expected = new Decimal(10000)
        .minus(result.socialContributions)
        .minus(result.incomeTax)
        .toDecimalPlaces(2);

      expect(result.netIncome).toEqual(expected);
    });
  });

  describe('Cas normaux - Commerçants (SALES)', () => {
    it('calcule correctement les charges pour type SALES', () => {
      const result = calculateMicroEntrepreneurCharges(100000, 'SALES');

      expect(result.revenue).toEqual(new Decimal('100000'));
      expect(result.socialContributions).toEqual(
        new Decimal(100000 * SOCIAL_CONTRIBUTION_RATES.SALES).toDecimalPlaces(2)
      );
    });

    it('applique le taux de cotisations SALES (12.5%)', () => {
      const result = calculateMicroEntrepreneurCharges(10000, 'SALES');

      const expectedCotisations = new Decimal(10000)
        .times(new Decimal(SOCIAL_CONTRIBUTION_RATES.SALES))
        .toDecimalPlaces(2);

      expect(result.socialContributions).toEqual(expectedCotisations);
    });
  });

  describe('Cas normaux - Artisans (CRAFTS)', () => {
    it('calcule correctement les charges pour type CRAFTS', () => {
      const result = calculateMicroEntrepreneurCharges(10000, 'CRAFTS');

      const expectedCotisations = new Decimal(10000)
        .times(new Decimal(SOCIAL_CONTRIBUTION_RATES.CRAFTS))
        .toDecimalPlaces(2);

      expect(result.socialContributions).toEqual(expectedCotisations);
    });

    it('applique le taux de cotisations CRAFTS (24.8%)', () => {
      const result = calculateMicroEntrepreneurCharges(10000, 'CRAFTS');

      expect(result.socialContributions).toEqual(
        new Decimal(10000 * SOCIAL_CONTRIBUTION_RATES.CRAFTS).toDecimalPlaces(2)
      );
    });
  });

  describe('Seuils micro-entrepreneur', () => {
    it('détecte pas de dépassement SERVICES en dessous du seuil', () => {
      const result = calculateMicroEntrepreneurCharges(77700, 'SERVICES');

      expect(result.exceedsThreshold).toBe(false);
      expect(result.excessAmount).toEqual(new Decimal('0'));
    });

    it('détecte le dépassement SERVICES au-dessus du seuil', () => {
      const result = calculateMicroEntrepreneurCharges(80000, 'SERVICES');

      expect(result.exceedsThreshold).toBe(true);
      expect(result.excessAmount).toEqual(new Decimal('2300'));
    });

    it('calcule correctement le dépassement exactement au seuil', () => {
      const result = calculateMicroEntrepreneurCharges(77701, 'SERVICES');

      expect(result.exceedsThreshold).toBe(true);
      expect(result.excessAmount).toEqual(new Decimal('1'));
    });

    it('détecte pas de dépassement SALES en dessous du seuil', () => {
      const result = calculateMicroEntrepreneurCharges(311900, 'SALES');

      expect(result.exceedsThreshold).toBe(false);
      expect(result.excessAmount).toEqual(new Decimal('0'));
    });

    it('détecte le dépassement SALES au-dessus du seuil', () => {
      const result = calculateMicroEntrepreneurCharges(400000, 'SALES');

      expect(result.exceedsThreshold).toBe(true);
      expect(result.excessAmount).toEqual(new Decimal('88100'));
    });

    it('détecte pas de dépassement avec type par défaut (SERVICES)', () => {
      const result = calculateMicroEntrepreneurCharges(50000);

      expect(result.exceedsThreshold).toBe(false);
    });
  });

  describe("Formats d'entrée", () => {
    it('accepte les nombres', () => {
      const result = calculateMicroEntrepreneurCharges(10000, 'SERVICES');
      expect(result.revenue).toEqual(new Decimal('10000'));
    });

    it('accepte les strings', () => {
      const result = calculateMicroEntrepreneurCharges('10000', 'SERVICES');
      expect(result.revenue).toEqual(new Decimal('10000'));
    });

    it('accepte les Decimal', () => {
      const result = calculateMicroEntrepreneurCharges(new Decimal('10000'), 'SERVICES');
      expect(result.revenue).toEqual(new Decimal('10000'));
    });

    it('accepte les montants décimaux', () => {
      const result = calculateMicroEntrepreneurCharges(10000.5, 'SERVICES');
      expect(result.revenue).toEqual(new Decimal('10000.50'));
    });
  });

  describe('Validation des entrées', () => {
    it('rejette les montants négatifs', () => {
      expect(() => {
        calculateMicroEntrepreneurCharges(-10000, 'SERVICES');
      }).toThrow("Le chiffre d'affaires ne peut pas être négatif");
    });

    it('accepte montant 0', () => {
      const result = calculateMicroEntrepreneurCharges(0, 'SERVICES');

      expect(result.revenue).toEqual(new Decimal('0'));
      expect(result.socialContributions).toEqual(new Decimal('0'));
      expect(result.incomeTax).toEqual(new Decimal('0'));
      expect(result.netIncome).toEqual(new Decimal('0'));
    });
  });

  describe('Types de retour', () => {
    it('retourne un objet MicroEntrepreneurTaxResult valide', () => {
      const result = calculateMicroEntrepreneurCharges(10000, 'SERVICES');

      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('incomeTax');
      expect(result).toHaveProperty('socialContributions');
      expect(result).toHaveProperty('netIncome');
      expect(result).toHaveProperty('exceedsThreshold');
      expect(result).toHaveProperty('excessAmount');

      expect(result.revenue instanceof Decimal).toBe(true);
      expect(result.incomeTax instanceof Decimal).toBe(true);
      expect(result.socialContributions instanceof Decimal).toBe(true);
      expect(result.netIncome instanceof Decimal).toBe(true);
      expect(result.excessAmount instanceof Decimal).toBe(true);
    });
  });
});

// ============================================================================
// TESTS: calculateFullInvoice
// ============================================================================

describe('calculateFullInvoice', () => {
  it('calcule facture complète sans charges', () => {
    const result = calculateFullInvoice({
      amountHT: 100,
      taxRate: 20,
      includeContributions: false,
    });

    expect(result.amountHT).toEqual(new Decimal('100'));
    expect(result.tva).toEqual(new Decimal('20'));
    expect(result.amountTTC).toEqual(new Decimal('120'));
    expect(result.charges).toBeNull();
  });

  it('calcule facture complète avec charges', () => {
    const result = calculateFullInvoice({
      amountHT: 100,
      taxRate: 20,
      includeContributions: true,
      businessType: 'SERVICES',
    });

    expect(result.amountHT).toEqual(new Decimal('100'));
    expect(result.tva).toEqual(new Decimal('20'));
    expect(result.amountTTC).toEqual(new Decimal('120'));
    expect(result.charges).not.toBeNull();
    expect(result.charges?.revenue).toEqual(new Decimal('120'));
  });

  it('applique le businessType correct aux charges', () => {
    const resultServices = calculateFullInvoice({
      amountHT: 10000,
      taxRate: 20,
      includeContributions: true,
      businessType: 'SERVICES',
    });

    const resultSales = calculateFullInvoice({
      amountHT: 10000,
      taxRate: 20,
      includeContributions: true,
      businessType: 'SALES',
    });

    expect(resultServices.charges?.socialContributions).not.toEqual(
      resultSales.charges?.socialContributions
    );
  });

  it('utilise SERVICES comme défaut', () => {
    const result = calculateFullInvoice({
      amountHT: 100,
      taxRate: 20,
      includeContributions: true,
    });

    expect(result.charges).not.toBeNull();
  });
});

// ============================================================================
// TESTS: applyDiscount
// ============================================================================

describe('applyDiscount', () => {
  it('applique une remise en pourcentage simple', () => {
    const result = applyDiscount(100, 10);
    expect(result).toEqual(new Decimal('90'));
  });

  it('applique une remise de 50%', () => {
    const result = applyDiscount(200, 50);
    expect(result).toEqual(new Decimal('100'));
  });

  it('applique une remise de 0%', () => {
    const result = applyDiscount(150, 0);
    expect(result).toEqual(new Decimal('150'));
  });

  it('applique une remise de 100%', () => {
    const result = applyDiscount(100, 100);
    expect(result).toEqual(new Decimal('0'));
  });

  it('accepte les entrées Decimal', () => {
    const result = applyDiscount(new Decimal('100'), 10);
    expect(result).toEqual(new Decimal('90'));
  });

  it('accepte les entrées string', () => {
    const result = applyDiscount('100', 10);
    expect(result).toEqual(new Decimal('90'));
  });

  it('gère les pourcentages décimaux', () => {
    const result = applyDiscount(100, 15.5);
    expect(result).toEqual(new Decimal('84.50'));
  });

  it('arrondit correctement à 2 décimales', () => {
    const result = applyDiscount(33.33, 10);
    expect(result.decimalPlaces()).toBeLessThanOrEqual(2);
  });

  it('rejette les pourcentages négatifs', () => {
    expect(() => {
      applyDiscount(100, -10);
    }).toThrow('Le pourcentage de remise doit être entre 0 et 100');
  });

  it('rejette les pourcentages > 100', () => {
    expect(() => {
      applyDiscount(100, 150);
    }).toThrow('Le pourcentage de remise doit être entre 0 et 100');
  });
});

// ============================================================================
// TESTS: applyFixedDiscount
// ============================================================================

describe('applyFixedDiscount', () => {
  it('applique une remise fixe simple', () => {
    const result = applyFixedDiscount(100, 20);
    expect(result).toEqual(new Decimal('80'));
  });

  it('applique une remise fixe égale au montant', () => {
    const result = applyFixedDiscount(100, 100);
    expect(result).toEqual(new Decimal('0'));
  });

  it('applique une remise fixe de 0', () => {
    const result = applyFixedDiscount(100, 0);
    expect(result).toEqual(new Decimal('100'));
  });

  it('accepte les entrées Decimal', () => {
    const result = applyFixedDiscount(new Decimal('100'), new Decimal('20'));
    expect(result).toEqual(new Decimal('80'));
  });

  it('accepte les entrées string', () => {
    const result = applyFixedDiscount('100', '20');
    expect(result).toEqual(new Decimal('80'));
  });

  it('gère les montants décimaux', () => {
    const result = applyFixedDiscount(99.99, 25.5);
    expect(result).toEqual(new Decimal('74.49'));
  });

  it('arrondit correctement à 2 décimales', () => {
    const result = applyFixedDiscount(100.5, 25.33);
    expect(result.decimalPlaces()).toBeLessThanOrEqual(2);
  });

  it('rejette les remises négatives', () => {
    expect(() => {
      applyFixedDiscount(100, -20);
    }).toThrow('Le montant de remise ne peut pas être négatif');
  });

  it('rejette les remises supérieures au montant', () => {
    expect(() => {
      applyFixedDiscount(100, 150);
    }).toThrow('La remise ne peut pas dépasser le montant HT');
  });
});

// ============================================================================
// TESTS: formatCurrency
// ============================================================================

describe('formatCurrency', () => {
  it('formate un montant simple', () => {
    const result = formatCurrency(100);
    expect(result).toBe('100.00 €');
  });

  it('formate avec 2 décimales', () => {
    const result = formatCurrency(99.5);
    expect(result).toBe('99.50 €');
  });

  it('formate un montant Decimal', () => {
    const result = formatCurrency(new Decimal('123.45'));
    expect(result).toBe('123.45 €');
  });

  it('formate une string', () => {
    const result = formatCurrency('456.78');
    expect(result).toBe('456.78 €');
  });

  it('formate montant 0', () => {
    const result = formatCurrency(0);
    expect(result).toBe('0.00 €');
  });

  it('formate montants complexes', () => {
    const result = formatCurrency(1234.56);
    expect(result).toBe('1234.56 €');
  });
});

// ============================================================================
// TESTS: roundToCents
// ============================================================================

describe('roundToCents', () => {
  it('arrondit à la deuxième décimale', () => {
    const result = roundToCents(100.555);
    expect(result.decimalPlaces()).toBe(2);
  });

  it('arrondit vers le haut correctement', () => {
    const result = roundToCents(100.125);
    expect(result.toString()).toBe('100.13');
  });

  it('arrondit vers le bas correctement', () => {
    const result = roundToCents(100.124);
    expect(result.toString()).toBe('100.12');
  });

  it('accepte les Decimal', () => {
    const result = roundToCents(new Decimal('100.555'));
    expect(result.toString()).toBe('100.56');
  });

  it('accepte les strings', () => {
    const result = roundToCents('100.555');
    expect(result.toString()).toBe('100.56');
  });

  it('gère les montants déjà arrondis', () => {
    const result = roundToCents(100.5);
    expect(result).toEqual(new Decimal('100.50'));
  });

  it('gère montant 0', () => {
    const result = roundToCents(0);
    expect(result).toEqual(new Decimal('0'));
  });
});

// ============================================================================
// TESTS: isWithinMicroThreshold
// ============================================================================

describe('isWithinMicroThreshold', () => {
  describe('Type SERVICES', () => {
    it('retourne true en dessous du seuil', () => {
      const result = isWithinMicroThreshold(50000, 'SERVICES');
      expect(result).toBe(true);
    });

    it('retourne true exactement à la limite', () => {
      const result = isWithinMicroThreshold(MICRO_THRESHOLDS.SERVICES, 'SERVICES');
      expect(result).toBe(true);
    });

    it('retourne false au-dessus du seuil', () => {
      const result = isWithinMicroThreshold(100000, 'SERVICES');
      expect(result).toBe(false);
    });
  });

  describe('Type SALES', () => {
    it('retourne true en dessous du seuil', () => {
      const result = isWithinMicroThreshold(100000, 'SALES');
      expect(result).toBe(true);
    });

    it('retourne true exactement à la limite', () => {
      const result = isWithinMicroThreshold(MICRO_THRESHOLDS.SALES, 'SALES');
      expect(result).toBe(true);
    });

    it('retourne false au-dessus du seuil', () => {
      const result = isWithinMicroThreshold(500000, 'SALES');
      expect(result).toBe(false);
    });
  });

  describe('Type par défaut', () => {
    it('utilise SERVICES par défaut', () => {
      const result = isWithinMicroThreshold(77700);
      expect(result).toBe(true);

      const result2 = isWithinMicroThreshold(77701);
      expect(result2).toBe(false);
    });
  });

  describe("Formats d'entrée", () => {
    it('accepte les nombres', () => {
      const result = isWithinMicroThreshold(50000, 'SERVICES');
      expect(typeof result).toBe('boolean');
    });

    it('accepte les strings', () => {
      const result = isWithinMicroThreshold('50000', 'SERVICES');
      expect(result).toBe(true);
    });

    it('accepte les Decimal', () => {
      const result = isWithinMicroThreshold(new Decimal('50000'), 'SERVICES');
      expect(result).toBe(true);
    });
  });

  describe('Cas limite', () => {
    it('gère montant 0', () => {
      const result = isWithinMicroThreshold(0, 'SERVICES');
      expect(result).toBe(true);
    });

    it('gère juste au-dessus du seuil', () => {
      const justAbove = MICRO_THRESHOLDS.SERVICES + 1;
      const result = isWithinMicroThreshold(justAbove, 'SERVICES');
      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// TESTS: Constantes
// ============================================================================

describe('Constantes fiscales', () => {
  it('MICRO_THRESHOLDS contient les bonnes valeurs', () => {
    expect(MICRO_THRESHOLDS.SERVICES).toBe(77_700);
    expect(MICRO_THRESHOLDS.SALES).toBe(311_900);
  });

  it('SOCIAL_CONTRIBUTION_RATES contient les bonnes valeurs', () => {
    expect(SOCIAL_CONTRIBUTION_RATES.SERVICES).toBe(0.232);
    expect(SOCIAL_CONTRIBUTION_RATES.SALES).toBe(0.125);
    expect(SOCIAL_CONTRIBUTION_RATES.CRAFTS).toBe(0.248);
  });

  it('VAT_RATES contient les taux français', () => {
    expect(VAT_RATES.NORMAL).toBe(20);
    expect(VAT_RATES.REDUCED).toBe(5.5);
    expect(VAT_RATES.REDUCED_LOW).toBe(2.1);
    expect(VAT_RATES.EXEMPT).toBe(0);
  });

  it('MICRO_INCOME_TAX_RATE est correct', () => {
    expect(MICRO_INCOME_TAX_RATE).toBe(0.22);
  });
});

// ============================================================================
// TESTS: Intégration (workflows complets)
// ============================================================================

describe('Intégration - Workflows complets', () => {
  it('calcule une facture complète du début à la fin', () => {
    // Budget initial: 5000€
    const amountHT = 5000;

    // Appliquer une remise de 10%
    const discountedAmount = applyDiscount(amountHT, 10);
    expect(discountedAmount).toEqual(new Decimal('4500'));

    // Calculer TVA (20%)
    const invoice = calculateInvoiceTax({
      amountHT: discountedAmount,
      taxRate: 20,
    });
    expect(invoice.amountTTC).toEqual(new Decimal('5400'));

    // Calculer charges
    const charges = calculateMicroEntrepreneurCharges(invoice.amountTTC, 'SERVICES');
    expect(charges.netIncome.greaterThan(0)).toBe(true);
  });

  it('gère un devis qui devient facture payante', () => {
    const quoteAmount = 3000;
    const accepted = true;

    if (accepted) {
      const invoiced = calculateInvoiceTax({
        amountHT: quoteAmount,
        taxRate: 20,
      });

      const formatted = formatCurrency(invoiced.amountTTC);
      expect(formatted).toContain('€');
    }
  });

  it('réclame une remise et recalcule tous les montants', () => {
    const originalAmount = 10000;
    const discountRequest = 5; // 5%

    const discountedAmount = applyDiscount(originalAmount, discountRequest);
    const invoice = calculateInvoiceTax({
      amountHT: discountedAmount,
      taxRate: 20,
    });

    expect(invoice.amountTTC).toEqual(new Decimal('11400'));
  });

  it('récupère HT depuis une facture complète envoyée', () => {
    const originalInvoice = calculateInvoiceTax({
      amountHT: 2500,
      taxRate: 20,
    });

    // On ne garde que le montant TTC
    const ttcOnly = originalInvoice.amountTTC;

    // On récupère le HT
    const recoveredHT = calculateHTFromTTC(ttcOnly, 20);
    expect(recoveredHT).toEqual(originalInvoice.amountHT);
  });
});
