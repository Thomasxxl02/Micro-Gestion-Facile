import React from "react";
import { Calculator, LoaderCircle as Loader2, Plus } from "lucide-react";
import { FormFieldValidated } from "../FormFieldValidated";
import Combobox from "../Combobox";
import { type Expense, type Supplier } from "../../types";

interface AddTransactionFormProps {
  isEditing: boolean;
  isAnalyzing: boolean;
  newExpense: Partial<Expense>;
  errors: any;
  touched: any;
  expenseCategories: string[];
  suppliers: Supplier[];
  handleFormChange: (field: keyof Expense) => (value: any) => void;
  setNewExpense: React.Dispatch<React.SetStateAction<Partial<Expense>>>;
  handleAddExpense: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  setShowForm: (show: boolean) => void;
  setEditingExpense: (expense: Expense | null) => void;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  isEditing,
  isAnalyzing,
  newExpense,
  errors,
  touched,
  expenseCategories,
  suppliers,
  handleFormChange,
  setNewExpense,
  handleAddExpense,
  setShowForm,
  setEditingExpense,
}) => {
  return (
    <div className="card-modern p-10 animate-slide-up bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-brand-900 pointer-events-none">
        <Calculator size={160} />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-brand-900 dark:text-brand-50 font-display flex items-center gap-3">
          {isEditing ? "Modifier la dépense" : "Ajouter une dépense"}
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
      <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <FormFieldValidated
          id="expense-date"
          label="Date de l'achat"
          type="date"
          required
          value={newExpense.date ?? ""}
          onChange={handleFormChange("date")}
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
          value={newExpense.amount ?? ""}
          onChange={(val) => {
            const amount = Number.parseFloat(val);
            handleFormChange("amount" as keyof Expense)(amount);
            const vatRate = newExpense.vatRate ?? 0;
            const vatAmount = vatRate ? amount * (vatRate / (100 + vatRate)) : (newExpense.vatAmount ?? 0);
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
          value={newExpense.vatAmount ?? ""}
          onChange={(val) => handleFormChange("vatAmount" as keyof Expense)(Number.parseFloat(val))}
          error={errors.vatAmount}
          touched={touched.vatAmount}
        />
        <div>
          <label htmlFor="expense-vat-rate" className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
            Taux TVA (%)
          </label>
          <select
            id="expense-vat-rate"
            title="Sélectionner le taux TVA"
            className="w-full p-4 border border-brand-100 dark:border-brand-700 rounded-2xl outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900 bg-white dark:bg-brand-800 transition-all font-bold text-brand-900 dark:text-brand-50 appearance-none cursor-pointer"
            value={newExpense.vatRate ?? 0}
            onChange={(e) => {
              const vatRate = Number.parseFloat(e.target.value);
              const amount = newExpense.amount ?? 0;
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
          <label htmlFor="expense-category" className="block text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">
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
            value={newExpense.description ?? ""}
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
                subLabel: s.category ?? "Fournisseur",
              }))}
            value={newExpense.supplierId ?? ""}
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
            {isEditing ? "Mettre à jour" : "Enregistrer la dépense"}
          </button>
        </div>
      </form>
    </div>
  );
};
