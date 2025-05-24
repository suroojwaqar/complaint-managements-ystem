'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Mail, 
  Calendar, 
  FileText, 
  UserCheck, 
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  Building,
  Tag,
  Monitor,
  MessageSquare,
  Settings,
  Eye,
  Edit3,
  Activity,
  AlertTriangleIcon,
  ChevronRightIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";

interface Complaint {
  _id: string;
  title: string;
  description: string;
  status: 'New' | 'Assigned' | 'In Progress' | 'Completed' | 'Done' | 'Closed';
  clientId: {
    _id: string;
    name: string;
    email: string;
  };
  currentAssigneeId: {
    _id: string;
    name: string;
    email: string;
  };
  firstAssigneeId: {
    _id: string;
    name: string;
    email: string;
  };
  department: {
    _id: string;
    name: string;
  };
  natureType?: {
    _id: string;
    name: string;
    description: string;
  };
  errorType: string;
  errorScreen: string;
  remark?: string;
  attachments: any[];
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: {
    _id: string;
    name: string;
  };
}

interface HistoryEntry {
  _id: string;
  status: string;
  assignedFrom?: {
    name: string;
  };
  assignedTo?: {
    name: string;
  };
  notes: string;
  timestamp: string;
}

export default function ManagerComplaintDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [remarks, setRemarks] = useState('');

  const statusOptions = [
    { value: 'New', label: 'New', color: 'bg-blue-500' },
    { value: 'Assigned', label: 'Assigned', color: 'bg-yellow-500' },
    { value: 'In Progress', label: 'In Progress', color: 'bg-purple-500' },
    { value: 'Completed', label: 'Completed', color: 'bg-green-500' },
    { value: 'Done', label: 'Done', color: 'bg-emerald-600' },
    { value: 'Closed', label: 'Closed', color: 'bg-gray-500' },
  ];

  useEffect(() => {
    if (params.id) {
      fetchComplaint();
      fetchTeamMembers();
    }
  }, [params.id, retryCount]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/complaints/${params.id}`);
      const responseText = await response.text();
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        const complaintData = data.complaint || data;
        setComplaint(complaintData);
        setHistory(data.history || []);
        setNewStatus(complaintData.status);
        setNewAssignee(complaintData.currentAssigneeId?._id || '');
      } else {
        let errorMessage = 'Failed to load complaint';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;

          if (response.status === 404) errorMessage = 'Complaint not found';
          if (response.status === 403) errorMessage = 'Permission denied';
          if (response.status === 401) errorMessage = 'Please log in';
        } catch (e) { }

        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/users/team');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleStatusUpdate = async () => {
    if (!complaint || !newStatus) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/complaints/${complaint._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          notes: remarks || undefined
        }),
      });

      if (response.ok) {
        await fetchComplaint(); // Refresh complaint data
        setRemarks('');
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error updating complaint status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignmentUpdate = async () => {
    if (!complaint || !newAssignee) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/complaints/${complaint._id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: newAssignee,
          notes: remarks || undefined
        }),
      });

      if (response.ok) {
        await fetchComplaint(); // Refresh complaint data
        setRemarks('');
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to assign complaint');
      }
    } catch (error) {
      console.error('Error assigning complaint:', error);
      setError('Error assigning complaint');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'New': return 'secondary';
      case 'Assigned': return 'outline';
      case 'In Progress': return 'default';
      case 'Completed': return 'completed';
      case 'Done': return 'done';
      case 'Closed': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl space-y-8">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex space-x-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error Loading Complaint</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-4 flex space-x-3">
                <Button onClick={handleRetry}>Try Again</Button>
                <Button asChild variant="outline">
                  <Link href="/manager/complaints">Back to Complaints</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Alert>
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Complaint Not Found</AlertTitle>
            <AlertDescription>
              The complaint you're looking for could not be found.
              <Button asChild className="mt-4">
                <Link href="/manager/complaints">Back to Complaints</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/manager/complaints">Manager Complaints</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRightIcon className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink>Complaint Details</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <Button asChild variant="ghost" size="icon" className="mr-2">
                <Link href="/manager/complaints">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-tight">{complaint.title}</h1>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={getStatusVariant(complaint.status)}>
                    {complaint.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    #{complaint._id.slice(-6)}
                  </span>
                  {complaint.natureType && (
                    <Badge variant="outline" className="text-purple-700">
                      {complaint.natureType.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details */}
            <Card>
              <CardHeader>
                <CardTitle>Complaint Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1 whitespace-pre-wrap">{complaint.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Error Type</p>
                    <p className="mt-1">{complaint.errorType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Error Screen/Location</p>
                    <p className="mt-1">{complaint.errorScreen}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="mt-1 font-medium">{complaint.clientId?.name || 'Unknown Client'}</p>
                    <p className="text-sm text-muted-foreground">{complaint.clientId?.email || 'No email'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="mt-1 font-medium">{complaint.department?.name || 'Unknown Department'}</p>
                  </div>
                </div>

                {complaint.natureType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nature Type</p>
                    <p className="mt-1">{complaint.natureType.name}</p>
                    {complaint.natureType.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {complaint.natureType.description}
                      </p>
                    )}
                  </div>
                )}

                {complaint.remark && (
                  <div>
                    <p className="text-sm text-muted-foreground">Additional Remarks</p>
                    <p className="mt-1 whitespace-pre-wrap">{complaint.remark}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle>Complaint History</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No history available.</p>
                ) : (
                  <div className="space-y-6">
                    {history.map((entry) => (
                      <div key={entry._id} className="relative pl-6 pb-6 border-l-2 border-muted last:border-0 last:pb-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(entry.status)}>
                              {entry.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(entry.timestamp)}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm mt-1">{entry.notes}</p>
                          )}
                          {entry.assignedTo && entry.assignedFrom && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Assigned from {entry.assignedFrom.name} to {entry.assignedTo.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <p className="font-medium">{complaint.currentAssigneeId?.name || 'Unassigned'}</p>
                    <p className="text-sm text-muted-foreground">
                      {complaint.currentAssigneeId?.email || 'No email'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(complaint.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(complaint.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Management Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Management Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="status" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="status">Status</TabsTrigger>
                    <TabsTrigger value="assign">Assign</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="status" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Update Status
                      </label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Notes
                      </label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add notes about the status change..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleStatusUpdate} 
                      disabled={!newStatus || newStatus === complaint.status || updating}
                      className="w-full"
                    >
                      {updating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Update Status
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="assign" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Reassign To
                      </label>
                      <Select value={newAssignee} onValueChange={setNewAssignee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member._id} value={member._id}>
                              {member.name} - {member.department?.name || 'No Dept'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Assignment Notes
                      </label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add notes about the assignment..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={handleAssignmentUpdate} 
                      disabled={!newAssignee || updating}
                      className="w-full"
                    >
                      {updating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Assign Complaint
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}