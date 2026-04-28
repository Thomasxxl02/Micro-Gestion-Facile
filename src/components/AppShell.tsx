/**
 * AppShell — Coquille principale de l'application.
 * Orchestre la sync des données, le routage des vues et la navigation.
 *
 * Architecture modulaire (post-refactoring 2026-04-06) :
 *   - useAppShellSync → synchronisation Firestore
 *   - useViewRouter → routage par vue
 *   - Sidebar → navigation latérale
 */
import { motion } from "motion/react";
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
      className={`flex min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 selection:bg-brand-500/30 overflow-hidden ${reducedMotion ? "reduced-motion" : ""}`}
    >
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Overlay mobile avec flou */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-neutral-950/40 backdrop-blur-md lg:hidden transition-all duration-500"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Container Principal avec scroll géré ici */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative custom-scrollbar scroll-smooth">
        {/* Cercles de lumière subtils en arrière-plan */}
        <div className="fixed top-[-10%] left-[20%] w-[40%] h-[50%] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
        <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[50%] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none animate-float" />

        <div className="container mx-auto px-4 sm:px-8 py-8 lg:py-12 max-w-7xl relative z-10">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1], // Quintic ease-out pour plus de fluidité
            }}
          >
            {viewContent}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;
