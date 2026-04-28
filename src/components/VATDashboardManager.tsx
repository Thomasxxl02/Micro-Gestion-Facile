/**
 * VATDashboardManager — Tableau de bord TVA Franchise
 * ──────────────────────────────────────────────────────
 * Pour les micro-entrepreneurs en franchise en base de TVA (art. 293 B CGI).
 * Suivi mensuel du CA, seuils TVA, et simulation "passage au régime TVA".
 */

import Decimal from "decimal.js";
import {
  CircleAlert as AlertCircle,
  ArrowRight,
  BadgeCheck,
  ChartColumnIncreasing as BarChart3,
  Calculator,
  ChevronDown,
  Euro,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getThresholds } from "../lib/fiscalCalculations";
import { InvoiceStatus, type Invoice, type UserProfile } from "../types";

interface VATDashboardManagerProps {
  invoices: Invoice[];
  userProfile: UserProfile;
}

// ─── Constantes TVA régime réel ─────────────────────────────────────────────
const VAT_RATES = {
  NORMAL: 20,
  REDUCED_1: 10,
  REDUCED_2: 5.5,
  SUPER_REDUCED: 2.1,
};

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

// ─── Composant principal ─────────────────────────────────────────────────────

const VATDashboardManager: React.FC<VATDashboardManagerProps> = ({
  invoices,
  userProfile,
}) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [simulationAmount, setSimulationAmount] = useState<string>("");
  const [simulationRate, setSimulationRate] = useState<number>(20);

  const activityType = userProfile.activityType ?? "SERVICE_BNC";
  const thresholds = getThresholds(activityType);
  const isVatExempt = userProfile.isVatExempt ?? true;

  // ── Données annuelles ────────────────────────────────────────────────────
  const { yearTotal, cumulativeData } = useMemo(() => {
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      revenue: 0,
      count: 0,
    }));

    invoices
      .filter((inv) => {
        const year = new Date(inv.date).getFullYear();
        return (
          year === selectedYear &&
          inv.status === InvoiceStatus.PAID &&
          (inv.type === "invoice" || inv.type === "deposit_invoice")
        );
      })
      .forEach((inv) => {
        const m = new Date(inv.date).getMonth();
        monthly[m].revenue += inv.total;
        monthly[m].count += 1;
      });

    let cumul = 0;
    const cumData = monthly.map((m) => {
      cumul += m.revenue;
      return {
        name: MONTH_LABELS[m.month],
        CA: parseFloat(m.revenue.toFixed(2)),
        Cumulé: parseFloat(cumul.toFixed(2)),
        count: m.count,
      };
    });

    return {
      monthlyData: cumData,
      yearTotal: parseFloat(cumul.toFixed(2)),
      cumulativeData: cumData,
    };
  }, [invoices, selectedYear]);

  // ── Statut seuil ────────────────────────────────────────────────────────
  const tvaStatus = useMemo(() => {
    const ratio =
      Number.isFinite(thresholds.tva) && thresholds.tva > 0
        ? yearTotal / thresholds.tva
        : 0;
    const ratioTolerance =
      Number.isFinite(thresholds.tvaTolerance) && thresholds.tvaTolerance > 0
        ? yearTotal / thresholds.tvaTolerance
        : 0;
    const remaining = Math.max(0, thresholds.tva - yearTotal);
    const progressPercent = Math.min(100, Math.round(ratio * 100));

    return {
      ratio,
      ratioTolerance,
      remaining,
      progressPercent,
      isExceeded: yearTotal > thresholds.tva,
      isInToleranceBand:
        yearTotal > thresholds.tva && yearTotal <= thresholds.tvaTolerance,
      isAboveToleranceBand: yearTotal > thresholds.tvaTolerance,
      percentLabel: `${progressPercent}%`,
    };
  }, [yearTotal, thresholds]);

  // ── Simulation TVA ──────────────────────────────────────────────────────
  const simulation = useMemo(() => {
    const amount = parseFloat(simulationAmount) || 0;
    if (amount <= 0) {
      return null;
    }
    const vatD = new Decimal(amount)
      .times(new Decimal(simulationRate))
      .dividedBy(100)
      .toDecimalPlaces(2);
    const htD = new Decimal(amount)
      .dividedBy(1 + simulationRate / 100)
      .toDecimalPlaces(2);
    return {
      ht: htD.toNumber(),
      vat: vatD.toNumber(),
      ttc: amount,
      htAgainstThreshold: htD.toNumber(), // CA pris en compte = HT si assujetti
    };
  }, [simulationAmount, simulationRate]);

  // ── Années disponibles ───────────────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set(
      invoices.map((inv) => new Date(inv.date).getFullYear()),
    );
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices]);

  // ── Barre de progression ─────────────────────────────────────────────────
  let progressState: "critical" | "exceeded" | "warning" | "normal" = "normal";
  if (tvaStatus.isAboveToleranceBand) progressState = "critical";
  else if (tvaStatus.isExceeded) progressState = "exceeded";
  else if (tvaStatus.ratio >= 0.85) progressState = "warning";

  const thresholdPercent = (thresholds.tva / thresholds.tvaTolerance) * 100;

  let vatBadgeClass = "bg-brand-100 text-brand-700";
  if (tvaStatus.isAboveToleranceBand) vatBadgeClass = "bg-red-100 text-red-700";
  else if (tvaStatus.isExceeded) vatBadgeClass = "bg-amber-100 text-amber-700";
  else if (isVatExempt) vatBadgeClass = "bg-accent-100 text-accent-700";

  let vatBadgeLabel = "Régime TVA";
  if (tvaStatus.isAboveToleranceBand) vatBadgeLabel = "⚠ Tolérance dépassée";
  else if (tvaStatus.isExceeded) vatBadgeLabel = "⚠ Seuil dépassé";
  else if (isVatExempt) vatBadgeLabel = "Franchise active";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-900 dark:text-brand-50 font-display tracking-tight">
            Tableau de bord TVA
          </h2>
          <p className="text-sm text-brand-500 dark:text-brand-400 mt-1">
            {isVatExempt
              ? "Franchise en base — art. 293 B du CGI"
              : "Régime TVA réel simplifié actif"}
          </p>
        </div>
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="appearance-none pl-4 pr-8 py-2.5 border border-brand-100 dark:border-brand-700 rounded-2xl text-sm font-bold text-brand-700 dark:text-brand-200 bg-white dark:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
            aria-label="Sélectionner l'année"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Alerte si dépassement */}
      {tvaStatus.isAboveToleranceBand && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-2xl text-sm text-red-700 dark:text-red-300"
        >
          <TriangleAlert size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>Seuil de tolérance dépassé.</strong> Vous êtes soumis à la
            TVA dès le 1er jour du mois suivant le dépassement (
            {thresholds.tvaTolerance.toLocaleString("fr-FR")} €). Contactez un
            expert-comptable.
          </div>
        </div>
      )}
      {tvaStatus.isInToleranceBand && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-sm text-amber-700 dark:text-amber-300"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            Vous avez dépassé le seuil de franchise (
            {thresholds.tva.toLocaleString("fr-FR")} €) mais restez dans la zone
            de tolérance jusqu'à{" "}
            {thresholds.tvaTolerance.toLocaleString("fr-FR")} €. Vous pouvez
            continuer sans TVA cette année, mais devrez l'appliquer l'année
            suivante si le cumul reste supérieur.
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-modern p-5">
          <div className="flex items-center gap-2 mb-2">
            <Euro size={14} className="text-brand-400" />
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              CA {selectedYear}
            </p>
          </div>
          <p className="text-2xl font-bold text-brand-900 dark:text-brand-50 font-display">
            {yearTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="card-modern p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-brand-400" />
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              Seuil franchise
            </p>
          </div>
          <p className="text-2xl font-bold text-brand-900 dark:text-brand-50 font-display">
            {thresholds.tva.toLocaleString("fr-FR")} €
          </p>
        </div>
        <div className="card-modern p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp
              size={14}
              className={
                tvaStatus.isExceeded ? "text-red-400" : "text-accent-500"
              }
            />
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              Utilisation
            </p>
          </div>
          <p
            className={`text-2xl font-bold font-display ${tvaStatus.isExceeded ? "text-red-600 dark:text-red-400" : "text-brand-900 dark:text-brand-50"}`}
          >
            {tvaStatus.percentLabel}
          </p>
        </div>
        <div className="card-modern p-5">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck
              size={14}
              className={
                tvaStatus.isExceeded ? "text-red-400" : "text-accent-500"
              }
            />
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              Reste disponible
            </p>
          </div>
          <p
            className={`text-2xl font-bold font-display ${tvaStatus.isExceeded ? "text-red-600 dark:text-red-400" : "text-accent-600 dark:text-accent-400"}`}
          >
            {tvaStatus.remaining.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            })}{" "}
            €
          </p>
        </div>
      </div>

      {/* Barre de progression seuil TVA */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-brand-800 dark:text-brand-200 text-sm">
            Progression vers le seuil TVA
          </h3>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${vatBadgeClass}`}
          >
            {vatBadgeLabel}
          </span>
        </div>

        <div className="relative h-6 bg-brand-100 dark:bg-brand-800 rounded-full overflow-hidden">
          {/* Progression CA — élément natif : pas d'inline style, sémantique ARIA intégrée */}
          <progress
            value={tvaStatus.progressPercent}
            max={100}
            data-state={progressState}
            className="vat-progress-bar absolute inset-0 w-full h-full"
            aria-label={`${tvaStatus.progressPercent}% du seuil TVA atteint`}
          />
          {/* Marqueur seuil initial */}
          <div
            className={`absolute top-0 h-full w-0.5 bg-amber-500/50 left-[${thresholdPercent}%]`}
          />
        </div>

        <div className="flex justify-between mt-2 text-[10px] text-brand-400 font-medium">
          <span>0 €</span>
          <span className="text-amber-600 font-bold">
            Franchise : {thresholds.tva.toLocaleString("fr-FR")} €
          </span>
          <span className="text-red-500 font-bold">
            Tolérance : {thresholds.tvaTolerance.toLocaleString("fr-FR")} €
          </span>
        </div>
      </div>

      {/* Graphique CA mensuel + cumulé */}
      <div className="card-modern p-6">
        <h3 className="font-bold text-brand-800 dark:text-brand-200 text-sm mb-5">
          CA mensuel et cumulé — {selectedYear}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={cumulativeData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="grad-ca" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-cumul" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value ?? 0).toLocaleString("fr-FR")} €`,
                String(name),
              ]}
              contentStyle={{ fontSize: 11, borderRadius: 12 }}
            />
            {/* Ligne seuil franchise */}
            <ReferenceLine
              y={thresholds.tva}
              stroke="#f59e0b"
              strokeDasharray="5 3"
              label={{
                value: "Seuil TVA",
                position: "insideTopRight",
                fontSize: 9,
                fill: "#f59e0b",
              }}
            />
            {/* Ligne seuil tolérance */}
            <ReferenceLine
              y={thresholds.tvaTolerance}
              stroke="#ef4444"
              strokeDasharray="5 3"
              label={{
                value: "Tolérance",
                position: "insideTopRight",
                fontSize: 9,
                fill: "#ef4444",
              }}
            />
            <Area
              type="monotone"
              dataKey="CA"
              stroke="#0f172a"
              fill="url(#grad-ca)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="Cumulé"
              stroke="#22c55e"
              fill="url(#grad-cumul)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Simulateur passage en TVA */}
      <div className="card-modern p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calculator size={16} className="text-brand-400" />
          <h3 className="font-bold text-brand-800 dark:text-brand-200 text-sm">
            Simulateur — Impact du passage en régime TVA
          </h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label
              className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2"
              htmlFor="vat-sim-amount"
            >
              Montant d'une facture (TTC simulé)
            </label>
            <div className="relative">
              <input
                id="vat-sim-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 5000"
                className="w-full pl-4 pr-10 py-2.5 border border-brand-100 dark:border-brand-700 rounded-2xl text-sm text-brand-900 dark:text-brand-50 bg-white dark:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
                value={simulationAmount}
                onChange={(e) => setSimulationAmount(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-400 text-sm">
                €
              </span>
            </div>
          </div>
          <div>
            <label
              className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2"
              htmlFor="vat-sim-rate"
            >
              Taux de TVA applicable
            </label>
            <select
              id="vat-sim-rate"
              value={simulationRate}
              onChange={(e) => setSimulationRate(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-brand-100 dark:border-brand-700 rounded-2xl text-sm text-brand-900 dark:text-brand-50 bg-white dark:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value={VAT_RATES.NORMAL}>Taux normal — 20%</option>
              <option value={VAT_RATES.REDUCED_1}>Taux réduit — 10%</option>
              <option value={VAT_RATES.REDUCED_2}>Taux réduit — 5,5%</option>
              <option value={VAT_RATES.SUPER_REDUCED}>
                Taux super-réduit — 2,1%
              </option>
            </select>
          </div>
        </div>

        {simulation ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Montant HT",
                value: `${simulation.ht.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
                sub: "encaissé net",
                color: "text-brand-900 dark:text-brand-50",
              },
              {
                label: "TVA collectée",
                value: `${simulation.vat.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
                sub: "à reverser au fisc",
                color: "text-amber-600",
              },
              {
                label: "Montant TTC",
                value: `${simulation.ttc > 0 ? parseFloat(simulationAmount).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "0"} €`,
                sub: "facturé au client",
                color: "text-brand-900 dark:text-brand-50",
              },
            ].map(({ label, value, sub, color }) => (
              <div
                key={label}
                className="bg-brand-50 dark:bg-brand-800/30 rounded-2xl p-4 text-center"
              >
                <p className="text-[9px] font-bold text-brand-400 uppercase tracking-widest mb-1">
                  {label}
                </p>
                <p className={`text-lg font-bold font-display ${color}`}>
                  {value}
                </p>
                <p className="text-[9px] text-brand-400 mt-1 italic">{sub}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-4 bg-brand-50 dark:bg-brand-800/20 rounded-2xl text-sm text-brand-400">
            <ArrowRight size={14} />
            Saisissez un montant pour voir l'impact TVA sur votre facturation.
          </div>
        )}

        <p className="mt-4 text-[10px] text-brand-300 italic">
          💡 En régime TVA, le CA pris en compte pour les plafonds
          micro-entreprise est le montant HT, ce qui réduit mécaniquement vos
          seuils apparents.
        </p>
      </div>
    </div>
  );
};

export default VATDashboardManager;
