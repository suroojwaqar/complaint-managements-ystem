'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleThemeToggle } from '@/components/ui/theme-toggle';

export default function UnauthorizedPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGoBack = () => {
    if (session?.user) {
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
          router.push('/');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <SimpleThemeToggle />
      </div>

      <Card className="max-w-md w-full">
        <CardContent className="text-center p-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-destructive/10 p-6">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                Access Denied
              </h2>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button
                onClick={handleGoBack}
                className="w-full"
                variant="default"
              >
                Go Back to Dashboard
              </Button>
              
              <Button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full"
                variant="outline"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
