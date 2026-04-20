import { useCallback, useState } from "react";

/**
 * Domaines jetables bloqués pour éviter les abus de liens magiques.
 */
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "maildrop.cc",
  "temp-mail.org",
  "throwaway.email",
  "mailinator.com",
  "yopmail.com",
  "protonmail.ch", // Souvent utilisé pour le spam de masse sur les petits services (optionnel)
]);

/**
 * Domaines génériques bloqués (Optionnel: pour forcer le B2B si nécessaire).
 * Pour l'instant, on bloque juste les domaines de test/exemple.
 */
const BLOCKED_DOMAINS = new Set([
  "test.com",
  "example.com",
  "invalid.com",
  "domain.com",
  "localhost",
]);

/**
 * Suggestions intelligentes pour corriger les fautes de frappe courantes.
 */
const COMMON_TYPOS: Record<string, string> = {
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "wanado.fr": "wanadoo.fr",
  "orange.fr": "orange.fr",
  "sfr.fr": "sfr.fr",
  "free.fr": "free.fr",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
};

export interface EmailValidationState {
  email: string;
  isValid: boolean;
  isValidating: boolean;
  error: string | null;
  warning: string | null;
  suggestion: string | null;
}

/**
 * Hook de validation d'e-mail avec correction de fautes de frappe et détection de spam.
 */
export function useEmailValidation(initialEmail = "") {
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

    if (!value) {
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    try {
      // 1. Format RFC basique
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setError("Format d'e-mail incorrect.");
        setIsValid(false);
        return;
      }

      const parts = value.split("@");
      const user = parts[0];
      const domain = parts[1].toLowerCase();

      // 2. Détection de domaines jetables
      if (DISPOSABLE_DOMAINS.has(domain)) {
        setError("Les adresses e-mails temporaires sont bloquées.");
        setIsValid(false);
        return;
      }

      // 3. Détection de domaines de test/abus
      if (BLOCKED_DOMAINS.has(domain)) {
        setError("Domaine non autorisé.");
        setIsValid(false);
        return;
      }

      // 4. Suggestions de correction
      if (COMMON_TYPOS[domain]) {
        setSuggestion(`${user}@${COMMON_TYPOS[domain]}`);
      }

      // 5. Longueur
      if (value.length > 254) {
        setError("L'adresse est beaucoup trop longue.");
        setIsValid(false);
        return;
      }

      setIsValid(true);
    } finally {
      setIsValidating(false);
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
  };
}
