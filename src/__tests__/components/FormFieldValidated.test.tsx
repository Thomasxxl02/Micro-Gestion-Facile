import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormFieldValidated } from "../../components/FormFieldValidated";
import React from "react";

describe("FormFieldValidated", () => {
  it("rend correctement avec un label", () => {
    render(
      <FormFieldValidated label="Nom Complet" value="" onChange={() => {}} />,
    );
    expect(screen.getByText("Nom Complet")).toBeDefined();
  });

  it("valide un email au changement", () => {
    const handleChange = vi.fn();
    render(
      <FormFieldValidated
        label="Email"
        type="email"
        value="test"
        onChange={handleChange}
      />,
    );

    expect(screen.getByText(/Format d'email invalide/i)).toBeDefined();

    const input = screen.getByLabelText(/Email/i);
    fireEvent.change(input, { target: { value: "test@example.com" } });
    expect(handleChange).toHaveBeenCalledWith("test@example.com");
  });

  it("affiche une erreur immédiate si showErrorsImmediate est vrai", () => {
    render(
      <FormFieldValidated
        label="Requis"
        value=""
        onChange={() => {}}
        validationType="required"
        showErrorsImmediate={true}
      />,
    );
    expect(screen.getByText(/Ce champ est obligatoire/i)).toBeDefined();
  });

  it("n'affiche l'erreur qu'après blur si showErrorsImmediate est faux", () => {
    render(
      <FormFieldValidated
        label="Requis"
        value=""
        onChange={() => {}}
        validationType="required"
        showErrorsImmediate={false}
      />,
    );
    // Pas d'erreur au début
    expect(screen.queryByText(/Ce champ est obligatoire/i)).toBeNull();

    const input = screen.getByLabelText(/Requis/i);
    fireEvent.blur(input);

    // Erreur après focus out (touched)
    expect(screen.getByText(/Ce champ est obligatoire/i)).toBeDefined();
  });

  it("affiche une icône personnalisée", () => {
    const DummyIcon = () => <svg data-testid="dummy-icon" />;
    render(
      <FormFieldValidated
        label="Champ"
        value=""
        onChange={() => {}}
        icon={DummyIcon as any}
      />,
    );
    expect(screen.getByTestId("dummy-icon")).toBeDefined();
  });

  it("utilise un validateur personnalisé", () => {
    const customValidator = (val: any) => ({
      valid: val === "OK",
      error: val === "OK" ? undefined : "Doit être OK",
    });

    const { rerender } = render(
      <FormFieldValidated
        label="Custom"
        value="NON"
        onChange={() => {}}
        validator={customValidator}
      />,
    );

    expect(screen.getByText("Doit être OK")).toBeDefined();

    rerender(
      <FormFieldValidated
        label="Custom"
        value="OK"
        onChange={() => {}}
        validator={customValidator}
      />,
    );
    expect(screen.queryByText("Doit être OK")).toBeNull();
  });
});
