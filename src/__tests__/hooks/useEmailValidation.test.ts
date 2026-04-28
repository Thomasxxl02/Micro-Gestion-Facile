/**
 * Tests — src/hooks/useEmailValidation.ts
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEmailValidation } from "../../hooks/useEmailValidation";

describe("useEmailValidation", () => {
  it("initialise avec l'email initial fourni", () => {
    const { result } = renderHook(() => useEmailValidation("test@example.com"));
    expect(result.current.email).toBe("test@example.com");
  });

  it("commence avec un email vide par défaut", () => {
    const { result } = renderHook(() => useEmailValidation());
    expect(result.current.email).toBe("");
    expect(result.current.isValid).toBe(false);
  });

  it("valide un email correct", async () => {
    const { result } = renderHook(() => useEmailValidation());
    await act(async () => {
      await result.current.setEmail("user@gmail.com");
    });
    expect(result.current.isValid).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("invalide un email sans @", async () => {
    const { result } = renderHook(() => useEmailValidation());
    await act(async () => {
      await result.current.setEmail("notanemail");
    });
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("rejette un domaine jetable", async () => {
    const { result } = renderHook(() => useEmailValidation());
    await act(async () => {
      await result.current.setEmail("user@tempmail.com");
    });
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toContain("temporaires");
  });

  it("rejette un domaine de test/abus", async () => {
    const { result } = renderHook(() => useEmailValidation());
    await act(async () => {
      await result.current.setEmail("user@example.com");
    });
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("suggère une correction pour une faute de frappe connue", async () => {
    const { result } = renderHook(() => useEmailValidation());
    await act(async () => {
      await result.current.setEmail("user@gmal.com");
    });
    expect(result.current.suggestion).toBe("user@gmail.com");
    expect(result.current.isValid).toBe(true);
  });

  it("rejette un email vide après modification", async () => {
    const { result } = renderHook(() => useEmailValidation("test@example.com"));
    await act(async () => {
      await result.current.setEmail("");
    });
    expect(result.current.isValid).toBe(false);
  });

  it("rejette un email trop long (> 254 caractères)", async () => {
    const { result } = renderHook(() => useEmailValidation());
    const longEmail = `${"a".repeat(250)}@gmail.com`;
    await act(async () => {
      await result.current.setEmail(longEmail);
    });
    expect(result.current.isValid).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("isValidating devient false après la validation", async () => {
    const { result } = renderHook(() => useEmailValidation());
    await act(async () => {
      await result.current.setEmail("test@gmail.com");
    });
    expect(result.current.isValidating).toBe(false);
  });

  it("remet suggestion à null pour un email sans faute connue", async () => {
    const { result } = renderHook(() => useEmailValidation());
    await act(async () => {
      await result.current.setEmail("user@gmal.com");
    });
    expect(result.current.suggestion).not.toBeNull();

    await act(async () => {
      await result.current.setEmail("user@gmail.com");
    });
    expect(result.current.suggestion).toBeNull();
  });
});
