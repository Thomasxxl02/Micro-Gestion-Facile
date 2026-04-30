import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddTransactionForm } from "../../../components/accounting/AddTransactionForm";

// Mock Lucide components
vi.mock("lucide-react", () => ({
  Plus: () => <span>+</span>,
  X: () => <span>x</span>,
  Trash2: () => <span>trash</span>,
  Calendar: () => <span>calendar</span>,
  Euro: () => <span>euro</span>,
  Tag: () => <span>tag</span>,
  Upload: () => <span>upload</span>,
  Search: () => <span>search</span>,
  CheckCircle2: () => <span>check</span>,
  CircleCheck: () => <span>check</span>,
  Flame: () => <span>flame</span>,
  Calculator: () => <span>calculator</span>,
  Receipt: () => <span>receipt</span>,
  ChevronDown: () => <span>chevron</span>,
  LoaderCircle: () => <span>loader</span>,
}));

const mockSuppliers = [
  { id: "1", name: "Supplier One", category: "IT" },
  { id: "2", name: "Supplier Two", category: "Marketing" },
];

const mockProps = {
  isEditing: false,
  isAnalyzing: false,
  newExpense: {
    date: "2026-03-01",
    description: "",
    amount: 0,
    vatAmount: 0,
    vatRate: 20,
    category: "Fournitures",
    supplierId: "",
  },
  errors: {},
  touched: {},
  expenseCategories: ["Fournitures", "Services", "Matériel"],
  suppliers: mockSuppliers,
  handleFormChange: vi.fn(),
  setNewExpense: vi.fn(),
  handleAddExpense: vi.fn(),
  setShowForm: vi.fn(),
  setEditingExpense: vi.fn(),
};

describe("AddTransactionForm", () => {
  it("affiche le formulaire correctement", () => {
    render(<AddTransactionForm {...mockProps} />);

    expect(
      screen.getByPlaceholderText(/Ex: Abonnement Internet/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Fournisseur/i).length).toBeGreaterThan(0);
  });

  it("appelle handleAddExpense au submit", async () => {
    const handleAddExpense = vi.fn((e) => e.preventDefault());
    render(
      <AddTransactionForm {...mockProps} handleAddExpense={handleAddExpense} />,
    );

    const submitButton = screen.getByText(/Enregistrer la dépense/i);
    fireEvent.submit(submitButton.closest("form")!);
    expect(handleAddExpense).toHaveBeenCalled();
  });

  it("affiche le loader lors de l'analyse IA", () => {
    render(<AddTransactionForm {...mockProps} isAnalyzing={true} />);
    expect(screen.getByText(/Analyse IA en cours.../i)).toBeInTheDocument();
  });

  it("gère le changement de montant TTC et calcule la TVA", () => {
    const setNewExpense = vi.fn();
    const handleFormChange = vi.fn(() => vi.fn());
    render(
      <AddTransactionForm
        {...mockProps}
        setNewExpense={setNewExpense}
        handleFormChange={handleFormChange}
      />,
    );

    // Le label "Montant TTC (€)"
    const amountInput = screen.getByLabelText(/Montant TTC/i);
    fireEvent.change(amountInput, { target: { value: "120.00" } });

    // Vérifie que handleFormChange est appelé pour le montant (curried function)
    expect(handleFormChange).toHaveBeenCalledWith("amount");

    // La mise à jour de TVA est déclenchée via setNewExpense dans le onChange
    expect(setNewExpense).toHaveBeenCalled();
  });

  it("ferme le formulaire au clic sur annuler ou croix", () => {
    render(<AddTransactionForm {...mockProps} />);

    const cancelButton = screen.getByText(/Annuler/i);
    fireEvent.click(cancelButton);
    expect(mockProps.setShowForm).toHaveBeenCalledWith(false);
    expect(mockProps.setEditingExpense).toHaveBeenCalledWith(null);
  });

  it("gère le changement de taux de TVA", () => {
    const setNewExpense = vi.fn();
    render(<AddTransactionForm {...mockProps} setNewExpense={setNewExpense} />);

    const vatRateSelect = screen.getByTitle(/Sélectionner le taux TVA/i);
    fireEvent.change(vatRateSelect, { target: { value: "10" } });

    expect(setNewExpense).toHaveBeenCalled();
  });

  it("gère le changement de catégorie", () => {
    const setNewExpense = vi.fn();
    render(<AddTransactionForm {...mockProps} setNewExpense={setNewExpense} />);

    const categorySelect = screen.getByTitle(/Sélectionner la catégorie/i);
    fireEvent.change(categorySelect, { target: { value: "Services" } });

    expect(setNewExpense).toHaveBeenCalled();
  });
});
