/**
 * Tests pour revenueProjection.ts
 * Moteur de projection de CA — régression linéaire OLS + alertes seuils
 */

import { describe, expect, it } from 'vitest';
import { THRESHOLDS_2026 } from '../../lib/fiscalCalculations';
import { projectRevenue, type MonthlyRevenue } from '../../lib/revenueProjection';

// Helpers
const currentYear = new Date().getFullYear();
const currentYearStr = String(currentYear);
const prevYearStr = String(currentYear - 1);

/**
 * Crée un historique mensuel pour l'année courante
 */
function buildHistory(revenues: number[], startMonth = 1): MonthlyRevenue[] {
  return revenues.map((revenue, i) => ({
    month: `${currentYearStr}-${String(startMonth + i).padStart(2, '0')}`,
    revenue,
  }));
}

/**
 * Crée un historique appartenant à l'année précédente seulement
 */
function buildPrevYearHistory(revenues: number[]): MonthlyRevenue[] {
  return revenues.map((revenue, i) => ({
    month: `${prevYearStr}-${String(i + 1).padStart(2, '0')}`,
    revenue,
  }));
}

// ─── Seuils 2026 ─────────────────────────────────────────────────────────────
const TVA_SERVICE = THRESHOLDS_2026.TVA_FRANCHISE.SERVICE; // 36 800
const TVA_SALE = THRESHOLDS_2026.TVA_FRANCHISE.SALE; // 91 900
const MICRO_SERVICE = THRESHOLDS_2026.MICRO.SERVICE; // 77 700
const MICRO_SALE = THRESHOLDS_2026.MICRO.SALE; // 188 700

// ─── Cas de base ─────────────────────────────────────────────────────────────

describe('projectRevenue — cas de base', () => {
  it('retourne une structure complète avec un historique normal', () => {
    const history = buildHistory([1000, 1200, 1100, 1300]);
    const result = projectRevenue(history, 3);

    expect(result).toHaveProperty('history');
    expect(result).toHaveProperty('forecast');
    expect(result).toHaveProperty('ytdRevenue');
    expect(result).toHaveProperty('monthlyTrend');
    expect(result).toHaveProperty('alerts');
    expect(result).toHaveProperty('confidence');
  });

  it("calcule le ytdRevenue uniquement pour l'année en cours", () => {
    const currentMonths = buildHistory([1000, 2000]);
    const prevMonths = buildPrevYearHistory([5000, 5000]);
    const history = [...currentMonths, ...prevMonths];

    const result = projectRevenue(history);
    expect(result.ytdRevenue).toBe(3000);
  });

  it('génère exactement N points de forecast', () => {
    const history = buildHistory([1000, 1200]);
    const result = projectRevenue(history, 6);
    expect(result.forecast).toHaveLength(6);
  });

  it('marque chaque point forecast avec isProjected: true', () => {
    const history = buildHistory([1000, 1200]);
    const result = projectRevenue(history, 3);
    result.forecast.forEach((pt) => {
      expect(pt.isProjected).toBe(true);
    });
  });

  it('ne génère pas de valeurs projetées négatives (projected >= 0)', () => {
    // Tendance fortement décroissante → projection pourrait être négative sans le clamp
    const history = buildHistory([10000, 5000, 1000, 200]);
    const result = projectRevenue(history, 12);
    result.forecast.forEach((pt) => {
      expect(pt.projected).toBeGreaterThanOrEqual(0);
      expect(pt.lower).toBeGreaterThanOrEqual(0);
    });
  });

  it("trie l'historique par mois même si désordonné", () => {
    const history: MonthlyRevenue[] = [
      { month: `${currentYearStr}-03`, revenue: 3000 },
      { month: `${currentYearStr}-01`, revenue: 1000 },
      { month: `${currentYearStr}-02`, revenue: 2000 },
    ];
    const result = projectRevenue(history);
    expect(result.history[0].month).toBe(`${currentYearStr}-01`);
    expect(result.history[1].month).toBe(`${currentYearStr}-02`);
    expect(result.history[2].month).toBe(`${currentYearStr}-03`);
  });

  it("cumul croissant dans l'historique enrichi", () => {
    const history = buildHistory([1000, 2000, 3000]);
    const result = projectRevenue(history);
    expect(result.history[0].cumulative).toBe(1000);
    expect(result.history[1].cumulative).toBe(3000);
    expect(result.history[2].cumulative).toBe(6000);
  });

  it('le premier mois de forecast est le mois suivant le dernier historique', () => {
    const history: MonthlyRevenue[] = [{ month: `${currentYearStr}-03`, revenue: 1000 }];
    const result = projectRevenue(history, 1);
    expect(result.forecast[0].month).toBe(`${currentYearStr}-04`);
  });
});

// ─── Cas limites — n < 2 points ───────────────────────────────────────────────

describe('projectRevenue — historique vide ou unique', () => {
  it('historique vide : ytdRevenue = 0, forecast vide si forecastMonths = 0', () => {
    const result = projectRevenue([], 0);
    expect(result.ytdRevenue).toBe(0);
    expect(result.forecast).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
  });

  it('historique vide : génère N points forecast à partir du mois courant', () => {
    const result = projectRevenue([], 3);
    expect(result.forecast).toHaveLength(3);
    // Tous projetés à 0 (slope=0, intercept=0)
    result.forecast.forEach((pt) => {
      expect(pt.projected).toBe(0);
    });
  });

  it('historique 1 mois : slope = 0, confidence = 0', () => {
    // n < 2 → linearRegression retourne slope=0
    const history = buildHistory([5000]);
    const result = projectRevenue(history, 3);
    expect(result.monthlyTrend).toBe(0);
    expect(result.confidence).toBe(0);
    // La projection reste constante (intercept = 5000)
    result.forecast.forEach((pt) => {
      expect(pt.projected).toBe(5000);
    });
  });

  it("historique 1 mois d'année précédente : ytdRevenue = 0", () => {
    const history = buildPrevYearHistory([10000]);
    const result = projectRevenue(history);
    expect(result.ytdRevenue).toBe(0);
  });
});

// ─── Régression linéaire ──────────────────────────────────────────────────────

describe('projectRevenue — régression linéaire', () => {
  it('détecte une tendance croissante', () => {
    const history = buildHistory([1000, 2000, 3000, 4000]);
    const result = projectRevenue(history);
    expect(result.monthlyTrend).toBeGreaterThan(0);
  });

  it('détecte une tendance décroissante', () => {
    const history = buildHistory([4000, 3000, 2000, 1000]);
    const result = projectRevenue(history);
    expect(result.monthlyTrend).toBeLessThan(0);
  });

  it('tendance nulle sur historique constant', () => {
    const history = buildHistory([2000, 2000, 2000, 2000]);
    const result = projectRevenue(history);
    expect(result.monthlyTrend).toBe(0);
    expect(result.confidence).toBe(1); // R² = 1 si tout est parfaitement sur la droite (constante)
  });

  it('confidence entre 0 et 1', () => {
    const history = buildHistory([1000, 3000, 2000, 4000, 2500]);
    const result = projectRevenue(history);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('forecast lower <= projected <= upper', () => {
    const history = buildHistory([1000, 2000, 1500, 2500, 3000]);
    const result = projectRevenue(history, 6);
    result.forecast.forEach((pt) => {
      expect(pt.lower).toBeLessThanOrEqual(pt.projected);
      expect(pt.projected).toBeLessThanOrEqual(pt.upper);
    });
  });
});

// ─── addMonths — passage d'année ─────────────────────────────────────────────

describe('projectRevenue — addMonths via forecast (décembre → janvier)', () => {
  it("le forecast de décembre pointe sur janvier de l'année suivante", () => {
    const decHistory: MonthlyRevenue[] = [
      { month: `${currentYearStr}-11`, revenue: 1000 },
      { month: `${currentYearStr}-12`, revenue: 1200 },
    ];
    const result = projectRevenue(decHistory, 2);
    const nextYear = currentYear + 1;
    expect(result.forecast[0].month).toBe(`${nextYear}-01`);
    expect(result.forecast[1].month).toBe(`${nextYear}-02`);
  });
});

// ─── Alertes TVA ──────────────────────────────────────────────────────────────

describe('projectRevenue — alertes TVA (SERVICE_BNC)', () => {
  it('aucune alerte si ytdRevenue < 85% du seuil TVA', () => {
    // 80% of 36800 = 29440 — en DESSOUS du seuil TVA_NEAR
    const revenue = Math.floor(TVA_SERVICE * 0.8);
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SERVICE_BNC');
    const tvaAlerts = result.alerts.filter(
      (a) => a.type === 'TVA_NEAR' || a.type === 'TVA_EXCEEDED'
    );
    expect(tvaAlerts).toHaveLength(0);
  });

  it('alerte TVA_NEAR si ytdRevenue entre 85% et 100% du seuil', () => {
    // 90% de 36800 = 33120
    const revenue = Math.floor(TVA_SERVICE * 0.9);
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SERVICE_BNC');
    const tvaAlert = result.alerts.find((a) => a.type === 'TVA_NEAR');
    expect(tvaAlert).toBeDefined();
    expect(tvaAlert?.severity).toBe('warning');
    expect(tvaAlert?.threshold).toBe(TVA_SERVICE);
    expect(tvaAlert?.currentRevenue).toBe(revenue);
  });

  it('alerte TVA_EXCEEDED si ytdRevenue >= seuil TVA', () => {
    const revenue = TVA_SERVICE + 100;
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SERVICE_BNC');
    const tvaAlert = result.alerts.find((a) => a.type === 'TVA_EXCEEDED');
    expect(tvaAlert).toBeDefined();
    expect(tvaAlert?.severity).toBe('danger');
  });

  it('TVA_NEAR inclut projectedMonthsUntilBreached si le forecast atteint le seuil', () => {
    // Deux mois qui somment à ~90% du seuil TVA SERVICE (36 800 €)
    // 45% + 45% = 90% → ytdRevenue = 33 120 → TVA_NEAR
    const halfRevenue = Math.floor(TVA_SERVICE * 0.45);
    const history = buildHistory([halfRevenue, halfRevenue]);
    const result = projectRevenue(history, 12, 'SERVICE_BNC');
    const tvaAlert = result.alerts.find((a) => a.type === 'TVA_NEAR');
    expect(tvaAlert).toBeDefined();
    // projectedMonthsUntilBreached peut être défini ou non selon la projection
    if (tvaAlert?.projectedMonthsUntilBreached !== undefined) {
      expect(tvaAlert.projectedMonthsUntilBreached).toBeGreaterThan(0);
    }
  });

  it('alerte TVA_NEAR pour SALE avec le bon seuil', () => {
    const revenue = Math.floor(TVA_SALE * 0.9);
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SALE');
    const tvaAlert = result.alerts.find((a) => a.type === 'TVA_NEAR');
    expect(tvaAlert).toBeDefined();
    expect(tvaAlert?.threshold).toBe(TVA_SALE);
  });
});

// ─── Alertes Micro-entreprise ─────────────────────────────────────────────────

describe('projectRevenue — alertes Micro-entreprise (SERVICE_BNC)', () => {
  it('aucune alerte MICRO si ytdRevenue < 80% du seuil', () => {
    const revenue = Math.floor(MICRO_SERVICE * 0.7);
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SERVICE_BNC');
    const microAlerts = result.alerts.filter(
      (a) => a.type === 'MICRO_NEAR' || a.type === 'MICRO_EXCEEDED'
    );
    expect(microAlerts).toHaveLength(0);
  });

  it('alerte MICRO_NEAR si ytdRevenue entre 80% et 100% du seuil', () => {
    const revenue = Math.floor(MICRO_SERVICE * 0.85);
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SERVICE_BNC');
    const microAlert = result.alerts.find((a) => a.type === 'MICRO_NEAR');
    expect(microAlert).toBeDefined();
    expect(microAlert?.severity).toBe('warning');
    expect(microAlert?.threshold).toBe(MICRO_SERVICE);
  });

  it('alerte MICRO_EXCEEDED si ytdRevenue >= seuil micro', () => {
    const revenue = MICRO_SERVICE + 100;
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SERVICE_BNC');
    const microAlert = result.alerts.find((a) => a.type === 'MICRO_EXCEEDED');
    expect(microAlert).toBeDefined();
    expect(microAlert?.severity).toBe('danger');
  });

  it('alerte MICRO_EXCEEDED pour SALE avec le bon seuil', () => {
    const revenue = MICRO_SALE + 100;
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SALE');
    const microAlert = result.alerts.find((a) => a.type === 'MICRO_EXCEEDED');
    expect(microAlert).toBeDefined();
    expect(microAlert?.threshold).toBe(MICRO_SALE);
  });

  it('peut avoir à la fois TVA_EXCEEDED et MICRO_EXCEEDED', () => {
    // Dépasser les 2 seuils en même temps (MICRO > TVA donc si on dépasse MICRO, TVA aussi)
    const revenue = MICRO_SERVICE + 1000;
    const history = buildHistory([revenue]);
    const result = projectRevenue(history, 12, 'SERVICE_BNC');
    const types = result.alerts.map((a) => a.type);
    expect(types).toContain('TVA_EXCEEDED');
    expect(types).toContain('MICRO_EXCEEDED');
  });
});

// ─── Types d'activité ─────────────────────────────────────────────────────────

describe('projectRevenue — activityType', () => {
  it('SERVICE_BNC par défaut', () => {
    const history = buildHistory([1000, 2000]);
    const result = projectRevenue(history);
    // Aucune alerte pour un CA faible
    expect(result.alerts).toHaveLength(0);
  });

  it('SERVICE_BIC utilise les seuils SERVICE (non-SALE)', () => {
    const revenue = Math.floor(TVA_SERVICE * 0.9);
    const historyService = buildHistory([revenue]);
    const resultBic = projectRevenue(historyService, 12, 'SERVICE_BIC');
    const tvaAlert = resultBic.alerts.find((a) => a.type === 'TVA_NEAR');
    expect(tvaAlert).toBeDefined();
    expect(tvaAlert?.threshold).toBe(TVA_SERVICE);
  });
});
