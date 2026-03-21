import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/appStore';
import { LogEntry } from '../types';

describe('appStore', () => {
  beforeEach(() => {
    // Reset le store avant chaque test
    const { reset } = useAppStore.getState();
    reset();
  });

  it('devrait avoir un état initial correct', () => {
    const state = useAppStore.getState();
    expect(state.currentView).toBe('dashboard');
    expect(state.isDarkMode).toBe(false);
    expect(state.invoices).toEqual([]);
    expect(state.userProfile.companyName).toBe('Ma Micro-Entreprise');
  });

  it('devrait mettre à jour la vue courante', () => {
    const { setCurrentView } = useAppStore.getState();
    setCurrentView('invoices');
    expect(useAppStore.getState().currentView).toBe('invoices');
  });

  it('devrait gérer le mode sombre', () => {
    const { setIsDarkMode } = useAppStore.getState();
    setIsDarkMode(true);
    expect(useAppStore.getState().isDarkMode).toBe(true);
  });

  it('devrait mettre à jour les factures', () => {
    const { setInvoices, updateInvoices } = useAppStore.getState();
    const mockInvoice = {
      id: '1',
      number: 'FAC-001',
      type: 'invoice' as const,
      clientId: 'client-1',
      items: [],
      total: 100,
      status: 'paid' as const,
      date: '2026-03-20',
      dueDate: '2026-04-20'
    };

    setInvoices([mockInvoice]);
    expect(useAppStore.getState().invoices).toHaveLength(1);

    updateInvoices((prev) => [...prev, { ...mockInvoice, id: '2' }]);
    expect(useAppStore.getState().invoices).toHaveLength(2);
  });

  it('devrait ajouter et vider les logs d activité', () => {
    const { addLog, clearLogs } = useAppStore.getState();

    addLog('Test Action', 'SYSTEM', 'INFO', 'Détails du test');

    const logs = useAppStore.getState().activityLogs;
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('Test Action');
    expect(logs[0].category).toBe('SYSTEM');
    expect(logs[0].severity).toBe('INFO');
    expect(logs[0].details).toBe('Détails du test');
    expect(logs[0].timestamp).toBeDefined();

    clearLogs();
    expect(useAppStore.getState().activityLogs).toHaveLength(0);
  });

  it('devrait réinitialiser le store (sauf isDarkMode qui n est pas dans reset)', () => {
    const { setCurrentView, setIsDarkMode, reset } = useAppStore.getState();

    setCurrentView('clients');
    setIsDarkMode(true);

    reset();

    const state = useAppStore.getState();
    expect(state.currentView).toBe('dashboard');
    // Note: Dans l'implémentation actuelle, reset() ne remet pas isDarkMode à false
    expect(state.isDarkMode).toBe(true);
  });

  it('devrait tester tous les setters et updaters', () => {
    const {
      setIsMobileMenuOpen,
      setUser,
      setIsAuthReady,
      setClients, updateClients,
      setSuppliers, updateSuppliers,
      setProducts, updateProducts,
      setExpenses, updateExpenses,
      setEmails, updateEmails,
      setEmailTemplates, updateEmailTemplates,
      setCalendarEvents, updateCalendarEvents,
      setUserProfile
    } = useAppStore.getState();

    // UI
    setIsMobileMenuOpen(true);
    expect(useAppStore.getState().isMobileMenuOpen).toBe(true);

    // Auth
    const mockUser = { uid: '123' } as any;
    setUser(mockUser);
    expect(useAppStore.getState().user?.uid).toBe('123');
    setIsAuthReady(true);
    expect(useAppStore.getState().isAuthReady).toBe(true);

    // Clients
    setClients([{ id: 'c1', name: 'C1' } as any]);
    updateClients(prev => [...prev, { id: 'c2', name: 'C2' } as any]);
    expect(useAppStore.getState().clients).toHaveLength(2);

    // Suppliers
    setSuppliers([{ id: 's1', name: 'S1' } as any]);
    updateSuppliers(prev => [...prev, { id: 's2', name: 'S2' } as any]);
    expect(useAppStore.getState().suppliers).toHaveLength(2);

    // Products
    setProducts([{ id: 'p1', name: 'P1' } as any]);
    updateProducts(prev => [...prev, { id: 'p2', name: 'P2' } as any]);
    expect(useAppStore.getState().products).toHaveLength(2);

    // Expenses
    setExpenses([{ id: 'e1', amount: 10 } as any]);
    updateExpenses(prev => [...prev, { id: 'e2', amount: 20 } as any]);
    expect(useAppStore.getState().expenses).toHaveLength(2);

    // Emails
    setEmails([{ id: 'em1', subject: 'E1' } as any]);
    updateEmails(prev => [...prev, { id: 'em2', subject: 'E2' } as any]);
    expect(useAppStore.getState().emails).toHaveLength(2);

    // Templates
    setEmailTemplates([{ id: 't1', name: 'T1' } as any]);
    updateEmailTemplates(prev => [...prev, { id: 't2', name: 'T2' } as any]);
    expect(useAppStore.getState().emailTemplates).toHaveLength(2);

    // Calendar
    setCalendarEvents([{ id: 'ev1', title: 'EV1' } as any]);
    updateCalendarEvents(prev => [...prev, { id: 'ev2', title: 'EV2' } as any]);
    expect(useAppStore.getState().calendarEvents).toHaveLength(2);

    // Profile
    setUserProfile({ companyName: 'Static' } as any);
    expect(useAppStore.getState().userProfile.companyName).toBe('Static');
  });

  it('devrait supprimer les données de test', () => {
    const { setInvoices, setClients, clearTestData } = useAppStore.getState();

    setInvoices([
      { id: '1', isTest: true } as any,
      { id: '2', isTest: false } as any
    ]);
    setClients([
      { id: 'c1', isTest: true } as any,
      { id: 'c2', isTest: false } as any
    ]);

    clearTestData();

    expect(useAppStore.getState().invoices).toHaveLength(1);
    expect(useAppStore.getState().clients).toHaveLength(1);
  });
});
