import { useMemo } from "react";
import {
  InvoiceStatus,
  type Invoice,
  type Expense,
  type UserProfile,
} from "../types";
import {
  calculateThresholdStatus,
  calculateSocialContributions,
  getThresholds,
  type SocialContributions,
} from "../lib/fiscalCalculations";
import {
  projectRevenue,
  type MonthlyRevenue,
  type RevenueProjectionResult,
} from "../lib/revenueProjection";

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  fiscalStatus: ReturnType<typeof calculateThresholdStatus>;
  socialContributions: SocialContributions;
  estimatedTax: number;
  netAfterTax: number;
  vatProgress: number;
  currentThresholds: {
    micro: number;
    tva: number;
    tvaTolerance: number;
  };
  revenueProjection: RevenueProjectionResult;
  monthlyData: Array<{
    name: string;
    Recettes: number;
    Dépenses: number;
    Profit: number;
  }>;
  cashFlowStats: {
    currentMonthRevenue: number;
    lastMonthRevenue: number;
    diff: number;
    percent: number;
  };
}

export const useDashboardStats = (
  invoices: Invoice[],
  expenses: Expense[],
  userProfile: UserProfile,
): DashboardStats => {
  const totalRevenue = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        const type = inv.type || "invoice";
        if (type === "invoice") {
          return sum + inv.total;
        }
        if (type === "credit_note") {
          return sum - inv.total;
        }
        return sum;
      }, 0);
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const netProfit = totalRevenue - totalExpenses;

  const fiscalStatus = useMemo(() => {
    return calculateThresholdStatus(totalRevenue, userProfile);
  }, [totalRevenue, userProfile]);

  const socialContributions = useMemo(() => {
    return calculateSocialContributions(totalRevenue, userProfile);
  }, [totalRevenue, userProfile]);

  const estimatedTax = socialContributions.amount;
  const netAfterTax = netProfit - estimatedTax;

  const vatProgress = fiscalStatus.tva.percentage;

  const currentThresholds = useMemo(() => {
    return getThresholds(userProfile.activityType ?? "SERVICE_BNC", new Date());
  }, [userProfile.activityType, userProfile.businessStartDate, userProfile]);

  const revenueProjection = useMemo(() => {
    const monthsMap: Record<string, number> = {};
    invoices
      .filter(
        (inv) => inv.status === InvoiceStatus.PAID && inv.type === "invoice",
      )
      .forEach((inv) => {
        const key = inv.date.slice(0, 7); // YYYY-MM
        monthsMap[key] = (monthsMap[key] || 0) + inv.total;
      });
    const history: MonthlyRevenue[] = Object.entries(monthsMap).map(
      ([month, revenue]) => ({
        month,
        revenue,
      }),
    );
    return projectRevenue(
      history,
      6,
      userProfile.activityType ?? "SERVICE_BNC",
    );
  }, [invoices, userProfile.activityType]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    const months = [
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

    months.forEach((m) => (data[m] = { income: 0, expense: 0 }));

    invoices.forEach((inv) => {
      if (inv.status === InvoiceStatus.PAID) {
        const date = new Date(inv.date);
        const monthName = months[date.getMonth()];
        const type = inv.type || "invoice";
        if (type === "invoice") {
          data[monthName].income += inv.total;
        } else if (type === "credit_note") {
          data[monthName].income -= inv.total;
        }
      }
    });

    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      const monthName = months[date.getMonth()];
      data[monthName].expense += exp.amount;
    });

    return months.map((name) => ({
      name,
      Recettes: data[name].income,
      Dépenses: data[name].expense,
      Profit: data[name].income - data[name].expense,
    }));
  }, [invoices, expenses]);

  const cashFlowStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRevenue = invoices
      .filter((inv) => {
        const d = new Date(inv.date);
        return (
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear &&
          inv.status === InvoiceStatus.PAID
        );
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const lastMonthRevenue = invoices
      .filter((inv) => {
        const d = new Date(inv.date);
        return (
          d.getMonth() === lastMonth &&
          d.getFullYear() === lastMonthYear &&
          inv.status === InvoiceStatus.PAID
        );
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const diff = currentMonthRevenue - lastMonthRevenue;
    const percent = lastMonthRevenue > 0 ? (diff / lastMonthRevenue) * 100 : 0;

    return { currentMonthRevenue, lastMonthRevenue, diff, percent };
  }, [invoices]);

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    fiscalStatus,
    socialContributions,
    estimatedTax,
    netAfterTax,
    vatProgress,
    currentThresholds,
    revenueProjection,
    monthlyData,
    cashFlowStats,
  };
};
