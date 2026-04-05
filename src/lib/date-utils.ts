/**
 * Utilitaires date-fns avec locale française
 * Manipulation de dates French-friendly
 *
 * Fournit: formatage fr, parsing date-fns, calculs de dates
 * Tous les formats respektent les normes françaises (DD/MM/YYYY)
 */

import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  differenceInMonths,
  endOfMonth,
  endOfQuarter,
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isEqual,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  startOfQuarter,
  type Locale,
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Parser de date sûr - convertit string/Date en Date
 * Gère ISO strings et dates locales
 */
export function parseDate(dateInput: string | Date): Date | null {
  try {
    if (dateInput instanceof Date) {
      return isValid(dateInput) ? dateInput : null;
    }

    // Essayer format ISO d'abord
    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      const parsed = parseISO(dateInput);
      return isValid(parsed) ? parsed : null;
    }

    // Essayer format français DD/MM/YYYY
    if (typeof dateInput === 'string' && dateInput.includes('/')) {
      const parsed = parse(dateInput, 'dd/MM/yyyy', new Date());
      return isValid(parsed) ? parsed : null;
    }

    // Essayer format YYYY-MM-DD
    if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsed = parse(dateInput, 'yyyy-MM-dd', new Date());
      return isValid(parsed) ? parsed : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Format français standard : "15 mars 2026"
 */
export function formatDateFr(date: string | Date, _locale: Locale = fr): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return 'Date invalide';
  }
  return format(parsed, 'd MMMM yyyy', { locale: fr });
}

/**
 * Format français court : "15 mars"
 */
export function formatDateFrShort(date: string | Date, _locale: Locale = fr): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return 'Date invalide';
  }
  return format(parsed, 'd MMMM', { locale: fr });
}

/**
 * Format français avec jour : "vendredi 15 mars 2026"
 */
export function formatDateFrLong(date: string | Date, _locale: Locale = fr): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return 'Date invalide';
  }
  return format(parsed, 'EEEE d MMMM yyyy', { locale: fr });
}

/**
 * Format numérique français : "15/03/2026"
 */
export function formatDateFrNumeric(date: string | Date, _locale: Locale = fr): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return 'Date invalide';
  }
  return format(parsed, 'dd/MM/yyyy', { locale: fr });
}

/**
 * Format avec heure : "15 mars 2026 à 14:30"
 */
export function formatDateTimeFr(date: string | Date, _locale: Locale = fr): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return 'Date invalide';
  }
  return format(parsed, "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

/**
 * Format avec heure numérique : "15/03/2026 14:30"
 */
export function formatDateTimeNumericFr(date: string | Date, _locale: Locale = fr): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return 'Date invalide';
  }
  return format(parsed, 'dd/MM/yyyy HH:mm', { locale: fr });
}

/**
 * Distance à partir de maintenant : "il y a 2 jours"
 */
export function formatDistanceFr(date: string | Date, _locale: Locale = fr): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return 'Date invalide';
  }
  return formatDistanceToNow(parsed, { locale: fr, addSuffix: true });
}

/**
 * Format ISO pour API/stockage : "2026-03-15"
 */
export function formatDateISO(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return '';
  }
  return format(parsed, 'yyyy-MM-dd');
}

/**
 * Format ISO avec heure UTC : "2026-03-15T14:30:00Z"
 */
export function formatDateTimeISO(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return '';
  }
  return parsed.toISOString();
}

/**
 * Calculs de dates
 */

export function addDaysToDate(date: string | Date, days: number): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }
  return addDays(parsed, days);
}

export function addMonthsToDate(date: string | Date, months: number): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }
  return addMonths(parsed, months);
}

export function addYearsToDate(date: string | Date, years: number): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }
  return addYears(parsed, years);
}

/**
 * Différence en jours entre deux dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
  if (!d1 || !d2) {
    throw new Error('Dates invalides');
  }
  return differenceInDays(d2, d1);
}

/**
 * Différence en mois entre deux dates
 */
export function monthsBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
  if (!d1 || !d2) {
    throw new Error('Dates invalides');
  }
  return differenceInMonths(d2, d1);
}

/**
 * Comparaisons de dates
 */

export function isBefore2(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
  if (!d1 || !d2) {
    throw new Error('Dates invalides');
  }
  return isBefore(d1, d2);
}

export function isAfter2(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
  if (!d1 || !d2) {
    throw new Error('Dates invalides');
  }
  return isAfter(d1, d2);
}

export function isEqual2(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
  if (!d1 || !d2) {
    throw new Error('Dates invalides');
  }
  return isEqual(d1, d2);
}

/**
 * Périodes de temps
 */

export function getMonthStart(date: string | Date): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }
  return startOfMonth(parsed);
}

export function getMonthEnd(date: string | Date): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }
  return endOfMonth(parsed);
}

export function getQuarterStart(date: string | Date): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }
  return startOfQuarter(parsed);
}

export function getQuarterEnd(date: string | Date): Date {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }
  return endOfQuarter(parsed);
}

/**
 * Utilitaires métier français
 */

/**
 * Obtenir le trimestre fiscal français pour une date
 * Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
 */
export function getFiscalQuarter(date: string | Date): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }

  const month = parsed.getMonth() + 1; // getMonth() return 0-11

  if (month >= 1 && month <= 3) {
    return 'Q1';
  }
  if (month >= 4 && month <= 6) {
    return 'Q2';
  }
  if (month >= 7 && month <= 9) {
    return 'Q3';
  }
  return 'Q4';
}

/**
 * Obtenir l'année fiscale française (coincide avec année civile)
 */
export function getFiscalYear(date: string | Date): number {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    throw new Error('Date invalide');
  }
  return parsed.getFullYear();
}

/**
 * Obtenir la période d'un trimestre fiscal sous forme d'objets Date
 */
export function getFiscalQuarterPeriod(
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  year: number
): { start: Date; end: Date } {
  const quarterMonths = {
    Q1: { start: 1, end: 3 },
    Q2: { start: 4, end: 6 },
    Q3: { start: 7, end: 9 },
    Q4: { start: 10, end: 12 },
  };

  const { start, end } = quarterMonths[quarter];
  const startDate = new Date(year, start - 1, 1);
  const endDate = new Date(year, end, 0); // Jour 0 du mois suivant = dernier jour du mois

  return { start: startDate, end: endDate };
}

/**
 * Vérifier si une date est un jour ouvrable français (Mon-Fri, sans jours fériés)
 */
export function isBusinessDay(date: string | Date): boolean {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return false;
  }

  const dayOfWeek = parsed.getDay();
  // 0 = dimanche, 1-5 = lundi-vendredi, 6 = samedi
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Obtenir le jour de la semaine en français
 */
export function getDayNameFr(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return '';
  }
  return format(parsed, 'EEEE', { locale: fr });
}

/**
 * Obtenir le mois en français
 */
export function getMonthNameFr(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseDate(date) : date;
  if (!parsed) {
    return '';
  }
  return format(parsed, 'MMMM', { locale: fr });
}
