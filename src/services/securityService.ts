/**
 * Security Service — Auth 2FA, API Keys, Sessions, Password, Encryption
 * Uses Web Crypto API for real encryption (no external deps)
 */
import type { SecurityAPIKey } from "../types/user";

// Re-export canonical type so SecurityTab can import from this module
export type APIKey = SecurityAPIKey;

export interface Session {
  id: string;
  deviceName: string;
  ipAddress: string;
  createdAt: string; // ISO
  lastActiveAt?: string;
}

export interface LoginHistoryEntry {
  id: string;
  status: "success" | "failed";
  deviceName: string;
  timestamp: string; // ISO
  failureReason?: string;
  ipAddress?: string;
}

// ─── TOTP SERVICE ─────────────────────────────────────────────────────────────

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const TOTPService = {
  /** Generate a random Base32 TOTP secret */
  generateSecret(length = 32): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let result = "";
    for (const byte of bytes) {
      result += BASE32_CHARS[byte % 32];
    }
    return result;
  },

  /** Generate an otpauth:// URL for QR code scanning */
  generateQRCodeUrl(email: string, secret: string, appName: string): string {
    const issuer = encodeURIComponent(appName);
    const account = encodeURIComponent(email);
    return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  },

  /** Validate a 6-digit TOTP code against a secret (frontend-only approximation) */
  async validateCode(secret: string, code: string): Promise<boolean> {
    if (!/^\d{6}$/.test(code)) return false;
    // In production, this should use a proper TOTP library with HMAC-SHA1
    // For development purposes, accept any 6-digit code with a non-empty secret
    return secret.length > 0 && code.length === 6;
  },
};

// ─── DATA ENCRYPTION SERVICE ──────────────────────────────────────────────────

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export const DataEncryptionService = {
  /** Encrypt data with a password using AES-GCM + PBKDF2 */
  async encryptData(data: string, password: string): Promise<string> {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(data),
    );
    // Combine salt + iv + ciphertext as base64
    const combined = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength,
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    return btoa(String.fromCharCode(...combined));
  },

  /** Decrypt data previously encrypted with encryptData */
  async decryptData(
    encryptedBase64: string,
    password: string,
  ): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
      c.charCodeAt(0),
    );
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  },
};

// ─── API KEY SERVICE ──────────────────────────────────────────────────────────

const KEY_ROTATION_DAYS = 90;

async function hashKey(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const APIKeyService = {
  /** Create a new API key entry (value is hashed — never stored in clear) */
  async createAPIKey(
    name: string,
    service: SecurityAPIKey["service"],
    value: string,
  ): Promise<SecurityAPIKey> {
    const now = Date.now();
    const expiresAt = now + KEY_ROTATION_DAYS * 24 * 60 * 60 * 1000;
    const keyHash = await hashKey(value);
    return {
      id: crypto.randomUUID(),
      name,
      service,
      keyHash,
      prefix: value.slice(0, 8),
      isActive: true,
      createdAt: now,
      expiresAt,
      rotationRequired: false,
    };
  },

  /** Mark a key as revoked */
  revokeAPIKey(key: SecurityAPIKey): SecurityAPIKey {
    return { ...key, isActive: false };
  },

  /** Returns true if the key should be rotated (older than KEY_ROTATION_DAYS) */
  shouldRotate(key: SecurityAPIKey): boolean {
    if (!key.expiresAt) return false;
    return Date.now() > key.expiresAt;
  },
};

// ─── PASSWORD VALIDATOR ───────────────────────────────────────────────────────

export const PasswordValidator = {
  validate(password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push("Au moins 8 caractères requis");

    if (password.length >= 12) score++;
    else if (password.length >= 8) feedback.push("12+ caractères recommandés");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Au moins une majuscule");

    if (/[0-9]/.test(password)) score++;
    else feedback.push("Au moins un chiffre");

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push("Au moins un caractère spécial (!@#$...)");

    return { score, feedback, isValid: score >= 4 };
  },

  getStrengthLabel(score: number): string {
    if (score <= 1) return "Très faible";
    if (score === 2) return "Faible";
    if (score === 3) return "Moyen";
    if (score === 4) return "Fort";
    return "Très fort";
  },
};

// ─── PASSWORD RESET SERVICE ───────────────────────────────────────────────────

export const PasswordResetService = {
  /** Generate a password reset token (in production, send by email) */
  generateResetToken(email: string): string {
    const token = crypto.randomUUID();
    if (import.meta.env.DEV) {
      console.warn(`[DEV] Password reset token for ${email}: ${token}`);
    }
    return token;
  },
};

// ─── SESSION SERVICE ──────────────────────────────────────────────────────────

const SESSION_KEY = "mgf_sessions";
const HISTORY_KEY = "mgf_login_history";

export const SessionService = {
  getSessions(): Session[] {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "[]") as Session[];
    } catch {
      return [];
    }
  },

  getLoginHistory(): LoginHistoryEntry[] {
    try {
      return JSON.parse(
        localStorage.getItem(HISTORY_KEY) ?? "[]",
      ) as LoginHistoryEntry[];
    } catch {
      return [];
    }
  },

  revokeSession(sessionId: string): void {
    const sessions = SessionService.getSessions().filter(
      (s) => s.id !== sessionId,
    );
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
  },

  revokeAllOtherSessions(currentSessionId: string): void {
    const current = SessionService.getSessions().find(
      (s) => s.id === currentSessionId,
    );
    localStorage.setItem(SESSION_KEY, JSON.stringify(current ? [current] : []));
  },

  addSession(session: Session): void {
    const sessions = [...SessionService.getSessions(), session];
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
  },

  addLoginHistoryEntry(entry: LoginHistoryEntry): void {
    const history = [...SessionService.getLoginHistory(), entry];
    // Keep last 50 entries
    if (history.length > 50) history.splice(0, history.length - 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },
};
