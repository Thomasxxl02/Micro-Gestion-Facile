import React, { useMemo, useState, useEffect } from 'react';
import { type CalendarEvent, type Invoice, type Product, type Expense, type UserProfile, type ViewState, InvoiceStatus } from '../types';
import { predictRevenue } from '../services/geminiService';
import {
  calculateSocialContributions,
  calculateThresholdStatus,
  getThresholds
} from '../lib/fiscalCalculations';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Euro, TrendingUp, AlertCircle, ArrowUpRight, ArrowRight, Wallet,
  CheckCircle2, Package, Calculator, TrendingDown, Users,
  ArrowDownRight, FileText, ShoppingCart, Mail, Sparkles, Loader2,
  GripVertical, Zap
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  events?: CalendarEvent[];
  onNavigate: (page: ViewState) => void;
  userProfile: UserProfile;
  onSaveInvoice?: (invoice: Invoice) => void;
}

type WidgetId = 'stats' | 'performance' | 'expenses' | 'activity' | 'reminders' | 'stock' | 'prediction' | 'stats-revenue' | 'stats-profit' | 'stats-net' | 'stats-micro' | 'stats-vat';

interface SortableWidgetProps {
  id: WidgetId;
  children: React.ReactNode;
  className?: string;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className={`${className} relative group transition-shadow duration-300 ${isDragging ? 'shadow-2xl opacity-50' : 'opacity-100'}`}>
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

// Droppable Action Component
const DroppableAction: React.FC<{ action: any }> = ({ action }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: action.id,
    });

    return (
        <button
            ref={setNodeRef}
            onClick={action.onClick}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider shadow-sm hover:shadow-md ${action.color} dark:bg-brand-800 dark:text-brand-50 dark:border-brand-700 relative transition-all duration-200 ${isOver ? 'scale-110 !bg-[#3ebd93]' : 'scale-100'}`}
        >
            <action.icon size={16} />
            {action.label}
            {isOver && action.id === 'quick-action-invoice' && (
                <span className="absolute -bottom-6 left-0 right-0 text-center text-[8px] text-accent-600 font-bold whitespace-nowrap">Relâcher pour convertir</span>
            )}
        </button>
    );
};

// Draggable Quote Component
const DraggableQuote: React.FC<{ quote: Invoice }> = ({ quote }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id: `quote-${quote.id}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex items-center justify-between p-3 rounded-xl border border-brand-100 dark:border-brand-800 hover:border-brand-200 dark:hover:border-brand-700 transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'bg-brand-50 shadow-lg scale-95 opacity-50' : 'bg-white dark:bg-brand-900/50 opacity-100'}`}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 rounded-lg">
                    <FileText size={14} />
                </div>
                <div>
                    <p className="text-xs font-bold text-brand-900 dark:text-brand-50">{quote.number}</p>
                    <p className="text-[10px] text-brand-400">{quote.total.toLocaleString()} €</p>
                </div>
            </div>
            <ArrowRight size={14} className="text-brand-200" />
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ invoices, products, expenses, onNavigate, userProfile, onSaveInvoice }) => {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [, setActiveId] = useState<string | null>(null);
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : ['stats', 'performance', 'expenses', 'activity', 'reminders', 'stock', 'prediction'];
  });

  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {return;}

    // Handle Drop of Quote on Invoices (Transform)
    if (active.id.toString().startsWith('quote-') && over.id === 'quick-action-invoice') {
        const quoteId = active.id.toString().replace('quote-', '');
        const quote = invoices.find(inv => inv.id === quoteId);
        if (quote && onSaveInvoice) {
            const newInvoice: Invoice = {
                ...quote,
                id: Date.now().toString(),
                type: 'invoice',
                number: `F${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                date: new Date().toISOString().split('T')[0],
                status: InvoiceStatus.DRAFT,
                linkedDocumentId: quote.id
            };
            onSaveInvoice(newInvoice);
            alert(`Devis ${quote.number} transformé en facture brouillon !`);
            onNavigate('invoices');
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
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        const type = inv.type || 'invoice';
        if (type === 'invoice') {return sum + inv.total;}
        if (type === 'credit_note') {return sum - inv.total;}
        return sum;
      }, 0);
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const netProfit = totalRevenue - totalExpenses;

  // New Fiscal Calculations using refined logic
  const fiscalStatus = useMemo(() => {
    return calculateThresholdStatus(totalRevenue, userProfile.activityType || 'SERVICE_BNC');
  }, [totalRevenue, userProfile.activityType]);

  const socialContributions = useMemo(() => {
    return calculateSocialContributions(totalRevenue, userProfile);
  }, [totalRevenue, userProfile]);

  const estimatedTax = socialContributions.amount;
  const netAfterTax = netProfit - estimatedTax;

  const vatProgress = fiscalStatus.tva.percentage;
  const currentThresholds = getThresholds(userProfile.activityType || 'SERVICE_BNC');

  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    months.forEach(m => data[m] = { income: 0, expense: 0 });

    invoices.forEach(inv => {
      if (inv.status === InvoiceStatus.PAID) {
        const date = new Date(inv.date);
        const monthName = months[date.getMonth()];
        const type = inv.type || 'invoice';
        if (type === 'invoice') {data[monthName].income += inv.total;}
        else if (type === 'credit_note') {data[monthName].income -= inv.total;}
      }
    });

    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthName = months[date.getMonth()];
      data[monthName].expense += exp.amount;
    });

    return months.map(name => ({
        name,
        Recettes: data[name].income,
        Dépenses: data[name].expense,
        Profit: data[name].income - data[name].expense
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
      .filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && inv.status === InvoiceStatus.PAID;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const lastMonthRevenue = invoices
      .filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && inv.status === InvoiceStatus.PAID;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const diff = currentMonthRevenue - lastMonthRevenue;
    const percent = lastMonthRevenue > 0 ? (diff / lastMonthRevenue) * 100 : 0;

    return { currentMonthRevenue, lastMonthRevenue, diff, percent };
  }, [invoices]);

  const handlePredict = async () => {
    setIsPredicting(true);
    const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PAID && inv.type === 'invoice');
    const pendingQuotes = invoices.filter(inv => (inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.ACCEPTED) && inv.type === 'quote');
    const result = await predictRevenue(paidInvoices, pendingQuotes);
    setPrediction(result);
    setIsPredicting(false);
  };

  // Expense Breakdown
  const expensesByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(exp => {
      const cat = exp.category || 'Autre';
      data[cat] = (data[cat] || 0) + exp.amount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [expenses]);

  const COLORS = ['#102a43', '#2cb1bc', '#486581', '#3ebd93', '#627d98'];

  // Combined Activity
  const recentActivity = useMemo(() => {
    const combined = [
      ...invoices.map(inv => ({ ...inv, activityType: 'invoice' as const })),
      ...expenses.map(exp => ({ ...exp, activityType: 'expense' as const }))
    ];
    return combined
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [invoices, expenses]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.type === 'product' && p.stock !== undefined && p.stock <= (p.minStock || 0) && !p.archived);
  }, [products]);

  const quickActions = [
    { id: 'quick-action-invoice', label: 'Facture', icon: FileText, onClick: () => onNavigate('invoices'), color: 'bg-brand-900 text-white' },
    { id: 'quick-action-expense', label: 'Dépense', icon: TrendingDown, onClick: () => onNavigate('accounting'), color: 'bg-white text-brand-900 border border-brand-100' },
    { id: 'quick-action-client', label: 'Client', icon: Users, onClick: () => onNavigate('clients'), color: 'bg-white text-brand-900 border border-brand-100' },
    { id: 'quick-action-email', label: 'Email', icon: Mail, onClick: () => onNavigate('emails'), color: 'bg-white text-brand-900 border border-brand-100' },
    { id: 'quick-action-product', label: 'Produit', icon: Package, onClick: () => onNavigate('products'), color: 'bg-white text-brand-900 border border-brand-100' },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-bold text-brand-900 dark:text-brand-50 tracking-tight font-display">Tableau de bord</h2>
           <p className="text-brand-500 dark:text-brand-400 mt-1 text-sm">Aperçu de votre activité et de vos revenus.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
             <DroppableAction key={action.id} action={action} />
          ))}
        </div>
      </div>


        <SortableContext
          items={widgetOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
            {widgetOrder.map((id) => {
              if (id === 'stats') {return (
                <React.Fragment key={id}>
                  {/* Total Revenue Card */}
                  <SortableWidget id="stats-revenue" className="lg:col-span-1">
                    <div className="card-modern p-6 h-full flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-brand-900 dark:text-brand-50">
                          <TrendingUp size={120} />
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-brand-50 dark:bg-brand-800 text-brand-900 dark:text-brand-50 rounded-xl">
                          <Euro size={20} />
                        </div>
                        <span className="flex items-center text-[9px] font-bold uppercase tracking-wider text-accent-600 bg-accent-50 dark:bg-accent-900/20 px-2.5 py-1 rounded-full border border-accent-100 dark:border-accent-900/30">
                          Encaissé
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Chiffre d&apos;Affaires</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-50 tracking-tight font-display">
                            {totalRevenue.toLocaleString('fr-FR')} €
                          </h3>
                          <div className={`flex items-center text-[10px] font-bold ${cashFlowStats.percent >= 0 ? 'text-accent-600' : 'text-red-500'}`}>
                            {cashFlowStats.percent >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(cashFlowStats.percent).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </SortableWidget>

                  {/* Profit Card */}
                  <SortableWidget id="stats-profit" className="lg:col-span-1">
                    <div className="bg-brand-900 dark:bg-brand-950 text-white p-6 rounded-4xl h-full shadow-xl shadow-brand-900/20 relative overflow-hidden group border border-white/5">
                      <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <TrendingUp size={120} />
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-white/10 text-white rounded-xl">
                          <Wallet size={20} />
                        </div>
                        <span className="flex items-center text-[9px] font-bold uppercase tracking-wider text-brand-200 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                          Brut
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-brand-300 uppercase tracking-widest">Résultat Brut</p>
                        <h3 className="text-2xl font-bold mt-1 tracking-tight font-display">
                          {netProfit.toLocaleString('fr-FR')} €
                        </h3>
                      </div>
                    </div>
                  </SortableWidget>

                  {/* Net After Tax Card */}
                  <SortableWidget id="stats-net" className="lg:col-span-1">
                    <div className="card-modern p-6 h-full flex flex-col justify-between border-dashed bg-brand-50/30 dark:bg-brand-800/10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 rounded-xl">
                          <Calculator size={20} />
                        </div>
                        <div className="group relative">
                            <AlertCircle size={14} className="text-brand-300 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-brand-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                Estimation après déduction des cotisations sociales.
                            </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Revenu Net Est.</p>
                        <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-50 mt-1 tracking-tight font-display">
                          {netAfterTax.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                        </h3>
                      </div>
                    </div>
                  </SortableWidget>

                  {/* Micro Threshold Card (NEW) */}
                  <SortableWidget id="stats-micro" className="lg:col-span-1">
                    <div className="card-modern p-6 h-full flex flex-col justify-between relative overflow-hidden">
                      <div className="relative z-10">
                         <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Seuil Micro-Entreprise</p>
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
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${fiscalStatus.micro.percentage > 85 ? 'bg-orange-500' : 'bg-brand-900 dark:bg-brand-50'}`}
                                style={{ width: `${Math.min(fiscalStatus.micro.percentage, 100)}%` }}
                            ></div>
                         </div>
                         {fiscalStatus.micro.remaining < 5000 && (
                           <p className="text-[8px] text-orange-500 font-bold mt-1.5">
                             Sortie du régime dans {(fiscalStatus.micro.remaining).toLocaleString()}€
                           </p>
                         )}
                      </div>
                    </div>
                  </SortableWidget>

                  {/* VAT Threshold Card */}
                  <SortableWidget id="stats-vat" className="lg:col-span-1">
                    <div className="card-modern p-6 h-full flex flex-col justify-between relative overflow-hidden">
                      <div className="relative z-10">
                         <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Franchise TVA</p>
                         <div className="flex justify-between items-end mt-1 mb-3">
                            <h3 className="text-2xl font-bold text-brand-900 dark:text-brand-50 tracking-tight font-display">{vatProgress.toFixed(0)}%</h3>
                            <span className="text-[9px] text-brand-400 mb-1 font-bold uppercase tracking-wider">
                                {currentThresholds.tva.toLocaleString()}€
                            </span>
                         </div>
                         <div className="w-full bg-brand-50 dark:bg-brand-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${vatProgress > 85 ? 'bg-red-500' : 'bg-brand-900 dark:bg-brand-50'}`}
                                style={{ width: `${Math.min(vatProgress, 100)}%` }}
                            ></div>
                         </div>
                         {fiscalStatus.tva.isNear && (
                           <p className="text-[8px] text-red-500 font-bold mt-1.5 animate-pulse">
                             Attention : Passage à la TVA dans {(fiscalStatus.tva.remaining).toLocaleString()} €
                           </p>
                         )}
                         {fiscalStatus.tva.isExceeded && (
                            <p className="text-[8px] text-red-500 font-bold mt-1.5">Seuil dépassé !</p>
                         )}
                      </div>
                    </div>
                  </SortableWidget>
                </React.Fragment>
              );}

              if (id === 'performance') {return (
                <SortableWidget key={id} id={id} className="md:col-span-2 lg:col-span-3 row-span-2">
                  <div className="card-modern p-8 h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                      <div>
                          <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 font-display">Performance Financière</h3>
                          <p className="text-xs text-brand-400 font-medium">Évolution de vos revenus et dépenses</p>
                      </div>
                      <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-brand-900 dark:bg-brand-50"></span>
                              <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Recettes</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                              <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Dépenses</span>
                           </div>
                      </div>
                    </div>

                    <div className="flex-1 min-h-75 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                            dy={15}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                            tickFormatter={(value) => `${value/1000}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '1.25rem',
                              border: 'none',
                              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                              padding: '16px',
                              backgroundColor: 'var(--card-bg)',
                              color: 'var(--text-main)',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                            formatter={(value: any) => (typeof value === 'number' ? `${value.toLocaleString('fr-FR')} €` : '')}
                          />
                          <Area type="monotone" dataKey="Recettes" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorRecettes)" />
                          <Area type="monotone" dataKey="Dépenses" stroke="#f87171" strokeWidth={3} fillOpacity={1} fill="url(#colorDepenses)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </SortableWidget>
              );}

              if (id === 'expenses') {return (
                <SortableWidget key={id} id={id} className="lg:col-span-1 row-span-2">
                  <div className="card-modern p-8 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 mb-8 font-display">Répartition Dépenses</h3>
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
                                {expensesByCategory.map((entry) => (
                                  <Cell key={entry.name} fill={COLORS[expensesByCategory.indexOf(entry) % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: any) => (typeof value === 'number' ? `${value.toFixed(2)} €` : '')}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 flex-1 overflow-auto custom-scrollbar pr-2">
                          {expensesByCategory.map((cat, idx) => (
                            <div key={cat.name} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ '--indicator-color': COLORS[idx % COLORS.length] } as React.CSSProperties}></div>
                                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{cat.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-black text-brand-900 dark:text-brand-50">{cat.value.toLocaleString()} €</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-brand-300 bg-brand-50/50 dark:bg-brand-800/10 rounded-3xl border border-dashed border-brand-100 dark:border-brand-700 p-8">
                        <TrendingDown size={48} className="mb-4 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Aucune dépense</p>
                      </div>
                    )}
                  </div>
                </SortableWidget>
              );}

              if (id === 'activity') {return (
                <SortableWidget key={id} id={id} className="md:col-span-2 lg:col-span-2 row-span-2">
                  <div className="card-modern p-8 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                          <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 font-display">Activité récente</h3>
                          <p className="text-xs text-brand-400 font-medium">Vos dernières transactions</p>
                       </div>
                       <button
                         onClick={() => onNavigate('invoices')}
                         className="text-[10px] font-bold text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-50 transition-colors flex items-center uppercase tracking-widest"
                       >
                         Tout voir <ArrowRight size={14} className="ml-1.5" />
                       </button>
                    </div>

                    <div className="flex-1 overflow-auto -mx-2 px-2 custom-scrollbar">
                      <div className="space-y-2">
                        {recentActivity.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 hover:bg-brand-50 dark:hover:bg-brand-800/50 rounded-2xl transition-all cursor-pointer border border-transparent group">
                            <div className="flex items-center gap-4">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold
                                ${item.activityType === 'invoice' ? (
                                  (item as Invoice).status === InvoiceStatus.PAID ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400' :
                                  (item as Invoice).status === InvoiceStatus.SENT ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                                  'bg-brand-50 dark:bg-brand-800/50 text-brand-500'
                                ) : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                                {item.activityType === 'invoice' ? <FileText size={18} /> : <ShoppingCart size={18} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-brand-900 dark:text-brand-50 group-hover:text-brand-950 dark:group-hover:text-white transition-colors">
                                  {item.activityType === 'invoice' ? (item as Invoice).number : (item as Expense).description}
                                </p>
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">{new Date(item.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${item.activityType === 'expense' || (item as Invoice).type === 'credit_note' ? 'text-red-500' : 'text-brand-900 dark:text-brand-50'}`}>
                                {item.activityType === 'expense' || (item as Invoice).type === 'credit_note' ? '-' : ''}
                                {(item as any).total?.toLocaleString('fr-FR') || (item as any).amount?.toLocaleString('fr-FR')} €
                              </p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block uppercase tracking-[0.05em]
                                   ${item.activityType === 'invoice' ? (
                                     (item as Invoice).status === InvoiceStatus.PAID ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400' :
                                     (item as Invoice).status === InvoiceStatus.SENT ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                                     'bg-brand-50 dark:bg-brand-800/50 text-brand-600'
                                   ) : 'bg-red-50 dark:bg-red-900/20 text-red-700'}`}>
                                {item.activityType === 'invoice' ? (item as Invoice).status : 'Dépense'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SortableWidget>
              );}

              if (id === 'reminders') {return (
                <SortableWidget key={id} id={id} className="md:col-span-1 lg:col-span-1 border-dashed border-2 border-brand-100 dark:border-brand-800 rounded-4xl">
                   <div className="card-modern p-6 h-full flex flex-col bg-transparent shadow-none">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-brand-50 dark:bg-brand-800 text-brand-900 dark:text-brand-50 rounded-xl">
                          <Zap size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-brand-900 dark:text-brand-50 uppercase tracking-wider">Devis à convertir</h3>
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                         {invoices.filter(i => i.type === 'quote' && i.status === InvoiceStatus.ACCEPTED).length > 0 ? (
                           <SortableContext
                             items={invoices.filter(i => i.type === 'quote' && i.status === InvoiceStatus.ACCEPTED).map(q => `quote-${q.id}`)}
                             strategy={verticalListSortingStrategy}
                           >
                            {invoices
                                .filter(i => i.type === 'quote' && i.status === InvoiceStatus.ACCEPTED)
                                .map((quote) => (
                                    <DraggableQuote key={quote.id} quote={quote} />
                                ))
                            }
                           </SortableContext>
                         ) : (
                           <div className="flex flex-col items-center justify-center h-full text-brand-300 py-10 opacity-50">
                             <CheckCircle2 size={32} strokeWidth={1} className="mb-2" />
                             <p className="text-[10px] uppercase font-bold tracking-widest text-center">Aucun devis accepté en attente</p>
                           </div>
                         )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-brand-50 dark:border-brand-800">
                        <p className="text-[9px] text-brand-400 italic">Glissez un devis sur &quot;Facture&quot; pour le convertir.</p>
                      </div>
                    </div>
                </SortableWidget>
              );}

              if (id === 'stock') {return (
                <SortableWidget key={id} id={id} className="lg:col-span-1 row-span-2">
                  <div className="card-modern p-8 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold text-brand-900 dark:text-brand-50 flex items-center gap-3 font-display">
                            <Package size={20} className="text-red-500" /> Stocks
                        </h3>
                    </div>
                    <div className="space-y-4 flex-1 overflow-auto custom-scrollbar">
                        {lowStockProducts.length > 0 ? (
                            lowStockProducts.slice(0, 4).map(product => (
                                <div key={product.id} className="p-5 rounded-2xl border bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 flex flex-col gap-3 transition-all hover:scale-[1.01]">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">{product.sku || 'SANS SKU'}</span>
                                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 uppercase tracking-widest">
                                            Stock bas
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-bold text-brand-900 dark:text-brand-50">{product.name}</p>
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{product.stock} {product.unit || 'u.'}</p>
                                    </div>
                                    <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Seuil : {product.minStock} {product.unit || 'u.'}</p>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-brand-300">
                                <Package size={36} className="mb-3 opacity-20 text-brand-500" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Stocks OK</p>
                            </div>
                        )}
                    </div>
                  </div>
                </SortableWidget>
              );}

              if (id === 'prediction') {return (
                <SortableWidget key={id} id={id} className="lg:col-span-1 row-span-1">
                  <div className="card-modern p-6 h-full flex flex-col justify-between relative overflow-hidden bg-linear-to-br from-brand-900 to-brand-950 text-white border-none shadow-xl shadow-brand-900/20">
                    <div className="absolute -right-4 -top-4 p-8 opacity-10">
                        <Sparkles size={120} />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold text-brand-300 uppercase tracking-[0.15em]">Prédiction IA</p>
                          <Sparkles size={16} className="text-accent-400" />
                       </div>

                       {prediction ? (
                         <div className="space-y-3">
                            <p className="text-[11px] text-brand-100 leading-relaxed line-clamp-3 font-medium">{prediction}</p>
                            <button
                              onClick={handlePredict}
                              disabled={isPredicting}
                              className="text-[9px] font-bold uppercase tracking-widest text-accent-400 hover:text-accent-300 transition-colors flex items-center gap-1.5"
                            >
                              {isPredicting ? <Loader2 size={10} className="animate-spin" /> : <TrendingUp size={10} />}
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
                              {isPredicting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              Prédire CA
                            </button>
                         </div>
                       )}
                    </div>
                  </div>
                </SortableWidget>
              );}

              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Dashboard;
