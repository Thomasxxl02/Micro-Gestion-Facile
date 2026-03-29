# 🔧 Corrections Prêtes-à-Copier pour Accessibilité (a11y)

**Documents associés:**

- [A11Y_AUDIT_COMPLETE_2026-03-29.md](A11Y_AUDIT_COMPLETE_2026-03-29.md) - Audit détaillé
- [A11Y_ISSUES.json](A11Y_ISSUES.json) - Liste structurée (pour tracking)

---

## 📋 TABLE DES MATIÈRES

1. [Pattern 1: Icon-Only Buttons](#pattern-1-icon-only-buttons) (34 fixes)
2. [Pattern 2: Inputs Without Labels](#pattern-2-inputs-without-labels) (21 fixes)
3. [Pattern 3: Buttons with title= instead of aria-label](#pattern-3-title-vs-aria-label) (5 fixes)
4. [Pattern 4: Divs as Buttons](#pattern-4-divs-as-buttons) (12 fixes)
5. [Pattern 5: Heading Hierarchy](#pattern-5-heading-hierarchy) (8 fixes)
6. [Pattern 6: Forms Without Fieldset](#pattern-6-forms-without-fieldset) (3 fixes)
7. [Pattern 7: aria-hidden on Important Content](#pattern-7-aria-hidden) (1 fix)
8. [Pattern 8: Skip Links](#pattern-8-skip-links) (2 fixes)

---

## 🔴 PATTERN 1: Icon-Only Buttons

### Problem

```tsx
// ❌ MAUVAIS - No accessible name
<button onClick={action.onClick} className="px-5 py-3 rounded-2xl">
  <ArrowRight size={14} />
</button>
```

### Solution

```tsx
// ✅ BON - With aria-label
<button
  onClick={action.onClick}
  aria-label="Afficher toutes les factures"
  className="px-5 py-3 rounded-2xl"
>
  <ArrowRight size={14} />
</button>
```

### Applied Fixes

#### Dashboard.tsx

```tsx
// Line 142 - Drag & Drop Action Button
// ❌ OLD:
<button
  ref={setNodeRef}
  onClick={action.onClick}
  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl...`}
>
  {action.icon && React.createElement(action.icon, { className: 'w-4 h-4', strokeWidth: 2 })}
  {action.label}
</button>

// ✅ NEW:
<button
  ref={setNodeRef}
  onClick={action.onClick}
  aria-label={action.label ? `${action.label}` : "Action non nommée"}
  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl...`}
>
  {action.icon && React.createElement(action.icon, { className: 'w-4 h-4', strokeWidth: 2 })}
  {action.label && <span className="hidden sm:inline">{action.label}</span>}
</button>

---

// Line 870 - View All Button
// ❌ OLD:
<button
  onClick={() => onNavigate('invoices')}
  className="text-[10px] font-bold text-brand-600 hover:text-brand-900..."
>
  Tout voir <ArrowRight size={14} className="ml-1.5" />
</button>

// ✅ NEW:
<button
  onClick={() => onNavigate('invoices')}
  aria-label="Afficher toutes les factures"
  className="text-[10px] font-bold text-brand-600 hover:text-brand-900..."
>
  Tout voir <ArrowRight size={14} className="ml-1.5" aria-hidden="true" />
</button>

---

// Lines 1088, 1103 - Predict Revenue Button
// ❌ OLD:
<button
  onClick={handlePredict}
  disabled={isPredicting}
  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl..."
>
  {isPredicting ? (
    <Loader2 size={14} className="animate-spin" />
  ) : (
    <Sparkles size={14} />
  )}
  Prédire CA
</button>

// ✅ NEW:
<button
  onClick={handlePredict}
  disabled={isPredicting}
  aria-label={isPredicting ? "Calcul en cours..." : "Prédire le chiffre d'affaires"}
  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl..."
>
  {isPredicting ? (
    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
  ) : (
    <Sparkles size={14} aria-hidden="true" />
  )}
  Prédire CA
</button>
```

#### EmailManager.tsx

```tsx
// Line 362 - Edit Template Button
// ❌ OLD:
<button
  onClick={() => {
    setEditingTemplateId(template.id);
    setTemplateFormData(template);
    setIsComposeOpen(true);
  }}
  className="p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50..."
  title="Modifier le template"
>
  <Edit2 size={16} />
</button>

// ✅ NEW:
<button
  onClick={() => {
    setEditingTemplateId(template.id);
    setTemplateFormData(template);
    setIsComposeOpen(true);
  }}
  aria-label={`Modifier le template "${template.name}"`}
  className="p-2 text-brand-400 hover:text-brand-600 hover:bg-brand-50..."
>
  <Edit2 size={16} aria-hidden="true" />
</button>

---

// Line 499 - Delete Email Button
// ❌ OLD:
<button
  onClick={() => deleteEmail(email.id)}
  className="p-2 text-brand-400 hover:text-red-500 hover:bg-red-50..."
  title="Supprimer l'email"
>
  <Trash2 size={16} />
</button>

// ✅ NEW:
<button
  onClick={() => deleteEmail(email.id)}
  aria-label={`Supprimer l'email destinataire ${email.to}`}
  className="p-2 text-brand-400 hover:text-red-500 hover:bg-red-50..."
>
  <Trash2 size={16} aria-hidden="true" />
</button>

---

// Line 637 - Edit Template (in card)
// ✅ Apply same pattern as Line 362

// Line 669 - Delete Template (in card)
// ✅ Apply same pattern as Line 499
```

#### CalendarManager.tsx

```tsx
// Line 229 - Previous Month Button
// ❌ OLD:
<button
  onClick={prevMonth}
  className="p-2 hover:bg-brand-50..."
>
  <ChevronLeft size={18} />
</button>

// ✅ NEW:
<button
  onClick={prevMonth}
  aria-label="Mois précédent"
  className="p-2 hover:bg-brand-50..."
>
  <ChevronLeft size={18} aria-hidden="true" />
</button>

---

// Line 236 - Go to Today Button
// ✅ NEW:
<button
  onClick={goToToday}
  aria-label="Retourner à aujourd'hui"
  className="px-4 py-2 hover:bg-brand-50..."
>
  Aujourd'hui
</button>

---

// Line 243 - Next Month Button
// ✅ NEW:
<button
  onClick={nextMonth}
  aria-label="Mois suivant"
  className="p-2 hover:bg-brand-50..."
>
  <ChevronRight size={18} aria-hidden="true" />
</button>
```

---

## 🔴 PATTERN 2: Inputs Without Labels

### Problem

```tsx
// ❌ MAUVAIS - No associated label
<input
  type="text"
  placeholder="Rechercher..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### Solution A: Visible Label

```tsx
// ✅ BON - Avec label visible
<label htmlFor="search-input" className="block text-sm font-bold mb-2">
  Rechercher
</label>
<input
  id="search-input"
  type="text"
  placeholder="Rechercher..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### Solution B: Invisible Label (sr-only)

```tsx
// ✅ BON - Avec label hidden mais accessible
<label htmlFor="search-input" className="sr-only">
  Rechercher les clients
</label>
<input
  id="search-input"
  type="text"
  placeholder="Rechercher..."
  aria-label="Rechercher les clients par nom ou email"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### Applied Fixes

#### AccountingManager.tsx - VAT Rate Input in Loop

```tsx
// ❌ OLD (Line 1010):
<div className="flex flex-col w-16">
  <input
    type="number"
    min="0"
    max="100"
    step="0.1"
    className="bg-white border border-brand-200..."
    value={item.vatRate || 0}
    onChange={(e) =>
      updateItem(item.id, 'vatRate', Number.parseFloat(e.target.value))
    }
  />
</div>

// ✅ NEW:
<div className="flex flex-col w-16">
  <label
    htmlFor={`vat-${item.id}`}
    className="text-[10px] uppercase font-bold text-brand-400 mb-1"
  >
    TVA %
  </label>
  <input
    id={`vat-${item.id}`}
    type="number"
    min="0"
    max="100"
    step="0.1"
    aria-label={`Taux TVA pour article ${item.id}`}
    className="bg-white border border-brand-200..."
    value={item.vatRate || 0}
    onChange={(e) =>
      updateItem(item.id, 'vatRate', Number.parseFloat(e.target.value))
    }
  />
</div>

---

// Lines 1036, 1045 - Amount, Description, etc
// Apply same pattern - add <label> with htmlFor matching input id
```

#### AIAssistant.tsx - Prompt Input

```tsx
// ❌ OLD (Line 353):
<div className="relative">
  <input
    type="text"
    placeholder="Décrivez votre besoin..."
    className="w-full p-4 bg-white/10..."
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleAI();
    }}
  />
</div>

// ✅ NEW:
<div className="relative">
  <label htmlFor="ai-prompt" className="sr-only">
    Décrire le besoin pour l'assistant IA
  </label>
  <input
    id="ai-prompt"
    type="text"
    placeholder="Décrivez votre besoin..."
    aria-label="Entrez votre demande pour l'assistant IA"
    className="w-full p-4 bg-white/10..."
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleAI();
    }}
  />
</div>
```

#### CalendarManager.tsx - Date Inputs

```tsx
// ❌ OLD (Lines 434, 498, 516):
<input
  type="date"
  className="..."
  value={...}
  onChange={...}
/>

// ✅ NEW:
<label htmlFor="date-input" className="sr-only">
  Sélectionner une date
</label>
<input
  id="date-input"
  type="date"
  aria-label="Date de l'événement"
  className="..."
  value={...}
  onChange={...}
/>
```

---

## 🔴 PATTERN 3: Title vs aria-label

### Problem

```tsx
// ❌ MAUVAIS - title= not announced reliably
<button title="Supprimer l'email">
  <Trash2 size={16} />
</button>
```

### Solution

```tsx
// ✅ BON - Use aria-label instead
<button aria-label="Supprimer l'email à contact@example.com">
  <Trash2 size={16} />
</button>
```

### Applied Fixes

#### EmailManager.tsx

```tsx
// Line 362, 637 - Replace title with aria-label
// ❌ BEFORE:
title="Modifier le template"

// ✅ AFTER:
aria-label={`Modifier le template "${template.name}"`}

---

// Line 499, 669 - Delete buttons
// ✅ Already covered in Pattern 1
```

#### ClientManager.tsx - Archive Button

```tsx
// Line 365
// ❌ OLD:
<button
  onClick={() => toggleArchive(client.id)}
  className="text-xs px-3 py-1 rounded bg-gray-200..."
  title={client.archived ? 'Restaurer le client' : 'Archiver le client'}
>
  {client.archived ? 'Restaurer' : 'Archiver'}
</button>

// ✅ NEW:
<button
  onClick={() => toggleArchive(client.id)}
  aria-label={client.archived ? `Restaurer le client ${client.name}` : `Archiver le client ${client.name}`}
  className="text-xs px-3 py-1 rounded bg-gray-200..."
>
  {client.archived ? 'Restaurer' : 'Archiver'}
</button>
```

---

## 🔴 PATTERN 4: Divs as Buttons

### Problem

```tsx
// ❌ MAUVAIS - Div clicked but not accessible
<div className="cursor-pointer p-4 hover:bg-gray-50" onClick={() => handleAction()}>
  Contenu cliquable
</div>
```

### Solution

```tsx
// ✅ BON - Convert to button or add proper ARIA
<button
  onClick={() => handleAction()}
  className="text-left p-4 hover:bg-gray-50"
>
  Contenu cliquable
</button>

// OR if must stay div:
<div
  role="button"
  tabIndex={0}
  aria-label="Description de l'action"
  onClick={() => handleAction()}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  }}
  className="cursor-pointer p-4 hover:bg-gray-50"
>
  Contenu cliquable
</div>
```

### Applied Fixes

#### Dashboard.tsx - DraggableQuote

```tsx
// ❌ OLD (Lines 155-170):
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  className={`flex items-center justify-between p-3 rounded-xl border ... cursor-grab active:cursor-grabbing ${isDragging ? '...' : '...'}`}
>
  <div className="flex items-center gap-3">
    <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 rounded-lg">
      <FileText size={14} />
    </div>
    <div>
      <p className="text-xs font-bold text-brand-900">{quote.number}</p>
      <p className="text-[10px] text-brand-400">{quote.total.toLocaleString()} €</p>
    </div>
  </div>
  <ArrowRight size={14} className="text-brand-200" />
</div>

// ✅ NEW:
<div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  role="button"
  tabIndex={0}
  aria-label={`Devis ${quote.number} de ${quote.total.toLocaleString()} € - Glisser-déposer vers les actions`}
  aria-describedby="drag-hint"
  onKeyDown={(e) => {
    // dnd-kit handles Enter/Space via keyboard sensor already
    // but ensuring compatibility
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // dnd-kit keyboard coordinate getter handles this
    }
  }}
  className={`flex items-center justify-between p-3 rounded-xl border ... cursor-grab active:cursor-grabbing ${isDragging ? '...' : '...'}`}
>
  <div className="flex items-center gap-3">
    <div className="p-2 bg-brand-50 dark:bg-brand-800 text-brand-600 rounded-lg" aria-hidden="true">
      <FileText size={14} />
    </div>
    <div>
      <p className="text-xs font-bold text-brand-900">{quote.number}</p>
      <p className="text-[10px] text-brand-400">{quote.total.toLocaleString()} €</p>
    </div>
  </div>
  <ArrowRight size={14} className="text-brand-200" aria-hidden="true" />
</div>

// Add hint below (in parent container):
<p id="drag-hint" className="sr-only">
  Utiliser les touches fléchées pour naviguer, Entrée pour trier
</p>
```

---

## 🔴 PATTERN 5: Heading Hierarchy

### Problem

```tsx
// ❌ MAUVAIS - h2 directly followed by multiple h3s with no h1
<h2>Clients</h2>
<h3>5 clients actifs</h3>
<h3>€1000 CA total</h3>
<h3>10 archivés</h3>
```

### Solution

```tsx
// ✅ BON - Proper h1 → h2 → h3 hierarchy
<h1 className="sr-only">Tableau de Bord - Gestion Clients</h1>

<h2 className="text-3xl font-bold">Clients</h2>

<h3 className="text-lg font-bold">Statistiques</h3>
<div>
  <div><h4>5 clients actifs</h4></div>
  <div><h4>€1000 CA total</h4></div>
  <div><h4>10 archivés</h4></div>
</div>
```

### Applied Fixes

#### ClientManager.tsx

```tsx
// ❌ OLD (around line 228):
<h2 className="text-3xl font-bold text-brand-900 dark:text-white font-display">
  Clients
</h2>
<p className="text-brand-500 dark:text-brand-400 mt-1">
  Gérez votre portefeuille client et suivez les revenus.
</p>

<div>
  {/* Stats cards */}
  <h3 className="text-2xl font-bold">{globalStats.count}</h3>
  <h3 className="text-2xl font-bold">{globalStats.totalRevenue}€</h3>
  <h3 className="text-2xl font-bold">{globalStats.archivedCount}</h3>
</div>

// ✅ NEW:
<h1 className="sr-only">Page de Gestion des Clients</h1>

<h2 className="text-3xl font-bold text-brand-900 dark:text-white font-display">
  Clients
</h2>
<p className="text-brand-500 dark:text-brand-400 mt-1">
  Gérez votre portefeuille client et suivez les revenus.
</p>

<h3 className="sr-only">Statistiques des clients</h3>
<div className="bento-grid">
  {/* Stats cards */}
  <div>
    <h4 className="text-2xl font-bold">{globalStats.count}</h4>
    <p>Clients Actifs</p>
  </div>
  <div>
    <h4 className="text-2xl font-bold">{globalStats.totalRevenue}€</h4>
    <p>CA Total</p>
  </div>
  <div>
    <h4 className="text-2xl font-bold">{globalStats.archivedCount}</h4>
    <p>Archivés</p>
  </div>
</div>
```

#### CalendarManager.tsx - h4 Before h3 Issue

```tsx
// ❌ OLD (around line 354-408):
<h3 className="text-lg font-bold">Événements du mois</h3>

{events.map(event => (
  <h4 key={event.id} className="text-sm font-bold">{event.name}</h4>
))}

<h3 className="text-xl font-bold">Modal événement</h3>  // ← OUT OF ORDER!

// ✅ NEW:
<h3 className="text-lg font-bold">Événements du mois</h3>

{events.map(event => (
  <h4 key={event.id} className="text-sm font-bold">{event.name}</h4>
))}

<h3 className="text-xl font-bold">Détails de l'événement</h3>  // Change to h3

// In modal:
<h4 className="text-lg font-bold">{selectedEvent.name}</h4>
```

---

## 🔴 PATTERN 6: Forms Without Fieldset

### Problem

```tsx
// ❌ MAUVAIS - Inputs sans grouping
<div>
  <label>À:</label>
  <input value={to} onChange={...} />

  <label>Sujet:</label>
  <input value={subject} onChange={...} />

  <label>Corps:</label>
  <textarea value={body} onChange={...} />
</div>
```

### Solution

```tsx
// ✅ BON - Grouped with fieldset/legend
<fieldset>
  <legend className="text-lg font-bold mb-6">Composer un message</legend>

  <div className="mb-4">
    <label htmlFor="email-to">À:</label>
    <input id="email-to" value={to} onChange={...} />
  </div>

  <div className="mb-4">
    <label htmlFor="email-subject">Sujet:</label>
    <input id="email-subject" value={subject} onChange={...} />
  </div>

  <div className="mb-4">
    <label htmlFor="email-body">Corps:</label>
    <textarea id="email-body" value={body} onChange={...} />
  </div>
</fieldset>
```

### Applied Fixes

#### EmailManager.tsx - Compose Form

```tsx
// ❌ OLD (Lines ~380-500):
<div className="lg:col-span-2 bg-white border border-brand-100 rounded-[2rem] p-8 shadow-sm">
  <div className="flex justify-between items-center mb-6">
    <h3 className="text-lg font-bold...">
      <Mail className="text-brand-500" size={20} />
      Nouveau Message
    </h3>
    {/* action buttons */}
  </div>

  {/* Form content without fieldset */}
</div>

// ✅ NEW:
<fieldset className="lg:col-span-2 bg-white border border-brand-100 rounded-[2rem] p-8 shadow-sm">
  <legend className="sr-only">Composer un nouveau message électronique</legend>

  <div className="flex justify-between items-center mb-6">
    <h3 className="text-lg font-bold...">
      <Mail className="text-brand-500" size={20} />
      Nouveau Message
    </h3>
    {/* action buttons */}
  </div>

  {/* Form content */}
</fieldset>
```

#### InvoiceManager.tsx - Items Section

```tsx
// ❌ OLD (Lines ~600-700):
<div className="bg-white rounded-4xl...">
  <div className="overflow-x-auto">
    <div className="space-y-4">
      {form.formData.items.map(item => (
        // Item row here
      ))}
    </div>
  </div>
</div>

// ✅ NEW:
<fieldset className="bg-white rounded-4xl...">
  <legend className="sr-only">Articles de la facture</legend>

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr>
          <th>Produit/Service</th>
          <th>Description</th>
          <th>Prix unitaire</th>
          {/* ... */}
        </tr>
      </thead>
      <tbody className="space-y-4">
        {form.formData.items.map(item => (
          <tr key={item.id}>
            {/* Item cells */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</fieldset>
```

---

## 🔴 PATTERN 7: aria-hidden on Important Content

### Problem

```tsx
// ❌ MAUVAIS - Hide brand name from screen readers!
<p aria-hidden="true">
  MICRO
  <br />
  <span>GESTION</span>
</p>
```

### Solution

```tsx
// ✅ BON - Remove aria-hidden, make semantic important
<h1>
  Micro<br />
  <span className="text-brand-500">Gestion</span>
</h1>

// OR if purely decorative:
<div aria-hidden="true" className="icon-decoration">
  {/* Only decorative symbols */}
</div>
```

### Applied Fix

#### Sidebar.tsx

```tsx
// ❌ OLD (Line 120-121):
<p
  className="text-xl font-black text-brand-900 dark:text-white tracking-tighter leading-none"
  aria-hidden="true"
>
  MICRO<br />
  <span className="text-brand-500 dark:text-brand-400">GESTION</span>
</p>

// ✅ NEW:
<h1 className="text-xl font-black text-brand-900 dark:text-white tracking-tighter leading-none">
  Micro<br />
  <span className="text-brand-500 dark:text-brand-400">Gestion</span>
</h1>
```

---

## 🔴 PATTERN 8: Skip Links

### Problem

```tsx
// Long form with 50+ inputs = user must tab through everything
<form>
  <input /> {/* must tab through all */}
  <input />
  <input />
  {/* ... 50 more inputs ... */}
  <button>Enregistrer</button>
</form>
```

### Solution

```tsx
// ✅ BON - Add skip link at top
<form>
  <a href="#form-actions" className="sr-only focus:not-sr-only">
    Aller aux actions du formulaire
  </a>

  <input />
  <input />
  {/* ... inputs ... */}

  <div id="form-actions" className="flex gap-3 mt-8">
    <button type="submit">Enregistrer</button>
    <button type="button" onClick={onCancel}>
      Annuler
    </button>
  </div>
</form>
```

### Applied Fixes

#### InvoiceManager.tsx

```tsx
// Add at beginning of form:
<a
  href="#invoice-bottom-actions"
  className="sr-only focus:not-sr-only focus:block Focus:p-2 focus:bg-brand-900 focus:text-white focus:z-50"
>
  Aller aux actions de la facture
</a>

// At end of form:
<div id="invoice-bottom-actions" className="flex gap-3 flex-wrap">
  <button type="submit">Enregistrer</button>
  <button type="button">Enregistrer et envoyer</button>
  <button type="button" onClick={onCancel}>Annuler</button>
</div>
```

---

## ✅ Checklist de Validation

- [ ] Tous les icon-only buttons ont aria-label
- [ ] Tous les inputs orphelins ont <label> ou aria-label
- [ ] Aucun title= = sans aria-label correspondant
- [ ] Divs avec onClick ont role="button" + aria-label
- [ ] Hiérarchie h1 → h2 → h3 → h4 sans skip
- [ ] Form groups en <fieldset> avec <legend>
- [ ] aria-hidden seulement sur éléments purement décoratifs
- [ ] Pages longues ont skip-to-content links
- [ ] focus:ring visible sur tous les boutons
- [ ] Keyboard nav testée (Tab, Enter, Space, Arrows)
- [ ] Contrast ratio testé avec Lighthouse
- [ ] Screen reader testing avec NVDA/JAWS

---

## 🧪 Testing Commands

```bash
# ESLint audit for a11y violations
npm run lint

# TypeScript audit
npm run type-check

# Visual regression (if available)
npm run test:ui

# Build and audit with lighthouse
npm run build
# Then open with:
# npx lighthouse http://localhost:5173 --view
```

---

## 📚 Resources

- [WCAG 2.1 AA Checklist](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Aria Patterns](https://react-spectrum.adobe.com/react-aria/Button.html)
- [WAI-ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Deque University](https://dequeuniversity.com/)
