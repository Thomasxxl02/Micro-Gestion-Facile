/**
 * Tests — src/hooks/useFormValidation.ts
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFormValidation } from "../../hooks/useFormValidation";
import { validateRequired, validateEmailForm } from "../../lib/zod-schemas";
import type { ValidationRule } from "../../lib/zod-schemas";

interface TestForm {
  name: string;
  email: string;
  optional?: string;
}

const rules: Record<string, ValidationRule[]> = {
  name: [validateRequired],
  email: [validateEmailForm],
};

describe("useFormValidation", () => {
  it("initialise avec les données fournies", () => {
    const initial: TestForm = { name: "Alice", email: "alice@example.com" };
    const { result } = renderHook(() => useFormValidation(initial, rules));
    expect(result.current.data).toEqual(initial);
  });

  it("handleChange met à jour la donnée", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>({ name: "", email: "" }, rules),
    );
    act(() => {
      result.current.handleChange("name")("Bob");
    });
    expect(result.current.data.name).toBe("Bob");
  });

  it("handleChange marque le champ comme touché", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>({ name: "", email: "" }, rules),
    );
    act(() => {
      result.current.handleChange("name")("Bob");
    });
    expect(result.current.touched.name).toBe(true);
  });

  it("handleChange valide le champ et génère une erreur si invalide", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>({ name: "", email: "" }, rules),
    );
    act(() => {
      result.current.handleChange("email")("notvalid");
    });
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.email?.valid).toBe(false);
  });

  it("handleChange efface l'erreur quand la valeur devient valide", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>({ name: "", email: "" }, rules),
    );
    act(() => {
      result.current.handleChange("email")("notvalid");
    });
    expect(result.current.errors.email?.valid).toBe(false);

    act(() => {
      result.current.handleChange("email")("valid@example.com");
    });
    expect(result.current.errors.email).toBeUndefined();
  });

  it("validate retourne false si des champs obligatoires sont vides", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>({ name: "", email: "" }, rules),
    );
    let isValid: boolean;
    act(() => {
      isValid = result.current.validate();
    });
    expect(isValid!).toBe(false);
  });

  it("validate retourne true si tous les champs sont valides", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>(
        { name: "Alice", email: "alice@gmail.com" },
        rules,
      ),
    );
    let isValid: boolean;
    act(() => {
      isValid = result.current.validate();
    });
    expect(isValid!).toBe(true);
  });

  it("validate marque tous les champs comme touchés", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>({ name: "", email: "" }, rules),
    );
    act(() => {
      result.current.validate();
    });
    expect(result.current.touched.name).toBe(true);
    expect(result.current.touched.email).toBe(true);
  });

  it("reset restaure les données initiales et efface les erreurs", () => {
    const initial: TestForm = { name: "Alice", email: "alice@gmail.com" };
    const { result } = renderHook(() => useFormValidation(initial, rules));

    act(() => {
      result.current.handleChange("name")("Bob");
    });
    expect(result.current.data.name).toBe("Bob");

    act(() => {
      result.current.reset();
    });
    expect(result.current.data.name).toBe("Alice");
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it("fonctionne sans règles de validation", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>({ name: "Alice", email: "" }),
    );
    let isValid: boolean;
    act(() => {
      isValid = result.current.validate();
    });
    expect(isValid!).toBe(true);
  });

  it("setData met à jour directement toutes les données", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestForm>({ name: "", email: "" }, rules),
    );
    act(() => {
      result.current.setData({ name: "Charlie", email: "charlie@test.com" });
    });
    expect(result.current.data.name).toBe("Charlie");
    expect(result.current.data.email).toBe("charlie@test.com");
  });
});
