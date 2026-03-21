import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from 'firebase/auth';
import type {
  ViewState,
  Invoice,
  Client,
  Supplier,
  Product,
  Expense,
  Email,
  EmailTemplate,
  CalendarEvent,
  UserProfile,
  LogEntry,
} from '../types';

export interface AppStoreState {
  // UI State
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;

  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;

  // Auth State
  user: User | null;
  setUser: (user: User | null) => void;

  isAuthReady: boolean;
  setIsAuthReady: (ready: boolean) => void;

  // Data State
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  updateInvoices: (updater: (invoices: Invoice[]) => Invoice[]) => void;

  clients: Client[];
  setClients: (clients: Client[]) => void;
  updateClients: (updater: (clients: Client[]) => Client[]) => void;

  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  updateSuppliers: (updater: (suppliers: Supplier[]) => Supplier[]) => void;

  products: Product[];
  setProducts: (products: Product[]) => void;
  updateProducts: (updater: (products: Product[]) => Product[]) => void;

  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  updateExpenses: (updater: (expenses: Expense[]) => Expense[]) => void;

  emails: Email[];
  setEmails: (emails: Email[]) => void;
  updateEmails: (updater: (emails: Email[]) => Email[]) => void;

  emailTemplates: EmailTemplate[];
  setEmailTemplates: (templates: EmailTemplate[]) => void;
  updateEmailTemplates: (updater: (templates: EmailTemplate[]) => EmailTemplate[]) => void;

  calendarEvents: CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;
  updateCalendarEvents: (updater: (events: CalendarEvent[]) => CalendarEvent[]) => void;

  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updater: (profile: UserProfile) => Partial<UserProfile>) => void;

  // Activity Logs
  activityLogs: LogEntry[];
  addLog: (action: string, category: LogEntry['category'], severity: LogEntry['severity'], details?: string) => void;
  clearLogs: () => void;

  // Reset
  reset: () => void;
  clearTestData: () => void;
}

// Default user profile
const defaultUserProfile: UserProfile = {
  companyName: 'Ma Micro-Entreprise',
  professionalTitle: 'Consultant Indépendant',
  siret: '123 456 789 00012',
  address: '123 Avenue de la République, 75001 Paris',
  email: 'contact@mon-entreprise.fr',
  phone: '01 02 03 04 05',
  website: 'www.mon-entreprise.fr',
  linkedin: 'linkedin.com/in/mon-profil',
  bankAccount: 'FR76 1234 5678 9012 3456 7890 123',
  bic: 'TRPUFRPPXXX',
  currency: '€',
  invoicePrefix: 'FAC-',
  quotePrefix: 'DEV-',
  orderPrefix: 'COM-',
  creditNotePrefix: 'AVO-',
  defaultVatRate: 0,
  logoColor: '#102a43',
  activityType: 'SERVICE_BNC',
  isAcreBeneficiary: false,
  vatThresholdAlert: true,
  revenueThresholdAlert: true,
};

const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Envoi Facture',
    subject: 'Votre facture {{invoice_number}}',
    body: "Bonjour {{client_name}},\n\nVeuillez trouver ci-joint votre facture {{invoice_number}} d'un montant de {{total}}.\n\nCordialement,\n{{company_name}}",
    type: 'invoice',
  },
  {
    id: '2',
    name: 'Relance Paiement',
    subject: 'Relance : Facture {{invoice_number}} impayée',
    body: 'Bonjour {{client_name}},\n\nSauf erreur de notre part, le paiement de la facture {{invoice_number}} ne nous est pas parvenu.\n\nMerci de régulariser la situation au plus vite.\n\nCordialement,\n{{company_name}}',
    type: 'reminder',
  },
];

// Store creation
export const useAppStore = create<AppStoreState>()(
  devtools(
    persist(
      (set) => ({
        // UI State
        currentView: 'dashboard' as ViewState,
        setCurrentView: (view: ViewState) => set({ currentView: view }),

        isMobileMenuOpen: false,
        setIsMobileMenuOpen: (open: boolean) => set({ isMobileMenuOpen: open }),

        isDarkMode:
          typeof globalThis !== 'undefined' && globalThis.window
            ? localStorage.getItem('theme') === 'dark' ||
              (localStorage.getItem('theme') !== 'light' &&
                globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches)
            : false,
        setIsDarkMode: (isDark: boolean) => {
          if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          }
          set({ isDarkMode: isDark });
        },

        // Auth State
        user: null,
        setUser: (user: User | null) => set({ user }),

        isAuthReady: false,
        setIsAuthReady: (ready: boolean) => set({ isAuthReady: ready }),

        // Data State
        invoices: [],
        setInvoices: (invoices: Invoice[]) => set({ invoices }),
        updateInvoices: (updater: (invoices: Invoice[]) => Invoice[]) =>
          set((state) => ({ invoices: updater(state.invoices) })),

        clients: [],
        setClients: (clients: Client[]) => set({ clients }),
        updateClients: (updater: (clients: Client[]) => Client[]) =>
          set((state) => ({ clients: updater(state.clients) })),

        suppliers: [],
        setSuppliers: (suppliers: Supplier[]) => set({ suppliers }),
        updateSuppliers: (updater: (suppliers: Supplier[]) => Supplier[]) =>
          set((state) => ({ suppliers: updater(state.suppliers) })),

        products: [],
        setProducts: (products: Product[]) => set({ products }),
        updateProducts: (updater: (products: Product[]) => Product[]) =>
          set((state) => ({ products: updater(state.products) })),

        expenses: [],
        setExpenses: (expenses: Expense[]) => set({ expenses }),
        updateExpenses: (updater: (expenses: Expense[]) => Expense[]) =>
          set((state) => ({ expenses: updater(state.expenses) })),

        emails: [],
        setEmails: (emails: Email[]) => set({ emails }),
        updateEmails: (updater: (emails: Email[]) => Email[]) =>
          set((state) => ({ emails: updater(state.emails) })),

        emailTemplates: defaultEmailTemplates,
        setEmailTemplates: (templates: EmailTemplate[]) => set({ emailTemplates: templates }),
        updateEmailTemplates: (updater: (templates: EmailTemplate[]) => EmailTemplate[]) =>
          set((state) => ({ emailTemplates: updater(state.emailTemplates) })),

        calendarEvents: [],
        setCalendarEvents: (events: CalendarEvent[]) => set({ calendarEvents: events }),
        updateCalendarEvents: (updater: (events: CalendarEvent[]) => CalendarEvent[]) =>
          set((state) => ({ calendarEvents: updater(state.calendarEvents) })),

        userProfile: defaultUserProfile,
        setUserProfile: (profile: UserProfile) => set({ userProfile: profile }),
        updateUserProfile: (updater: (profile: UserProfile) => Partial<UserProfile>) =>
          set((state) => ({
            userProfile: { ...state.userProfile, ...updater(state.userProfile) },
          })),

        // Activity Logs
        activityLogs: [],
        addLog: (action, category, severity, details) =>
          set((state) => ({
            activityLogs: [
              {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                action,
                category,
                severity,
                details,
              },
              ...state.activityLogs,
            ].slice(0, 50), // Keep only last 50 logs
          })),
        clearLogs: () => set({ activityLogs: [] }),

        // Reset
        reset: () =>
          set({
            currentView: 'dashboard',
            isMobileMenuOpen: false,
            user: null,
            isAuthReady: false,
            invoices: [],
            clients: [],
            suppliers: [],
            products: [],
            expenses: [],
            emails: [],
            emailTemplates: defaultEmailTemplates,
            calendarEvents: [],
            userProfile: defaultUserProfile,
            activityLogs: [],
          }),

        clearTestData: () =>
          set((state) => ({
            invoices: state.invoices.filter((i) => !i.isTest),
            clients: state.clients.filter((c) => !c.isTest),
            products: state.products.filter((p) => !p.isTest),
          })),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          currentView: state.currentView,
          isDarkMode: state.isDarkMode,
          invoices: state.invoices,
          clients: state.clients,
          suppliers: state.suppliers,
          products: state.products,
          expenses: state.expenses,
          emails: state.emails,
          emailTemplates: state.emailTemplates,
          calendarEvents: state.calendarEvents,
          userProfile: state.userProfile,
          activityLogs: state.activityLogs,
        }),
      }
    )
  )
);

export default useAppStore;
