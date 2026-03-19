# 🔄 Portabilité des données

**Votre droit:** Accéder, exporter et récupérer TOUTES vos données à tout moment, sans dépendance à notre service.

---

## ✅ Ce que vous pouvez faire

### **1. Exporter tout en JSON**

```bash
# Via l'interface
Settings → Export → JSON (All data)
# ↓
donnees-micro-gestion-facile-2026-03-19.json
```

**Contenu:**

```json
{
  "version": "1.0",
  "exportedAt": "2026-03-19T14:30:00Z",
  "userProfile": {
    /* ... */
  },
  "invoices": [
    /* ... */
  ],
  "clients": [
    /* ... */
  ],
  "suppliers": [
    /* ... */
  ],
  "products": [
    /* ... */
  ],
  "expenses": [
    /* ... */
  ],
  "emails": [
    /* ... */
  ],
  "emailTemplates": [
    /* ... */
  ],
  "calendarEvents": [
    /* ... */
  ]
}
```

### **2. Exporter en CSV (par collection)**

```bash
# Via l'interface
Each manager → Export → CSV
# ↓
invoices-2026.csv
clients-2026.csv
suppliers-2026.csv
```

**Format standard:**

```csv
ID,Name,Email,Phone,CreatedAt,Status
"INV-001","Client A","a@example.com","0123456789","2026-01-15","paid"
```

### **3. Exporter en PDF (documents)**

```bash
# Via l'interface
Invoice → Preview → Export → PDF/PDF-A3

# Format Factur-X compatible (standard France)
facture-INV-001.pdf
```

### **4. Importer données (future v1.1)**

```bash
# Via l'interface
Settings → Import → Select JSON file
# ↓ Validation + Merge
Données intégrées
```

---

## 🔧 Formats d'export supportées

### **JSON (natif)**

**Avantages:**

- Structure complète + métadonnées
- Valide pour ré-import
- Humain-lisible

**Cas d'usage:**

- Backup personnel
- Migration entre instances
- Analyse/audits

### **CSV (tabulaire)**

**Avantages:**

- Importable dans Excel/Google Sheets
- Manipulable facilement
- Standard universel

**Limitation:** Pas de données imbriquées (items factures)

### **PDF-A3 (audit-proof)**

**Avantages:**

- Archive légale
- Lisible 50 ans
- Factur-X conforme France

**Limitation:** Données seulement (lecture)

---

## 📥 Importer vos données

### **Depuis JSON (même format export)**

```typescript
// Pseudo-code futur
const importJSON = async (file: File) => {
  const data = JSON.parse(await file.text());

  // Validation schema
  validateDataSchema(data);

  // Merge strategy
  const merged = await mergeWithExisting({
    strategy: 'rename' | 'overwrite' | 'merge',
    duplicate_key: 'id',
  });

  // Import
  await uploadToFirestore(merged);
};
```

### **Depuis CSV**

```typescript
// Futur: CSV parser + auto-mapping
importCSV(file, {
  collection: 'invoices',
  headerMapping: {
    ID: 'id',
    Name: 'name',
    Email: 'email',
  },
});
```

### **Depuis autre service**

```typescript
// Intégrations planifiées
importFromZapier(); // API → données
importFromObviously(); // Export format
importFromBilleo(); // Format competitor
```

---

## 🔐 Données personnelles

### **Données collectées**

| Donnée          | Sensibilité | Visible   | Éditable |
| --------------- | ----------- | --------- | -------- |
| Email           | Moyenne     | Oui       | Oui      |
| Nom entreprise  | Faible      | Oui       | Oui      |
| SIRET           | Haute       | User only | Oui      |
| Revenus         | Très haute  | User only | Oui      |
| Adresse         | Moyenne     | Oui       | Oui      |
| Clients (liste) | Moyenne     | Oui       | Oui      |

### **Données NON collectées**

```javascript
// ✅ Nous ne sauvons PAS
- Password (Firebase manage)
- IP address logs
- Browser fingerprint
- Location data
- Device ID
- Behavioral analytics
- Marketing tracking
```

---

## 🚮 Droit à l'oubli

### **Suppression compte**

```bash
Settings → Danger Zone → Delete my account
# ↓
⚠️ Confirmez (irréversible)
# ↓
1. Sauvegarde JSON proposée
2. Toutes données supprimées
3. Compte Firebase supprimé
4. RGPD compliance: 30j retention max
```

**Processus:**

```
User request → Trigger cloud function →
  Delete Firestore docs (uid=user.uid) →
  Delete Firebase Auth →
  Delete IP logs (retention 30j)
```

### **Suppression sélective**

```bash
Per collection:
  Invoices → Select → Bulk Delete

Per document:
  Invoice detail → More → Delete
```

---

## 🔄 Migration vers autre service

### **Étape 1: Exporter depuis Micro-Gestion**

```bash
Settings → Export → JSON
# donnees-backup.json
```

### **Étape 2: Vérifier format**

```bash
npm run tools:validate donnees-backup.json
# ✅ Valid schema
```

### **Étape 3: Transformer pour cible**

```bash
# Format Factur-X → PDF
npm run tools:export-pdf donnees-backup.json

# Format Supabase (futur)
npm run tools:export-supabase donnees-backup.json

# Format SQL (futur)
npm run tools:export-sql donnees-backup.json
```

### **Étape 4: Importer ailleurs**

```bash
# Supabase ou autre service
supabase import donnees-backup.json

# Ou Excel
open donnees-backup.csv (in Excel)
```

---

## 📊 Scripts utilitaires (CLI)

### **Installation**

```bash
npm install -g micro-gestion-facile-tools
# ou
npx micro-gestion-tools <command>
```

### **Commandes**

```bash
# Exporter
mgf export --format json --output backup.json
mgf export --format csv --collection invoices --output invoices.csv
mgf export --format pdf --output documents.pdf

# Valider
mgf validate backup.json
mgf validate --schema types

# Transformer
mgf transform --from json --to csv input.json output.csv
mgf transform --from json --to sql input.json output.sql

# Importer (simulation)
mgf import --file backup.json --dry-run
mgf import --file backup.json --confirm

#Statistiques
mgf stats
# ↓
# Total invoices: 42
# Total clients: 15
# Total revenue: €45,320
# Data size: 2.3 MB
```

---

## 🔒 Chiffrement E2E (optionnel)

### **Exporter chiffré**

```bash
Settings → Export → JSON
  → Enable encryption: AES-256
  → Password: ••••••••
# ↓
donnees-encrypted.json.enc
```

**Fichier chiffré:**

```json
{
  "version": "1.0",
  "encrypted": true,
  "algorithm": "AES-256-GCM",
  "salt": "hex...",
  "iv": "hex...",
  "data": "hex..."
}
```

### **Déchiffrer**

```bash
mgf decrypt donnees-encrypted.json.enc
  → Enter password: ••••••••
# ↓
donnees-decrypted.json
```

---

## 📌 Checklist de conformité

- [x] **RGPD Art. 15** - Droit d'accès ✅ Export JSON complété
- [x] **RGPD Art. 20** - Droit à la portabilité ✅ Format machine-lisible
- [x] **RGPD Art. 17** - Droit à l'oubli ✅ Deletion flow impl.
- [x] **Décret 2014-343** - Archivage fiscal ✅ PDF-A3 support
- [x] **Loi Finances 2026** - Souveraineté données ✅ Export facilité

---

## Roadmap

### **v1.0 (actuel)**

- ✅ Export JSON complet
- ✅ Export CSV par collection
- ✅ Droit à l'oubli
- ⏳ Import JSON (WIP)

### **v1.1 (Q2 2026)**

- [ ] Import CSV
- [ ] Chiffrement E2E
- [ ] Intégrations tiers
- [ ] CLI tools standalone

### **v1.2 (Q3 2026)**

- [ ] Sync multi-device
- [ ] Backup automatique
- [ ] Versioning données

---

## 🆘 Problèmes & Solutions

### **Pb: Fichier JSON trop gros**

```bash
# Solution: Exporter par année
Settings → Export → Custom
  → Filter: Year = 2026
  → Format: JSON
```

### **Pb: Import échoue**

```bash
# Debug dans les logs
mgf validate backup.json --verbose
# ↓ voir erreurs spécifiques

# Nettoyer avant import
mgf clean backup.json --remove-duplicates
```

### **Pb: Données sensibles exposées**

```bash
# Chiffrer avant partage
mgf encrypt backup.json --password secure123
# ↓
backup.json.enc (safe to share)
```

### **Pb: Migration vers Supabase**

```bash
# Convertir format
mgf transform --from json --to supabase backup.json

# Importer
supabase db push backup.sql
```

---

## 📞 Support

Besoin d'aide?

- **GitHub Issues:** Problèmes spécifiques
- **Discussions:** Questions générales
- **Email:** dpo@micro-gestion-facile.fr

---

**Last updated:** 19 mars 2026  
**Status:** Actif ✅  
**Compliance:** RGPD + Loi Finances 2026
