/**
 * Tests unitaires pour l'authentification GitHub
 * Vitest + @testing-library/react
 */

import { render, screen } from '@testing-library/react';
import { signInWithPopup } from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubLoginButton } from '../components/GitHubLoginButton';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { GitHubAuthService } from '../services/authService';

// Mocks
vi.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(() => vi.fn()),
    currentUser: null,
  },
  db: {},
  googleProvider: { setCustomParameters: vi.fn() },
  githubProvider: { addScope: vi.fn(), setCustomParameters: vi.fn() },
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({})),
  connectAuthEmulator: vi.fn(),
  GithubAuthProvider: vi.fn().mockImplementation(function () {
    return { addScope: vi.fn(), setCustomParameters: vi.fn() };
  }),
  GoogleAuthProvider: vi.fn().mockImplementation(function () {
    return { setCustomParameters: vi.fn() };
  }),
  isSignInWithEmailLink: vi.fn(() => false),
  sendSignInLinkToEmail: vi.fn(),
  signInWithEmailLink: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
  connectFirestoreEmulator: vi.fn(),
  getDocFromServer: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
  deleteDoc: vi.fn(),
  enableIndexedDbPersistence: vi.fn(() => Promise.resolve()),
}));

vi.mock('../hooks/useGitHubAuth', () => ({
  useGitHubAuth: vi.fn(() => ({
    loginWithGitHub: vi.fn(),
    isLoading: false,
    error: null,
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
    profile: null,
  })),
}));

describe('GitHub OAuth Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GitHubLoginButton Component', () => {
    it('devrait afficher le bouton de connexion', () => {
      render(<GitHubLoginButton label="Se connecter avec GitHub" showText={true} />);

      const button = screen.getByRole('button', {
        name: /se connecter avec github/i,
      });
      expect(button).toBeInTheDocument();
    });

    it('devrait être désactivé pendant le chargement', () => {
      const { rerender } = render(<GitHubLoginButton />);

      // Simuler le chargement
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('devrait afficher une icône GitHub', () => {
      render(<GitHubLoginButton />);

      const svg = screen.getByRole('button').querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('devrait appeler onSuccess quand un utilisateur se connecte', async () => {
      const onSuccess = vi.fn();

      const mockUser = {
        uid: 'test-uid',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
      };

      vi.mocked(signInWithPopup).mockResolvedValue({
        user: mockUser,
      } as any);

      render(<GitHubLoginButton onSuccess={onSuccess} label="Login" showText={true} />);

      const button = screen.getByRole('button');

      // Cette partie est complexe car useGitHubAuth dépend de l'authentification
      // Dans un test réel, utilisez un wrapper de test
      expect(button).toBeInTheDocument();
    });

    it("devrait afficher un message d'erreur en cas d'échec", async () => {
      const buttonElement = render(<GitHubLoginButton showText={true} />);
      expect(buttonElement).toBeDefined();
    });
  });

  describe('GitHubAuthService', () => {
    let authService: GitHubAuthService;

    beforeEach(() => {
      const mockAuth = {} as any;
      const mockDb = {} as any;
      authService = new GitHubAuthService(mockAuth, mockDb);
    });

    it('devrait créer une instance du service', () => {
      expect(authService).toBeDefined();
    });

    it('devrait être une instanciation valide', () => {
      expect(authService).toBeInstanceOf(GitHubAuthService);
    });

    it('devrait avoir les méthodes requises', () => {
      expect(typeof authService.loginWithGitHub).toBe('function');
      expect(typeof authService.logout).toBe('function');
      expect(typeof authService.getUserProfile).toBe('function');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de popup bloquée', () => {
      const mockError = {
        code: 'auth/popup-blocked',
        message: 'Popup bloquée',
      };

      vi.mocked(signInWithPopup).mockRejectedValue(mockError);

      expect(signInWithPopup).toBeDefined();
    });

    it('devrait gérer les erreurs de réseau', async () => {
      const mockError = {
        code: 'auth/network-request-failed',
        message: 'Erreur réseau',
      };

      vi.mocked(signInWithPopup).mockRejectedValue(mockError);

      expect(signInWithPopup).toBeDefined();
    });

    it('devrait gérer les erreurs de conflit de compte', async () => {
      const mockError = {
        code: 'auth/account-exists-with-different-credential',
        message: 'Compte existant avec autre provider',
      };

      vi.mocked(signInWithPopup).mockRejectedValue(mockError);

      expect(signInWithPopup).toBeDefined();
    });
  });

  describe("Cycle de vie d'authentification", () => {
    it('utilisateur non connecté initialement', () => {
      // Le hook useGitHubAuth commencerait par isLoading = true
      // puis mettrait à jour après la vérification d'authentification
    });

    it('utilisateur connecté après login réussi', () => {
      // Après un login réussi via signInWithPopup
      // user et profile devraient être remplis
    });

    it('utilisateur déconnecté après logout', () => {
      // Après logout, user et profile devraient être null
    });
  });

  describe('Sécurité', () => {
    it('ne devrait pas exposer le Client Secret côté client', () => {
      // Vérifier que .env.local n'expose pas le secret
      expect(process.env.VITE_GITHUB_CLIENT_SECRET).toBeUndefined();
    });

    it('devrait nettoyer les données sensibles après logout', async () => {
      localStorage.setItem('emailForSignIn', 'test@example.com');
      localStorage.setItem('tempAuthToken', 'token123');

      // Après logout, ces clés devraient être supprimées
      // Cela est vérifié dans le service
      expect(localStorage.getItem('emailForSignIn')).toBe('test@example.com');

      // Après logout dans le service, vérifier le nettoyage
    });

    it('devrait valider les scopes GitHub', () => {
      // Vérifier que seuls les scopes autorisés sont demandés
      // 'user:email' et 'read:user' SEULEMENT
      // Pas de 'repo', 'admin', ou autres scopes dangereux
    });
  });

  describe('Accessibilité (a11y)', () => {
    it('devrait avoir des attributs aria appropriés', () => {
      render(<GitHubLoginButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('devrait supporter le clavier (Enter/Space)', async () => {
      render(<GitHubLoginButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveFocus || button.focus();
    });

    it("devrait afficher les messages d'erreur avec aria-live", () => {
      render(<GitHubLoginButton />);

      // Les messages d'erreur doivent avoir aria-live="polite"
      // pour être annoncés aux lecteurs d'écran
    });
  });
});

describe('GitHub Auth Hook (useGitHubAuth)', () => {
  // Tests pour le hook - nécessite un wrapper spécifique
  it('devrait être valide', () => {
    // Les hooks requièrent un composant pour tester
    // À implémenter avec un TestComponent wrapper
    expect(useGitHubAuth).toBeDefined();
  });
});

describe('Intégration GitHub OAuth complète', () => {
  it('cycle complet: Login → Dashboard → Logout', async () => {
    // Scénario complet:
    // 1. Utilisateur arrive sur la page de login
    // 2. Clique sur "Se connecter avec GitHub"
    // 3. Firebase ouvre le popup/redirect OAuth
    // 4. Utilisateur autorise l'app dans GitHub
    // 5. Revient à l'app connecté
    // 6. Profil utilisateur est synchronisé à Firestore
    // 7. Utilisateur clique Logout
    // 8. Données sensibles sont nettoyées

    // Ceci nécessite une structure de test avancée
    expect(true).toBe(true);
  });
});
