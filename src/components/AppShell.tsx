/**
 * AppShell — Coquille principale de l'application.
 * Orchestre la sync des données, le routage des vues et la navigation.
 *
 * Architecture modulaire (post-refactoring 2026-04-06) :
 *   - useAppShellSync → synchronisation Firestore
 *   - useViewRouter → routage par vue
 *   - Sidebar → navigation latérale
 */
import React from "react";
import { useAppShellSync } from "../hooks/useAppShellSync";
import { useViewRouter, type ViewType } from "../hooks/useViewRouter";
import { useAppStore } from "../store/appStore";
import { useUIStore } from "../store/useUIStore";
import Sidebar from "./Sidebar";

const AppShell: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const {
    currentView,
    setCurrentView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isDarkMode,
    setIsDarkMode,
    reducedMotion,
  } = useUIStore();

  const syncData = useAppShellSync(user?.uid ?? "");

  const handleNavigate = (view: ViewType) =>
    setCurrentView(view as Parameters<typeof setCurrentView>[0]);

  const viewContent = useViewRouter({
    currentView: currentView as ViewType,
    syncData,
    onNavigate: handleNavigate,
  });

  return (
    <div
      className={`flex min-h-screen bg-gray-50 dark:bg-brand-950 text-brand-900 dark:text-brand-50 ${reducedMotion ? "reduced-motion" : ""}`}
    >
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {viewContent}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
