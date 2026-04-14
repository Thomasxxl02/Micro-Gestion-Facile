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

// Common typos in email domains
const COMMON_TYPOS: Record<string, string> = {
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'wanado.fr': 'wanadoo.fr',
  'orange.com': 'orange.fr', // Often orange.fr in France
};

// Allowed B2B domains (Optional refinement)
const BLOCKED_DOMAINS = new Set([
  'test.com',
  'example.com',
  'invalid.com',
  'domain.com',
]);

export interface EmailValidationState {
  email: string;
  isValid: boolean;
  isValidating: boolean;
  error: string | null;
  warning: string | null;
  suggestion: string | null;
}

export function useEmailValidation(initialEmail = '') {
  const [email, setEmail] = useState(initialEmail);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validateEmail = useCallback(async (value: string) => {
    setEmail(value);
    setError(null);
    setWarning(null);
    setSuggestion(null);
    setIsValidating(true);

    try {
      // Simulate slight delay for visual feedback if needed,
      // or keep it instant since it's local for now
      if (!value) {
        setIsValid(false);
        return;
      }

      // 1. Basic format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setError("Format d'email invalide");
        setIsValid(false);
        return;
      }

      // 2. Check for disposable email or typos
      const parts = value.split('@');
      const domain = parts[1].toLowerCase();

      if (DISPOSABLE_DOMAINS.has(domain)) {
        setWarning("Email temporaire détecté - Il peut ne pas recevoir d'emails");
        setIsValid(false);
        return;
      }

      if (BLOCKED_DOMAINS.has(domain)) {
        setError('Domaine non autorisé pour un usage professionnel');
        setIsValid(false);
        return;
      }

      // Check for common typos
      if (COMMON_TYPOS[domain]) {
        setSuggestion(`${parts[0]}@${COMMON_TYPOS[domain]}`);
      }

      // 3. Check length
      if (value.length > 254) {
        setError('Email trop long (max 254 caractères)');
        setIsValid(false);
        return;
      }

      // 4. If all checks pass
      setIsValid(true);
    } finally {
      // Add a tiny artificial delay for the "isValidating" feedback to be visible
      setTimeout(() => setIsValidating(false), 300);
    }
  }, []);

  return {
    email,
    setEmail: validateEmail,
    isValid,
    isValidating,
    error,
    warning,
    suggestion,
    isSafeEmail: isValid && !warning,
  };
}
