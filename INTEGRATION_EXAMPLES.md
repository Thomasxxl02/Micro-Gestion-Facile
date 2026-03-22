/**
 * INTEGRATION_EXAMPLES.md
 * 
 * Exemples d'intégration de la validation dans les composants existants
 * Copier-coller les sections pour intégrer rapidement la validation
 */

# 🔧 Exemples d'Intégration Validation

## 1️⃣ ClientManager - Intégration Complète

### Import ajouté:
```tsx
import { useFormValidation } from '../hooks/useFormValidation';
import { FormFieldValidated, EmailField, SIRETField, PhoneField, PostalCodeField } from './FormFieldValidated';
import {
  validateName,
  validateEmail,
  validateSIRET,
  validateFrenchPhone,
  validateAddress,
  validateFrenchPostalCode,
} from '../lib/validators';
```

### Hook initialisé dans le composant:
```tsx
const ClientManager: React.FC<ClientManagerProps> = ({ clients, onSave }) => {
  const form = useFormValidation<Client>(
    {
      id: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      siret: '',
      contactName: '',
    },
    {
      name: validateName,
      email: validateEmail,
      phone: validateFrenchPhone,
      address: validateAddress,
      siret: validateSIRET,
      contactName: validateName, // Optionnel mais si rempli, doit être valide
    },
    {
      validateOnChange: true,
      showErrorsAfterBlur: false, // UX: afficher erreurs en temps réel
    }
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Valider tous les champs
    if (!form.validate()) {
      // Les erreurs sont désormais dans form.errors
      console.log('Erreurs:', form.errors);
      return; // N'afficher que les erreurs, pas de submit
    }

    // Soumettre
    const newClient: Client = {
      ...form.data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      archived: false,
    };
    onSave?.(newClient);
    form.setData(initialData); // Réinitialiser
  };

  return (
    <EntityModal
      isOpen={form.isPanelOpen}
      title={form.isEditing ? 'Modifier le client' : 'Nouveau client'}
      onClose={form.closePanel}
      onSubmit={handleSubmit}
      submitDisabled={!form.isFormValid}
    >
      {/* Champs avec validation intégrée */}
      <FormFieldValidated
        label="Nom client"
        value={form.data.name}
        onChange={form.handleChange('name')}
        onBlur={form.handleBlur('name')}
        required
      />

      <EmailField
        label="Email"
        value={form.data.email}
        onChange={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
        required
      />

      <PhoneField
        label="Téléphone"
        value={form.data.phone}
        onChange={form.handleChange('phone')}
        onBlur={form.handleBlur('phone')}
      />

      <FormFieldValidated
        label="Adresse"
        type="text"
        value={form.data.address}
        onChange={form.handleChange('address')}
        onBlur={form.handleBlur('address')}
        validator={validateAddress}
      />

      <SIRETField
        label="SIRET (optionnel)"
        value={form.data.siret || ''}
        onChange={form.handleChange('siret')}
        onBlur={form.handleBlur('siret')}
        description="14 chiffres pour facturation B2B"
      />

      <FormFieldValidated
        label="Personne de contact"
        type="text"
        value={form.data.contactName || ''}
        onChange={form.handleChange('contactName')}
        validator={validateName}
      />
    </EntityModal>
  );
};
```

---

## 2️⃣ SupplierManager - Intégration SIRET + IBAN

### Import:
```tsx
import { useFormValidation } from '../hooks/useFormValidation';
import { SIRETField, IBANField, PhoneField, VATField } from './FormFieldValidated';
import {
  validateName,
  validateEmail,
  validateSIRET,
  validateIBAN,
  validateVATNumber,
  validateFrenchPhone,
} from '../lib/validators';
```

### Hook:
```tsx
const form = useFormValidation<Supplier>(
  {
    id: '',
    name: '',
    email: '',
    phone: '',
    siret: '',
    tvaNumber: '',
    iban: '', // Nouveau champ pour IBAN
  },
  {
    name: validateName,
    email: validateEmail,
    phone: validateFrenchPhone,
    siret: validateSIRET,
    tvaNumber: validateVATNumber,
    iban: validateIBAN,
  },
  { validateOnChange: true }
);
```

### Formulaire:
```tsx
<FormFieldValidated
  label="Nom fournisseur"
  value={form.data.name}
  onChange={form.handleChange('name')}
  required
/>

<EmailField
  label="Email"
  value={form.data.email}
  onChange={form.handleChange('email')}
/>

<PhoneField
  label="Téléphone"
  value={form.data.phone}
  onChange={form.handleChange('phone')}
/>

<SIRETField
  label="SIRET"
  value={form.data.siret || ''}
  onChange={form.handleChange('siret')}
  description="Utilisé pour factures Factur-X"
/>

<VATField
  label="Numéro TVA"
  value={form.data.tvaNumber || ''}
  onChange={form.handleChange('tvaNumber')}
  description="Format: FR12345678901"
/>

<IBANField
  label="IBAN (pour virements)"
  value={form.data.iban || ''}
  onChange={form.handleChange('iban')}
  description="Compte bancaire pour paiements automatiques"
/>
```

---

## 3️⃣ ProductManager - Validation des Prix

### Import:
```tsx
import { useFormValidation } from '../hooks/useFormValidation';
import { FormFieldValidated, AmountField } from './FormFieldValidated';
import { validateName, validateAmount } from '../lib/validators';
```

### Hook:
```tsx
const form = useFormValidation<Product>(
  {
    id: '',
    name: '',
    description: '',
    price: 0,
    type: 'service',
  },
  {
    name: validateName,
    description: validateRequired,
    price: validateAmount,
  }
);
```

### Formulaire:
```tsx
<FormFieldValidated
  label="Nom produit/service"
  value={form.data.name}
  onChange={form.handleChange('name')}
  required
/>

<FormFieldValidated
  label="Description"
  type="textarea"
  value={form.data.description}
  onChange={form.handleChange('description')}
/>

<AmountField
  label="Prix unitaire (€)"
  value={form.data.price}
  onChange={form.handleChange('price')}
  required
/>
```

---

## 4️⃣ EntityFormFields - Mise à jour des Composants Groupés

### ContactFields avec validation:
```tsx
interface ContactFieldsProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  nameError?: string;
  emailError?: string;
  phoneError?: string;
  contactNameLabel?: string;
  required?: boolean;
}

export const ContactFields: React.FC<ContactFieldsProps> = ({
  name,
  email,
  phone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  nameError,
  emailError,
  phoneError,
  contactNameLabel = 'Nom',
  required = true,
}) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <FormFieldValidated
      label={contactNameLabel}
      value={name}
      onChange={onNameChange}
      type="text"
      validationType="name"
      error={nameError}
      required={required}
    />
    <FormFieldValidated
      label="Email"
      value={email}
      onChange={onEmailChange}
      type="email"
      error={emailError}
      required={required}
    />
    <FormFieldValidated
      label="Téléphone"
      value={phone}
      onChange={onPhoneChange}
      type="tel"
      validationType="phone"
      error={phoneError}
    />
  </div>
);
```

### FinancialFields avec validation IBAN/SIRET:
```tsx
interface FinancialFieldsProps {
  iban?: string;
  siret?: string;
  tvaNumber?: string;
  onIbanChange?: (value: string) => void;
  onSiretChange?: (value: string) => void;
  onTvaChange?: (value: string) => void;
  ibanError?: string;
  siretError?: string;
  tvaError?: string;
}

export const FinancialFields: React.FC<FinancialFieldsProps> = ({
  iban,
  siret,
  tvaNumber,
  onIbanChange,
  onSiretChange,
  onTvaChange,
  ibanError,
  siretError,
  tvaError,
}) => (
  <div className="space-y-4">
    {onSiretChange && (
      <SIRETField
        label="SIRET"
        value={siret || ''}
        onChange={onSiretChange}
        description="14 chiffres"
        error={siretError}
      />
    )}

    {onIbanChange && (
      <IBANField
        label="IBAN"
        value={iban || ''}
        onChange={onIbanChange}
        description="Pour virements automatiques"
        error={ibanError}
      />
    )}

    {onTvaChange && (
      <VATField
        label="Numéro TVA"
        value={tvaNumber || ''}
        onChange={onTvaChange}
        description="Format: FR + 11 caractères"
        error={tvaError}
      />
    )}
  </div>
);
```

---

## 5️⃣ InvoiceManager - Validation des Emails

### Ajouter validation avant envoi par email:

```tsx
import { useFormValidation } from '../hooks/useFormValidation';
import { EmailField } from './FormFieldValidated';
import { validateEmail } from '../lib/validators';

// Dans le modal d'envoi de facture
const EmailInvoiceModal = ({ invoice, onSend }) => {
  const { data, errors, handleChange, validate, isFormValid } = useFormValidation<{
    recipientEmail: string;
    ccEmails: string;
    subject: string;
  }>(
    {
      recipientEmail: invoice.client.email,
      ccEmails: '',
      subject: `Facture ${invoice.number}`,
    },
    {
      recipientEmail: validateEmail,
      // Optionnel: valider format d'emails séparés par virgule
      // ccEmails: (value) => {
      //   if (!value) return { valid: true };
      //   const emails = value.split(',').map(e => e.trim());
      //   return emails.every(e => validateEmail(e).valid)
      //     ? { valid: true }
      //     : { valid: false, error: 'Emails invalides' };
      // }
    }
  );

  const handleSendEmail = async () => {
    if (!validate()) return; // Ne pas envoyer si erreurs

    await sendInvoiceByEmail(invoice.id, data.recipientEmail, data.ccEmails);
    onSend();
  };

  return (
    <div className="space-y-4">
      <EmailField
        label="Destinataire"
        value={data.recipientEmail}
        onChange={handleChange('recipientEmail')}
        required
      />

      <FormFieldValidated
        label="CC (optionnel)"
        type="email"
        value={data.ccEmails}
        onChange={handleChange('ccEmails')}
        description="Emails séparés par virgule"
      />

      <FormFieldValidated
        label="Sujet"
        type="text"
        value={data.subject}
        onChange={handleChange('subject')}
      />

      <button
        onClick={handleSendEmail}
        disabled={!isFormValid}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Envoyer
      </button>
    </div>
  );
};
```

---

## ✅ Checklist d'Implémentation

### Pour chaque Manager (Client, Supplier, Product):
- [ ] Importer `useFormValidation` 
- [ ] Importer les validateurs nécessaires
- [ ] Initialiser le hook dans le composant
- [ ] Remplacer `FormField` par `FormFieldValidated` ou presets
- [ ] Passer les handlers `handleChange` et `handleBlur` du hook
- [ ] Désactiver le bouton submit si `!form.isFormValid`
- [ ] Tester chaque champ (valide, invalide, edge cases)

### Tests à ajouter:
```tsx
// __tests__/components/ClientManager.test.tsx
describe('ClientManager - Validation', () => {
  it('should reject invalid email', async () => {
    render(<ClientManager {...props} />);
    
    const emailInput = screen.getByLabelText('Email');
    await userEvent.type(emailInput, 'invalid-email');
    
    expect(screen.getByText('Email invalide')).toBeInTheDocument();
  });

  it('should accept valid SIRET', async () => {
    render(<ClientManager {...props} />);
    
    const siretInput = screen.getByLabelText('SIRET');
    await userEvent.type(siretInput, '73282932000074');
    
    expect(screen.queryByText(/SIRET invalide/)).not.toBeInTheDocument();
  });

  it('should disable submit if form invalid', async () => {
    render(<ClientManager {...props} />);
    
    // Formulaire vide = invalide
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
  });
});
```

---

## 🚀 Plan de Déploiement

1. **Semaine 1**: 
   - [ ] Intégrer validation dans ClientManager
   - [ ] Tests + bug fixes
   - [ ] Déployer en production

2. **Semaine 2**:
   - [ ] Intégrer dans SupplierManager
   - [ ] Intégrer dans ProductManager
   - [ ] Tests

3. **Semaine 3**:
   - [ ] Intégrer dans InvoiceManager (emails)
   - [ ] Mettre à jour EntityFormFields globalement
   - [ ] Documentation utilisateur

