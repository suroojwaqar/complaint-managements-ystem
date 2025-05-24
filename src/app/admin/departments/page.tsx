'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash,
  User,
  Building,
  Eye,
  Search,
  Filter,
  Users,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';

interface Department {
  _id: string;
  name: string;
  description: string;
  managerId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  defaultAssigneeId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  isActive: boolean;
  createdAt: string;
}

export default function DepartmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentTab, setCurrentTab] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDepartments();
  }, [refreshKey]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/departments');

      if (response.ok) {
        const data = await response.json();

        // Handle both response formats
        const departmentsArray = data.departments || data.data || data;

        if (Array.isArray(departmentsArray)) {
          setDepartments(departmentsArray);
        } else {
          setDepartments([]);
          toast.error('Invalid departments data format');
        }
      } else {
        const errorData = await response.json();
        toast.error(`Failed to fetch departments: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Network error fetching departments:', error);
      toast.error(`Error loading departments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const loadingToast = toast.loading('Deleting department permanently...');
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });

      // Dismiss loading toast
      toast.dismiss();

      if (response.ok) {
        const data = await response.json();
        // Refresh the list
        setRefreshKey(prev => prev + 1);
        toast.success(data.message || 'Department deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete department');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Network error - please try again');
      console.error('Delete error:', error);
    }
  };

  // Filter and sort functions
  const getFilteredDepartments = () => {
    return departments
      .filter(department => {
        // Apply search filter
        const matchesSearch =
          department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          department.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          department.managerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          department.defaultAssigneeId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply status filter
        const matchesStatus =
          statusFilter === 'all' ? true :
            statusFilter === 'active' ? department.isActive :
              !department.isActive;

        // Apply tab filter
        const matchesTab =
          currentTab === 'all' ? true :
            currentTab === 'active' ? department.isActive :
              !department.isActive;

        return matchesSearch && matchesStatus && matchesTab;
      })
      .sort((a, b) => {
        // Apply sorting
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'createdAt':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'manager':
            const aManagerName = a.managerId?.name || 'No Manager';
            const bManagerName = b.managerId?.name || 'No Manager';
            return aManagerName.localeCompare(bManagerName);
          default:
            return 0;
        }
      });
  };

  const filteredDepartments = getFilteredDepartments();
  const activeDepartments = departments.filter(d => d.isActive);
  const inactiveDepartments = departments.filter(d => !d.isActive);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Loading */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Management</h1>
          <p className="text-muted-foreground">
            Configure departments, managers, and default assignees
          </p>
        </div>
        <Button asChild size="lg" className="shadow-sm">
          <Link href="/admin/departments/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Department
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Departments</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold">{departments.length}</p>
                  {departments.length === 0 && (
                    <span className="text-xs text-muted-foreground">(None created yet)</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Departments</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold">{activeDepartments.length}</p>
                  <span className="text-xs text-muted-foreground">
                    ({activeDepartments.length > 0 ?
                      Math.round((activeDepartments.length / departments.length) * 100) + '%' :
                      '0%'})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Inactive Departments</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold">{inactiveDepartments.length}</p>
                  <span className="text-xs text-muted-foreground">
                    ({inactiveDepartments.length > 0 ?
                      Math.round((inactiveDepartments.length / departments.length) * 100) + '%' :
                      '0%'})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      {departments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setCurrentTab(value)}>
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <TabsList className="grid grid-cols-3 max-w-md">
                  <TabsTrigger value="all" className="flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>All ({departments.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="active" className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Active ({activeDepartments.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    <span>Inactive ({inactiveDepartments.length})</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    title="Refresh data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>

                  <div className="relative w-full max-w-[180px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search departments"
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="createdAt">Sort by Creation Date</SelectItem>
                      <SelectItem value="manager">Sort by Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="all">
                {renderDepartmentsList(filteredDepartments)}
              </TabsContent>
              <TabsContent value="active">
                {renderDepartmentsList(filteredDepartments)}
              </TabsContent>
              <TabsContent value="inactive">
                {renderDepartmentsList(filteredDepartments)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {departments.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <div className="bg-primary/10 p-4 rounded-full inline-flex mx-auto mb-4">
              <Building className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No departments found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Departments help organize your complaint management system. Create your first department to get started.
            </p>
            <div className="space-y-4 max-w-xs mx-auto">
              <Button asChild size="lg" className="w-full">
                <Link href="/admin/departments/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Department
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="w-full">
                <Link href="/admin/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  function renderDepartmentsList(departments: Department[]) {
    if (departments.length === 0) {
      return (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No matching departments</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setSortBy('name');
          }}>
            Clear Filters
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department) => (
          <Card key={department._id} className={`hover:shadow-md transition-shadow border-l-4 ${department.isActive ? 'border-l-green-500' : 'border-l-gray-400'
            }`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {department.name}
                    <Badge variant={department.isActive ? 'default' : 'secondary'} className="ml-2">
                      {department.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {department.description || 'No description provided'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-2">
              {/* Warning for incomplete departments */}
              {(!department.managerId || !department.defaultAssigneeId) && (
                <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
                      Incomplete Setup
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {!department.managerId && 'Missing manager assignment. '}
                    {!department.defaultAssigneeId && 'Missing default assignee. '}
                    Please edit to complete setup.
                  </p>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground">Manager</div>
                    <div className={`font-medium ${
                      !department.managerId ? 'text-amber-600 dark:text-amber-400 italic' : ''
                    }`}>
                      {department.managerId?.name || 'No Manager Assigned'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {department.managerId?.email || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-muted-foreground">Default Assignee</div>
                    <div className={`font-medium ${
                      !department.defaultAssigneeId ? 'text-amber-600 dark:text-amber-400 italic' : ''
                    }`}>
                      {department.defaultAssigneeId?.name || 'No Assignee Set'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {department.defaultAssigneeId?.email || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <span>Created on</span>
                  <span className="ml-1 font-medium">
                    {new Date(department.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-2 pb-4">
              <Button variant="ghost" size="sm" asChild className="h-auto p-0 text-primary hover:text-primary/90">
                <Link href={`/admin/departments/${department._id}`}>
                  View Details →
                </Link>
              </Button>

              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" asChild title="View Department">
                  <Link href={`/admin/departments/${department._id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild title="Edit Department">
                  <Link href={`/admin/departments/${department._id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" title="Delete Department Permanently">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete Department Permanently?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the department "{department.name}" from the database. 
                        This action cannot be undone. All associated data will be lost.
                        <br /><br />
                        <strong>Are you sure you want to proceed?</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(department._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}