'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  FileText,
  ArrowRight,
  AlertTriangle,
  Clock,
  Building,
  Tag,
  Home,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Filter,
  SortDesc,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/lib/toast';

// Import the design system components
import {
  PageContainer,
  PageHeader,
  StatsGrid,
  ContentCard,
  EmptyState,
  ErrorState,
  PageSkeleton,
  FilterBar
} from '@/components/layout/pages';

interface Complaint {
  _id: string;
  title: string;
  description: string;
  status: string;
  department: {
    name: string;
    _id?: string;
  };
  natureType: {
    name: string;
    _id?: string;
  };
  clientId?: {
    name: string;
    email: string;
    _id: string;
  } | null;
  currentAssigneeId?: {
    name: string;
    email: string;
    _id: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New':
        return 'secondary';
      case 'Assigned':
        return 'warning';
      case 'In Progress':
        return 'info';
      case 'Completed':
      case 'Done':
      case 'Resolved':
        return 'success';
      case 'Closed':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getStatusVariant(status) as any} className="font-medium">
      {status}
    </Badge>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-800';
    }
  };

  return (
    <Badge variant="outline" className={getPriorityColor(priority)}>
      {priority}
    </Badge>
  );
}

export default function EmployeeComplaintsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('assigned');
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchComplaints();
  }, [refreshKey]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/complaints?role=employee');

      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch complaints');
        console.error('Failed to fetch complaints:', errorData);
        toast.error(errorData.error || 'Failed to fetch complaints');
      }
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredComplaints = () => {
    return complaints
      .filter(complaint => {
        // Apply search filter
        const matchesSearch =
          complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.natureType?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply status filter
        const matchesStatus =
          statusFilter === 'all' ? true :
            complaint.status.toLowerCase() === statusFilter.toLowerCase();

        // Apply priority filter
        const matchesPriority =
          priorityFilter === 'all' ? true :
            complaint.priority?.toLowerCase() === priorityFilter.toLowerCase();

        // Apply tab filter
        const matchesTab =
          currentTab === 'all' ? true :
            currentTab === 'assigned' ?
              complaint.currentAssigneeId?._id === session?.user?.id :
              currentTab === 'active' ?
                ['New', 'Assigned', 'In Progress'].includes(complaint.status) :
                currentTab === 'completed' ?
                  ['Completed', 'Done', 'Resolved'].includes(complaint.status) :
                  complaint.status.toLowerCase() === 'closed';

        return matchesSearch && matchesStatus && matchesPriority && matchesTab;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'updated':
            return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
          case 'priority':
            const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
            return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                   (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
          default:
            return 0;
        }
      });
  };

  const filteredComplaints = getFilteredComplaints();
  const myComplaints = complaints.filter(c => c.currentAssigneeId?._id === session?.user?.id);
  const activeComplaints = complaints.filter(c => ['New', 'Assigned', 'In Progress'].includes(c.status));
  const completedComplaints = complaints.filter(c => ['Completed', 'Done', 'Resolved'].includes(c.status));
  const closedComplaints = complaints.filter(c => c.status === 'Closed');

  // Calculate statistics
  const calculateStatistics = () => {
    const myActiveComplaints = myComplaints.filter(c => ['New', 'Assigned', 'In Progress'].includes(c.status));
    const myCompletedComplaints = myComplaints.filter(c => ['Completed', 'Done', 'Resolved'].includes(c.status));
    
    return {
      assigned: myComplaints.length,
      active: myActiveComplaints.length,
      completed: myCompletedComplaints.length,
      total: complaints.length,
      completionRate: myComplaints.length > 0
        ? Math.round((myCompletedComplaints.length / myComplaints.length) * 100)
        : 0
    };
  };

  const stats = calculateStatistics();

  // Stats for the grid
  const statsGridData = [
    {
      title: 'Assigned to Me',
      value: stats.assigned,
      icon: <User className="h-6 w-6" />,
      color: 'blue' as const,
      description: 'Currently assigned complaints'
    },
    {
      title: 'In Progress',
      value: stats.active,
      icon: <Clock className="h-6 w-6" />,
      color: 'yellow' as const,
      description: 'Active work items'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: 'green' as const,
      description: `${stats.completionRate}% completion rate`,
      trend: stats.completionRate > 70 ? {
        value: stats.completionRate,
        isPositive: true
      } : undefined
    },
    {
      title: 'Department Total',
      value: stats.total,
      icon: <Building className="h-6 w-6" />,
      color: 'purple' as const,
      description: 'All department complaints'
    },
  ];

  if (loading) {
    return <PageSkeleton />;
  }

  function renderComplaintsTable(complaints: Complaint[]) {
    if (complaints.length === 0) {
      return (
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12 text-muted-foreground" />}
          title="No matching complaints"
          description="Try adjusting your search or filter criteria to find what you're looking for."
          action={{
            label: "Clear Filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
              setPriorityFilter('all');
            }
          }}
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[280px]">Complaint Details</TableHead>
              <TableHead className="min-w-[140px]">Client</TableHead>
              <TableHead className="min-w-[120px]">Department</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[100px]">Priority</TableHead>
              <TableHead className="min-w-[120px]">Created</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((complaint) => (
              <TableRow key={complaint._id} className="table-row-hover">
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium line-clamp-1">{complaint.title}</div>
                    <div className="text-muted-foreground text-sm line-clamp-1">
                      {complaint.description}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      {complaint.natureType?.name || 'N/A'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {complaint.clientId?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{complaint.clientId?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {complaint.clientId?.email || 'N/A'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{complaint.department?.name || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={complaint.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={complaint.priority} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild className="h-8">
                    <Link href={`/employee/complaints/${complaint._id}`} className="flex items-center">
                      <span className="sr-only sm:not-sr-only sm:mr-2">View</span>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <PageContainer className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="My Complaints"
        description="Manage and track complaints assigned to you"
        badge={{
          text: `${myComplaints.length} Assigned`,
          variant: 'secondary'
        }}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/employee/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey(prev => prev + 1)}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </>
        }
      />

      {/* Statistics Grid */}
      <StatsGrid stats={statsGridData} />

      {/* Error State */}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => setRefreshKey(prev => prev + 1)}
        />
      )}

      {/* Complaints Content */}
      {complaints.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12 text-muted-foreground" />}
          title="No complaints found"
          description="No complaints have been assigned to your department yet."
          action={{
            label: "Go to Dashboard",
            onClick: () => router.push('/employee/dashboard')
          }}
        />
      ) : (
        <ContentCard>
          {/* Filters */}
          <FilterBar className="mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search complaints, clients, or departments..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          <Tabs defaultValue="assigned" className="w-full" onValueChange={(value) => setCurrentTab(value)}>
            <TabsList className="grid grid-cols-4 max-w-lg mb-6">
              <TabsTrigger value="assigned" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>My Tasks ({myComplaints.length})</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Active ({activeComplaints.length})</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Completed ({completedComplaints.length})</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>All ({complaints.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assigned" className="mt-0">
              {renderComplaintsTable(filteredComplaints)}
            </TabsContent>
            <TabsContent value="active" className="mt-0">
              {renderComplaintsTable(filteredComplaints)}
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              {renderComplaintsTable(filteredComplaints)}
            </TabsContent>
            <TabsContent value="all" className="mt-0">
              {renderComplaintsTable(filteredComplaints)}
            </TabsContent>
          </Tabs>
        </ContentCard>
      )}

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Quick Actions Guide
          </CardTitle>
          <CardDescription>
            Common tasks and workflow tips for handling complaints efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-full p-2 bg-blue-100 text-blue-700">
                  <Eye className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-blue-800">Review Details</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Click on any complaint to view full details, attachments, and client information. Update status as you progress.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-full p-2 bg-amber-100 text-amber-700">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-amber-800">Update Progress</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Change status from <span className="font-medium">Assigned</span> to <span className="font-medium">In Progress</span> when you start working, and to <span className="font-medium">Completed</span> when finished.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-full p-2 bg-green-100 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-green-800">Add Remarks</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Always add detailed remarks about your resolution steps. This helps clients understand what was done and aids future troubleshooting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}