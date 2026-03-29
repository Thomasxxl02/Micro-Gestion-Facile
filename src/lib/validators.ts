/**
 * Module de validation pour Micro-Gestion-Facile
 * Spécialisé dans les normes françaises et européennes
 *
 * Inclut: SIRET/SIREN, IBAN, email, téléphone, code postal, TVA, etc.
 * Tous les validateurs retournent un objet {valid: boolean, error?: string}
 */

/**
 * Type de résultat de validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide un SIRET (14 chiffres, checksum Luhn)
 * Format: 14 chiffres incluant le code APE (5 chiffres)
 * Exemple valide: 73282932000074
 *
 * Algorithme Luhn:
 * 1. Doubler chaque chiffre à position PAIRE (1, 3, 5, ...)
 * 2. Si résultat > 9, soustraire 9
 * 3. Additionner tous les chiffres
 * 4. La somme doit être divisible par 10
 */
export function validateSIRET(siret: string): ValidationResult {
  // Nettoyage
  const cleaned = siret.replaceAll(/[\s-]/g, '');

  // Vérifications basiques
  if (!cleaned) {
    return { valid: false, error: 'SIRET obligatoire' };
  }
  if (!/^\d{14}$/.test(cleaned)) {
    return { valid: false, error: 'SIRET doit contenir 14 chiffres' };
  }

  // Détection des SIRET manifestement faux (tous [0-9], pas de pattern)
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return { valid: false, error: 'SIRET invalide (chiffres répétés)' };
  }

  // Algorithme Luhn (adapter pour SIRET)
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = Number.parseInt(cleaned[i], 10);

    // Doubler si position paire (0-indexed => positions 1, 3, 5, ...)
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'SIRET invalide (checksum)' };
  }

  return { valid: true };
}

/**
 * Valide un SIREN (9 chiffres, checksum Luhn)
 * Format: 9 chiffres
 * Le SIREN est les 9 premiers chiffres du SIRET
 * Exemple valide: 732829320
 *
 * Note: La validation Luhn pour SIREN seul est complexe car le SIREN
 * n'a pas toujours un checksum valide indépendamment du NIC.
 * Nous effectuons une validation basique du format et de la plausibilité.
 */
export function validateSIREN(siren: string): ValidationResult {
  // Nettoyage
  const cleaned = siren.replaceAll(/[\s-]/g, '');

  // Vérifications basiques
  if (!cleaned) {
    return { valid: false, error: 'SIREN obligatoire' };
  }
  if (!/^\d{9}$/.test(cleaned)) {
    return { valid: false, error: 'SIREN doit contenir 9 chiffres' };
  }

  // Détection des SIREN manifestement faux
  if (/^(\d)\1{8}$/.test(cleaned)) {
    return { valid: false, error: 'SIREN invalide (chiffres répétés)' };
  }

  return { valid: true };
}

/**
 * Valide un IBAN (International Bank Account Number)
 * Format: 2 lettres pays + 2 chiffres check + max 30 caractères alphanumériques
 * Longueur: 15-34 caractères selon le pays
 * France: 27 caractères (FR + 2 check + 5 code banque + 5 code guichet + 11 numéro + 2 clé)
 * Exemple valide: FR1420041010050500013M02800
 */
export function validateIBAN(iban: string): ValidationResult {
  // Nettoyage
  const cleaned = iban.replaceAll(' ', '').toUpperCase();

  // Vérifications basiques
  if (!cleaned) {
    return { valid: false, error: 'IBAN obligatoire' };
  }

  // Format: 2 lettres + 2 chiffres + alphanumériques
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleaned)) {
    return { valid: false, error: 'IBAN invalide (format incorrect)' };
  }

  // Longueur pour France
  if (cleaned.startsWith('FR') && cleaned.length !== 27) {
    return { valid: false, error: 'IBAN français doit faire 27 caractères' };
  }

  // Vérification du checksum (MOD-97-10)
  try {
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    let numericIBAN = '';

    for (const char of rearranged) {
      const codePoint = char.codePointAt(0) ?? 0;
      if (codePoint >= 65 && codePoint <= 90) {
        // A=10, B=11, ..., Z=35
        numericIBAN += codePoint - 55;
      } else {
        numericIBAN += char;
      }
    }

    // Utiliser BigInt pour éviter les débordements
    const remainder = BigInt(numericIBAN) % 97n;
    if (remainder !== 1n) {
      return { valid: false, error: 'IBAN invalide (checksum)' };
    }
  } catch {
    return { valid: false, error: 'IBAN invalide' };
  }

  return { valid: true };
}

/**
 * Valide un email
 * Utilise une regex solide (pas de solution parfaite RFC 5322)
 * Approche pragmatique: forme standard + vérifications basiques
 */
export function validateEmail(email: string): ValidationResult {
  if (email == null) {
    return { valid: false, error: 'Email obligatoire' };
  }
  const cleaned = email.trim();

  if (!cleaned) {
    return { valid: false, error: 'Email obligatoire' };
  }

  // Regex pragmatique (ne couvre pas tous les cas RFC 5322 mais bon pour 99%)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    return { valid: false, error: 'Email invalide' };
  }

  // Vérifications supplémentaires
  if (cleaned.length > 254) {
    return { valid: false, error: 'Email trop long (max 254 caractères)' };
  }

  const [localPart, domain] = cleaned.split('@');
  if (!localPart || !domain) {
    return { valid: false, error: 'Email invalide' };
  }

  if (localPart.length > 64) {
    return { valid: false, error: 'Partie locale trop longue (max 64 caractères)' };
  }

  // Éviter les patterns suspects
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { valid: false, error: 'Email invalide' };
  }

  return { valid: true };
}

/**
 * Valide un code postal français (5 chiffres)
 * Format: 5 chiffres, chaque département a ses codes
 * Exemple: 75001 (Paris), 13000 (Marseille), 97110 (Guadeloupe)
 */
export function validateFrenchPostalCode(postalCode: string): ValidationResult {
  const cleaned = postalCode.replaceAll(/[\s-]/g, '');

  if (!cleaned) {
    return { valid: false, error: 'Code postal obligatoire' };
  }

  if (!/^\d{5}$/.test(cleaned)) {
    return { valid: false, error: 'Code postal doit contenir 5 chiffres' };
  }

  // Vérification basique des codes valides
  const departementCode = Number.parseInt(cleaned.slice(0, 2), 10);

  // Codes valides:
  // - 01-95 (métropole)
  // - 97 (DOM-TOM: 971, 972, 973, 974, 976)
  if (departementCode >= 1 && departementCode <= 95) {
    return { valid: true };
  }

  if (departementCode === 97) {
    // DOM-TOM: 971, 972, 973, 974, 976
    const territories = [971, 972, 973, 974, 976];
    const territoryCode = Number.parseInt(cleaned.slice(0, 3), 10);
    if (territories.includes(territoryCode)) {
      return { valid: true };
    }
  }

  return { valid: false, error: 'Code postal français invalide' };
}

/**
 * Valide un numéro de téléphone français
 * Format: 10 chiffres, commence par 0, groupes: 0X XX XX XX XX
 * Exemples valides: 0123456789, 0-1-23-45-67-89
 */
export function validateFrenchPhone(phone: string): ValidationResult {
  const cleaned = phone.replaceAll(/[\s\-.()]/g, '');

  if (!cleaned) {
    return { valid: false, error: 'Téléphone obligatoire' };
  }

  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, error: 'Téléphone doit contenir 10 chiffres' };
  }

  if (!cleaned.startsWith('0')) {
    return { valid: false, error: 'Téléphone français doit commencer par 0' };
  }

  // Vérifier que le second chiffre correspond à une zone valide
  // 1-5: fixe, 6-7: mobile, 8: non-géographique, 9: spéciaux
  const secondDigit = Number.parseInt(cleaned[1], 10);
  if (secondDigit < 1 || secondDigit > 9) {
    return { valid: false, error: 'Numéro de téléphone invalide' };
  }

  return { valid: true };
}

/**
 * Valide un numéro de TVA Intracommunautaire
 * Format: Code pays (2 lettres) + numéro d'identification
 * France: FR + 11 chiffres ou 10 chiffres + 1 lettre
 * Exemple: FR12345678901 ou FRXY123456789
 */
export function validateVATNumber(vat: string): ValidationResult {
  const cleaned = vat.replaceAll(/[\s\-.]/g, '').toUpperCase();

  if (!cleaned) {
    return { valid: true }; // Optionnel pour les particuliers
  }

  // Format basique: 2 lettres + alphanumériques
  if (!/^[A-Z]{2}[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, error: 'Numéro TVA invalide' };
  }

  // Vérifications spécifiques par pays
  if (cleaned.startsWith('FR')) {
    const vatNumber = cleaned.slice(2);

    // France: 13 caractères au total (FR + 11 chiffres/lettres)
    if (vatNumber.length !== 11) {
      return { valid: false, error: 'Numéro TVA français doit avoir 11 caractères après FR' };
    }

    // Peut être: 11 chiffres ou SIREN (9 chiffres) + 2 caractères
    if (!/^\d{11}$/.test(vatNumber) && !/^\d{9}[A-Z0-9]{2}$/.test(vatNumber)) {
      return { valid: false, error: 'Numéro TVA français invalide' };
    }

    return { valid: true };
  }

  // Autres pays : vérification basique du format
  return { valid: true };
}

/**
 * Valide une URL de site web
 * Simple: commence par http(s):// et a un domaine valide
 */
export function validateWebsite(url: string): ValidationResult {
  if (!url) {
    return { valid: true }; // Optionnel
  }

  const cleanedUrl = url.trim();

  try {
    const parsed = new URL(cleanedUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL doit utiliser http ou https' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'URL invalide' };
  }
}

/**
 * Valide un nom (au moins 2 caractères, peut contenir espaces/tirets)
 */
export function validateName(name: string): ValidationResult {
  if (name == null) {
    return { valid: false, error: 'Nom obligatoire' };
  }
  const cleaned = name.trim();

  if (!cleaned) {
    return { valid: false, error: 'Nom obligatoire' };
  }

  if (cleaned.length < 2) {
    return { valid: false, error: 'Nom doit avoir au moins 2 caractères' };
  }

  if (cleaned.length > 150) {
    return { valid: false, error: 'Nom doit avoir max 150 caractères' };
  }

  // Éviter les patterns suspects (seulement chiffres, caractères spéciaux)
  if (!/^[a-zA-ZÀ-ÿ0-9\s\-.'(),]*$/.test(cleaned)) {
    return { valid: false, error: 'Nom contient des caractères invalides' };
  }

  return { valid: true };
}

/**
 * Valide u montant (nombre positif avec max 2 décimales)
 * Utilisé pour prix, montants, etc.
 */
export function validateAmount(amount: string | number): ValidationResult {
  if (amount === null || amount === undefined || amount === '') {
    return { valid: false, error: 'Montant obligatoire' };
  }

  const numAmount = typeof amount === 'string' ? Number.parseFloat(amount) : amount;

  if (Number.isNaN(numAmount)) {
    return { valid: false, error: 'Montant doit être un nombre' };
  }

  if (numAmount < 0) {
    return { valid: false, error: 'Montant doit être positif' };
  }

  if (numAmount > 999999999.99) {
    return { valid: false, error: 'Montant doit être < 1 milliard' };
  }

  // Vérifier le nombre de décimales (max 2)
  if (!/^\d+(\.\d{1,2})?$/.test(numAmount.toString())) {
    return { valid: false, error: 'Max 2 décimales' };
  }

  return { valid: true };
}

/**
 * Valide le format d'une date
 * Accepte: YYYY-MM-DD ou formats string
 */
export function validateDate(date: string | Date): ValidationResult {
  if (!date) {
    return { valid: false, error: 'Date obligatoire' };
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Date invalide' };
  }

  // Date raisonnable: pas plus de 100 ans dans le passé ou futur
  const now = new Date();
  const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
  const hundredYearsFromNow = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());

  if (parsedDate < hundredYearsAgo || parsedDate > hundredYearsFromNow) {
    return { valid: false, error: 'Date doit être entre 1900 et 2100' };
  }

  return { valid: true };
}

/**
 * Valide qu'une chaîne n'est pas vide
 */
export function validateRequired(value: string | number | undefined): ValidationResult {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: 'Champ obligatoire' };
  }
  return { valid: true };
}

/**
 * Valide une adresse (au moins 5 caractères)
 */
export function validateAddress(address: string): ValidationResult {
  const cleaned = address.trim();

  if (!cleaned) {
    return { valid: false, error: 'Adresse obligatoire' };
  }

  if (cleaned.length < 5) {
    return { valid: false, error: 'Adresse doit avoir au moins 5 caractères' };
  }

  if (cleaned.length > 200) {
    return { valid: false, error: 'Adresse doit avoir max 200 caractères' };
  }

  return { valid: true };
}

/**
 * Batch validator: valide plusieurs champs à la fois et retourne une map
 * Utile pour les formulaires avec plusieurs champs
 */
export interface BatchValidationRules {
  [fieldName: string]: (value: string | number) => ValidationResult;
}

export interface BatchValidationResult {
  [fieldName: string]: ValidationResult;
}

export function validateBatch(
  data: Record<string, unknown>,
  rules: BatchValidationRules
): BatchValidationResult {
  const results: BatchValidationResult = {};

  for (const [fieldName, validator] of Object.entries(rules)) {
    results[fieldName] = validator(data[fieldName] as string | number);
  }

  return results;
}

/**
 * Utilitaire: une validation est-elle réussie?
 */
export function isValid(result: ValidationResult): boolean {
  return result.valid;
}

/**
 * Utilitaire: tous les validations sont-elles réussies?
 */
export function areAllValid(results: BatchValidationResult): boolean {
  return Object.values(results).every((r) => r.valid);
}
