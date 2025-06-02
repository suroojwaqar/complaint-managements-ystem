'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tags,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  Building2,
  Menu,
  LucideIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: React.ReactNode;
}

const menuItems: Record<string, MenuItem[]> = {
  admin: [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
    },
    {
      title: 'Contents',
      icon: FolderOpen,
      children: [
        {
          title: 'Complaints',
          icon: FileText,
          href: '/admin/complaints',
        },
        {
          title: 'Departments',
          icon: Building2,
          href: '/admin/departments',
        },
        {
          title: 'Nature Types',
          icon: Tags,
          href: '/admin/nature-types',
        },
      ],
    },
    {
      title: 'Settings',
      icon: Settings,
      children: [
        {
          title: 'Users',
          icon: Users,
          href: '/admin/users',
        },
        {
          title: 'Settings',
          icon: User,
          href: '/admin/settings',
        },
      ],
    },
    {
      title: 'Profile',
      icon: User,
      href: '/profile',
    },
  ],
  manager: [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/manager/dashboard',
    },
    {
      title: 'Complaints',
      icon: FileText,
      href: '/manager/complaints',
    },
    {
      title: 'Team',
      icon: Users,
      href: '/manager/team',
    },
    {
      title: 'Profile',
      icon: User,
      href: '/profile',
    },
  ],
  employee: [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/employee/dashboard',
    },
    {
      title: 'My Complaints',
      icon: FileText,
      href: '/employee/complaints',
    },
    {
      title: 'Profile',
      icon: User,
      href: '/profile',
    },
  ],
  client: [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/client/dashboard',
    },
    {
      title: 'My Complaints',
      icon: FileText,
      href: '/client/complaints',
    },
    {
      title: 'Profile',
      icon: User,
      href: '/profile',
    },
  ],
};

interface MenuItem {
  title: string;
  icon: LucideIcon;
  href?: string;
  children?: MenuItem[];
}

interface SidebarItemProps {
  item: MenuItem;
  isCollapsed: boolean;
  level?: number;
}

function SidebarItem({ item, isCollapsed, level = 0 }: SidebarItemProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href;

  if (hasChildren) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full justify-start gap-3',
            isActive && 'bg-accent text-accent-foreground',
            level > 0 && 'ml-6'
          )}
        >
          <item.icon className="h-4 w-4" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
            </>
          )}
        </Button>
        {isOpen && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => (
              <SidebarItem key={child.href || child.title} item={child} isCollapsed={isCollapsed} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      asChild
      className={cn(
        'w-full justify-start gap-3',
        isActive && 'bg-accent text-accent-foreground',
        level > 0 && 'ml-6'
      )}
    >
      <Link href={item.href || '/'}>
        <item.icon className="h-4 w-4" />
        {!isCollapsed && <span>{item.title}</span>}
      </Link>
    </Button>
  );
}

export default function DashboardLayout({ children }: SidebarProps) {
  const { data: session } = useSession();
  const { user: currentUser } = useCurrentUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const userRole = session?.user?.role || 'client';
  const currentMenuItems = menuItems[userRole as keyof typeof menuItems] || [];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Get breadcrumb from pathname
  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: '/' + segments.slice(0, index + 1).join('/'),
      isLast: index === segments.length - 1,
    }));
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform border-r bg-card transition-all duration-200 ease-in-out lg:relative lg:translate-x-0',
          isCollapsed && 'lg:w-20',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex h-16 items-center border-b px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <span className="text-lg font-semibold">Seamnia Crm</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {currentMenuItems.map((item) => (
                <SidebarItem key={item.href || item.title} item={item} isCollapsed={isCollapsed} />
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Sign out</span>}
            </Button>
          </div>
        </div>

        {/* Collapse button */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 hidden h-6 w-6 lg:flex"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header */}
        <header className="flex h-16 items-center border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Breadcrumb */}
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              {breadcrumb.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  <span className="mx-2">/</span>
                  {crumb.isLast ? (
                    <span className="text-foreground">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-foreground">
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Theme toggle */}
            <ThemeToggle />
            
            {/* User menu */}
            <div className="flex items-center gap-3">
              <Link href="/profile" className="hover:opacity-80 transition-opacity">
                <UserAvatar 
                  user={{
                    name: currentUser?.name || 'User',
                    profileImage: currentUser?.profileImage,
                    email: currentUser?.email || ''
                  }}
                  size="sm"
                  showTooltip
                />
              </Link>
              <div className="hidden sm:block">
                <span className="text-sm font-medium">
                  {currentUser?.name || 'User'}
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {currentUser?.role || 'guest'}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
