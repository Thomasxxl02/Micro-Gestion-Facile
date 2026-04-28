import React from "react";
import { ContactFields, AddressFields } from "../EntityFormFields";
import { FormFieldValidated } from "../FormFieldValidated";
import { TextAreaField } from "../FormFields";
import { type Client } from "../../types";

interface ClientFormProps {
  validatedData: Partial<Client>;
  validationErrors: any;
  touchedFields: any;
  handleFormChange: (field: keyof Client) => (value: any) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  validatedData,
  validationErrors,
  touchedFields,
  handleFormChange,
}) => {
  return (
    <div className="space-y-6">
      <ContactFields
        name={validatedData.name || ""}
        email={validatedData.email || ""}
        phone={validatedData.phone ?? ""}
        onNameChange={(val) => handleFormChange("name")(val)}
        onEmailChange={(val) => handleFormChange("email")(val)}
        onPhoneChange={(val) => handleFormChange("phone")(val)}
        required={true}
        validationErrors={validationErrors}
        touchedFields={touchedFields}
      />

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
          Identité Professionnelle & Paiement
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldValidated
            label="SIRET"
            value={validatedData.siret ?? ""}
            onChange={(val) => handleFormChange("siret")(val)}
            validationType="siret"
            error={validationErrors.siret}
            touched={touchedFields.siret}
          />
          <FormFieldValidated
            label="N° TVA (optionnel)"
            value={validatedData.tvaNumber ?? ""}
            onChange={(val) => handleFormChange("tvaNumber")(val)}
            validationType="vat"
            error={validationErrors.tvaNumber}
            touched={touchedFields.tvaNumber}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldValidated
            label="Délai de paiement (jours)"
            value={validatedData.paymentTerms ?? "30"}
            onChange={(val) => handleFormChange("paymentTerms")(val)}
            type="number"
            validationType="amount"
            error={validationErrors.paymentTerms}
            touched={touchedFields.paymentTerms}
          />
          <FormFieldValidated
            label="Site Web"
            value={validatedData.website ?? ""}
            onChange={(val) => handleFormChange("website")(val)}
            validationType="website"
            error={validationErrors.website}
            touched={touchedFields.website}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">
          Localisation & Notes
        </h4>
        <AddressFields
          address={validatedData.address || ""}
          postalCode={""}
          city={""}
          onAddressChange={(val) => handleFormChange("address")(val)}
          onPostalCodeChange={() => undefined}
          onCityChange={() => undefined}
          showPostalCity={false}
          validationErrors={validationErrors}
          touchedFields={touchedFields}
        />
        <TextAreaField
          label="Notes"
          value={validatedData.notes ?? ""}
          onChange={(val) => handleFormChange("notes")(val)}
          rows={3}
        />
      </div>
    </div>
  );
};
