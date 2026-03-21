import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FormField } from "../components/FormFields";
import React from "react";

describe("FormField", () => {
  it("affiche le label et l'input avec la valeur", () => {
    const onChange = vi.fn();
    render(
      <FormField
        label="Nom de l'entreprise"
        value="Ma Boite"
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText(/Nom de l'entreprise/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ma Boite")).toBeInTheDocument();
  });

  it("appelle onChange lors de la saisie", () => {
    const onChange = vi.fn();
    render(
      <FormField
        label="Email"
        value=""
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText(/Email/i);
    fireEvent.change(input, { target: { value: "test@example.com" } });

    expect(onChange).toHaveBeenCalledWith("test@example.com");
  });

  it("affiche l'erreur si présente", () => {
    render(
      <FormField
        label="Téléphone"
        value=""
        onChange={() => {}}
        error="Numéro invalide"
      />
    );

    expect(screen.getByText(/Numéro invalide/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Téléphone/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("affiche une astérisque si requis", () => {
    render(
      <FormField
        label="Siret"
        value=""
        onChange={() => {}}
        required={true}
      />
    );

    expect(screen.getByText("*")).toBeInTheDocument();
    // findByLabelText ou Regex plus précis car l'astérisque est dans un span aria-hidden
    expect(screen.getByLabelText(/Siret/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Siret/i)).toHaveAttribute("aria-required", "true");
  });
});
