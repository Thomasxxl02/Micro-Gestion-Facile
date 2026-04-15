import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  GripVertical,
  Loader2,
  Mail,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
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
import { predictRevenue } from "../services/geminiService";
import {
  CalendarEvent,
  Expense,
  Invoice,
  InvoiceStatus,
  Product,
  UserProfile,
} from "../types";

interface DashboardProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  emails?: any[];
  events?: CalendarEvent[];
  onNavigate: (page: string) => void;
  userProfile: UserProfile;
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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} relative group`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-brand-300 hover:text-brand-600 z-20"
      >
        <GripVertical size={16} />
      </div>
      {children}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  products,
  expenses,
  emails = [],
  events = [],
  onNavigate,
  userProfile,
}) => {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
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
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as WidgetId);
        const newIndex = items.indexOf(over.id as WidgetId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  const totalRevenue = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        const type = inv.type || "invoice";
        if (type === "invoice") return sum + inv.total;
        if (type === "credit_note") return sum - inv.total;
        return sum;
      }, 0);
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const netProfit = totalRevenue - totalExpenses;

  // URSSAF Calculation Logic
  const urssafRates = {
    SALE: 12.3,
    SERVICE_BIC: 21.2,
    SERVICE_BNC: 21.1,
    LIBERAL: 23.1,
  };

  const baseRate = userProfile.activityType
    ? urssafRates[userProfile.activityType]
    : 21.1;
  const taxRate = userProfile.isAcreBeneficiary ? baseRate / 2 : baseRate;
  const estimatedTax = totalRevenue * (taxRate / 100);
  const netAfterTax = netProfit - estimatedTax;

  // Thresholds Logic
  const thresholds = {
    SALE: { vat: 91900, revenue: 188700 },
    SERVICE_BIC: { vat: 36800, revenue: 77700 },
    SERVICE_BNC: { vat: 36800, revenue: 77700 },
    LIBERAL: { vat: 36800, revenue: 77700 },
  };

  const currentThresholds = userProfile.activityType
    ? thresholds[userProfile.activityType]
    : thresholds["SERVICE_BNC"];
  const vatProgress = Math.min(
    (totalRevenue / currentThresholds.vat) * 100,
    100,
  );
  const revenueProgress = Math.min(
    (totalRevenue / currentThresholds.revenue) * 100,
    100,
  );

  const pendingRevenue = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === InvoiceStatus.SENT)
      .reduce((sum, inv) => {
        const type = inv.type || "invoice";
        if (type === "invoice") return sum + inv.total;
        return sum;
      }, 0);
  }, [invoices]);

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
        if (type === "invoice") data[monthName].income += inv.total;
        else if (type === "credit_note") data[monthName].income -= inv.total;
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

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  // Combined Activity
  const recentActivity = useMemo(() => {
    const combined = [
      ...invoices.map((inv) => ({ ...inv, activityType: "invoice" as const })),
      ...expenses.map((exp) => ({ ...exp, activityType: "expense" as const })),
    ];
    return combined
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [invoices, expenses]);

  // Thresholds (2024 approx for services)
  const VAT_THRESHOLD = 36800;

  const progressPercentage = Math.min(
    (totalRevenue / VAT_THRESHOLD) * 100,
    100,
  );

  const lowStockProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.type === "product" &&
        p.stock !== undefined &&
        p.stock <= (p.minStock || 0) &&
        !p.archived,
    );
  }, [products]);

  const quickActions = [
    { label: "Facture", icon: FileText, onClick: () => onNavigate("invoices") },
    {
      label: "Dépense",
      icon: TrendingDown,
      onClick: () => onNavigate("accounting"),
    },
    { label: "Client", icon: Users, onClick: () => onNavigate("clients") },
    { label: "Email", icon: Mail, onClick: () => onNavigate("emails") },
    { label: "Produit", icon: Package, onClick: () => onNavigate("products") },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2
            className="text-3xl font-bold tracking-tight font-display rounded-lg px-2 py-1 -ml-2 w-fit"
            style={{ backgroundColor: "#ffffff", color: "#498ed3" }}
          >
            Tableau de bord
          </h2>
          <p className="text-brand-500 dark:text-brand-400 mt-1 text-sm">
            Aperçu de votre activité et de vos revenus.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md text-white border border-transparent`}
              style={{ backgroundColor: "#3d7ab8" }}
            >
              <action.icon size={16} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgetOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
            {widgetOrder.map((id) => {
              if (id === "stats")
                return (
                  <React.Fragment key={id}>
                    {/* Total Revenue Card */}
                    <SortableWidget
                      id="stats-revenue"
                      className="lg:col-span-1"
                    >
                      <div className="card-modern p-6 h-full flex flex-col justify-between relative overflow-hidden group bg-pastel-blue dark:bg-brand-900 border-l-4 border-l-vibrant-blue hover:border-l-blue-600 transition-all duration-500">
                        <div className="absolute -right-4 -top-4 p-8 opacity-[0.05] group-hover:opacity-[0.15] transition-all duration-700 group-hover:scale-110 text-vibrant-blue dark:text-blue-400">
                          <TrendingUp size={120} />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white/60 dark:bg-blue-900/20 text-vibrant-blue dark:text-blue-400 rounded-2xl shadow-sm group-hover:shadow-blue-500/20 transition-all duration-500 backdrop-blur-sm">
                            <Euro size={20} />
                          </div>
                          <span className="flex items-center text-[9px] font-bold uppercase tracking-widest text-vibrant-blue bg-white/60 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-white/40 dark:border-blue-900/30 backdrop-blur-sm">
                            Encaissé
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-800/70 dark:text-brand-500 uppercase tracking-[0.2em] mb-1">
                            Chiffre d'Affaires
                          </p>
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter font-display">
                              {totalRevenue.toLocaleString("fr-FR")} €
                            </h3>
                            <div
                              className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg ${cashFlowStats.percent >= 0 ? "text-emerald-700 bg-emerald-100/80 dark:bg-emerald-900/20" : "text-rose-700 bg-rose-100/80 dark:bg-rose-900/20"}`}
                            >
                              {cashFlowStats.percent >= 0 ? (
                                <ArrowUpRight size={12} />
                              ) : (
                                <ArrowDownRight size={12} />
                              )}
                              {Math.abs(cashFlowStats.percent).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </SortableWidget>

                    {/* Profit Card */}
                    <SortableWidget id="stats-profit" className="lg:col-span-1">
                      <div className="bg-linear-to-br from-vibrant-indigo to-vibrant-purple dark:from-brand-950 dark:to-black text-white p-6 rounded-[2.5rem] h-full shadow-2xl shadow-vibrant-indigo/30 dark:shadow-brand-900/20 relative overflow-hidden group border border-white/10 transition-all duration-500 hover:-translate-y-1">
                        <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 group-hover:scale-110">
                          <TrendingUp size={120} />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-md border border-white/10">
                            <Wallet size={20} />
                          </div>
                          <span className="flex items-center text-[9px] font-bold uppercase tracking-widest text-white bg-white/20 px-3 py-1.5 rounded-full border border-white/10">
                            Brut
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em] mb-1">
                            Résultat Brut
                          </p>
                          <h3 className="text-3xl font-black tracking-tighter font-display">
                            {netProfit.toLocaleString("fr-FR")} €
                          </h3>
                        </div>
                      </div>
                    </SortableWidget>

                    {/* Net After Tax Card */}
                    <SortableWidget id="stats-net" className="lg:col-span-1">
                      <div className="card-modern p-6 h-full flex flex-col justify-between border-l-4 border-l-vibrant-emerald bg-pastel-green dark:bg-brand-900 hover:border-l-emerald-600 transition-all duration-500">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white/60 dark:bg-emerald-900/20 text-vibrant-emerald dark:text-emerald-400 rounded-2xl shadow-sm backdrop-blur-sm">
                            <Calculator size={20} />
                          </div>
                          <div className="group relative">
                            <AlertCircle
                              size={14}
                              className="text-emerald-600 dark:text-emerald-300 cursor-help"
                            />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-4 bg-brand-900 text-white text-[10px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 shadow-2xl border border-white/10 backdrop-blur-xl">
                              Estimation après déduction de {taxRate}% de
                              cotisations sociales.
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-800/70 dark:text-brand-500 uppercase tracking-[0.2em] mb-1">
                            Revenu Net Est.
                          </p>
                          <h3 className="text-3xl font-black text-emerald-950 dark:text-emerald-400 tracking-tighter font-display">
                            {netAfterTax.toLocaleString("fr-FR", {
                              maximumFractionDigits: 0,
                            })}{" "}
                            €
                          </h3>
                        </div>
                      </div>
                    </SortableWidget>

                    {/* VAT Threshold Card */}
                    <SortableWidget id="stats-vat" className="lg:col-span-1">
                      <div className="card-modern p-6 h-full flex flex-col justify-between relative overflow-hidden bg-pastel-yellow dark:bg-brand-900 border-l-4 border-l-vibrant-amber hover:border-l-amber-600 transition-all duration-500">
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold text-amber-800/70 dark:text-brand-500 uppercase tracking-[0.2em] mb-1">
                            Franchise TVA
                          </p>
                          <div className="flex justify-between items-end mb-3">
                            <h3 className="text-3xl font-black text-amber-950 dark:text-amber-400 tracking-tighter font-display">
                              {vatProgress.toFixed(0)}%
                            </h3>
                            <span className="text-[9px] text-amber-600 dark:text-amber-500 mb-1 font-bold uppercase tracking-widest">
                              {currentThresholds.vat.toLocaleString()}€
                            </span>
                          </div>
                          <div className="w-full bg-white/60 dark:bg-amber-900/20 rounded-full h-2 overflow-hidden shadow-inner backdrop-blur-sm">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${vatProgress > 85 ? "bg-vibrant-rose" : "bg-vibrant-amber"}`}
                              style={{ width: `${vatProgress}%` }}
                            ></div>
                          </div>
                          {vatProgress > 85 && (
                            <p className="text-[8px] text-rose-600 dark:text-rose-500 font-bold mt-2 animate-pulse uppercase tracking-widest">
                              Seuil de TVA imminent !
                            </p>
                          )}
                        </div>
                      </div>
                    </SortableWidget>
                  </React.Fragment>
                );

              if (id === "performance")
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="md:col-span-2 lg:col-span-3 row-span-2"
                  >
                    <div className="card-modern p-8 h-full flex flex-col">
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

                      <div className="flex-1 min-h-[300px] w-full">
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
                                  stopColor="var(--brand-accent)"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--brand-accent)"
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
                                  stopColor="#f43f5e"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#f43f5e"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="var(--card-border)"
                              opacity={0.5}
                            />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "var(--text-muted)",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                              dy={15}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "var(--text-muted)",
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                              tickFormatter={(value) => `${value / 1000}k`}
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: "1.5rem",
                                border: "1px solid var(--card-border)",
                                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)",
                                padding: "16px",
                                backgroundColor: "var(--card-bg)",
                                color: "var(--text-main)",
                                fontSize: "11px",
                                fontWeight: "700",
                                backdropFilter: "blur(10px)",
                              }}
                              itemStyle={{ padding: "2px 0" }}
                              formatter={(value: any) => [
                                `${(value || 0).toLocaleString("fr-FR")} €`,
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="Recettes"
                              stroke="var(--brand-accent)"
                              strokeWidth={4}
                              fillOpacity={1}
                              fill="url(#colorRecettes)"
                            />
                            <Area
                              type="monotone"
                              dataKey="Dépenses"
                              stroke="#f43f5e"
                              strokeWidth={4}
                              fillOpacity={1}
                              fill="url(#colorDepenses)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </SortableWidget>
                );

              if (id === "expenses")
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="lg:col-span-1 row-span-2"
                  >
                    <div className="card-modern p-8 flex flex-col h-full">
                      <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 mb-8 font-display">
                        Répartition Dépenses
                      </h3>
                      {expensesByCategory.length > 0 ? (
                        <div className="flex flex-col h-full">
                          <div className="h-48 w-full mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={expensesByCategory}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={8}
                                  dataKey="value"
                                >
                                  {expensesByCategory.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value: any) => [
                                    `${(Number(value) || 0).toFixed(2)} €`,
                                    "",
                                  ]}
                                  contentStyle={{
                                    borderRadius: "12px",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    backgroundColor: "var(--card-bg)",
                                    color: "var(--text-main)",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-4 flex-1 overflow-auto custom-scrollbar pr-2">
                            {expensesByCategory.map((cat, idx) => (
                              <div
                                key={cat.name}
                                className="flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor:
                                        COLORS[idx % COLORS.length],
                                    }}
                                  ></div>
                                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                                    {cat.name}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-black text-brand-900 dark:text-brand-50">
                                    {cat.value.toLocaleString()} €
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-brand-300 bg-brand-50/50 dark:bg-brand-800/10 rounded-3xl border border-dashed border-brand-100 dark:border-brand-700 p-8">
                          <TrendingDown size={48} className="mb-4 opacity-20" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">
                            Aucune dépense
                          </p>
                        </div>
                      )}
                    </div>
                  </SortableWidget>
                );

              if (id === "activity")
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="md:col-span-2 lg:col-span-2 row-span-2"
                  >
                    <div className="card-modern p-8 flex flex-col h-full">
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
                          className="text-[10px] font-bold text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-50 transition-colors flex items-center uppercase tracking-widest"
                        >
                          Tout voir <ArrowRight size={14} className="ml-1.5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-auto -mx-2 px-2 custom-scrollbar">
                        <div className="space-y-3">
                          {recentActivity.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-4 hover:bg-brand-50 dark:hover:bg-brand-800/50 rounded-3xl transition-all cursor-pointer border border-transparent hover:border-brand-100 dark:hover:border-brand-800 group shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-bold shadow-inner
                                ${
                                  item.activityType === "invoice"
                                    ? (item as Invoice).status ===
                                      InvoiceStatus.PAID
                                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                                      : (item as Invoice).status ===
                                          InvoiceStatus.SENT
                                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                        : "bg-brand-50 dark:bg-brand-800/50 text-brand-500"
                                    : "bg-rose-50 dark:bg-rose-900/20 text-rose-500"
                                }`}
                                >
                                  {item.activityType === "invoice" ? (
                                    <FileText size={20} />
                                  ) : (
                                    <ShoppingCart size={20} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-brand-900 dark:text-brand-50 group-hover:text-brand-950 dark:group-hover:text-white transition-colors">
                                    {item.activityType === "invoice"
                                      ? (item as Invoice).number
                                      : (item as Expense).description}
                                  </p>
                                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mt-0.5">
                                    {new Date(item.date).toLocaleDateString(
                                      "fr-FR",
                                      { day: "numeric", month: "short" },
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`text-sm font-black ${item.activityType === "expense" || (item as Invoice).type === "credit_note" ? "text-rose-500" : "text-brand-900 dark:text-brand-50"}`}
                                >
                                  {item.activityType === "expense" ||
                                  (item as Invoice).type === "credit_note"
                                    ? "-"
                                    : ""}
                                  {(item as any).total?.toLocaleString(
                                    "fr-FR",
                                  ) ||
                                    (item as any).amount?.toLocaleString(
                                      "fr-FR",
                                    )}{" "}
                                  €
                                </p>
                                <span
                                  className={`text-[9px] font-black px-2.5 py-1 rounded-lg mt-2 inline-block uppercase tracking-widest
                                   ${
                                     item.activityType === "invoice"
                                       ? (item as Invoice).status ===
                                         InvoiceStatus.PAID
                                         ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                         : (item as Invoice).status ===
                                             InvoiceStatus.SENT
                                           ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                           : "bg-brand-50 dark:bg-brand-800/50 text-brand-600"
                                       : "bg-rose-50 dark:bg-rose-900/20 text-rose-700"
                                   }`}
                                >
                                  {item.activityType === "invoice"
                                    ? (item as Invoice).status
                                    : "Dépense"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SortableWidget>
                );

              if (id === "reminders")
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="md:col-span-2 lg:col-span-2 row-span-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                      {/* Calendar Section */}
                      <div className="card-modern p-8 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 flex items-center gap-3 font-display">
                            <Calendar
                              size={20}
                              className="text-brand-900 dark:text-brand-50"
                            />{" "}
                            Agenda
                          </h3>
                          <button
                            onClick={() => onNavigate("calendar")}
                            className="text-[10px] font-bold text-brand-400 hover:text-brand-900 dark:hover:text-brand-50 uppercase tracking-widest"
                          >
                            Voir tout
                          </button>
                        </div>
                        <div className="space-y-4 flex-1 overflow-auto custom-scrollbar">
                          {events.filter(
                            (ev) => new Date(ev.start) >= new Date(),
                          ).length > 0 ? (
                            events
                              .filter((ev) => new Date(ev.start) >= new Date())
                              .sort(
                                (a, b) =>
                                  new Date(a.start).getTime() -
                                  new Date(b.start).getTime(),
                              )
                              .slice(0, 4)
                              .map((event) => (
                                <div
                                  key={event.id}
                                  className="p-4 rounded-2xl border border-brand-100 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-800/50 hover:bg-brand-50 dark:hover:bg-brand-800 transition-all cursor-pointer group"
                                  onClick={() => onNavigate("calendar")}
                                >
                                  <div className="flex justify-between items-start mb-1.5">
                                    <span className="text-xs font-bold text-brand-900 dark:text-brand-50 truncate max-w-[120px] group-hover:text-brand-950 dark:group-hover:text-white">
                                      {event.title}
                                    </span>
                                    <span className="text-[9px] font-bold text-brand-400 uppercase">
                                      {new Date(
                                        event.start,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-500">
                                    <Clock size={12} />
                                    {new Date(event.start).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-brand-300">
                              <Calendar size={36} className="mb-3 opacity-20" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">
                                Aucun rendez-vous
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reminders Section */}
                      <div className="card-modern p-8 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 flex items-center gap-3 font-display">
                            <Bell size={20} className="text-amber-500" />{" "}
                            Rappels
                          </h3>
                        </div>
                        <div className="space-y-4 flex-1 overflow-auto custom-scrollbar">
                          {invoices.filter(
                            (inv) =>
                              inv.reminderDate &&
                              inv.status !== InvoiceStatus.PAID &&
                              inv.status !== InvoiceStatus.CANCELLED,
                          ).length > 0 ? (
                            invoices
                              .filter(
                                (inv) =>
                                  inv.reminderDate &&
                                  inv.status !== InvoiceStatus.PAID &&
                                  inv.status !== InvoiceStatus.CANCELLED,
                              )
                              .sort(
                                (a, b) =>
                                  new Date(a.reminderDate!).getTime() -
                                  new Date(b.reminderDate!).getTime(),
                              )
                              .slice(0, 4)
                              .map((invoice) => {
                                const isPast =
                                  new Date(invoice.reminderDate!) < new Date();
                                const isToday =
                                  invoice.reminderDate ===
                                  new Date().toISOString().split("T")[0];
                                return (
                                  <div
                                    key={invoice.id}
                                    className={`p-5 rounded-2xl border ${isPast ? "bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30" : isToday ? "bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30" : "bg-brand-50 border-brand-100 dark:bg-brand-800/50 dark:border-brand-700"} flex flex-col gap-3 transition-all hover:scale-[1.01]`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                                        {invoice.number}
                                      </span>
                                      <span
                                        className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${isPast ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : isToday ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : "bg-brand-200 text-brand-700 dark:bg-brand-700 dark:text-brand-300"}`}
                                      >
                                        {isPast
                                          ? "En retard"
                                          : isToday
                                            ? "Aujourd'hui"
                                            : new Date(
                                                invoice.reminderDate!,
                                              ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm font-bold text-brand-900 dark:text-brand-50">
                                      Relancer pour{" "}
                                      {invoice.total.toLocaleString("fr-FR")} €
                                    </p>
                                  </div>
                                );
                              })
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-brand-300">
                              <CheckCircle2
                                size={36}
                                className="mb-3 opacity-20 text-accent-500"
                              />
                              <p className="text-[10px] font-bold uppercase tracking-widest">
                                Aucun rappel
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </SortableWidget>
                );

              if (id === "stock")
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="lg:col-span-1 row-span-2"
                  >
                    <div className="card-modern p-8 flex flex-col h-full">
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
                                  {product.sku || "SANS SKU"}
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
                                  {product.stock} {product.unit || "u."}
                                </p>
                              </div>
                              <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">
                                Seuil : {product.minStock}{" "}
                                {product.unit || "u."}
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

              if (id === "prediction")
                return (
                  <SortableWidget
                    key={id}
                    id={id}
                    className="lg:col-span-1 row-span-1"
                  >
                    <div className="card-modern p-6 h-full flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-brand-900 to-brand-950 text-white border-none shadow-xl shadow-brand-900/20">
                      <div className="absolute -right-4 -top-4 p-8 opacity-10">
                        <Sparkles size={120} />
                      </div>
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-brand-300 uppercase tracking-[0.15em]">
                            Prédiction IA
                          </p>
                          <Sparkles size={16} className="text-accent-400" />
                        </div>

                        {prediction ? (
                          <div className="space-y-3">
                            <p className="text-[11px] text-brand-100 leading-relaxed line-clamp-3 font-medium">
                              {prediction}
                            </p>
                            <button
                              onClick={handlePredict}
                              disabled={isPredicting}
                              className="text-[9px] font-bold uppercase tracking-widest text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1.5"
                            >
                              {isPredicting ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <TrendingUp size={10} />
                              )}
                              Actualiser
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-2">
                            <button
                              onClick={handlePredict}
                              disabled={isPredicting}
                              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
                            >
                              {isPredicting ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Sparkles size={14} />
                              )}
                              Prédire CA
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </SortableWidget>
                );

              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Dashboard;
