/**
 * Validations pour le profil utilisateur et la fiscalité
 */

/**
 * Valide un numéro SIRET (14 chiffres) via l'algorithme de Luhn
 */
export const validateSIRET = (value: string): string | undefined => {
  if (!value) return undefined;
  const digits = value.replace(/[\s-]/g, "");
  if (!/^\d{14}$/.test(digits)) {
    return "Le SIRET doit contenir exactement 14 chiffres";
  }
  
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if ((digits.length - 1 - i) % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  
  if (sum % 10 !== 0) {
    return "Numéro SIRET invalide (clé de contrôle incorrecte)";
  }
  return undefined;
};

/**
 * Valide un format IBAN basique
 */
export const validateIBAN = (value: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(normalized)) {
    return "Format IBAN invalide (ex : FR76 3000 6000 0112 3456 7890 189)";
  }
  return undefined;
};

/**
 * Valide une adresse email
 */
export const validateEmail = (value: string): string | undefined => {
  if (!value) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Adresse email invalide";
  }
  return undefined;
};
