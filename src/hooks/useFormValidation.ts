/**
 * useFormValidation — Hook générique de validation de formulaire.
 * Compatible avec les règles générées par schemaToRules (lib/zod-schemas.ts).
 */
import { useCallback, useState } from 'react';
import type { ValidationResult, ValidationRule } from '../lib/zod-schemas';

export type FormValidationRules<T> = Partial<Record<keyof T, ValidationRule[]>>;

export interface UseFormValidationOptions {
  validateOnChange?: boolean;
}

function applyRules(value: unknown, rules: ValidationRule[]): ValidationResult | undefined {
  for (const rule of rules) {
    const result = rule(value);
    if (result === false) return { valid: false, error: 'Valeur invalide.' };
    if (result === true) continue;
    if (!result.valid) return result;
  }
  return undefined; // pas d'erreur
}

export function useFormValidation<T extends object>(
  initialData: T,
  rules: Record<string, ValidationRule[]> = {},
  _options?: UseFormValidationOptions,
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, ValidationResult | undefined>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  /** handleChange currifié : handleChange('field')(value) */
  const handleChange = useCallback(
    (field: keyof T) =>
      (value: unknown) => {
        setData((prev) => ({ ...prev, [field]: value }));
        setTouched((prev) => ({ ...prev, [field]: true }));

        const fieldRules = rules[field as string];
        if (fieldRules) {
          const result = applyRules(value, fieldRules);
          setErrors((prev) => ({ ...prev, [field]: result }));
        }
      },
    [rules],
  );

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, ValidationResult | undefined>> = {};
    let isValid = true;

    for (const field of Object.keys(rules) as Array<keyof T>) {
      const fieldRules = rules[field as string];
      if (!fieldRules) continue;
      const result = applyRules((data as Record<string, unknown>)[field as string], fieldRules);
      newErrors[field] = result;
      if (result && !result.valid) isValid = false;
    }

    setErrors(newErrors);
    setTouched(
      Object.keys(rules).reduce(
        (acc, k) => ({ ...acc, [k]: true }),
        {} as Partial<Record<keyof T, boolean>>,
      ),
    );
    return isValid;
  }, [data, rules]);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  return { data, setData, errors, touched, handleChange, validate, reset };
}
