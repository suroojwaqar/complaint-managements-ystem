'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  FileTextIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  EditIcon,
  HistoryIcon
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AssignDepartmentDialog from '@/components/admin/AssignDepartmentDialog';
import EnhancedCommentSystem from '@/components/comments/EnhancedCommentSystem';

interface Complaint {
  _id: string;
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
  status: string;
  remark?: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
  };
  department: {
    _id: string;
    name: string;
  };
  natureType: {
    _id: string;
    name: string;
    description: string;
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
  attachments: any[];
  createdAt: string;
  updatedAt: string;
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

export default function AdminComplaintDetailPage() {
  const params = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchComplaint();
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
        setComplaint(data.complaint);
        setHistory(data.history || []);
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
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!complaint) return;

    try {
      const response = await fetch(`/api/complaints/${complaint._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh the complaint data
        fetchComplaint();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      setError('Network error while updating status');
    }
  };

  const handleAssignmentSuccess = () => {
    setShowAssignDialog(false);
    fetchComplaint(); // Refresh data
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

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'New': return 'Assigned';
      case 'Assigned': return 'In Progress';
      case 'In Progress': return 'Completed';
      case 'Completed': return 'Done';
      case 'Done': return 'Closed';
      default: return null;
    }
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
                  <Link href="/admin/complaints">Back to Complaints</Link>
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
                <Link href="/admin/complaints">Back to Complaints</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus(complaint.status);

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin/complaints">All Complaints</Link>
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
                <Link href="/admin/complaints">
                  <ArrowLeftIcon className="h-5 w-5" />
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

            {/* Admin Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAssignDialog(true)}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Reassign
              </Button>
              {nextStatus && (
                <Button onClick={() => handleStatusUpdate(nextStatus)}>
                  Move to {nextStatus}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
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
                    <p className="mt-1 font-medium">{complaint.clientId.name}</p>
                    <p className="text-sm text-muted-foreground">{complaint.clientId.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">First Assigned To</p>
                    <p className="mt-1 font-medium">{complaint.firstAssigneeId.name}</p>
                    <p className="text-sm text-muted-foreground">{complaint.firstAssigneeId.email}</p>
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

              {complaint.attachments && complaint.attachments.length > 0 && (
                <>
                  <Separator />
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {complaint.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center p-3 hover:bg-muted/50 rounded-lg transition-colors">
                        <FileTextIcon className="h-5 w-5 text-muted-foreground mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.originalName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {(attachment.size / 1024).toFixed(1)} KB • {attachment.mimeType}
                          </p>
                        </div>
                        {attachment.url && (
                          <Button asChild variant="ghost" size="sm">
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </>
              )}
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HistoryIcon className="h-5 w-5 mr-2" />
                  Complaint History
                </CardTitle>
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

            {/* Comments System */}
            <EnhancedCommentSystem complaintId={complaint._id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <FileTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{complaint.department.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Currently Assigned To</p>
                    <p className="font-medium">{complaint.currentAssigneeId.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {complaint.currentAssigneeId.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(complaint.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-muted p-2 rounded-lg">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(complaint.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Reassign Department/User
                </Button>
                
                {nextStatus && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => handleStatusUpdate(nextStatus)}
                  >
                    Move to {nextStatus}
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/admin/complaints`}>
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to All Complaints
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Status Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Status Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">New</Badge>
                  <span className="text-sm text-muted-foreground">Just submitted</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Assigned</Badge>
                  <span className="text-sm text-muted-foreground">Assigned to team</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge>In Progress</Badge>
                  <span className="text-sm text-muted-foreground">Being worked on</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Completed</Badge>
                  <span className="text-sm text-muted-foreground">Solution found</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Done</Badge>
                  <span className="text-sm text-muted-foreground">Approved by manager</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Closed</Badge>
                  <span className="text-sm text-muted-foreground">Fully resolved</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assign Department Dialog */}
      {showAssignDialog && complaint && (
        <AssignDepartmentDialog
          isOpen={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          complaintId={complaint._id}
          currentDepartment={complaint.department._id}
          currentAssignee={complaint.currentAssigneeId._id}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
}