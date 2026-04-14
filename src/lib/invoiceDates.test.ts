import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../types';
import { calculateDueDate } from './invoiceDates';

describe('calculateDueDate', () => {
  const mockProfile = (
    delay: 'RECEIPT' | '30_DAYS' | '45_DAYS' | '60_DAYS' | 'CUSTOM',
    customDays?: number
  ): UserProfile =>
    ({
      companyName: 'Test',
      siret: '123',
      address: 'Test',
      email: 'test@test.com',
      phone: '123',
      automation: {
        defaultPaymentDelay: delay,
        customPaymentDelayDays: customDays,
        autoReminders: { enabled: false, after3Days: true, after7Days: true },
      },
    }) as UserProfile;

  it('devrait retourner la même date pour RECEIPT', () => {
    const issueDate = '2026-04-14';
    const profile = mockProfile('RECEIPT');
    expect(calculateDueDate(issueDate, profile)).toBe('2026-04-14');
  });

  it('devrait ajouter 30 jours par défaut (ou 30_DAYS)', () => {
    const issueDate = '2026-04-14';
    const profile = mockProfile('30_DAYS');
    // Avril a 30 jours. 14 + 30 = 44. 44 - 30 = 14 Mai.
    expect(calculateDueDate(issueDate, profile)).toBe('2026-05-14');
  });

  it('devrait ajouter 45 jours pour 45_DAYS', () => {
    const issueDate = '2026-04-14';
    const profile = mockProfile('45_DAYS');
    // 14 Avril + 45 jours = 29 Mai
    expect(calculateDueDate(issueDate, profile)).toBe('2026-05-29');
  });

  it('devrait ajouter le nombre de jours personnalisé pour CUSTOM', () => {
    const issueDate = '2026-04-14';
    const profile = mockProfile('CUSTOM', 10);
    expect(calculateDueDate(issueDate, profile)).toBe('2026-04-24');
  });

  it("devrait gérer le passage à l'année suivante", () => {
    const issueDate = '2026-12-20';
    const profile = mockProfile('30_DAYS');
    expect(calculateDueDate(issueDate, profile)).toBe('2027-01-19');
  });
});
