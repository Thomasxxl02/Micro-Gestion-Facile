import {
  Calculator,
  Calendar,
  Camera,
  DollarSign,
  FileSpreadsheet,
  Filter,
  Loader2,
  PieChart as PieChartIcon,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFormValidation } from '../hooks/useFormValidation';
import { ExpenseSchema, schemaToRules } from '../lib/zod-schemas';
import { analyzeReceipt } from '../services/geminiService';
import {
  type Client,
  type Expense,
  type Invoice,
  type Supplier,
  type UserProfile,
  InvoiceStatus,
} from '../types';
import Combobox from './Combobox';
import { FormFieldValidated } from './FormFieldValidated';

import { calculateIncomeTaxPFL, calculateSocialContributions } from '../lib/fiscalCalculations';

interface AccountingManagerProps {
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  invoices: Invoice[];
  suppliers: Supplier[];
  userProfile?: UserProfile; // Profil de l'utilisateur pour Factur-X
  clients?: Client[]; // Liste des clients pour Factur-X
  onSaveExpense?: (expense: Expense) => void;
  onDeleteExpense?: (id: string) => void;
}

const AccountingManager: React.FC<AccountingManagerProps> = ({
  expenses,
  setExpenses,
  invoices,
  suppliers,
  userProfile,
  clients = [],
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'bilan' | 'fiscal'>('journal');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [taxRate] = useState(21.1); // Default for services
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form handling logic
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    vatAmount: 0,
    vatRate: 0,
    category: 'Achats',
    supplierId: '',
  };

  const {
    data: newExpense,
    setData: setNewExpense,
    errors,
    touched,
    handleChange: handleFormChange,
    validate: validateAll,
  } = useFormValidation<Partial<Expense>>(initialFormState, schemaToRules(ExpenseSchema));

  const resetExpenseForm = () => {
    setNewExpense(initialFormState);
  };

  const fiscalData = useMemo(() => {
    const months = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    return months.map((name, idx) => {
      const monthRevenue = invoices
        .filter((inv) => {
          const d = new Date(inv.date);
          return (
            d.getFullYear() === selectedYear &&
            d.getMonth() === idx &&
            inv.status === InvoiceStatus.PAID
          );
        })
        .reduce((sum, inv) => {
          const type = inv.type || 'invoice';
          if (type === 'invoice') {
            return sum + inv.total;
          }
          if (type === 'credit_note') {
            return sum - inv.total;
          }
          return sum;
        }, 0);

      return { name, revenue: monthRevenue, tax: monthRevenue * (taxRate / 100) };
    });
  }, [invoices, selectedYear, taxRate]);

  const totalYearlyRevenue = useMemo(
    () => fiscalData.reduce((sum, d) => sum + d.revenue, 0),
    [fiscalData]
  );
  const totalYearlyTax = useMemo(() => fiscalData.reduce((sum, d) => sum + d.tax, 0), [fiscalData]);

  const fiscalSummary = useMemo(() => {
    if (!userProfile) {
      return null;
    }
    return calculateSocialContributions(totalYearlyRevenue, userProfile);
  }, [totalYearlyRevenue, userProfile]);

  const yearlyIncomeTax = useMemo(() => {
    if (!userProfile?.activityType) {
      return 0;
    }
    return calculateIncomeTaxPFL(totalYearlyRevenue, userProfile.activityType);
  }, [totalYearlyRevenue, userProfile]);

  const years = useMemo(() => {
    const allDates = [
      ...invoices.map((i) => new Date(i.date).getFullYear()),
      ...expenses.map((e) => new Date(e.date).getFullYear()),
    ];
    const uniqueYears = Array.from(new Set(allDates)).sort((a, b) => b - a);
    return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()];
  }, [invoices, expenses]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsAnalyzing(true);
    setShowForm(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const result = await analyzeReceipt(base64, file.type);

        if (result) {
          // Find supplier if possible
          let supplierId = '';
          if (result.supplierName) {
            const existingSupplier = suppliers.find((s) =>
              s.name.toLowerCase().includes(result.supplierName.toLowerCase())
            );
            if (existingSupplier) {
              supplierId = existingSupplier.id;
            }
          }

          setNewExpense((prev) => ({
            ...prev,
            date: result.date || prev.date,
            description: result.description || result.supplierName || prev.description,
            amount: result.amount || prev.amount,
            vatAmount: result.vatAmount || 0,
            vatRate: result.vatRate || 0,
            supplierId: supplierId || prev.supplierId,
          }));
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('OCR Error:', error);
      setIsAnalyzing(false);
    }
  };

  const handleAddExpense = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateAll()) {
      return;
    }

    if (editingExpense) {
      const updatedExpense = { ...editingExpense, ...newExpense } as Expense;
      const updatedExpenses = expenses.map((exp) =>
        exp.id === editingExpense.id ? updatedExpense : exp
      );
      setExpenses(updatedExpenses);
      if (onSaveExpense) {
        onSaveExpense(updatedExpense);
      }
    } else {
      const expense: Expense = {
        id: Date.now().toString(),
        date: newExpense.date ?? new Date().toISOString().split('T')[0],
        description: newExpense.description || '',
        amount: Number(newExpense.amount || 0),
        vatAmount: Number(newExpense.vatAmount || 0),
        vatRate: Number(newExpense.vatRate || 0),
        category: newExpense.category || 'Achats',
        supplierId: newExpense.supplierId || '',
      };
      setExpenses([expense, ...expenses]);
      if (onSaveExpense) {
        onSaveExpense(expense);
      }
    }

    resetExpenseForm();
    setEditingExpense(null);
    setShowForm(false);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      vatAmount: expense.vatAmount || 0,
      vatRate: expense.vatRate || 0,
      category: expense.category,
      supplierId: expense.supplierId,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette dépense ?')) {
      setExpenses(expenses.filter((e) => e.id !== id));
      setSelectedExpenses(selectedExpenses.filter((sid) => sid !== id));
      if (onDeleteExpense) {
        onDeleteExpense(id);
      }
    }
  };

  const handleBulkDelete = () => {
    if (selectedExpenses.length === 0) {
      return;
    }
    if (confirm(`Supprimer les ${selectedExpenses.length} dépenses sélectionnées ?`)) {
      setExpenses(expenses.filter((e) => !selectedExpenses.includes(e.id)));
      if (onDeleteExpense) {
        selectedExpenses.forEach((id) => onDeleteExpense(id));
      }
      setSelectedExpenses([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map((e) => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedExpenses.includes(id)) {
      setSelectedExpenses(selectedExpenses.filter((sid) => sid !== id));
    } else {
      setSelectedExpenses([...selectedExpenses, id]);
    }
  };

  const exportJournalCSV = () => {
    const headers = [
      'Date',
      'Type',
      'Description',
      'Montant TTC',
      'TVA',
      'Net HT',
      'Catégorie',
      'Client/Fournisseur',
    ];

    const rows = [
      ...filteredExpenses.map((e) => [
        e.date,
        'DÉPENSE',
        `"${e.description.replaceAll('"', '""')}"`,
        e.amount.toFixed(2),
        (e.vatAmount || 0).toFixed(2),
        (e.amount - (e.vatAmount || 0)).toFixed(2),
        `"${e.category}"`,
        `"${suppliers.find((s) => s.id === e.supplierId)?.name.replaceAll('"', '""') || 'N/A'}"`,
      ]),
      ...invoices
        .filter((inv) => inv.status === InvoiceStatus.PAID)
        .map((inv) => [
          inv.date,
          'RECETTE',
          `"Facture ${inv.number}"`,
          inv.total.toFixed(2),
          (inv.vatAmount || 0).toFixed(2),
          (inv.subtotal || inv.total).toFixed(2),
          '"Prestation"',
          `"${clients.find((c) => c.id === inv.clientId)?.name.replaceAll('"', '""') || 'N/A'}"`,
        ]),
    ].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_comptable_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportLivreRecettesPFD = async () => {
    const paidInvoices = invoices
      .filter(
        (inv) =>
          inv.status === InvoiceStatus.PAID && new Date(inv.date).getFullYear() === selectedYear
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('LIVRE DES RECETTES', 14, 22);
    doc.setFontSize(10);
    doc.text(
      `Année: ${selectedYear} - Micro-Entreprise: ${userProfile?.companyName || 'N/A'}`,
      14,
      30
    );
    doc.text(`SIRET: ${userProfile?.siret || 'N/A'}`, 14, 35);
    doc.text('Document infalsifiable généré le ' + new Date().toLocaleDateString(), 14, 40);

    const tableData = paidInvoices.map((inv) => [
      inv.date,
      inv.number,
      clients.find((c) => c.id === inv.clientId)?.name || 'Inconnu',
      inv.total.toFixed(2) + ' €',
    ]);

    const docWithAutoTable = doc as typeof doc & {
      autoTable: (options: {
        startY?: number;
        head?: string[][];
        body?: string[][];
        theme?: string;
        headStyles?: Record<string, unknown>;
      }) => void;
    };
    docWithAutoTable.autoTable({
      startY: 50,
      head: [['Date', 'N° Facture', 'Client', 'Montant Encaissé (TTC)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 51, 51] },
    });

    doc.save(`livre_recettes_${selectedYear}.pdf`);
  };

  // --- STATISTICS ---
  const totalRevenue = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => {
        const type = inv.type || 'invoice';
        if (type === 'invoice') {
          return sum + inv.total;
        }
        if (type === 'credit_note') {
          return sum - inv.total;
        }
        return sum;
      }, 0);
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const netResult = totalRevenue - totalExpenses;
  const estimatedCharges = totalRevenue * (taxRate / 100);
  const netAfterCharges = netResult - estimatedCharges;

  // Monthly breakdown for BarChart
  const monthlyComparison = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    const months = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    months.forEach((m) => (data[m] = { income: 0, expense: 0 }));

    invoices.forEach((inv) => {
      if (inv.status === InvoiceStatus.PAID) {
        const date = new Date(inv.date);
        const monthName = months[date.getMonth()];
        const type = inv.type || 'invoice';
        if (type === 'invoice') {
          data[monthName].income += inv.total;
        } else if (type === 'credit_note') {
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

  // Quarterly breakdown
  const quarterlyStats = useMemo(() => {
    const quarters = [
      { name: 'T1 (Jan-Mar)', income: 0, expense: 0 },
      { name: 'T2 (Avr-Juin)', income: 0, expense: 0 },
      { name: 'T3 (Juil-Sep)', income: 0, expense: 0 },
      { name: 'T4 (Oct-Déc)', income: 0, expense: 0 },
    ];

    invoices.forEach((inv) => {
      if (inv.status === InvoiceStatus.PAID) {
        const month = new Date(inv.date).getMonth();
        const qIdx = Math.floor(month / 3);
        const type = inv.type || 'invoice';
        if (type === 'invoice') {
          quarters[qIdx].income += inv.total;
        } else if (type === 'credit_note') {
          quarters[qIdx].income -= inv.total;
        }
      }
    });

    expenses.forEach((exp) => {
      const month = new Date(exp.date).getMonth();
      const qIdx = Math.floor(month / 3);
      quarters[qIdx].expense += exp.amount;
    });

    return quarters;
  }, [invoices, expenses]);

  const expensesByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach((exp) => {
      const cat = exp.category || 'Autre';
      data[cat] = (data[cat] || 0) + exp.amount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suppliers
          .find((s) => s.id === exp.supplierId)
          ?.name.toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || exp.category === categoryFilter;
      const matchesMin = !minAmount || exp.amount >= Number.parseFloat(minAmount);
      const matchesMax = !maxAmount || exp.amount <= Number.parseFloat(maxAmount);
      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    });
  }, [expenses, searchTerm, categoryFilter, minAmount, maxAmount, suppliers]);

  const COLORS = [
    '#102a43',
    '#2cb1bc',
    '#486581',
    '#3ebd93',
    '#627d98',
    '#829ab1',
    '#f87171',
    '#fbbf24',
  ];

  const expenseCategories = [
    'Achats',
    'Loyer',
    'Logiciels',
    'Déplacements',
    'Assurance',
    'Marketing',
    'Repas',
    'Fournitures',
    'Autre',
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-900 font-display tracking-tight">
            Comptabilité
          </h1>
          <p className="text-brand-500 mt-1">Suivi de trésorerie et pilotage financier.</p>
        </div>
        <div className="flex bg-brand-100/50 p-1 rounded-2xl border border-brand-100">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'journal' ? 'bg-white text-brand-900 shadow-sm' : 'bg-transparent text-brand-500 hover:text-brand-700'}`}
          >
            Journal
          </button>
          <button
            onClick={() => setActiveTab('bilan')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'bilan' ? 'bg-white text-brand-900 shadow-sm' : 'bg-transparent text-brand-500 hover:text-brand-700'}`}
          >
            Bilan
          </button>
          <button
            onClick={() => setActiveTab('fiscal')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'fiscal' ? 'bg-white text-brand-900 shadow-sm' : 'bg-transparent text-brand-500 hover:text-brand-700'}`}
          >
            Fiscal
          </button>
        </div>
      </div>

      {activeTab === 'bilan' && (
        <div className="space-y-8 animate-slide-up">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-brand-900 dark:text-brand-50">
                <TrendingUp size={120} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-brand-50 dark:bg-brand-800 text-brand-900 dark:text-brand-50 rounded-xl">
                  <TrendingUp size={20} />
                </div>
                <span className="badge bg-brand-50 dark:bg-brand-800 text-brand-600 dark:text-brand-400">
                  CA
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">
                  Recettes Encaissées
                </p>
                <h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display tracking-tight mt-1">
                  {totalRevenue.toLocaleString('fr-FR')} €
                </h3>
              </div>
            </div>

            <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-red-500">
                <TrendingDown size={120} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl">
                  <TrendingDown size={20} />
                </div>
                <span className="badge bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  Dépenses
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">
                  Dépenses Totales
                </p>
                <h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display tracking-tight mt-1">
                  {totalExpenses.toLocaleString('fr-FR')} €
                </h3>
              </div>
            </div>

            <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group bg-brand-900 dark:bg-brand-50">
              <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-white dark:text-brand-900">
                <DollarSign size={120} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-white/10 dark:bg-brand-900/20 text-white dark:text-brand-900 rounded-xl">
                  <DollarSign size={20} />
                </div>
                <span className="badge bg-white/10 dark:bg-brand-900/20 text-white dark:text-brand-900">
                  Net
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-300 dark:text-brand-600 uppercase tracking-widest">
                  Résultat Brut
                </p>
                <h3 className="text-2xl font-bold text-white dark:text-brand-900 font-display tracking-tight mt-1">
                  {netResult.toLocaleString('fr-FR')} €
                </h3>
              </div>
            </div>

            <div className="card-modern p-6 flex flex-col justify-between relative overflow-hidden group border-dashed">
              <div className="absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity text-amber-500">
                <Calculator size={120} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Calculator size={20} />
                </div>
                <span className="badge bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  Charges
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-400 dark:text-brand-500 uppercase tracking-widest">
                  Estimation Net
                </p>
                <h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display tracking-tight mt-1">
                  {netAfterCharges.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                </h3>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Monthly Comparison Chart */}
            <div className="lg:col-span-2 card-modern p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-brand-900 font-display">
                  Performance Mensuelle
                </h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-900"></span>
                    <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">
                      Recettes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">
                      Dépenses
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyComparison}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    barGap={8}
                  >
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
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        borderRadius: '1rem',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        padding: '16px',
                        backgroundColor: 'white',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    />
                    <Bar dataKey="Recettes" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Dépenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="card-modern p-8">
              <h3 className="text-lg font-bold text-brand-900 mb-8 font-display">
                Répartition Dépenses
              </h3>
              {expensesByCategory.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="h-48 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={8}
                          dataKey="value"
                          fill="#0f172a"
                        ></Pie>
                        <Tooltip
                          formatter={(value: unknown) => {
                            if (typeof value === 'number') {
                              return `${value.toFixed(2)} €`;
                            }
                            return '';
                          }}
                          contentStyle={
                            {
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            } as React.CSSProperties
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 flex-1 overflow-auto custom-scrollbar pr-2">
                    {expensesByCategory.map((cat, idx) => (
                      <div key={cat.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full bg-[${COLORS[idx % COLORS.length]}]`}
                          ></div>
                          <span className="text-xs font-semibold text-brand-600">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-brand-900">
                            {cat.value.toLocaleString()} €
                          </span>
                          <span className="text-[9px] font-bold text-brand-300 ml-2 uppercase">
                            {((cat.value / totalExpenses) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-brand-300 bg-brand-50/50 rounded-2xl border border-dashed border-brand-100 p-8">
                  <PieChartIcon size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">Aucune dépense</p>
                </div>
              )}
            </div>
          </div>

          {/* Quarterly Breakdown Section */}
          <div className="card-modern p-8">
            <h3 className="text-lg font-bold text-brand-900 mb-8 font-display">
              Récapitulatif Trimestriel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quarterlyStats.map((q, _idx) => (
                <div
                  key={q.name}
                  className="p-6 rounded-3xl bg-brand-50/50 border border-brand-100 hover:border-brand-200 transition-all group"
                >
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4">
                    {q.name}
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-brand-500">Recettes</span>
                      <span className="text-sm font-bold text-brand-900">
                        {q.income.toLocaleString()} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-brand-500">Dépenses</span>
                      <span className="text-sm font-bold text-red-500">
                        -{q.expense.toLocaleString()} €
                      </span>
                    </div>
                    <div className="pt-3 border-t border-brand-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-brand-400 uppercase">Profit</span>
                      <span
                        className={`text-sm font-bold ${q.income - q.expense >= 0 ? 'text-accent-600' : 'text-red-600'}`}
                      >
                        {(q.income - q.expense).toLocaleString()} €
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-bold text-brand-400 uppercase">
                      Cotisations Est.
                    </span>
                    <span className="text-xs font-bold text-brand-600">
                      {(q.income * (taxRate / 100)).toLocaleString()} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fiscal' && (
        <div className="space-y-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-brand-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-900 flex items-center justify-center text-white">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-900 font-display">
                  Déclaration de revenus
                </h3>
                <p className="text-xs text-brand-400 font-medium">
                  Récapitulatif annuel pour votre déclaration fiscale.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                Année
              </span>
              <select
                title="Sélectionner l'année"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-2 text-sm font-bold text-brand-900 outline-none cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-modern p-8 bg-brand-900 text-white">
              <p className="text-[10px] font-bold text-brand-300 uppercase tracking-widest mb-2">
                Chiffre d&apos;Affaires Annuel
              </p>
              <h3 className="text-3xl font-bold font-display">
                {totalYearlyRevenue.toLocaleString('fr-FR')} €
              </h3>
              <p className="text-[10px] text-brand-400 mt-4 italic">Total des factures payées.</p>
            </div>
            <div className="card-modern p-8">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                Cotisations Sociales
              </p>
              <h3 className="text-3xl font-bold text-brand-900 font-display">
                {fiscalSummary?.amount.toLocaleString('fr-FR') ||
                  totalYearlyTax.toLocaleString('fr-FR')}{' '}
                €
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-400 uppercase">
                  Taux appliqué
                </span>
                <span className="text-xs font-bold text-brand-600">
                  {fiscalSummary?.rate || taxRate}%
                </span>
              </div>
            </div>
            <div className="card-modern p-8">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                Impôt (PFL Est.)
              </p>
              <h3 className="text-3xl font-bold text-brand-900 font-display">
                {yearlyIncomeTax.toLocaleString('fr-FR')} €
              </h3>
              <p className="text-[10px] text-brand-400 mt-4">Prélèvement Libératoire</p>
            </div>
            <div className="card-modern p-8 bg-accent-50 border-accent-100">
              <p className="text-[10px] font-bold text-accent-700 uppercase tracking-widest mb-2">
                Revenu Net Estimé
              </p>
              <h3 className="text-3xl font-bold text-accent-900 font-display">
                {(
                  totalYearlyRevenue -
                  (fiscalSummary?.amount || totalYearlyTax) -
                  yearlyIncomeTax
                ).toLocaleString('fr-FR')}{' '}
                €
              </h3>
              <p className="text-[10px] text-accent-600 mt-4 italic">
                Après cotisations et impôts.
              </p>
            </div>
          </div>

          <div className="card-modern overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-brand-50 text-brand-900 text-[10px] font-bold uppercase tracking-widest border-b border-brand-100">
                  <th className="px-8 py-4">Mois</th>
                  <th className="px-8 py-4 text-right">CA Encaissé</th>
                  <th className="px-8 py-4 text-right">Cotisations ({taxRate}%)</th>
                  <th className="px-8 py-4 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {fiscalData.map((data) => (
                  <tr key={data.name} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-brand-900">{data.name}</td>
                    <td className="px-8 py-4 text-sm font-bold text-brand-900 text-right">
                      {data.revenue.toLocaleString()} €
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-red-500 text-right">
                      {data.tax.toLocaleString()} €
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-accent-600 text-right">
                      {(data.revenue - data.tax).toLocaleString()} €
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-brand-900 text-white font-bold">
                  <td className="px-8 py-6 text-sm uppercase tracking-widest">Total Annuel</td>
                  <td className="px-8 py-6 text-lg text-right">
                    {totalYearlyRevenue.toLocaleString()} €
                  </td>
                  <td className="px-8 py-6 text-lg text-right">
                    {totalYearlyTax.toLocaleString()} €
                  </td>
                  <td className="px-8 py-6 text-xl text-right">
                    {(totalYearlyRevenue - totalYearlyTax).toLocaleString()} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'journal' && (
        <div className="animate-fade-in space-y-6">
          {/* Journal Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-12 pr-4 py-3 border border-brand-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-900/5 bg-white shadow-sm transition-all font-medium text-brand-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 border border-brand-100 rounded-2xl shadow-sm">
                <Filter size={16} className="text-brand-400" />
                <select
                  title="Filtrer par catégorie de dépense"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-brand-900 outline-none cursor-pointer uppercase tracking-wider"
                >
                  <option value="">Catégories</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 border border-brand-100 rounded-2xl shadow-sm">
                <DollarSign size={14} className="text-brand-400" />
                <input
                  type="number"
                  placeholder="Min"
                  title="Montant minimum"
                  className="w-16 bg-transparent text-xs font-bold text-brand-900 outline-none"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <span className="text-brand-300">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  title="Montant maximum"
                  className="w-16 bg-transparent text-xs font-bold text-brand-900 outline-none"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {selectedExpenses.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm"
                >
                  <Trash2 size={16} />
                  Supprimer ({selectedExpenses.length})
                </button>
              )}
              <button
                onClick={exportJournalCSV}
                className="flex-1 sm:flex-none bg-white hover:bg-brand-50 text-brand-600 border border-brand-100 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm"
              >
                <FileSpreadsheet size={16} />
                Export Journal (CSV)
              </button>
              <button
                onClick={handleExportLivreRecettesPFD}
                className="flex-1 sm:flex-none bg-white hover:bg-brand-50 text-brand-600 border border-brand-100 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm"
              >
                <Calculator size={16} />
                Livre des Recettes (PDF)
              </button>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setNewExpense({
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    amount: 0,
                    vatAmount: 0,
                    vatRate: 0,
                    category: 'Achats',
                    supplierId: '',
                  });
                  setShowForm(!showForm);
                }}
                className="flex-1 sm:flex-none bg-brand-900 hover:bg-brand-950 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-900/10 text-[10px] font-bold uppercase tracking-widest"
              >
                <Plus size={18} />
                Nouvelle Dépense
              </button>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  title="Télécharger une image de ticket"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <button className="w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-500/10 text-[10px] font-bold uppercase tracking-widest">
                  <Camera size={18} />
                  Scanner Ticket
                </button>
              </div>
            </div>
          </div>

          {showForm && (
            <div className="card-modern p-10 animate-slide-up bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-brand-900 pointer-events-none">
                <Calculator size={160} />
              </div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-brand-900 dark:text-brand-50 font-display flex items-center gap-3">
                  {editingExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
                  {isAnalyzing && (
                    <span className="flex items-center gap-2 text-xs font-bold text-accent-600 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse IA en cours...
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingExpense(null);
                  }}
                  title="Fermer le formulaire"
                  className="text-brand-400 hover:text-brand-900 dark:hover:text-brand-50 transition-colors"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <form
                onSubmit={handleAddExpense}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
              >
                <FormFieldValidated
                  id="expense-date"
                  label="Date de l'achat"
                  type="date"
                  required
                  value={newExpense.date || ''}
                  onChange={handleFormChange('date')}
                  error={errors.date}
                  touched={touched.date}
                />
                <FormFieldValidated
                  id="expense-amount"
                  label="Montant TTC (€)"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={newExpense.amount || ''}
                  onChange={(val) => {
                    const amount = Number.parseFloat(val);
                    handleFormChange('amount')(amount);
                    const vatRate = newExpense.vatRate || 0;
                    const vatAmount = vatRate
                      ? amount * (vatRate / (100 + vatRate))
                      : newExpense.vatAmount || 0;
                    setNewExpense((prev) => ({ ...prev, vatAmount }));
                  }}
                  error={errors.amount}
                  touched={touched.amount}
                />
                <FormFieldValidated
                  id="expense-vat-amount"
                  label="Montant TVA (€)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpense.vatAmount || ''}
                  onChange={(val) => handleFormChange('vatAmount')(Number.parseFloat(val))}
                  error={errors.vatAmount}
                  touched={touched.vatAmount}
                />
                <div>
                  <label
                    htmlFor="expense-vat-rate"
                    className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2"
                  >
                    Taux TVA (%)
                  </label>
                  <select
                    id="expense-vat-rate"
                    title="Sélectionner le taux TVA"
                    className="w-full p-4 border border-brand-100 dark:border-brand-700 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 bg-white dark:bg-brand-800 transition-all font-bold text-brand-900 dark:text-brand-50 appearance-none cursor-pointer"
                    value={newExpense.vatRate || 0}
                    onChange={(e) => {
                      const vatRate = Number.parseFloat(e.target.value);
                      const amount = newExpense.amount || 0;
                      const vatAmount = amount ? amount * (vatRate / (100 + vatRate)) : 0;
                      setNewExpense({ ...newExpense, vatRate, vatAmount });
                    }}
                  >
                    <option value="0">0% (Exonéré)</option>
                    <option value="5.5">5.5%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="expense-category"
                    className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2"
                  >
                    Catégorie
                  </label>
                  <select
                    id="expense-category"
                    title="Sélectionner la catégorie de dépense"
                    className="w-full p-4 border border-brand-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 bg-white transition-all font-bold text-brand-900 appearance-none cursor-pointer"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <FormFieldValidated
                    id="expense-description"
                    label="Description / Libellé"
                    type="text"
                    required
                    placeholder="Ex: Abonnement Internet, Achat écran..."
                    value={newExpense.description || ''}
                    onChange={(val) => setNewExpense({ ...newExpense, description: val })}
                    validator={() => ({
                      valid: !errors.description?.error,
                      error: errors.description?.error,
                    })}
                  />
                </div>
                <div>
                  <Combobox
                    label="Fournisseur"
                    options={suppliers
                      .filter((s) => !s.archived)
                      .map((s) => ({
                        id: s.id,
                        label: s.name,
                        subLabel: s.category || 'Fournisseur',
                      }))}
                    value={newExpense.supplierId || ''}
                    onChange={(val) => setNewExpense({ ...newExpense, supplierId: val })}
                    placeholder="Chercher un fournisseur..."
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                    }}
                    className="px-8 py-3 text-brand-600 hover:bg-brand-50 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-3 bg-brand-900 text-white rounded-2xl hover:bg-brand-950 font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-brand-900/10 transition-all hover:scale-[1.02]"
                  >
                    {editingExpense ? 'Mettre à jour' : 'Enregistrer la dépense'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card-modern overflow-hidden border-none shadow-xl shadow-brand-900/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-brand-900 text-white text-[10px] font-bold uppercase tracking-[0.2em]">
                    <th className="px-6 py-5 w-12">
                      <input
                        type="checkbox"
                        title="Sélectionner toutes les dépenses affichées"
                        className="rounded border-brand-700 bg-brand-800 text-accent-500 focus:ring-accent-500"
                        checked={
                          filteredExpenses.length > 0 &&
                          selectedExpenses.length === filteredExpenses.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Description</th>
                    <th className="px-8 py-5">Catégorie</th>
                    <th className="px-8 py-5">Fournisseur</th>
                    <th className="px-8 py-5 text-right">Montant</th>
                    <th className="px-8 py-5 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50 bg-white">
                  {filteredExpenses.map((exp) => {
                    const supplier = suppliers.find((s) => s.id === exp.supplierId);
                    const isSelected = selectedExpenses.includes(exp.id);
                    return (
                      <tr
                        key={exp.id}
                        className={`hover:bg-brand-50/50 transition-colors group ${isSelected ? 'bg-brand-50/80' : ''}`}
                      >
                        <td className="px-6 py-6">
                          <input
                            type="checkbox"
                            title="Sélectionner cette dépense"
                            className="rounded border-brand-200 text-brand-900 focus:ring-brand-900"
                            checked={isSelected}
                            onChange={() => toggleSelect(exp.id)}
                          />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-400">
                              <Calendar size={14} />
                            </div>
                            <span className="text-xs font-bold text-brand-900 font-mono">
                              {new Date(exp.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-brand-900">{exp.description}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-[9px] font-bold uppercase tracking-wider border border-brand-100">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          {supplier ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-brand-100 flex items-center justify-center text-brand-600">
                                <TrendingDown size={10} />
                              </div>
                              <span className="text-xs font-bold text-brand-600">
                                {supplier.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-brand-300 font-medium italic">
                              Non spécifié
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-sm font-bold text-red-500">
                            -{exp.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handleEdit(exp)}
                              className="text-brand-400 hover:text-brand-900 p-2 rounded-xl hover:bg-brand-50"
                              title="Modifier"
                            >
                              <Plus size={16} className="rotate-0" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="text-brand-200 hover:text-red-500 p-2 rounded-xl hover:bg-red-50"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                        <div className="inline-block p-8 rounded-full bg-brand-50 mb-4">
                          <FileSpreadsheet size={40} className="text-brand-200" />
                        </div>
                        <h4 className="text-brand-900 font-bold text-lg font-display">
                          Aucune dépense trouvée
                        </h4>
                        <p className="text-brand-400 text-sm max-w-xs mx-auto mt-2">
                          Ajustez vos filtres ou ajoutez une nouvelle dépense pour alimenter votre
                          journal.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AccountingManager);
