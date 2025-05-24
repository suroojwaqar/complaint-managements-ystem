'use client';

import { usePathname } from 'next/navigation';
import DashboardLayout from './DashboardLayout';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Pages that should NOT use the dashboard layout
const PUBLIC_PAGES = ['/login', '/'];

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if current page should use dashboard layout
  const shouldUseDashboardLayout = !PUBLIC_PAGES.includes(pathname);

  if (!shouldUseDashboardLayout) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
