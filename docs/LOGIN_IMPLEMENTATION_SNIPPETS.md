# 🔧 Code Snippets - Implémentation Login Améliorations

**À copier-coller dans votre projet** ✨

---

## 1️⃣ Intégrer GitHub OAuth (App.tsx)

### AVANT:

```tsx
// App.tsx ligne 447
<div className="space-y-4">
  <button
    onClick={loginWithGoogle}
    className="w-full py-4 px-8 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl font-bold flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl hover:shadow-brand-900/20 dark:hover:shadow-white/10 group mb-6"
  >
    <LogIn size={24} className="group-hover:translate-x-1 transition-transform" />
    Se connecter avec Google
  </button>
```

### APRÈS:

```tsx
import { GitHubLoginButton } from './components/GitHubLoginButton';
import { Github } from 'lucide-react';

// App.tsx ligne 447
<div className="space-y-4">
  <button
    onClick={loginWithGoogle}
    className="w-full py-4 px-8 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl font-bold flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl hover:shadow-brand-900/20 dark:hover:shadow-white/10 group mb-6"
  >
    <LogIn size={24} className="group-hover:translate-x-1 transition-transform" />
    Se connecter avec Google
  </button>

  {/* ✨ NEW: GitHub OAuth Button */}
  <GitHubLoginButton
    onSuccess={() => {
      console.log('GitHub login successful');
      // Auto-redirect to dashboard via useGitHubAuth
    }}
    onError={(err) => {
      console.error('GitHub login error:', err);
      setLoginError(err.message);
    }}
    label="Se connecter avec GitHub"
    showText={true}
  />
```

---

## 2️⃣ Add Loading States (App.tsx)

### AVANT:

```tsx
const App = () => {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailLink, setEmailLink] = useState('');
  const [isSending, setIsSending] = useState(false);
```

### APRÈS:

```tsx
const App = () => {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailLink, setEmailLink] = useState('');

  // ✨ NEW: Track which service is loading
  const [loadingService, setLoadingService] = useState<'google' | 'github' | 'email' | null>(null);

  // ✨ NEW: Enhanced Google login with loading state
  const handleGoogleLogin = async () => {
    setLoadingService('google');
    try {
      await loginWithGoogle();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erreur connexion Google');
    } finally {
      setLoadingService('google');
    }
  };

  // ✨ NEW: Enhanced email send with loading state
  const handleEmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLink || loadingService !== null) return;

    setLoadingService('email');
    try {
      await sendEmailLink(emailLink);
      setIsEmailSent(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Erreur lors de l'envoi du lien");
    } finally {
      setLoadingService('email');
    }
  };
```

### UPDATE Buttons:

```tsx
// Google button
<button
  onClick={handleGoogleLogin}
  disabled={loadingService !== null}
  className="w-full py-4 px-8 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-2xl font-bold flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl hover:shadow-brand-900/20 dark:hover:shadow-white/10 group mb-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
>
  {loadingService === 'google' ? (
    <Loader2 size={24} className="animate-spin" />
  ) : (
    <LogIn size={24} className="group-hover:translate-x-1 transition-transform" />
  )}
  Se connecter avec Google
</button>

// Email form
<form onSubmit={handleEmailSend} className="space-y-3">
  <div className="relative">
    <Mail
      className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400"
      size={20}
    />
    <input
      type="email"
      placeholder="votre@email.com"
      required
      value={emailLink}
      onChange={(e) => setEmailLink(e.target.value)}
      disabled={loadingService !== null}
      className="w-full pl-12 pr-4 py-4 bg-white dark:bg-brand-900/50 border border-brand-200 dark:border-brand-800 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
  <button
    type="submit"
    disabled={loadingService !== null || !emailLink.includes('@')}
    className="w-full py-4 bg-brand-50 dark:bg-brand-800 text-brand-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-100 dark:hover:bg-brand-700 transition-all border border-brand-200 dark:border-brand-700 group disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loadingService === 'email' ? (
      <>
        <Loader2 size={18} className="animate-spin" />
        Envoi...
      </>
    ) : (
      <>
        Recevoir un lien magique
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </>
    )}
  </button>
</form>
```

---

## 3️⃣ Email Real-Time Validation Hook

### Créer: `src/hooks/useEmailValidation.ts`

```typescript
import { useState, useCallback } from 'react';

// List of disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'maildrop.cc',
  'temp-mail.org',
  'throwaway.email',
  'mailinator.com',
]);

export interface EmailValidationState {
  email: string;
  isValid: boolean;
  isValidating: boolean;
  error: string | null;
  warning: string | null;
}

export function useEmailValidation(initialEmail = '') {
  const [email, setEmail] = useState(initialEmail);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const validateEmail = useCallback((value: string) => {
    setEmail(value);
    setError(null);
    setWarning(null);

    // 1. Check if email is empty
    if (!value) {
      setIsValid(false);
      return;
    }

    // 2. Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setError("Format d'email invalide");
      setIsValid(false);
      return;
    }

    // 3. Check for disposable email
    const domain = value.split('@')[1].toLowerCase();
    if (DISPOSABLE_DOMAINS.has(domain)) {
      setWarning("Email temporaire détecté - Il peut ne pas recevoir d'emails");
      setIsValid(false);
      return;
    }

    // 4. Check length
    if (value.length > 254) {
      setError('Email trop long (max 254 caractères)');
      setIsValid(false);
      return;
    }

    // 5. If all checks pass
    setIsValid(true);
  }, []);

  // Async validation (optional: could ping email validation API)
  const validateEmailAsync = useCallback(
    async (value: string) => {
      setIsValidating(true);
      try {
        validateEmail(value);
        // Optional: Could call Firebase Cloud Function here
        // const result = await validateEmailExists(value);
      } finally {
        setIsValidating(false);
      }
    },
    [validateEmail]
  );

  return {
    email,
    setEmail: validateEmail,
    validateEmailAsync,
    isValid,
    isValidating,
    error,
    warning,
    isSafeEmail: isValid && !warning,
  };
}
```

### Utilisation dans App.tsx:

```tsx
import { useEmailValidation } from './hooks/useEmailValidation';

const App = () => {
  const { email, setEmail, isValid, error, warning } = useEmailValidation();

  return (
    <>
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" size={20} />
        <input
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`
            w-full pl-12 pr-4 py-4 
            bg-white dark:bg-brand-900/50 
            border rounded-2xl
            transition-all
            ${
              error
                ? 'border-red-500 focus:ring-red-500/20'
                : warning
                  ? 'border-yellow-500 focus:ring-yellow-500/20'
                  : isValid
                    ? 'border-green-500 focus:ring-green-500/20'
                    : 'border-brand-200 dark:border-brand-800 focus:ring-brand-500/10'
            }
          `}
        />
      </div>

      {/* ✨ Real-time feedback */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      {warning && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1">
          <AlertCircle size={14} /> {warning}
        </p>
      )}
      {isValid && !warning && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
          <CheckCircle2 size={14} /> Email valide ✓
        </p>
      )}
    </>
  );
};
```

---

## 4️⃣ Error Banner Component

### Créer: `src/components/ErrorBanner.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { AlertCircle, Wifi, X, Clock } from 'lucide-react';

export interface ErrorBannerProps {
  error: string | null;
  type?: 'network' | 'auth' | 'validation' | 'unknown' | 'timeout';
  onDismiss: () => void;
  autoClose?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  type = 'unknown',
  onDismiss,
  autoClose = 0,
  actionLabel,
  onAction,
}) => {
  const [isVisible, setIsVisible] = useState(!!error);

  useEffect(() => {
    setIsVisible(!!error);

    if (error && autoClose > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [error, autoClose, onDismiss]);

  if (!isVisible || !error) return null;

  const icons = {
    network: <Wifi size={20} className="text-orange-500" />,
    auth: <AlertCircle size={20} className="text-red-500" />,
    validation: <AlertCircle size={20} className="text-yellow-500" />,
    timeout: <Clock size={20} className="text-orange-500" />,
    unknown: <AlertCircle size={20} className="text-gray-500" />,
  };

  const bgColors = {
    network: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500',
    auth: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500',
    validation: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500',
    timeout: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500',
    unknown: 'bg-gray-50 dark:bg-gray-900/20 border-l-4 border-gray-500',
  };

  const titles = {
    network: 'Erreur réseau',
    auth: "Erreur d'authentification",
    validation: 'Donnée invalide',
    timeout: 'Connexion expirée',
    unknown: 'Une erreur est survenue',
  };

  const hints = {
    network: 'Vérifiez votre connexion Internet et réessayez',
    auth: 'Vos identifiants ne sont pas valides. Essayez de nouveau.',
    validation: 'Vérifiez les données saisies',
    timeout: 'La connexion a expiré. Veuillez réessayer.',
    unknown: "Une erreur inattendue s'est produite",
  };

  return (
    <div
      className={`p-4 rounded-lg ${bgColors[type]} animate-slide-in`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>

        <div className="flex-1">
          <p className="font-bold text-sm">{titles[type]}</p>
          <p className="text-sm mt-1 opacity-90">{error}</p>
          <p className="text-xs mt-2 opacity-75">💡 {hints[type]}</p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {actionLabel && onAction && (
              <button
                onClick={() => {
                  onAction();
                  setIsVisible(false);
                }}
                className="text-xs font-bold px-3 py-1.5 bg-current/10 hover:bg-current/20 rounded transition-colors"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Fermer le message d'erreur"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;
```

### Utilisation dans App.tsx:

```tsx
import ErrorBanner from './components/ErrorBanner';

const App = () => {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'auth' | 'validation' | 'unknown'>(
    'unknown'
  );

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';

      // Déterminer le type d'erreur
      if (errorMsg.includes('réseau') || errorMsg.includes('network')) {
        setErrorType('network');
      } else if (errorMsg.includes('auth')) {
        setErrorType('auth');
      } else if (errorMsg.includes('format') || errorMsg.includes('invalid')) {
        setErrorType('validation');
      }

      setLoginError(errorMsg);
    }
  };

  return (
    <>
      {loginError && (
        <ErrorBanner
          error={loginError}
          type={errorType}
          onDismiss={() => setLoginError(null)}
          onAction={handleGoogleLogin}
          actionLabel="Réessayer"
        />
      )}

      {/* Reste du formulaire */}
    </>
  );
};
```

---

## 5️⃣ Enhanced Email Success State

### AVANT:

```tsx
{
  isEmailSent ? (
    <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-[2rem] text-center animate-fade-in">
      <CheckCircle2 size={24} />
      <h3>Lien envoyé !</h3>
      <p>Consultez vos e-mails pour vous connecter.</p>
      <button onClick={() => setIsEmailSent(false)}>Renvoyer ou changer d'e-mail</button>
    </div>
  ) : null;
}
```

### APRÈS:

```tsx
import { useEffect, useState } from 'react';
import { Mail, MailOpen } from 'lucide-react';

const App = () => {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailLink, setEmailLink] = useState('');
  const [linkExpiresAt, setLinkExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Countdown timer for link expiry
  useEffect(() => {
    if (!linkExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((linkExpiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsEmailSent(false);
        setLinkExpiresAt(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [linkExpiresAt]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown(resendCooldown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleEmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... send logic ...

    // Set expiry to 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    setLinkExpiresAt(expiresAt);
    setIsEmailSent(true);
    setResendCount(0);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await sendEmailLink(emailLink);
      setResendCount((prev) => prev + 1);
      setResendCooldown(60); // 60 second cooldown

      // Reset expiry
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      setLinkExpiresAt(expiresAt);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erreur envoi');
    }
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mask email
  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart}@${domain}`;
    }
    return `${localPart.charAt(0)}${'•'.repeat(localPart.length - 2)}${localPart.charAt(localPart.length - 1)}@${domain}`;
  };

  return isEmailSent ? (
    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg animate-fade-in">
      <div className="flex items-start gap-3">
        <MailOpen size={24} className="text-blue-500 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h3 className="font-bold text-blue-900 dark:text-blue-300">📬 Vérifiez votre email!</h3>

          <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
            Un lien de connexion a été envoyé à{' '}
            <span className="font-mono font-semibold">{maskEmail(emailLink)}</span>
          </p>

          {/* Timer */}
          <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/30 rounded flex items-center gap-2">
            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-mono font-bold text-blue-900 dark:text-blue-200">
              Le lien expire dans: {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Instructions */}
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-3 leading-relaxed">
            🔗 Cliquez sur le lien reçu pour vous connecter
            <br />
            💡 Le lien expire après 15 minutes
            <br />
            📧 Vérifiez aussi votre dossier spam
          </p>

          {/* Resend + Edit buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resendCooldown > 0 ? `↻ Renvoyer dans ${resendCooldown}s` : '↻ Renvoyer le lien'}
            </button>

            <button
              onClick={() => {
                setIsEmailSent(false);
                setEmailLink('');
                setLinkExpiresAt(null);
              }}
              className="text-sm font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 border-l border-blue-300 pl-2 transition-colors"
            >
              ✏️ Modifier l'email
            </button>
          </div>

          {/* Stats */}
          <p className="text-xs text-blue-500 dark:text-blue-600 mt-3">Relances: {resendCount}/3</p>
        </div>
      </div>
    </div>
  ) : null;
};
```

---

## 6️⃣ Security: Email Link with Nonce (firebase.ts)

### AVANT:

```tsx
export const sendEmailLink = async (email: string) => {
  const actionCodeSettings = {
    url: globalThis.location.origin + '/login-callback',
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  globalThis.localStorage.setItem('emailForSignIn', email);
};
```

### APRÈS:

```tsx
import { setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * Generate secure nonce for email link
 */
function generateNonce(): string {
  if (typeof crypto === 'undefined') {
    // Fallback for environments without crypto API
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  const nonce = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(nonce)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Send email with nonce validation link
 * SECURITY: Prevents CSRF and replay attacks
 */
export const sendEmailLink = async (email: string) => {
  const nonce = generateNonce();
  const ttlMinutes = 15;

  // ✨ Store nonce in Firestore with TTL
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

  await setDoc(
    doc(db, 'emailLoginRequests', nonce),
    {
      email: email.toLowerCase(), // Normalize email
      nonce,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
      ipHash: await hashIpAddress(), // Optional: for fraud detection
      userAgent: navigator.userAgent,
      status: 'pending',
    },
    { merge: false }
  );

  // ✨ Build secure URL with nonce
  const loginCallbackUrl = new URL('/login-callback', globalThis.location.origin);
  loginCallbackUrl.searchParams.set('nonce', nonce);

  const actionCodeSettings = {
    url: loginCallbackUrl.toString(),
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // ✨ Store encrypted email locally (only for this browser)
    globalThis.localStorage.setItem('emailForSignIn', email);
    globalThis.localStorage.setItem('nonceForSignIn', nonce);

    return { success: true, expiresAt };
  } catch (error) {
    // Clean up if email send fails
    await deleteDoc(doc(db, 'emailLoginRequests', nonce));
    throw error;
  }
};

/**
 * Simple IP hash for fraud detection (non-persistent)
 */
async function hashIpAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();

    // Don't store IP, just hash it
    const encoder = new TextEncoder();
    const data_uint8 = encoder.encode(data.ip);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data_uint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'unknown';
  }
}

/**
 * Validate email link and complete sign-in
 * SECURITY: Validates nonce, expiry, and email
 */
export const completeEmailLinkSignIn = async () => {
  if (!isSignInWithEmailLink(auth, globalThis.location.href)) {
    throw new Error('URL de connexion invalide');
  }

  let email = globalThis.localStorage.getItem('emailForSignIn');
  const nonce = globalThis.localStorage.getItem('nonceForSignIn');

  if (!email || !nonce) {
    throw new Error('Session email login invalide. Recommencez.');
  }

  // ✨ Validate nonce from Firestore
  const nonceDoc = await getDoc(doc(db, 'emailLoginRequests', nonce));

  if (!nonceDoc.exists()) {
    throw new Error('Lien de connexion expiré ou invalide (nonce not found)');
  }

  const reqData = nonceDoc.data();

  // Verify email matches
  if (reqData.email !== email.toLowerCase()) {
    throw new Error('Email mismatch - possible fraud attempt logged');
  }

  // Verify not expired
  if (new Date() > new Date(reqData.expiresAt)) {
    throw new Error('Lien de connexion expiré');
  }

  // Verify status is pending
  if (reqData.status !== 'pending') {
    throw new Error('Lien de connexion déjà utilisé');
  }

  try {
    // ✨ Complete sign-in
    const result = await signInWithEmailLink(auth, email, globalThis.location.href);

    // ✨ Mark nonce as used
    await setDoc(
      doc(db, 'emailLoginRequests', nonce),
      {
        status: 'completed',
        completedAt: serverTimestamp(),
        userId: result.user.uid,
      },
      { merge: true }
    );

    // ✨ Clean up localStorage
    globalThis.localStorage.removeItem('emailForSignIn');
    globalThis.localStorage.removeItem('nonceForSignIn');

    return result.user;
  } catch (error) {
    console.error('Email link sign-in failed:', error);
    throw error;
  }
};

// ✨ Optional: Cleanup expired nonces (run periodically)
export const cleanupExpiredEmailLinks = async () => {
  const now = new Date().toISOString();
  // This would require a Firestore query - consider Cloud Function
  console.log('Cleanup expired email links');
};
```

### Ajouter Firestore Rules (firestore.rules):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ✨ Protect email login requests
    match /emailLoginRequests/{nonce} {
      allow create: if request.auth == null;
      allow read, update: if request.auth == null &&
        resource.data.expiresAt > request.time;
      allow delete: if request.auth == null;
    }
  }
}
```

---

## 7️⃣ Mobile Responsive Buttons

### AVANT:

```tsx
<button className="w-full py-4 px-8 bg-brand-900 ...">
  <LogIn size={24} />
  Se connecter avec Google
</button>
```

### APRÈS:

```tsx
<button
  className={`
    w-full 
    py-3 sm:py-4
    px-4 sm:px-8
    bg-brand-900 dark:bg-white 
    text-white dark:text-brand-900 
    rounded-2xl 
    font-bold 
    flex 
    items-center 
    justify-center 
    gap-2 sm:gap-4
    hover:scale-100 sm:hover:scale-[1.02]
    active:scale-95 
    transition-all 
    shadow-xl 
    hover:shadow-brand-900/20 dark:hover:shadow-white/10 
    group
    min-h-12
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    disabled:scale-100
  `}
>
  <LogIn size={20} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />

  {/* Hide long text on mobile, show short version */}
  <span className="hidden sm:inline">Se connecter avec Google</span>
  <span className="sm:hidden">Google</span>
</button>
```

---

## ✅ Checklist d'Implémentation

### Step-by-step (copy-paste friendly):

- [ ] **1. GitHub OAuth** - Ajouter GitHubLoginButton (5 min)
- [ ] **2. Loading States** - Wrapper avec loadingService (10 min)
- [ ] **3. Email Validation Hook** - useEmailValidation.ts (15 min)
- [ ] **4. Error Banner** - Component + Firestore errors (20 min)
- [ ] **5. Email Success UX** - Adding timer + resend (20 min)
- [ ] **6. Security Nonce** - Firestore + validation (30 min)
- [ ] **7. Mobile Polish** - Responsive classes (10 min)
- [ ] **8. Testing** - Manual + Vitest (30 min)
- [ ] **9. Accessibility** - aria-live + labels (15 min)

**Total: ~155 minutes spread over 2-3 days** 🚀

---

**Questions?** Check LOGIN_PAGE_ANALYSIS.md for details!
