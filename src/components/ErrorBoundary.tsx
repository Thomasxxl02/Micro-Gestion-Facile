import React, { ReactNode } from "react";
import { logger } from "../lib/logger";
import ErrorFallback from "./ErrorFallback";

/**
 * Props for ErrorBoundary
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>; // Reset boundary when these keys change
}

/**
 * State for ErrorBoundary
 */
interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  hasError: boolean;
  resetCount: number;
}

/**
 * ErrorBoundary - Capture les erreurs React non gérées
 *
 * Utilité:
 * - Capture les erreurs des composants enfants
 * - Empêche le crash de l'app complète
 * - Log centralisé des erreurs
 * - Fallback UI gracieuse
 *
 * Utilisation:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      error: null,
      errorInfo: null,
      hasError: false,
      resetCount: 0,
    };

    this.previousResetKeys = props.resetKeys || [];
  }

  /**
   * Lifecycle: getDerivedStateFromError
   * Appelé lors d'une erreur
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle: componentDidCatch
   * Utilisé pour le logging et side effects
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Sauvegarde l'errorInfo dans le state
    this.setState({
      errorInfo,
    });

    // Log centralisé
    logger.critical("ErrorBoundary", `React Error: ${error.message}`, error, {
      componentStack: errorInfo.componentStack,
      errorMessage: error.message,
      errorName: error.name,
    });

    // Callback optionnel
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Réinitialiser l'error boundary
   */
  resetErrorBoundary = (): void => {
    this.setState({
      error: null,
      errorInfo: null,
      hasError: false,
      resetCount: this.state.resetCount + 1,
    });

    logger.info("ErrorBoundary", "Error boundary reset by user", {
      resetCount: this.state.resetCount + 1,
    });
  };

  /**
   * Vérifier si resetKeys ont changé
   */
  componentDidUpdate(): void {
    const { resetKeys = [] } = this.props;

    // Comparer avec les clés précédentes
    if (
      resetKeys.length !== this.previousResetKeys.length ||
      resetKeys.some((key, index) => key !== this.previousResetKeys[index])
    ) {
      this.resetErrorBoundary();
      this.previousResetKeys = resetKeys;
    }
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      // Utiliser fallback custom si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback par défaut
      return (
        <ErrorFallback
          error={error!}
          errorInfo={errorInfo || undefined}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
