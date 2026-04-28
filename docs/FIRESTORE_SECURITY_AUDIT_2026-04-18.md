# 🔐 Audit de Sécurité Firestore — Phase 3

## 📋 Date de l'Audit

18 avril 2026

## ✅ Points Positifs

### 1. **Helper Functions Robustes**

- ✅ `isAuthenticated()` - Vérifie request.auth != null
- ✅ `isDocOwner()` - Vérifie uid du document = uid de l'utilisateur
- ✅ `isOwner(userId)` - Vérifie que userId matche auth.uid
- ✅ `isAdmin()` - Protection d'admin avec email whitelist + role check
- ✅ `uidUnchanged()` / `uidNotModified()` - Empêche la manipulation de uid

### 2. **Validation de Domaine**

- ✅ Types stricts (string, number, bool)
- ✅ Taille minimale/maximale (name.size() < 100)
- ✅ Champs obligatoires vérifiés

### 3. **Isolation de Données**

- ✅ Chaque document contient uid du propriétaire
- ✅ Lectures/écritures limitées au propriétaire ou admin
- ✅ Règles cohérentes pour toutes collections

## ⚠️ Problèmes et Recommandations

### 1. **MERGE CONFLICT** (Line ~185)

```
<<<<<<< Updated upstream:firestore.rules
=======
(merge conflict marker detected)
```

**Impact**: CRITIQUE — Les règles après le conflit ne sont pas appliquées
**Action**: Nettoyer le conflict immédiatement

**Fix**:

```bash
# Manually review and resolve
firestore.rules  # Remove <<<<<<< and ======= markers
```

### 2. **Admin Check — Perfoman ce**

**Problème**:

```
function isAdmin() {
  return isAuthenticated() &&
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
      (request.auth.token.email == "carpentier.thomas.02@gmail.com" && ...));
}
```

- ❌ `get()` call **à chaque requête** = lecture inefficace
- ❌ Email hardcodé dans règles
- ❌ Token parsing peut échouer si email_verified est false

**Recommandation**:

- Utiliser Custom Claims au lieu de `get()` dans Firestore
- Implémenter via Firebase Function lors du login:

```javascript
admin.auth().setCustomUserClaims(userId, { role: "admin" });
// Puis dans firestore.rules:
function isAdmin() {
  return request.auth.token.role == "admin";
}
```

### 3. **Validation - Champs Optionnels Non Restrictifs**

**Problème**:

```
(!('activityType' in data) || data.activityType in ['SERVICE_BNC', ...])
```

- Acceptable pour migration graduelle
- ✅ Correct pour champs optionnels

### 4. **Absence de Rate Limiting**

**Problème**: Aucune protection contre brute force / DoS

- Utilisateur peut créer unlimited documents
- Pas de quota par collection

**Recommandation** (Cloud Functions):

```typescript
// Ajouter middleware rate limiting via Cloud Tasks
async function checkRateLimit(uid: string) {
  const docPath = `rateLimits/${uid}`;
  const doc = await db.doc(docPath).get();
  const now = Date.now();

  if (doc.exists) {
    const { count, resetAt } = doc.data();
    if (now < resetAt && count >= 100) {
      throw new Error("Rate limit exceeded");
    }
  }
}
```

### 5. **Absence de Timestamps Serveur**

**Problème**:

- `createdAt`, `updatedAt` ne sont pas imposés côté serveur
- Client peut manipuler timestamps

**Recommandation** (à ajouter):

```firestore
// Dans chaque fonction isValid*():
&& (!('createdAt' in data) || data.createdAt == request.time)
&& (!('updatedAt' in data) || data.updatedAt == request.time)
```

### 6. **Collections Manquantes - Pas de Règles**

**Collections sans règles explicites** (implicitly DENIED):

- `users` - Devrait être visible seulement par propriétaire
- `emailLoginRequests` - Nécessite règles spéciales (TTL, nonce)
- `logs` - Devrait bloquer client, only backend writes

**Recommandation**:

```firestore
match /users/{userId} {
  allow read: if isOwner(userId);
  allow write: if false; // Only via Admin SDK
}

match /emailLoginRequests/{nonce} {
  allow read: if request.query.email == request.resource.data.email;
  allow write: if false; // Only via Cloud Function
}

match /logs/{docId} {
  allow read, write: if false; // Server-side only
}
```

### 7. **Pas de Vérifica tion de Longueur pour Données Volumineuses**

**Problème**:

- `notes`, `description` peuvent être très volumineux
- Risque de explosion de données

**Recommandation**:

```firestore
function isValidExpense(data) {
  return data.id is string &&
         data.amount is number &&
         data.uid == request.auth.uid &&
         (!('notes' in data) || data.notes.size() < 5000); // Max 5KB
}
```

## 🔒 Checklist de Sécurité 2026

- [x] Authentification à chaque opération
- [x] Isolation de données par utilisateur
- [x] Validation de types
- [x] Protection UID (non-modifiable)
- [ ] Custom Claims pour admin (TODO)
- [ ] Rate limiting (TODO - Cloud Function)
- [ ] Server-side timestamps (TODO)
- [ ] Collectiuons additionnelles (TODO)
- [ ] Limites de taille (TODO)
- [ ] RGPD - droit à l'oubli (TODO - Cloud Function)

## 📝 Test avec Emulator

```bash
# Start emulator
firebase emulators:start --only firestore

# Run tests (package.json script:')
npm run test

# Vérifications:
1. test_read_own_data_succeeds()
2. test_read_other_user_fails()
3. test_create_with_wrong_uid_fails()
4. test_admin_can_read_all()
5. test_merge_conflict_not_present()
```

## 🎯 Priorité d'Implémentation

### URGENT (Block release):

1. Résoudre merge conflict
2. Ajouter règles pour `users`, `logs`, `emailLoginRequests`

### HAUTE (Next sprint):

3. Migrer isAdmin() vers Custom Claims
4. Ajouter server-side timestamps
5. Implémenter rate limiting

### MOYEN (Post-launch):

6. Ajouter limites de taille
7. RGPD - implément droit à l'oubli

## 🚀 Prochaines Étapes

1. Nettoyez merge conflict dans firestore.rules
2. Renoncez test suite avec emulator
3. Commitez au git avec tag `security-audit-2026-04-18`
