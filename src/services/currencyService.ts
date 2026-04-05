/**
 * currencyService — Taux de change BCE (Banque Centrale Européenne)
 * ─────────────────────────────────────────────────────────────────
 * Récupère les taux EUR/USD, EUR/GBP via l'API publique BCE.
 * Cache localStorage avec TTL 1 heure. Fallback sur taux statiques.
 *
 * Sécurité : appels en lecture seule sur API publique BCE (pas d'auth).
 */

const BCE_API =
  'https://data-api.ecb.europa.eu/service/data/EXR/D.USD+GBP.EUR.SP00.A?lastNObservations=1&format=jsondata';

const CACHE_KEY = 'mgf_currency_rates';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure

// Taux de secours si l'API est indisponible (mis à jour manuellement)
export const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
};

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

export interface ExchangeRates {
  base: 'EUR';
  rates: Record<string, number>; // ex: { USD: 1.08, GBP: 0.86, EUR: 1 }
  fetchedAt: number; // timestamp ms
  isFallback: boolean;
}

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

// ─── Cache interne ───────────────────────────────────────────────────────────

function loadCache(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachedRates;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) {
      return null; // expiré
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(rates: Record<string, number>): void {
  try {
    const entry: CachedRates = { rates, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage peut être indisponible (mode privé, quota)
  }
}

// ─── Parser réponse BCE (format SDMX-JSON) ──────────────────────────────────

function parseBCEResponse(data: unknown): Record<string, number> {
  // Structure BCE SDMX-JSON
  const root = data as {
    dataSets?: Array<{ series?: Record<string, { observations?: Record<string, [number]> }> }>;
    structure?: { dimensions?: { series?: Array<{ values?: Array<{ id?: string }> }> } };
  };

  const series = root.dataSets?.[0]?.series ?? {};
  const dimensions = root.structure?.dimensions?.series ?? [];

  // Dimension 1 = currency (USD, GBP…)
  const currencyDim = dimensions[1]?.values ?? [];

  const rates: Record<string, number> = { EUR: 1 };

  Object.entries(series).forEach(([key, seriesData]) => {
    const currencyIdx = parseInt(key.split(':')[1], 10);
    const currency = currencyDim[currencyIdx]?.id;
    if (!currency) {
      return;
    }

    const obs = seriesData.observations ?? {};
    const values = Object.values(obs);
    if (values.length > 0) {
      const rate = values[values.length - 1][0];
      if (typeof rate === 'number' && rate > 0) {
        rates[currency] = rate;
      }
    }
  });

  return rates;
}

// ─── Fetch principal ─────────────────────────────────────────────────────────

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // 1. Vérifier le cache
  const cached = loadCache();
  if (cached) {
    return { base: 'EUR', rates: cached.rates, fetchedAt: cached.fetchedAt, isFallback: false };
  }

  // 2. Appel BCE
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const resp = await fetch(BCE_API, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`BCE API HTTP ${resp.status}`);
    }

    const json = await resp.json();
    const rates = parseBCEResponse(json);

    if (Object.keys(rates).length < 2) {
      throw new Error('Réponse BCE vide ou invalide');
    }

    saveCache(rates);
    return { base: 'EUR', rates, fetchedAt: Date.now(), isFallback: false };
  } catch {
    // 3. Fallback silencieux
    return {
      base: 'EUR',
      rates: { ...FALLBACK_RATES },
      fetchedAt: Date.now(),
      isFallback: true,
    };
  }
}

// ─── Conversion ─────────────────────────────────────────────────────────────

/**
 * Convertit un montant entre deux devises.
 * Base = EUR. Retourne le montant arrondi à 2 décimales.
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to) {
    return amount;
  }
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  // Convert from → EUR → to
  const inEur = amount / fromRate;
  return Math.round((inEur * toRate + Number.EPSILON) * 100) / 100;
}

/**
 * Formate un montant avec le symbole de la devise.
 */
export function formatCurrency(amount: number, currency: SupportedCurrency): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // EUR : suffixe, USD/GBP : préfixe
  return currency === 'EUR' ? `${formatted} ${symbol}` : `${symbol} ${formatted}`;
}
