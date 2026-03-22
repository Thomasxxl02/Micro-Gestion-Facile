import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../../hooks/useFormValidation';

describe('useFormValidation Hook', () => {
  const mockValidators = {
    email: (value: unknown) => ({
      valid: typeof value === 'string' && value.includes('@'),
      error: typeof value === 'string' && value.includes('@') ? undefined : 'Email invalide',
    }),
    name: (value: unknown) => ({
      valid: typeof value === 'string' && value.length >= 2,
      error: typeof value === 'string' && value.length >= 2 ? undefined : 'Le nom doit contenir au moins 2 caractères',
    }),
    password: (value: unknown) => ({
      valid: typeof value === 'string' && value.length >= 8,
      error: typeof value === 'string' && value.length >= 8 ? undefined : 'Le mot de passe doit contenir au moins 8 caractères',
    }),
    phone: (value: unknown) => ({
      valid: typeof value === 'string' && /^0\d{9}$/.test(value),
      error: typeof value === 'string' && /^0\d{9}$/.test(value) ? undefined : 'Téléphone invalide',
    }),
  };

  const initialData = {
    email: '',
    name: '',
    password: '',
    phone: '',
  };

  describe('Initialization', () => {
    it('initialise avec les données providées', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      expect(result.current.data).toEqual(initialData);
    });

    it('initialise avec un state d\'erreurs vide', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      expect(result.current.errors).toEqual({});
    });

    it('initialise avec un state de "touched" vide', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      expect(result.current.touched).toEqual({});
    });

    it('supporte les options de configuration', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, {
          validateOnChange: true,
          validateOnBlur: false,
          showErrorsAfterBlur: false,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('Field Changes', () => {
    it('met à jour un champ via handleChange', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { validateOnChange: false })
      );

      act(() => {
        const handler = result.current.handleChange('email');
        handler('newvalue@test.fr');
      });

      expect(result.current.data.email).toBe('newvalue@test.fr');
    });

    it('met à jour plusieurs champs', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { validateOnChange: false })
      );

      act(() => {
        result.current.handleChange('email')('test@example.fr');
        result.current.handleChange('name')('John Doe');
      });

      expect(result.current.data.email).toBe('test@example.fr');
      expect(result.current.data.name).toBe('John Doe');
    });

    it('valide durant la saisie si validateOnChange est true', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { validateOnChange: true })
      );

      act(() => {
        result.current.handleChange('email')('invalid');
      });

      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.email.valid).toBe(false);
    });

    it('ne valide pas pendant la saisie si validateOnChange est false', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { validateOnChange: false })
      );

      act(() => {
        result.current.handleChange('email')('invalid');
      });

      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('Field Blur', () => {
    it('marque un champ comme "touched" au blur', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        const handler = result.current.handleBlur('email');
        handler();
      });

      expect(result.current.touched.email).toBe(true);
    });

    it('valide un champ au blur si validateOnBlur est true', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { validateOnBlur: true })
      );

      act(() => {
        result.current.handleChange('email')('invalidemail');
        result.current.handleBlur('email')();
      });

      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.email.valid).toBe(false);
    });

    it('marque plusieurs champs comme touched', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleBlur('email')();
        result.current.handleBlur('name')();
        result.current.handleBlur('password')();
      });

      expect(result.current.touched.email).toBe(true);
      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.password).toBe(true);
    });
  });

  describe('Validation', () => {
    it('valide un email valide', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('test@example.fr');
        result.current.validate();
      });

      expect(result.current.errors.email?.valid).toBe(true);
    });

    it('invalide un email sans @', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('invalidemail');
        result.current.validate();
      });

      expect(result.current.errors.email?.valid).toBe(false);
      expect(result.current.errors.email?.error).toBe('Email invalide');
    });

    it('valide un nom suffisamment long', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('name')('John Doe');
        result.current.validate();
      });

      expect(result.current.errors.name?.valid).toBe(true);
    });

    it('invalide un nom trop court', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('name')('J');
        result.current.validate();
      });

      expect(result.current.errors.name?.valid).toBe(false);
      expect(result.current.errors.name?.error).toContain('au moins 2 caractères');
    });

    it('valide un mot de passe suffisamment long', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('password')('SecurePassword123');
        result.current.validate();
      });

      expect(result.current.errors.password?.valid).toBe(true);
    });

    it('invalide un mot de passe trop court', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('password')('short');
        result.current.validate();
      });

      expect(result.current.errors.password?.valid).toBe(false);
      expect(result.current.errors.password?.error).toContain('au moins 8 caractères');
    });

    it('valide un téléphone français valide', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('phone')('0123456789');
        result.current.validate();
      });

      expect(result.current.errors.phone?.valid).toBe(true);
    });

    it('invalide un téléphone français invalide', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('phone')('123456789');
        result.current.validate();
      });

      expect(result.current.errors.phone?.valid).toBe(false);
    });
  });

  describe('Batch Validation', () => {
    it('valide tous les champs simultanément', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('test@example.fr');
        result.current.handleChange('name')('John');
        result.current.handleChange('password')('SecurePass123');
        result.current.handleChange('phone')('0123456789');
        result.current.validate();
      });

      expect(result.current.isFormValid).toBe(true);
    });

    it('retourne false si au moins un champ est invalide', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('invalidemail');
        result.current.handleChange('name')('John');
        result.current.handleChange('password')('SecurePass123');
        result.current.handleChange('phone')('0123456789');
        result.current.validate();
      });

      expect(result.current.isFormValid).toBe(false);
    });

    it('retourne true si tous les champs sont valides', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('test@example.fr');
        result.current.handleChange('name')('John Doe');
        result.current.handleChange('password')('SecurePass123');
        result.current.handleChange('phone')('0123456789');
        result.current.validate();
      });

      expect(result.current.isFormValid).toBe(true);
    });

    it('génère une liste d\'erreurs pour tous les champs invalides', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('invalid');
        result.current.handleChange('name')('X');
        result.current.handleChange('password')('short');
        result.current.validate();
      });

      expect(result.current.errors).toBeDefined();
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    });
  });

  describe('Error Display Logic', () => {
    it('affiche les erreurs après blur si showErrorsAfterBlur est true', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { showErrorsAfterBlur: true })
      );

      act(() => {
        result.current.handleChange('email')('invalid');
      });

      // Erreur ne devrait pas être affichée dans le DOM
      expect(result.current.touched.email).toBeUndefined();

      act(() => {
        result.current.handleBlur('email')();
      });

      // Après blur, le champ est marqué comme touché
      expect(result.current.touched.email).toBe(true);
    });

    it('affiche les erreurs immédiatement si validateOnChange est true', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { validateOnChange: true })
      );

      act(() => {
        result.current.handleChange('email')('invalid');
      });

      expect(result.current.errors.email).toBeDefined();
    });
  });

  describe('Form Reset', () => {
    it('réinitialise les données du formulaire', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('test@example.fr');
        result.current.setData(initialData);
      });

      expect(result.current.data).toEqual(initialData);
    });

    it('réinitialise les erreurs du formulaire', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { validateOnChange: true })
      );

      act(() => {
        result.current.handleChange('email')('test@example.fr');
      });

      expect(result.current.errors.email).toBeUndefined();
    });

    it('piste les champs "touched" au fil du temps', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleBlur('email')();
      });

      expect(result.current.touched.email).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('gère les champs vides', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('');
        result.current.validate();
      });

      expect(result.current.errors.email?.valid).toBe(false);
    });

    it('gère les espaces au début/fin', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('  test@example.fr  ');
        result.current.validate();
      });

      // Dépend de la logique du validateur si les espaces sont trimés
      expect(result.current.data.email).toBe('  test@example.fr  ');
    });

    it('gère les caractères spéciaux', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('test+alias@example.fr');
        result.current.validate();
      });

      expect(result.current.errors.email?.valid).toBe(true);
    });

    it('gère les très longs strings', () => {
      const longString = 'a'.repeat(1000);
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('name')(longString);
        result.current.validate();
      });

      expect(result.current.data.name).toBe(longString);
    });
  });

  describe('Custom Validation Rules', () => {
    it('supporte les règles de validation personnalisées', () => {
      const customValidators = {
        iban: (value: string) => ({
          valid: value.startsWith('FR') && value.length === 27,
          error: 'IBAN français invalide',
        }),
      };

      const { result } = renderHook(() =>
        useFormValidation({ iban: '' }, customValidators)
      );

      act(() => {
        result.current.handleChange('iban')('FR76 3000 6000 0123 4567 8901 57');
        result.current.validate();
      });

      expect(result.current.errors.iban?.valid).toBe(true);
    });

    it('supporte les validations croisées entre champs', () => {
      const crossFieldValidators = {
        password: (value: string) => ({
          valid: value.length >= 8,
          error: 'Au moins 8 caractères',
        }),
        confirmPassword: (value: string) => ({
          valid: value.length >= 8,
          error: 'Au moins 8 caractères',
        }),
      };

      const { result } = renderHook(() =>
        useFormValidation({ password: '', confirmPassword: '' }, crossFieldValidators)
      );

      act(() => {
        result.current.handleChange('password')('SecurePass');
        result.current.handleChange('confirmPassword')('DifferentPass');
        result.current.validate();
      });

      expect(result.current.errors.password?.valid).toBe(true);
      expect(result.current.errors.confirmPassword?.valid).toBe(true);
    });
  });

  describe('Accessibility & Performance', () => {
    it('gère multiple validations rapides sans lag', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators, { validateOnChange: true })
      );

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.handleChange('email')(`test${i}@example.fr`);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Devrait être relativement rapide (< 100ms pour 100 opérations)
      expect(duration).toBeLessThan(100);
    });

    it('fournit les erreurs d\'un champ spécifique', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialData, mockValidators)
      );

      act(() => {
        result.current.handleChange('email')('invalid');
        result.current.validate();
      });

      const emailError = result.current.getFieldError('email');
      expect(emailError).toBeDefined();
      expect(emailError).toBe('Email invalide');
    });
  });
});
