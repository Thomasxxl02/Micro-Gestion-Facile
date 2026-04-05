/**
 * useCurrencyConverter — Hook React pour la conversion de devises
 * ──────────────────────────────────────────────────────────────
 * Charge les taux BCE au montage, expose les helpers de conversion
 * et de formatage en tenant compte de la devise du profil utilisateur.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CURRENCY_SYMBOLS,
  FALLBACK_RATES,
  convertAmount,
  fetchExchangeRates,
  formatCurrency,
  type ExchangeRates,
  type SupportedCurrency,
} from '../services/currencyService';

export interface UseCurrencyConverterReturn {
  /** Taux courants {EUR:1, USD:1.08, GBP:0.86} */
  rates: Record<string, number>;
  /** true pendant le chargement initial */
  isLoading: boolean;
  /** true si les taux BCE sont indisponibles (fallback actif) */
  isFallback: boolean;
  /** Horodatage de la dernière mise à jour des taux */
  fetchedAt: number | null;
  /** Symbole de la devise de base du profil (€, $, £) */
  baseCurrencySymbol: string;
  /** Devise de base du profil (ex: 'EUR') */
  baseCurrency: SupportedCurrency;
  /**
   * Convertit un montant EUR vers la devise du profil.
   * Exemple : convert(100) → 108 si devise=USD
   */
  convert: (amountEur: number) => number;
  /**
   * Convertit un montant de n'importe quelle devise vers EUR.
   */
  toEur: (amount: number, fromCurrency: string) => number;
  /**
   * Formate un montant avec symbole (dans la devise du profil).
   * Exemple : format(108) → "$ 108,00"
   */
  format: (amount: number) => string;
  /**
   * Formate en EUR quel que soit la devise du profil.
   */
  formatEur: (amount: number) => string;
}

export function useCurrencyConverter(profileCurrency?: string): UseCurrencyConverterReturn {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchExchangeRates().then((result) => {
      if (!cancelled) {
        setExchangeRates(result);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const baseCurrency = useMemo<SupportedCurrency>(() => {
    const c = (profileCurrency ?? 'EUR').toUpperCase();
    return (c === 'USD' || c === 'GBP' || c === 'EUR' ? c : 'EUR') as SupportedCurrency;
  }, [profileCurrency]);

  const rates = exchangeRates?.rates ?? FALLBACK_RATES;

  const convert = useMemo(
    () => (amountEur: number) => convertAmount(amountEur, 'EUR', baseCurrency, rates),
    [baseCurrency, rates]
  );

  const toEur = useMemo(
    () => (amount: number, fromCurrency: string) =>
      convertAmount(amount, fromCurrency, 'EUR', rates),
    [rates]
  );

  const format = useMemo(
    () => (amount: number) => formatCurrency(amount, baseCurrency),
    [baseCurrency]
  );

  const formatEur = useMemo(() => (amount: number) => formatCurrency(amount, 'EUR'), []);

  return {
    rates,
    isLoading,
    isFallback: exchangeRates?.isFallback ?? true,
    fetchedAt: exchangeRates?.fetchedAt ?? null,
    baseCurrencySymbol: CURRENCY_SYMBOLS[baseCurrency] ?? '€',
    baseCurrency,
    convert,
    toEur,
    format,
    formatEur,
  };
}
