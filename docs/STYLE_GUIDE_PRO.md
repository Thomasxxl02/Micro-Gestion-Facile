# 🎨 Guide de Style Professionnel - Micro-Gestion-Facile

## Architecture de Style

### Système de Couleurs: **Night Indigo & Royal Gold**

```
┌─────────────────────────────────────────────────────────┐
│ PRIMARY: Indigo (#6366f1)     → Confiance & Professionnel│
│ ACCENT: Gold (#f59e0b)        → Premium & Succès         │
│ NEUTRAL: Slate (#64748b)      → Équilibre & Lisibilité   │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Hiérarchie Typographique

### Polices

| Utilisation | Police            | Poids   |
| ----------- | ----------------- | ------- |
| **Titres**  | Space Grotesk     | 600-800 |
| **Corps**   | Plus Jakarta Sans | 400-600 |
| **Code**    | JetBrains Mono    | 400-500 |

### Tailles Recommandées

```css
/* Headings */
h1 {
  font-size: 2.5rem;
  line-height: 1.1;
} /* 40px */
h2 {
  font-size: 2rem;
  line-height: 1.15;
} /* 32px */
h3 {
  font-size: 1.5rem;
  line-height: 1.2;
} /* 24px */
h4 {
  font-size: 1.25rem;
  line-height: 1.3;
} /* 20px */

/* Body */
p {
  font-size: 1rem;
  line-height: 1.6;
} /* 16px */
small {
  font-size: 0.875rem;
  line-height: 1.5;
} /* 14px */
```

---

## 2. Composants Réutilisables

### Boutons

#### Primaire (Action Principale)

```tsx
className = "btn-primary";
// Gradient Indigo, Shadow Gold, Hover Scaling
```

**Utilisation:** Soumettre un formulaire, Créer une facture, Confirmer une action

#### Secondaire (Action Alternative)

```tsx
className = "btn-secondary";
// Outline Indigo, Glassmorphic, Subtle
```

**Utilisation:** Annuler, Retour, Actions secondaires

#### Tertiaire (Texte)

```tsx
className = "btn-tertiary";
// Text-only, Brand colored
```

**Utilisation:** Liens, Options supplémentaires

### Inputs & Formulaires

```tsx
// Input Moderne avec focus ring
className = "input-modern";

// Focus visible avec ring Indigo
// :focus { border: brand-500, ring: brand-500/10 }
```

### Cartes (Bento Style)

```tsx
className = "card-modern";
// - Fond: White/Dark avec glassmorphism
// - Border: Brand-teinte légère
// - Hover: Lift + border accentuation
// - Shadow: Subtile mais définissable
```

---

## 3. Système de Couleurs Sémantiques

### Indicateurs Financiers

| État           | Couleur         | Usage                 |
| -------------- | --------------- | --------------------- |
| ✅ **Profit**  | Green (#10b981) | Revenus, gains        |
| ❌ **Loss**    | Red (#ef4444)   | Dépenses, pertes      |
| ⏳ **Pending** | Gold (#f59e0b)  | En attente, à traiter |
| ⚪ **Neutral** | Slate (#64748b) | Information neutre    |

### Backgrounds Sémantiques

```css
.financial-profit {
  background: rgba(16, 185, 129, 0.1);
}
.financial-loss {
  background: rgba(239, 68, 68, 0.1);
}
.financial-pending {
  background: rgba(245, 158, 11, 0.1);
}
```

---

## 4. Ombres & Profondeur

### Système de Shadows

```
--shadow-xs   → hover subtil, states légers
--shadow-sm   → cards secondaires
--shadow-md   → cards principales
--shadow-lg   → modals, overlays
--shadow-xl   → elevation maximale
```

**Principe:** Plus l'élément est important, plus l'ombre est prononcée

---

## 5. Espacements & Densité

### Padding/Margin Scale

```
xs: 0.5rem   (8px)
sm: 1rem     (16px)
md: 1.5rem   (24px)
lg: 2rem     (32px)
xl: 2.5rem   (40px)
```

### Border Radius

| Type     | Valeur | Usage                       |
| -------- | ------ | --------------------------- |
| Subtle   | 8px    | Tags, petits éléments       |
| Standard | 12px   | Inputs, buttons             |
| Large    | 16px   | Cards secondaires           |
| XL       | 20px   | Cards principales, sections |

---

## 6. Animations & Transitions

### Durées Standard

```css
--transition-fast: 150ms /* micro-interactions */ --transition-base: 250ms
  /* standard */ --transition-slow: 350ms /* entrance/exit */;
```

### Animations Clés

| Animation | Durée | Usage                 |
| --------- | ----- | --------------------- |
| `fadeIn`  | 300ms | Apparition d'éléments |
| `slideUp` | 400ms | Entrée de contenu     |
| `pulse`   | 2s    | Loading, attention    |
| `shimmer` | 2s    | Skeleton loading      |

**Règle:** Respecter le mode `reduced-motion` pour l'accessibilité

---

## 7. Mode Sombre (Dark Mode)

### Palette Sombre Premium

```css
Light Mode:  #fcfdfe (bg) → #0a091f (text)
Dark Mode:   #030712 (bg) → #f9fafb (text)
```

### Caractéristiques

- 🔹 **Glassmorphism accentué** (blur + semi-transparent)
- 🔹 **Borders teintées Indigo** (au lieu de blancs)
- 🔹 **Contraste élevé** pour l'accessibilité
- 🔹 **Transitions fluides** light → dark

---

## 8. Patterns Courants

### Card Financière

```tsx
<div className="card-modern">
  <div className="card-modern-header">
    <h3 className="font-display text-xl">Facture #001</h3>
    <span className="stat-badge">Premium</span>
  </div>
  <div className="card-modern-content">{/* Contenu */}</div>
</div>
```

### Alert / Banner

```tsx
// Success (Green + Gold accent)
className =
  "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800";

// Warning (Gold)
className =
  "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800";

// Error (Red)
className =
  "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800";
```

### Mise en Page (Bento Grid)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards se réarrangent responsively */}
</div>
```

---

## 9. Checklist Qualité Visuelle

### À Vérifier avant Déploiement

- ✅ **Contraste WCAG AA** (ratio 4.5:1 pour texte)
- ✅ **Responsive Design** (mobile, tablet, desktop)
- ✅ **Mode Sombre** fonctionne correctement
- ✅ **Animations** smooth et respecte `prefers-reduced-motion`
- ✅ **Loading States** avec spinners/skeletons
- ✅ **Error States** avec messages clairs
- ✅ **Hover States** sur tous les éléments interactifs
- ✅ **Focus States** pour accessibilité clavier

---

## 10. Recommandations d'Utilisation

### ✅ À FAIRE

```tsx
// 1. Utiliser les composants réutilisables
<button className="btn-primary">Créer</button>

// 2. Respecter l'espacement
<div className="p-6 space-y-4">

// 3. Combiner les tokens de couleur
<div className="bg-brand-50 dark:bg-brand-900/20">

// 4. Appliquer les transitions
<div className="transition-all duration-300 hover:shadow-lg">
```

### ❌ À ÉVITER

```tsx
// 1. Styles inline pour les propriétés récurrentes
<div style={{ color: '#6366f1' }}>  ❌

// 2. Hardcoder les couleurs (utiliser les variables)
<div className="bg-[#6366f1]">      ❌

// 3. Exagérer les animations
<div className="animate-bounce animate-pulse"> ❌

// 4. Négliger le contraste
<span className="text-gray-300 dark:text-gray-700"> ❌
```

---

## 11. Performance & Optimisation

### CSS Optimization

- 🎯 **Tailwind @apply** pour grouper les classes fréquentes
- 🎯 **CSS Variables** pour les thèmes dynamiques
- 🎯 **PurgeCSS** actif (node_modules, dist exclus)

### Commandes Utiles

```bash
npm run format         # Prettier formatting
npm run lint:fix      # ESLint auto-fix
npm run type-check    # TypeScript validation
npm run validate      # Full validation suite
```

---

## 12. Ressources & Références

| Ressource       | Lien                                              |
| --------------- | ------------------------------------------------- |
| Tailwind Config | `/src/index.css` (theme section)                  |
| ESLint Rules    | `/eslint.config.js`                               |
| Prettier Config | `/.prettierrc.json`                               |
| Couleurs        | [Night Indigo & Gold Palette](https://coolors.co) |
| Typography      | Plus Jakarta Sans, Space Grotesk                  |

---

## Conclusion

Ce guide valorise:

- 🎨 **Professionnalisme** via la cohérence
- 🎯 **Clarté** via la hiérarchie visuelle
- ♿ **Accessibilité** via le contraste et les transitions
- ⚡ **Performance** via les utilitaires Tailwind

**Moment de validation:** Avant chaque PR, vérifier que tous les éléments UI respectent ce guide.
