'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Clock,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import CommentsSection from '@/components/CommentsSection';

interface Complaint {
  _id: string;
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
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
  department: {
    _id: string;
    name: string;
  };
  natureType?: {
    _id: string;
    name: string;
    description: string;
  };
  attachments: Array<{
    filename: string;
    originalName: string;
    url: string;
    uploadedAt: string;
    uploadedBy: {
      name: string;
    };
  }>;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

interface ComplaintHistory {
  _id: string;
  status: string;
  assignedFrom?: {
    name: string;
  };
  assignedTo?: {
    name: string;
  };
  notes?: string;
  timestamp: string;
}

type BadgeVariant = 'secondary' | 'default' | 'new' | 'done' | 'assigned' | 'completed' | 'closed' | 'outline' | 'destructive' | 'in-progress';

const getStatusVariant = (status: string): BadgeVariant => {
  const variantMap: Record<string, BadgeVariant> = {
    'New': 'new',
    'Assigned': 'assigned',
    'In Progress': 'in-progress',
    'Completed': 'completed',
    'Done': 'done',
    'Closed': 'closed'
  };
  return variantMap[status] || 'default';
};

const statusOptions = [
  { value: 'New', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'Assigned', label: 'Assigned', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'In Progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  { value: 'Completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
];

export default function EmployeeComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [remark, setRemark] = useState('');

  const complaintId = params.id as string;

  useEffect(() => {
    if (complaintId) {
      fetchComplaintDetails();
      fetchComplaintHistory();
    }
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/complaints/${complaintId}`);

      if (response.ok) {
        const data = await response.json();
        const complaintData = data.complaint || data;
        setComplaint(complaintData);
        setNewStatus(complaintData.status);
        setRemark(complaintData.remark || '');

        if (data.history && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      } else if (response.status === 404) {
        setError('Complaint not found');
      } else if (response.status === 403) {
        setError('You are not authorized to view this complaint');
      } else {
        setError('Failed to load complaint details');
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      setError('Error loading complaint details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintHistory = async () => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching complaint history:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === complaint?.status) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          remark: remark
        }),
      });

      if (response.ok) {
        await fetchComplaintDetails();
        await fetchComplaintHistory();
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, h:mm a');
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/employee/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 gap-6">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild>
          <Link href="/employee/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-muted-foreground">Complaint not found</p>
        <Button variant="link" asChild>
          <Link href="/employee/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Check authorization
  const isAuthorized = session?.user?.id === complaint?.currentAssigneeId?._id ||
    session?.user?.role === 'admin' ||
    (session?.user?.role === 'manager' && session?.user?.department === complaint?.department?._id);

  if (!isAuthorized) {
    return (
      <div className="container flex flex-col items-center justify-center py-16 gap-6">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You are not authorized to view this complaint.</p>
        <Button asChild>
          <Link href="/employee/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/employee/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{complaint.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getStatusVariant(complaint.status)}>
                {complaint.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                #{complaint._id.slice(-8)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Complaint Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm">{complaint.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Error Type</h3>
                    <p className="text-sm">{complaint.errorType || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Error Screen</h3>
                    <p className="text-sm">{complaint.errorScreen || 'N/A'}</p>
                  </div>
                </div>

                {complaint.natureType && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Nature of Complaint</h3>
                    <p className="text-sm font-medium mb-1">{complaint.natureType.name || 'N/A'}</p>
                    {complaint.natureType.description && (
                      <p className="text-sm text-muted-foreground">{complaint.natureType.description}</p>
                    )}
                  </div>
                )}

                {complaint.remark && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Employee Remarks</h3>
                    <p className="text-sm">{complaint.remark}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attachments
                    <span className="text-sm font-normal text-muted-foreground">
                      ({complaint.attachments.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {complaint.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{attachment.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {formatTime(attachment.uploadedAt)} by {attachment.uploadedBy.name}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Update */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Status: <Badge variant={getStatusVariant(complaint.status)} className="ml-2">
                      {complaint.status}
                    </Badge>
                  </label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Add Remarks (Optional)
                  </label>
                  <Textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Add any notes or updates about the complaint..."
                  />
                </div>

                <Button
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === complaint.status}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Update Status
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <CommentsSection 
              complaintId={complaint._id}
              userRole={session?.user?.role || 'employee'}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {complaint.clientId.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{complaint.clientId.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{complaint.clientId.email || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Department</h3>
                  <p className="text-sm">{complaint.department.name || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Assigned To</h3>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {complaint.currentAssigneeId.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{complaint.currentAssigneeId.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{complaint.currentAssigneeId.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
                  <p className="text-sm">{formatDate(complaint.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
                  <p className="text-sm">{formatDate(complaint.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* History */}
            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {history.map((entry) => (
                      <div key={entry._id} className="relative pb-6 last:pb-0">
                        <div className="absolute left-5 top-0 h-full w-px bg-border" aria-hidden="true" />
                        <div className="relative flex gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                Status changed to{' '}
                                <Badge variant={getStatusVariant(entry.status)}>
                                  {entry.status}
                                </Badge>
                              </p>
                              <time className="text-xs text-muted-foreground">
                                {formatTime(entry.timestamp)}
                              </time>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}