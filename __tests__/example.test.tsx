import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Exemple de test pour un composant React
 * Ce fichier montre les patterns de base pour tester avec Vitest et Testing Library
 */

// Exemple de composant simple à tester
const Button = ({ onClick, children }: { onClick: () => void; children: string }) => (
  <button onClick={onClick}>{children}</button>
);

describe('Button Component', () => {
  it('devrait afficher le texte du bouton', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Cliquer ici</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Cliquer ici');
  });

  it('devrait appeler la fonction onClick quand on clique', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Cliquer</Button>);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledOnce();
  });
});

/**
 * Exemple de test pour une fonction utilitaire
 */
const calculateSum = (a: number, b: number): number => a + b;

describe('calculateSum', () => {
  it('devrait retourner la somme de deux nombres', () => {
    expect(calculateSum(2, 3)).toBe(5);
  });

  it('devrait gérer les nombres négatifs', () => {
    expect(calculateSum(-2, 3)).toBe(1);
  });

  it('devrait retourner 0 pour deux zéros', () => {
    expect(calculateSum(0, 0)).toBe(0);
  });
});
