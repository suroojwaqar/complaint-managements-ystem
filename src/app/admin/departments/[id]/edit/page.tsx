'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  User,
  Users,
  Save,
  RefreshCw,
  AlertTriangle,
  Eye,
  BarChart3,
  Clock,
  CheckCircle2,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/lib/toast';

// Import design system components
import {
  PageContainer,
  PageHeader,
  ContentCard,
  StatsGrid,
  ErrorState,
  PageSkeleton
} from '@/components/layout/pages';

const formSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().min(1, 'Description is required'),
  managerId: z.string().min(1, 'Manager is required'),
  defaultAssigneeId: z.string().min(1, 'Default assignee is required'),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface DepartmentData {
  _id: string;
  name: string;
  description: string;
  managerId: {
    _id: string;
    name: string;
    email: string;
  };
  defaultAssigneeId: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalComplaints: number;
    activeComplaints: number;
    completedComplaints: number;
    avgResolutionTime: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<DepartmentData | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      managerId: '',
      defaultAssigneeId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    fetchDepartmentData();
    fetchUsers();
  }, [departmentId]);

  const fetchDepartmentData = async () => {
    try {
      setError('');
      const response = await fetch(`/api/departments/${departmentId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch department data');
      }

      const departmentData = await response.json();
      setDepartment(departmentData);

      // Set form values
      form.reset({
        name: departmentData.name,
        description: departmentData.description,
        managerId: departmentData.managerId?._id || '',
        defaultAssigneeId: departmentData.defaultAssigneeId?._id || '',
        isActive: departmentData.isActive,
      });
    } catch (error: any) {
      console.error('Error fetching department data:', error);
      setError(error.message || 'Failed to load department data');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?includeInactive=false');
      if (response.ok) {
        const data = await response.json();
        const users = data.users || data;
        setManagers(users.filter((user: User) => user.role === 'manager'));
        setEmployees(users.filter((user: User) => user.role === 'employee'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update department');
      }

      const updatedDepartment = await response.json();
      setDepartment(updatedDepartment);
      toast.success('Department updated successfully');

      // Refresh the department data
      await fetchDepartmentData();
    } catch (error: any) {
      console.error('Error updating department:', error);
      setError(error.message || 'Failed to update department');
      toast.error(error.message || 'Failed to update department');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error && !department) {
    return (
      <PageContainer>
        <ErrorState
          title="Department Not Found"
          message={error}
          onRetry={() => {
            setError('');
            fetchDepartmentData();
          }}
        />
      </PageContainer>
    );
  }

  if (!department) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Department Not Found</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            We couldn't find the department you're looking for. It may have been deleted or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link href="/admin/departments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Departments
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Mock stats for now - replace with actual API data
  const statsData = [
    {
      title: 'Total Complaints',
      value: department.stats?.totalComplaints || 0,
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'blue' as const,
      description: 'All time complaints'
    },
    {
      title: 'Active Complaints',
      value: department.stats?.activeComplaints || 0,
      icon: <Clock className="h-6 w-6" />,
      color: 'yellow' as const,
      description: 'Currently in progress'
    },
    {
      title: 'Completed',
      value: department.stats?.completedComplaints || 0,
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: 'green' as const,
      description: 'Successfully resolved'
    },
    {
      title: 'Avg Resolution',
      value: department.stats?.avgResolutionTime ? `${department.stats.avgResolutionTime}h` : 'N/A',
      icon: <Clock className="h-6 w-6" />,
      color: 'purple' as const,
      description: 'Average completion time'
    },
  ];

  return (
    <PageContainer className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title={`Edit Department: ${department.name}`}
        description={`Department ID: ${department._id}`}
        badge={{
          text: department.isActive ? 'Active' : 'Inactive',
          variant: department.isActive ? 'default' : 'secondary'
        }}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/admin/departments/${departmentId}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/departments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Departments
              </Link>
            </Button>
          </>
        }
      />

      {/* Department Statistics */}
      <StatsGrid stats={statsData} />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Edit Form */}
      <ContentCard
        title="Department Information"
        description="Update the department's basic information and assignments"
        headerActions={
          <Button variant="outline" onClick={fetchDepartmentData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter department name" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique name for this department
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Department</FormLabel>
                        <FormDescription>
                          Inactive departments won't appear in complaint forms
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this department handles..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of the department's responsibilities
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Team Assignments Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">Team Assignments</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Manager</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager._id} value={manager._id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{manager.name}</span>
                                <span className="text-xs text-muted-foreground">{manager.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The manager responsible for this department
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultAssigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Assignee</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select default assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee._id} value={employee._id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{employee.name}</span>
                                <span className="text-xs text-muted-foreground">{employee.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Employee who receives new complaints by default
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Current Team Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Current Team Members</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Current Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {department.managerId?.name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <p className="font-medium">{department.managerId?.name || 'No manager assigned'}</p>
                        <p className="text-xs text-muted-foreground">{department.managerId?.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Current Default Assignee
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                        {department.defaultAssigneeId?.name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <p className="font-medium">{department.defaultAssigneeId?.name || 'No assignee set'}</p>
                        <p className="text-xs text-muted-foreground">{department.defaultAssigneeId?.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(department.updatedAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/departments">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </ContentCard>

      {/* Additional Information */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Management Tips
          </CardTitle>
          <CardDescription>
            Best practices for managing department settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">🎯 Manager Role</h4>
              <p className="text-sm text-muted-foreground">
                Department managers can assign complaints across teams, approve completions, and manage department performance.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">⚡ Default Assignee</h4>
              <p className="text-sm text-muted-foreground">
                New complaints automatically get assigned to the default assignee. Managers can reassign as needed.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">🔄 Status Changes</h4>
              <p className="text-sm text-muted-foreground">
                Deactivating a department will hide it from complaint forms but preserve existing complaint data.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">📊 Performance</h4>
              <p className="text-sm text-muted-foreground">
                Monitor department statistics above to track performance and identify optimization opportunities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}