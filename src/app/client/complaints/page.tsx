'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
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
  HelpCircle,
  Calendar
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';

// Import the new design system components
import {
  PageContainer,
  PageHeader,
  StatsGrid,
  ContentCard,
  EmptyState,
  ErrorState,
  PageSkeleton
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
  createdAt: string;
  updatedAt?: string;
  assignedTo?: {
    name: string;
    _id: string;
  };
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'New':
        return 'status-new';
      case 'Assigned':
        return 'status-assigned';
      case 'In Progress':
        return 'status-in-progress';
      case 'Resolved':
      case 'Completed':
      case 'Done':
        return 'status-completed';
      case 'Closed':
        return 'status-closed';
      default:
        return 'status-closed';
    }
  };

  return (
    <Badge variant="outline" className={getStatusClass(status)}>
      {status}
    </Badge>
  );
}

export default function ClientComplaintsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchComplaints();
  }, [refreshKey]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/complaints');

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
          complaint.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complaint.natureType?.name.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply status filter
        const matchesStatus =
          statusFilter === 'all' ? true :
            complaint.status.toLowerCase() === statusFilter.toLowerCase();

        // Apply tab filter
        const matchesTab =
          currentTab === 'all' ? true :
            currentTab === 'active' ?
              ['New', 'Assigned', 'In Progress'].includes(complaint.status) :
              currentTab === 'completed' ?
                ['Completed', 'Done', 'Resolved'].includes(complaint.status) :
                complaint.status.toLowerCase() === 'closed';

        return matchesSearch && matchesStatus && matchesTab;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredComplaints = getFilteredComplaints();
  const activeComplaints = complaints.filter(c => ['New', 'Assigned', 'In Progress'].includes(c.status));
  const completedComplaints = complaints.filter(c => ['Completed', 'Done', 'Resolved'].includes(c.status));
  const closedComplaints = complaints.filter(c => c.status === 'Closed');

  // Calculate statistics
  const calculateStatistics = () => {
    return {
      total: complaints.length,
      active: activeComplaints.length,
      completed: completedComplaints.length,
      closed: closedComplaints.length,
      completionRate: complaints.length > 0
        ? Math.round((completedComplaints.length / complaints.length) * 100)
        : 0
    };
  };

  const stats = calculateStatistics();

  // Stats for the grid
  const statsGridData = [
    {
      title: 'Total Complaints',
      value: stats.total,
      icon: <FileText className="h-6 w-6" />,
      color: 'blue' as const,
      description: 'All complaints submitted'
    },
    {
      title: 'In Progress',
      value: stats.active,
      icon: <Clock className="h-6 w-6" />,
      color: 'yellow' as const,
      description: 'Currently being processed'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: 'green' as const,
      description: `${stats.completionRate}% completion rate`,
      trend: stats.completionRate > 50 ? {
        value: stats.completionRate,
        isPositive: true
      } : undefined
    },
    {
      title: 'Closed',
      value: stats.closed,
      icon: <XCircle className="h-6 w-6" />,
      color: 'gray' as const,
      description: 'Finalized complaints'
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
              <TableHead className="min-w-[250px]">Complaint Details</TableHead>
              <TableHead className="min-w-[140px]">Department</TableHead>
              <TableHead className="min-w-[140px]">Nature</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
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
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{complaint.department?.name || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{complaint.natureType?.name || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={complaint.status} />
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
                    <Link href={`/client/complaints/${complaint._id}`} className="flex items-center">
                      <span className="sr-only sm:not-sr-only sm:mr-2">View</span>
                      <ArrowRight className="h-4 w-4" />
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
        description="Track and manage your submitted complaints"
        badge={{
          text: `${complaints.length} Total`,
          variant: 'secondary'
        }}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/client/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href="/client/complaints/create">
                <Plus className="mr-2 h-4 w-4" />
                New Complaint
              </Link>
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
          description="You haven't submitted any complaints yet. Click the button below to submit your first complaint."
          action={{
            label: "Submit Your First Complaint",
            onClick: () => router.push('/client/complaints/create')
          }}
        />
      ) : (
        <ContentCard>
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setCurrentTab(value)}>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <TabsList className="grid grid-cols-3 max-w-md">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>All ({complaints.length})</span>
                </TabsTrigger>
                <TabsTrigger value="active" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Active ({activeComplaints.length})</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Completed ({completedComplaints.length})</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  title="Refresh data"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>

                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search complaints"
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
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              {renderComplaintsTable(filteredComplaints)}
            </TabsContent>
            <TabsContent value="active" className="mt-0">
              {renderComplaintsTable(filteredComplaints)}
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              {renderComplaintsTable(filteredComplaints)}
            </TabsContent>
            <TabsContent value="closed" className="mt-0">
              {renderComplaintsTable(filteredComplaints)}
            </TabsContent>
          </Tabs>
        </ContentCard>
      )}

      {/* How it works */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5" />
            Understanding Complaint Process
          </CardTitle>
          <CardDescription>
            How your complaints are processed and what each status means
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="rounded-full p-2 bg-blue-100 text-blue-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="w-px h-full bg-blue-200 my-2"></div>
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Submission Phase</h3>
                <p className="text-sm text-muted-foreground mt-1">Your complaint is submitted and assigned a unique ID. It starts with the status <span className="font-medium">New</span>.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="rounded-full p-2 bg-amber-100 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="w-px h-full bg-amber-200 my-2"></div>
              </div>
              <div>
                <h3 className="font-medium text-amber-800">Processing Phase</h3>
                <p className="text-sm text-muted-foreground mt-1">Your complaint is reviewed by department staff. Status changes to <span className="font-medium">Assigned</span> and then <span className="font-medium">In Progress</span>.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="rounded-full p-2 bg-green-100 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="w-px h-full bg-green-200 my-2"></div>
              </div>
              <div>
                <h3 className="font-medium text-green-800">Resolution Phase</h3>
                <p className="text-sm text-muted-foreground mt-1">When resolved, status changes to <span className="font-medium">Completed</span>. You can provide feedback before it's <span className="font-medium">Closed</span>.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}