import React from "react";
import type { Supplier } from "../../types";
import { AddressFields, ContactFields } from "../EntityFormFields";
import { FormFieldValidated } from "../FormFieldValidated";
import { TextAreaField } from "../FormFields";
import type { ValidationResult } from "../../lib/zod-schemas";

interface SupplierFormProps {
  formData: Partial<Supplier>;
  validationErrors: Record<string, ValidationResult | undefined>;
  touchedFields: Record<string, boolean>;
  onFormChange: (data: Partial<Supplier>) => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  formData,
  validationErrors,
  touchedFields,
  onFormChange,
}) => {
  const handleValueChange = (name: string) => (value: string) => {
    onFormChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormFieldValidated
          label="Nom de l'entreprise"
          value={formData.name || ""}
          onChange={handleValueChange("name")}
          error={validationErrors.name}
          touched={touchedFields.name}
          placeholder="Ex: Leroy Merlin, AWS, etc."
          required
        />
        <FormFieldValidated
          label="Catégorie"
          value={formData.category || ""}
          onChange={handleValueChange("category")}
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
          name={formData.contactName || ""}
          email={formData.email || ""}
          phone={formData.phone || ""}
          onNameChange={handleValueChange("contactName")}
          onEmailChange={handleValueChange("email")}
          onPhoneChange={handleValueChange("phone")}
          validationErrors={validationErrors}
          touchedFields={touchedFields}
        />
      </div>

      <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800">
        <h4 className="text-sm font-bold text-brand-900 dark:text-white mb-4 uppercase tracking-wider">
          Adresse et Légal
        </h4>
        <AddressFields
          address={formData.address || ""}
          postalCode=""
          city=""
          onAddressChange={handleValueChange("address")}
          onPostalCodeChange={() => {}}
          onCityChange={() => {}}
          showPostalCity={false}
          validationErrors={validationErrors}
          touchedFields={touchedFields}
        />
        <div className="mt-4">
          <FormFieldValidated
            label="Numéro SIRET"
            value={formData.siret || ""}
            onChange={handleValueChange("siret")}
            error={validationErrors.siret}
            touched={touchedFields.siret}
            placeholder="14 chiffres"
          />
        </div>
      </div>

      <div>
        <TextAreaField
          label="Notes"
          value={formData.notes || ""}
          onChange={handleValueChange("notes")}
          placeholder="Conditions de paiement, interlocuteurs privilégiés..."
        />
      </div>
    </div>
  );
};
