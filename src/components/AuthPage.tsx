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
import { wrapAsync } from "../lib/asyncUtils";
import { getFriendlyAuthErrorMessage } from "../lib/authErrors";
import EmailSuccessBanner from "./EmailSuccessBanner";
import ErrorBanner from "./ErrorBanner";
import { GitHubLoginButton } from "./GitHubLoginButton";

/**
 * Page de connexion : Google, GitHub, lien magique e-mail.
 */
// eslint-disable-next-line complexity
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
  const [lastEmailSentTime, setLastEmailSentTime] = React.useState<number>(0);

  // Charger le cooldown et l'email au montage
  React.useEffect(() => {
    const savedTime = localStorage.getItem("auth_last_email_sent");
    if (savedTime) setLastEmailSentTime(parseInt(savedTime, 10));

    const lastEmail = localStorage.getItem("last_auth_email");
    if (lastEmail && !emailLink) {
      void setEmailLink(lastEmail);
    }

    const timer = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 500);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    setLoadingService("google");
    try {
      await loginWithGoogle(rememberMe);
    } catch (err: unknown) {
      const errorCode =
        err && typeof err === "object" && "code" in err ? String(err.code) : "";
      setLoginError(getFriendlyAuthErrorMessage(errorCode));
    } finally {
      setLoadingService(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLink || loadingService !== null || !isEmailValid) return;

    // Protection anti-spam locale (60s)
    const now = Date.now();
    const cooldown = 60000;
    if (now - lastEmailSentTime < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastEmailSentTime)) / 1000);
      setLoginError(`Veuillez patienter ${wait}s avant de renvoyer un lien.`);
      return;
    }

    setLoadingService("email");
    try {
      await sendEmailLink(emailLink, rememberMe);
      setIsEmailSent(true);
      setLastEmailSentTime(now);
      localStorage.setItem("auth_last_email_sent", now.toString());
      localStorage.setItem("last_auth_email", emailLink);
    } catch (err: unknown) {
      const errorCode =
        err && typeof err === "object" && "code" in err ? String(err.code) : "";
      setLoginError(getFriendlyAuthErrorMessage(errorCode));
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

  const emailInputRef = React.useRef<HTMLInputElement>(null);

  let emailIconColor = "text-brand-400";
  if (emailValidationError) emailIconColor = "text-red-500";
  else if (emailValidationWarning) emailIconColor = "text-yellow-500";
  else if (isEmailValid) emailIconColor = "text-green-500";

  let emailInputBorder =
    "border-brand-200 dark:border-brand-800 focus:ring-brand-500/10 focus:border-brand-500";
  if (emailValidationError)
    emailInputBorder = "border-red-500 focus:ring-red-500/10";
  else if (emailValidationWarning)
    emailInputBorder = "border-yellow-500 focus:ring-yellow-500/10";
  else if (isEmailValid)
    emailInputBorder = "border-green-500 focus:ring-green-500/10";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-white dark:from-brand-950 dark:to-brand-900 transition-colors duration-500 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-24 w-[40rem] h-[40rem] bg-brand-200/40 dark:bg-brand-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 -right-24 w-[40rem] h-[40rem] bg-accent-200/30 dark:bg-accent-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-md w-full glass p-8 sm:p-12 rounded-[3.5rem] shadow-[0_32px_120px_-20px_rgba(139,92,246,0.15)] dark:shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] text-center border border-white/60 dark:border-white/5 relative z-10 animate-fade-in backdrop-blur-3xl">
        <div className="w-24 h-24 bg-gradient-to-tr from-brand-600 to-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-brand-500/40 rotate-6 hover:rotate-0 transition-all duration-700 cursor-default group">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Micro Gestion logo"
            className="group-hover:scale-110 transition-transform duration-500"
          >
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="28"
              fontWeight="900"
              fill="white"
            >
              MG
            </text>
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-brand-900 dark:text-white mb-4 tracking-tight font-display">
          Micro Gestion
        </h1>
        <p className="text-brand-500 dark:text-brand-400 mb-12 text-lg font-medium">
          Votre allié quotidien pour une gestion simplifiée et intelligente.
        </p>

        <div className="space-y-5">
          <ErrorBanner
            error={loginError}
            type="auth"
            onDismiss={() => setLoginError(null)}
            showDismiss={true}
          />

          <button
            onClick={() => void handleGoogleLogin()}
            disabled={loadingService !== null}
            aria-label={
              loadingService === "google"
                ? "Communication avec Google..."
                : "Se connecter avec votre compte Google"
            }
            className={`
              w-full min-h-11 sm:min-h-12.5 py-3 sm:py-4 px-4 sm:px-8
              bg-brand-600 hover:bg-brand-700 text-white border-none rounded-[2rem] font-bold
              flex items-center justify-center gap-3 sm:gap-4 hover:scale-[1.03] active:scale-95 transition-all duration-300
              shadow-[0_12px_32px_-8px_rgba(124,58,237,0.4)] hover:shadow-[0_20px_48px_-8px_rgba(124,58,237,0.5)] group disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
            `}
          >
            <div className="flex items-center gap-3 h-6">
              {loadingService === "google" ? (
                <>
                  <Loader2 size={20} className="animate-spin text-white" />
                  <span className="animate-pulse text-white">
                    {getLoadingMessage()}
                  </span>
                </>
              ) : (
                <>
                  <div className="bg-white p-1.5 rounded-xl transition-transform group-hover:scale-110 duration-500">
                    <svg
                      width="18"
                      height="18"
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
                  </div>
                  <span className="hidden sm:inline">
                    Se connecter avec Google
                  </span>
                  <span className="sm:hidden">Google</span>
                </>
              )}
            </div>
          </button>

          <GitHubLoginButton
            onSuccess={() => {}}
            onError={(err: unknown) => {
              const errorCode =
                err && typeof err === "object" && "code" in err
                  ? String(err.code)
                  : "";
              setLoginError(getFriendlyAuthErrorMessage(errorCode));
            }}
            label="Se connecter avec GitHub"
            showText={true}
            rememberMe={rememberMe}
            disabled={loadingService !== null}
          />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-200 dark:border-brand-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-50 dark:bg-brand-950 px-4 text-brand-400 font-bold tracking-widest">
                Lien magique par e-mail
              </span>
            </div>
          </div>

          {!isEmailSent ? (
            <form
              aria-label="Connexion par lien magique"
              onSubmit={wrapAsync(handleEmailLogin)}
              className="space-y-4 text-left"
            >
              <label className="flex items-center gap-3 cursor-pointer group select-none ml-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-brand-200 dark:border-brand-800 rounded-md bg-white dark:bg-brand-900 transition-all group-hover:border-brand-400 peer-checked:bg-brand-600 peer-checked:border-brand-600" />
                  <CheckCircle2
                    size={12}
                    className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                  />
                </div>
                <span className="text-sm font-medium text-brand-700 dark:text-brand-300 group-hover:text-brand-900 dark:group-hover:text-brand-100 transition-colors">
                  Rester connecté
                </span>
              </label>

              <label htmlFor="email-login" className="sr-only">
                Adresse email
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${emailIconColor}`}
                  size={20}
                />
                <input
                  id="email-login"
                  ref={emailInputRef}
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  required
                  value={emailLink}
                  onChange={(e) => void setEmailLink(e.target.value)}
                  disabled={loadingService !== null}
                  className={`w-full pl-12 pr-12 py-4 bg-white dark:bg-brand-900/50 border rounded-2xl focus:ring-4 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${emailInputBorder}`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {isEmailValidating && (
                    <Loader2
                      size={16}
                      className="animate-spin text-brand-400"
                    />
                  )}
                  {isEmailValid && !isEmailValidating && (
                    <CheckCircle2
                      size={16}
                      className="text-green-500 animate-in zoom-in"
                    />
                  )}
                </div>
              </div>

              {emailSuggestion && (
                <div className="flex flex-col gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-brand-600 dark:text-brand-400 ml-1">
                    Vouliez-vous dire :
                  </p>
                  <button
                    type="button"
                    onClick={() => void setEmailLink(emailSuggestion)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 rounded-xl hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors border border-brand-200 dark:border-brand-800 w-fit group"
                  >
                    <CheckCircle2 size={16} className="text-brand-500" />
                    <span className="font-medium">{emailSuggestion}</span>
                    <ArrowRight
                      size={14}
                      className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
                    />
                  </button>
                </div>
              )}

              {emailValidationError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl text-sm border border-red-100 dark:border-red-900/30 animate-in shake-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{emailValidationError}</span>
                </div>
              )}
              {emailValidationWarning && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-xl text-sm border border-orange-100 dark:border-orange-900/30">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{emailValidationWarning}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingService !== null || !isEmailValid}
                className="w-full py-4 px-8 rounded-2xl font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30 hover:scale-100 sm:hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <div className="flex items-center gap-3 h-6">
                  {loadingService === "email" ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span className="animate-pulse">
                        {getLoadingMessage()}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      <span>M'envoyer le lien magique</span>
                      <ArrowRight size={20} className="ml-1" />
                    </>
                  )}
                </div>
              </button>
            </form>
          ) : (
            <EmailSuccessBanner
              email={emailLink}
              onResend={async () => {
                setLoadingService("email");
                try {
                  await sendEmailLink(emailLink, rememberMe);
                  setLastEmailSentTime(Date.now());
                  localStorage.setItem(
                    "auth_last_email_sent",
                    Date.now().toString(),
                  );
                } finally {
                  setLoadingService(null);
                }
              }}
              onEdit={() => {
                setIsEmailSent(false);
                void setEmailLink("");
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
