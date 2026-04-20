import { LoaderCircle as Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import AppShell from "./components/AppShell";
import AuthPage from "./components/AuthPage";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineIndicator from "./components/OfflineIndicator";
import PerformanceDashboard from "./components/PerformanceDashboard";
import { Toaster } from "./components/Toaster";
import { useAuth } from "./hooks/useAuth";
import { performanceMonitor } from "./lib/performanceMonitor";
import { initializeServiceWorker } from "./lib/serviceWorkerManager";
import { useAppStore } from "./store/appStore";
import { useUIStore } from "./store/useUIStore";

const App: React.FC = () => {
  useAuth();

  const isAuthReady = useAppStore((s) => s.isAuthReady);
  const user = useAppStore((s) => s.user);
  const fontSize = useUIStore((s) => s.fontSize);

  // Initialize Service Worker for offline support
  useEffect(() => {
    initializeServiceWorker();
    // Initialize performance monitoring
    performanceMonitor.initialize(process.env.NODE_ENV === 'production');
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-font-size",
      `${fontSize}px`,
    );
  }, [fontSize]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-600 dark:text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ErrorBoundary>
      <>
        <OfflineIndicator />
        <AppShell />
        <Toaster />
        {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
      </>
    </ErrorBoundary>
  );
};

export default App;
