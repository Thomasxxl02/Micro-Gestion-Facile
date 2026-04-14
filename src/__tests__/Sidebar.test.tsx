import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from '../components/Sidebar';
import { ViewState } from '../types';

// Mock framer-motion car il cause des problèmes dans JSDOM
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>
        {children}
      </span>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useNetworkStatus pour contrôler l'état offline dans les tests
vi.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOffline: false }),
}));

describe('Sidebar', () => {
  const defaultProps = {
    currentView: 'dashboard' as ViewState,
    setView: vi.fn(),
    isMobileMenuOpen: false,
    setIsMobileMenuOpen: vi.fn(),
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
  };

  it('affiche tous les éléments du menu', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
    expect(screen.getByText(/Devis & Factures/i)).toBeInTheDocument();
    expect(screen.getByText(/Agenda/i)).toBeInTheDocument();
    expect(screen.getByText(/Clients/i)).toBeInTheDocument();
    expect(screen.getByText(/Fournisseurs/i)).toBeInTheDocument();
    expect(screen.getByText(/Catalogue/i)).toBeInTheDocument();
    expect(screen.getByText(/Comptabilité/i)).toBeInTheDocument();
    expect(screen.getByText(/Emails/i)).toBeInTheDocument();
    expect(screen.getByText(/Assistant IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Paramètres/i)).toBeInTheDocument();
  });

  it('appelle setView lors du clic sur un élément du menu', () => {
    render(<Sidebar {...defaultProps} />);

    const invoicesButton = screen.getByText(/Devis & Factures/i).closest('button');
    if (invoicesButton) {
      fireEvent.click(invoicesButton);
    }

    expect(defaultProps.setView).toHaveBeenCalledWith('invoices');
  });

  it("affiche l'état actif sur la vue courante", () => {
    render(<Sidebar {...defaultProps} currentView="invoices" />);

    const invoicesButton = screen.getByText(/Devis & Factures/i).closest('button');
    expect(invoicesButton).toHaveAttribute('aria-current', 'page');

    const dashboardButton = screen.getByText(/Tableau de bord/i).closest('button');
    expect(dashboardButton).not.toHaveAttribute('aria-current', 'page');
  });

  it('appelle setIsMobileMenuOpen(false) lors du clic sur mobile', () => {
    const setView = vi.fn();
    const setIsMobileMenuOpen = vi.fn();

    render(
      <Sidebar
        {...defaultProps}
        setView={setView}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isMobileMenuOpen={true}
      />
    );

    // Le bouton overlay mobile
    const overlay = screen.getByLabelText(/Fermer le menu/i);
    fireEvent.click(overlay);

    expect(setIsMobileMenuOpen).toHaveBeenCalledWith(false);
  });
});
