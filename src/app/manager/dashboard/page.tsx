'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Icons
import { 
  Users, 
  ListChecks, 
  Clock, 
  CheckCircle2, 
  Bell, 
  LogOut, 
  Clock3,
  AlertCircle,
  Search,
  MoreHorizontal,
  RefreshCw,
  CircleAlert,
  PieChart,
  BarChart,
  UserCog,
  ClipboardList,
  MoveRight
} from 'lucide-react';

interface Complaint {
  _id: string;
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
  status: string;
  department: {
    _id: string;
    name: string;
  };
  currentAssigneeId: {
    _id: string;
    name: string;
    email: string;
  };
  clientId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Component for statistics cards
const StatsCard = ({ title, value, icon, description, className = '', iconClass = '' }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  className?: string;
  iconClass?: string;
}) => (
  <Card className={`overflow-hidden ${className}`}>
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-md ${iconClass}`}>
          {icon}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

// Skeleton loaders for loading state
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Card>
      <CardContent className="p-0">
        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map((row) => (
                <TableRow key={row}>
                  {[1, 2, 3, 4, 5].map((cell) => (
                    <TableCell key={`${row}-${cell}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch complaints for the manager's department
      let url = '/api/complaints';
      if (activeTab !== 'all') {
        url += `?status=${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
      }
      
      const complaintsResponse = await fetch(url);
      
      if (complaintsResponse.ok) {
        const complaintsData = await complaintsResponse.json();
        const departmentComplaints = complaintsData.complaints || [];
        
        // Calculate stats
        const today = new Date().toDateString();
        const stats = {
          totalComplaints: departmentComplaints.length,
          pendingComplaints: departmentComplaints.filter((c: any) => ['New', 'Assigned', 'In Progress'].includes(c.status)).length,
          completedToday: departmentComplaints.filter((c: any) => {
            return c.status === 'Completed' && new Date(c.updatedAt).toDateString() === today;
          }).length,
          overdueComplaints: 0, // We'll implement this based on your business logic
        };

        setStats(stats);
        setComplaints(departmentComplaints.slice(0, 10)); // Recent 10 complaints
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Assigned': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'In Progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Done': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      case 'Closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New': return <Bell className="h-4 w-4" />;
      case 'Assigned': return <AlertCircle className="h-4 w-4" />;
      case 'In Progress': return <Clock3 className="h-4 w-4" />;
      case 'Completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'Done': return <CheckCircle2 className="h-4 w-4" />;
      case 'Closed': return <CircleAlert className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  // Filter complaints by search term
  const filteredComplaints = complaints.filter(complaint =>
    complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.currentAssigneeId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <StatsSkeleton />
        
        <div className="mt-8">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name}. Here's an overview of your department's complaints.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/manager/complaints')}
            >
              <ListChecks className="mr-2 h-4 w-4" />
              All Complaints
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/manager/team')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/manager/reports')}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Reports
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            title="Total Complaints" 
            value={stats?.totalComplaints || 0} 
            icon={<ListChecks className="h-5 w-5" />}
            description="All complaints in your department"
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
            iconClass="bg-blue-500/20 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
          
          <StatsCard 
            title="Pending" 
            value={stats?.pendingComplaints || 0} 
            icon={<Clock className="h-5 w-5" />}
            description="Complaints being processed"
            className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900"
            iconClass="bg-amber-500/20 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
          
          <StatsCard 
            title="Completed Today" 
            value={stats?.completedToday || 0} 
            icon={<CheckCircle2 className="h-5 w-5" />}
            description="Complaints resolved today"
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
            iconClass="bg-green-500/20 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />
          
          <StatsCard 
            title="Overdue" 
            value={stats?.overdueComplaints || 0} 
            icon={<CircleAlert className="h-5 w-5" />}
            description="Complaints past SLA"
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
            iconClass="bg-red-500/20 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          />
        </div>

        {/* Team Performance Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Team Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Department Complaint Status</CardTitle>
                <CardDescription>Distribution of complaints by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-4 h-48 bg-muted/20 rounded-md">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Status distribution chart would appear here</p>
                    <Button variant="outline" size="sm">Generate Chart</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>Active members in your department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">JD</div>
                      <div>
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">3 active tickets</p>
                      </div>
                    </div>
                    <Badge variant="outline">Employee</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">JS</div>
                      <div>
                        <p className="text-sm font-medium">Jane Smith</p>
                        <p className="text-xs text-muted-foreground">2 active tickets</p>
                      </div>
                    </div>
                    <Badge variant="outline">Employee</Badge>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/manager/team')}>
                    <Users className="mr-2 h-4 w-4" />
                    View All Team Members
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight mb-2 sm:mb-0">Recent Complaints</h2>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search complaints..."
                  className="pl-8 w-full md:w-60"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link href="/manager/complaints">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 md:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="in progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {refreshing ? (
            <TableSkeleton />
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No complaints found</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                There are no complaints matching the selected filter. Try a different filter or check back later.
              </p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Complaint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredComplaints.map((complaint) => (
                        <TableRow key={complaint._id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/manager/complaints/${complaint._id}`)}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{complaint.title}</div>
                              <div className="text-xs text-muted-foreground">#{complaint._id.slice(-6)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(complaint.status)}>
                              {getStatusIcon(complaint.status)}
                              <span className="ml-1">{complaint.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {complaint.currentAssigneeId?.name || 'Unassigned'}
                          </TableCell>
                          <TableCell>
                            {complaint.clientId?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(complaint.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/manager/complaints/${complaint._id}`}>
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <UserCog className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Manage Team</CardTitle>
                <CardDescription>View and manage your department's team members</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/manager/team')}>
                  <MoveRight className="h-4 w-4 mr-2" />
                  Go to Team Management
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <ClipboardList className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Assign Complaints</CardTitle>
                <CardDescription>Reassign complaints within your department</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/manager/assign')}>
                  <MoveRight className="h-4 w-4 mr-2" />
                  Start Assigning
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <BarChart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Department Reports</CardTitle>
                <CardDescription>View performance metrics and analytics</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/manager/reports')}>
                  <MoveRight className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
