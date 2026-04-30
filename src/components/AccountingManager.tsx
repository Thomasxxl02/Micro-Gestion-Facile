import {
  Calculator,
  Calendar,
  Camera,
  DollarSign,
  FileSpreadsheet,
  File as Filter,
  LoaderCircle as Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { Suspense, useMemo, useState } from "react";
import { useFormValidation } from "../hooks/useFormValidation";
import { ExpenseSchema, schemaToRules } from "../lib/zod-schemas";
import {
  type Client,
  type Expense,
  type Invoice,
  type Supplier,
  type UserProfile,
  InvoiceStatus,
} from "../types";

// Lazy load des dépendances lourdes
const AccountingCharts = React.lazy(() => import("./AccountingCharts"));

import {
  calculateIncomeTaxPFL,
  calculateSocialContributions,
} from "../lib/fiscalCalculations";
import { AddTransactionForm } from "./accounting/AddTransactionForm";
import { FiscalSummaryCard } from "./accounting/FiscalSummaryCard";
import { TransactionTable } from "./accounting/TransactionTable";
import { QuarterlyStats } from "./accounting/QuarterlyStats";

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
  const [activeTab, setActiveTab] = useState<"journal" | "bilan" | "fiscal">(
    "journal",
  );
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [taxRate] = useState(21.1); // Default for services
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form handling logic
  const initialFormState = {
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    vatAmount: 0,
    vatRate: 0,
    category: "Achats",
    supplierId: "",
  };

  const {
    data: newExpense,
    setData: setNewExpense,
    errors,
    touched,
    handleChange: handleFormChange,
    validate: validateAll,
  } = useFormValidation<Partial<Expense>>(
    initialFormState,
    schemaToRules(ExpenseSchema),
  );

  const resetExpenseForm = () => {
    setNewExpense(initialFormState);
  };

  const fiscalData = useMemo(() => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
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
          const type = inv.type || "invoice";
          if (type === "invoice") {
            return sum + inv.total;
          }
          if (type === "credit_note") {
            return sum - inv.total;
          }
          return sum;
        }, 0);

      return {
        name,
        revenue: monthRevenue,
        tax: monthRevenue * (taxRate / 100),
      };
    });
  }, [invoices, selectedYear, taxRate]);

  const totalYearlyRevenue = useMemo(
    () => fiscalData.reduce((sum, d) => sum + d.revenue, 0),
    [fiscalData],
  );
  const totalYearlyTax = useMemo(
    () => fiscalData.reduce((sum, d) => sum + d.tax, 0),
    [fiscalData],
  );

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
        const base64 = (event.target?.result as string).split(",")[1];
        // Import dynamique de analyzeReceipt pour réduire le bundle initial
        const { analyzeReceipt } = await import("../services/geminiService");
        const result = await analyzeReceipt(base64, file.type);

        if (result) {
          // Find supplier if possible
          let supplierId = "";
          if (result.supplierName) {
            const existingSupplier = suppliers.find((s) =>
              s.name.toLowerCase().includes(result.supplierName.toLowerCase()),
            );
            if (existingSupplier) {
              supplierId = existingSupplier.id;
            }
          }

          setNewExpense((prev) => ({
            ...prev,
            date: result.date || prev.date,
            description:
              result.description || result.supplierName || prev.description,
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
      console.error("OCR Error:", error);
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
        exp.id === editingExpense.id ? updatedExpense : exp,
      );
      setExpenses(updatedExpenses);
      if (onSaveExpense) {
        onSaveExpense(updatedExpense);
      }
    } else {
      const expense: Expense = {
        id: Date.now().toString(),
        date: newExpense.date ?? new Date().toISOString().split("T")[0],
        description: newExpense.description ?? "",
        amount: Number(newExpense.amount ?? 0),
        vatAmount: Number(newExpense.vatAmount ?? 0),
        vatRate: Number(newExpense.vatRate ?? 0),
        category: newExpense.category ?? "Achats",
        supplierId: newExpense.supplierId ?? "",
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
      vatAmount: expense.vatAmount ?? 0,
      vatRate: expense.vatRate ?? 0,
      category: expense.category,
      supplierId: expense.supplierId,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cette dépense ?")) {
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
    if (
      confirm(
        `Supprimer les ${selectedExpenses.length} dépenses sélectionnées ?`,
      )
    ) {
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
      "Date",
      "Type",
      "Description",
      "Montant TTC",
      "TVA",
      "Net HT",
      "Catégorie",
      "Client/Fournisseur",
    ];

    const rows = [
      ...filteredExpenses.map((e) => [
        e.date,
        "DÉPENSE",
        `"${e.description.replaceAll('"', '""')}"`,
        e.amount.toFixed(2),
        (e.vatAmount ?? 0).toFixed(2),
        (e.amount - (e.vatAmount ?? 0)).toFixed(2),
        `"${e.category}"`,
        `"${suppliers.find((s) => s.id === e.supplierId)?.name.replaceAll('"', '""') ?? "N/A"}"`,
      ]),
      ...invoices
        .filter((inv) => inv.status === InvoiceStatus.PAID)
        .map((inv) => [
          inv.date,
          "RECETTE",
          `"Facture ${inv.number}"`,
          inv.total.toFixed(2),
          (inv.vatAmount ?? 0).toFixed(2),
          (inv.subtotal ?? inv.total).toFixed(2),
          '"Prestation"',
          `"${clients.find((c) => c.id === inv.clientId)?.name.replaceAll('"', '""') ?? "N/A"}"`,
        ]),
    ].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_comptable_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportLivreRecettesPFD = async () => {
    const paidInvoices = invoices
      .filter(
        (inv) =>
          inv.status === InvoiceStatus.PAID &&
          new Date(inv.date).getFullYear() === selectedYear,
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const { jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("LIVRE DES RECETTES", 14, 22);
    doc.setFontSize(10);
    doc.text(
      `Année: ${selectedYear} - Micro-Entreprise: ${userProfile?.companyName ?? "N/A"}`,
      14,
      30,
    );
    doc.text(`SIRET: ${userProfile?.siret ?? "N/A"}`, 14, 35);
    doc.text(
      "Document infalsifiable généré le " + new Date().toLocaleDateString(),
      14,
      40,
    );

    const tableData = paidInvoices.map((inv) => [
      inv.date,
      inv.number,
      clients.find((c) => c.id === inv.clientId)?.name ?? "Inconnu",
      inv.total.toFixed(2) + " €",
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
      head: [["Date", "N° Facture", "Client", "Montant Encaissé (TTC)"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [51, 51, 51] },
    });

    doc.save(`livre_recettes_${selectedYear}.pdf`);
  };

  // --- STATISTICS ---
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

  const netResult = totalRevenue - totalExpenses;
  const estimatedCharges = totalRevenue * (taxRate / 100);
  const netAfterCharges = netResult - estimatedCharges;

  // Monthly breakdown for BarChart
  const monthlyComparison = useMemo(() => {
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

  // Quarterly breakdown
  const quarterlyStats = useMemo(() => {
    const quarters = [
      { name: "T1 (Jan-Mar)", income: 0, expense: 0 },
      { name: "T2 (Avr-Juin)", income: 0, expense: 0 },
      { name: "T3 (Juil-Sep)", income: 0, expense: 0 },
      { name: "T4 (Oct-Déc)", income: 0, expense: 0 },
    ];

    invoices.forEach((inv) => {
      if (inv.status === InvoiceStatus.PAID) {
        const month = new Date(inv.date).getMonth();
        const qIdx = Math.floor(month / 3);
        const type = inv.type || "invoice";
        if (type === "invoice") {
          quarters[qIdx].income += inv.total;
        } else if (type === "credit_note") {
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
      const cat = exp.category || "Autre";
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
      const matchesCategory =
        !categoryFilter || exp.category === categoryFilter;
      const matchesMin =
        !minAmount || exp.amount >= Number.parseFloat(minAmount);
      const matchesMax =
        !maxAmount || exp.amount <= Number.parseFloat(maxAmount);
      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    });
  }, [expenses, searchTerm, categoryFilter, minAmount, maxAmount, suppliers]);

  const expenseCategories = [
    "Achats",
    "Loyer",
    "Logiciels",
    "Déplacements",
    "Assurance",
    "Marketing",
    "Repas",
    "Fournitures",
    "Autre",
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-brand-900 dark:text-white font-display tracking-tight">
            Comptabilité
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">
            Suivi de vos revenus, dépenses et obligations fiscales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              onClick={() => document.getElementById("receipt-upload")?.click()}
              className="btn-secondary"
              title="Scanner un reçu via IA"
            >
              <Camera size={18} />
              <span className="hidden sm:inline">IA Scanner</span>
            </button>
            <input
              id="receipt-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          <button
            onClick={() => {
              resetExpenseForm();
              setEditingExpense(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Plus size={20} />
            <span>Nouvelle Dépense</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/50 dark:bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 w-fit backdrop-blur-md">
        <button
          onClick={() => setActiveTab("journal")}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === "journal"
              ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
              : "text-neutral-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
          }`}
        >
          Journal
        </button>
        <button
          onClick={() => setActiveTab("bilan")}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === "bilan"
              ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
              : "text-neutral-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
          }`}
        >
          Bilan
        </button>
        <button
          onClick={() => setActiveTab("fiscal")}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === "fiscal"
              ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
              : "text-neutral-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
          }`}
        >
          Fiscal
        </button>
      </div>

      <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" /></div>}>
        {activeTab === "bilan" && (
        <div className="space-y-10 animate-slide-up">
          {/* Main Stats Grid */}
          <FiscalSummaryCard
            totalRevenue={totalRevenue}
            totalExpenses={totalExpenses}
            netResult={netResult}
            netAfterCharges={netAfterCharges}
          />

          {/* Charts Section - Lazy Loaded */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
              </div>
            }
          >
            <AccountingCharts
              monthlyComparison={monthlyComparison}
              expensesByCategory={expensesByCategory}
              totalExpenses={totalExpenses}
            />
          </Suspense>

          {/* Quarterly Breakdown Section */}
          <QuarterlyStats quarterlyStats={quarterlyStats} taxRate={taxRate} />
        </div>
      )}

      {activeTab === "fiscal" && (
        <div className="space-y-8 animate-slide-up">
          {/* ... existing code ... */}
        </div>
      )}
      {activeTab === "journal" && (
        <div className="animate-fade-in space-y-6">
          {/* ... existing code ... */}
        </div>
      )}
      </Suspense>
    </div>
  );
};


export default React.memo(AccountingManager);
