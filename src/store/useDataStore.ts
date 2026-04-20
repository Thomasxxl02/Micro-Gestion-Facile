/**
 * useDataStore.ts
 * Dedicated store for business data
 *
 * Handles: entities (invoices, clients, products, etc.) + user profile + sync state
 * Consumed by: Managers, Dashboard, InvoiceForm, etc.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  CalendarEvent,
  Client,
  Email,
  EmailTemplate,
  Expense,
  Invoice,
  Product,
  Supplier,
  UserProfile,
} from "../types";

export interface DataStoreState {
  // Entities
  invoices: Invoice[];
  setInvoices: (_invoices: Invoice[]) => void;
  updateInvoices: (_updater: (_invoices: Invoice[]) => Invoice[]) => void;

  clients: Client[];
  setClients: (_clients: Client[]) => void;
  updateClients: (_updater: (_clients: Client[]) => Client[]) => void;

  suppliers: Supplier[];
  setSuppliers: (_suppliers: Supplier[]) => void;
  updateSuppliers: (_updater: (_suppliers: Supplier[]) => Supplier[]) => void;

  products: Product[];
  setProducts: (_products: Product[]) => void;
  updateProducts: (_updater: (_products: Product[]) => Product[]) => void;

  expenses: Expense[];
  setExpenses: (_expenses: Expense[]) => void;
  updateExpenses: (_updater: (_expenses: Expense[]) => Expense[]) => void;

  emails: Email[];
  setEmails: (_emails: Email[]) => void;
  updateEmails: (_updater: (_emails: Email[]) => Email[]) => void;

  emailTemplates: EmailTemplate[];
  setEmailTemplates: (_templates: EmailTemplate[]) => void;
  updateEmailTemplates: (
    _updater: (_templates: EmailTemplate[]) => EmailTemplate[],
  ) => void;

  calendarEvents: CalendarEvent[];
  setCalendarEvents: (_events: CalendarEvent[]) => void;
  updateCalendarEvents: (
    _updater: (_events: CalendarEvent[]) => CalendarEvent[],
  ) => void;

  // User Profile
  userProfile: UserProfile;
  setUserProfile: (_profile: UserProfile) => void;
  updateUserProfile: (
    _updater: (_profile: UserProfile) => Partial<UserProfile>,
  ) => void;

  // Sync State
  isSyncing: boolean;
  setIsSyncing: (_isSyncing: boolean) => void;

  // Reset & Cleanup
  reset: () => void;
  clearTestData: () => void;
}

// Default user profile
const defaultUserProfile: UserProfile = {
  companyName: "Ma Micro-Entreprise",
  professionalTitle: "Consultant Indépendant",
  siret: "123 456 789 00012",
  address: "123 Avenue de la République, 75001 Paris",
  email: "contact@mon-entreprise.fr",
  phone: "01 02 03 04 05",
  website: "www.mon-entreprise.fr",
  linkedin: "linkedin.com/in/mon-profil",
  bankAccount: "FR76 1234 5678 9012 3456 7890 123",
  bic: "TRPUFRPPXXX",
  currency: "€",
  invoicePrefix: "FAC-",
  quotePrefix: "DEV-",
  orderPrefix: "COM-",
  creditNotePrefix: "AVO-",
  defaultVatRate: 0,
  logoColor: "#102a43",
  activityType: "SERVICE_BNC",
  isAcreBeneficiary: false,
  vatThresholdAlert: true,
  customVatThresholdPercentage: 80, // Par défaut 80% comme demandé
  revenueThresholdAlert: true,
  customRevenueThresholdPercentage: 90, // Par défaut 90%
  // Productivité & Automatisation (20/04/2026)
  dateFormat: "DD/MM/YYYY",
  autoOpenPdfPreview: false,
  defaultServiceCategory: "SERVICE",
  sidebarFavorites: ["dashboard", "invoices", "clients", "accounting"],
  automation: {
    defaultPaymentDelay: "30_DAYS",
    autoReminders: {
      enabled: false,
      after3Days: true,
      after7Days: true,
    },
  },
};

const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: "1",
    name: "Envoi Facture",
    subject: "Votre facture {{invoice_number}}",
    body: "Bonjour {{client_name}},\n\nVeuillez trouver ci-joint votre facture {{invoice_number}} d'un montant de {{total}}.\n\nCordialement,\n{{company_name}}",
    type: "invoice",
  },
  {
    id: "2",
    name: "Relance Paiement",
    subject: "Relance : Facture {{invoice_number}} impayée",
    body: "Bonjour {{client_name}},\n\nSauf erreur de notre part, le paiement de la facture {{invoice_number}} ne nous est pas parvenu.\n\nMerci de régulariser la situation au plus vite.\n\nCordialement,\n{{company_name}}",
    type: "reminder",
  },
];

export const useDataStore = create<DataStoreState>()(
  devtools((set) => ({
    // Entities
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
    setEmailTemplates: (templates: EmailTemplate[]) =>
      set({ emailTemplates: templates }),
    updateEmailTemplates: (
      updater: (templates: EmailTemplate[]) => EmailTemplate[],
    ) => set((state) => ({ emailTemplates: updater(state.emailTemplates) })),

    calendarEvents: [],
    setCalendarEvents: (events: CalendarEvent[]) =>
      set({ calendarEvents: events }),
    updateCalendarEvents: (
      updater: (events: CalendarEvent[]) => CalendarEvent[],
    ) => set((state) => ({ calendarEvents: updater(state.calendarEvents) })),

    // User Profile
    userProfile: defaultUserProfile,
    setUserProfile: (profile: UserProfile) => set({ userProfile: profile }),
    updateUserProfile: (
      updater: (profile: UserProfile) => Partial<UserProfile>,
    ) =>
      set((state) => ({
        userProfile: { ...state.userProfile, ...updater(state.userProfile) },
      })),

    // Sync State
    isSyncing: true, // By default, assume syncing on init
    setIsSyncing: (isSyncing: boolean) => set({ isSyncing }),

    // Reset & Cleanup
    reset: () =>
      set({
        invoices: [],
        clients: [],
        suppliers: [],
        products: [],
        expenses: [],
        emails: [],
        emailTemplates: defaultEmailTemplates,
        calendarEvents: [],
        userProfile: defaultUserProfile,
      }),

    clearTestData: () =>
      set((state) => ({
        invoices: state.invoices.filter((i) => !i.isTest),
        clients: state.clients.filter((c) => !c.isTest),
        products: state.products.filter((p) => !p.isTest),
      })),
  })),
);

export default useDataStore;
