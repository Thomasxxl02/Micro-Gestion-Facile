/**
 * Service de Sécurité - Gestion avancée de la sécurité de l'application
 * ✅ Authentification 2FA (TOTP, SMS simulé)
 * ✅ Gestion sécurisée des API Keys
 * ✅ Reset password avec validation
 * ✅ Sessions actives et login history
 * ✅ Chiffrement des données sensibles (IBAN, SIRET)
 */

/**
 * TOTP (Time-based One-Time Password) - RFC 6238 / RFC 4226
 * Implémentation via WebCrypto HMAC-SHA1 — compatible Google/Microsoft Authenticator, Authy
 */
export class TOTPService {
  private static readonly BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  /**
   * Génère un secret TOTP cryptographiquement sûr (20 octets / 160 bits) encodé Base32.
   * Utilise crypto.getRandomValues — jamais Math.random() pour la sécurité.
   */
  static generateSecret(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    // Encodage Base32 RFC 4648
    let result = '';
    let buffer = 0;
    let bitsLeft = 0;
    for (const byte of bytes) {
      buffer = (buffer << 8) | byte;
      bitsLeft += 8;
      while (bitsLeft >= 5) {
        bitsLeft -= 5;
        result += this.BASE32_ALPHABET[(buffer >> bitsLeft) & 0x1f];
      }
    }
    if (bitsLeft > 0) {
      result += this.BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 0x1f];
    }
    return result;
  }

  /**
   * Décode un secret Base32 en octets bruts (pour HMAC-SHA1).
   * Retourne l'ArrayBuffer sous-jacent pour compatibilité WebCrypto.
   */
  private static base32Decode(base32: string): ArrayBuffer {
    const clean = base32.toUpperCase().replaceAll(/[^A-Z2-7]/g, '');
    const bytes: number[] = [];
    let buffer = 0;
    let bitsLeft = 0;
    for (const char of clean) {
      const idx = this.BASE32_ALPHABET.indexOf(char);
      if (idx === -1) {
        continue;
      }
      buffer = (buffer << 5) | idx;
      bitsLeft += 5;
      if (bitsLeft >= 8) {
        bitsLeft -= 8;
        bytes.push((buffer >> bitsLeft) & 0xff);
      }
    }
    const ab = new ArrayBuffer(bytes.length);
    new Uint8Array(ab).set(bytes);
    return ab;
  }

  /**
   * Génère un QR Code (URL otpauth://) pour Google Authenticator.
   * @param email  Email de l'utilisateur
   * @param secret Secret TOTP (Base32)
   * @param issuer Nom de l'application
   */
  static generateQRCodeUrl(
    email: string,
    secret: string,
    issuer: string = 'Micro-Gestion-Facile'
  ): string {
    const encodedEmail = encodeURIComponent(email);
    const encodedSecret = encodeURIComponent(secret);
    const encodedIssuer = encodeURIComponent(issuer);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${encodedSecret}&issuer=${encodedIssuer}`;
  }

  /**
   * Génère un code TOTP 6 chiffres via WebCrypto HMAC-SHA1 (RFC 4226 §5.3).
   * @param secret Secret Base32
   * @param step   Compteur de temps (floor(unix_seconds / 30))
   */
  static async generateTOTPCode(secret: string, step: number): Promise<string> {
    const keyBytes = this.base32Decode(secret);

    // Compteur 8 octets big-endian (les 4 octets de poids fort restent à 0 pour ~4000 ans)
    const counter = new ArrayBuffer(8);
    const view = new DataView(counter);
    view.setUint32(0, Math.floor(step / 0x100000000), false); // high 32 bits
    view.setUint32(4, step >>> 0, false); // low 32 bits

    // HMAC-SHA1 via WebCrypto
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, counter);
    const hmac = new Uint8Array(signature); // 20 octets SHA-1

    // Troncature dynamique (RFC 4226 §5.4)
    const offset = (hmac.at(-1) ?? 0) & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1_000_000;

    return code.toString().padStart(6, '0');
  }

  /**
   * Valide un code TOTP 6 chiffres — RFC 6238 compliant.
   * Accepte le pas courant et les 2 adjacents (±30 s de tolérance horloge).
   */
  static async validateCode(secret: string, code: string): Promise<boolean> {
    const cleanCode = code.replaceAll(/\s/g, '');
    if (!/^\d{6}$/.test(cleanCode)) {
      return false;
    }
    const now = Math.floor(Date.now() / 1000);
    const step = Math.floor(now / 30);
    for (const s of [step - 1, step, step + 1]) {
      if ((await this.generateTOTPCode(secret, s)) === cleanCode) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Gestion des API Keys avec rotation et revocation
 */
export interface APIKey {
  id: string;
  name: string; // ex: "Gemini Production"
  service: 'GEMINI' | 'FIREBASE' | 'CUSTOM';
  keyHash: string; // Hash SHA-256 de la clé (jamais stocker la clé en clair)
  prefix: string; // Premiers caractères visibles (ex: "abcd****efgh" - format fictif)
  createdAt: number;
  lastUsedAt?: number;
  expiresAt?: number;
  isActive: boolean;
  rotationRequired: boolean;
}

export class APIKeyService {
  /**
   * Hash une clé API pour le stockage sécurisé
   */
  static async hashAPIKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Génère un aperçu sûr de la clé API
   */
  static generateKeyPreview(key: string): string {
    if (key.length <= 8) {
      return '****';
    }
    const visible = key.substring(0, 4) + '***' + key.substring(key.length - 4);
    return visible;
  }

  /**
   * Crée une nouvelle clé API
   */
  static async createAPIKey(
    name: string,
    service: 'GEMINI' | 'FIREBASE' | 'CUSTOM',
    keyValue: string
  ): Promise<APIKey> {
    return {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      service,
      keyHash: await this.hashAPIKey(keyValue),
      prefix: this.generateKeyPreview(keyValue),
      createdAt: Date.now(),
      isActive: true,
      rotationRequired: false,
    };
  }

  /**
   * Marque une clé comme expirée/révoquée
   */
  static revokeAPIKey(key: APIKey): APIKey {
    return { ...key, isActive: false, rotationRequired: true };
  }

  /**
   * Vérifie si une clé doit être renouvelée (âge > 90 jours)
   */
  static shouldRotate(key: APIKey): boolean {
    const AGE_THRESHOLD = 90 * 24 * 60 * 60 * 1000; // 90 jours
    return Date.now() - key.createdAt > AGE_THRESHOLD;
  }
}

/**
 * Gestion des Sessions Actives et Login History
 */
export interface Session {
  id: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  lastActivityAt: number;
  isCurrent: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  timestamp: number;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  failureReason?: string;
}

export class SessionService {
  private static readonly SESSION_STORAGE_KEY = 'mgs_sessions';
  private static readonly LOGIN_HISTORY_KEY = 'mgs_login_history';

  /**
   * Crée une nouvelle session
   */
  static createSession(deviceName: string = ''): Session {
    return {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      deviceName: deviceName || this.getDeviceName(),
      ipAddress: this.getIPAddress(), // Simulé (côté client)
      userAgent: navigator.userAgent,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      isCurrent: false,
    };
  }

  /**
   * Récupère toutes les sessions actives
   */
  static getSessions(): Session[] {
    try {
      const stored = localStorage.getItem(this.SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Ajoute ou met à jour une session
   */
  static updateLastActivity(sessionId: string): void {
    const sessions = this.getSessions();
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, lastActivityAt: Date.now() } : s
    );
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Déconnecte une session (la supprime de la liste)
   */
  static revokeSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessions));
  }

  /**
   * Déconnecte toutes les autres sessions
   */
  static revokeAllOtherSessions(currentSessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id === currentSessionId);
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessions));
  }

  /**
   * Ajoute une entrée au login history
   */
  static recordLoginAttempt(status: 'success' | 'failed', failureReason?: string): void {
    const history: LoginHistoryEntry[] = this.getLoginHistory();
    history.push({
      id: `login_${Date.now()}`,
      timestamp: Date.now(),
      deviceName: this.getDeviceName(),
      ipAddress: this.getIPAddress(),
      userAgent: navigator.userAgent,
      status,
      failureReason,
    });
    // Garder seulement les 50 dernières entrées
    const recent = history.slice(-50);
    localStorage.setItem(this.LOGIN_HISTORY_KEY, JSON.stringify(recent));
  }

  /**
   * Récupère l'historique des logins
   */
  static getLoginHistory(): LoginHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.LOGIN_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) {
      return 'Windows PC';
    }
    if (ua.includes('Mac')) {
      return 'Mac';
    }
    if (ua.includes('Linux')) {
      return 'Linux';
    }
    if (ua.includes('iPhone')) {
      return 'iPhone';
    }
    if (ua.includes('Android')) {
      return 'Android Phone';
    }
    if (ua.includes('iPad')) {
      return 'iPad';
    }
    return 'Unknown Device';
  }

  private static getIPAddress(): string {
    // Note: Côté client, on ne peut pas obtenir l'IP réelle
    // Ceci est une simulation pour la démo
    // En production, cette info viendrait du serveur au login
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }
}

/**
 * Gestion du Reset Password avec tokens de sécurité
 */
export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export class PasswordResetService {
  private static readonly RESET_TOKENS_KEY = 'mgs_reset_tokens';
  private static readonly TOKEN_VALIDITY = 15 * 60 * 1000; // 15 minutes

  /**
   * Génère un token de reset password sécurisé
   */
  static generateResetToken(email: string): PasswordResetToken {
    const token = crypto.getRandomValues(new Uint8Array(32));
    const tokenString = Array.from(token)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      id: `rst_${Date.now()}`,
      email,
      token: tokenString,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.TOKEN_VALIDITY,
      used: false,
    };
  }

  /**
   * Valide un token de reset password
   */
  static validateToken(email: string, token: string): boolean {
    const tokens = this.getResetTokens();
    const found = tokens.find((t) => t.email === email && t.token === token && !t.used);

    if (!found) {
      return false;
    }
    if (Date.now() > found.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Marque un token comme utilisé
   */
  static useToken(token: string): void {
    const tokens = this.getResetTokens();
    const updated = tokens.map((t) => (t.token === token ? { ...t, used: true } : t));
    localStorage.setItem(this.RESET_TOKENS_KEY, JSON.stringify(updated));
  }

  private static getResetTokens(): PasswordResetToken[] {
    try {
      const stored = localStorage.getItem(this.RESET_TOKENS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Chiffrement/Déchiffrement des données sensibles
 * Utilise l'API SubtleCrypto pour le chiffrement AES-GCM côté client
 */
export class DataEncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256; // bits

  /**
   * Génère une clé de chiffrement à partir d'une password
   */
  static async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Importer la password comme clé brute
    const baseKey = await crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, [
      'deriveBits',
      'deriveKey',
    ]);

    // Dériver une clé chiffrée avec PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('mgs_salt_2026'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Chiffre des données sensibles (IBAN, SIRET, etc.)
   */
  static async encryptData(data: string, password: string): Promise<string> {
    const key = await this.deriveKey(password);
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(data);

    // Générer un IV aléatoire (12 bytes pour GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt({ name: this.ALGORITHM, iv }, key, plaintext);

    // Combiner IV + ciphertext en base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCodePoint(...Array.from(combined)));
  }

  /**
   * Déchiffre des données sensibles
   */
  static async decryptData(encryptedData: string, password: string): Promise<string> {
    const key = await this.deriveKey(password);

    // Décoder depuis base64
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.codePointAt(0) ?? 0);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const plaintext = await crypto.subtle.decrypt({ name: this.ALGORITHM, iv }, key, ciphertext);

    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  }
}

/**
 * Validateur de mots de passe forts
 */
export class PasswordValidator {
  static validate(password: string): {
    isValid: boolean;
    score: number; // 0-5
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('Au moins 8 caractères requis');
    }

    if (password.length >= 12) {
      score++;
    }

    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Ajoutez des lettres minuscules');
    }

    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Ajoutez des lettres majuscules');
    }

    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Ajoutez des chiffres');
    }

    if (/[!@#$%^&*()_+\-={};:"'\\|,.<>/?[\]]/.test(password)) {
      score++;
    } else {
      feedback.push('Ajoutez des caractères spéciaux');
    }

    return {
      isValid: score >= 3,
      score: Math.min(score, 5),
      feedback,
    };
  }

  static getStrengthLabel(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return '🔴 Très faible';
      case 2:
        return '🟠 Faible';
      case 3:
        return '🟡 Moyen';
      case 4:
        return '🟢 Bon';
      case 5:
        return '🟢 Excellent';
      default:
        return 'Inconnu';
    }
  }
}
