# 🔐 Onglet Sécurité - Guide de Utilisation

## Vue d'ensemble

L'onglet **Sécurité** de Micro-Gestion-Facile fournit un ensemble complet de outils pour sécuriser votre compte et vos données. Ce guide vous explique chaque fonctionnalité.

---

## 1️⃣ Authentification 2FA (Deux Facteurs)

### 📱 Qu'est-ce que c'est?

L'authentification à deux facteurs (2FA) ajoute une couche de sécurité supplémentaire à votre compte. Même si quelqu'un obtient votre mot de passe, il ne pourra pas accéder à votre compte sans le code temporaire de votre authenticateur.

### ✅ Comment l'activer?

1. Cliquez sur le tab **🔐 Authentification 2FA**
2. Cliquez sur **📱 Générer un secret TOTP**
3. Scannez le code QR avec:
   - **Google Authenticator** (gratuit, iOS/Android)
   - **Microsoft Authenticator** (gratuit, iOS/Android)
   - **Authy** (gratuit, iOS/Android)
   - **LastPass Authenticator** (gratuit, iOS/Android)
4. Entrez le code à 6 chiffres généré par votre app
5. Cliquez sur **✅ Valider et activer 2FA**

### 🔄 Comment l'utiliser?

À chaque connexion:
1. Entrez votre email et mot de passe
2. Une fenêtre vous demandera d'entrer le code à 6 chiffres
3. Ouvrez votre app authenticateur et entrez le code actuel
4. Validez - vous êtes connecté!

> ⚠️ **Important**: Gardez votre téléphone en sécurité! Si vous perdez accès à votre app authenticateur, vous ne pourrez plus vous connecter.

### ❌ Comment désactiver?

Si vous n'en avez plus besoin:
1. Tab **🔐 Authentification 2FA**
2. Cliquez sur **🗑️ Désactiver 2FA**
3. Confirmez l'action

---

## 2️⃣ Gestion des API Keys

### 🔑 Qu'est-ce que c'est?

Les clés API permettent à Micro-Gestion-Facile de communiquer avec des services externes comme:
- **Gemini** (IA pour l'assistant virtuel)
- **Firebase** (sauvegarde cloud)
- D'autres services personnalisés

### ✅ Comment ajouter une clé?

1. Cliquez sur le tab **🔑 Gestion des API Keys**
2. Entrez:
   - **Nom**: Ex: "Gemini Production"
   - **Service**: Sélectionnez (Gemini, Firebase, Custom)
   - **Valeur**: Collez votre clé API
3. Cliquez sur **➕ Ajouter une clé**

### 🔒 Sécurité des clés

- ✅ Vos clés ne sont **jamais affichées** après création
- ✅ Nous stockons seulement un **hash SHA-256** sécurisé
- ✅ Seule une courte **preview** est affichée (ex: `sk_live_abc...`)
- ✅ Les clés sont**jamais envoyées au serveur**

### 🔄 Rotation des clés

Si une clé a plus de **90 jours**, vous verrez ⚠️ **Rotation recommandée**:
1. Générez une nouvelle clé sur le service (Gemini, Firebase, etc.)
2. Ajoutez-la ici
3. Mettez à jour votre code/paramètres
4. Révoquez l'ancienne clé

### 🗑️ Comment révoquer une clé?

1. Trouvez la clé dans la liste
2. Cliquez sur l'icône **🗑️**
3. Confirmez

> Cette action **désactive immédiatement** la clé!

---

## 3️⃣ Réinitialiser le Mot de Passe

### 🗝️ Comment changer votre mot de passe?

1. Cliquez sur le tab **🗝️ Réinitialiser le mot de passe**
2. Entrez votre **nouveau mot de passe**
3. Confirmez le mot de passe

### 💪 Force du mot de passe

Vous verrez une **barre de force** qui change de couleur:

```
🔴 Très faible  → Trop court ou manque de variété
🟠 Faible       → Besoin d'amélioration
🟡 Moyen        → Acceptable
🟢 Bon          → Solide
🟢 Excellent    → Très sécurisé
```

### ✅ Conseils pour un bon mot de passe

Le système vous aide avec des suggestions:
- ✅ Minimum **8 caractères** (idéalement 12+)
- ✅ Minuscules: a-z
- ✅ Majuscules: A-Z
- ✅ Chiffres: 0-9
- ✅ Caractères spéciaux: !@#$%^&*()

**Exemple bon mot de passe**: `Micro2026!Facile#Sécurisé`

---

## 4️⃣ Sessions Actives & Connexions

### 🚪 Qu'est-ce qu'une session?

Une session = une connexion active. Vous pouvez être connecté à plusieurs appareils en même temps.

### 📋 Voir vos sessions

1. Cliquez sur le tab **🚪 Sessions actives**
2. Vous verrez:
   - Nom de l'appareil (iPhone, Windows PC, etc.)
   - Adresse IP
   - Date de connexion

### 🔒 Gérer vos sessions

**Déconnecter un appareil**:
1. Trouvez l'appareil dans la liste
2. Cliquez sur **Déconnecter**
3. Cet appareil sera immédiatement déconnecté

**Déconnecter TOUS les autres appareils**:
1. Cliquez sur **🔒 Déconnecter les autres sessions**
2. Vous resterez connecté que sur l'appareil actuel
3. Tous les autres seront déconnectés

### 📜 Historique de connexion

Consultez les 10 dernières connexions:
```
✅ Windows PC    - 21 mars 2026 à 14:30
✅ iPhone        - 20 mars 2026 à 9:15
❌ Android Phone - 15 mars 2026 à 19:45 (Échec)
```

---

## 5️⃣ Chiffrement des Données Sensibles

### 🔒 Qu'est-ce que c'est?

Le chiffrement transforme vos données sensibles en code illisible. Seule une personne avec le bon **mot de passe** peut les lire.

### 📊 Quelles données?

Vos donner sensibles seront chiffrées:
- 💳 **IBAN** (compte bancaire)
- 🏷️ **SIRET** (numéro d'entreprise)
- 🏢 **SIREN** (identifiant légal)
- 🔢 **Numéro TVA**
- 🏦 **BIC/SWIFT**

### ✅ Comment l'activer?

1. Cliquez sur le tab **🔒 Chiffrement des données**
2. Entrez un **mot de passe fort**
3. Cliquez sur **🔐 Activer le chiffrement**

### 🔐 Technologie utilisée

- **Algorithme**: AES-256-GCM (niveau militaire)
- **Dérivation de clé**: PBKDF2 (100,000 itérations)
- **Localisation**: Tout se passe dans **votre navigateur**
- **Sécurité**: Vos données **ne quittent jamais votre appareil**

### ⚠️ Avertissements importants

> **IMPORTANT**: Gardez votre mot de passe de chiffrement en sécurité!
> - Si vous l'oubliez, **vous ne pourrez pas récupérer vos données**
> - Aucun moyen de "reset" ou de récupération
> - Notez-le dans un endroit sûr (coffre-fort, gestionnaire de mots de passe, etc.)

---

## 🔒 Meilleure Pratiques de Sécurité

### ✅ À FAIRE

- ✅ Activez **2FA dès maintenant**
- ✅ Utilisez des **mots de passe forts** et **uniques**
- ✅ **Révisez régulièrement** vos sessions actives
- ✅ **Rotatez vos API keys** tous les 90 jours
- ✅ Gardez votre téléphone **à jour** et **sécurisé**
- ✅ Chiffrez vos données sensibles si possible
- ✅ Utilisez un **gestionnaire de mots de passe** (Bitwarden, 1Password, LastPass)

### ❌ À ÉVITER

- ❌ Partager votre mot de passe ou vos clés API
- ❌ Réutiliser le même mot de passe partout
- ❌ Écrire vos mots de passe sur un Post-it
- ❌ Ignorer les notifications de "rotation recommandée"
- ❌ Garder vos sessions ouvertes sur des appareils publics
- ❌ Oublier votre mot de passe de chiffrement

---

## 🆘 Dépannage

### "J'ai perdu mon authenticateur 2FA"

**Solution**:
1. Vous ne pouvez **pas vous connecter** avec 2FA
2. Vous devez **réinitialiser** votre profil
3. Contacter le support si possible

### "Je ne me souviens plus de mon mot de passe de chiffrement"

**Malheureusement**:
- Il n'y a **aucun moyen** de le récupérer
- Vos données sensibles resteront chiffrées
- En dernier recours: exportez vos données et réinitialisez

### "Une clé API n'apparaît pas comme révoquer après suppression"

La suppression **est effective immédiatement**, mais:
- Si vous rafraîchissez la page, elle disparaîtra
- Le statut est synchronisé avec votre profil

---

## 📞 Questions?

Pour plus d'informations sur la sécurité des données:
- 📖 Lisez [SECURITY.md](../SECURITY.md)
- 🔗 Consultez [API_KEY_REVOCATION_GUIDE.md](../API_KEY_REVOCATION_GUIDE.md)
- 📧 Contactez le support

---

**Dernière mise à jour**: 21 mars 2026  
**Version**: 1.0  
**Auteur**: Micro-Gestion-Facile Team
