/**
 * Composant AppShellHeader
 * Responsabilités :
 * - Header mobile (Menu button, Dark mode toggle)
 * - Header desktop (User info, Logout, Dark mode toggle)
 *
 * Props minimalistes : juste l'état nécessaire
 */

import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import React from 'react';
import { logout } from '../firebase';

interface AppShellHeaderProps {
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: (open: boolean) => void;
}

export const AppShellHeader: React.FC<AppShellHeaderProps> = ({
  user,
  isDarkMode,
  toggleDarkMode,
  isMobileMenuOpen: _isMobileMenuOpen,
  onMobileMenuToggle,
}) => {
  return (
    <>
      {/* HEADER MOBILE */}
      <div className="lg:hidden flex justify-between items-center sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-30 py-4 px-4 border-b border-brand-200/50 dark:border-brand-800/60">
        <h1 className="text-xl font-bold text-brand-900 dark:text-white tracking-tight">
          Micro Gestion
        </h1>
        <div className="flex gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2.5 bg-white dark:bg-brand-800 rounded-xl shadow-sm border border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-200 hover:bg-brand-50 dark:hover:bg-brand-700 transition-colors"
            title="Changer de thème"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-primary-600" />
            )}
          </button>
          <button
            onClick={() => onMobileMenuToggle(true)}
            className="p-2.5 bg-brand-900 dark:bg-primary-600 text-white rounded-xl shadow-lg hover:bg-brand-800 dark:hover:bg-primary-700 transition-all active:scale-90"
            title="Ouvrir le menu"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* HEADER DESKTOP */}
      <div className="hidden lg:flex justify-end items-center gap-6 sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-20 py-6 px-8 border-b border-brand-100/50 dark:border-brand-700/50">
        <div className="flex items-center gap-4 px-4 py-2 bg-white/80 dark:bg-brand-800/60 backdrop-blur-sm rounded-2xl border border-brand-100 dark:border-brand-700/60 shadow-sm">
          {/* USER INFO */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-brand-400 dark:text-brand-500 uppercase tracking-wider">
              Connecté en tant que
            </span>
            <span className="text-sm font-bold text-brand-900 dark:text-brand-100">
              {user?.displayName || user?.email}
            </span>
          </div>

          {/* AVATAR */}
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-800 flex items-center justify-center overflow-hidden border border-brand-200 dark:border-brand-700">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="User avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-brand-600 dark:text-brand-200 font-bold">
                {user?.email?.[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* DIVIDER */}
          <div className="w-px h-8 bg-brand-200 dark:bg-brand-800 mx-1" />

          {/* DARK MODE TOGGLE */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-brand-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors hover:bg-yellow-50 dark:hover:bg-amber-900/20 rounded-xl"
            title="Changer de thème"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun size={20} className="text-amber-400" />
            ) : (
              <Moon size={20} className="text-primary-600" />
            )}
          </button>

          {/* LOGOUT */}
          <button
            onClick={logout}
            className="p-2 text-brand-400 hover:text-red-500 dark:hover:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
            title="Déconnexion"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </>
  );
};
