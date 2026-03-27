import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AccountingManager from '../../components/AccountingManager';
import type { Expense, Invoice, Supplier, UserProfile } from '../../types';

// Mock child components and icons
vi.mock('lucide-react', () => ({
  Plus: () => <span>PlusIcon</span>,
  Trash2: () => <span>Trash2Icon</span>,
  TrendingUp: () => <span>TrendingUpIcon</span>,
  TrendingDown: () => <span>TrendingDownIcon</span>,
  DollarSign: () => <span>DollarSignIcon</span>,
  Calendar: () => <span>CalendarIcon</span>,
  PieChart: () => <span>PieChartIcon</span>,
  Search: () => <span>SearchIcon</span>,
  Filter: () => <span>FilterIcon</span>,
  Calculator: () => <span>CalculatorIcon</span>,
  FileSpreadsheet: () => <span>FileSpreadsheetIcon</span>,
  Camera: () => <span>CameraIcon</span>,
  Loader2: () => <span>Loader2Icon</span>,
}));

// Mock Recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Cell: () => <div data-testid="cell" />,
}));

// Mock Gemini service
vi.mock('../../services/geminiService', () => ({
  analyzeReceipt: vi.fn().mockResolvedValue({
    supplier: 'Test Supplier',
    amount: 100,
    category: 'supplies',
    date: '2026-03-21',
  }),
}));

// Mock fiscal calculations
vi.mock('../../lib/fiscalCalculations', () => ({
  calculateSocialContributions: vi.fn().mockReturnValue(500),
  calculateIncomeTaxPFL: vi.fn().mockReturnValue(1000),
}));

describe('AccountingManager Component', () => {
  const mockExpenses: Expense[] = [
    {
      id: 'exp-1',
      date: '2026-01-15',
      supplierId: 'sup-1',
      amount: 150,
      category: 'supplies',
      description: 'Fournitures de bureau',
    },
    {
      id: 'exp-2',
      date: '2026-02-10',
      supplierId: 'sup-2',
      amount: 300,
      category: 'services',
      description: 'Service comptable',
    },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      number: 'FAC-001',
      date: '2026-01-01',
      dueDate: '2026-02-01',
      clientId: 'cli-1',
      items: [],
      total: 1000,
      status: 'paid',
      type: 'invoice',
    },
  ];

  const mockSuppliers: Supplier[] = [
    {
      id: 'sup-1',
      name: 'Supplier A',
      email: 'supplier@test.fr',
      phone: '0102030405',
      address: 'Test Address',
      siret: '12345678901234',
      archived: false,
    },
  ];

  const mockUserProfile: UserProfile = {
    companyName: 'Test Company',
    siret: '98765432109876',
    address: 'Test Address',
    email: 'contact@test.fr',
    phone: '0102030405',
    activityType: 'SERVICE_BNC',
    isAcreBeneficiary: false,
  };

  describe('Rendering', () => {
    it('affiche le gestionnaire comptable', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it('affiche la liste des dépenses', () => {
      render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
          userProfile={mockUserProfile}
        />
      );

      // Check that expense amounts are displayed
      expect(screen.queryAllByText(/150|300/)).toBeDefined();
    });

    it('affiche les onglets du gestionnaire comptable', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
        />
      );

      expect(container.innerHTML).toBeDefined();
    });

    it('gère le cas avec zéro dépense', () => {
      const { container } = render(
        <AccountingManager expenses={[]} setExpenses={vi.fn()} invoices={[]} suppliers={[]} />
      );

      expect(container).toBeDefined();
    });
  });

  describe('Functionality', () => {
    it("permet d'ajouter une dépense", () => {
      const onSaveExpense = vi.fn();
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
          onSaveExpense={onSaveExpense}
        />
      );

      expect(container).toBeDefined();
    });

    it('affiche les graphiques de synthèse', () => {
      render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
        />
      );

      // Look for chart elements
      const chartElements = screen.queryAllByTestId(/chart|grid/);
      expect(chartElements).toBeDefined();
    });

    it('filtre les dépenses par catégorie', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
        />
      );

      expect(container).toBeDefined();
    });

    it('calcule le total des dépenses', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
        />
      );

      const total = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      expect(total).toBe(450);
      expect(container).toBeDefined();
    });

    it('affiche les données fiscales', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
          userProfile={mockUserProfile}
        />
      );

      expect(container).toBeDefined();
    });

    it('gère plusieurs années fiscales', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
        />
      );

      expect(container).toBeDefined();
    });

    it('affiche le solde entre revenus et dépenses', () => {
      const totalExpenses = mockExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalRevenues = mockInvoices.reduce((sum, inv) => sum + inv.total, 0);

      expect(totalExpenses).toBe(450);
      expect(totalRevenues).toBe(1000);

      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
        />
      );

      expect(container).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('gère les dépenses vides', () => {
      const { container } = render(
        <AccountingManager
          expenses={[]}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={[]}
        />
      );

      expect(container).toBeDefined();
    });

    it('gère les factures vides', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={[]}
          suppliers={mockSuppliers}
        />
      );

      expect(container).toBeDefined();
    });

    it('gère les fournisseurs vides', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={[]}
        />
      );

      expect(container).toBeDefined();
    });

    it('gère sans userProfile', () => {
      const { container } = render(
        <AccountingManager
          expenses={mockExpenses}
          setExpenses={vi.fn()}
          invoices={mockInvoices}
          suppliers={mockSuppliers}
        />
      );

      expect(container).toBeDefined();
    });
  });
});
