import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuarterlyStats } from '../../../components/accounting/QuarterlyStats';
import '@testing-library/jest-dom';

describe('QuarterlyStats', () => {
  const mockQuarterlyStats = [
    { name: 'T1', income: 1000, expense: 200 },
    { name: 'T2', income: 2000, expense: 500 },
    { name: 'T3', income: 1500, expense: 300 },
    { name: 'T4', income: 3000, expense: 1000 },
  ];
  const taxRate = 21.1;

  it('affiche correctement les titres des trimestres', () => {
    render(<QuarterlyStats quarterlyStats={mockQuarterlyStats} taxRate={taxRate} />);
    expect(screen.getByText('T1')).toBeInTheDocument();
    expect(screen.getByText('T2')).toBeInTheDocument();
  });

  it('affiche correctement les montants formattés', () => {
    render(<QuarterlyStats quarterlyStats={mockQuarterlyStats} taxRate={taxRate} />);
    // On vérifie la présence du montant brut (le formateur semble utiliser des espaces insécables)
    expect(screen.getAllByText(/1\s?000\s?€/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/200\s?€/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/800\s?€/).length).toBeGreaterThan(0); // Profit T1
  });

  it('calcule et affiche les cotisations estimées', () => {
    render(<QuarterlyStats quarterlyStats={mockQuarterlyStats} taxRate={taxRate} />);
    // T1: 1000 * 0.211 = 211
    expect(screen.getByText(/211\s?€/)).toBeInTheDocument();
  });
});
