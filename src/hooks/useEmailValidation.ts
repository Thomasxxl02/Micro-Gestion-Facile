import { useCallback, useState } from 'react';

// List of disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'maildrop.cc',
  'temp-mail.org',
  'throwaway.email',
  'mailinator.com',
]);

export interface EmailValidationState {
  email: string;
  isValid: boolean;
  isValidating: boolean;
  error: string | null;
  warning: string | null;
}

export function useEmailValidation(initialEmail = '') {
  const [email, setEmail] = useState(initialEmail);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validateEmail = useCallback((value: string) => {
    setEmail(value);
    setError(null);
    setWarning(null);

    // 1. Check if email is empty
    if (!value) {
      setIsValid(false);
      return;
    }

    // 2. Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setError("Format d'email invalide");
      setIsValid(false);
      return;
    }

    // 3. Check for disposable email
    const domain = value.split('@')[1].toLowerCase();
    if (DISPOSABLE_DOMAINS.has(domain)) {
      setWarning("Email temporaire détecté - Il peut ne pas recevoir d'emails");
      setIsValid(false);
      return;
    }

    // 4. Check length
    if (value.length > 254) {
      setError('Email trop long (max 254 caractères)');
      setIsValid(false);
      return;
    }

    // 5. If all checks pass
    setIsValid(true);
  }, []);

  // Async validation (optional: could ping email validation API)
  const validateEmailAsync = useCallback(
    async (value: string) => {
      setIsValidating(true);
      try {
        validateEmail(value);
        // Optional: Could call Firebase Cloud Function here
      } finally {
        setIsValidating(false);
      }
    },
    [validateEmail]
  );

  return {
    email,
    setEmail: validateEmail,
    validateEmailAsync,
    isValid,
    isValidating,
    error,
    warning,
    isSafeEmail: isValid && !warning,
  };
}
