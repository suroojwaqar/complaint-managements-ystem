'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  User, 
  Shield, 
  Building, 
  Mail, 
  Check,
  AlertCircle,
  Info,
  UserPlus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/lib/toast';

// Import design system components
import {
  PageContainer,
  PageHeader,
  ContentCard
} from '@/components/layout/pages';

interface Department {
  _id: string;
  name: string;
  description: string;
}

interface PasswordStrength {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    // Check password strength
    const password = formData.password;
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    });
  }, [formData.password]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats
        const depts = data.departments || data.data || data;
        setDepartments(Array.isArray(depts) ? depts : []);
      } else {
        console.error('Failed to fetch departments');
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear password confirmation error when user types
    if (field === 'confirmPassword' || field === 'password') {
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    const requiresDepartment = formData.role === 'manager' || formData.role === 'employee';
    if (requiresDepartment && !formData.department) {
      setError('Please select a department for this role');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.department && { department: formData.department }),
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast.success('User created successfully');
        router.push('/admin/users');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Error creating user');
      toast.error('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  const requiresDepartment = formData.role === 'manager' || formData.role === 'employee';
  const canSelectDepartment = formData.role === 'manager' || formData.role === 'employee';

  const getRoleInfo = (role: string) => {
    const roleInfo = {
      admin: {
        name: 'Administrator',
        permissions: [
          'Full system access and configuration',
          'User and department management',
          'System-wide complaint oversight',
          'Analytics and reporting'
        ],
        color: 'bg-red-50 border-red-200 text-red-800'
      },
      manager: {
        name: 'Manager',
        permissions: [
          'Department complaint management',
          'Team member assignment',
          'Cross-department escalation',
          'Performance monitoring'
        ],
        color: 'bg-blue-50 border-blue-200 text-blue-800'
      },
      employee: {
        name: 'Employee',
        permissions: [
          'Handle assigned complaints',
          'Update complaint status',
          'Escalate to managers',
          'Client communication'
        ],
        color: 'bg-green-50 border-green-200 text-green-800'
      },
      client: {
        name: 'Client',
        permissions: [
          'Submit new complaints',
          'Track complaint status',
          'View complaint history',
          'Receive notifications'
        ],
        color: 'bg-purple-50 border-purple-200 text-purple-800'
      }
    };
    return roleInfo[role as keyof typeof roleInfo];
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  return (
    <PageContainer className="animate-fade-in max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Create New User"
        description="Add a new user to the complaint management system"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        }
      />

      {/* Form Content */}
      <ContentCard>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Personal Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@company.com"
                    className="pl-9"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Security & Access Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Security & Access</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter secure password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Password requirements:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'length', label: '8+ characters' },
                        { key: 'uppercase', label: 'Uppercase letter' },
                        { key: 'lowercase', label: 'Lowercase letter' },
                        { key: 'number', label: 'Number' }
                      ].map(({ key, label }) => (
                        <div
                          key={key}
                          className={`flex items-center gap-2 text-xs ${
                            passwordStrength[key as keyof PasswordStrength]
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <Check
                            className={`h-3 w-3 ${
                              passwordStrength[key as keyof PasswordStrength]
                                ? 'text-green-600'
                                : 'text-muted-foreground'
                            }`}
                          />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className={
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-destructive focus-visible:ring-destructive'
                        : ''
                    }
                    required
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
                
                {formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-xs">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Role & Department Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Role & Department</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role">
                  User Role <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator - Full system access</SelectItem>
                    <SelectItem value="manager">Manager - Department oversight</SelectItem>
                    <SelectItem value="employee">Employee - Handle complaints</SelectItem>
                    <SelectItem value="client">Client - Submit complaints</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">
                  Department {requiresDepartment && <span className="text-destructive">*</span>}
                </Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => handleChange('department', value)}
                  disabled={!canSelectDepartment}
                >
                  <SelectTrigger className={!canSelectDepartment ? 'opacity-50' : ''}>
                    <SelectValue 
                      placeholder={
                        canSelectDepartment 
                          ? 'Select a department' 
                          : 'Not applicable for this role'
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {canSelectDepartment && departments.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No departments available. Create one first or assign later.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          {/* Role Information */}
          {formData.role && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={getRoleInfo(formData.role)?.color}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {getRoleInfo(formData.role)?.name} Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs space-y-1">
                    {getRoleInfo(formData.role)?.permissions.map((permission, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-current">•</span>
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Setup Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>User will receive login credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Account is active by default</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Password can be changed on first login</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Email notifications enabled</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" asChild>
              <Link href="/admin/users">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </ContentCard>
    </PageContainer>
  );
}