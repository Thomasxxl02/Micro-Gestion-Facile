# ✅ Checklist de Style Professionnel

## Objectif

Valider que tous les composants de Micro-Gestion-Facile respectent le thème professionnel **Night Indigo & Royal Gold**.

---

## 📋 CHECKLIST AVANT DÉPLOIEMENT

### 1. ✅ Cohérence Thématique

- [ ] **Couleur Primaire Indigo (#6366f1)**
  - [ ] Utilisée pour les boutons principaux
  - [ ] Utilisée pour les accents/hover states
  - [ ] Consistante en light & dark mode
  - Ligne(s) à vérifier: `btn-primary`, components avec `.dark`

- [ ] **Couleur Accentée Gold (#f59e0b)**
  - [ ] Utilisée pour les éléments premium
  - [ ] Utilisée pour les indicateurs "en attente"
  - [ ] Visible mais pas envahissante
  - Ligne(s) à vérifier: `.badge-premium`, `.financial-pending`

- [ ] **Neutres Slate (#64748b)**
  - [ ] Texte corps en contraste suffisant
  - [ ] Borders subtiles mais définies
  - [ ] Cohérent entre light et dark
  - Ligne(s) à vérifier: `--text-main`, `--card-border`

---

### 2. ✅ Typage & Hiérarchie

- [ ] **Space Grotesk** pour les titres (h1, h2, h3, h4)
  - [ ] Font-weight: 600-800
  - [ ] Letter-spacing: -0.04em
  - [ ] Line-height: 1.1

- [ ] **Plus Jakarta Sans** pour le corps
  - [ ] Corps: 400-600
  - [ ] Lisible en 16px par défaut
  - [ ] Ligne-height: 1.6+

- [ ] **JetBrains Mono** pour le code
  - [ ] Utilisé dans `<code>` blocks
  - [ ] Fonctionnaire en copies-colles (non-ligatures si possible)

Commande pour vérifier:

```bash
grep -r "font-display\|font-mono\|font-sans" src/components/ | head -20
```

---

### 3. ✅ Composants Réutilisables

#### Boutons

- [ ] `.btn-primary` → Gradient indigo + shadow
- [ ] `.btn-secondary` → Outline glassmorphic
- [ ] `.btn-tertiary` → Text-only brand colored
- [ ] Tous ont `:hover` scale visible
- [ ] Tous ont `:active` scale[0.98]
- [ ] Tous respectent `prefers-reduced-motion`

#### Inputs

- [ ] `.input-modern` → Focus ring 4px
- [ ] Placeholder correct (--input-placeholder)
- [ ] Border-color change au hover
- [ ] Validation: `.with-icon` spacing correct

#### Cards

- [ ] `.card-modern` → Rounded-4xl
- [ ] Border teintée indigo (light) ou gold (dark)
- [ ] Shadow élégante (non aggressive)
- [ ] Hover: translate(-4px) + border accentuation

#### Badges

- [ ] `.badge-success` → Green
- [ ] `.badge-warning` → Yellow
- [ ] `.badge-error` → Red
- [ ] `.badge-premium` → Gradient indigo-gold

---

### 4. ✅ Dark Mode

- [ ] `.dark` appliqué correctement au `<html>`
- [ ] Couleurs inversées :
  - [ ] Light: #fcfdfe → Dark: #030712
  - [ ] Text: #0a091f → #f9fafb
  - [ ] Borders: Teintées indigo en dark
- [ ] Contraste WCAG AA (4.5:1)
- [ ] Transitions fluides light ↔ dark
- [ ] Cards: glassmorphism accentuée

Tester:

```bash
# Ajouter .dark à <html> et vérifier visuel
```

---

### 5. ✅ Accessibilité

- [ ] **Contraste de Texte**
  - [ ] Ratio 4.5:1 minimum pour body text
  - [ ] Ratio 3:1 minimum pour UI components
  - Outil: https://webaim.org/resources/contrastchecker/

- [ ] **Focus Visible**
  - [ ] `.focus-ring` → ring-2 ring-offset-2 ring-brand-500
  - [ ] Tous les boutons et inputs focusables au clavier
  - [ ] Tab order logique

- [ ] **Reduced Motion**
  - [ ] `prefers-reduced-motion: reduce` respectée
  - [ ] Animations désactivées (~0.01ms)
  - [ ] `.card-modern:hover` pas de transform

- [ ] **Sémantique HTML**
  - [ ] `<button>` pour les actions
  - [ ] `<a>` pour les liens
  - [ ] `<label>` pour les inputs
  - [ ] `<table>` pour les tableaux (pas divs)

---

### 6. ✅ Animations & Transitions

- [ ] **Durées Standardisées**
  - [ ] Fast (150ms): micro-interactions
  - [ ] Base (250ms): standard
  - [ ] Slow (350ms): entrance/exit

- [ ] **Animations Clés Définies**
  - [ ] `fadeIn` (300ms)
  - [ ] `slideUp` (400ms)
  - [ ] `pulse` (2s) pour loading
  - [ ] `shimmer` (2s) pour skeletons

- [ ] **Smooth Transitions**
  - [ ] Toutes les `:hover` utilisent `transition-all`
  - [ ] Pas de transitions saccadées
  - [ ] Cubic-bezier cohérent: `(0.4, 0, 0.2, 1)`

---

### 7. ✅ Performance CSS

- [ ] **Tailwind PurgeCSS Actif**

  ```bash
  npm run build  # Vérifier size des CSS en console
  ```

  - [ ] CSS < 100KB (gzipped)
  - [ ] Pas de classes inutilisées

- [ ] **Variables CSS Utilisées**
  - [ ] Pas de hardcodes `#6366f1`
  - [ ] Utiliser `var(--color-brand-500)` à la place
  - Vérifier: `grep -r "bg-\[#" src/` (devrait être vide)

- [ ] **No Inline Styles**
  - [ ] Pas de `style={{ color: "#6366f1" }}`
  - [ ] Tout dans classes Tailwind

---

### 8. ✅ Layout & Spacing

- [ ] **Espacement Cohérent**
  - [ ] Padding standard: p-6
  - [ ] Gap standard: gap-6
  - [ ] Section padding: py-12 md:py-20

- [ ] **Border Radius Cohérent**
  - [ ] Inputs: rounded-2xl
  - [ ] Cards: rounded-4xl
  - [ ] Badges: rounded-full

- [ ] **Responsiveness**
  - [ ] Mobile: 1 colonne
  - [ ] Tablet (md): 2 colonnes
  - [ ] Desktop (lg): 3 colonnes
  - Tester: DevTools → Device Emulation

---

### 9. ✅ Indicateurs Financiers

- [ ] **Profit** → Green (#10b981)
  - [ ] Background: rgba(16, 185, 129, 0.1)
  - [ ] Border: rgba(16, 185, 129, 0.3)

- [ ] **Loss** → Red (#ef4444)
  - [ ] Background: rgba(239, 68, 68, 0.1)
  - [ ] Border: rgba(239, 68, 68, 0.3)

- [ ] **Pending** → Gold (#f59e0b)
  - [ ] Background: rgba(245, 158, 11, 0.1)
  - [ ] Border: rgba(245, 158, 11, 0.3)

- [ ] **Neutral** → Slate (#64748b)
  - [ ] Background: rgba(100, 116, 139, 0.1)

Tester dans tableaux factures:

```tsx
// Couleur dépend du statut
<td className={statuses[row.status]} />
```

---

### 10. ✅ Composants Modernes

- [ ] **Tables** (`.table-modern`)
  - [ ] Header: gradient indigo
  - [ ] Hover: subtle background change
  - [ ] Border: cohérent

- [ ] **Alerts** (`.alert`)
  - [ ] Success, Warning, Error, Info
  - [ ] Icon + message + close button

- [ ] **Badges** (`.badge-*`)
  - [ ] Tailles cohérentes
  - [ ] Dot indicator optionnel
  - [ ] Stacked sans problème

- [ ] **Forms** (`.form-*`)
  - [ ] Helper text
  - [ ] Error message avec icone
  - [ ] Validation au-live si possible

---

### 11. ✅ Mode Sombre Complet

Tester chaque page/composant en mode sombre:

**Pages à vérifier:**

- [ ] Dashboard
- [ ] Facturation
- [ ] Clients
- [ ] Comptabilité
- [ ] Paramètres
- [ ] Modals/Dialogs
- [ ] Tableaux

**Pour chaque:**

- [ ] Texte lisible
- [ ] Borders visibles
- [ ] Shadows cohérentes
- [ ] Cards sont glassmorphes
- [ ] Pas d'éléments "perdus" en fond noir

---

### 12. ✅ Pre-Deploy Validation

```bash
# 1. TypeScript check
npm run type-check

# 2. ESLint
npm run lint

# 3. Format
npm run format:check

# 4. Tests
npm run test

# 5. Full validation
npm run validate

# 6. Build production
npm run build
```

- [ ] Pas d'erreurs TypeScript
- [ ] Pas de ESLint warnings
- [ ] Format conforme Prettier
- [ ] Tests passing
- [ ] Build success (< 1MB)

---

### 13. ✅ Browser Compatibility

Tester sur:

- [ ] Chrome/Edge (Chromium 121+)
- [ ] Firefox (115+)
- [ ] Safari (17+)
- [ ] Mobile Safari (iOS 17+)
- [ ] Samsung Internet

**Points critiques:**

- [ ] CSS Variables supportées
- [ ] `backdrop-blur` fonctionne
- [ ] Gradients corrects
- [ ] Scrollbars stylisées (Chrome/Edge seulement)

---

### 14. ✅ Performance Metrics

Mesurer via DevTools → Performance:

- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] First Input Delay (FID): < 100ms
- [ ] Cumulative Layout Shift (CLS): < 0.1

Profiler:

```bash
npm run test:coverage  # Voir Coverage
```

---

## 🎨 Ressources de Référence

| Ressource      | Localisation                                                     |
| -------------- | ---------------------------------------------------------------- |
| Style Guide    | [STYLE_GUIDE_PRO.md](./STYLE_GUIDE_PRO.md)                       |
| Exemples React | [STYLE_COMPONENTS_EXAMPLES.tsx](./STYLE_COMPONENTS_EXAMPLES.tsx) |
| Config CSS     | [src/index.css](../src/index.css)                                |
| ESLint         | [eslint.config.js](../eslint.config.js)                          |
| Prettier       | [.prettierrc.json](../.prettierrc.json)                          |

---

## 🚀 Processus d'Approbation

Avant de fusionner une PR:

1. **Visuellement**
   - [ ] Reviewer vérifie le design en light & dark mode
   - [ ] Pas d'incohérences avec le thème
   - [ ] Animations fluides

2. **Techniquement**
   - [ ] `npm run validate` pass
   - [ ] Tests coverage > 80%
   - [ ] Pas de hardcodes couleurs

3. **Accessibilité**
   - [ ] WCAG AA minimum
   - [ ] Keyboard navigation OK
   - [ ] Screen reader tested (si applicable)

4. **Performance**
   - [ ] Pas de CSS dupliquées
   - [ ] Build size acceptable
   - [ ] Animations 60fps

---

## 📝 Notes

**Mise à jour:** 28 avril 2026
**Responsable:** Thomas (Micro-Gestion-Facile)
**Thème:** Night Indigo (#6366f1) & Royal Gold (#f59e0b)
**Status:** ✅ Active

---

### À Faire Prochainement

- [ ] Auditer tous les composants existants
- [ ] Migrer les styles inline vers Tailwind
- [ ] Créer une Storybook avec components stylisés
- [ ] Setup Lighthouse CI pour les métriques
- [ ] Documentation Figma (design system)
