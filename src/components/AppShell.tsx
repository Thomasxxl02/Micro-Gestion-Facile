import React from 'react';
import { useAppShellSync } from '../hooks/useAppShellSync';
import { useMobileGestures } from '../hooks/useMobileGestures';
import { useViewRouter } from '../hooks/useViewRouter';
import { useAppStore } from '../store/appStore';
import { AppShellHeader } from './AppShellHeader';
import { AppShellLayout } from './AppShellLayout';
import PWAUpdatePrompt from './PWAUpdatePrompt';

/**
 * AppShell refactorisé - Shell de l'application authentifiée
 *
 * ARCHITECTURE MODULAIRE :
 * ✓ useAppShellSync()       → Gère sync Firestore + Zustand (replaces 250+ lignes)
 * ✓ useMobileGestures()     → Gères gestes tactiles (replaces 80 lignes)
 * ✓ useViewRouter()         → Orchestre le rendu des vues (replaces 140 lignes)
 * ✓ AppShellLayout          → Layout Sidebar + Main
 * ✓ AppShellHeader          → Headers mobile + desktop
 *
 * Résultat : ~80 lignes au lieu de 600+ ✨
 */

const AppShell: React.FC = () => {
  // ─── GLOBAL STATE ───
  const {
    currentView,
    setCurrentView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isDarkMode,
    setIsDarkMode,
    user,
  } = useAppStore();

  // ─── SYNCHRONISATION CENTRALISÉE (8 collections + userProfile) ───
  const syncData = useAppShellSync(user?.uid || '');

  // ─── GESTES TACTILES ───
  useMobileGestures({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  });

  // ─── ROUTING DES VUES ───
  const viewContent = useViewRouter({
    currentView,
    syncData,
    onNavigate: setCurrentView,
  });

  // ─── RENDU ───
  return (
    <>
      <AppShellLayout
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      >
        {/* Header mobile + desktop */}
        <AppShellHeader
          user={user}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={setIsMobileMenuOpen}
        />

        {/* Contenu principal (injecté par useViewRouter) */}
        <div className="p-4 lg:p-8 xl:p-12 animate-slide-up">{viewContent}</div>
      </AppShellLayout>

      {/* PWA Update Prompt */}
      <PWAUpdatePrompt />
    </>
  );
};

export default AppShell;
