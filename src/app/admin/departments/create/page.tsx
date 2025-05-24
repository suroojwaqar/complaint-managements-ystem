'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  Building2,
  UsersIcon,
  ClipboardIcon,
  CheckCircle,
  AlertTriangle,
  InfoIcon,
  ChevronRightIcon,
  User,
  Shield
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/lib/toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
  });
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();

        // Filter managers only
        const allManagers = users.filter((user: User) => user.role === 'manager');
        setManagers(allManagers);
      } else {
        console.error('Failed to fetch users');
        toast.error('Failed to load users. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Network error while loading users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user selects an option
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Department name is required');
      return false;
    }

    if (!formData.managerId) {
      setError('Please select a department manager');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      toast.loading('Creating department...');

      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Department created successfully!');
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/departments');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create department');
        toast.error(data.error || 'Failed to create department');
      }
    } catch (error) {
      setError('Error creating department. Please try again.');
      toast.error('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const availableManagers = managers.filter(m => !m.department);

  // Success message screen
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full p-2">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Department Created</h2>
            <p className="text-gray-500 mb-8">
              Your new department has been created successfully.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Redirecting to departments list...</p>
              <Button asChild>
                <Link href="/admin/departments">Go to Departments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full"
          >
            <Link href="/admin/departments">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Department</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <Link href="/admin/dashboard" className="hover:text-primary transition-colors">
                Admin
              </Link>
              <ChevronRightIcon className="h-4 w-4 mx-1" />
              <Link href="/admin/departments" className="hover:text-primary transition-colors">
                Departments
              </Link>
              <ChevronRightIcon className="h-4 w-4 mx-1" />
              <span>Create</span>
            </div>
          </div>
        </div>

        <Button variant="outline" asChild>
          <Link href="/admin/users/create">
            <UsersIcon className="h-4 w-4 mr-2" />
            <span>Create User</span>
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Department Information */}
        <Card>
          <CardHeader className="bg-blue-50 dark:bg-blue-950">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Department Information</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Basic details about the new department
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Department Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., IT Support, Human Resources, Customer Service"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Department Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the department's responsibilities and purpose"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Provide details about what this department handles. This helps users select the right department for their complaints.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Assignment */}
        <Card>
          <CardHeader className="bg-purple-50 dark:bg-purple-950">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-md">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Department Manager</CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">
                  Assign the manager who will oversee this department
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {loadingUsers ? (
              <div className="py-10 flex justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                  <p className="text-muted-foreground">Loading managers...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {managers.length === 0 && (
                  <Alert variant="warning" className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>No managers available</AlertTitle>
                    <AlertDescription>
                      You need to create at least one manager user first.
                      <div className="mt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/admin/users/create">
                            Create Manager User
                          </Link>
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerId">
                      Department Manager <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.managerId}
                      onValueChange={(value) => handleSelectChange('managerId', value)}
                    >
                      <SelectTrigger id="managerId">
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableManagers.length > 0 && (
                          <div>
                            <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                              Available Managers
                            </div>
                            <Separator className="my-1" />
                            {availableManagers.map((manager) => (
                              <SelectItem key={manager._id} value={manager._id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{manager.name}</span>
                                  <span className="text-xs text-muted-foreground">({manager.email})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        )}

                        {managers.filter(m => m.department).length > 0 && (
                          <div className="mt-1">
                            <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                              Already Assigned (will be reassigned)
                            </div>
                            <Separator className="my-1" />
                            {managers.filter(m => m.department).map((manager) => (
                              <SelectItem key={manager._id} value={manager._id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{manager.name}</span>
                                  <span className="text-xs text-muted-foreground">({manager.email})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>{availableManagers.length} available</span>
                    </Badge>

                    {managers.filter(m => m.department).length > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{managers.filter(m => m.department).length} already assigned</span>
                      </Badge>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex text-blue-800">
                      <InfoIcon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-2">Manager Responsibilities:</p>
                        <ul className="space-y-1 list-disc pl-4 text-blue-700">
                          <li>Receives all new complaints for this department</li>
                          <li>Can reassign complaints to team members</li>
                          <li>Oversees complaint resolution process</li>
                          <li>Handles escalated issues and approvals</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Auto-routing information */}
                  <Alert className="bg-green-50 border-green-200">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Automatic Complaint Routing</AlertTitle>
                    <AlertDescription className="text-green-700">
                      With the new auto-routing system, all complaints for this department will be automatically assigned to the manager. 
                      The manager can then delegate tasks to their team members as needed.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-4">
            <div className="text-sm text-muted-foreground">
              <span className="text-red-500">*</span> Required fields
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <Link href="/admin/departments">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.managerId}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Create Department</span>
                  </div>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}