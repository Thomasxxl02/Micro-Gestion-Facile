import { describe, it, expect } from 'vitest';
import { calculateSocialContributions, calculateIncomeTaxPFL, getThresholds, calculateThresholdStatus } from '../lib/fiscalCalculations';
import type { UserProfile, ActivityType } from '../types';

describe('fiscalCalculations', () => {
  const mockProfile: UserProfile = {
    companyName: 'Test Company',
    siret: '12345678901234',
    address: '123 Test St',
    email: 'test@example.com',
    phone: '0102030405',
    activityType: 'SERVICE_BNC' as ActivityType,
    isAcreBeneficiary: false
  };

  describe('calculateSocialContributions', () => {
    it('calcule correctement les cotisations pour SERVICE_BNC au taux standard', () => {
      const revenue = 1000;
      const result = calculateSocialContributions(revenue, { ...mockProfile, activityType: 'SERVICE_BNC' });

      expect(result.rate).toBe(23.2);
      expect(result.amount).toBe(232);
      expect(result.netRevenue).toBe(768);
      expect(result.isAcreApplied).toBe(false);
    });

    it('calcule correctement les cotisations pour SALE au taux standard', () => {
      const revenue = 1000;
      const result = calculateSocialContributions(revenue, { ...mockProfile, activityType: 'SALE' });

      expect(result.rate).toBe(12.3);
      expect(result.amount).toBe(123);
      expect(result.netRevenue).toBe(877);
    });

    it('calcule correctement les cotisations pour SERVICE_BIC at standard rate', () => {
      const revenue = 1000;
      const result = calculateSocialContributions(revenue, { ...mockProfile, activityType: 'SERVICE_BIC' });

      expect(result.rate).toBe(21.2);
      expect(result.amount).toBe(212);
      expect(result.netRevenue).toBe(788);
    });

    it('applique le taux ACRE si l\'utilisateur est bénéficiaire', () => {
      const revenue = 1000;
      const profileWithAcre: UserProfile = { ...mockProfile, activityType: 'SERVICE_BNC', isAcreBeneficiary: true };
      const result = calculateSocialContributions(revenue, profileWithAcre);

      expect(result.rate).toBe(12.1);
      expect(result.amount).toBe(121);
      expect(result.isAcreApplied).toBe(true);
    });

    it('utilise SERVICE_BNC par défaut si le type d\'activité n\'est pas spécifié', () => {
      const revenue = 1000;
      const incompleteProfile = { ...mockProfile } as UserProfile;
      delete incompleteProfile.activityType;

      const result = calculateSocialContributions(revenue, incompleteProfile);
      expect(result.rate).toBe(23.2);
    });
  });

  describe('calculateIncomeTaxPFL', () => {
    it('calcule le PFL pour SERVICE_BNC', () => {
      const revenue = 1000;
      const tax = calculateIncomeTaxPFL(revenue, 'SERVICE_BNC');
      expect(tax).toBe(22); // 2.2%
    });

    it('calcule le PFL pour SALE', () => {
      const revenue = 1000;
      const tax = calculateIncomeTaxPFL(revenue, 'SALE');
      expect(tax).toBe(10); // 1.0%
    });

    it('calcule le PFL pour SERVICE_BIC', () => {
      const revenue = 1000;
      const tax = calculateIncomeTaxPFL(revenue, 'SERVICE_BIC');
      expect(tax).toBe(17); // 1.7%
    });
  });

  describe('getThresholds', () => {
    it('retourne les seuils pour les prestations de services', () => {
      const thresholds = getThresholds('SERVICE_BNC');
      expect(thresholds.micro).toBe(77700);
      expect(thresholds.tva).toBe(36800);
    });

    it('retourne les seuils pour la vente de marchandises', () => {
      const thresholds = getThresholds('SALE');
      expect(thresholds.micro).toBe(188700);
      expect(thresholds.tva).toBe(91900);
    });
  });

  describe('calculateThresholdStatus', () => {
    it('calcule correctement le statut pour le dépassement de seuil micro', () => {
      const revenue = 80000;
      const status = calculateThresholdStatus(revenue, 'SERVICE_BNC');

      expect(status.micro.isExceeded).toBe(true);
      expect(status.micro.percentage).toBeGreaterThan(100);
      expect(status.micro.remaining).toBe(0);
    });

    it('calcule correctement le statut pour un chiffre d\'affaires bas', () => {
      const revenue = 10000;
      const status = calculateThresholdStatus(revenue, 'SERVICE_BNC');

      expect(status.micro.isExceeded).toBe(false);
      expect(status.micro.remaining).toBe(67700);
      expect(status.tva.isExceeded).toBe(false);
      expect(status.tva.isNear).toBe(false);
    });

    it('détecte quand on est proche du seuil TVA', () => {
      const revenue = 35000; // Seuil TVA SERVICE = 36800. 90% = 33120
      const status = calculateThresholdStatus(revenue, 'SERVICE_BNC');

      expect(status.tva.isExceeded).toBe(false);
      expect(status.tva.isNear).toBe(true);
    });

    it('considère que le seuil n\'est PAS dépassé quand le revenu est EXACTEMENT égal au seuil', () => {
      const revenue = 77700; // Seuil micro SERVICE_BNC
      const status = calculateThresholdStatus(revenue, 'SERVICE_BNC');
      expect(status.micro.isExceeded).toBe(false);
      expect(status.micro.remaining).toBe(0);
    });

    it('détecte le dépassement du seuil de franchise mais SOUS le seuil de tolérance', () => {
      const revenue = 38000; // Franchise 36800 < 38000 < Tolérance 39100
      const status = calculateThresholdStatus(revenue, 'SERVICE_BNC');
      expect(status.tva.isExceeded).toBe(true);
      expect(status.tva.current).toBeLessThan(status.tva.tolerance);
    });
  });
});
