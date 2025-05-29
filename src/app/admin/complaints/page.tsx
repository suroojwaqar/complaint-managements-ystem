'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Trash2,
  User,
  Building2,
  Calendar,
  CalendarClock,
  Filter as FilterIcon,
  MoreHorizontal,
  RefreshCcw,
  Download,
  Plus,
  X
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Complaint {
  _id: string;
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
  status: string;
  clientId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  department?: {
    _id: string;
    name: string;
  } | null;
  currentAssigneeId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  firstAssigneeId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  _id: string;
  name: string;
  description: string;
}

interface Pagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function AdminComplaintsPage() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, pages: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Available departments - properly initialized as empty array
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchComplaints();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, departmentFilter, activeTab]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();

        // Handle both response formats - the API now returns { departments: [...] }
        const departmentsArray = data.departments || data.data || data;

        // Ensure it's always an array
        if (Array.isArray(departmentsArray)) {
          setDepartments(departmentsArray);
        } else {
          console.error('Departments response is not an array:', departmentsArray);
          setDepartments([]);
        }
      } else {
        console.error('Failed to fetch departments:', response.status);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/complaints?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
        setPagination(data.pagination || { total: 0, pages: 0, page: 1, limit: 10 });
      } else {
        setError('Failed to fetch complaints');
      }
    } catch (error) {
      setError('Error loading complaints');
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    // Handle tab filtering first
    if (activeTab !== 'all') {
      filtered = filtered.filter(complaint => complaint.status.toLowerCase().replace(' ', '-') === activeTab);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.errorType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.clientId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    // Department filter
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.department?._id === departmentFilter);
    }

    // Update active filters
    const activeFiltersList = [];
    if (searchTerm) activeFiltersList.push('Search');
    if (statusFilter && statusFilter !== 'all') activeFiltersList.push('Status');
    if (departmentFilter && departmentFilter !== 'all') activeFiltersList.push('Department');
    setActiveFilters(activeFiltersList);

    // Sort
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';

      if (sortBy === 'clientId') {
        aValue = a.clientId?.name || '';
        bValue = b.clientId?.name || '';
      } else if (sortBy === 'department') {
        aValue = a.department?.name || '';
        bValue = b.department?.name || '';
      } else if (sortBy === 'currentAssigneeId') {
        aValue = a.currentAssigneeId?.name || '';
        bValue = b.currentAssigneeId?.name || '';
      } else {
        aValue = String(a[sortBy as keyof Complaint] || '');
        bValue = String(b[sortBy as keyof Complaint] || '');
      }

      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    setFilteredComplaints(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/complaints/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchComplaints(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete complaint');
      }
    } catch (error) {
      setError('Error deleting complaint');
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'new' | 'assigned' | 'in-progress' | 'completed' | 'done' | 'closed' => {
    const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'new' | 'assigned' | 'in-progress' | 'completed' | 'done' | 'closed'> = {
      'New': 'new',
      'Assigned': 'assigned',
      'In Progress': 'in-progress',
      'Completed': 'completed',
      'Done': 'done',
      'Closed': 'closed'
    };
    return statusVariants[status] || 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setActiveTab('all');
  };

  const exportData = () => {
    alert('Export functionality would be implemented here');
  };

  const nextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
    }
  };

  const prevPage = () => {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 });
    }
  };

  const getStatusCounts = () => {
    const counts = {
      'new': 0,
      'assigned': 0,
      'in-progress': 0,
      'completed': 0,
      'done': 0,
      'closed': 0,
      'all': complaints.length
    };

    complaints.forEach(complaint => {
      const status = complaint.status.toLowerCase().replace(' ', '-');
      if (counts.hasOwnProperty(status)) {
        counts[status as keyof typeof counts] += 1;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading && complaints.length === 0) {
    return (
      <div className="container p-6 mx-auto">
        <div className="flex flex-col space-y-6">
          {/* Loading header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>

          {/* Loading tabs skeleton */}
          <Skeleton className="h-10 w-full" />

          {/* Loading filters skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-1/3" />
          </div>

          {/* Loading table skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-6 mx-auto">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Complaint Management</h1>
            <p className="text-muted-foreground">
              Manage and monitor all system complaints
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchComplaints}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/complaints/create-on-behalf">
                <Plus className="h-4 w-4 mr-2" />
                Create on Behalf
              </Link>
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-7">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary" className="ml-1">
                {statusCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              New
              <Badge variant="new" className="ml-1">
                {statusCounts.new}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              Assigned
              <Badge variant="assigned" className="ml-1">
                {statusCounts.assigned}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="flex items-center gap-2">
              In Progress
              <Badge variant="in-progress" className="ml-1">
                {statusCounts['in-progress']}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              Completed
              <Badge variant="completed" className="ml-1">
                {statusCounts.completed}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="done" className="flex items-center gap-2">
              Done
              <Badge variant="done" className="ml-1">
                {statusCounts.done}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex items-center gap-2">
              Closed
              <Badge variant="closed" className="ml-1">
                {statusCounts.closed}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search complaints..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-secondary" : ""}
            >
              <FilterIcon className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sort by
                  <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setSortBy('updatedAt'); setSortOrder('desc'); }}>
                  Latest Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); }}>
                  Latest Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('title'); setSortOrder('asc'); }}>
                  Title A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('status'); setSortOrder('asc'); }}>
                  Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('clientId'); setSortOrder('asc'); }}>
                  Client A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('department'); setSortOrder('asc'); }}>
                  Department A-Z
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Additional filters that can be shown/hidden */}
          {showFilters && (
            <Card className="bg-background">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Assigned">Assigned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Department</label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active filters display */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-muted-foreground">Active filters:</span>
              {activeFilters.map(filter => (
                <Badge key={filter} variant="secondary" className="font-normal">
                  {filter}
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="h-5 px-2 text-xs" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results summary */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            Showing {filteredComplaints.length} of {pagination.total} complaints
          </div>
          <div className="flex items-center gap-1">
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div className="flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevPage}
                disabled={pagination.page <= 1}
                className="h-8 w-8 p-0"
              >
                &lt;
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextPage}
                disabled={pagination.page >= pagination.pages}
                className="h-8 w-8 p-0"
              >
                &gt;
              </Button>
            </div>
          </div>
        </div>

        {/* Complaints table */}
        {filteredComplaints.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
              <div className="rounded-full bg-muted flex items-center justify-center w-12 h-12 mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No complaints found</h3>
              <p className="text-muted-foreground text-center max-w-md mt-1">
                {searchTerm || statusFilter || departmentFilter
                  ? 'No complaints match your current filters. Try adjusting your search or filters.'
                  : 'No complaints have been submitted yet. Complaints will appear here when created.'}
              </p>
              {(searchTerm || statusFilter || departmentFilter) && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Complaint Details</TableHead>
                    <TableHead className="w-[15%]">Client</TableHead>
                    <TableHead className="w-[15%]">Department</TableHead>
                    <TableHead className="w-[15%]">Assigned To</TableHead>
                    <TableHead className="w-[15%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <TableRow key={complaint._id} className="group hover:bg-muted/50">
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start justify-between">
                            <Link
                              href={`/admin/complaints/${complaint._id}`}
                              className="font-medium hover:underline"
                            >
                              {complaint.title}
                            </Link>
                            <Badge variant={getStatusVariant(complaint.status)}>
                              {complaint.status}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-sm">
                            #{complaint._id.slice(-6)} • {complaint.errorType}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <CalendarClock className="h-3 w-3 mr-1" />
                            Updated {formatDateTime(complaint.updatedAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            {complaint.clientId?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{complaint.clientId?.name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{complaint.clientId?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{complaint.department?.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                            {complaint.currentAssigneeId?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm">{complaint.currentAssigneeId?.name || 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/complaints/${complaint._id}`}
                            className="p-2 hover:bg-primary/10 rounded-md"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/complaints/${complaint._id}/edit`}
                            className="p-2 hover:bg-primary/10 rounded-md"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(complaint._id)}
                            className="p-2 hover:bg-destructive/10 rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}