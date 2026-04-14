import { LoaderCircle as Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';
import AppShell from './components/AppShell';
import AuthPage from './components/AuthPage';
import { Toaster } from './components/Toaster';
import { useAuth } from './hooks/useAuth';
import { useAppStore } from './store/appStore';
import { useUIStore } from './store/useUIStore';

const App: React.FC = () => {
  useAuth();

  const isAuthReady = useAppStore((s) => s.isAuthReady);
  const user = useAppStore((s) => s.user);
  const fontSize = useUIStore((s) => s.fontSize);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
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
    <>
      <AppShell />
      <Toaster />
    </>
  );
};

export default App;
