/**
 * Composant AppShellLayout
 * Responsabilités :
 * - Rendre la structure Sidebar + main
 * - Gérer l'état du menu mobile
 *
 * Props minimalistes : juste ce qui est nécessaire pour le layout
 */

import React from 'react';
import Sidebar from './Sidebar';

export type ViewType =
  | 'dashboard'
  | 'invoices'
  | 'clients'
  | 'suppliers'
  | 'products'
  | 'accounting'
  | 'emails'
  | 'calendar'
  | 'settings'
  | 'ai_assistant'
  | 'bank_reconciliation'
  | 'vat_dashboard';

interface AppShellLayoutProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  children: React.ReactNode; // Le contenu de la vue courante
}

export const AppShellLayout: React.FC<AppShellLayoutProps> = ({
  currentView,
  setCurrentView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isDarkMode,
  toggleDarkMode,
  children,
}) => {
  return (
    <div className="flex min-h-screen font-sans text-brand-900 dark:text-(--text-main) selection:bg-brand-100 dark:selection:bg-brand-900/40 selection:text-brand-900 dark:selection:text-white transition-colors duration-500">
      {/* SIDEBAR */}
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-64 overflow-x-hidden">{children}</main>
    </div>
  );
};
