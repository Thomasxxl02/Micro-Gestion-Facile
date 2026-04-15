/**
 * useAuth — Hook d'initialisation Firebase Auth
 * Écoute les changements d'authentification et met à jour le store Zustand.
 */
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../firebase";
import { useAuthStore } from "../store/useAuthStore";

export function useAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const setIsAuthReady = useAuthStore((s) => s.setIsAuthReady);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, [setUser, setIsAuthReady]);
}
