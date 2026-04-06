/**
 * Hook personnalisé pour gérer la validation de formulaires
 * Supporte validation en temps réel, validation au blur, batch validation
 */

import { useCallback, useMemo, useState } from 'react';
import {
  areAllValid,
  isValid,
  validateBatch,
  type BatchValidationRules,
  type ValidationResult,
} from '../lib/zod-schemas';

export type { BatchValidationRules };

interface UseFormValidationOptions {
  validateOnBlur?: boolean; // Valider quand on quitte le champ
  validateOnChange?: boolean; // Valider pendant qu'on tape
  showErrorsAfterBlur?: boolean; // Afficher erreurs seulement après blur
}

/**
 * Hook pour la validation de formulaires avec support temps réel
 *
 * Usage:
 * ```tsx
 * const { errors, handleChange, handleBlur, validate } = useFormValidation(
 *   { name: '', email: '' },
 *   {
 *     name: validateName,
 *     email: validateEmail,
 *   },
 *   { validateOnChange: true, showErrorsAfterBlur: false }
 * );
 * ```
 */
export function useFormValidation<T extends object = object>(
  initialData: T,
  rules: BatchValidationRules,
  options: UseFormValidationOptions = {}
) {
  const { validateOnBlur = true, validateOnChange = true, showErrorsAfterBlur = false } = options;

  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, ValidationResult>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Valider un champ spécifique
  const validateField = useCallback(
    (fieldName: keyof T, value: unknown): ValidationResult | null => {
      const rule = rules[fieldName as string];
      if (!rule) {
        return null;
      }

      const result = rule(value as string | number);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: result,
      }));

      return result;
    },
    [rules]
  );

  // Handler pour onchange
  const handleChange = useCallback(
    (fieldName: keyof T) => (value: unknown) => {
      setData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));

      if (validateOnChange) {
        validateField(fieldName, value);
      }
    },
    [validateOnChange, validateField]
  );

  // Handler pour onblur
  const handleBlur = useCallback(
    (fieldName: keyof T) => () => {
      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }));

      if (validateOnBlur) {
        validateField(fieldName, data[fieldName]);
      }
    },
    [validateOnBlur, data, validateField]
  );

  // Valider tous les champs
  const validate = useCallback((): boolean => {
    const results = validateBatch(
      data as Record<string, unknown>,
      rules as Record<string, (value: unknown) => ValidationResult>
    );
    setErrors(results);
    setTouched(
      Object.keys(results).reduce(
        (acc, key) => {
          acc[key] = true;
          return acc;
        },
        {} as Record<string, boolean>
      )
    );
    return areAllValid(results);
  }, [data, rules]);

  // Erreurs à afficher (optionnellement après blur)
  const displayErrors = useMemo(() => {
    if (!showErrorsAfterBlur) {
      return errors;
    }

    const filtered: Record<string, ValidationResult> = {};
    for (const [fieldName, error] of Object.entries(errors)) {
      if (touched[fieldName]) {
        filtered[fieldName] = error;
      }
    }
    return filtered;
  }, [errors, touched, showErrorsAfterBlur]);

  // Est-ce que le formulaire est valide ?
  const isFormValid = useMemo(() => areAllValid(displayErrors), [displayErrors]);

  return {
    data: data as T,
    setData,
    errors: displayErrors,
    touched,
    handleChange,
    handleBlur,
    validate,
    isFormValid,
    getFieldError: (fieldName: keyof T) => displayErrors[fieldName as string]?.error,
    getFieldValid: (fieldName: keyof T) => {
      const error = displayErrors[fieldName as string];
      return error ? !error.valid : true;
    },
  };
}

/**
 * Hook simple pour valider un seul champ sans état global
 */
export function useFieldValidation(
  value: unknown,
  validator: (value: unknown) => ValidationResult,
  options: { validateOnChange?: boolean } = {}
) {
  const [error, setError] = useState<ValidationResult | null>(null);
  const { validateOnChange = true } = options;

  const validate = useCallback(() => {
    const result = validator(value);
    setError(result);
    return isValid(result);
  }, [value, validator]);

  const handleChange = useCallback(
    (newValue: unknown) => {
      if (validateOnChange) {
        const result = validator(newValue);
        setError(result);
      }
    },
    [validator, validateOnChange]
  );

  return {
    error,
    validate,
    handleChange,
    isValid: error ? error.valid : true,
  };
}
