import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { auth } from '../firebase';
import { useAppStore } from '../store/appStore';

/**
 * Souscrit à onAuthStateChanged et hydrate le store Zustand.
 * À appeler une seule fois au niveau racine de l'app.
 */
export const useAuth = (): void => {
  const setUser = useAppStore((s) => s.setUser);
  const setIsAuthReady = useAppStore((s) => s.setIsAuthReady);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [setUser, setIsAuthReady]);
};
