import { AlertCircle, ArrowRight, CheckCircle2, Loader2, LogIn, Mail } from 'lucide-react';
import React from 'react';
import { loginWithGoogle, sendEmailLink } from '../firebase';
import { useEmailValidation } from '../hooks/useEmailValidation';
import EmailSuccessBanner from './EmailSuccessBanner';
import ErrorBanner from './ErrorBanner';
import { GitHubLoginButton } from './GitHubLoginButton';

/**
 * Page de connexion : Google, GitHub, lien magique e-mail.
 */
const AuthPage: React.FC = () => {
  const {
    email: emailLink,
    setEmail: setEmailLink,
    isValid: isEmailValid,
    error: emailValidationError,
    warning: emailValidationWarning,
  } = useEmailValidation();

  const [isEmailSent, setIsEmailSent] = React.useState(false);
  const [loadingService, setLoadingService] = React.useState<'google' | 'github' | 'email' | null>(
    null
  );
  const [loginError, setLoginError] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingService('google');
    try {
      await loginWithGoogle();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Erreur connexion Google');
    } finally {
      setLoadingService(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/30 dark:bg-brand-800/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-200/30 dark:bg-accent-800/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] shadow-2xl text-center border border-white/40 dark:border-white/5 relative z-10 animate-fade-in">
        <div className="w-24 h-24 bg-brand-900 dark:bg-brand-800 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500">
          <LogIn className="text-white" size={48} />
        </div>
        <h1 className="text-4xl font-bold text-brand-900 dark:text-white mb-4 tracking-tight">
          Micro Gestion
        </h1>
        <p className="text-brand-600 dark:text-brand-300 mb-12 text-lg">
          Votre allié quotidien pour une gestion simplifiée et intelligente.
        </p>

        <div className="space-y-4">
          <ErrorBanner
            error={loginError}
            type="auth"
            onDismiss={() => setLoginError(null)}
            showDismiss={true}
          />

          {/* Connexion Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingService !== null}
            className={`
              w-full
              min-h-11 sm:min-h-12.5
              py-3 sm:py-4
              px-4 sm:px-8
              bg-brand-900 dark:bg-white
              text-white dark:text-brand-900
              rounded-2xl
              font-bold
              flex items-center justify-center gap-3 sm:gap-4
              hover:scale-100 sm:hover:scale-[1.02]
              active:scale-95
              transition-all
              shadow-xl
              hover:shadow-brand-900/20 dark:hover:shadow-white/10
              group
              disabled:opacity-50
              disabled:cursor-not-allowed
              disabled:scale-100
            `}
          >
            {loadingService === 'google' ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            )}
            <span className="hidden sm:inline">Se connecter avec Google</span>
            <span className="sm:hidden">Google</span>
          </button>

          {/* Connexion GitHub */}
          <div className="[&>button]:w-full [&>button]:min-h-11 sm:[&>button]:min-h-12.5 [&>button]:py-3 sm:[&>button]:py-4">
            <GitHubLoginButton
              onSuccess={() => {
                // Redirection automatique via onAuthStateChanged
              }}
              onError={(err) => {
                setLoginError(err.message);
              }}
              label="Se connecter avec GitHub"
              showText={true}
            />
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-200 dark:border-brand-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-50 dark:bg-brand-950 px-4 text-brand-400 font-bold tracking-widest">
                OU
              </span>
            </div>
          </div>

          {/* Connexion par lien magique */}
          {!isEmailSent ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!emailLink || loadingService !== null || !isEmailValid) {
                  return;
                }
                setLoadingService('email');
                try {
                  await sendEmailLink(emailLink);
                  setIsEmailSent(true);
                } catch {
                  setLoginError("Erreur lors de l'envoi du lien.");
                } finally {
                  setLoadingService(null);
                }
              }}
              className="space-y-3 text-left"
            >
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    emailValidationError
                      ? 'text-red-500'
                      : emailValidationWarning
                        ? 'text-yellow-500'
                        : isEmailValid
                          ? 'text-green-500'
                          : 'text-brand-400'
                  }`}
                  size={20}
                />
                <input
                  type="email"
                  placeholder="votre@email.com"
                  required
                  value={emailLink}
                  onChange={(e) => setEmailLink(e.target.value)}
                  disabled={loadingService !== null}
                  className={`w-full pl-12 pr-4 py-4 bg-white dark:bg-brand-900/50 border rounded-2xl focus:ring-4 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    emailValidationError
                      ? 'border-red-500 focus:ring-red-500/10'
                      : emailValidationWarning
                        ? 'border-yellow-500 focus:ring-yellow-500/10'
                        : isEmailValid
                          ? 'border-green-500 focus:ring-green-500/10'
                          : 'border-brand-200 dark:border-brand-800 focus:ring-brand-500/10 focus:border-brand-500'
                  }`}
                />
              </div>

              {emailValidationError && (
                <p className="text-xs text-red-600 dark:text-red-400 px-2 flex items-center gap-1 animate-fade-in">
                  <AlertCircle size={12} /> {emailValidationError}
                </p>
              )}
              {emailValidationWarning && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 px-2 flex items-center gap-1 animate-fade-in">
                  <AlertCircle size={12} /> {emailValidationWarning}
                </p>
              )}
              {isEmailValid && !emailValidationWarning && (
                <p className="text-xs text-green-600 dark:text-green-400 px-2 flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 size={12} /> Email valide ✓
                </p>
              )}

              <button
                type="submit"
                disabled={loadingService !== null || !isEmailValid}
                className={`
                  w-full
                  min-h-11
                  py-3 sm:py-4
                  px-4 sm:px-6
                  bg-brand-50 dark:bg-brand-800
                  text-brand-900 dark:text-white
                  rounded-2xl
                  font-bold
                  flex items-center justify-center gap-2 sm:gap-3
                  hover:bg-brand-100 dark:hover:bg-brand-700
                  transition-all
                  border border-brand-200 dark:border-brand-700
                  group
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  active:scale-95
                `}
              >
                {loadingService === 'email' ? (
                  <>
                    <Loader2 size={16} className="sm:size-4.5 animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Recevoir un lien magique</span>
                    <span className="sm:hidden">Lien magique</span>
                    <ArrowRight
                      size={16}
                      className="sm:size-4.5 group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>
          ) : (
            <EmailSuccessBanner
              email={emailLink}
              onResend={async () => {
                setLoadingService('email');
                try {
                  await sendEmailLink(emailLink);
                } catch (error) {
                  setLoginError(
                    error instanceof Error ? error.message : 'Erreur lors du renvoi du lien'
                  );
                } finally {
                  setLoadingService(null);
                }
              }}
              onEdit={() => {
                setIsEmailSent(false);
                setEmailLink('');
              }}
              isResending={loadingService === 'email'}
            />
          )}
        </div>

        <p className="mt-10 text-xs text-brand-400 dark:text-brand-500 uppercase tracking-widest font-semibold">
          Sécurisé par Google Auth
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
