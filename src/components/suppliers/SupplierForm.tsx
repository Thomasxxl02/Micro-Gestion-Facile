import React from "react";
import type { Supplier } from "../../types";
import {
  AddressFields,
  ContactFields,
} from "../EntityFormFields";
import { FormFieldValidated } from "../FormFieldValidated";
import { TextAreaField } from "../FormFields";

interface SupplierFormProps {
  formData: Partial<Supplier>;
  validationErrors: Record<string, string>;
  touchedFields: Record<string, boolean>;
  onFormChange: (data: Partial<Supplier>) => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  formData,
  validationErrors,
  touchedFields,
  onFormChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onFormChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormFieldValidated
          label="Nom de l'entreprise"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          error={validationErrors.name}
          touched={touchedFields.name}
          placeholder="Ex: Leroy Merlin, AWS, etc."
          required
        />
        <FormFieldValidated
          label="Catégorie"
          name="category"
          value={formData.category || ""}
          onChange={handleChange}
          error={validationErrors.category}
          touched={touchedFields.category}
          placeholder="Ex: Fournitures, Cloud, Publicité..."
        />
      </div>

      <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800">
        <h4 className="text-sm font-bold text-brand-900 dark:text-white mb-4 uppercase tracking-wider">
          Informations de Contact
        </h4>
        <ContactFields
          formData={formData}
          onChange={onFormChange}
          errors={validationErrors}
          touched={touchedFields}
        />
      </div>

      <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800">
        <h4 className="text-sm font-bold text-brand-900 dark:text-white mb-4 uppercase tracking-wider">
          Adresse et Légal
        </h4>
        <AddressFields
          formData={formData}
          onChange={onFormChange}
          errors={validationErrors}
          touched={touchedFields}
        />
        <div className="mt-4">
          <FormFieldValidated
            label="Numéro SIRET"
            name="siret"
            value={formData.siret || ""}
            onChange={handleChange}
            error={validationErrors.siret}
            touched={touchedFields.siret}
            placeholder="14 chiffres"
          />
        </div>
      </div>

      <div>
        <TextAreaField
          label="Notes"
          name="notes"
          value={formData.notes || ""}
          onChange={handleChange}
          placeholder="Conditions de paiement, interlocuteurs privilégiés..."
        />
      </div>
    </div>
  );
};
