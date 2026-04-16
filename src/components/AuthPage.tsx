import {
  CircleAlert as AlertCircle,
  ArrowRight,
  CircleCheck as CheckCircle2,
  LoaderCircle as Loader2,
  Mail,
} from "lucide-react";
import React from "react";
import { loginWithGoogle, sendEmailLink } from "../firebase";
import { useEmailValidation } from "../hooks/useEmailValidation";
import { getFriendlyAuthErrorMessage } from "../lib/authErrors";
import EmailSuccessBanner from "./EmailSuccessBanner";
import ErrorBanner from "./ErrorBanner";
import { GitHubLoginButton } from "./GitHubLoginButton";

/**
 * Page de connexion : Google, GitHub, lien magique e-mail.
 */
const AuthPage: React.FC = () => {
  const {
    email: emailLink,
    setEmail: setEmailLink,
    isValid: isEmailValid,
    isValidating: isEmailValidating,
    error: emailValidationError,
    warning: emailValidationWarning,
    suggestion: emailSuggestion,
  } = useEmailValidation();

  const [isEmailSent, setIsEmailSent] = React.useState(false);
  const [loadingService, setLoadingService] = React.useState<
    "google" | "github" | "email" | null
  >(null);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = React.useState(true);

  const handleGoogleLogin = async () => {
    setLoadingService("google");
    try {
      await loginWithGoogle(rememberMe);
    } catch (err: any) {
      setLoginError(getFriendlyAuthErrorMessage(err?.code || ""));
    } finally {
      setLoadingService(null);
    }
  };

  const getLoadingMessage = () => {
    switch (loadingService) {
      case "google":
        return "Communication avec Google...";
      case "github":
        return "Authentification GitHub...";
      case "email":
        return "Préparation de votre lien...";
      default:
        return "Chargement...";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-200/30 dark:bg-brand-800/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-200/30 dark:bg-accent-800/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] shadow-2xl text-center border border-white/40 dark:border-white/5 relative z-10 animate-fade-in">
        <div className="w-24 h-24 bg-white dark:bg-brand-800 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Micro Gestion logo"
          >
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="28"
              fontWeight="bold"
              fill="#1F2937"
              className="dark:fill-white"
            >
              MG
            </text>
          </svg>
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
            aria-label={
              loadingService === "google"
                ? "Communication avec Google..."
                : "Se connecter avec votre compte Google"
            }
            title="Authentification sécurisée via Google Sign-In"
            className={`
              w-full
              min-h-11 sm:min-h-12.5
              py-3 sm:py-4
              px-4 sm:px-8
              bg-white dark:bg-white
              text-gray-900 dark:text-gray-900
              border-2 border-gray-300 dark:border-gray-200
              rounded-2xl
              font-bold
              flex items-center justify-center gap-3 sm:gap-4
              hover:scale-100 sm:hover:scale-[1.02]
              active:scale-95
              transition-all
              shadow-lg
              hover:shadow-xl hover:border-gray-400
              group
              disabled:opacity-60
              disabled:cursor-not-allowed
              disabled:scale-100
            `}
          >
            {loadingService === "google" ? (
              <>
                <Loader2 size={20} className="animate-spin text-gray-900" />
                <span className="animate-pulse text-gray-900">
                  {getLoadingMessage()}
                </span>
              </>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="hidden sm:inline">
                  Se connecter avec Google
                </span>
                <span className="sm:hidden">Google</span>
              </>
            )}
          </button>

          {/* Connexion GitHub */}
          <GitHubLoginButton
            onSuccess={() => {
              // Réussite : La redirection sera gérée par l'observateur global onAuthStateChanged
            }}
            onError={(err: any) => {
              setLoginError(getFriendlyAuthErrorMessage(err?.code || ""));
            }}
            label="Se connecter avec GitHub"
            showText={true}
            rememberMe={rememberMe}
            disabled={loadingService !== null}
          />

          {/* Option de session */}
          <fieldset className="border border-brand-200 dark:border-brand-800 rounded-2xl p-4 mb-6">
            <legend className="text-xs uppercase font-bold text-brand-600 dark:text-brand-400 ml-2 px-2 tracking-widest">
              📌 Préférences
            </legend>
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                  aria-describedby="remember-me-hint"
                />
                <div className="w-5 h-5 border-2 border-brand-300 dark:border-brand-700 rounded-md bg-white dark:bg-brand-900 transition-all group-hover:border-brand-500 peer-checked:bg-brand-600 peer-checked:border-brand-600" />
                <CheckCircle2
                  size={12}
                  className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-brand-900 dark:text-white group-hover:text-brand-900 dark:group-hover:text-brand-100 transition-colors">
                  Rester connecté
                </span>
                <p
                  id="remember-me-hint"
                  className="text-xs text-brand-500 dark:text-brand-400 mt-0.5"
                >
                  S'applique à Google, GitHub et email
                </p>
              </div>
            </label>
          </fieldset>

          <div className="relative my-6">
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
              aria-label="Connexion par lien magique"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!emailLink || loadingService !== null || !isEmailValid) {
                  return;
                }
                setLoadingService("email");
                try {
                  await sendEmailLink(emailLink, rememberMe);
                  setIsEmailSent(true);
                } catch (err: any) {
                  setLoginError(getFriendlyAuthErrorMessage(err?.code || ""));
                } finally {
                  setLoadingService(null);
                }
              }}
              className="space-y-3 text-left"
            >
              <label htmlFor="email-login" className="sr-only">
                Adresse email
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    emailValidationError
                      ? "text-red-500"
                      : emailValidationWarning
                        ? "text-yellow-500"
                        : isEmailValid
                          ? "text-green-500"
                          : "text-brand-400"
                  }`}
                  size={20}
                />
                <input
                  id="email-login"
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  required
                  value={emailLink}
                  onChange={(e) => setEmailLink(e.target.value)}
                  disabled={loadingService !== null}
                  className={`w-full pl-12 pr-12 py-4 bg-white dark:bg-brand-900/50 border rounded-2xl focus:ring-4 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    emailValidationError
                      ? "border-red-500 focus:ring-red-500/10"
                      : emailValidationWarning
                        ? "border-yellow-500 focus:ring-yellow-500/10"
                        : isEmailValid
                          ? "border-green-500 focus:ring-green-500/10"
                          : "border-brand-200 dark:border-brand-800 focus:ring-brand-500/10 focus:border-brand-500"
                  }`}
                />
                {isEmailValidating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2
                      size={16}
                      className="animate-spin text-brand-400"
                    />
                  </div>
                )}
                {isEmailValid && !isEmailValidating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <CheckCircle2
                      size={16}
                      className="text-green-500 animate-in zoom-in duration-300"
                    />
                  </div>
                )}
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
              {emailSuggestion && (
                <div className="px-2 py-1.5 bg-brand-50/50 dark:bg-brand-900/30 rounded-xl border border-brand-100 dark:border-brand-800 animate-fade-in">
                  <p className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-brand-500" />
                    <span>Vouliez-vous dire </span>
                    <button
                      type="button"
                      onClick={() => setEmailLink(emailSuggestion)}
                      className="font-bold underline hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      {emailSuggestion}
                    </button>
                    <span> ?</span>
                  </p>
                </div>
              )}
              {isEmailValid && !emailValidationWarning && !emailSuggestion && (
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
                {loadingService === "email" ? (
                  <>
                    <Loader2 size={16} className="sm:size-4.5 animate-spin" />
                    <span className="animate-pulse">{getLoadingMessage()}</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      Recevoir un lien magique
                    </span>
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
                setLoadingService("email");
                try {
                  await sendEmailLink(emailLink, rememberMe);
                } catch (err: any) {
                  setLoginError(getFriendlyAuthErrorMessage(err?.code || ""));
                } finally {
                  setLoadingService(null);
                }
              }}
              onEdit={() => {
                setIsEmailSent(false);
                setEmailLink("");
              }}
              isResending={loadingService === "email"}
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
