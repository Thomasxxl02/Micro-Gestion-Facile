/**
 * Tests — src/services/securityService.ts
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  TOTPService,
  DataEncryptionService,
  APIKeyService,
  PasswordValidator,
  SessionService,
} from "../../services/securityService";

describe("securityService", () => {
  describe("TOTPService", () => {
    describe("generateSecret", () => {
      it("génère un secret de la longueur demandée", () => {
        const secret = TOTPService.generateSecret(32);
        expect(secret).toHaveLength(32);
      });

      it("génère un secret contenant uniquement des caractères Base32", () => {
        const secret = TOTPService.generateSecret(20);
        expect(secret).toMatch(/^[A-Z2-7]+$/);
      });

      it("génère des secrets différents à chaque appel", () => {
        const s1 = TOTPService.generateSecret(16);
        const s2 = TOTPService.generateSecret(16);
        expect(s1).not.toBe(s2);
      });
    });

    describe("generateQRCodeUrl", () => {
      it("génère une URL otpauth:// correcte", () => {
        const url = TOTPService.generateQRCodeUrl(
          "user@example.com",
          "SECRETKEY",
          "MonApp",
        );
        expect(url).toMatch(/^otpauth:\/\/totp\//);
        expect(url).toContain("SECRETKEY");
        expect(url).toContain("MonApp");
      });

      it("encode les caractères spéciaux dans l'URL", () => {
        const url = TOTPService.generateQRCodeUrl(
          "user+tag@example.com",
          "SECRET",
          "Mon App",
        );
        expect(url).not.toContain(" ");
      });
    });

    describe("validateCode", () => {
      it("accepte un code à 6 chiffres avec un secret non vide", async () => {
        const isValid = await TOTPService.validateCode("SECRETKEY", "123456");
        expect(isValid).toBe(true);
      });

      it("rejette un code qui n'a pas 6 chiffres", async () => {
        expect(await TOTPService.validateCode("SECRET", "12345")).toBe(false);
        expect(await TOTPService.validateCode("SECRET", "1234567")).toBe(false);
        expect(await TOTPService.validateCode("SECRET", "abc123")).toBe(false);
      });
    });
  });

  describe("DataEncryptionService", () => {
    it("chiffre et déchiffre des données avec le même mot de passe", async () => {
      const original = "Données sensibles 🔐";
      const password = "MonMotDePasse123!";
      const encrypted = await DataEncryptionService.encryptData(original, password);
      const decrypted = await DataEncryptionService.decryptData(encrypted, password);
      expect(decrypted).toBe(original);
    });

    it("génère des données chiffrées différentes pour le même texte (IV aléatoire)", async () => {
      const data = "Test";
      const password = "Pass123!";
      const enc1 = await DataEncryptionService.encryptData(data, password);
      const enc2 = await DataEncryptionService.encryptData(data, password);
      expect(enc1).not.toBe(enc2);
    });

    it("lève une erreur si le mot de passe est incorrect", async () => {
      const encrypted = await DataEncryptionService.encryptData("data", "correct-pass");
      await expect(
        DataEncryptionService.decryptData(encrypted, "wrong-pass"),
      ).rejects.toThrow();
    });
  });

  describe("APIKeyService", () => {
    it("crée une clé API avec les propriétés attendues", async () => {
      const key = await APIKeyService.createAPIKey("Ma clé", "GEMINI", "sk-test1234abcd");
      expect(key.name).toBe("Ma clé");
      expect(key.service).toBe("GEMINI");
      expect(key.isActive).toBe(true);
      expect(key.rotationRequired).toBe(false);
      expect(key.keyHash).toHaveLength(64); // SHA-256 hex
      expect(key.prefix).toBe("sk-test1"); // premiers 8 chars
    });

    it("ne stocke jamais la valeur de la clé en clair", async () => {
      const keyValue = "sk-secret-api-key";
      const key = await APIKeyService.createAPIKey("Clé test", "CUSTOM", keyValue);
      const keyStr = JSON.stringify(key);
      expect(keyStr).not.toContain(keyValue);
    });

    it("revokeAPIKey désactive la clé", async () => {
      const key = await APIKeyService.createAPIKey("Clé", "FIREBASE", "value123");
      const revoked = APIKeyService.revokeAPIKey(key);
      expect(revoked.isActive).toBe(false);
    });

    it("shouldRotate retourne true si la clé a expiré", async () => {
      const key = await APIKeyService.createAPIKey("Clé", "GEMINI", "value");
      const expiredKey = { ...key, expiresAt: Date.now() - 1000 };
      expect(APIKeyService.shouldRotate(expiredKey)).toBe(true);
    });

    it("shouldRotate retourne false si la clé n'a pas expiré", async () => {
      const key = await APIKeyService.createAPIKey("Clé", "GEMINI", "value");
      expect(APIKeyService.shouldRotate(key)).toBe(false);
    });

    it("shouldRotate retourne false si expiresAt est absent", async () => {
      const key = await APIKeyService.createAPIKey("Clé", "GEMINI", "value");
      const keyWithoutExpiry = { ...key, expiresAt: undefined };
      expect(APIKeyService.shouldRotate(keyWithoutExpiry)).toBe(false);
    });
  });

  describe("PasswordValidator", () => {
    it("valide un mot de passe fort", () => {
      const { isValid, score } = PasswordValidator.validate("MonP@ssw0rd!");
      expect(isValid).toBe(true);
      expect(score).toBeGreaterThanOrEqual(4);
    });

    it("rejette un mot de passe trop court", () => {
      const { isValid, feedback } = PasswordValidator.validate("abc");
      expect(isValid).toBe(false);
      expect(feedback).toContain("Au moins 8 caractères requis");
    });

    it("fournit du feedback pour les éléments manquants", () => {
      const { feedback } = PasswordValidator.validate("alllowercase");
      expect(feedback).toContain("Au moins une majuscule");
      expect(feedback).toContain("Au moins un chiffre");
    });

    it("getStrengthLabel retourne les bonnes étiquettes", () => {
      expect(PasswordValidator.getStrengthLabel(0)).toBe("Très faible");
      expect(PasswordValidator.getStrengthLabel(1)).toBe("Très faible");
      expect(PasswordValidator.getStrengthLabel(2)).toBe("Faible");
      expect(PasswordValidator.getStrengthLabel(3)).toBe("Moyen");
      expect(PasswordValidator.getStrengthLabel(4)).toBe("Fort");
      expect(PasswordValidator.getStrengthLabel(5)).toBe("Très fort");
    });
  });

  describe("SessionService", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("getSessions retourne [] si localStorage est vide", () => {
      expect(SessionService.getSessions()).toEqual([]);
    });

    it("addSession ajoute une session", () => {
      const session = {
        id: "s1",
        deviceName: "Chrome - Windows",
        ipAddress: "127.0.0.1",
        createdAt: new Date().toISOString(),
      };
      SessionService.addSession(session);
      expect(SessionService.getSessions()).toHaveLength(1);
      expect(SessionService.getSessions()[0].id).toBe("s1");
    });

    it("revokeSession supprime la session par id", () => {
      SessionService.addSession({ id: "s1", deviceName: "A", ipAddress: "0", createdAt: "" });
      SessionService.addSession({ id: "s2", deviceName: "B", ipAddress: "0", createdAt: "" });
      SessionService.revokeSession("s1");
      const sessions = SessionService.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe("s2");
    });

    it("revokeAllOtherSessions conserve uniquement la session courante", () => {
      SessionService.addSession({ id: "s1", deviceName: "A", ipAddress: "0", createdAt: "" });
      SessionService.addSession({ id: "s2", deviceName: "B", ipAddress: "0", createdAt: "" });
      SessionService.addSession({ id: "s3", deviceName: "C", ipAddress: "0", createdAt: "" });
      SessionService.revokeAllOtherSessions("s2");
      const sessions = SessionService.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe("s2");
    });

    it("getLoginHistory retourne [] si localStorage est vide", () => {
      expect(SessionService.getLoginHistory()).toEqual([]);
    });

    it("addLoginHistoryEntry ajoute une entrée dans l'historique", () => {
      const entry = {
        id: "h1",
        status: "success" as const,
        deviceName: "Chrome",
        timestamp: new Date().toISOString(),
      };
      SessionService.addLoginHistoryEntry(entry);
      expect(SessionService.getLoginHistory()).toHaveLength(1);
    });

    it("limite l'historique à 50 entrées maximum", () => {
      for (let i = 0; i < 55; i++) {
        SessionService.addLoginHistoryEntry({
          id: `h${i}`,
          status: "success",
          deviceName: "Chrome",
          timestamp: new Date().toISOString(),
        });
      }
      expect(SessionService.getLoginHistory()).toHaveLength(50);
    });

    it("getSessions retourne [] si localStorage contient du JSON invalide", () => {
      localStorage.setItem("mgf_sessions", "invalid_json");
      expect(SessionService.getSessions()).toEqual([]);
    });
  });
});
