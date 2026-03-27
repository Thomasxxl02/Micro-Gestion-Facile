# 🏗️ Architecture Micro-Gestion-Facile

**Vision:** Souveraineté numérique pour micro-entrepreneurs français. Code open source, données utilisateur, zéro vendor lock-in.

---

## 📐 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 19 TSX)                 │
│  Dashboard | InvoiceManager | ClientManager | ... (Vite)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              State Management (Zustand)                       │
│  Global app state + localStorage persistence                │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────┐               ┌───────────▼──────┐
│ Service Layer  │               │ Core Logic       │
├────────────────┤               ├──────────────────┤
│ geminiService  │               │ invoiceCalcs     │
│ firebase.ts    │               │ (Decimal.js)     │
│ (Auth + DB)    │               │ (TVA, URSSAF)    │
└────────────────┘               └──────────────────┘
        │
┌───────▼──────────────────────────────────────────┐
│   Backend (Firebase / Supabase option)           │
├─────────────────────────────────────────────────┤
│ • Authentication (Google OAuth)                  │
│ • Firestore (Documents collections)             │
│ • Rules (RBAC - Role-Based Access Control)      │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Piles technologiques

### **Frontend**

| Technologie      | Rôle               | Version |
| ---------------- | ------------------ | ------- |
| **React**        | UI Framework       | 19.2.3  |
| **TypeScript**   | Type Safety        | 5.8.2   |
| **Vite**         | Build & Dev Server | 6.2.0   |
| **Tailwind CSS** | Styling            | 4.2.1   |
| **Zustand**      | State Management   | 5.0.12  |
| **Lucide React** | Icons              | 0.563.0 |
| **Recharts**     | Data Visualization | 3.7.0   |

### **État de l'application**

```typescript
// Store Zustand (store/appStore.ts)
AppStoreState = {
  // UI
  currentView: 'dashboard' | 'invoices' | 'clients' | ...
  isDarkMode: boolean
  isMobileMenuOpen: boolean

  // Auth
  user: User | null
  isAuthReady: boolean

  // Data
  invoices: Invoice[]
  clients: Client[]
  suppliers: Supplier[]
  products: Product[]
  expenses: Expense[]
  emails: Email[]
  emailTemplates: EmailTemplate[]
  calendarEvents: CalendarEvent[]
  userProfile: UserProfile
}
```

### **Services**

- **Firebase** (`firebase.ts`)
  - Auth: Google OAuth, logout
  - Firestore: CRUD avec UID separation
  - Rules: Sécurité RBAC

- **AI** (`services/geminiService.ts`)
  - Analyse documents
  - Suggestions ia-assistées

### **Calculs métier**

- **Fiscal** (`lib/invoiceCalculations.ts`)
  - TVA (0%, 2.1%, 5.5%, 20%)
  - Micro-entrepreneur (URSSAF)
  - Calculs HT/TTC précis (Decimal.js)

---

## 📊 Modèles de données

### **Structure Firestore**

```
firestore/
├── invoices/{docId}
│   ├── uid: string (index utilisateur)
│   ├── number: string
│   ├── clientId: string (reference)
│   ├── items: InvoiceItem[]
│   ├── totalHT: number
│   ├── totalTTC: number
│   ├── status: 'draft' | 'sent' | 'paid' | 'overdue'
│   └── ...
│
├── clients/{docId}
│   ├── uid: string
│   ├── name: string
│   ├── email: string
│   ├── phone: string
│   ├── address: string
│   └── ...
│
├── profiles/{uid}
│   ├── companyName: string
│   ├── siret: string
│   ├── defaultVatRate: number
│   ├── invoicePrefix: 'FAC-'
│   └── ... (config utilisateur)
│
└── ... (suppliers, products, expenses, emails, calendar)
```

**Stratégie d'indexation:**

- Index primaire: `uid` (isolation utilisateur)
- Index composite: `uid + status` (requêtes filtrées)
- Index timestamp: `createdAt` (tri)

---

## 🔐 Sécurité

### **Firestore Rules (RBAC)**

```typescript
// Only authenticated users can read/write their own documents
match /collection/{document=**} {
  allow read, write: if request.auth.uid == resource.data.uid
}
```

### **Authentification**

- Google OAuth via Firebase Auth
- Tokens JWT (Firebase)
- Stockage sécurisé (localStorage avec HTTPS)

### **Données sensibles**

- SIRET: visible utilisateur uniquement
- Revenus: isolés par UID
- Email: encrypted at transit (HTTPS)

---

## 🌐 Flux de données

### **1. Authentification**

```mermaid
User → Google → Firebase Auth → User object + JWT → Zustand store
```

### **2. Synchronisation Firestore (Real-time)**

```
Zustand store ← onSnapshot(query) ← Firestore
                 (2-way binding)

User action → saveDoc() → setDoc(Firestore) → onSnapshot update
```

### **3. Export données**

```
Zustand store → JSON/CSV converter → Download file
              → Chiffrement (optionnel) → File stockage local
```

---

## 📱 Composants principaux

### **Pages (entrypoint)**

- `App.tsx` - router logique, auth guard
- `components/Dashboard.tsx` - overview + widgets
- `components/InvoiceManager.tsx` - CRUD factures
- `components/ClientManager.tsx` - CRUD clients
- `components/AccountingManager.tsx` - calculs fiscaux
- `components/SettingsManager.tsx` - profil utilisateur

### **Patterns**

**Pattern 1: Zustand Hook**

```typescript
const state = useAppStore((s) => s.invoices);
const setter = useAppStore((s) => s.setInvoices);
```

**Pattern 2: Firestore Sync**

```typescript
useEffect(() => {
  if (!user) return;
  const unsubscribe = onSnapshot(
    query(collection(db, 'invoices'), where('uid', '==', user.uid)),
    (snapshot) => setInvoices(snapshot.docs.map((doc) => doc.data()))
  );
  return unsubscribe; // cleanup
}, [user]);
```

**Pattern 3: Save to Firestore**

```typescript
const saveDoc = async (collection, data) => {
  await setDoc(doc(db, collection, data.id), { ...data, uid: user.uid });
};
```

---

## 🔄 Diagramme de cycle de vie

### **Invoice lifecycle**

```
1. CREATION
   Form input → Zustand → saveDoc() → Firestore

2. EDITION
   Edit modal → Zustand update → saveDoc() → onSnapshot refresh

3. PUBLICATION
   Mark as 'sent' → Email template render → Send via API

4. PAIEMENT
   Mark as 'paid' → Accounting totals update → Reports refresh

5. ARCHIVAGE / EXPORT
   Select → JSON/PDF export → Local download
```

---

## 🛠️ Scripts & Développement

### **Commands**

```bash
npm run dev          # Vite dev server + HMR
npm run build        # Production bundle
npm run lint         # TypeScript check
npm run format       # Prettier auto-format
npm run test         # Vitest unit tests
npm run test:ui      # Vitest debug UI
npm run test:coverage # Coverage report
```

### **Environnement local**

```typescript
// .env.local (create manually)
VITE_FIREBASE_API_KEY = xxx;
VITE_FIREBASE_AUTH_DOMAIN = xxx;
VITE_FIREBASE_PROJECT_ID = xxx;
VITE_FIREBASE_STORAGE_BUCKET = xxx;
VITE_FIREBASE_MESSAGING_SENDER_ID = xxx;
VITE_FIREBASE_APP_ID = xxx;
VITE_GOOGLE_AI_KEY = xxx;
```

---

## 📦 Dépendances critiques

### **À tester / Remplacer (optionnel)**

| Package      | Raison      | Alternative                 |
| ------------ | ----------- | --------------------------- |
| firebase     | Auth + DB   | Supabase (self-hosted)      |
| google/genai | Suggestions | Ollama (local) / Claude API |
| recharts     | Graphiques  | Chart.js / D3.js            |

### **Production-ready**

- ✅ Zustand (state)
- ✅ Decimal.js (calculs précis)
- ✅ Tailwind (CSS)
- ✅ Lucide (icons)
- ✅ date-fns (dates)

---

## 🚀 Roadmap d'amélioration

### **Q2 2026**

- [ ] Abstraction DataLayer (support Supabase)
- [ ] Export JSON/CSV complet
- [ ] Chiffrement E2E optionnel
- [ ] Tests d'accessibilité (WCAG AA)

### **Q3 2026**

- [ ] Mode hors-ligne (Service Worker)
- [ ] Sync multi-device
- [ ] Mobile app (React Native)
- [ ] Backup automatique chiffré

### **Q4 2026**

- [ ] Intégration bancaire (Open Banking)
- [ ] Signature numérique Factur-X
- [ ] Dashboard collaboratif
- [ ] API REST publique

---

## 📚 Documentation additionnelle

- [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Guide contribution
- [DATA_PORTABILITY.md](docs/DATA_PORTABILITY.md) - Portabilité données
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Déploiement infrastructure
- [SECURITY.md](SECURITY.md) - Audit sécurité

---

## 💡 Principes de conception

### **1. Souveraineté d'abord**

- Zero données sur serveurs US
- Datacenter France possible
- Export/Backup local facilité

### **2. Open Source**

- MIT/AGPL license
- Contributions bienvenues
- Pas de fork propriétaire

### **3. User-first data**

- Droit à l'oubli implémenté
- Export facile
- Pas de tracking analytics

### **4. Standard first**

- Factur-X (export PDF)
- JSON Schema validation
- SQL migrations versionnées

---

**Dernière mise à jour:** 19 mars 2026  
**Mainteneur:** @Thomasxxl02  
**Communauté:** Contribution bienvenue ! 🤝
