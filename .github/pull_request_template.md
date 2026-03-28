## 📋 Description

Décrire les changements et contexte. Pourquoi cette PR est nécessaire ?

**Type de changement** :

- [ ] 🐛 Bug fix (non-breaking)
- [ ] ✨ New feature (non-breaking)
- [ ] 🔄 Refactoring (non-breaking)
- [ ] 📚 Documentation
- [ ] 💥 Breaking change
- [ ] ⚡ Performance improvement
- [ ] 🔐 Security fix

## 🎯 Contexte métier

- Issue liée: Fixes #(issue_number) ou Relates to #(issue_number)
- Impact sur la fiscalité: [ ] Oui [ ] Non
- Impact sur les calculs: [ ] Oui [ ] Non
- Affecte les exports Factur-X: [ ] Oui [ ] Non

## 📝 Changements principaux

- Point 1
- Point 2
- Point 3

## 🧪 Tests

Comment tester cette PR ?

```bash
npm install
npm run dev
# Accédez à http://localhost:5173
# Testez: ...
```

**Couverture de tests ajoutée**: % → %

## 🔒 Checklist Sécurité

- [ ] Pas de secrets ou clés API exposées
- [ ] Pas de console.log() ou code de debug
- [ ] Validation des entrées utilisateur
- [ ] Gestion d'erreurs appropriée
- [ ] RGPD compliant si données utilisateur
- [ ] Pas de XSS vulnerabilities
- [ ] Pas de CSRF issues

## 💰 Checklist Fiscalité

Si changements de calculs :

- [ ] Formule documentée avec référence légale
- [ ] Tests unitaires inclus
- [ ] Decimal.js utilisé (pas de flottants natifs)
- [ ] Arrondi selon règles comptables françaises
- [ ] Testé avec valeurs réalistes URSSAF
- [ ] Conformité 2026

## ✅ Checklist avant soumission

- [ ] Mon code suit le style du projet
- [ ] TypeScript compilation sans erreurs (`npm run lint`)
- [ ] Tests passent localement (`npm run test`)
- [ ] Pas de console.log() en production
- [ ] Documentation mise à jour si nécessaire
- [ ] CHANGELOG.md mis à jour
- [ ] Pas de breaking changes (ou clairement documentés)
- [ ] Code comments sur les parties complexes
- [ ] Accessibility checks (a11y)

## 🔍 Code Review

- **Reviewers**: @Thomasxxl02 (ou codeowners auto-assignés)
- **Priorité**: Normal [ ] Haute [ ] Critique [ ]

- [ ] J'ai testé localement (npm run dev + npm run lint)
- [ ] Pas de console.log() laissé traîner
- [ ] TypeScript strict (npm run lint passe)
- [ ] .env.example est à jour si besoin

## 📸 Capture d'écran (si applicable)

Pour les changements UX :

### Avant

[Screenshot du comportement précédent]

### Après

[Screenshot du nouveau comportement]

## 🚀 Performance

- [ ] Pas de dégradation de performance
- [ ] Pas de goulots d'étranglement identifiés
- [ ] Bundles/assets optimisés si pertinent

## 💬 Notes supplémentaires

Ajoutez tout contexte supplémentaire que les reviewers doivent savoir.

---

**Merci pour votre contribution !** ❤️
