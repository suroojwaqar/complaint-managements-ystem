'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Building,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Save,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/lib/toast';

interface Department {
  _id: string;
  name: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: Department;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditUserFormData {
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
}

interface ChangePasswordFormData {
  password: string;
  confirmPassword: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User details form
  const userForm = useForm<EditUserFormData>({
    defaultValues: {
      name: '',
      email: '',
      role: 'client',
      department: 'none',
      isActive: true,
    },
  });

  // Password change form
  const passwordForm = useForm<ChangePasswordFormData>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (userId) {
      console.log('=== COMPONENT MOUNT ===');
      console.log('User ID from params:', userId);
      console.log('Current URL:', window.location.href);
      fetchUserData();
      fetchDepartments();
      checkApiEndpoint();
    }
  }, [userId]);

  const checkApiEndpoint = async () => {
    try {
      console.log('=== API ENDPOINT CHECK ===');
      const testResponse = await fetch(`/api/users/${userId}`, { method: 'HEAD' });
      console.log('API endpoint test status:', testResponse.status);
      if (testResponse.status === 404) {
        console.error('API route not found! Check if route.ts exists at:');
        console.error('src/app/api/users/[id]/route.ts');
      }
    } catch (error) {
      console.error('API endpoint check failed:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);

      // Set form values
      userForm.reset({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department?._id || 'none',
        isActive: userData.isActive,
      });

      console.log('User data loaded:', userData);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error(error.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        const departmentsArray = data.departments || data.data || data;
        if (Array.isArray(departmentsArray)) {
          setDepartments(departmentsArray.filter(dept => dept.isActive));
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleUserUpdate = async (data: EditUserFormData) => {
    try {
      setSaving(true);
      console.log('=== FRONTEND UPDATE START ===');
      console.log('1. Form data:', JSON.stringify(data, null, 2));
      console.log('2. User ID:', userId);
      
      const loadingToast = toast.loading('Updating user...');

      const updateData = {
        ...data,
        department: data.department === 'none' ? null : data.department,
      };
      
      console.log('3. Processed update data:', JSON.stringify(updateData, null, 2));
      console.log('4. Making request to:', `/api/users/${userId}`);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      toast.dismiss();
      
      console.log('5. Response status:', response.status);
      console.log('6. Response status text:', response.statusText);
      console.log('7. Response headers:', Object.fromEntries(response.headers.entries()));

      // Get response text first to handle both JSON and non-JSON responses
      const responseText = await response.text();
      console.log('8. Raw response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('9. Error response:', errorData);
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      let updatedUser;
      try {
        updatedUser = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid JSON response from server');
      }
      
      console.log('10. User updated successfully:', updatedUser.name);
      console.log('=== FRONTEND UPDATE SUCCESS ===');
      
      setUser(updatedUser);
      toast.success('User updated successfully');

      // Refresh the form with updated data
      await fetchUserData();
    } catch (error: any) {
      toast.dismiss();
      console.error('=== FRONTEND UPDATE ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== FRONTEND UPDATE ERROR END ===');
      
      // Show more specific error messages
      let errorMessage = 'Failed to update user';
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error - check if server is running';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Server returned invalid response';
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    try {
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (data.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      setChangingPassword(true);
      const loadingToast = toast.loading('Changing password...');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: data.password,
        }),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      passwordForm.reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      toast.dismiss();
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          We couldn't find the user you're looking for. It may have been deleted or you don't have permission to view it.
        </p>
        <Button asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Edit User: {user.name}</h1>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              User ID: {user._id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchUserData()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
              <CardDescription>
                Update the user's basic information and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(handleUserUpdate)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="name"
                      rules={{
                        required: 'Name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter user's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="email"
                      rules={{
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="role"
                      rules={{ required: 'Role is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Admin: Full system access, Manager: Department management, Employee: Handle complaints, Client: Submit complaints
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || 'none'}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Department</SelectItem>
                              {departments.map((department) => (
                                <SelectItem key={department._id} value={department._id}>
                                  {department.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Required for employees and managers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={userForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Active User
                          </FormLabel>
                          <FormDescription>
                            Inactive users cannot log in to the system
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date(user.updatedAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" asChild>
                        <Link href="/admin/users">Cancel</Link>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Set a new password for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      rules={{
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      rules={{
                        required: 'Please confirm the password',
                        validate: (value) => {
                          const password = passwordForm.getValues('password');
                          return value === password || 'Passwords do not match';
                        }
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc list-inside space-y-1">
                            <li>The user will need to use this new password to log in</li>
                            <li>Consider informing the user about the password change</li>
                            <li>Strong passwords are recommended for security</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => passwordForm.reset()}
                      disabled={changingPassword}
                    >
                      Clear Form
                    </Button>
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
