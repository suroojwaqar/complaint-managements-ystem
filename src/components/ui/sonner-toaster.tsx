'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();
  
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        // Use light theme if system theme is light, dark theme otherwise
        // You can customize this logic further if needed
        theme: theme === 'light' ? 'light' : 'dark',
        className: 'border border-border',
      }}
    />
  );
}
