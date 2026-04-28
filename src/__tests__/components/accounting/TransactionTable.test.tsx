import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionTable } from '../../../components/accounting/TransactionTable';
import { type Expense, type Supplier } from '../../../types';
import '@testing-library/jest-dom';

describe('TransactionTable', () => {
  const mockExpenses: Expense[] = [
    {
      id: '1',
      date: '2026-04-20',
      description: 'Test Expense',
      amount: 100,
      vatAmount: 20,
      vatRate: 20,
      category: 'Achats',
      supplierId: 's1',
    },
  ];
  const mockSuppliers: Supplier[] = [
    { id: 's1', name: 'Supplier One', category: 'Informatique', email: '', phone: '', address: '' },
  ];

  const mockHandlers = {
    toggleSelectAll: vi.fn(),
    toggleSelect: vi.fn(),
    handleEdit: vi.fn(),
    handleDelete: vi.fn(),
  };

  it('affiche les données de la dépense', () => {
    render(
      <TransactionTable
        filteredExpenses={mockExpenses}
        selectedExpenses={[]}
        suppliers={mockSuppliers}
        {...mockHandlers}
      />
    );
    expect(screen.getByText('Test Expense')).toBeInTheDocument();
    expect(screen.getByText('Supplier One')).toBeInTheDocument();
    expect(screen.getByText(/100\s?€/)).toBeInTheDocument();
  });

  it('appelle toggleSelect au clic sur la checkbox individuelle', () => {
    render(
      <TransactionTable
        filteredExpenses={mockExpenses}
        selectedExpenses={[]}
        suppliers={mockSuppliers}
        {...mockHandlers}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    // Index 0 est "Select All", index 1 est la dépense 1
    fireEvent.click(checkboxes[1]);
    expect(mockHandlers.toggleSelect).toHaveBeenCalledWith('1');
  });

  it('appelle toggleSelectAll au clic sur la checkbox globale', () => {
    render(
      <TransactionTable
        filteredExpenses={mockExpenses}
        selectedExpenses={[]}
        suppliers={mockSuppliers}
        {...mockHandlers}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(mockHandlers.toggleSelectAll).toHaveBeenCalled();
  });

  it('appelle handleEdit au clic sur modifier', () => {
    render(
      <TransactionTable
        filteredExpenses={mockExpenses}
        selectedExpenses={[]}
        suppliers={mockSuppliers}
        {...mockHandlers}
      />
    );
    
    const editButton = screen.getByTitle('Modifier');
    fireEvent.click(editButton);
    expect(mockHandlers.handleEdit).toHaveBeenCalledWith(mockExpenses[0]);
  });

  it('appelle handleDelete au clic sur supprimer', () => {
    // On rend les boutons visibles car ils sont opacity-0 par défaut (hover)
    render(
      <TransactionTable
        filteredExpenses={mockExpenses}
        selectedExpenses={[]}
        suppliers={mockSuppliers}
        {...mockHandlers}
      />
    );
    const deleteBtn = screen.getByTitle('Supprimer');
    fireEvent.click(deleteBtn);
    expect(mockHandlers.handleDelete).toHaveBeenCalledWith('1');
  });

  it('affiche un message si aucune dépense', () => {
    render(
      <TransactionTable
        filteredExpenses={[]}
        selectedExpenses={[]}
        suppliers={[]}
        {...mockHandlers}
      />
    );
    expect(screen.getByText('Aucune dépense trouvée')).toBeInTheDocument();
  });
});
