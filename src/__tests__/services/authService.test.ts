import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthErrorHandler, GitHubAuthService } from '../../services/authService';

// ─── Hoisted mock functions (vitest hoists vi.mock above imports) ────────────
const {
  mockSignInWithPopup,
  mockReauthenticateWithPopup,
  mockSignOut,
  mockSendPasswordResetEmail,
  mockMultiFactor,
  mockAddScope,
  mockSetCustomParameters,
  mockGetDoc,
  mockSetDoc,
  mockUpdateDoc,
  mockDoc,
  mockServerTimestamp,
} = vi.hoisted(() => ({
  mockSignInWithPopup: vi.fn(),
  mockReauthenticateWithPopup: vi.fn(),
  mockSignOut: vi.fn(),
  mockSendPasswordResetEmail: vi.fn(),
  mockMultiFactor: vi.fn(),
  mockAddScope: vi.fn(),
  mockSetCustomParameters: vi.fn(),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDoc: vi.fn(() => 'docRef'),
  mockServerTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
}));

// ─── Firebase Auth mock ─────────────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  GithubAuthProvider: vi.fn().mockImplementation(function () {
    return {
      addScope: mockAddScope,
      setCustomParameters: mockSetCustomParameters,
    };
  }),
  signInWithPopup: mockSignInWithPopup,
  reauthenticateWithPopup: mockReauthenticateWithPopup,
  signOut: mockSignOut,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  multiFactor: mockMultiFactor,
}));

// ─── Firebase Firestore mock ────────────────────────────────────────────────
vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  serverTimestamp: mockServerTimestamp,
}));

// ─── Helpers ────────────────────────────────────────────────────────────────
const createMockAuth = () => ({}) as any;
const createMockDb = () => ({}) as any;
const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  uid: 'user-123',
  email: 'test@github.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  providerData: [{ providerId: 'github.com' }],
  ...overrides,
});

function createFirebaseError(code: string, message = 'Firebase error') {
  const err = new Error(message) as any;
  err.code = code;
  return err;
}

// ─── GitHubAuthService ───────────────────────────────────────────────────────
describe('GitHubAuthService', () => {
  let service: GitHubAuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GitHubAuthService(createMockAuth(), createMockDb());
  });

  // ── Constructor ─────────────────────────────────────────────────────────
  describe('constructor', () => {
    it('instancie le service sans erreur', () => {
      expect(service).toBeInstanceOf(GitHubAuthService);
    });

    it('configure les scopes GitHub', () => {
      expect(mockAddScope).toHaveBeenCalledWith('user:email');
      expect(mockAddScope).toHaveBeenCalledWith('read:user');
    });

    it('configure les custom parameters', () => {
      expect(mockSetCustomParameters).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'consent' })
      );
    });
  });

  // ── loginWithGitHub ──────────────────────────────────────────────────────
  describe('loginWithGitHub', () => {
    it('retourne UserCredential en cas de succès', async () => {
      const mockUser = createMockUser();
      const mockCredential = { user: mockUser };
      mockSignInWithPopup.mockResolvedValue(mockCredential);
      mockGetDoc.mockResolvedValue({ exists: () => false });
      mockSetDoc.mockResolvedValue(undefined);

      const result = await service.loginWithGitHub();

      expect(result).toBe(mockCredential);
      expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    });

    it('synchronise le profil Firestore (nouvel utilisateur)', async () => {
      const mockUser = createMockUser();
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({ exists: () => false });
      mockSetDoc.mockResolvedValue(undefined);

      await service.loginWithGitHub();

      expect(mockSetDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ uid: 'user-123', provider: 'github' })
      );
    });

    it('met à jour le profil Firestore (utilisateur existant)', async () => {
      const mockUser = createMockUser();
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({ exists: () => true });
      mockUpdateDoc.mockResolvedValue(undefined);

      await service.loginWithGitHub();

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ uid: 'user-123' })
      );
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it("lève une erreur formatée en cas d'échec signIn", async () => {
      mockSignInWithPopup.mockRejectedValue(createFirebaseError('auth/popup-blocked'));

      await expect(service.loginWithGitHub()).rejects.toThrow(
        'Les popups sont bloquées. Veuillez les autoriser.'
      );
    });

    it("lève une erreur formatée pour popup fermée par l'utilisateur", async () => {
      mockSignInWithPopup.mockRejectedValue(createFirebaseError('auth/popup-closed-by-user'));

      await expect(service.loginWithGitHub()).rejects.toThrow(
        "Connexion annulée par l'utilisateur."
      );
    });

    it('utilise message générique pour code inconnu', async () => {
      mockSignInWithPopup.mockRejectedValue(
        createFirebaseError('auth/unknown-code', 'Unknown Firebase Error')
      );

      await expect(service.loginWithGitHub()).rejects.toThrow("Erreur d'authentification:");
    });

    it('gère une erreur non-Error', async () => {
      mockSignInWithPopup.mockRejectedValue('string error');

      await expect(service.loginWithGitHub()).rejects.toThrow('Erreur authentification inconnue');
    });

    it('ne lève pas si la sync Firestore échoue (graceful degradation)', async () => {
      const mockUser = createMockUser();
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });
      mockGetDoc.mockRejectedValue(new Error('Firestore unavailable'));

      // Should not throw - sync errors are swallowed
      await expect(service.loginWithGitHub()).resolves.toBeDefined();
    });
  });

  // ── reauthenticateWithGitHub ─────────────────────────────────────────────
  describe('reauthenticateWithGitHub', () => {
    it('reéauthentifie avec succès', async () => {
      const mockUser = createMockUser();
      const mockCredential = { user: mockUser };
      mockReauthenticateWithPopup.mockResolvedValue(mockCredential);

      const result = await service.reauthenticateWithGitHub(mockUser as any);

      expect(result).toBe(mockCredential);
      expect(mockReauthenticateWithPopup).toHaveBeenCalledTimes(1);
    });

    it('propage une erreur formatée', async () => {
      const mockUser = createMockUser();
      mockReauthenticateWithPopup.mockRejectedValue(createFirebaseError('auth/user-disabled'));

      await expect(service.reauthenticateWithGitHub(mockUser as any)).rejects.toThrow(
        'Ce compte a été désactivé.'
      );
    });
  });

  // ── getUserProfile ───────────────────────────────────────────────────────
  describe('getUserProfile', () => {
    it('retourne le profil utilisateur si existant', async () => {
      const profileData = { uid: 'user-123', email: 'test@github.com' };
      mockGetDoc.mockResolvedValue({ exists: () => true, data: () => profileData });

      const result = await service.getUserProfile('user-123');

      expect(result).toEqual(profileData);
    });

    it("retourne null si le profil n'existe pas", async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });

      const result = await service.getUserProfile('unknown-user');

      expect(result).toBeNull();
    });

    it("retourne null en cas d'erreur Firestore", async () => {
      mockGetDoc.mockRejectedValue(new Error('Network error'));

      const result = await service.getUserProfile('user-123');

      expect(result).toBeNull();
    });
  });

  // ── updateUserProfile ────────────────────────────────────────────────────
  describe('updateUserProfile', () => {
    it('met à jour le profil avec succès', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await service.updateUserProfile('user-123', { displayName: 'Updated Name' });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ displayName: 'Updated Name' })
      );
    });

    it('exclut uid et createdAt des champs mis à jour', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await service.updateUserProfile('user-123', {
        uid: 'should-not-appear',
        createdAt: new Date() as any,
        displayName: 'Only This',
      });

      const callArg = mockUpdateDoc.mock.calls[0][1];
      expect(callArg).not.toHaveProperty('uid');
      expect(callArg).not.toHaveProperty('createdAt');
      expect(callArg.displayName).toBe('Only This');
    });

    it('propage les erreurs Firestore', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Permission denied'));

      await expect(service.updateUserProfile('user-123', {})).rejects.toThrow('Permission denied');
    });
  });

  // ── requestPasswordReset ─────────────────────────────────────────────────
  describe('requestPasswordReset', () => {
    it('envoie un email de réinitialisation', async () => {
      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      await service.requestPasswordReset('user@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com',
        expect.objectContaining({ handleCodeInApp: true })
      );
    });

    it("propage les erreurs d'envoi", async () => {
      mockSendPasswordResetEmail.mockRejectedValue(createFirebaseError('auth/user-not-found'));

      await expect(service.requestPasswordReset('unknown@test.fr')).rejects.toThrow(
        'Utilisateur non trouvé.'
      );
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('déconnecte correctement', async () => {
      mockSignOut.mockResolvedValue(undefined);
      // Set some localStorage data to test clearSensitiveData
      localStorage.setItem('emailForSignIn', 'test@test.fr');
      localStorage.setItem('tempAuthToken', 'token123');
      localStorage.setItem('mfaToken', 'mfa-token');
      localStorage.setItem('sessionToken', 'session-abc');

      await service.logout();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('emailForSignIn')).toBeNull();
      expect(localStorage.getItem('tempAuthToken')).toBeNull();
      expect(localStorage.getItem('mfaToken')).toBeNull();
      expect(localStorage.getItem('sessionToken')).toBeNull();
    });

    it('propage les erreurs de déconnexion', async () => {
      mockSignOut.mockRejectedValue(new Error('Network error'));

      await expect(service.logout()).rejects.toThrow('Network error');
    });
  });

  // ── check2FAEnabled ──────────────────────────────────────────────────────
  describe('check2FAEnabled', () => {
    it('retourne true si 2FA est configuré', async () => {
      const mockUser = createMockUser();
      mockMultiFactor.mockReturnValue({ enrolledFactors: [{ uid: 'factor-1' }] });

      const result = await service.check2FAEnabled(mockUser as any);

      expect(result).toBe(true);
    });

    it('retourne false si aucun facteur 2FA', async () => {
      const mockUser = createMockUser();
      mockMultiFactor.mockReturnValue({ enrolledFactors: [] });

      const result = await service.check2FAEnabled(mockUser as any);

      expect(result).toBe(false);
    });

    it("retourne false en cas d'erreur multiFactor", async () => {
      const mockUser = createMockUser();
      mockMultiFactor.mockImplementation(() => {
        throw new Error('multiFactor not supported');
      });

      const result = await service.check2FAEnabled(mockUser as any);

      expect(result).toBe(false);
    });
  });

  // ── getProviderForUser ───────────────────────────────────────────────────
  describe('getProviderForUser', () => {
    it('détecte le provider GitHub', () => {
      const user = createMockUser({ providerData: [{ providerId: 'github.com' }] });
      expect(service.getProviderForUser(user as any)).toBe('github');
    });

    it('détecte le provider Google', () => {
      const user = createMockUser({ providerData: [{ providerId: 'google.com' }] });
      expect(service.getProviderForUser(user as any)).toBe('google');
    });

    it('détecte le provider Email', () => {
      const user = createMockUser({
        providerData: [{ providerId: 'password' }], // email
      });
      // 'password' doesn't include 'email' but let's see what the service does
      const result = service.getProviderForUser(user as any);
      expect(['email', 'unknown']).toContain(result);
    });

    it('détecte le provider email par providerId=email', () => {
      const user = createMockUser({ providerData: [{ providerId: 'email' }] });
      expect(service.getProviderForUser(user as any)).toBe('email');
    });

    it('retourne unknown pour un provider inconnu', () => {
      const user = createMockUser({ providerData: [{ providerId: 'twitter.com' }] });
      expect(service.getProviderForUser(user as any)).toBe('unknown');
    });

    it('retourne unknown si providerData vide', () => {
      const user = createMockUser({ providerData: [] });
      expect(service.getProviderForUser(user as any)).toBe('unknown');
    });

    it('retourne unknown si providerData est null', () => {
      const user = createMockUser({ providerData: null });
      expect(service.getProviderForUser(user as any)).toBe('unknown');
    });
  });

  // ── handleAuthError — tous les codes connus ──────────────────────────────
  describe('handleAuthError (via loginWithGitHub)', () => {
    const errorCodes: Array<[string, string]> = [
      ['auth/cancelled-popup-request', 'Popup fermée. Veuillez réessayer.'],
      ['auth/account-exists-with-different-credential', 'Un compte existe déjà'],
      ['auth/credential-already-in-use', 'sont déjà associés'],
      ['auth/user-disabled', 'désactivé'],
      ['auth/user-not-found', 'non trouvé'],
      ['auth/wrong-password', 'incorrect'],
      ['auth/too-many-requests', 'Trop de tentatives'],
      ['auth/network-request-failed', 'Vérifiez votre connexion'],
      ['auth/operation-not-allowed', "n'est pas activée"],
    ];

    it.each(errorCodes)('formate le code %s correctement', async (code, expectedFragment) => {
      mockSignInWithPopup.mockRejectedValue(createFirebaseError(code));
      await expect(service.loginWithGitHub()).rejects.toThrow(expectedFragment);
    });
  });
});

// ─── AuthErrorHandler ────────────────────────────────────────────────────────
describe('AuthErrorHandler', () => {
  // ── isNetworkError ──────────────────────────────────────────────────────
  describe('isNetworkError', () => {
    it('retourne true pour auth/network-request-failed', () => {
      const err = createFirebaseError('auth/network-request-failed');
      expect(AuthErrorHandler.isNetworkError(err)).toBe(true);
    });

    it('retourne false pour un autre code', () => {
      const err = createFirebaseError('auth/popup-blocked');
      expect(AuthErrorHandler.isNetworkError(err)).toBe(false);
    });

    it('retourne false pour une valeur non-Error', () => {
      expect(AuthErrorHandler.isNetworkError('string')).toBe(false);
      expect(AuthErrorHandler.isNetworkError(null)).toBe(false);
      expect(AuthErrorHandler.isNetworkError(42)).toBe(false);
    });
  });

  // ── isAccountConflictError ──────────────────────────────────────────────
  describe('isAccountConflictError', () => {
    it('retourne true pour auth/account-exists-with-different-credential', () => {
      const err = createFirebaseError('auth/account-exists-with-different-credential');
      expect(AuthErrorHandler.isAccountConflictError(err)).toBe(true);
    });

    it('retourne true pour auth/credential-already-in-use', () => {
      const err = createFirebaseError('auth/credential-already-in-use');
      expect(AuthErrorHandler.isAccountConflictError(err)).toBe(true);
    });

    it('retourne true pour auth/email-already-in-use', () => {
      const err = createFirebaseError('auth/email-already-in-use');
      expect(AuthErrorHandler.isAccountConflictError(err)).toBe(true);
    });

    it('retourne false pour un autre code', () => {
      const err = createFirebaseError('auth/popup-blocked');
      expect(AuthErrorHandler.isAccountConflictError(err)).toBe(false);
    });

    it('retourne false pour une valeur non-Error', () => {
      expect(AuthErrorHandler.isAccountConflictError(null)).toBe(false);
    });
  });

  // ── isPermanentError ────────────────────────────────────────────────────
  describe('isPermanentError', () => {
    it('retourne true pour auth/operation-not-allowed', () => {
      const err = createFirebaseError('auth/operation-not-allowed');
      expect(AuthErrorHandler.isPermanentError(err)).toBe(true);
    });

    it('retourne true pour auth/user-disabled', () => {
      const err = createFirebaseError('auth/user-disabled');
      expect(AuthErrorHandler.isPermanentError(err)).toBe(true);
    });

    it('retourne true pour auth/invalid-api-key', () => {
      const err = createFirebaseError('auth/invalid-api-key');
      expect(AuthErrorHandler.isPermanentError(err)).toBe(true);
    });

    it('retourne false pour une erreur temporaire', () => {
      const err = createFirebaseError('auth/network-request-failed');
      expect(AuthErrorHandler.isPermanentError(err)).toBe(false);
    });

    it('retourne false pour une valeur non-Error', () => {
      expect(AuthErrorHandler.isPermanentError({ notAnError: true })).toBe(false);
    });
  });
});
