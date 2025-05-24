'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Building2,
    Users,
    User,
    Calendar,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    ClipboardList,
    Mail,
    BarChart3,
    AlertTriangle,
    Clock,
    ShieldCheck,
    Pencil
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/lib/toast';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    profileImage?: string;
}

interface Department {
    _id: string;
    name: string;
    description: string;
    managerId: User;
    defaultAssigneeId: User;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    memberCount?: number;
    statistics?: {
        totalComplaints?: number;
        resolvedComplaints?: number;
        pendingComplaints?: number;
        averageResolutionTime?: number;
    };
    members?: User[];
}

export default function DepartmentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deactivating, setDeactivating] = useState(false);

    const departmentId = params.id as string;

    useEffect(() => {
        fetchDepartmentDetails();
    }, [departmentId]);

    const fetchDepartmentDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/departments/${departmentId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch department details');
            }

            const data = await response.json();
            console.log('Department data received:', data);
            setDepartment(data);
        } catch (error: any) {
            console.error('Error fetching department details:', error);
            setError(error.message || 'Failed to load department details');
            toast.error(error.message || 'Error loading department details');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActivation = async () => {
        try {
            setDeactivating(true);
            const action = department?.isActive ? 'deactivate' : 'activate';
            toast.loading(`${action === 'deactivate' ? 'Deactivating' : 'Activating'} department...`);

            const response = await fetch(`/api/departments/${departmentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: !department?.isActive }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${action} department`);
            }

            await fetchDepartmentDetails();
            toast.success(`Department ${action === 'deactivate' ? 'deactivated' : 'activated'} successfully`);
        } catch (error: any) {
            console.error(`Error ${department?.isActive ? 'deactivating' : 'activating'} department:`, error);
            toast.error(error.message || `Error ${department?.isActive ? 'deactivating' : 'activating'} department`);
        } finally {
            setDeactivating(false);
        }
    };

    const handleDelete = async () => {
        try {
            toast.loading('Deleting department...');

            const response = await fetch(`/api/departments/${departmentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete department');
            }

            toast.success('Department deleted successfully');
            router.push('/admin/departments');
        } catch (error: any) {
            console.error('Error deleting department:', error);
            toast.error(error.message || 'Error deleting department');
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>

                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !department) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-red-100 p-3 mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Department Not Found</h2>
                <p className="text-gray-500 mb-6 text-center max-w-md">
                    {error || "We couldn't find the department you're looking for. It may have been deleted or you don't have permission to view it."}
                </p>
                <Button asChild>
                    <Link href="/admin/departments">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Departments
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
                        <Link href="/admin/departments">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{department.name}</h1>
                            <Badge variant={department.isActive ? "default" : "secondary"}>
                                {department.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Department ID: {department._id}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/departments/${departmentId}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Department
                        </Link>
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant={department.isActive ? "destructive" : "default"}>
                                {department.isActive ? (
                                    <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Activate
                                    </>
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {department.isActive ? "Deactivate this department?" : "Activate this department?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    {department.isActive
                                        ? "This department will be hidden from complaint forms and marked as inactive. Existing complaints will remain assigned but no new complaints can be routed to this department."
                                        : "This department will be available for complaint routing and will appear in complaint forms."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleToggleActivation}
                                    className={department.isActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}
                                >
                                    {deactivating ? "Processing..." : (department.isActive ? "Deactivate" : "Activate")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Department Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Department Overview */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Department Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {department.description ? (
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                                <p>{department.description}</p>
                            </div>
                        ) : (
                            <div className="bg-muted/30 p-4 rounded-md text-center">
                                <p className="text-muted-foreground text-sm">No description provided</p>
                            </div>
                        )}

                        <Separator />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Department Manager</h3>
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                                    <Avatar>
                                        <AvatarImage src={department.managerId.profileImage} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {department.managerId.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{department.managerId.name}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            <span>{department.managerId.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Default Assignee</h3>
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                                    <Avatar>
                                        <AvatarImage src={department.defaultAssigneeId.profileImage} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {department.defaultAssigneeId.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{department.defaultAssigneeId.name}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            <span>{department.defaultAssigneeId.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-3 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Created On</span>
                                </div>
                                <p className="font-medium">
                                    {new Date(department.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div className="p-3 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Last Updated</span>
                                </div>
                                <p className="font-medium">
                                    {new Date(department.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div className="p-3 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Users className="h-4 w-4" />
                                    <span>Team Size</span>
                                </div>
                                <p className="font-medium">
                                    {department.memberCount || (department.members?.length || 0) + 2} members
                                </p>
                            </div>

                            <div className="p-3 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Status</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {department.isActive ? (
                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                            <span>Active</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-gray-600 font-medium">
                                            <div className="h-2 w-2 rounded-full bg-gray-500" />
                                            <span>Inactive</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Department Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Performance Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Complaints</div>
                                <div className="text-xl font-bold text-blue-800 dark:text-blue-300">
                                    {department.statistics?.totalComplaints || 0}
                                </div>
                            </div>
                            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-green-800 dark:text-green-300">Resolved</div>
                                <div className="text-xl font-bold text-green-800 dark:text-green-300">
                                    {department.statistics?.resolvedComplaints || 0}
                                </div>
                            </div>
                            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{
                                        width: `${department.statistics?.totalComplaints ?
                                            (department.statistics.resolvedComplaints || 0) / department.statistics.totalComplaints * 100 : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-amber-800 dark:text-amber-300">Pending</div>
                                <div className="text-xl font-bold text-amber-800 dark:text-amber-300">
                                    {department.statistics?.pendingComplaints || 0}
                                </div>
                            </div>
                            <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                                <div
                                    className="bg-amber-600 h-2 rounded-full"
                                    style={{
                                        width: `${department.statistics?.totalComplaints ?
                                            (department.statistics.pendingComplaints || 0) / department.statistics.totalComplaints * 100 : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-100 dark:border-purple-900 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-purple-800 dark:text-purple-300">Avg. Resolution Time</div>
                                <div className="text-xl font-bold text-purple-800 dark:text-purple-300">
                                    {department.statistics?.averageResolutionTime || 0} days
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Members */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Members
                        </CardTitle>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/departments/${departmentId}/members`}>
                                Manage Team
                            </Link>
                        </Button>
                    </div>
                    <CardDescription>
                        All users assigned to this department
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {department.members && department.members.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Department Manager */}
                            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900">
                                <div className="flex items-center gap-3 mb-2">
                                    <Avatar>
                                        <AvatarImage src={department.managerId.profileImage} />
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {department.managerId.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{department.managerId.name}</p>
                                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                            Manager
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Mail className="h-3 w-3" />
                                        <span>{department.managerId.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Default Assignee */}
                            <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-900">
                                <div className="flex items-center gap-3 mb-2">
                                    <Avatar>
                                        <AvatarImage src={department.defaultAssigneeId.profileImage} />
                                        <AvatarFallback className="bg-green-100 text-green-600">
                                            {department.defaultAssigneeId.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{department.defaultAssigneeId.name}</p>
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                            Default Assignee
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Mail className="h-3 w-3" />
                                        <span>{department.defaultAssigneeId.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Other Team Members */}
                            {department.members.map(member => (
                                <div key={member._id} className="border rounded-lg p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Avatar>
                                            <AvatarImage src={member.profileImage} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <Badge variant="outline">
                                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1 mb-1">
                                            <Mail className="h-3 w-3" />
                                            <span>{member.email}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-muted/20 rounded-lg">
                            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-medium mb-1">No additional team members</h3>
                            <p className="text-muted-foreground mb-4">
                                This department only has a manager and default assignee.
                            </p>
                            <Button asChild size="sm">
                                <Link href={`/admin/departments/${departmentId}/members`}>
                                    Add Team Members
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="text-red-600 dark:text-red-400">
                    <CardTitle className="text-inherit flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-500 dark:text-red-400">
                        Actions here can't be easily reversed
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/50">
                        <div>
                            <h3 className="text-base font-medium text-red-800 dark:text-red-300 mb-1">Delete Department</h3>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                Permanently remove this department and reassign all associated complaints.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete Department</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the department
                                        and all of its data. All complaints will need to be manually reassigned to other departments.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}