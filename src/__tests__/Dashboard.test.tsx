import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../components/Dashboard';
import React from 'react';
import { InvoiceStatus } from '../types';

// Mock Recharts car SVG/Canvas causes issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
}));

// Mock Lucide-react for simpler snapshots
vi.mock('lucide-react', () => ({
  Euro: () => <span>EuroIcon</span>,
  TrendingUp: () => <span>TrendingUpIcon</span>,
  AlertCircle: () => <span>AlertCircleIcon</span>,
  ArrowUpRight: () => <span>ArrowUpRightIcon</span>,
  ArrowRight: () => <span>ArrowRightIcon</span>,
  Wallet: () => <span>WalletIcon</span>,
  CheckCircle2: () => <span>CheckCircle2Icon</span>,
  Package: () => <span>PackageIcon</span>,
  Calculator: () => <span>CalculatorIcon</span>,
  TrendingDown: () => <span>TrendingDownIcon</span>,
  Users: () => <span>UsersIcon</span>,
  ArrowDownRight: () => <span>ArrowDownRightIcon</span>,
  FileText: () => <span>FileTextIcon</span>,
  ShoppingCart: () => <span>ShoppingCartIcon</span>,
  Mail: () => <span>MailIcon</span>,
  Sparkles: () => <span>SparklesIcon</span>,
  Loader2: () => <span>Loader2Icon</span>,
  GripVertical: () => <span>GripVerticalIcon</span>,
  Zap: () => <span>ZapIcon</span>,
}));

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  useDroppable: () => ({ isOver: false, setNodeRef: vi.fn() }),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: (items: any) => items,
}));

// Mock framer-motion because of layoutId issues in JSDOM
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { layoutId, ...validProps } = props;
      return <div {...validProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Dashboard', () => {
  const mockProps = {
    invoices: [
      {
        id: '1',
        type: 'invoice' as const,
        number: 'INV-01',
        date: '2026-03-01',
        dueDate: '2026-04-01',
        clientId: 'cli-1',
        total: 1000,
        status: InvoiceStatus.PAID,
        items: [],
      },
      {
        id: '2',
        type: 'invoice' as const,
        number: 'INV-02',
        date: '2026-03-15',
        dueDate: '2026-04-15',
        clientId: 'cli-2',
        total: 500,
        status: InvoiceStatus.SENT,
        items: [],
      },
    ],
    products: [],
    expenses: [
      { id: 'e1', amount: 200, category: 'Logiciels', date: '2026-03-05', description: 'SaaS' },
    ],
    onNavigate: vi.fn(),
    userProfile: {
      companyName: 'Ma Boite',
      activityType: 'SERVICE_BNC',
      siret: '123',
      address: 'Paris',
      email: 'test@test.fr',
      isAcreBeneficiary: false,
      phone: '0102030405',
    } as any,
    onSaveInvoice: vi.fn(),
  };

  it('affiche le titre du tableau de bord', () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByText('Tableau de bord')).toBeTruthy();
  });

  it('affiche les statistiques de chiffre d affaire', () => {
    render(<Dashboard {...mockProps} />);
    const elements = screen.getAllByText(/1.*000/);
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les graphiques Recharts (mockés)', () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByTestId('area-chart')).toBeTruthy();
    // Le PieChart est maintenant visible car expensesByCategory n est plus vide
    expect(screen.getByTestId('pie-chart')).toBeTruthy();
  });

  it('réagit au clic sur les actions rapides', () => {
    render(<Dashboard {...mockProps} />);
    const invoiceBtn = screen.getByText('Facture');
    invoiceBtn.click();
    expect(mockProps.onNavigate).toHaveBeenCalledWith('invoices');
  });
});
