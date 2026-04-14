/**
 * Hook centralisé : orchestre la sync de toutes les collections
 * Responsabilités :
 * - Synchroniser 8+ collections Firestore/Dexie
 * - Propager automatiquement vers Zustand
 * - Gérer l'état global de synchronisation
 *
 * Utilisation :
 * const { invoices, clients, products, ... } = useAppShellSync(userId)
 */

import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { uploadToCloud } from '../services/cloudSyncService';
import { useAppStore } from '../store/appStore';
import {
  type CalendarEvent,
  type Client,
  type Email,
  type EmailTemplate,
  type Expense,
  type Invoice,
  type Product,
  type Supplier,
  type UserProfile,
} from '../types';
import { useOfflineSync } from './useOfflineSync';

export interface AppShellSyncResult {
  // Collections synchronisées
  invoices: Invoice[];
  clients: Client[];
  products: Product[];
  suppliers: Supplier[];
  expenses: Expense[];
  emails: Email[];
  emailTemplates: EmailTemplate[];
  calendarEvents: CalendarEvent[];
  userProfile: UserProfile | null;

  // Callbacks pour CRUD
  saveInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  saveClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  saveSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  saveExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  saveEmail: (email: Email) => void;
  deleteEmail: (id: string) => void;
  saveEmailTemplate: (template: EmailTemplate) => void;
  deleteEmailTemplate: (id: string) => void;
  saveCalendarEvent: (event: CalendarEvent) => void;
  deleteCalendarEvent: (id: string) => void;
  saveUserProfile: (profile: UserProfile) => void;
}

// Callbacks génériques pour Firestore
const useFirestoreCRUD = (userId: string) => {
  const saveDoc = async <T extends { id: string }>(
    collectionName: string,
    data: T
  ): Promise<void> => {
    if (!userId) {
      return;
    }
    try {
      await setDoc(doc(db, collectionName, data.id), { ...data, uid: userId });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${data.id}`);
    }
  };

  const deleteDocFromFirestore = async (collectionName: string, id: string): Promise<void> => {
    if (!userId) {
      return;
    }
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  return { saveDoc, deleteDocFromFirestore };
};

export const useAppShellSync = (userId: string): AppShellSyncResult => {
  // ─── STATE MANAGEMENT ───
  const {
    setInvoices,
    setClients,
    setProducts,
    setSuppliers,
    setExpenses,
    setEmails,
    setEmailTemplates,
    setCalendarEvents,
    setIsSyncing,
  } = useAppStore();

  // ─── FIRESTORE CRUD HELPERS ───
  const { saveDoc, deleteDocFromFirestore: _deleteDocFromFirestore } = useFirestoreCRUD(userId);

  // ─── PHASE 1 : OFFLINE-FIRST (invoices, clients, products) ───
  const {
    data: invoices,
    upsert: saveInvoice,
    remove: deleteInvoice,
  } = useOfflineSync<Invoice>({
    userId,
    collectionName: 'invoices',
    dexieTableName: 'invoices',
  });

  const {
    data: clients,
    upsert: saveClient,
    remove: deleteClient,
  } = useOfflineSync<Client>({
    userId,
    collectionName: 'clients',
    dexieTableName: 'clients',
  });

  const {
    data: products,
    upsert: saveProduct,
    remove: deleteProduct,
  } = useOfflineSync<Product>({
    userId,
    collectionName: 'products',
    dexieTableName: 'products',
  });

  // ─── PHASE 2/3 : OFFLINE-FIRST (suppliers, expenses, emails, etc.) ───
  const {
    data: suppliers,
    upsert: saveSupplier,
    remove: deleteSupplier,
  } = useOfflineSync<Supplier>({
    userId,
    collectionName: 'suppliers',
    dexieTableName: 'suppliers',
  });

  const {
    data: expenses,
    upsert: saveExpense,
    remove: deleteExpense,
  } = useOfflineSync<Expense>({
    userId,
    collectionName: 'expenses',
    dexieTableName: 'expenses',
  });

  const {
    data: emails,
    upsert: saveEmail,
    remove: deleteEmail,
  } = useOfflineSync<Email>({
    userId,
    collectionName: 'emails',
    dexieTableName: 'emails',
  });

  const {
    data: emailTemplates,
    upsert: saveEmailTemplate,
    remove: deleteEmailTemplate,
  } = useOfflineSync<EmailTemplate>({
    userId,
    collectionName: 'emailTemplates',
    dexieTableName: 'emailTemplates',
  });

  const {
    data: calendarEvents,
    upsert: saveCalendarEvent,
    remove: deleteCalendarEvent,
  } = useOfflineSync<CalendarEvent>({
    userId,
    collectionName: 'calendarEvents',
    dexieTableName: 'calendarEvents',
  });

  // ─── PROPAGATION VERS ZUSTAND (CENTRALISÉE) ───
  useEffect(() => {
    setInvoices(invoices);
  }, [invoices, setInvoices]);

  useEffect(() => {
    setClients(clients);
  }, [clients, setClients]);

  useEffect(() => {
    setProducts(products);
  }, [products, setProducts]);

  useEffect(() => {
    setSuppliers(suppliers);
  }, [suppliers, setSuppliers]);

  useEffect(() => {
    setExpenses(expenses);
  }, [expenses, setExpenses]);

  useEffect(() => {
    setEmails(emails);
  }, [emails, setEmails]);

  useEffect(() => {
    setEmailTemplates(emailTemplates);
  }, [emailTemplates, setEmailTemplates]);

  useEffect(() => {
    setCalendarEvents(calendarEvents);
  }, [calendarEvents, setCalendarEvents]);

  // ─── GESTION STATE GLOBAL SYNC ───
  // Lever le loading global une fois que les données principales arrivent
  useEffect(() => {
    if (invoices.length > 0 || clients.length > 0) {
      setIsSyncing(false);
    }

    // Fallback : si rien après 2s (nouvel utilisateur), lever le loading quand même
    const timer = setTimeout(() => setIsSyncing(false), 2000);
    return () => clearTimeout(timer);
  }, [invoices.length, clients.length, setIsSyncing]);

  // ─── FIRESTORE SUBSCRIPTION : userProfile (cas spécial : doc snapshot) ───
  useUserProfileSync(userId);
  const userProfile = useAppStore((s) => s.userProfile);

  // ─── CLOUD AUTO-SYNC TRIGGER ───
  useEffect(() => {
    if (
      userProfile.integrations?.cloudSync?.autoSyncExports &&
      userProfile.integrations.cloudSync.provider !== 'none'
    ) {
      const provider = userProfile.integrations.cloudSync.provider;
      const dataToSync = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        userProfile,
        invoices,
        clients,
        suppliers,
        products,
        expenses,
      };

      const syncTimer = setTimeout(async () => {
        try {
          await uploadToCloud(
            provider,
            `mgf-backup-${new Date().toISOString().split('T')[0]}.json`,
            JSON.stringify(dataToSync)
          );
        } catch (e) {
          console.error('[CloudSync] Auto-sync failed:', e);
        }
      }, 5000); // Délai de 5s pour éviter de spammer si plusieurs modifs rapides

      return () => clearTimeout(syncTimer);
    }
  }, [userProfile, invoices, clients, products, suppliers, expenses]);

  // ─── SAVE WRAPPER POUR FIRESTORE ───
  const saveUserProfile = (profile: UserProfile) => {
    if (userId) {
      saveDoc('profiles', { ...profile, id: userId } as UserProfile & { id: string });
    }
  };

  // ─── RETOUR CENTRALISÉ ───
  return {
    invoices,
    clients,
    products,
    suppliers,
    expenses,
    emails,
    emailTemplates,
    calendarEvents,
    userProfile,
    saveInvoice,
    deleteInvoice,
    saveClient,
    deleteClient,
    saveProduct,
    deleteProduct,
    saveSupplier,
    deleteSupplier,
    saveExpense,
    deleteExpense,
    saveEmail,
    deleteEmail,
    saveEmailTemplate,
    deleteEmailTemplate,
    saveCalendarEvent,
    deleteCalendarEvent,
    saveUserProfile,
  };
};

/**
 * Hook spécifique pour userProfile (doc snapshot, pas collection query)
 */
const useUserProfileSync = (userId: string): void => {
  const { setUserProfile: setStoreUserProfile } = useAppStore();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubProfile = onSnapshot(
      doc(db, 'profiles', userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setStoreUserProfile(data);
        }
      },
      () => handleFirestoreError(null, OperationType.GET, `profiles/${userId}`)
    );

    return () => unsubProfile();
  }, [userId, setStoreUserProfile]);
};
