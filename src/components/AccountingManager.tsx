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
  TrendingDown,
  TrendingUp,
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
import Combobox from "./Combobox";
import { FormFieldValidated } from "./FormFieldValidated";

// Lazy load des dépendances lourdes
const AccountingCharts = React.lazy(() => import("./AccountingCharts"));

import {
  calculateIncomeTaxPFL,
  calculateSocialContributions,
} from "../lib/fiscalCalculations";
import { formatCurrency } from "../lib/formatters";
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
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-900 font-display tracking-tight">
            Comptabilité
          </h1>
          <p className="text-brand-500 mt-1">
            Suivi de trésorerie et pilotage financier.
          </p>
        </div>
        <div className="flex bg-brand-100/50 p-1 rounded-2xl border border-brand-100">
          <button
            onClick={() => setActiveTab("journal")}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === "journal" ? "bg-white text-brand-900 shadow-sm" : "bg-transparent text-brand-500 hover:text-brand-700"}`}
          >
            Journal
          </button>
          <button
            onClick={() => setActiveTab("bilan")}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === "bilan" ? "bg-white text-brand-900 shadow-sm" : "bg-transparent text-brand-500 hover:text-brand-700"}`}
          >
            Bilan
          </button>
          <button
            onClick={() => setActiveTab("fiscal")}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === "fiscal" ? "bg-white text-brand-900 shadow-sm" : "bg-transparent text-brand-500 hover:text-brand-700"}`}
          >
            Fiscal
          </button>
        </div>
      </div>

      {activeTab === "bilan" && (
        <div className="space-y-8 animate-slide-up">
          {/* Main Stats Grid */}
          <FiscalSummaryCard
              totalRevenue={totalRevenue}
              totalExpenses={totalExpenses}
              netResult={netResult}
              netAfterCharges={netAfterCharges}
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
                onChange={(e) =>
                  setSelectedYear(Number.parseInt(e.target.value))
                }
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
                {totalYearlyRevenue.toLocaleString("fr-FR")} €
              </h3>
              <p className="text-[10px] text-brand-400 mt-4 italic">
                Total des factures payées.
              </p>
            </div>
            <div className="card-modern p-8">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                Cotisations Sociales
              </p>
              <h3 className="text-3xl font-bold text-brand-900 font-display">
                {fiscalSummary?.amount.toLocaleString("fr-FR") ??
                  totalYearlyTax.toLocaleString("fr-FR")}{" "}
                €
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-400 uppercase">
                  Taux appliqué
                </span>
                <span className="text-xs font-bold text-brand-600">
                  {fiscalSummary?.rate ?? taxRate}%
                </span>
              </div>
            </div>
            <div className="card-modern p-8">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
                Impôt (PFL Est.)
              </p>
              <h3 className="text-3xl font-bold text-brand-900 font-display">
                {yearlyIncomeTax.toLocaleString("fr-FR")} €
              </h3>
              <p className="text-[10px] text-brand-400 mt-4">
                Prélèvement Libératoire
              </p>
            </div>
            <div className="card-modern p-8 bg-accent-50 border-accent-100">
              <p className="text-[10px] font-bold text-accent-700 uppercase tracking-widest mb-2">
                Revenu Net Estimé
              </p>
              <h3 className="text-3xl font-bold text-accent-900 font-display">
                {(
                  totalYearlyRevenue -
                  (fiscalSummary?.amount ?? totalYearlyTax) -
                  yearlyIncomeTax
                ).toLocaleString("fr-FR")}{" "}
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
                  <th className="px-8 py-4 text-right">
                    Cotisations ({taxRate}%)
                  </th>
                  <th className="px-8 py-4 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {fiscalData.map((data) => (
                  <tr
                    key={data.name}
                    className="hover:bg-brand-50/30 transition-colors"
                  >
                    <td className="px-8 py-4 text-sm font-bold text-brand-900">
                      {data.name}
                    </td>
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
                  <td className="px-8 py-6 text-sm uppercase tracking-widest">
                    Total Annuel
                  </td>
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
      {activeTab === "journal" && (
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
                onClick={() => {
                  void handleExportLivreRecettesPFD();
                }}
                className="flex-1 sm:flex-none bg-white hover:bg-brand-50 text-brand-600 border border-brand-100 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm"
              >
                <Calculator size={16} />
                Livre des Recettes (PDF)
              </button>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setNewExpense({
                    date: new Date().toISOString().split("T")[0],
                    description: "",
                    amount: 0,
                    vatAmount: 0,
                    vatRate: 0,
                    category: "Achats",
                    supplierId: "",
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
                  onChange={(e) => {
                    void handleFileUpload(e);
                  }}
                />
                <button className="w-full sm:w-auto bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-500/10 text-[10px] font-bold uppercase tracking-widest">
                  <Camera size={18} />
                  Scanner Ticket
                </button>
              </div>
            </div>
          </div>

          {showForm && (
            <AddTransactionForm
              isEditing={!!editingExpense}
              isAnalyzing={isAnalyzing}
              newExpense={newExpense}
              errors={errors}
              touched={touched}
              expenseCategories={expenseCategories}
              suppliers={suppliers}
              handleFormChange={handleFormChange}
              setNewExpense={setNewExpense}
              handleAddExpense={handleAddExpense}
              setShowForm={setShowForm}
              setEditingExpense={setEditingExpense}
            />
          )}

          <TransactionTable
            filteredExpenses={filteredExpenses}
            selectedExpenses={selectedExpenses}
            suppliers={suppliers}
            toggleSelectAll={toggleSelectAll}
            toggleSelect={toggleSelect}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(AccountingManager);
