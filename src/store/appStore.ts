/**
 * appStore.ts - REFACTORING PHASE 2.2
 * GOAL: Split monolithic store into 4 domain stores
 * STATUS: ✅ Domain stores created, now synchronizing
 *
 * BEFORE: appStore (monolith) → everything
 * AFTER (this phase):
 *   ✅ useAuthStore → user, isAuthReady
 *   ✅ useUIStore → currentView, isDarkMode, isMobileMenuOpen
 *   ✅ useDataStore → invoices, clients, etc.
 *   ✅ useLogStore → logs
 *   🔄 useAppStore → facade combining all 4 (optional, for migration)
 *
 * PERFORMANCE BENEFIT:
 * - Dashboard rerender on invoices change: YES
 * - Dashboard rerender on isDarkMode change: NO (uses separate store!)
 *
 * MIGRATION: This is a temporary facade for backward compatibility.
 * New components should import specific stores directly.
 */

import type { User } from "firebase/auth";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  CalendarEvent,
  Client,
  Email,
  EmailTemplate,
  Expense,
  Invoice,
  LogEntry,
  Product,
  Supplier,
  UserProfile,
  ViewState,
} from "../types";
import { useAuthStore } from "./useAuthStore";
import { useDataStore } from "./useDataStore";
import { useLogStore } from "./useLogStore";
import { useUIStore } from "./useUIStore";

/**
 * @deprecated Use individual stores instead
 * This is a temporary facade for migration. Use:
 * - useAuthStore() for user
 * - useUIStore() for navigation
 * - useDataStore() for entities
 * - useLogStore() for logs
 */
export interface AppStoreState {
  // UI
  currentView: ViewState;
  setCurrentView: (_view: ViewState) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (_open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (_isDark: boolean) => void;
  fontSize: number;
  setFontSize: (_size: number) => void;

  // Auth
  user: User | null;
  setUser: (_user: User | null) => void;
  isAuthReady: boolean;
  setIsAuthReady: (_ready: boolean) => void;

  // Data
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
  userProfile: UserProfile;
  setUserProfile: (_profile: UserProfile) => void;
  updateUserProfile: (
    _updater: (_profile: UserProfile) => Partial<UserProfile>,
  ) => void;

  // Sync
  isSyncing: boolean;
  setIsSyncing: (_isSyncing: boolean) => void;

  // Logs
  activityLogs: LogEntry[];
  addLog: (
    _action: string,
    _category: LogEntry["category"],
    _severity: LogEntry["severity"],
    _details?: string,
  ) => void;
  clearLogs: () => void;

  // Utils
  reset: () => void;
  clearTestData: () => void;
}

/**
 * TEMPORARY FACADE STORE for backward compatibility
 *
 * ⚠️ THIS STORE WILL BE REMOVED - Do not add new functions here!
 * New code should use individual stores directly.
 *
 * This store synchronizes with the 4 domain stores every call.
 * While functional, it's less optimized than using domain stores directly.
 */
export const useAppStore = create<AppStoreState>()(
  subscribeWithSelector(() => {
    // Read current state from all domain stores
    const getFullState = (): AppStoreState => ({
      // UI
      currentView: useUIStore.getState().currentView,
      setCurrentView: (view) => useUIStore.getState().setCurrentView(view),
      isMobileMenuOpen: useUIStore.getState().isMobileMenuOpen,
      setIsMobileMenuOpen: (open) =>
        useUIStore.getState().setIsMobileMenuOpen(open),
      isDarkMode: useUIStore.getState().isDarkMode,
      setIsDarkMode: (isDark) => useUIStore.getState().setIsDarkMode(isDark),
      fontSize: useUIStore.getState().fontSize,
      setFontSize: (size) => useUIStore.getState().setFontSize(size),

      // Auth
      user: useAuthStore.getState().user,
      setUser: (user) => useAuthStore.getState().setUser(user),
      isAuthReady: useAuthStore.getState().isAuthReady,
      setIsAuthReady: (ready) => useAuthStore.getState().setIsAuthReady(ready),

      // Data
      invoices: useDataStore.getState().invoices,
      setInvoices: (invoices) => useDataStore.getState().setInvoices(invoices),
      updateInvoices: (updater) =>
        useDataStore.getState().updateInvoices(updater),
      clients: useDataStore.getState().clients,
      setClients: (clients) => useDataStore.getState().setClients(clients),
      updateClients: (updater) =>
        useDataStore.getState().updateClients(updater),
      suppliers: useDataStore.getState().suppliers,
      setSuppliers: (suppliers) =>
        useDataStore.getState().setSuppliers(suppliers),
      updateSuppliers: (updater) =>
        useDataStore.getState().updateSuppliers(updater),
      products: useDataStore.getState().products,
      setProducts: (products) => useDataStore.getState().setProducts(products),
      updateProducts: (updater) =>
        useDataStore.getState().updateProducts(updater),
      expenses: useDataStore.getState().expenses,
      setExpenses: (expenses) => useDataStore.getState().setExpenses(expenses),
      updateExpenses: (updater) =>
        useDataStore.getState().updateExpenses(updater),
      emails: useDataStore.getState().emails,
      setEmails: (emails) => useDataStore.getState().setEmails(emails),
      updateEmails: (updater) => useDataStore.getState().updateEmails(updater),
      emailTemplates: useDataStore.getState().emailTemplates,
      setEmailTemplates: (templates) =>
        useDataStore.getState().setEmailTemplates(templates),
      updateEmailTemplates: (updater) =>
        useDataStore.getState().updateEmailTemplates(updater),
      calendarEvents: useDataStore.getState().calendarEvents,
      setCalendarEvents: (events) =>
        useDataStore.getState().setCalendarEvents(events),
      updateCalendarEvents: (updater) =>
        useDataStore.getState().updateCalendarEvents(updater),
      userProfile: useDataStore.getState().userProfile,
      setUserProfile: (profile) =>
        useDataStore.getState().setUserProfile(profile),
      updateUserProfile: (updater) =>
        useDataStore.getState().updateUserProfile(updater),

      // Sync
      isSyncing: useDataStore.getState().isSyncing,
      setIsSyncing: (isSyncing) =>
        useDataStore.getState().setIsSyncing(isSyncing),

      // Logs
      activityLogs: useLogStore.getState().activityLogs,
      addLog: (action, category, severity, details) =>
        useLogStore.getState().addLog(action, category, severity, details),
      clearLogs: () => useLogStore.getState().clearLogs(),

      // Utils
      reset: () => {
        useAuthStore.getState().reset();
        useUIStore.getState().reset();
        useDataStore.getState().reset();
        useLogStore.getState().reset();
      },
      clearTestData: () => useDataStore.getState().clearTestData(),
    });

    return getFullState();
  }),
);

// Re-export individual stores for preferred usage
export { useAuthStore } from "./useAuthStore";
export { useDataStore } from "./useDataStore";
export { useLogStore } from "./useLogStore";
export { useUIStore } from "./useUIStore";

// Keep facade in sync with domain stores (needed for getState() to reflect mutations)
useUIStore.subscribe((ui) => {
  useAppStore.setState({
    currentView: ui.currentView,
    isDarkMode: ui.isDarkMode,
    isMobileMenuOpen: ui.isMobileMenuOpen,
    fontSize: ui.fontSize,
  });
});

useAuthStore.subscribe((auth) => {
  useAppStore.setState({
    user: auth.user,
    isAuthReady: auth.isAuthReady,
  });
});

useDataStore.subscribe((data) => {
  useAppStore.setState({
    invoices: data.invoices,
    clients: data.clients,
    suppliers: data.suppliers,
    products: data.products,
    expenses: data.expenses,
    emails: data.emails,
    emailTemplates: data.emailTemplates,
    calendarEvents: data.calendarEvents,
    userProfile: data.userProfile,
    isSyncing: data.isSyncing,
  });
});

useLogStore.subscribe((log) => {
  useAppStore.setState({
    activityLogs: log.activityLogs,
  });
});

export default useAppStore;
