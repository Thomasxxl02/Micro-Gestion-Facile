# 📋 Validation de Formulaires - Guide Complet

## 🎯 Vue d'ensemble

Votre PWA a maintenant un système **complet de validation de formulaires** pour tous les métiers critiques français et européens.

### ✅ Validateurs inclus

| Validateur       | Format                                | Exemple                       | Cas d'usage                |
| ---------------- | ------------------------------------- | ----------------------------- | -------------------------- |
| **SIRET**        | 14 chiffres + checksum Luhn           | `73282932000074`              | Client, Supplier, factures |
| **SIREN**        | 9 chiffres                            | `732829320`                   | Entreprises                |
| **IBAN**         | 2 lettres + 2 chiffres + max 30 chars | `FR1420041010050500013M02800` | Virements, paiements       |
| **Email**        | Standard + vérification               | `contact@example.com`         | Tous les formulaires       |
| **Code postal**  | 5 chiffres français ou DOM-TOM        | `75001`, `97110`              | Adresses                   |
| **Téléphone**    | 10 chiffres français                  | `0123456789`                  | Contacts                   |
| **TVA intracom** | Code pays + 11 chars                  | `FR12345678901`               | Clients/Suppliers B2B      |
| **Site web**     | URL HTTP(S)                           | `https://example.com`         | Profils                    |
| **Nom**          | 2+ caractères, accents OK             | `François Müller`             | Noms génériques            |
| **Montant**      | Positif, max 2 décimales              | `100.50`                      | Prix, factures             |
| **Date**         | ISO ou Date object                    | `2024-03-21`                  | Dates                      |
| **Adresse**      | 5+ caractères                         | `123 Main Street`             | Adresses complètes         |

---

## 🚀 Utilisation Rapide

### Option 1: Composant Simple (Auto-détection)

```tsx
import { FormFieldValidated, EmailField, SIRETField } from '@/components/FormFieldValidated';

export function ClientForm() {
  const [email, setEmail] = useState('');
  const [siret, setSiret] = useState('');

  return (
    <>
      {/* Auto-détection par type HTML */}
      <FormFieldValidated label="Email" type="email" value={email} onChange={setEmail} />

      {/* Preset spécialisé */}
      <SIRETField label="SIRET" value={siret} onChange={setSiret} required />
    </>
  );
}
```

### Option 2: Hook de Validation (Contrôle Avancé)

```tsx
import { useFormValidation } from '@/hooks/useFormValidation';
import { validateEmail, validateSIRET, validateName } from '@/lib/validators';
import { FormFieldValidated } from '@/components/FormFieldValidated';

export function AdvancedForm() {
  const { data, errors, handleChange, handleBlur, validate, isFormValid } = useFormValidation(
    {
      name: '',
      email: '',
      siret: '',
    },
    {
      name: validateName,
      email: validateEmail,
      siret: validateSIRET,
    },
    {
      validateOnChange: true,
      showErrorsAfterBlur: false,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      console.log('Erreurs:', errors);
      return;
    }

    // Soumettre le formulaire
    await saveClient(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormFieldValidated
        label="Nom"
        value={data.name}
        onChange={handleChange('name')}
        onBlur={handleBlur('name')}
        error={errors.name?.error}
      />

      <FormFieldValidated
        label="Email"
        type="email"
        value={data.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={errors.email?.error}
      />

      <SIRETField label="SIRET" value={data.siret} onChange={handleChange('siret')} required />

      <button type="submit" disabled={!isFormValid}>
        Enregistrer
      </button>
    </form>
  );
}
```

### Option 3: Validation Batch (Plusieurs champs à la fois)

```tsx
import { validateBatch, validateName, validateEmail, validateSIRET } from '@/lib/validators';

// Valider plusieurs champs d'un coup
const results = validateBatch(
  {
    name: 'François Dupont',
    email: 'invalid-email',
    siret: '73282932000074',
  },
  {
    name: validateName,
    email: validateEmail,
    siret: validateSIRET,
  }
);

// Résultats:
// {
//   name: { valid: true },
//   email: { valid: false, error: 'Email invalide' },
//   siret: { valid: true }
// }
```

---

## 📚 Présets Disponibles

Pour les cas courants, utilisez les présets (components spécialisés) :

```tsx
import {
  SIRETField,      // SIRET (14 chiffres)
  SIRENField,      // SIREN (9 chiffres)
  IBANField,       // IBAN bancaires
  EmailField,      // Email
  PhoneField,      // Téléphone français
  PostalCodeField, // Code postal FR
  VATField,        // Numéro TVA
  WebsiteField,    // URL
  AmountField,     // Montants monétaires
} from '@/components/FormFieldValidated';

// Utilisation simple
<EmailField
  label="Email client"
  value={email}
  onChange={setEmail}
  required
/>

<SIRETField
  label="SIRET du fournisseur"
  value={siret}
  onChange={setSiret}
  description="14 chiffres, ex: 73282932000074"
/>
```

---

## 🔧 Intégration dans les Composants Existants

### Mettre à jour ClientManager

```tsx
import { useFormValidation } from '@/hooks/useFormValidation';
import { FormFieldValidated, EmailField, SIRETField } from '@/components/FormFieldValidated';
import { validateName, validateAddress, validatePhone } from '@/lib/validators';

export function ClientManager({ clients, onSave }) {
  const { data, errors, handleChange, handleBlur, validate, isFormValid } = useFormValidation(
    {
      name: '',
      email: '',
      siret: '',
      address: '',
      phone: '',
    },
    {
      name: validateName,
      email: validateEmail,
      siret: validateSIRET,
      address: validateAddress,
      phone: validateFrenchPhone,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSave({
      ...data,
      id: Date.now().toString(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormFieldValidated
        label="Nom"
        value={data.name}
        onChange={handleChange('name')}
        onBlur={handleBlur('name')}
        error={errors.name?.error}
        required
      />

      <EmailField
        label="Email"
        value={data.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        required
      />

      <SIRETField label="SIRET" value={data.siret} onChange={handleChange('siret')} />

      <FormFieldValidated
        label="Adresse"
        type="text"
        value={data.address}
        onChange={handleChange('address')}
        validator={validateAddress}
      />

      <PhoneField label="Téléphone" value={data.phone} onChange={handleChange('phone')} />

      <button
        type="submit"
        disabled={!isFormValid}
        className="bg-brand-900 text-white px-6 py-2 rounded-lg"
      >
        Enregistrer
      </button>
    </form>
  );
}
```

### Mettre à jour SupplierManager

```tsx
import { SIRETField, IBANField, VATField, PhoneField } from '@/components/FormFieldValidated';

export function SupplierForm() {
  const { data, errors, handleChange, isFormValid } = useFormValidation(
    { name: '', siret: '', iban: '', vat: '', phone: '' },
    {
      name: validateName,
      siret: validateSIRET,
      iban: validateIBAN,
      vat: validateVATNumber,
      phone: validateFrenchPhone,
    }
  );

  return (
    <form>
      <FormFieldValidated
        label="Nom fournisseur"
        value={data.name}
        onChange={handleChange('name')}
        required
      />

      <SIRETField label="SIRET" value={data.siret} onChange={handleChange('siret')} />

      <IBANField
        label="IBAN (paiements)"
        value={data.iban}
        onChange={handleChange('iban')}
        description="Pour virements automatiques"
      />

      <VATField
        label="Numéro TVA"
        value={data.vat}
        onChange={handleChange('vat')}
        description="Optionnel si particulier"
      />

      <PhoneField label="Téléphone" value={data.phone} onChange={handleChange('phone')} />

      <button disabled={!isFormValid}>Enregistrer</button>
    </form>
  );
}
```

---

## 🧪 Tests pour vos Validations

Tous les validateurs ont des tests complels. Pour vérifier:

```bash
npm run test -- __tests__/lib/validators.test.ts
```

### Ajouter un test personnalisé

```tsx
import { validateEmail } from '@/lib/validators';
import { describe, it, expect } from 'vitest';

describe('Custom validation', () => {
  it('should validate my domain', () => {
    const result = validateEmail('user@mydomain.fr');
    expect(result.valid).toBe(true);
  });
});
```

---

## 📋 liste de Tâches pour Intégration Complète

### Phase 1: Composants critiques (2-3h)

- [ ] Mettre à jour `ClientManager` avec `useFormValidation`
- [ ] Mettre à jour `SupplierManager` avec validations SIRET/IBAN
- [ ] Intégrer validation SIRET dans le profil utilisateur

### Phase 2: Intégration globale (2-3h)

- [ ] Remplacer `FormField` classique par `FormFieldValidated` partout
- [ ] Intégrer dans `EntityFormFields.tsx` (ContactFields, AddressFields)
- [ ] Tester dans `InvoiceManager` (emails clients)

### Phase 3: Tests (1-2h)

- [ ] Tests des hooks `useFormValidation`
- [ ] Tests d'intégration end-to-end
- [ ] Tests d'a11y des messages d'erreur

### Phase 4: Documentation (1h)

- [ ] Mettre à jour README avec exemples
- [ ] Ajouter guide des erreurs courantes

---

## ⚠️ Points d'Attention

### 1. Optionnel vs Obligatoire

```tsx
// Optionnel - l'utilisateur peut laisser vide
<VATField label="TVA" value={vat} onChange={setVat} />

// Obligatoire - doit être rempli et valide
<EmailField label="Email" value={email} onChange={setEmail} required />
```

### 2. Validation Temps Réel vs Au Blur

```tsx
// Valide pendant qu'on tape (feedback immédiat)
<FormFieldValidated
  {...props}
  validateOnChange={true}
  validateOnBlur={false}
/>

// Valide seulement au blur (moins agressif)
<FormFieldValidated
  {...props}
  validateOnChange={false}
  validateOnBlur={true}
/>
```

### 3. Messages d'Erreur Personnalisés

```tsx
// Valider PUIS afficher erreur custom
const handleValidate = (value: string) => {
  const result = validateEmail(value);
  if (!result.valid) {
    showNotification(`⚠️  ${result.error}`);
  }
  return result;
};
```

---

## 🔄 Migration depuis FormField classique

**Avant (sans validation):**

```tsx
<FormField label="Email" type="email" value={email} onChange={setEmail} error={manualError} />
```

**Après (avec validation auto):**

```tsx
<EmailField label="Email" value={email} onChange={setEmail} required />
// Validation automatique, messages d'erreur intégrés
```

---

## 📞 Support & Debugging

### "Mon validation ne marche pas!"

1. Vérifier que le validateur est importé correctement

   ```tsx
   import { validateSIRET } from '@/lib/validators'; // ✅
   ```

2. Vérifier que `useFormValidation` gère les erreurs

   ```tsx
   const { errors } = useFormValidation(...);
   console.log('Erreurs:', errors); // Affiche quoi?
   ```

3. Tester le validateur directement:
   ```tsx
   const result = validateSIRET('73282932000074');
   console.log(result); // { valid: true }
   ```

### "Je veux validation custom"

```tsx
// Option 1: Créer un validateur personnalisé
function validateCustomSIRET(siret: string): ValidationResult {
  // Logique personnalisée
  return { valid: true/false, error?: 'message' };
}

// Option 2: Utiliser validator prop
<FormFieldValidated
  validator={validateCustomSIRET}
  {...props}
/>
```

---

## ✨ Prochaines Améliorations Possibles

- [ ] Validation asynchrone (vérifier SIRET via API SIREN)
- [ ] Internationalisation des messages d'erreur
- [ ] Validation sur submit avec erreurs groupées
- [ ] Auto-correction (ex: formatage SIRET auto)
- [ ] Validation d'unicité (ex: email déjà utilisé)
