/**
 * Composant Toaster pour Sonner
 * Compatible Shadcn design system
 *
 * Place cet élément root dans App.tsx pour activer les toasts
 */

import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export const Toaster: React.FC = () => {
  return (
    <SonnerToaster
      theme="light"
      position="bottom-right"
      richColors
      closeButton
      expand={false}
      visibleToasts={3}
      gap={12}
      toastOptions={{
        className: 'sonner-toast',
        style: {
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          padding: '16px',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        },
      }}
    />
  );
};
