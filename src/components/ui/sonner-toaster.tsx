'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();
  
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        // Remove theme property as it's not supported in this version
        className: 'border border-border',
      }}
      theme={theme === 'light' ? 'light' : 'dark'} // Move theme to component level
    />
  );
}
