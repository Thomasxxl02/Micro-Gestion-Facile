import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  FormField,
  SelectField,
  TextAreaField,
  ToggleSwitch,
  ColorPicker,
  LogoUploader,
  SignatureUploader,
} from "../../components/FormFields";
import React from "react";

describe("FormFields Components", () => {
  describe("FormField", () => {
    it("rend correctement avec un label et une valeur", () => {
      render(
        <FormField
          label="Nom du client"
          value="Jean Dupont"
          onChange={() => {}}
        />,
      );

      expect(screen.getByLabelText(/Nom du client/i)).toBeDefined();
      expect(screen.getByDisplayValue("Jean Dupont")).toBeDefined();
    });

    it("appelle onChange lors de la modification", () => {
      const handleChange = vi.fn();
      render(<FormField label="Email" value="" onChange={handleChange} />);

      const input = screen.getByLabelText(/Email/i);
      fireEvent.change(input, { target: { value: "test@example.com" } });

      expect(handleChange).toHaveBeenCalledWith("test@example.com");
    });

    it("affiche une erreur et les attributs ARIA associés", () => {
      render(
        <FormField
          label="SIRET"
          value=""
          error="SIRET invalide"
          onChange={() => {}}
        />,
      );

      const errorMsg = screen.getByText(/⚠️ SIRET invalide/i);
      expect(errorMsg).toBeDefined();

      const input = screen.getByLabelText(/SIRET/i);
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.getAttribute("aria-describedby")).toContain("error");
    });

    it("affiche la description si présente et pas d'erreur", () => {
      render(
        <FormField
          label="Budget"
          value="1000"
          description="Montant en euros"
          onChange={() => {}}
        />,
      );

      expect(screen.getByText(/Montant en euros/i)).toBeDefined();
      const input = screen.getByLabelText(/Budget/i);
      expect(input.getAttribute("aria-describedby")).toContain("description");
    });

    it("applique les attributs HTML optionnels (min, max, step)", () => {
      render(
        <FormField
          label="Quantité"
          type="number"
          value="5"
          min="1"
          max="10"
          step="0.5"
          onChange={() => {}}
        />,
      );

      const input = screen.getByLabelText(/Quantité/i);
      expect(input.getAttribute("min")).toBe("1");
      expect(input.getAttribute("max")).toBe("10");
      expect(input.getAttribute("step")).toBe("0.5");
    });
  });

  describe("TextAreaField", () => {
    it("rend un textarea avec les bonnes propriétés", () => {
      const handleChange = vi.fn();
      render(
        <TextAreaField
          label="Notes"
          value="Contenu test"
          onChange={handleChange}
          rows={5}
        />,
      );

      const textarea = screen.getByLabelText(/Notes/i);
      expect(textarea.tagName).toBe("TEXTAREA");
      expect(textarea.getAttribute("rows")).toBe("5");

      fireEvent.change(textarea, { target: { value: "nouveau" } });
      expect(handleChange).toHaveBeenCalledWith("nouveau");
    });
  });

  describe("SelectField", () => {
    it("rend un select avec des options", () => {
      const options = [
        { value: "v1", label: "Option 1" },
        { value: "v2", label: "Option 2" },
      ];
      render(
        <SelectField
          label="Choisir"
          value="v1"
          options={options}
          onChange={() => {}}
        />,
      );

      const select = screen.getByLabelText(/Choisir/i);
      expect(select.tagName).toBe("SELECT");
      expect(screen.getByText("Option 1")).toBeDefined();
      expect(screen.getByText("Option 2")).toBeDefined();
    });
  });

  describe("ToggleSwitch", () => {
    it("rend un switch et bascule la valeur au clic", () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <ToggleSwitch
          label="Activer"
          checked={false}
          onChange={handleChange}
        />,
      );

      const button = screen.getByRole("switch");
      expect(button.getAttribute("aria-checked")).toBe("false");

      fireEvent.click(button);
      expect(handleChange).toHaveBeenCalledWith(true);

      rerender(
        <ToggleSwitch label="Activer" checked={true} onChange={handleChange} />,
      );
      expect(button.getAttribute("aria-checked")).toBe("true");
    });
  });

  describe("ColorPicker", () => {
    it("affiche la valeur hexadécimale et réagit au changement", () => {
      const handleChange = vi.fn();
      render(
        <ColorPicker label="Thème" value="#ff0000" onChange={handleChange} />,
      );

      expect(screen.getByText("#ff0000")).toBeDefined();
      const input = screen.getByLabelText(/Thème/i);
      fireEvent.change(input, { target: { value: "#00ff00" } });
      expect(handleChange).toHaveBeenCalledWith("#00ff00");
    });

    it("sélectionne une couleur prédéfinie", () => {
      const handleChange = vi.fn();
      render(
        <ColorPicker label="Thème" value="#000000" onChange={handleChange} />,
      );

      const presetButton = screen.getByLabelText(/Choisir la couleur #102a43/i);
      fireEvent.click(presetButton);
      expect(handleChange).toHaveBeenCalledWith("#102a43");
    });
  });

  describe("LogoUploader", () => {
    it("affiche un message d'incitation quand aucun logo", () => {
      render(<LogoUploader onChange={() => {}} onRemove={() => {}} />);
      expect(screen.getByText(/Importer un logo/i)).toBeDefined();
    });

    it("affiche le logo quand logoUrl est fourni", () => {
      render(
        <LogoUploader
          logoUrl="data:image/png;base64,abc"
          onChange={() => {}}
          onRemove={() => {}}
        />,
      );
      expect(screen.getByAltText(/Logo entreprise/i)).toBeDefined();
      expect(screen.getByText(/Changer le logo/i)).toBeDefined();
    });

    it("appelle onRemove quand on clique sur le bouton de suppression", () => {
      const handleRemove = vi.fn();
      render(
        <LogoUploader
          logoUrl="data:image/png;base64,abc"
          onChange={() => {}}
          onRemove={handleRemove}
        />,
      );

      const removeBtn = screen.getByLabelText(/Supprimer le logo/i);
      fireEvent.click(removeBtn);
      expect(handleRemove).toHaveBeenCalled();
    });
  });

  describe("SignatureUploader", () => {
    it("affiche le mode import par défaut", () => {
      render(<SignatureUploader onChange={() => {}} onRemove={() => {}} />);
      expect(screen.getByText("IMPORT")).toBeDefined();
      expect(screen.getByText("DESSIN")).toBeDefined();
      expect(screen.getByText(/Fichier image/i)).toBeDefined();
    });

    it("bascule entre import et dessin", () => {
      render(<SignatureUploader onChange={() => {}} onRemove={() => {}} />);
      const drawBtn = screen.getByText("DESSIN");
      fireEvent.click(drawBtn);

      expect(screen.getByText(/Zone de signature/i)).toBeDefined();
      expect(screen.getByText(/Valider le tracé/i)).toBeDefined();
    });

    it("appelle onRemove en mode import quand une signature existe", () => {
      const handleRemove = vi.fn();
      render(
        <SignatureUploader
          signatureUrl="data:image/png;base64,abc"
          onChange={() => {}}
          onRemove={handleRemove}
        />,
      );

      const removeBtn = screen.getByTitle(/Supprimer le fichier/i);
      fireEvent.click(removeBtn);
      expect(handleRemove).toHaveBeenCalled();
    });
  });
});
