/**
 * Tests — src/lib/authErrors.ts
 */
import { describe, expect, it } from "vitest";
import { getFriendlyAuthErrorMessage } from "../../lib/authErrors";

describe("getFriendlyAuthErrorMessage", () => {
  it("retourne le message pour auth/invalid-email", () => {
    expect(getFriendlyAuthErrorMessage("auth/invalid-email")).toBe(
      "L'adresse e-mail n'est pas valide.",
    );
  });

  it("retourne le message pour auth/user-disabled", () => {
    expect(getFriendlyAuthErrorMessage("auth/user-disabled")).toBe(
      "Ce compte a été désactivé.",
    );
  });

  it("retourne le même message pour auth/user-not-found et auth/wrong-password", () => {
    const msg = "E-mail ou mot de passe incorrect.";
    expect(getFriendlyAuthErrorMessage("auth/user-not-found")).toBe(msg);
    expect(getFriendlyAuthErrorMessage("auth/wrong-password")).toBe(msg);
  });

  it("retourne le message pour auth/email-already-in-use", () => {
    expect(getFriendlyAuthErrorMessage("auth/email-already-in-use")).toContain(
      "déjà utilisée",
    );
  });

  it("retourne le message pour auth/operation-not-allowed", () => {
    expect(getFriendlyAuthErrorMessage("auth/operation-not-allowed")).toContain(
      "activée",
    );
  });

  it("retourne le message pour auth/weak-password", () => {
    expect(getFriendlyAuthErrorMessage("auth/weak-password")).toContain("faible");
  });

  it("retourne le message pour auth/popup-closed-by-user", () => {
    expect(getFriendlyAuthErrorMessage("auth/popup-closed-by-user")).toContain(
      "fermée",
    );
  });

  it("retourne le message pour auth/cancelled-popup-request", () => {
    expect(getFriendlyAuthErrorMessage("auth/cancelled-popup-request")).toContain(
      "fenêtre",
    );
  });

  it("retourne le message pour auth/network-request-failed", () => {
    expect(getFriendlyAuthErrorMessage("auth/network-request-failed")).toContain(
      "réseau",
    );
  });

  it("retourne le message pour auth/too-many-requests", () => {
    expect(getFriendlyAuthErrorMessage("auth/too-many-requests")).toContain(
      "tentatives",
    );
  });

  it("retourne le message pour auth/requires-recent-login", () => {
    expect(getFriendlyAuthErrorMessage("auth/requires-recent-login")).toContain(
      "reconnexion",
    );
  });

  it("retourne le message pour auth/internal-error", () => {
    expect(getFriendlyAuthErrorMessage("auth/internal-error")).toContain(
      "interne",
    );
  });

  it("retourne le message pour auth/expired-action-code", () => {
    expect(getFriendlyAuthErrorMessage("auth/expired-action-code")).toContain(
      "expiré",
    );
  });

  it("retourne le message pour auth/invalid-action-code", () => {
    expect(getFriendlyAuthErrorMessage("auth/invalid-action-code")).toContain(
      "invalide",
    );
  });

  it("retourne le message pour permission-denied", () => {
    expect(getFriendlyAuthErrorMessage("permission-denied")).toContain(
      "permissions",
    );
  });

  it("retourne le message pour unavailable", () => {
    expect(getFriendlyAuthErrorMessage("unavailable")).toContain(
      "indisponible",
    );
  });

  it("retourne un message générique pour un code inconnu", () => {
    expect(getFriendlyAuthErrorMessage("auth/unknown-code")).toBe(
      "Une erreur inattendue est survenue. Veuillez réessayer.",
    );
  });

  it("retourne un message générique pour une chaîne vide", () => {
    expect(getFriendlyAuthErrorMessage("")).toBe(
      "Une erreur inattendue est survenue. Veuillez réessayer.",
    );
  });
});
