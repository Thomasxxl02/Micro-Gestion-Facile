/**
 * Moteur de projection de CA — Régression linéaire simple (OLS)
 * Utilisé dans le tableau de bord prévisionnel.
 *
 * Entrée  : historique mensuel de CA (factures payées)
 * Sortie  : projection sur N mois + alertes seuils TVA / Micro
 */

import Decimal from 'decimal.js';
import type { ActivityType } from '../types';
import { THRESHOLDS_2026, getThresholds } from './fiscalCalculations';

export interface MonthlyRevenue {
  /** ISO month label : "2025-01" */
  month: string;
  revenue: number;
}

export interface ProjectionPoint {
  month: string; // "2026-05"
  projected: number;
  lower: number; // borne basse (confiance 80%)
  upper: number; // borne haute
  isProjected: true;
}

export interface RevenueProjectionResult {
  /** Points historiques enrichis */
  history: (MonthlyRevenue & { cumulative: number })[];
  /** Projection sur les N prochains mois */
  forecast: ProjectionPoint[];
  /** CA cumulé actuellement sur l'année civile */
  ytdRevenue: number;
  /** Tendance mensuelle moyenne en € */
  monthlyTrend: number;
  /** Alertes seuils actives */
  alerts: ThresholdAlert[];
  /** Confiance du modèle (0-1) */
  confidence: number;
}

export interface ThresholdAlert {
  type: 'TVA_NEAR' | 'TVA_EXCEEDED' | 'MICRO_NEAR' | 'MICRO_EXCEEDED';
  threshold: number;
  currentRevenue: number;
  projectedMonthsUntilBreached?: number;
  message: string;
  severity: 'warning' | 'danger';
}

/**
 * Régression linéaire ordinaire (OLS) sur un tableau de nombres.
 * Retourne pente (slope) et ordonnée à l'origine (intercept).
 */
function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: values[0] ?? 0, r2: 0 };
  }

  // x = indices 0..n-1
  const sumX = (n * (n - 1)) / 2; // Σi
  const sumX2 = ((n - 1) * n * (2 * n - 1)) / 6; // Σi²
  const sumY = values.reduce((acc, v) => acc + v, 0);
  const sumXY = values.reduce((acc, v, i) => acc + i * v, 0);

  const slope = new Decimal(n * sumXY - sumX * sumY)
    .dividedBy(new Decimal(n * sumX2 - sumX * sumX))
    .toNumber();
  const intercept = new Decimal(sumY - slope * sumX).dividedBy(n).toNumber();

  // Coefficient de détermination R²
  const yMean = sumY / n;
  const ssTot = values.reduce((acc, v) => acc + (v - yMean) ** 2, 0);
  const ssRes = values.reduce((acc, v, i) => {
    const predicted = slope * i + intercept;
    return acc + (v - predicted) ** 2;
  }, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

/**
 * Ajoute N mois à une string ISO "YYYY-MM".
 */
function addMonths(isoMonth: string, n: number): string {
  const [year, month] = isoMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + n, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Génère les alertes de seuils URSSAF/TVA
 */
function generateAlerts(
  ytdRevenue: number,
  forecast: ProjectionPoint[],
  activityType: ActivityType
): ThresholdAlert[] {
  const thresholds = getThresholds(activityType);
  const alerts: ThresholdAlert[] = [];

  // ── TVA Franchise ────────────────────────────────────────────
  const tvaRatio = ytdRevenue / thresholds.tva;
  if (tvaRatio >= 1) {
    alerts.push({
      type: 'TVA_EXCEEDED',
      threshold: thresholds.tva,
      currentRevenue: ytdRevenue,
      message: `Seuil de franchise TVA dépassé (${thresholds.tva.toLocaleString('fr-FR')} €). Vous devez facturer la TVA.`,
      severity: 'danger',
    });
  } else if (tvaRatio >= 0.85) {
    // Estimer dans combien de mois le seuil sera atteint
    let cumulative = ytdRevenue;
    let monthsUntil: number | undefined;
    for (let i = 0; i < forecast.length; i++) {
      cumulative += forecast[i].projected;
      if (cumulative >= thresholds.tva) {
        monthsUntil = i + 1;
        break;
      }
    }
    alerts.push({
      type: 'TVA_NEAR',
      threshold: thresholds.tva,
      currentRevenue: ytdRevenue,
      projectedMonthsUntilBreached: monthsUntil,
      message:
        monthsUntil !== undefined
          ? `À ce rythme, vous dépasserez le seuil TVA (${thresholds.tva.toLocaleString('fr-FR')} €) dans ${monthsUntil} mois.`
          : `Vous approchez du seuil TVA (${thresholds.tva.toLocaleString('fr-FR')} €) — ${Math.round(tvaRatio * 100)}% atteint.`,
      severity: 'warning',
    });
  }

  // ── Seuil Micro-entreprise ────────────────────────────────────
  const microRatio = ytdRevenue / thresholds.micro;
  if (microRatio >= 1) {
    alerts.push({
      type: 'MICRO_EXCEEDED',
      threshold: thresholds.micro,
      currentRevenue: ytdRevenue,
      message: `Seuil du régime micro-entreprise dépassé (${thresholds.micro.toLocaleString('fr-FR')} €). Passage possible au régime réel.`,
      severity: 'danger',
    });
  } else if (microRatio >= 0.8) {
    alerts.push({
      type: 'MICRO_NEAR',
      threshold: thresholds.micro,
      currentRevenue: ytdRevenue,
      message: `Vous avez atteint ${Math.round(microRatio * 100)}% du plafond micro-entreprise (${thresholds.micro.toLocaleString('fr-FR')} €).`,
      severity: 'warning',
    });
  }

  return alerts;
}

/**
 * Calcule la projection de CA à partir d'un historique mensuel.
 *
 * @param history       Historique mensuel (au moins 2 mois recommandés)
 * @param forecastMonths Nombre de mois à projeter (défaut : 12)
 * @param activityType  Type d'activité pour le calcul des seuils
 */
export function projectRevenue(
  history: MonthlyRevenue[],
  forecastMonths = 12,
  activityType: ActivityType = 'SERVICE_BNC'
): RevenueProjectionResult {
  // Trier par date
  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));

  // CA cumulé sur l'année en cours
  const currentYear = new Date().getFullYear().toString();
  const ytdRevenue = sorted
    .filter((m) => m.month.startsWith(currentYear))
    .reduce((sum, m) => sum + m.revenue, 0);

  // Enrichir l'historique avec un cumul
  let runningCumul = 0;
  const enrichedHistory = sorted.map((m) => {
    runningCumul += m.revenue;
    return { ...m, cumulative: runningCumul };
  });

  // Régression linéaire sur les revenues
  const revenueValues = sorted.map((m) => m.revenue);
  const { slope, intercept, r2 } = linearRegression(revenueValues);

  // Résidu pour calculer les intervalles de confiance
  const residuals = revenueValues.map((v, i) => v - (slope * i + intercept));
  const stdResidual =
    residuals.length >= 2
      ? Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / (residuals.length - 1))
      : 0;
  const zScore80 = 1.28; // intervalle de confiance 80%
  const margin = stdResidual * zScore80;

  // Générer les points de prévision
  const lastIndex = sorted.length - 1;
  const lastMonth = sorted[lastIndex]?.month ?? addMonths(currentYear + '-01', -1);

  const forecast: ProjectionPoint[] = Array.from({ length: forecastMonths }, (_, i) => {
    const idx = lastIndex + 1 + i;
    const raw = slope * idx + intercept;
    const projected = Math.max(0, raw);
    return {
      month: addMonths(lastMonth, i + 1),
      projected: new Decimal(projected).toDecimalPlaces(2).toNumber(),
      lower: Math.max(0, new Decimal(projected - margin).toDecimalPlaces(2).toNumber()),
      upper: new Decimal(projected + margin).toDecimalPlaces(2).toNumber(),
      isProjected: true,
    };
  });

  const alerts = generateAlerts(ytdRevenue, forecast, activityType);

  return {
    history: enrichedHistory,
    forecast,
    ytdRevenue: new Decimal(ytdRevenue).toDecimalPlaces(2).toNumber(),
    monthlyTrend: new Decimal(slope).toDecimalPlaces(2).toNumber(),
    alerts,
    confidence: Math.max(0, Math.min(1, r2)),
  };
}

export { THRESHOLDS_2026 };
