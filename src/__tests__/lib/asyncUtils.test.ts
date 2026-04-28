/**
 * Tests — src/lib/asyncUtils.ts
 */
import { describe, expect, it, vi } from "vitest";
import { wrapAsync } from "../../lib/asyncUtils";

describe("wrapAsync", () => {
  it("appelle la fonction asynchrone avec les arguments fournis", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const wrapped = wrapAsync(fn);
    wrapped("arg1", 42);
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith("arg1", 42));
  });

  it("retourne une fonction synchrone (void)", () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const wrapped = wrapAsync(fn);
    const result = wrapped();
    expect(result).toBeUndefined();
  });

  it("absorbe les erreurs sans les propager", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const fn = vi.fn().mockRejectedValue(new Error("Erreur test"));
    const wrapped = wrapAsync(fn);

    // Should not throw
    expect(() => wrapped()).not.toThrow();

    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
    consoleError.mockRestore();
  });

  it("logue l'erreur via console.error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Async failed");
    const fn = vi.fn().mockRejectedValue(error);
    const wrapped = wrapAsync(fn);
    wrapped();

    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        "Async operation failed:",
        error,
      ),
    );
    consoleError.mockRestore();
  });

  it("passe plusieurs arguments correctement", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const wrapped = wrapAsync(fn);
    wrapped("a", "b", "c");
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith("a", "b", "c"));
  });
});
