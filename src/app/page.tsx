'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SimpleThemeToggle } from '@/components/ui/theme-toggle';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (session?.user) {
      // User is authenticated, redirect to appropriate dashboard
      switch (session.user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'manager':
          router.push('/manager/dashboard');
          break;
        case 'employee':
          router.push('/employee/dashboard');
          break;
        case 'client':
          router.push('/client/dashboard');
          break;
        default:
          router.push('/login');
      }
    } else {
      // User is not authenticated, redirect to login
      router.push('/login');
    }
  }, [session, status, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <SimpleThemeToggle />
      </div>
      
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
