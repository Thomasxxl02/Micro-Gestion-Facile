import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { LucideIcon } from "lucide-react";

import {
  CircleAlert as AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  CircleCheck as CheckCircle2,
  Euro,
  FileText,
  GripVertical,
  LoaderCircle as Loader2,
  Mail,
  Package,
  ShoppingCart,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ViewType } from "../hooks/useViewRouter";
import { checkCompliance2026 } from "../lib/complianceUtils";
import {
  calculateSocialContributions,
  calculateThresholdStatus,
  getThresholds,
} from "../lib/fiscalCalculations";
import { projectRevenue, type MonthlyRevenue } from "../lib/revenueProjection";
import { predictRevenue } from "../services/geminiService";
import { useAppStore } from "../store/appStore";
import {
  InvoiceStatus,
  type CalendarEvent,
  type Expense,
  type Invoice,
  type Product,
  type UserProfile,
} from "../types";
import { ChartSkeleton, StatCardSkeleton } from "./Skeleton";

interface DashboardProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  events?: CalendarEvent[];
  onNavigate: (view: ViewType) => void;
  userProfile: UserProfile;
  onSaveInvoice?: (invoice: Invoice) => void;
}

type WidgetId =
  | "stats"
  | "performance"
  | "expenses"
  | "activity"
  | "reminders"
  | "stock"
  | "prediction"
  | "stats-revenue"
  | "stats-profit"
  | "stats-net"
  | "stats-micro"
  | "stats-vat";

interface SortableWidgetProps {
  id: WidgetId;
  children: React.ReactNode;
  className?: string;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({
  id,
  children,
  className,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const transformValue = CSS.Transform.toString(transform);

  return (
    <div
      ref={setNodeRef}
      className={`dnd-sortable ${className} relative group transition-shadow duration-300 ${
        isDragging ? "shadow-2xl opacity-50" : "opacity-100"
      }`}
      {...{
        style: {
          ["--dnd-transform" as string]: transformValue,
          ["--dnd-transition" as string]: transition,
          ["--dnd-z-index" as string]: isDragging ? 50 : "auto",
        } as React.CSSProperties,
      }}
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        aria-label="Réordonner ce widget"
        className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-brand-300 hover:text-brand-600 z-20"
      >
        <GripVertical size={16} />
      </div>
      {children}
    </div>
  );
};

// Droppable Action Component
const DroppableAction: React.FC<{
  action: {
    id: string;
    icon?: LucideIcon;
    label?: string;
    onClick?: () => void;
    color?: string;
  };
}> = ({ action }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: action.id,
  });

  return (
    <button
      ref={setNodeRef}
      onClick={action.onClick}
      aria-label={action.label ? `${action.label}` : "Action non nommée"}
      className={`${action.color === "btn-primary" ? "btn-primary" : "btn-secondary"} ${isOver ? "scale-105 border-brand-500" : ""}`}
    >
      {action.icon &&
        React.createElement(action.icon, {
          size: 18,
          strokeWidth: 2,
          "aria-hidden": "true",
        })}
      <span>{action.label}</span>
      {isOver && action.id === "quick-action-invoice" && (
        <span className="absolute -bottom-8 left-0 right-0 text-center text-[10px] text-accent-600 font-bold whitespace-nowrap bg-white dark:bg-neutral-900 px-2 py-1 rounded shadow-sm border border-accent-100">
          Relâcher pour convertir
        </span>
      )}
    </button>
  );
};

// Draggable Quote Component
const DraggableQuote: React.FC<{
  quote: Invoice;
  onKeyDown?: (e: React.KeyboardEvent, quote: Invoice) => void;
}> = ({ quote, onKeyDown }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: `quote-${quote.id}`,
    });

  const transformValue = CSS.Transform.toString(transform);

  return (
    <div
      ref={setNodeRef}
      className={`interactive-item rounded-xl p-3 border border-brand-100 dark:border-brand-800 cursor-grab active:cursor-grabbing ${
        isDragging
          ? "bg-brand-50 shadow-lg scale-95 opacity-50"
          : "bg-white dark:bg-brand-900/50 opacity-100"
      }`}
      {...{
        style: {
          ["--dnd-transform" as string]: transformValue,
        } as React.CSSProperties,
      }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Devis ${quote.number} - ${quote.total.toLocaleString()} € - Glisser sur 'Facture' pour convertir`}
      onKeyDown={(e) => onKeyDown?.(e, quote)}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 rounded-lg">
          <FileText size={14} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-bold text-brand-900 dark:text-brand-50">
            {quote.number}
          </p>
          <p className="text-[10px] text-brand-400">
            {quote.total.toLocaleString()} €
          </p>
        </div>
      </div>
      <ArrowRight size={14} className="text-brand-200" aria-hidden="true" />
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = (props) => {
  const {
    invoices,
    expenses,
    onNavigate,
    userProfile,
    products,
    onSaveInvoice,
  } = props;

  const isSyncing = useAppStore((state) => state.isSyncing);

  const [prediction, setPrediction] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "fiscal">("overview");
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    const saved = localStorage.getItem("dashboard_widgets");
    return saved
      ? JSON.parse(saved)
      : [
          "stats",
          "performance",
          "expenses",
          "activity",
          "reminders",
          "stock",
          "prediction",
        ];
  });

  useEffect(() => {
    localStorage.setItem("dashboard_widgets", JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (_event: DragStartEvent) => {
    // setActiveId removed as unused
  };

  const handleKeyDown = (e: React.KeyboardEvent, quote: Invoice) => {
    if (e.key === "Enter" || e.key === " ") {
      // In a real dnd scenario, this would trigger the dnd action
      // Here we can at least navigate or show a menu
      e.preventDefault();
      alert(
        `Sélectionné : Devis ${quote.number}. Utilisez le glisser-déposer pour convertir.`,
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // setActiveId removed as unused
    const { active, over } = event;

    if (!over) {
      return;
    }

    // Handle Drop of Quote on Invoices (Transform)
    if (
      active.id.toString().startsWith("quote-") &&
      over.id === "quick-action-invoice"
    ) {
      const quoteId = active.id.toString().replace("quote-", "");
      const quote = invoices.find((inv) => inv.id === quoteId);
      if (quote && onSaveInvoice) {
        const newInvoice: Invoice = {
          ...quote,
          id: Date.now().toString(),
          type: "invoice",
          number: `F${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toISOString().split("T")[0],
          status: InvoiceStatus.DRAFT,
          linkedDocumentId: quote.id,
        };
        onSaveInvoice(newInvoice);
        alert(`Devis ${quote.number} transformé en facture brouillon !`);
        onNavigate("invoices");
      }
      return;
    }

    if (active.id !== over.id) {
      // ... existence check for widgetId
      if (widgetOrder.includes(active.id as WidgetId)) {
        setWidgetOrder((items) => {
          const oldIndex = items.indexOf(active.id as WidgetId);
          const newIndex = items.indexOf(over.id as WidgetId);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }
  };

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

  // New Fiscal Calculations using refined logic
  const fiscalStatus = useMemo(() => {
    return calculateThresholdStatus(totalRevenue, userProfile);
  }, [totalRevenue, userProfile]);

  const socialContributions = useMemo(() => {
    return calculateSocialContributions(totalRevenue, userProfile);
  }, [totalRevenue, userProfile]);

  const estimatedTax = socialContributions.amount;
  const netAfterTax = netProfit - estimatedTax;

  const vatProgress = fiscalStatus.tva.percentage;
  const currentThresholds = getThresholds(
    userProfile.activityType ?? "SERVICE_BNC",
  );

  // ── Projection de CA (régression linéaire locale) ──────────────────────────
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

  // Cash Flow Comparison
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

  const handlePredict = async () => {
    setIsPredicting(true);
    const paidInvoices = invoices.filter(
      (inv) => inv.status === InvoiceStatus.PAID && inv.type === "invoice",
    );
    const pendingQuotes = invoices.filter(
      (inv) =>
        (inv.status === InvoiceStatus.SENT ||
          inv.status === InvoiceStatus.ACCEPTED) &&
        inv.type === "quote",
    );
    const result = await predictRevenue(paidInvoices, pendingQuotes);
    setPrediction(result);
    setIsPredicting(false);
  };

  // Expense Breakdown
  const expensesByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach((exp) => {
      const cat = exp.category || "Autre";
      data[cat] = (data[cat] || 0) + exp.amount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [expenses]);

  const COLORS = ["#102a43", "#2cb1bc", "#486581", "#3ebd93", "#627d98"];

  // Combined Activity
  const recentActivity = useMemo(() => {
    const combined = [
      ...invoices.map((inv) => ({ ...inv, activityType: "invoice" as const })),
      ...expenses.map((exp) => ({ ...exp, activityType: "expense" as const })),
    ];
    return [...combined]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [invoices, expenses]);

  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.type === "product" &&
        p.stock !== undefined &&
        p.stock <= (p.minStock ?? 0) &&
        !p.archived,
    );
  }, [products]);

  const quickActions = [
    {
      id: "quick-action-invoice",
      label: "Facture",
      icon: FileText,
      onClick: () => onNavigate("invoices"),
      color: "btn-primary",
    },
    {
      id: "quick-action-expense",
      label: "Dépense",
      icon: TrendingDown,
      onClick: () => onNavigate("accounting"),
      color: "btn-secondary",
    },
    {
      id: "quick-action-client",
      label: "Client",
      icon: Users,
      onClick: () => onNavigate("clients"),
      color: "btn-secondary",
    },
    {
      id: "quick-action-email",
      label: "Email",
      icon: Mail,
      onClick: () => onNavigate("emails"),
      color: "btn-secondary",
    },
    {
      id: "quick-action-product",
      label: "Produit",
      icon: Package,
      onClick: () => onNavigate("products"),
      color: "btn-secondary",
    },
  ];

  return (
    <div className="space-y-12 pb-12 animate-fade-in">
      {/* Header avec Actions - Style 2026 Premium */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-accent-500 font-bold text-[11px] tracking-[0.2em] uppercase"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>Pilotage Intégré</span>
          </motion.div>

          <div className="flex items-baseline gap-4">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter font-display"
            >
              Bonjour,{" "}
              <span className="text-brand-600 dark:text-brand-400">
                {userProfile.companyName.split(" ")[0]}
              </span>
            </motion.h1>

            {/* Compliance Badge Subtil */}
            {(() => {
              const comp = checkCompliance2026(userProfile);
              return (
                <button
                  onClick={() => onNavigate("settings")}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all
                    ${
                      comp.isCompliant
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-400/20"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400 border border-rose-100 dark:border-rose-400/20 animate-pulse"
                    }
                  `}
                >
                  {comp.isCompliant ? (
                    <CheckCircle2 size={10} />
                  ) : (
                    <AlertCircle size={10} />
                  )}
                  {comp.isCompliant ? "Conforme" : "Alerte"}
                </button>
              );
            })()}
          </div>

          <p className="text-neutral-500 dark:text-neutral-400 font-medium max-w-xl text-lg mt-2">
            Votre activité est{" "}
            <span className="text-neutral-900 dark:text-neutral-50 font-bold">
              sous contrôle
            </span>{" "}
            pour ce mois d'avril.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2.5"
        >
          {quickActions.map((action) => (
            <DroppableAction key={action.id} action={action} />
          ))}
        </motion.div>
      </header>

      {/* Navigation Interne - Tabs Glass */}
      <nav className="flex gap-4 p-1.5 bg-brand-100/50 dark:bg-brand-900/30 rounded-2xl w-fit backdrop-blur-sm border border-brand-200/50 dark:border-brand-800/50">
        {[
          { id: "overview", label: "Général", icon: LayoutDashboard },
          { id: "fiscal", label: "Performances", icon: ShieldAlert },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "overview" | "fiscal")}
            className={`
              flex items-center gap-2.5 py-2.5 px-6 rounded-xl text-xs font-bold transition-all relative
              ${
                activeTab === tab.id
                  ? "bg-white dark:bg-brand-800 text-brand-950 dark:text-white shadow-sm"
                  : "text-brand-500/70 hover:text-brand-900 dark:hover:text-brand-100"
              }
            `}
          >
            <tab.icon
              size={14}
              className={
                activeTab === tab.id ? "text-brand-600 dark:text-brand-400" : ""
              }
            />
            {tab.label}
          </button>
        ))}
      </nav>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]"></div>

        <SortableContext
          items={widgetOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
            {/* eslint-disable-next-line complexity */}
            {widgetOrder.map((id) => {
              if (isSyncing) {
                if (id === "stats") {
                  return (
                    <React.Fragment key={id}>
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                    </React.Fragment>
                  );
                }
                if (id === "performance") {
                  return <ChartSkeleton key={id} />;
                }
                if (id === "activity") {
                  return (
                    <div
                      key={id}
                      className="card-pro p-6 h-75 animate-pulse bg-gray-100 dark:bg-gray-800"
                    />
                  );
                }
                return null;
              }

              if (id === "stats") {
                return (
                  <React.Fragment key={id}>
                    {/* Chiffre d'Affaires */}
                    <SortableWidget
                      id="stats-revenue"
                      className="lg:col-span-1"
                    >
                      <div className="card-modern card-hover-lift h-full flex flex-col justify-between overflow-hidden group">
                        <div className="absolute -right-6 -top-6 p-8 opacity-[0.03] group-hover:opacity-[0.1] group-hover:scale-110 transition-all duration-700 text-brand-900 dark:text-brand-50">
                          <TrendingUp size={140} />
                        </div>
                        <div className="p-6 h-full flex flex-col">
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-linear-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-800/20 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center shadow-inner border border-brand-100 dark:border-brand-800">
                              <Euro size={24} />
                            </div>
                            <div className="stat-badge">
                              <TrendingUp size={12} strokeWidth={3} />
                              Encaissé
                            </div>
                          </div>
                          <div className="mt-auto">
                            <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">
                              Chiffre d&apos;Affaires
                            </p>
                            <div className="flex items-baseline gap-2">
                              <h3 className="text-4xl font-black text-brand-950 dark:text-white tracking-tight font-display">
                                {totalRevenue.toLocaleString("fr-FR")} €
                              </h3>
                              <div
                                className={`flex items-center text-[11px] font-black px-2 py-0.5 rounded-lg ${cashFlowStats.percent >= 0 ? "text-sky-600 bg-sky-50 dark:bg-sky-900/20" : "text-rose-600 bg-rose-50 dark:bg-rose-900/20"}`}
                              >
                                {cashFlowStats.percent >= 0 ? "+" : ""}
                                {cashFlowStats.percent.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SortableWidget>

                    {/* Résultat Brut - Premium Card */}
                    <SortableWidget id="stats-profit" className="lg:col-span-1">
                      <div className="bg-linear-to-br from-brand-700 via-brand-600 to-brand-800 dark:from-indigo-600 dark:via-brand-600 dark:to-brand-800 text-white rounded-4xl p-6 h-full shadow-2xl shadow-brand-500/20 relative overflow-hidden group border border-white/10 hover:shadow-brand-500/40 transition-all duration-500">
                        <div className="absolute -right-8 -top-8 p-8 opacity-10 group-hover:opacity-25 group-hover:scale-110 transition-all duration-700">
                          <Sparkles size={160} />
                        </div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                            <Wallet size={24} />
                          </div>
                          <div className="px-3 py-1 bg-accent-400/20 border border-accent-400/30 rounded-full text-[10px] font-black uppercase tracking-widest text-accent-100 flex items-center gap-1.5 backdrop-blur-md">
                            <Zap
                              size={12}
                              className="fill-accent-400 animate-pulse"
                            />
                            Premium
                          </div>
                        </div>
                        <div className="relative z-10 mt-auto">
                          <p className="text-[10px] font-black text-brand-100/60 uppercase tracking-widest mb-1.5">
                            Résultat Brut
                          </p>
                          <h3 className="text-4xl font-black tracking-tight font-display drop-shadow-lg">
                            {netProfit.toLocaleString("fr-FR")} €
                          </h3>
                        </div>
                      </div>
                    </SortableWidget>

                    {/* Net Après Impôts */}
                    <SortableWidget id="stats-net" className="lg:col-span-1">
                      <div className="card-modern h-full flex flex-col justify-between overflow-hidden border-dashed group">
                        <div className="p-6 h-full flex flex-col">
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 rounded-2xl flex items-center justify-center border border-accent-100 dark:border-accent-800">
                              <Calculator size={24} />
                            </div>
                            <div className="group relative">
                              <AlertCircle
                                size={14}
                                className="text-neutral-300 dark:text-neutral-700 cursor-help transition-colors hover:text-brand-500"
                              />
                              <div className="absolute top-full right-0 mt-3 w-64 p-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs rounded-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 shadow-2xl border border-neutral-800 dark:border-neutral-200">
                                <p className="font-black mb-2 uppercase tracking-tight">
                                  Détails Fiscaux 2026
                                </p>
                                <div className="space-y-1 opacity-80 font-medium">
                                  <p className="flex justify-between">
                                    Type :{" "}
                                    <span className="font-bold">
                                      {userProfile.activityType ?? "BNC"}
                                    </span>
                                  </p>
                                  <p className="flex justify-between">
                                    Taux URSSAF :{" "}
                                    <span className="font-bold">
                                      {socialContributions.rate}%
                                    </span>
                                  </p>
                                  {userProfile.isAcreBeneficiary && (
                                    <p className="flex justify-between text-sky-500 font-bold">
                                      Bonus ACRE : <span>-50%</span>
                                    </p>
                                  )}
                                </div>
                                <div className="h-px bg-white/10 dark:bg-neutral-100 my-2" />
                                <p className="text-[10px] leading-relaxed opacity-60">
                                  Calcul basé sur les grilles fiscales
                                  actualisées (art. L133-6-8 CSS).
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-auto">
                            <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">
                              Net Estimé (après charges)
                            </p>
                            <h3 className="text-4xl font-black text-brand-950 dark:text-white tracking-tight font-display">
                              {netAfterTax.toLocaleString("fr-FR", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              €
                            </h3>
                          </div>
                        </div>
                      </div>
                    </SortableWidget>

                    {/* Micro Threshold Card (NEW) */}
                    <SortableWidget id="stats-micro" className="lg:col-span-1">
                      <div className="card-pro p-6 h-full flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                            Seuil Micro-Entreprise
                          </p>
                          <div className="flex justify-between items-end mt-1 mb-3">
                            <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-50 tracking-tight font-display">
                              {fiscalStatus.micro.percentage.toFixed(0)}%
                            </h3>
                            <span className="text-[9px] text-brand-400 mb-1 font-bold uppercase tracking-wider">
                              {currentThresholds.micro.toLocaleString()}€
                            </span>
                          </div>
                          <div className="w-full bg-brand-50 dark:bg-brand-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out w-[${Math.min(fiscalStatus.micro.percentage, 100)}%] ${fiscalStatus.micro.isNear ? "bg-gray-500" : "bg-brand-900 dark:bg-brand-50"}`}
                            ></div>
                          </div>
                          {fiscalStatus.micro.isNear && (
                            <p className="text-[8px] text-gray-500 font-bold mt-1.5">
                              Plafond proche :{" "}
                              {fiscalStatus.micro.remaining.toLocaleString()} €
                              restants
                            </p>
                          )}
                          {fiscalStatus.micro.isExceeded && (
                            <p className="text-[8px] text-red-500 font-bold mt-1.5 uppercase tracking-tighter">
                              Dépassement de plafond micro-entreprise
                            </p>
                          )}
                        </div>
                      </div>
                    </SortableWidget>

                    {/* VAT Threshold Card */}
                    <SortableWidget id="stats-vat" className="lg:col-span-1">
                      <div className="card-pro p-6 h-full flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                            Franchise TVA
                          </p>
                          <div className="flex justify-between items-end mt-1 mb-3">
                            <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-50 tracking-tight font-display">
                              {vatProgress.toFixed(0)}%
                            </h3>
                            <span className="text-[9px] text-brand-400 mb-1 font-bold uppercase tracking-wider">
                              {currentThresholds.tva.toLocaleString()}€
                            </span>
                          </div>
                          <div className="w-full bg-brand-50 dark:bg-brand-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out w-[${Math.min(vatProgress, 100)}%] ${fiscalStatus.tva.isNear ? "bg-red-500" : "bg-brand-900 dark:bg-brand-50"}`}
                            ></div>
                          </div>
                          {fiscalStatus.tva.isNear && (
                            <p className="text-[8px] text-red-500 font-bold mt-1.5 animate-pulse">
                              Attention : Seuil de franchise proche (
                              {fiscalStatus.tva.remaining.toLocaleString()} €
                              restants)
                            </p>
                          )}
                          {fiscalStatus.tva.isExceeded && (
                            <p className="text-[8px] text-red-500 font-bold mt-1.5">
                              Seuil dépassé !
                            </p>
                          )}
                        </div>
                      </div>
                    </SortableWidget>
                  </React.Fragment>
                );
              }

              if (id === "performance") {
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="md:col-span-2 lg:col-span-3 row-span-2"
                  >
                    <div className="card-pro p-8 h-full flex flex-col">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                        <div>
                          <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 font-display">
                            Performance Financière
                          </h3>
                          <p className="text-xs text-brand-400 font-medium">
                            Évolution de vos revenus et dépenses
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-900 dark:bg-brand-50"></span>
                            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                              Recettes
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                              Dépenses
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-h-75 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={monthlyData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <defs>
                              <linearGradient
                                id="colorRecettes"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#0f172a"
                                  stopOpacity={0.1}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#0f172a"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="colorDepenses"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#f87171"
                                  stopOpacity={0.1}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#f87171"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "#94a3b8",
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                              dy={15}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "#94a3b8",
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                              tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "1.25rem",
                                border: "none",
                                boxShadow:
                                  "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                                padding: "16px",
                                backgroundColor: "var(--card-bg)",
                                color: "var(--text-main)",
                                fontSize: "11px",
                                fontWeight: "600",
                              }}
                              formatter={(value) =>
                                typeof value === "number"
                                  ? `${value.toLocaleString("fr-FR")} €`
                                  : ""
                              }
                            />
                            <Area
                              type="monotone"
                              dataKey="Recettes"
                              stroke="#0f172a"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorRecettes)"
                            />
                            <Area
                              type="monotone"
                              dataKey="Dépenses"
                              stroke="#f87171"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorDepenses)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </SortableWidget>
                );
              }

              {
                /* Répartition Dépenses - Bento Small */
              }
              <SortableWidget
                id="expenses"
                className="lg:col-span-1 row-span-2"
              >
                <div className="card-modern p-6 flex flex-col h-full group">
                  <div className="mb-6">
                    <h3 className="text-sm font-black text-brand-950 dark:text-white font-display uppercase tracking-tight">
                      Répartition
                    </h3>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mt-0.5">
                      Postes de dépenses
                    </p>
                  </div>
                  {expensesByCategory.length > 0 ? (
                    <div className="flex flex-col h-full">
                      <div className="h-40 w-full mb-6 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expensesByCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                            >
                              {expensesByCategory.map((entry, idx) => (
                                <Cell
                                  key={entry.name}
                                  fill={COLORS[idx % COLORS.length]}
                                  className="hover:opacity-80 transition-opacity outline-none"
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-neutral-900)",
                                border: "none",
                                borderRadius: "12px",
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                              }}
                              itemStyle={{
                                color: "white",
                                fontSize: "10px",
                                fontWeight: "900",
                                textTransform: "uppercase",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">
                            Total
                          </p>
                          <p className="text-lg font-black text-brand-950 dark:text-white leading-none">
                            {expensesByCategory
                              .reduce((sum, item) => sum + item.value, 0)
                              .toLocaleString()}
                            €
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2.5 flex-1 overflow-auto custom-scrollbar-hide">
                        {expensesByCategory.map((cat, idx) => (
                          <div
                            key={cat.name}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: COLORS[idx % COLORS.length],
                                }}
                              ></div>
                              <span className="text-[10px] font-bold text-neutral-500 truncate max-w-20">
                                {cat.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-brand-950 dark:text-neutral-200">
                              {cat.value.toLocaleString()} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-100 dark:border-neutral-800 p-8">
                      <ShoppingBag size={40} className="mb-3 opacity-20" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-center leading-relaxed">
                        Aucune dépense
                        <br />
                        répertoriée
                      </p>
                    </div>
                  )}
                </div>
              </SortableWidget>;

              if (id === "activity") {
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="md:col-span-2 lg:col-span-2 row-span-2"
                  >
                    <div className="card-pro p-8 flex flex-col h-full">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 font-display">
                            Activité récente
                          </h3>
                          <p className="text-xs text-brand-400 font-medium">
                            Vos dernières transactions
                          </p>
                        </div>
                        <button
                          onClick={() => onNavigate("invoices")}
                          aria-label="Afficher toutes les factures"
                          className="text-[10px] font-bold text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-50 transition-colors flex items-center uppercase tracking-widest"
                        >
                          Tout voir{" "}
                          <ArrowRight
                            size={14}
                            className="ml-1.5"
                            aria-hidden="true"
                          />
                        </button>
                      </div>

                      <div className="flex-1 overflow-auto -mx-2 px-2 custom-scrollbar">
                        <div className="space-y-2">
                          {recentActivity.map(
                            (
                              item:
                                | Invoice
                                | (Expense & {
                                    activityType: "invoice" | "expense";
                                  }),
                            ) => {
                              const isExpense =
                                "activityType" in item &&
                                item.activityType === "expense";
                              const isInvoice =
                                "activityType" in item &&
                                item.activityType === "invoice";
                              const invoiceStatus = isInvoice
                                ? (item as unknown as Invoice).status
                                : null;
                              let activityIconClass =
                                "bg-brand-50 dark:bg-brand-800/50 text-brand-500";
                              if (invoiceStatus === InvoiceStatus.PAID) {
                                activityIconClass =
                                  "bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400";
                              } else if (invoiceStatus === InvoiceStatus.SENT) {
                                activityIconClass =
                                  "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400";
                              }
                              const iconClass = isInvoice
                                ? activityIconClass
                                : "bg-red-50 dark:bg-red-900/20 text-red-500";
                              let activityBadgeClass =
                                "bg-brand-50 dark:bg-brand-800/50 text-brand-600";
                              if (invoiceStatus === InvoiceStatus.PAID) {
                                activityBadgeClass =
                                  "bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400";
                              } else if (invoiceStatus === InvoiceStatus.SENT) {
                                activityBadgeClass =
                                  "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400";
                              }
                              const badgeClass = isInvoice
                                ? activityBadgeClass
                                : "bg-red-50 dark:bg-red-900/20 text-red-700";
                              let activityItemLabel = (item as Invoice).number;
                              if (isInvoice)
                                activityItemLabel = (item as unknown as Invoice)
                                  .number;
                              else if (isExpense)
                                activityItemLabel = (item as Expense)
                                  .description;
                              return (
                                <div
                                  key={item.id}
                                  role="link"
                                  tabIndex={0}
                                  aria-label={`Détails ${isExpense ? `de la dépense: ${(item as Expense).description}` : `de la facture: ${(item as Invoice).number}`} - ${item.date}`}
                                  onClick={() =>
                                    onNavigate(
                                      "activityType" in item &&
                                        item.activityType === "expense"
                                        ? "accounting"
                                        : "invoices",
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      onNavigate(
                                        "activityType" in item &&
                                          item.activityType === "expense"
                                          ? "accounting"
                                          : "invoices",
                                      );
                                    }
                                  }}
                                  className="flex items-center justify-between p-4 hover:bg-brand-50 dark:hover:bg-brand-800/50 rounded-2xl transition-all cursor-pointer border border-transparent group"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold
                                ${iconClass}`}
                                    >
                                      {"activityType" in item &&
                                      item.activityType === "invoice" ? (
                                        <FileText className="w-4.5 h-4.5" />
                                      ) : (
                                        <ShoppingCart className="w-4.5 h-4.5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-brand-900 dark:text-brand-50 group-hover:text-brand-950 dark:group-hover:text-white transition-colors">
                                        {activityItemLabel}
                                      </p>
                                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                                        {new Date(
                                          item.date,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`text-sm font-bold ${("activityType" in item && item.activityType === "expense") || (item as unknown as Invoice).type === "credit_note" ? "text-red-500" : "text-brand-900 dark:text-brand-50"}`}
                                    >
                                      {("activityType" in item &&
                                        item.activityType === "expense") ||
                                      (item as unknown as Invoice).type ===
                                        "credit_note"
                                        ? "-"
                                        : ""}
                                      {("total" in item
                                        ? item.total
                                        : (item as unknown as Expense).amount
                                      )?.toLocaleString("fr-FR")}{" "}
                                      €
                                    </p>
                                    <span
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block uppercase tracking-wider
                                   ${badgeClass}`}
                                    >
                                      {"activityType" in item &&
                                      item.activityType === "invoice"
                                        ? (item as unknown as Invoice).status
                                        : "Dépense"}
                                    </span>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </SortableWidget>
                );
              }

              if (id === "reminders") {
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="md:col-span-1 lg:col-span-1 border-dashed border-2 border-brand-100 dark:border-brand-800 rounded-4xl"
                  >
                    <div className="card-pro p-6 h-full flex flex-col bg-transparent shadow-none">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-brand-50 dark:bg-brand-800 text-brand-900 dark:text-brand-50 rounded-xl">
                          <Zap size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-brand-900 dark:text-brand-50 uppercase tracking-wider">
                          Devis à convertir
                        </h3>
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-75 pr-2 custom-scrollbar">
                        {invoices.some(
                          (i) =>
                            i.type === "quote" &&
                            i.status === InvoiceStatus.ACCEPTED,
                        ) ? (
                          <SortableContext
                            items={invoices
                              .filter(
                                (i) =>
                                  i.type === "quote" &&
                                  i.status === InvoiceStatus.ACCEPTED,
                              )
                              .map((q) => `quote-${q.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {invoices
                              .filter(
                                (i) =>
                                  i.type === "quote" &&
                                  i.status === InvoiceStatus.ACCEPTED,
                              )
                              .map((quote) => (
                                <DraggableQuote
                                  key={quote.id}
                                  quote={quote}
                                  onKeyDown={handleKeyDown}
                                />
                              ))}
                          </SortableContext>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-brand-300 py-10 opacity-50">
                            <CheckCircle2
                              size={32}
                              strokeWidth={1}
                              className="mb-2"
                            />
                            <p className="text-[10px] uppercase font-bold tracking-widest text-center">
                              Aucun devis accepté en attente
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-brand-50 dark:border-brand-800">
                        <p className="text-[9px] text-brand-400 italic">
                          Glissez un devis sur &quot;Facture&quot; pour le
                          convertir.
                        </p>
                      </div>
                    </div>
                  </SortableWidget>
                );
              }

              if (id === "stock") {
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="lg:col-span-1 row-span-2"
                  >
                    <div className="card-pro p-8 flex flex-col h-full">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 flex items-center gap-3 font-display">
                          <Package size={20} className="text-red-500" /> Stocks
                        </h3>
                      </div>
                      <div className="space-y-4 flex-1 overflow-auto custom-scrollbar">
                        {lowStockProducts.length > 0 ? (
                          lowStockProducts.slice(0, 4).map((product) => (
                            <div
                              key={product.id}
                              className="p-5 rounded-2xl border bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                                  {product.sku ?? "SANS SKU"}
                                </span>
                                <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 uppercase tracking-widest">
                                  Stock bas
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-brand-900 dark:text-brand-50">
                                  {product.name}
                                </p>
                                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                  {product.stock} {product.unit ?? "u."}
                                </p>
                              </div>
                              <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">
                                Seuil : {product.minStock}{" "}
                                {product.unit ?? "u."}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-brand-300">
                            <Package
                              size={36}
                              className="mb-3 opacity-20 text-brand-500"
                            />
                            <p className="text-[10px] font-bold uppercase tracking-widest">
                              Stocks OK
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </SortableWidget>
                );
              }

              if (id === "prediction") {
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-4 zen-hidden"
                  >
                    <div className="card-pro p-6 relative overflow-hidden">
                      {/* Alertes seuils dynamiques */}
                      {revenueProjection.alerts.length > 0 && (
                        <div className="mb-5 space-y-2">
                          {revenueProjection.alerts.map((alert, i) => (
                            <div
                              key={i}
                              role="alert"
                              className={`flex items-start gap-3 p-3 rounded-xl text-[11px] font-semibold ${
                                alert.severity === "danger"
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30"
                                  : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30"
                              }`}
                            >
                              <AlertCircle
                                size={14}
                                className="shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              {alert.message}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div>
                          <div className="flex items-center gap-2">
                            <TrendingUp
                              size={16}
                              className="text-accent-600"
                              aria-hidden="true"
                            />
                            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.15em]">
                              Projection CA — 6 mois
                            </p>
                          </div>
                          <div className="flex items-baseline gap-3 mt-1">
                            <span className="text-xl font-bold text-brand-900 dark:text-brand-50 font-display">
                              {revenueProjection.forecast[0]
                                ? `~${revenueProjection.forecast[0].projected.toLocaleString("fr-FR")} €`
                                : "—"}
                            </span>
                            <span className="text-[10px] text-brand-400 font-medium">
                              prochain mois estimé
                            </span>
                            {revenueProjection.monthlyTrend !== 0 && (
                              <span
                                className={`flex items-center text-[10px] font-bold ${
                                  revenueProjection.monthlyTrend >= 0
                                    ? "text-accent-600"
                                    : "text-red-500"
                                }`}
                              >
                                {revenueProjection.monthlyTrend >= 0 ? (
                                  <ArrowUpRight size={12} aria-hidden="true" />
                                ) : (
                                  <ArrowDownRight
                                    size={12}
                                    aria-hidden="true"
                                  />
                                )}
                                {Math.abs(
                                  revenueProjection.monthlyTrend,
                                ).toFixed(0)}{" "}
                                €/mois
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {revenueProjection.confidence > 0 && (
                            <span className="text-[9px] font-bold text-brand-300 uppercase tracking-wider">
                              Fiabilité :{" "}
                              {Math.round(revenueProjection.confidence * 100)}%
                            </span>
                          )}
                          <button
                            onClick={() => {
                              void handlePredict();
                            }}
                            disabled={isPredicting}
                            aria-label={
                              isPredicting
                                ? "Analyse IA en cours..."
                                : "Analyse IA du CA"
                            }
                            className="flex items-center gap-2 bg-brand-600 dark:bg-white text-white dark:text-brand-900 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all hover:bg-brand-700 dark:hover:bg-brand-50 shadow-lg shadow-brand-600/20"
                          >
                            {isPredicting ? (
                              <Loader2
                                size={12}
                                className="animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Sparkles size={12} aria-hidden="true" />
                            )}
                            Analyse IA
                          </button>
                        </div>
                      </div>

                      {/* Graphique projection */}
                      {revenueProjection.forecast.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart
                            data={[
                              ...revenueProjection.history
                                .slice(-3)
                                .map((h) => ({
                                  name: h.month.slice(5),
                                  Historique: h.revenue,
                                  Projection: null as number | null,
                                })),
                              ...revenueProjection.forecast.map((f) => ({
                                name: f.month.slice(5),
                                Historique: null as number | null,
                                Projection: f.projected,
                              })),
                            ]}
                            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="grad-hist"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#0f172a"
                                  stopOpacity={0.15}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#0f172a"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="grad-proj"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#22c55e"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#22c55e"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 9 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 9 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              formatter={(value, name) =>
                                value !== null
                                  ? [
                                      `${Number(value).toLocaleString("fr-FR")} €`,
                                      String(name),
                                    ]
                                  : ["-", String(name)]
                              }
                              contentStyle={{ fontSize: 10, borderRadius: 12 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="Historique"
                              stroke="#0f172a"
                              fill="url(#grad-hist)"
                              strokeWidth={2}
                              dot={false}
                              connectNulls
                            />
                            <Area
                              type="monotone"
                              dataKey="Projection"
                              stroke="#22c55e"
                              fill="url(#grad-proj)"
                              strokeWidth={2}
                              strokeDasharray="5 3"
                              dot={false}
                              connectNulls
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-brand-300 text-[10px] font-bold uppercase tracking-widest">
                          Pas encore assez de données historiques
                        </div>
                      )}

                      {/* Analyse IA */}
                      {prediction && (
                        <div className="mt-4 p-4 bg-brand-50 dark:bg-brand-800/30 rounded-2xl border border-brand-100 dark:border-brand-800">
                          <div className="flex items-start gap-2">
                            <Sparkles
                              size={12}
                              className="text-accent-600 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <p className="text-[10px] text-brand-600 dark:text-brand-300 leading-relaxed">
                              {prediction}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </SortableWidget>
                );
              }

              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Dashboard;
