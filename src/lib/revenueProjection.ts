import type { ActivityType } from "../types";
import { getThresholds } from "./fiscalCalculations";

/** Données historiques d'un mois (passé en entrée) */
export interface MonthlyRevenue {
  month: string; // Format 'YYYY-MM'
  revenue: number;
}

export interface ProjectionAlert {
  severity: "danger" | "warning";
  message: string;
}

export interface MonthlyForecast {
  month: string; // Format 'YYYY-MM'
  projected: number;
}

export interface RevenueProjectionResult {
  history: MonthlyRevenue[];
  forecast: MonthlyForecast[];
  monthlyTrend: number; // Tendance mensuelle en €
  confidence: number; // R² entre 0 et 1
  alerts: ProjectionAlert[];
}

/**
 * Projette les revenus sur N mois via régression linéaire.
 * @param history  Données mensuelles historiques { month: 'YYYY-MM', revenue }
 * @param months   Nombre de mois à projeter (défaut : 6)
 * @param activityType  Type d'activité pour les alertes seuils
 */
export function projectRevenue(
  history: MonthlyRevenue[],
  months = 6,
  activityType: ActivityType | string = "SERVICE_BNC",
): RevenueProjectionResult {
  if (history.length === 0) {
    return {
      history,
      forecast: [],
      monthlyTrend: 0,
      confidence: 0,
      alerts: [],
    };
  }

  // Tri chronologique
  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
  const revenues = sorted.map((h) => h.revenue);
  const n = revenues.length;

  // Régression linéaire : y = intercept + slope * x
  const xMean = (n - 1) / 2;
  const yMean = revenues.reduce((a, b) => a + b, 0) / n;
  let ssXX = 0;
  let ssXY = 0;
  for (let i = 0; i < n; i++) {
    ssXX += (i - xMean) ** 2;
    ssXY += (i - xMean) * (revenues[i] - yMean);
  }
  const slope = ssXX !== 0 ? ssXY / ssXX : 0;
  const intercept = yMean - slope * xMean;

  // R² (fiabilité de la projection)
  const ssTot = revenues.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const ssRes = revenues.reduce((sum, y, i) => {
    return sum + (y - (intercept + slope * i)) ** 2;
  }, 0);
  const confidence = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  // Génération du forecast
  const lastMonth = sorted[n - 1].month;
  const [lastYear, lastMonthNum] = lastMonth.split("-").map(Number);
  const forecast: MonthlyForecast[] = [];
  for (let i = 1; i <= months; i++) {
    const d = new Date(lastYear, lastMonthNum - 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const projected = Math.max(0, intercept + slope * (n + i - 1));
    forecast.push({ month: key, projected });
  }

  // Alertes seuils
  const alerts: ProjectionAlert[] = [];
  const thresholds = getThresholds(activityType as ActivityType);
  const currentYearRevenue = revenues.reduce((a, b) => a + b, 0);
  const projectedAnnual =
    currentYearRevenue + forecast.reduce((a, f) => a + f.projected, 0);

  if (projectedAnnual >= thresholds.tva * 0.9) {
    if (projectedAnnual >= thresholds.tva) {
      alerts.push({
        severity: "danger",
        message: `CA projeté (${Math.round(projectedAnnual).toLocaleString("fr-FR")} €) dépasse le seuil TVA (${thresholds.tva.toLocaleString("fr-FR")} €). Consultez un comptable.`,
      });
    } else {
      alerts.push({
        severity: "warning",
        message: `CA projeté approche le seuil de franchise TVA (90%). Anticipez dès maintenant.`,
      });
    }
  }

  if (projectedAnnual >= thresholds.micro * 0.9) {
    if (projectedAnnual >= thresholds.micro) {
      alerts.push({
        severity: "danger",
        message: `CA projeté dépasse le plafond micro-entreprise. Souhaitez-vous un bilan comptable ?`,
      });
    } else {
      alerts.push({
        severity: "warning",
        message: `CA projeté approche le plafond micro-entreprise (90%). Préparez une transition.`,
      });
    }
  }

  return { history: sorted, forecast, monthlyTrend: slope, confidence, alerts };
}
