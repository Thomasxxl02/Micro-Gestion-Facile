/**
 * 🎨 EXEMPLES DE COMPOSANTS STYLISÉS PRO
 * ─────────────────────────────────────────────────────────
 * Ce fichier montre comment utiliser le système de style
 * professionnel Night Indigo & Royal Gold dans vos composants React.
 */

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Card Financière Premium
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

export const FinancialCard: React.FC<{
  title: string;
  amount: string;
  trend: "profit" | "loss" | "neutral" | "pending";
  icon?: React.ReactNode;
}> = ({ title, amount, trend, icon }) => {
  const trendClasses = {
    profit: "financial-profit",
    loss: "financial-loss",
    neutral: "financial-neutral",
    pending: "financial-pending",
  };

  return (
    <div className={`financial-stat ${trendClasses[trend]} group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="shrink-0">{icon}</div>
        <div className="grow">
          <h3 className="text-caption">{title}</h3>
          <p className="text-2xl font-black tracking-tighter">{amount}</p>
        </div>
        {icon || <TrendingUp className="w-5 h-5 opacity-60" />}
      </div>
      <p className="text-lead">{amount}</p>
      <p className="text-sm opacity-75 mt-2">Ce mois</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Alert/Banner Premium
// ═══════════════════════════════════════════════════════════════

export const Alert: React.FC<{
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  icon?: React.ReactNode;
}> = ({ type, title, message, icon }) => {
  const alertClasses = {
    success: "alert-success",
    warning: "alert-warning",
    error: "alert-error",
    info: "alert-info",
  };

  return (
    <div className={`alert ${alertClasses[type]}`}>
      <div className="shrink-0">{icon}</div>
      <div className="grow">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm opacity-90 mt-1">{message}</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Badge/Status Indicator
// ═══════════════════════════════════════════════════════════════

export const Badge: React.FC<{
  variant: "success" | "warning" | "error" | "info" | "premium";
  children: React.ReactNode;
  dot?: boolean;
}> = ({ variant, children, dot }) => {
  const badgeClasses = {
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    info: "badge-info",
    premium: "badge-premium",
  };

  return (
    <div className={`${badgeClasses[variant]}`}>
      {dot && <span className="w-2 h-2 rounded-full bg-current" />}
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Table Professionnelle
// ═══════════════════════════════════════════════════════════════

export const Table: React.FC<{
  headers: string[];
  rows: (string | React.ReactNode)[][];
}> = ({ headers, rows }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <table className="table-modern">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Form Input avec Validation
// ═══════════════════════════════════════════════════════════════

export const FormField: React.FC<{
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
}> = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  helper,
  icon,
}) => {
  return (
    <div>
      <label className="label-modern">{label}</label>
      <div className="input-group">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`input-modern ${icon ? "with-icon" : ""} ${
            error ? "border-red-500 focus:ring-red-500/10" : ""
          }`}
        />
      </div>
      {error && <p className="form-error">❌ {error}</p>}
      {helper && <p className="form-helper">{helper}</p>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Button Group (Actions)
// ═══════════════════════════════════════════════════════════════

export const ButtonGroup: React.FC<{
  primary?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  danger?: { label: string; onClick: () => void };
}> = ({ primary, secondary, danger }) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {primary && (
        <button onClick={primary.onClick} className="btn-primary">
          {primary.label}
        </button>
      )}
      {secondary && (
        <button onClick={secondary.onClick} className="btn-secondary">
          {secondary.label}
        </button>
      )}
      {danger && (
        <button
          onClick={danger.onClick}
          className="px-6 py-3.5 rounded-2xl font-bold transition-all text-white bg-red-600 hover:bg-red-700 active:scale-[0.98]"
        >
          {danger.label}
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Loading Skeleton
// ═══════════════════════════════════════════════════════════════

export const Skeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-text" />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Dashboard Section
// ═══════════════════════════════════════════════════════════════

export const DashboardSection: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, subtitle, children, action }) => {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-lead mb-2">{title}</h2>
            {subtitle && <p className="text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
        <div className="divider mb-8" />
        {children}
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Card Grid (Bento Layout)
// ═══════════════════════════════════════════════════════════════

export const CardGrid: React.FC<{
  title: string;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}> = ({ title, children, columns = 3 }) => {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-2",
    3: "grid-cards",
  };

  return (
    <div>
      <h3 className="text-subtitle mb-6">{title}</h3>
      <div className={`grid ${gridClass[columns]} gap-6`}>{children}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 COMPOSANT: Premium Stat Display
// ═══════════════════════════════════════════════════════════════

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  variant?: "default" | "premium" | "accent";
  icon?: React.ReactNode;
}> = ({ label, value, unit, variant = "default", icon }) => {
  const variantClass = {
    default:
      "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800",
    premium:
      "bg-gradient-to-br from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 border-brand-200 dark:border-brand-800",
    accent:
      "bg-gradient-to-br from-accent-50 to-yellow-50 dark:from-accent-900/20 dark:to-yellow-900/20 border-accent-200 dark:border-accent-800",
  };

  return (
    <div className={`card-modern p-6 ${variantClass[variant]}`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-caption text-neutral-600 dark:text-neutral-400">
          {label}
        </p>
        {icon}
      </div>
      <p className="text-lead">
        {value}
        {unit && <span className="text-sm ml-2">{unit}</span>}
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// 📦 EXEMPLE D'UTILISATION COMPLÈTE
// ═══════════════════════════════════════════════════════════════

export const DashboardExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Alert Banner */}
      <div className="p-6 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <Alert
          type="info"
          title="Bienvenue!"
          message="Consulter votre vue d'ensemble financière."
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      {/* Main Content */}
      <DashboardSection
        title="Aperçu Financier"
        subtitle="Statistiques de ce mois"
        action={<button className="btn-primary">Exporter</button>}
      >
        {/* Stats Row */}
        <CardGrid title="Métriques Clés" columns={3}>
          <StatCard
            label="Revenu Total"
            value="15,420"
            unit="€"
            variant="premium"
          />
          <StatCard label="Dépenses" value="4,820" unit="€" variant="accent" />
          <StatCard label="Bénéfice Net" value="10,600" unit="€" />
        </CardGrid>

        {/* Financial Cards */}
        <div className="mt-12">
          <h3 className="text-subtitle mb-6">Statut Factures</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FinancialCard
              title="Factures Payées"
              amount="9,200 €"
              trend="profit"
            />
            <FinancialCard
              title="Factures En Attente"
              amount="6,220 €"
              trend="pending"
            />
          </div>
        </div>
      </DashboardSection>
    </div>
  );
};
