'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

// Icons
import { 
  LayoutDashboard, 
  ListChecks, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  Search,
  HelpCircle,
  FileText,
  ArrowRightCircle,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  CircleAlert,
  PlusCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Standardized Components
import { StatusBadge } from '@/components/ui/status-badge';
import { DashboardSkeleton, CardGridSkeleton } from '@/components/ui/loading';
import { ErrorDisplay, EmptyState } from '@/components/ui/error-display';
import { layoutClasses, componentPatterns } from '@/lib/design-system';

// Modal Components
// Note: Using dedicated route /client/complaints/create instead of modal

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
  natureType?: {
    _id: string;
    name: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch complaints for the client
      let url = '/api/complaints';
      if (activeTab !== 'all') {
        url += `?status=${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
      }
      
      const complaintsResponse = await fetch(url);
      
      if (complaintsResponse.ok) {
        const complaintsData = await complaintsResponse.json();
        const myComplaints = complaintsData.complaints || [];
        
        // Calculate stats
        const stats = {
          totalComplaints: myComplaints.length,
          pendingComplaints: myComplaints.filter((c: any) => ['New', 'Assigned', 'In Progress'].includes(c.status)).length,
          completedComplaints: myComplaints.filter((c: any) => ['Completed', 'Done'].includes(c.status)).length,
          closedComplaints: myComplaints.filter((c: any) => c.status === 'Closed').length,
        };

        setStats(stats);
        setComplaints(myComplaints);
      } else {
        setError('Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error loading complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.errorType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <div className={layoutClasses.container}>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className={layoutClasses.container}>
        {/* Header */}
        <div className={layoutClasses.header}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Complaints</h1>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name}. Here's an overview of your complaints.
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
              variant="default"
              asChild
            >
              <Link href="/client/complaints/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Complaint
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              asChild
            >
              <Link href="/client/complaints">
                <ListChecks className="mr-2 h-4 w-4" />
                All Complaints
              </Link>
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
                <DropdownMenuItem onClick={() => router.push('/client/profile')}>
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/client/help')}>
                  Help Center
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

        {/* Error Message */}
        {error && (
          <ErrorDisplay
            title="Error"
            message={error}
            onRetry={handleRefresh}
            className={layoutClasses.spacing.section}
          />
        )}

        {/* Stats Cards */}
        <div className={`${layoutClasses.grid.stats} ${layoutClasses.spacing.section}`}>
          <StatsCard 
            title="Total Complaints" 
            value={stats?.totalComplaints || 0} 
            icon={<ListChecks className="h-5 w-5" />}
            description="All your submitted complaints"
            className={componentPatterns.statsCard.gradient.blue}
            iconClass={componentPatterns.statsCard.icon.blue}
          />
          
          <StatsCard 
            title="Pending" 
            value={stats?.pendingComplaints || 0} 
            icon={<Clock className="h-5 w-5" />}
            description="Complaints being processed"
            className={componentPatterns.statsCard.gradient.amber}
            iconClass={componentPatterns.statsCard.icon.amber}
          />
          
          <StatsCard 
            title="Completed" 
            value={stats?.completedComplaints || 0} 
            icon={<CheckCircle2 className="h-5 w-5" />}
            description="Complaints resolved"
            className={componentPatterns.statsCard.gradient.green}
            iconClass={componentPatterns.statsCard.icon.green}
          />
          
          <StatsCard 
            title="Closed" 
            value={stats?.closedComplaints || 0} 
            icon={<CircleAlert className="h-5 w-5" />}
            description="Finalized complaints"
            className={componentPatterns.statsCard.gradient.gray}
            iconClass={componentPatterns.statsCard.icon.gray}
          />
        </div>

        {/* Complaints Section */}
        <div className={layoutClasses.spacing.section}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight mb-2 sm:mb-0">My Complaints</h2>
            
            <div className="flex items-center space-x-2">
              <div className={componentPatterns.search.container}>
                <Search className={componentPatterns.search.icon} />
                <Input
                  type="search"
                  placeholder="Search complaints..."
                  className={componentPatterns.search.input}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 md:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="in progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {refreshing ? (
            <CardGridSkeleton />
          ) : filteredComplaints.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No complaints found"
              description="There are no complaints matching the selected filter. Try a different filter or create a new complaint."
              action={{
                label: "New Complaint",
                onClick: () => router.push('/client/complaints/create')
              }}
            />
          ) : (
            <div className={layoutClasses.grid.responsive}>
              {filteredComplaints.map((complaint) => (
                <ComplaintCard 
                  key={complaint._id} 
                  complaint={complaint} 
                  handleClick={() => router.push(`/client/complaints/${complaint._id}`)}
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
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
                  <Link href="/client/complaints/create">
                    <FileText className="h-5 w-5 mb-2" />
                    <span>New Complaint</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => router.push('/client/complaints')}>
                  <ListChecks className="h-5 w-5 mb-2" />
                  <span>All Complaints</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => router.push('/client/help')}>
                  <HelpCircle className="h-5 w-5 mb-2" />
                  <span>Get Help</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" onClick={() => router.push('/client/profile')}>
                  <LayoutDashboard className="h-5 w-5 mb-2" />
                  <span>My Profile</span>
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
                  <h4 className="font-medium mb-1">Complaint Submission Guide</h4>
                  <p className="text-sm text-muted-foreground">Learn how to submit and track your complaints effectively.</p>
                  <div className="mt-2">
                    <Link href="/client/resources/guide">
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
                  <h4 className="font-medium mb-1">Frequently Asked Questions</h4>
                  <p className="text-sm text-muted-foreground">Find answers to common questions about the complaint process.</p>
                  <div className="mt-2">
                    <Link href="/client/resources/faq">
                      <Button variant="link" size="sm" className="h-auto p-0">
                        View FAQs <ExternalLink className="ml-1 h-3 w-3" />
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
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  className?: string;
  iconClass?: string;
}

const StatsCard = ({ title, value, icon, description, className = '', iconClass = '' }: StatsCardProps) => (
  <Card className={`${componentPatterns.statsCard.base} ${className}`}>
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
interface ComplaintCardProps {
  complaint: Complaint;
  handleClick: () => void;
}

const ComplaintCard = ({ complaint, handleClick }: ComplaintCardProps) => {
  const formattedDate = complaint.createdAt 
    ? format(new Date(complaint.createdAt), 'MMM dd, yyyy')
    : 'Unknown date';

  return (
    <Card className={`${componentPatterns.statsCard.base} ${layoutClasses.card.hover}`} onClick={handleClick}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base line-clamp-1">{complaint.title}</CardTitle>
          <StatusBadge status={complaint.status} />
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
            <span className="text-muted-foreground">Error Type:</span>
            <span className="font-medium truncate max-w-[100px]">{complaint.errorType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Department:</span>
            <span className="font-medium truncate max-w-[100px]">
              {complaint.department?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assignee:</span>
            <span className="font-medium truncate max-w-[100px]">
              {complaint.currentAssigneeId?.name || 'Unassigned'}
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
