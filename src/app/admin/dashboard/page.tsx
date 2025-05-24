'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Standardized Components
import { StatusBadge } from '@/components/ui/status-badge';
import { DashboardSkeleton } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import { layoutClasses, componentPatterns } from '@/lib/design-system';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Icons
import { 
  Users, 
  Building2, 
  FileText,
  BarChart3,
  Settings,
  LogOut,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  Building,
  Edit,
  Eye
} from 'lucide-react';

// Interface definitions
interface DashboardStats {
  totalUsers: number;
  totalDepartments: number;
  totalComplaints: number;
  activeComplaints: number;
  usersBreakdown: {
    admins: number;
    managers: number;
    employees: number;
    clients: number;
  };
  complaintsBreakdown: {
    new: number;
    assigned: number;
    inProgress: number;
    completed: number;
    done: number;
    closed: number;
  };
  monthlyComplaintTrend: Array<{
    month: string;
    complaints: number;
    resolved: number;
  }>;
  departmentPerformance: Array<{
    department: string;
    complaints: number;
    resolved: number;
    efficiency: number;
  }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: {
    name: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface Department {
  _id: string;
  name: string;
  description: string;
  managerId: {
    name: string;
    email: string;
  };
  defaultAssigneeId: {
    name: string;
    email: string;
  };
  isActive: boolean;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersResponse, departmentsResponse, complaintsResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/departments'),
        fetch('/api/complaints')
      ]);

      if (!usersResponse.ok || !departmentsResponse.ok || !complaintsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const users = await usersResponse.json();
      const departmentsData = await departmentsResponse.json();
      const complaintsData = await complaintsResponse.json();
      
      const departmentsArray = departmentsData.departments || departmentsData.data || departmentsData;
      const complaintsArray = complaintsData.complaints || [];
      
      const validDepartments = Array.isArray(departmentsArray) ? departmentsArray : [];
      setDepartments(validDepartments);

      // Generate mock monthly trend data
      const monthlyTrend = [
        { month: 'Jan', complaints: 45, resolved: 42 },
        { month: 'Feb', complaints: 52, resolved: 48 },
        { month: 'Mar', complaints: 48, resolved: 45 },
        { month: 'Apr', complaints: 61, resolved: 58 },
        { month: 'May', complaints: 55, resolved: 52 },
        { month: 'Jun', complaints: 67, resolved: 63 }
      ];

      // Generate department performance data
      const departmentPerformance = validDepartments.slice(0, 5).map((dept: Department) => ({
        department: dept.name,
        complaints: Math.floor(Math.random() * 50) + 10,
        resolved: Math.floor(Math.random() * 40) + 5,
        efficiency: Math.floor(Math.random() * 30) + 70
      }));

      const stats: DashboardStats = {
        totalUsers: users.length,
        totalDepartments: validDepartments.length,
        totalComplaints: complaintsArray.length,
        activeComplaints: complaintsArray.filter((c: any) => !['Completed', 'Done', 'Closed'].includes(c.status)).length,
        usersBreakdown: {
          admins: users.filter((u: User) => u.role === 'admin').length,
          managers: users.filter((u: User) => u.role === 'manager').length,
          employees: users.filter((u: User) => u.role === 'employee').length,
          clients: users.filter((u: User) => u.role === 'client').length,
        },
        complaintsBreakdown: {
          new: complaintsArray.filter((c: any) => c.status === 'New').length,
          assigned: complaintsArray.filter((c: any) => c.status === 'Assigned').length,
          inProgress: complaintsArray.filter((c: any) => c.status === 'In Progress').length,
          completed: complaintsArray.filter((c: any) => c.status === 'Completed').length,
          done: complaintsArray.filter((c: any) => c.status === 'Done').length,
          closed: complaintsArray.filter((c: any) => c.status === 'Closed').length,
        },
        monthlyComplaintTrend: monthlyTrend,
        departmentPerformance: departmentPerformance
      };

      setStats(stats);
      setRecentUsers(users.slice(0, 8));
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'employee': return 'secondary';
      case 'client': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={layoutClasses.page}>
      {/* Header */}
      <div className={layoutClasses.header}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name}. Here's your system overview.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button asChild>
            <Link href="/admin/users/create">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/departments/create')}>
                <Building className="mr-2 h-4 w-4" />
                Add Department
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorDisplay
          title="Error"
          message={error}
          onRetry={handleRefresh}
          className={layoutClasses.spacing.section}
        />
      )}

      {/* Stats Overview */}
      <div className={`${layoutClasses.grid.stats} ${layoutClasses.spacing.section}`}>
        <Card className={`${layoutClasses.card.hover} border-l-4 border-l-blue-500`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalUsers || 0).toLocaleString()}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">All system users</p>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${layoutClasses.card.hover} border-l-4 border-l-green-500`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalDepartments || 0).toLocaleString()}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Active departments</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${layoutClasses.card.hover} border-l-4 border-l-amber-500`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalComplaints || 0).toLocaleString()}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">All time complaints</p>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${layoutClasses.card.hover} border-l-4 border-l-red-500`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Complaints</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.activeComplaints || 0).toLocaleString()}</div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">Currently open</p>
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -5%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className={layoutClasses.spacing.section}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Frequently used administrative functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={layoutClasses.grid.form}>
            <Link
              href="/admin/users"
              className={`group p-4 border border-border rounded-lg ${layoutClasses.card.interactive}`}
            >
              <Users className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-medium mb-2">Manage Users</h4>
              <p className="text-sm text-muted-foreground">Create, edit, and manage user accounts</p>
            </Link>
            
            <Link
              href="/admin/departments"
              className={`group p-4 border border-border rounded-lg ${layoutClasses.card.interactive}`}
            >
              <Building2 className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-medium mb-2">Manage Departments</h4>
              <p className="text-sm text-muted-foreground">Configure departments and assignments</p>
            </Link>
            
            <Link
              href="/admin/nature-types"
              className={`group p-4 border border-border rounded-lg ${layoutClasses.card.interactive}`}
            >
              <FileText className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-medium mb-2">Nature Types</h4>
              <p className="text-sm text-muted-foreground">Configure complaint categories</p>
            </Link>
            
            <Link
              href="/admin/complaints"
              className={`group p-4 border border-border rounded-lg ${layoutClasses.card.interactive}`}
            >
              <BarChart3 className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-medium mb-2">All Complaints</h4>
              <p className="text-sm text-muted-foreground">Monitor and manage complaints</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Recent Users
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users">
                  <Eye className="mr-1 h-4 w-4" />
                  View all
                </Link>
              </Button>
            </div>
            <CardDescription>Recently registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.department && (
                        <p className="text-xs text-muted-foreground">{user.department.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getRoleVariant(user.role)} className="mb-1">
                      {user.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Departments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Departments
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/departments">
                  <Eye className="mr-1 h-4 w-4" />
                  Manage all
                </Link>
              </Button>
            </div>
            <CardDescription>Active departments in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departments.slice(0, 6).map((dept) => (
                <div key={dept._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Manager: {dept.managerId?.name || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={dept.isActive ? 'Active' : 'Inactive'} className="mb-1" showIcon={false} />
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/departments/${dept._id}`}>
                        <Edit className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
