import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextAreaField, SelectField, ToggleSwitch } from '../components/FormFields';
import React from 'react';

describe('FormFields Extra', () => {
  describe('TextAreaField', () => {
    it('devrait rendre correctement avec label et valeur', () => {
      const onChange = vi.fn();
      render(
        <TextAreaField 
          label='Commentaires' 
          value='Test content' 
          onChange={onChange} 
        />
      );
      
      const textarea = screen.getByLabelText(/Commentaires/i) as HTMLTextAreaElement;
      expect(textarea.value).toBe('Test content');
      
      fireEvent.change(textarea, { target: { value: 'New content' } });
      expect(onChange).toHaveBeenCalledWith('New content');
    });

    it('devrait afficher la description et l erreur', () => {
      render(
        <TextAreaField 
          label='Notes' 
          value='' 
          onChange={() => {}} 
          description='Une petite aide'
          error='Ce champ est obligatoire'
        />
      );
      
      expect(screen.getByText(/Une petite aide/i)).toBeTruthy();
      expect(screen.getByText(/Ce champ est obligatoire/i)).toBeTruthy();
    });
  });

  describe('SelectField', () => {
    it('devrait rendre les options et gérer le changement', () => {
      const onChange = vi.fn();
      const options = [
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ];
      
      render(
        <SelectField 
          label='Choix' 
          value='a' 
          options={options} 
          onChange={onChange} 
        />
      );
      
      const select = screen.getByLabelText(/Choix/i) as HTMLSelectElement;
      expect(select.value).toBe('a');
      
      fireEvent.change(select, { target: { value: 'b' } });
      expect(onChange).toHaveBeenCalledWith('b');
    });
  });

  describe('ToggleSwitch', () => {
    it('devrait changer d etat au clic', () => {
      const onChange = vi.fn();
      render(
        <ToggleSwitch 
          label='Activer' 
          checked={false} 
          onChange={onChange} 
        />
      );
      
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });
});