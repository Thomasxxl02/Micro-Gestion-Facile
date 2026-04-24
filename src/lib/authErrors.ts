/**
 * 🛠️ authErrors.ts - Traduction des erreurs Firebase Auth pour l'utilisateur
 */

// eslint-disable-next-line complexity
export const getFriendlyAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    // Erreurs d'authentification communes
    case "auth/invalid-email":
      return "L'adresse e-mail n'est pas valide.";
    case "auth/user-disabled":
      return "Ce compte a été désactivé.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou mot de passe incorrect.";
    case "auth/email-already-in-use":
      return "Cette adresse e-mail est déjà utilisée par un autre compte.";
    case "auth/operation-not-allowed":
      return "Cette méthode de connexion n'est pas activée.";
    case "auth/weak-password":
      return "Le mot de passe est trop faible.";
    case "auth/popup-closed-by-user":
      return "La fenêtre de connexion a été fermée avant la fin.";
    case "auth/cancelled-popup-request":
      return "Une seule fenêtre de connexion peut être ouverte à la fois.";
    case "auth/network-request-failed":
      return "Erreur réseau. Vérifiez votre connexion internet.";
    case "auth/too-many-requests":
      return "Trop de tentatives infructueuses. Veuillez réessayer plus tard.";
    case "auth/requires-recent-login":
      return "Cette opération est sensible et nécessite une reconnexion récente.";
    case "auth/internal-error":
      return "Une erreur interne est survenue. Veuillez réessayer.";

    // Erreurs spécifiques au lien magique
    case "auth/expired-action-code":
      return "Le lien a expiré. Veuillez en demander un nouveau.";
    case "auth/invalid-action-code":
      return "Le lien est invalide ou a déjà été utilisé.";

    // Erreurs Firestore / Permissions (si remontées via auth)
    case "permission-denied":
      return "Vous n'avez pas les permissions nécessaires.";
    case "unavailable":
      return "Le service est temporairement indisponible. Vérifiez votre connexion.";

    default:
      return "Une erreur inattendue est survenue. Veuillez réessayer.";
  }
};
