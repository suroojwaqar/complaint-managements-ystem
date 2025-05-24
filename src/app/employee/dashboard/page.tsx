'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { 
  LayoutDashboard, 
  Users, 
  ListChecks, 
  Clock, 
  CheckCircle2, 
  Bell, 
  LogOut, 
  Clock3,
  AlertCircle,
  PanelLeftOpen,
  Search,
  HelpCircle,
  FileText,
  ArrowRightCircle,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  CircleAlert
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch complaints assigned to this employee
      let url = '/api/complaints';
      if (activeTab !== 'all') {
        url += `?status=${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
      }
      
      const complaintsResponse = await fetch(url);
      const complaintsData = complaintsResponse.ok ? await complaintsResponse.json() : { complaints: [] };
      
      const myComplaints = complaintsData.complaints || [];
      
      // Calculate stats
      const stats = {
        totalAssigned: myComplaints.length,
        inProgress: myComplaints.filter((c: any) => c.status === 'In Progress').length,
        completed: myComplaints.filter((c: any) => c.status === 'Completed').length,
        newAssignments: myComplaints.filter((c: any) => c.status === 'Assigned').length,
      };

      setStats(stats);
      setComplaints(myComplaints.slice(0, 6)); // Recent 6 complaints for dashboard view
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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

  const ComplaintsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-9 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
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
          <Skeleton className="h-6 w-36 mb-4" />
          <ComplaintsSkeleton />
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
            <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name}. Here's an overview of your assigned complaints.
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
              onClick={() => router.push('/employee/complaints')}
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
                <DropdownMenuItem onClick={() => router.push('/employee/profile')}>
                  <Users className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/employee/settings')}>
                  <PanelLeftOpen className="mr-2 h-4 w-4" />
                  Settings
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
            title="Total Assigned" 
            value={stats?.totalAssigned || 0} 
            icon={<ListChecks className="h-5 w-5" />}
            description="Total complaints in your queue"
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
            iconClass="bg-blue-500/20 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
          
          <StatsCard 
            title="New Assignments" 
            value={stats?.newAssignments || 0} 
            icon={<AlertCircle className="h-5 w-5" />}
            description="Newly assigned complaints"
            className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900"
            iconClass="bg-amber-500/20 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
          
          <StatsCard 
            title="In Progress" 
            value={stats?.inProgress || 0} 
            icon={<Clock className="h-5 w-5" />}
            description="Complaints you're working on"
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"
            iconClass="bg-purple-500/20 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          />
          
          <StatsCard 
            title="Completed" 
            value={stats?.completed || 0} 
            icon={<CheckCircle2 className="h-5 w-5" />}
            description="Resolved complaints"
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
            iconClass="bg-green-500/20 text-green-600 dark:bg-green-500/10 dark:text-green-400"
          />
        </div>

        {/* My Complaints Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight mb-2 sm:mb-0">My Complaints</h2>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="px-2">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Link href="/employee/complaints">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 md:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="assigned">Assigned</TabsTrigger>
              <TabsTrigger value="in progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {refreshing ? (
            <ComplaintsSkeleton />
          ) : complaints.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaints.map((complaint) => (
                <ComplaintCard 
                  key={complaint._id} 
                  complaint={complaint} 
                  getStatusColor={getStatusColor} 
                  getStatusIcon={getStatusIcon}
                  handleClick={() => router.push(`/employee/complaints/${complaint._id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="mr-2 h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Frequently used tools and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => router.push('/employee/complaints/new')}>
                  <FileText className="h-5 w-5 mb-2" />
                  <span>Submit Report</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => router.push('/employee/help')}>
                  <HelpCircle className="h-5 w-5 mb-2" />
                  <span>Get Help</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => router.push('/employee/history')}>
                  <Clock className="h-5 w-5 mb-2" />
                  <span>History</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => router.push('/employee/dashboard')}>
                  <LayoutDashboard className="h-5 w-5 mb-2" />
                  <span>Dashboard</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Resources
              </CardTitle>
              <CardDescription>
                Helpful documentation and guides
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <FileText className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Complaint Handling Guide</h4>
                  <p className="text-sm text-muted-foreground">Learn the best practices for managing client complaints efficiently.</p>
                  <div className="mt-2">
                    <Link href="/employee/resources/handling-guide">
                      <Button variant="link" size="sm" className="h-auto p-0">
                        View guide <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <FileText className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Department Contacts</h4>
                  <p className="text-sm text-muted-foreground">Directory of key contacts across departments for escalations.</p>
                  <div className="mt-2">
                    <Link href="/employee/resources/contacts">
                      <Button variant="link" size="sm" className="h-auto p-0">
                        View contacts <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Component for statistics cards
const StatsCard = ({ title, value, icon, description, className = '', iconClass = '' }) => (
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

// Component for complaint cards
const ComplaintCard = ({ complaint, getStatusColor, getStatusIcon, handleClick }) => {
  const formattedDate = complaint.createdAt 
    ? format(new Date(complaint.createdAt), 'MMM dd, yyyy')
    : 'Unknown date';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base line-clamp-1">{complaint.title}</CardTitle>
          <Badge className={`${getStatusColor(complaint.status)} flex items-center gap-1`}>
            {getStatusIcon(complaint.status)}
            {complaint.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-1">
          {complaint.natureType?.name || 'General Issue'} 
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-3">
          {complaint.description}
        </p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client:</span>
            <span className="font-medium truncate max-w-[100px]">
              {complaint.clientId?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Error:</span>
            <span className="font-medium truncate max-w-[100px]">{complaint.errorType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dept:</span>
            <span className="font-medium truncate max-w-[100px]">
              {complaint.department?.name || 'Unknown'}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between items-center border-t bg-muted/20">
        <div className="text-xs text-muted-foreground">
          #{complaint._id.substring(complaint._id.length - 6)}
        </div>
        <Button variant="ghost" size="sm" className="gap-1 h-8">
          View Details
          <ArrowRightCircle className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
