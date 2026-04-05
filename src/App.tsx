import { Loader2 } from 'lucide-react';
import React from 'react';
import AppShell from './components/AppShell';
import AuthPage from './components/AuthPage';
import { Toaster } from './components/Toaster';
import { useAuth } from './hooks/useAuth';
import { useAppStore } from './store/appStore';

const App: React.FC = () => {
  useAuth();

  const isAuthReady = useAppStore((s) => s.isAuthReady);
  const user = useAppStore((s) => s.user);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-main)">
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
