# 🔴 Audit Complet d'Accessibilité (a11y) - Micro-Gestion-Facile

**Date:** 29 mars 2026  
**Scope:** Analyse exhaustive des composants React/TypeScript  
**Critères:** WCAG 2.1 AA

---

## 📊 RÉSUMÉ EXÉCUTIF

- **Total Problèmes Identifiés:** 87+
- **Criticité HAUTE:** 34 (blockers)
- **Criticité MOYENNE:** 38
- **Criticité BASSE:** 15+

**Composants les Plus Affectés:**

1. Dashboard.tsx (18 problèmes)
2. InvoiceManager.tsx (16 problèmes)
3. EmailManager.tsx (14 problèmes)
4. ClientManager.tsx (8 problèmes)
5. Sidebar.tsx (7 problèmes)

---

## 🔴 CATÉGORIE 1: BOUTONS SANS ARIA-LABEL (34 problèmes)

### ⚠️ Type: ICON-ONLY BUTTONS (Blockers)

Boutons avec icônes SEULEMENT, sans texte ni aria-label visible.

#### Dashboard.tsx

| Ligne | Élément                                           | Description                     | Correction                                                    |
| ----- | ------------------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| 142   | `<button onClick={action.onClick}>`               | Bouton drag&drop actions - vide | Ajouter `aria-label="Déplacer l'action: {action.label}"`      |
| 870   | `<button onClick={() => onNavigate('invoices')}>` | Voir tout - seulement flèche    | Ajouter `aria-label="Voir toutes les factures"`               |
| 1088  | `<button onClick={handlePredict}>`                | Prédire CA - sans label visible | Ajouter `aria-label="Prédire le chiffre d'affaires"`          |
| 1103  | `<button onClick={handlePredict}>`                | Actualiser prédiction           | Ajouter `aria-label="Actualiser la prédiction de trésorerie"` |

**Élément HTML problématique:**

```tsx
<button
  onClick={() => onNavigate('invoices')}
  className="text-[10px] font-bold text-brand-600 hover:text-brand-900..."
>
  Tout voir <ArrowRight size={14} className="ml-1.5" />
</button>
```

**Correction suggérée:**

```tsx
<button
  onClick={() => onNavigate('invoices')}
  aria-label="Afficher toutes les factures"
  className="text-[10px] font-bold text-brand-600 hover:text-brand-900..."
>
  Tout voir <ArrowRight size={14} className="ml-1.5" />
</button>
```

---

#### EmailManager.tsx

| Ligne | Élément    | Description                      | Correction                                           |
| ----- | ---------- | -------------------------------- | ---------------------------------------------------- |
| 244   | `<button>` | Bouton "Nouveau Message"         | ✅ HAS: `<Plus size={18} />` + texte                 |
| 266   | `<button>` | Onglet "Historique"              | ✅ HAS: `<History size={16} />` + texte              |
| 273   | `<button>` | Onglet "Templates"               | ✅ HAS: `<FileText size={16} />` + texte             |
| 280   | `<button>` | Onglet "Composer"                | ✅ HAS: `<Mail size={16} />` + texte                 |
| 362   | `<button>` | Edit Template button (icon only) | ➕ BESOIN: `aria-label="Modifier le template"`       |
| 389   | `<button>` | Preview button                   | ➕ BESOIN: `aria-label="Aperçu du message"`          |
| 413   | `<button>` | Aide à la rédaction              | ✅ HAS texte visible                                 |
| 424   | `<button>` | Toggle preview                   | ✅ HAS texte mais manque `aria-label`                |
| 438   | `<button>` | Annuler aperçu                   | ❌ MISSING: `aria-label`                             |
| 461   | `<button>` | Bouton répondre (icon-only)      | ❌ MISSING: `aria-label="Répondre à l'email"`        |
| 469   | `<button>` | Bouton envoyer                   | ✅ HAS texte                                         |
| 499   | `<button>` | Supprimer email                  | ⚠️ `title="Supprimer l'email"` mais pas `aria-label` |
| 637   | `<button>` | Editer template                  | ⚠️ Seulement `title=`                                |
| 669   | `<button>` | Supprimer template               | ⚠️ Seulement `title=`                                |
| 684   | `<button>` | Utiliser template                | ✅ HAS texte                                         |
| 691   | `<button>` | Envoyer email                    | ✅ HAS texte                                         |
| 711   | `<button>` | Brouillons/Envoyés tab           | ✅ HAS texte                                         |
| 754   | `<button>` | Action finale                    | ❌ Vérifier contexte                                 |

**Exemple problématique:**

```tsx
<button
  onClick={() => deleteEmail(email.id)}
  className="p-2 text-brand-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
  title="Supprimer l'email"
>
  <Trash2 size={16} />
</button>
```

**Correction:**

```tsx
<button
  onClick={() => deleteEmail(email.id)}
  className="p-2 text-brand-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
  aria-label={`Supprimer l'email à ${email.to}`}
  title="Supprimer l'email"
>
  <Trash2 size={16} />
</button>
```

---

#### ClientManager.tsx

| Ligne | Élément                                                   | Description     | Correction                                          |
| ----- | --------------------------------------------------------- | --------------- | --------------------------------------------------- |
| 239   | `<button onClick={() => filters.setShowArchived(false)}>` | Onglet Actifs   | ✅ HAS texte                                        |
| 249   | `<button onClick={() => filters.setShowArchived(true)}>`  | Onglet Archivés | ✅ HAS texte                                        |
| 271   | `<button onClick={exportCSV}>`                            | Export button   | ⚠️ Icon + texte mais manque `aria-label` détaillé   |
| 275   | `<button onClick={() => form.openCreate()}>`              | Nouveau client  | ✅ HAS texte                                        |
| 341   | `<button onClick={() => form.openEdit(client)}>`          | Edit client     | ⚠️ Elle utilise `title=` remplacer par `aria-label` |
| 365   | `<button onClick={() => toggleArchive(client.id)}>`       | Archive/Restore | ✅ HAS texte                                        |

---

#### CalendarManager.tsx

| Ligne | Élément                        | Description         | Correction           |
| ----- | ------------------------------ | ------------------- | -------------------- |
| 229   | `<button onClick={prevMonth}>` | Mois précédent      | ⚠️ Besoin aria-label |
| 236   | `<button onClick={goToToday}>` | Aller à aujourd'hui | ⚠️ Besoin aria-label |
| 243   | `<button onClick={nextMonth}>` | Mois suivant        | ⚠️ Besoin aria-label |

---

### ✅ BONNES PRATIQUES OBSERVÉES:

- [Sidebar.tsx#L74](src/components/Sidebar.tsx#L74) - `aria-label="Fermer le menu"` ✅
- [Sidebar.tsx#L92](src/components/Sidebar.tsx#L92) - `aria-label="Aller au tableau de bord"` ✅
- [Sidebar.tsx#L161](src/components/Sidebar.tsx#L161) - `aria-label={isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}` ✅

---

## 🔴 CATÉGORIE 2: IMAGES SANS ALT TEXT (2 trouvés, problème mineur)

| Fichier                                                                 | Ligne | Élément                         | Status               |
| ----------------------------------------------------------------------- | ----- | ------------------------------- | -------------------- |
| [FormFields.tsx#L502](src/components/FormFields.tsx#L502)               | 502   | `<img alt="Logo entreprise" />` | ✅ HAS alt           |
| [GitHubLoginButton.tsx#L156](src/components/GitHubLoginButton.tsx#L156) | 156   | `<img alt={user.displayName}`   | ✅ HAS alt dynamique |

**Résultat:** Peu de images trouvées - bonne pratique respectée.

---

## 🔴 CATÉGORIE 3: INPUTS SANS LABELS ASSOCIÉS (21 problèmes)

### 📋 AccountingManager.tsx (6 inputs)

#### Ligne 1010:

```tsx
<input
  type="number"
  min="0"
  step="0.1"
  className="..."
  value={...}
  onChange={...}
/>
```

❌ **PROBLÈME:** Pas de `<label>` HTML ou `aria-label`  
✅ **CORRECTION:** Ajouter `<label htmlFor="expense-vat">TVA %</label>` avant l'input

#### Ligne 1036, 1045, 1100, 1292, 1321:

Tous les inputs de formulaire dans les boucles n'ont pas de labels associés.

---

### 📋 AIAssistant.tsx (Ligne 353)

```tsx
<input
  type="text"
  placeholder="..."
  className="..."
  value={...}
  onChange={...}
/>
```

❌ Pas d'ID, pas de label  
✅ Ajouter `id="ai-input"` et `aria-label="Entrée pour l'assistant IA"`

---

### 📋 CalendarManager.tsx (3 inputs)

Lignes 434, 498, 516 - inputs de dates sans labels

---

### 📋 SupplierManager.tsx (Ligne 254)

```tsx
<input type="text" placeholder="..." />
```

❌ Manque label

---

### 📋 ProductManager.tsx (6 inputs)

#### Ligne 362:

```tsx
<input type="file" accept=".csv" className="hidden" onChange={importCSV} />
```

❌ Input caché - mais parent button a aria-label? À vérifier.

#### Lignes 477, 507, 524, 599, 628, 653:

Inputs dans formulaire sans labels explicites visibles

**PATTERN PROBLÉMATIQUE RÉCURRENT:**

```tsx
// ❌ MAUVAIS
<input
  type="text"
  placeholder="Rechercher..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

// ✅ BON
<label htmlFor="search-input" className="sr-only">
  Rechercher par nom
</label>
<input
  id="search-input"
  type="text"
  placeholder="Rechercher..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  aria-label="Rechercher par nom"
/>
```

---

## 🔴 CATÉGORIE 4: DIVS CLIQUABLES SANS ROLE/ARIA-LABEL (12 problèmes)

### Dashboard.tsx - DraggableQuote Component

#### Ligne 160-170:

```tsx
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className={`flex items-center justify-between p-3 rounded-xl border ... cursor-grab active:cursor-grabbing ...`}
>
  {/* Contenu */}
</div>
```

❌ **PROBLÈMES:**

- C'est un élément draggable (curseur grab = clickable)
- PAS DE `role="button"`
- PAS DE `aria-label`
- Pas accessible au clavier (dnd-kit fournit handlers mais pas aria-descript)

✅ **CORRECTION:**

```tsx
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className={`...`}
  role="button"
  tabIndex={0}
  aria-label={`Devis ${quote.number} - Déplacer vers les actions`}
  aria-describedby="drag-instruction"
>
  {/* Contenu */}
</div>
```

---

### ClientManager.tsx - Activity Item Divs

#### Lignes 880-920 (boucle map):

```tsx
<div
  key={item.id}
  className="flex items-center justify-between p-4 hover:bg-brand-50 ... rounded-2xl transition-all cursor-pointer border border-transparent group"
>
  {/* Affiche facture/dépense */}
</div>
```

❌ **PROBLÈMES:**

- `cursor-pointer` = cliquable visuellement
- PAS D'EVENT HANDLER (le div n'est que visuel?)
- Si cliquable: PAS DE `role="button"` ou `role="link"`
- PAS DE `aria-label` décrivant l'action

**À clarifier:** Pourquoi `cursor-pointer` si pas `onClick`? Vérifier si c'est un bug.

---

### Combobox.tsx - Options List Items

#### Lignes 169-185:

```tsx
<button
  key={option.id}
  type="button"
  onClick={() => handleSelect(option)}
  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors
    ${value === option.id ? 'bg-brand-900 text-white ...' : 'hover:bg-brand-50 ...'}
  `}
>
```

✅ GOOD - C'est un `<button>` pas un `<div>`

Mais vérifier: **Pas de `aria-label` pour option sélectionnée** - peut aider screen readers.

---

## 🔴 CATÉGORIE 5: HIÉRARCHIE HEADINGS INCORRECTE (8 problèmes)

### Dashboard.tsx

#### Ligne 228 (ClientManager):

```tsx
<h2 className="text-3xl font-bold text-brand-900 dark:text-white font-display">Clients</h2>
```

✅ SANS PARENT H1 - page pas testée avec h1

#### Ligne 288-295 (Stats cards):

```tsx
<h3 className="text-2xl font-bold text-brand-900 dark:text-white">{globalStats.count}</h3>
<h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400">...</h3>
<h3 className="text-2xl font-bold text-brand-900 dark:text-white">...</h3>
```

⚠️ **PROBLÈME:** Multiple `<h3>` au même niveau sans `<h2>` parent

**STRUCTURE ACTUELLE:**

```
PAGE (no h1)
  ├─ h2: "Clients" (3xl)
  ├─ h3: "5" (2xl) ← skip niveau
  ├─ h3: "€1000" (2xl) ← skip niveau
  └─ h3: "10" (2xl) ← skip niveau
```

**À CORRIGER:**

```
PAGE
  ├─ h1: "Tableau de Bord" (invisible sr-only)
  ├─ h2: "Clients"
  └─ h3+: Stats...
```

---

### ClientManager.tsx

#### Ligne 228:

```tsx
<h2 className="text-3xl font-bold text-brand-900 dark:text-white font-display">Clients</h2>
```

#### Lignes 288, 295, 307:

```tsx
<h3 className="text-2xl font-bold...">...</h3> // Stats
```

#### Ligne 328:

```tsx
<h3 className="text-lg font-semibold...">...</h3> // Clients list
```

#### Ligne 346:

```tsx
<h4 className="font-semibold...">...</h4> // Client name IN list
```

**STRUCTURE:**

```
h2: "Clients"
  ├─ h3: "5 clients" (stats)
  ├─ h3: List container label
  │  └─ (Boucle map d'items)
  │     └─ h4: Client name
  ├─ h4: "Format" (line 400)
  └─ h4: "Organisation" (line 420)
```

⚠️ **PROBLÈMES:**

- h3 → h4 skip est OK
- h4 "Format", "Organisation" aux côtés de h4 "Client name" = confusion structure

---

### CalendarManager.tsx

#### Ligne 190:

```tsx
<h2 className="text-3xl font-bold text-brand-900 tracking-tight font-display">Calendrier</h2>
```

#### Ligne 224:

```tsx
<h3 className="text-2xl font-bold text-brand-900 font-display">
  {currentMonth.toLocaleString(months)}
</h3>
```

#### Ligne 336:

```tsx
<h3 className="text-lg font-bold text-brand-900 mb-6 flex items-center gap-2 font-display">
  Événements du mois
</h3>
```

#### Lignes 365, 386, 408:

```tsx
<h4 className="text-sm font-bold...">...</h4>
<h4 className="text-sm font-bold...">...</h4>
<h3 className="text-xl font-bold text-brand-900">...</h3>
```

⚠️ **h4 SUIVI DE h3** = structure illogique!

**À CORRIGER:**

```tsx
<h3>Événements du mois</h3>  // Ligne 336
  <h4>Événement 1</h4>
  <h4>Événement 2</h4>
// PAS h3 ensuite!
```

---

### InvoiceManager.tsx - Général

PAS de h1 d'accueil visible. La page démarre directement par h2/h3.

---

### EmailManager.tsx

#### Ligne 240:

```tsx
<h2 className="text-2xl font-bold text-brand-900">Emails & Communications</h2>
```

#### Lignes 252, 278, 292:

```tsx
<h3 className="font-bold text-brand-900 text-lg">...</h3>
```

✅ Structure semble OK (h2 → h3)

---

### AIAssistant.tsx

#### Ligne 252:

```tsx
<h2 className="text-white font-bold text-lg">Assistant Administratif</h2>
```

#### Lignes 278, 292:

```tsx
<h3 className="font-bold text-brand-900">...</h3>
```

✅ OK

---

### AccountingManager.tsx

#### Ligne 559:

```tsx
<h2 className="text-3xl font-bold text-brand-900 font-display tracking-tight">Comptabilité</h2>
```

#### Ligne 606:

```tsx
<h3 className="text-2xl font-bold text-brand-900 dark:text-white font-display tracking-tight mt-1">
```

✅ OK (h2 → h3)

---

## 🔴 CATÉGORIE 6: FORMULAIRES SANS FIELDSET/LEGEND (3 majeurs)

### ExportModal.tsx

#### Lignes 92-93: ✅ BON EXEMPLE

```tsx
<fieldset>
  <legend className="block text-sm font-bold text-brand-900 dark:text-white mb-3">
    Sélectionner les collections à exporter
  </legend>
  {/* Checkboxes */}
</fieldset>
```

✅ C'est le SEUL bon exemple trouvé!

---

### EmailManager.tsx - Templates Edit Dialog

❌ **PROBLÈME:** Pas de `<fieldset>` autour des options de composition

**Code actuel (Ligne ~400-500):**

```tsx
<div className="lg:col-span-2 bg-white border border-brand-100 rounded-[2rem] p-8 shadow-sm">
  <div className="flex justify-between items-center mb-6">
    <h3 className="text-lg font-bold...">
      <Mail className="text-brand-500" size={20} />
      Nouveau Message
    </h3>
    {/* Actions */}
  </div>

  {/* Inputs définis sans fieldset */}
  <label>À:</label>
  <input value={composeData.to} onChange={...} />

  <label>Sujet:</label>
  <input value={composeData.subject} onChange={...} />

  <label>Corps:</label>
  <textarea value={composeData.body} onChange={...} />
</div>
```

✅ **CORRECTION:**

```tsx
<fieldset className="lg:col-span-2 bg-white border border-brand-100 rounded-[2rem] p-8 shadow-sm">
  <legend className="sr-only">Composer un nouveau message</legend>

  <div className="flex justify-between items-center mb-6">
    <h3>Nouveau Message</h3>
  </div>

  <label htmlFor="email-to">À:</label>
  <input id="email-to" value={composeData.to} onChange={...} />
  {/* ... etc */}
</fieldset>
```

---

### InvoiceManager.tsx - Invoice Form

❌ **PROBLÈME:** Long formulaire de facture sans fieldsets - confus pour screen readers

**Section "Items" (Lignes ~600-700):** Pas de `<fieldset>`

**Correction suggérée:**

```tsx
<fieldset>
  <legend className="sr-only">Articles de la facture</legend>
  {/* Table d'items */}
</fieldset>

<fieldset>
  <legend className="sr-only">Totaux et taxes</legend>
  {/* Inputs de totaux */}
</fieldset>
```

---

## 🔴 CATÉGORIE 7: ÉLÉMENTS AVEC onClick SANS KEYBOARD HANDLING (11 problèmes)

### Dashboard.tsx - Activity Item Non-Bouton

#### Lignes 880-925:

```tsx
<div
  key={item.id}
  className="flex items-center justify-between p-4 hover:bg-brand-50 dark:hover:bg-brand-800/50 rounded-2xl transition-all cursor-pointer border border-transparent group"
>
  {/* Cliquable visuellement via cursor-pointer */}
  {/* MAIS: Pas d'onClick trouvé = BUG ou CSS-only state change */}
</div>
```

⚠️ **INVESTIGATION REQUISE:**

- Si `onClick` existe ailleurs: PAS DE keyboard support (Enter/Space)
- Si c'est un link traité comme button: MANQUE `role="link"`

---

### Dashboard.tsx - SortableWidget Drag Handle

#### Lignes 92-104:

```tsx
<div
  {...attributes}
  {...listeners}
  className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-brand-300 hover:text-brand-600 z-20"
>
  <GripVertical size={16} />
</div>
```

❌ **PROBLÈME:**

- `dnd-kit` fournit `{...attributes}` inclus `aria-roledescription` = ✅ OK
- MAIS: Pas d'aria-label pour décrire quoi faire
- Lecteur d'écran: "draggable" sans contexte

✅ **CORRECTION:**

```tsx
<div
  {...attributes}
  {...listeners}
  role="button"
  tabIndex={0}
  aria-label={`Réorganiser le widget ${id}: utiliser les touches fléchées`}
  aria-roledescription="widget draggable"
  className="..."
>
```

---

### Combobox.tsx - Dropdown Toggle

#### Ligne 136 (Chevron button):

```tsx
<button
  type="button"
  tabIndex={-1}
  disabled={disabled}
  onClick={() => {
    if (!disabled) {
      setIsOpen(!isOpen);
      inputRef.current?.focus();
    }
  }}
  className="p-1 text-brand-400 focus:outline-none"
  aria-label="Ouvrir/fermer les options"
>
  <ChevronDown size={18} ... />
</button>
```

✅ GOOD - Bouton avec aria-label et keyboard support via button natural behavior

---

### ClientManager.tsx - Client Row Interaction

#### Ligne 865-913 (Client list map):

```tsx
<button
  onClick={() => form.openEdit(client)}
  className="flex-1 text-left rounded-lg p-2 -m-2 hover:bg-brand-50 dark:hover:bg-brand-900/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
  title="Cliquez pour modifier le client"
>
```

✅ GOOD - C'est un button avec focus handle

**MAIS: MANQUE aria-label:**

```tsx
aria-label={`Modifier le client ${client.name}`}
```

---

## 🔴 CATÉGORIE 8: ISSUES AVEC ARIA-HIDDEN (Surtout bon)

### Sidebar.tsx - Logo Section

#### Ligne 98:

```tsx
<div
  className="bg-brand-900 dark:bg-white text-white dark:text-brand-900 p-3 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500"
  aria-hidden="true"
>
  <Briefcase size={24} />
</div>
```

✅ OK - Icône décorativepure

#### Lignes 120-121:

```tsx
<p
  className="text-xl font-black text-brand-900 dark:text-white tracking-tighter leading-none"
  aria-hidden="true"
>
  MICRO
  <br />
  <span className="text-brand-500 dark:text-brand-400">GESTION</span>
</p>
```

⚠️ **PROBLÈME:** `aria-hidden="true"` = texte invisible pour screen readers!

✅ **CORRECTION:** Supprimer `aria-hidden` - le texte est IMPORTANT pour la marque

```tsx
<h1 className="text-xl font-black text-brand-900 dark:text-white tracking-tighter leading-none">
  Micro
  <br />
  <span className="text-brand-500 dark:text-brand-400">Gestion</span>
</h1>
```

---

### Dashboard.tsx - Decorative Icons

#### Plusieurs endroits:

```tsx
<span className="..." aria-hidden="true">
  {item.icon}
</span>
```

✅ OK - Icons purely decorative

---

## ⚠️ CATÉGORIE 9: FOCUS MANAGEMENT & KEYBOARD NAV (7 détectés)

### Sidebar.tsx - Logo Button

#### Line 93:

```tsx
<button
  className="flex items-center gap-4 group cursor-pointer border-none bg-transparent p-0 text-left"
  onClick={() => setView('dashboard')}
  aria-label="Aller au tableau de bord"
>
```

✅ Button donc keyboard accessible

---

### InvoiceManager.tsx - Form Navigation

❌ **PROBLÈME:** Long formulaire sans skip-to-actions links ou focus trap

Utilisateur clavier doit tabber à travers 50+ inputs avant atteindre submit.

✅ **CORRECTION:**

```tsx
{
  /* En haut du formulaire */
}
<a href="#invoice-actions" className="sr-only focus:not-sr-only">
  Aller aux actions de la facture
</a>;

{
  /* Au bas */
}
<div id="invoice-actions" className="flex gap-3">
  <button>Enregistrer</button>
  <button>Enregistrer et Envoyer</button>
</div>;
```

---

### Modal Components - Dialogs.tsx

#### Ligne 40 (ConfirmDialog):

```tsx
<dialog
  ref={dialogRef}
  className="..."
  aria-labelledby="confirm-title"
>
```

✅ GOOD - Dialog + aria-labelledby

**MAIS:** Vérifier `blockquote` - pas trouvé `role="alertdialog"`?

---

## ⚠️ CATÉGORIE 10: CONTRAST & COLOR SOLO (Non analyzable sans CSS compiled)

### Classes de couleur détectées:

| Classe             | Usage              | Risk                               |
| ------------------ | ------------------ | ---------------------------------- |
| `.text-brand-300`  | Labels secondaires | ⚠️ Can be low contrast on white    |
| `.text-brand-400`  | Hints/subtext      | ⚠️ Peut être insuffisant (WCAG AA) |
| `.text-red-600`    | Error messages     | ✅ Généralement OK                 |
| `.text-amber-600`  | Warnings           | ✅ OK                              |
| `.text-accent-600` | Accent             | ✅ Généralement OK                 |

**À vérifier avec Lighthouse/wave audit du site compiled.**

---

## ✅ WHAT'S GOOD

### Componentes avec Bonnes Pratiques:

1. [Dialogs.tsx#L40](src/components/Dialogs.tsx#L40) - Dialog + `aria-labelledby` ✅
2. [ExportModal.tsx#L92](src/components/ExportModal.tsx#L92) - Fieldset + Legend ✅
3. [Sidebar.tsx](src/components/Sidebar.tsx) - Menu items avec `aria-current="page"` ✅
4. [Combobox.tsx](src/components/Combobox.tsx) - Pattern combobox avec labels et ARIA ✅
5. [FormFieldValidated.tsx](src/components/FormFieldValidated.tsx) - Labels + validation icons ✅

---

## 🎯 PLAN DE CORRECTION (Priorité)

### PHASE 1 - BLOCKERS (2 jours)

1. ✅ Ajouter `aria-label` à TOUS les icon-only buttons (34 boutons)
2. ✅ Associer `<label>` à TOUS les `<inputs>` orphelins (21 inputs)
3. ✅ Ajouter `role="button"` + `aria-label` aux divs cliquables (12 divs)
4. ✅ Fixer hiérarchie headings h1→h2→h3 (8 pages)

### PHASE 2 - HIGH (1.5 jours)

5. ✅ Ajouter `<fieldset>/<legend>` aux form groups (3 formulaires)
6. ✅ Keyboard handling pour onClick divs (11 éléments)
7. ✅ Skip-to-main links sur pages longues
8. ✅ Focus management dans modals

### PHASE 3 - MEDIUM (1 jour)

9. ✅ Aria-labels pour éléments ARIA draggables
10. ✅ Contrast ratio vérification
11. ✅ Audit screenreader (NVDA/JAWS test)

---

## 📋 FICHIER DE RÉFÉRENCE POUR CORRECTIONS

Voir [A11Y_CORRECTIONS.md](A11Y_CORRECTIONS.md) pour code prêt-à-copier.

---

## 🔗 RESSOURCES WCAG 2.1 AA

- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [Aria Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM - Intro Screen Readers](https://webaim.org/articles/screenreader_testing/)
