# 🎨 QUICK REFERENCE - Style Pro Cheat Sheet

## 🎯 Palette Couleurs

```
PRIMARY:        ACCENT:         NEUTRALS:       SEMANTICS:
#6366f1         #f59e0b         #64748b         ✅ #10b981 (profit)
Indigo          Gold            Slate           ❌ #ef4444 (loss)
(Buttons)       (Premium)       (Text)          ⏳ #f59e0b (pending)
```

---

## 🧩 Composants Clés

| Composant             | Classe           | Usage                 |
| --------------------- | ---------------- | --------------------- |
| **Bouton Principal**  | `.btn-primary`   | Actions importantes   |
| **Bouton Secondaire** | `.btn-secondary` | Actions alternatives  |
| **Input**             | `.input-modern`  | Tous les champs texte |
| **Carte**             | `.card-modern`   | Sections/conteneurs   |
| **Badge Success**     | `.badge-success` | Statuts positifs      |
| **Badge Warning**     | `.badge-warning` | Alertes               |
| **Badge Error**       | `.badge-error`   | Erreurs               |
| **Badge Premium**     | `.badge-premium` | Éléments premium      |
| **Alert**             | `.alert`         | Notifications         |
| **Table**             | `.table-modern`  | Listes de données     |

---

## ⌨️ Raccourcis Fréquents

```tsx
// Dark Mode (activé automatiquement)
<div className="dark">...</div>

// Espacements standard
py-12 px-6                    // Section padding
gap-6                          // Grid gap
p-6                            // Card padding

// Transitions
transition-all duration-300   // Standard

// Focus (Accessibilité)
className="focus-ring"        // Ring visible

// Text hierarchy
className="text-lead"         // Grand titre
className="text-subtitle"     // Sous-titre
className="text-caption"      // Caption petite
```

---

## 🎨 Variables CSS Disponibles

```css
/* Couleurs */
var(--color-brand-600)        /* Indigo */
var(--color-accent-500)       /* Gold */
var(--color-neutral-900)      /* Texte */

/* Ombres */
var(--shadow-md)
var(--shadow-lg)

/* Transitions */
var(--transition-fast)        /* 150ms */
var(--transition-base)        /* 250ms */

/* Radius */
var(--app-border-radius)      /* 12px */
var(--app-border-radius-xl)   /* 20px */
```

---

## ✅ Checklist Composant

Avant de soumettre une PR:

- [ ] Utilise les classes réutilisables (pas de styles inline)
- [ ] Fonctionne en light & dark mode
- [ ] Focus ring visible au clavier
- [ ] Animations respectent `prefers-reduced-motion`
- [ ] Contraste texte >= 4.5:1
- [ ] Responsive (mobile → desktop)

---

## 📖 Ressources

- **Guide Complet:** `docs/STYLE_GUIDE_PRO.md`
- **Exemples Code:** `docs/STYLE_COMPONENTS_EXAMPLES.tsx`
- **Validation:** `docs/STYLE_CHECKLIST.md`
- **Résumé:** `docs/STYLE_SYSTEM_SUMMARY.md`

---

## 🚨 Erreurs Courantes

```tsx
// ❌ MAUVAIS
<div style={{ color: '#6366f1' }}>
<button className="px-6 py-2">
<div className="bg-[#6366f1]">

// ✅ BON
<div className="text-brand-600">
<button className="btn-primary">
<div className="bg-brand-600">
```

---

## 🎯 Quick Commands

```bash
# Validation complète
npm run validate

# Vérifier style/lint
npm run lint
npm run format:check

# Fixer automatiquement
npm run lint:fix
npm run format

# Build production
npm run build
```

---

**Dernière mise à jour:** 28 avril 2026 | **Version:** 1.0 Pro
