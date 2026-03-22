# ✅ Checklist de Vérification - Onglet Sécurité

**Date de création**: 21 mars 2026  
**Version**: v1.1.0  
**Status**: À tester

---

## 📋 Avant de Commencer

- [ ] Backup des données (export JSON via Données)
- [ ] Navigateur à jour (Chrome 37+, Firefox 34+, Safari 11+)
- [ ] JavaScript activé
- [ ] Pop-ups autorisées

---

## 🔐 Test 1: Authentification 2FA

### Installation de l'Authenticateur
- [ ] Télécharger Google Authenticator (iOS/Android)
- [ ] Ou Microsoft Authenticator
- [ ] Ou Authy
- OU
- [ ] Ou LastPass Authenticator

### Activation de 2FA
- [ ] **Paramètres** → **Sécurité**
- [ ] Vérifier que le tab "🔐 Authentification 2FA" existe
- [ ] Vérifier le message "2FA est désactivée" et le bouton "📱 Générer un secret TOTP"
- [ ] Cliquer sur **"📱 Générer un secret TOTP"**
- [ ] Vérifier l'affichage du:
  - [ ] Code QR
  - [ ] Secret manuel (32 caractères)
  - [ ] Bouton **Copier**
- [ ] Scanner le code QR avec l'authenticateur
- [ ] OU entrer le secret TOTP manuellement
- [ ] Vérifier que l'authenticateur affiche un code à 6 chiffres
- [ ] Entrer le code dans le champ "Entrez le code à 6 chiffres"
- [ ] Cliquer sur **"✅ Valider et activer 2FA"**
- [ ] Vérifier le message "✅ 2FA activée"
- [ ] Vérifier le badge vert "✅ 2FA est activée"
- [ ] Vérifier la présence du bouton "🗑️ Désactiver 2FA"

### Désactivation de 2FA (Test)
- [ ] Cliquer sur **"🗑️ Désactiver 2FA"**
- [ ] Confirmer le dialog dangereux
- [ ] Vérifier le message "✅ 2FA désactivée"
- [ ] Vérifier que le tab redevient "2FA est désactivée"

---

## 🔑 Test 2: Gestion des API Keys

### Création de Clé API
- [ ] Naviguer au tab **"🔑 Gestion des API Keys"**
- [ ] Voir le formulaire "Ajouter une clé"
  - [ ] Champ "Nom de la clé"
  - [ ] Sélecteur "Service" (Gemini, Firebase, Custom)
  - [ ] Champ "Valeur de la clé" (avec toggle eye)
  - [ ] Bouton "➕ Ajouter une clé"

### Ajouter une Clé de Test
- [ ] Entrer un nom: "Test Gemini"
- [ ] Sélectionner Service: "Gemini"
- [ ] Entrer une valeur de clé fictive: "sk_test_abc123xyz"
- [ ] Cliquer sur **"➕ Ajouter une clé"**
- [ ] Voir le message "✅ Clé API ajoutée"
- [ ] Vérifier que les champs se vident

### Vérifier la Clé Créée
- [ ] Voir la section "Clés actives (1)"
- [ ] Vérifier les détails:
  - [ ] Nom: "Test Gemini"
  - [ ] Service: "🤖" (icône Gemini)
  - [ ] Preview: "sk_t***3xyz"
  - [ ] Statut: "✅ Actif"
  - [ ] Date de création: Aujourd'hui

### Ajouter une Clé Ancienne (Rotation)
- [ ] Ajouter une nouvelle clé nommée "Old Gemini"
- [ ] Modifier manuellement la `createdAt` en JSON (90+ jours ago)
- [ ] Vérifier que le message "⚠️ Rotation recommandée" apparaît

### Révoquer une Clé
- [ ] Cliquer sur l'icône **🗑️** sur la clé "Test Gemini"
- [ ] Confirmer l'action
- [ ] Vérifier que le statut change en "❌ Revoquée"
- [ ] Vérifier que le bouton 🗑️ disparaît

### Tester la Validation
- [ ] Ne pas entrer de nom, cliquer "Ajouter"
- [ ] Vérifier le message d'erreur "⚠️ Champs manquants"
- [ ] Corriger et réessayer

---

## 🗝️ Test 3: Reset Password

### Affichage du Tab
- [ ] Naviguer au tab **"🗝️ Réinitialiser le mot de passe"**
- [ ] Vérifier les champs:
  - [ ] Email de confirmation (désactivé)
  - [ ] Nouveau mot de passe
  - [ ] Confirmer le mot de passe

### Test de Force de Mot de Passe

#### Tester: Très faible
- [ ] Entrer "abc"
- [ ] Vérifier: Barre rouge 🔴, message "Très faible"
- [ ] Vérifier les suggestions: "Au moins 8 caractères", etc.

#### Tester: Faible
- [ ] Entrer "abcdef"
- [ ] Vérifier: Barre orange 🟠

#### Tester: Moyen
- [ ] Entrer "Abc12345"
- [ ] Vérifier: Barre jaune 🟡

#### Tester: Bon
- [ ] Entrer "Abc12345!"
- [ ] Vérifier: Barre verte 🟢, message "Bon"

#### Tester: Excellent
- [ ] Entrer "Micro2026!Facile#Sécurisé"
- [ ] Vérifier: Barre verte 🟢, message "Excellent"

### Test de Changement
- [ ] Entrer un bon mot de passe
- [ ] Entrer la confirmation (correctement)
- [ ] Vérifier que le bouton "🔄 Mettre à jour le mot de passe" n'est pas désactivé
- [ ] Cliquer sur le bouton
- [ ] Vérifier le dialog de confirmation
- [ ] Confirmer
- [ ] Vérifier le message "✅ Mot de passe réinitialisé"

### Test d'Erreur
- [ ] Entrer "Abc12345!" dans le premier champ
- [ ] Entrer "Abc12346!" dans la confirmation
- [ ] Vérifier le message d'erreur "Les mots de passe ne correspondent pas"

---

## 🚪 Test 4: Sessions Actives

### Vérifier l'Affichage
- [ ] Naviguer au tab **"🚪 Sessions actives"**
- [ ] Vérifier le titre "Sessions actives (X)"
- [ ] Si aucune session: voir "Aucune session active actuellement"

### Créer une Session de Test
```javascript
// Dans la console du navigateur (F12)
const session = {
  id: 'sess_test_123',
  deviceName: 'Test Desktop',
  ipAddress: '192.168.1.1',
  userAgent: navigator.userAgent,
  createdAt: Date.now(),
  lastActivityAt: Date.now(),
  isCurrent: false
};
const sessions = JSON.parse(localStorage.getItem('mgs_sessions') || '[]');
sessions.push(session);
localStorage.setItem('mgs_sessions', JSON.stringify(sessions));
location.reload(); // Recharger
```

### Vérifier la Session
- [ ] Voir la session "Test Desktop" dans la liste
- [ ] Vérifier le device name, IP, date
- [ ] Voir le bouton "Déconnecter"

### Déconnecter une Session
- [ ] Cliquer sur **"Déconnecter"** sur le "Test Desktop"
- [ ] Vérifier le dialog de confirmation
- [ ] Confirmer
- [ ] Vérifier que la session disparaît

### Historique de Connexion
- [ ] Si des entrées de login history existent:
  - [ ] Voir la section "📜 Historique de connexion"
  - [ ] Vérifier les 10 dernières avec statut ✅/❌
  - [ ] Vérifier les détails: device, timestamp

---

## 🔒 Test 5: Chiffrement des Données

### État Initial
- [ ] Naviguer au tab **"🔒 Chiffrement des données"**
- [ ] Voir le message d'avertissement amber:
  - "Vos données IBAN, SIRET... ne sont pas encore chiffrées"
- [ ] Voir le champ "Définissez un mot de passe de chiffrement"

### Activer le Chiffrement
- [ ] Entrer un mot de passe: "MonEncryption2026!"
- [ ] Vérifier que le bouton "🔐 Activer le chiffrement" devient actif
- [ ] Cliquer sur le bouton
- [ ] Vérifier le message de succès "✅ Données chiffrées"

### Après Activation
- [ ] Recharger la page
- [ ] Naviguer au tab "🔒 Chiffrement"
- [ ] Vérifier le badge vert: "✅ Vos données sensibles sont chiffrées"
- [ ] Vérifier le message "AES-256-GCM côté client"

### Vérifier les Informations de Sécurité
- [ ] Vérifier les bulletpoints:
  - [ ] Chiffrement AES-256-GCM
  - [ ] PBKDF2 (100000 iterations)
  - [ ] Données restent privées
  - [ ] ⚠️ Gardez votre mot de passe

---

## 🔄 Tests Supplémentaires

### Test de Persistence
- [ ] Fermer le navigateur (pas incognito)
- [ ] Rouvrir Micro-Gestion-Facile
- [ ] Vérifier que:
  - [ ] 2FA est toujours activée
  - [ ] API keys sont toujours présentes
  - [ ] Sessions sont toujours présentes
  - [ ] Chiffrement est toujours activé

### Test d'Accessibilité (WCAG)
- [ ] Pour chaque section de sécurité:
  - [ ] Vérifier les labels sur les champs
  - [ ] Vérifier les aria-labels
  - [ ] Tester avec la navigation au clavier (Tab, Enter)
  - [ ] Vérifier les contrastes de couleur

### Test sur Mobile
- [ ] Ouvrir sur un téléphone/tablette
- [ ] Tester chaque tab du sécurité:
  - [ ] Layout responsive
  - [ ] Boutons cliquables
  - [ ] Pas de débordement de texte
  - [ ] Dialogs centrés

### Test de Performance
- [ ] Ouvrir DevTools (F12) → Performance
- [ ] Mesurer:
  - [ ] Temps d'ouverture du tab Sécurité
  - [ ] Temps de clic sur "Valider 2FA"
  - [ ] Temps de création d'API key
  - Tous devraient être < 200ms

---

## 🐛 Dépannage

### Si Erreur lors de la Validation 2FA
- [ ] Vérifier l'heure du serveur (±30 secondes)
- [ ] Vérifier le code entré (sans espaces)
- [ ] Essayer avec le code suivant (la barre progresse)
- [ ] Voir la console pour les erreurs (F12 → Console)

### Si Impossible de Créer API Key
- [ ] Vérifier que tous les champs sont remplis
- [ ] Vérifier la console (F12) pour messages d'erreur
- [ ] Essayer avec un autre navigateur

### Si Sessions Ne S'Affichent Pas
- [ ] Vérifier que localStorage est activé (pas incognito)
- [ ] Vérifier dans DevTools → Application → localStorage
- [ ] Chercher "mgs_sessions"

### Si Chiffrement Échoue
- [ ] Vérifier que le mot de passe est suffisamment long
- [ ] Vérifier que le navigateur supporte SubtleCrypto
- [ ] Voir la console pour les erreurs crypto

---

## 📊 Résultats

### Checklist Complétée
- [ ] Tous les tests 2FA passent
- [ ] Tous les tests API Keys passent
- [ ] Tous les tests Password passent
- [ ] Tous les tests Sessions passent
- [ ] Tous les tests Chiffrement passent
- [ ] Pas d'erreurs dans la console
- [ ] Pas de warnings TypeScript
- [ ] Interface responsive sur tous les appareils

### Feedback
- [ ] Interface intuitive
- [ ] Messages d'erreur clairs
- [ ] Documentation facile à suivre
- [ ] Performance acceptable

---

## 📝 Notes de Test

```
Date de test: _______________
Testeur: _______________
Navigateur: _______________
Système: _______________

Problèmes trouvés:
1. _______________
2. _______________

Observations:
- _______________
- _______________
```

---

## ✨ Quand C'est Prêt!

Une fois tous les tests passés:
- [ ] Committer le code (`git commit -m "feat: advanced security features"`)
- [ ] Tagger une version (`git tag v1.1.0`)
- [ ] Documenter dans README.md
- [ ] Informer les utilisateurs des nouvelles fonctionnalités

---

**Bonne chance avec les tests, Thomas! 🚀**

Pour l'aide: Voir `SECURITY_GUIDE.md` ou `SECURITY_IMPLEMENTATION_SUMMARY.md`
