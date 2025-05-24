'use client';

import { toast as sonnerToast } from 'sonner';

// Create a wrapped version of the toast to ensure type safety and consistent usage
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.message(message),
  warning: (message: string) => sonnerToast.warning(message),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast,
};
