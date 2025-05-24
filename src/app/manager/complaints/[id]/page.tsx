'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { notFound, useRouter } from 'next/navigation';
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
  Activity
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function ComplaintDetailsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
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
  }, [params.id]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/complaints/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        // API returns { complaint, history }, extract complaint
        const complaintData = data.complaint || data;
        setComplaint(complaintData);
        setNewStatus(complaintData.status);
        setNewAssignee(complaintData.currentAssigneeId?._id || '');
      } else if (response.status === 404) {
        notFound();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch complaint');
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      setError('Error loading complaint');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/users/team');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!complaint || !newStatus) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/complaints/${complaint._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          remarks: remarks || undefined
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
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assigneeId: newAssignee,
          remarks: remarks || undefined
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

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${statusConfig?.color || 'bg-gray-500'}`}></div>
        <Badge variant="secondary" className="text-sm font-medium">
          {status}
        </Badge>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaint Not Found</h2>
            <p className="text-gray-600 mb-6">The complaint you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button asChild className="w-full">
              <Link href="/manager/complaints">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Complaints
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Additional safety check for populated fields
  if (!complaint.clientId || !complaint.currentAssigneeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Complaint Details</h2>
            <p className="text-gray-600 mb-6">Please wait while we load the complete complaint information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild className="hover:bg-gray-100">
                <Link href="/manager/complaints">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900 truncate max-w-md">{complaint.title}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">ID: {complaint._id.slice(-8)}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{getTimeSince(complaint.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(complaint.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Overview */}
            <Card className="shadow-sm border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Complaint Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <p className="text-gray-900 leading-relaxed">{complaint.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-medium text-gray-700">Error Type</h3>
                    </div>
                    <p className="text-gray-900 font-medium">{complaint.errorType}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Monitor className="h-4 w-4 text-purple-600" />
                      <h3 className="text-sm font-medium text-gray-700">Screen</h3>
                    </div>
                    <p className="text-gray-900 font-medium">{complaint.errorScreen}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-medium text-gray-700">Department</h3>
                    </div>
                    <p className="text-gray-900 font-medium">{complaint.department?.name || 'Unknown'}</p>
                  </div>
                </div>

                {complaint.natureType && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-yellow-600" />
                      <h3 className="text-sm font-medium text-gray-700">Nature Type</h3>
                    </div>
                    <p className="text-gray-900 font-medium">{complaint.natureType?.name || 'Not specified'}</p>
                    <p className="text-gray-600 text-sm mt-1">{complaint.natureType?.description || 'No description available'}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created</p>
                      <p className="text-gray-900">{formatDate(complaint.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p className="text-gray-900">{formatDate(complaint.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* People Involved */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <Card className="shadow-sm border-0 bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span>Client</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {complaint.clientId?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">{complaint.clientId?.name || 'Unknown Client'}</p>
                      <div className="flex items-center space-x-2 text-gray-600 mt-1">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{complaint.clientId?.email || 'No email available'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Assignment */}
              <Card className="shadow-sm border-0 bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <span>Assigned To</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {complaint.currentAssigneeId?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">{complaint.currentAssigneeId?.name || 'Unassigned'}</p>
                      <div className="flex items-center space-x-2 text-gray-600 mt-1">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{complaint.currentAssigneeId?.email || 'No email available'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Management Sidebar */}
          <div className="space-y-6">
            {/* Management Actions */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-700" />
                  <span>Management Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="status" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                    <TabsTrigger value="status" className="data-[state=active]:bg-white">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Status
                    </TabsTrigger>
                    <TabsTrigger value="assign" className="data-[state=active]:bg-white">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Assign
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="status" className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Status
                      </label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                                <span>{status.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status Update Notes
                      </label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add notes about the status change..."
                        rows={3}
                        className="bg-white"
                      />
                    </div>

                    <Button 
                      onClick={handleStatusUpdate} 
                      disabled={!newStatus || newStatus === complaint.status || updating}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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

                  <TabsContent value="assign" className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reassign To
                      </label>
                      <Select value={newAssignee} onValueChange={setNewAssignee}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member._id} value={member._id}>
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium">{member.name}</div>
                                  <div className="text-xs text-gray-500">{member.department.name}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Notes
                      </label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add notes about the assignment..."
                        rows={3}
                        className="bg-white"
                      />
                    </div>

                    <Button 
                      onClick={handleAssignmentUpdate} 
                      disabled={!newAssignee || updating}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
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

            {/* Quick Actions */}
            <Card className="shadow-sm border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-gray-700" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-white hover:bg-gray-50" asChild>
                  <Link href={`/manager/complaints`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    View All Complaints
                  </Link>
                </Button>
                
                {complaint.status !== 'Closed' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    onClick={() => {
                      setNewStatus('Closed');
                      setRemarks('Complaint resolved and closed');
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Mark as Closed
                  </Button>
                )}

                {complaint.status === 'New' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    onClick={() => {
                      setNewStatus('In Progress');
                      setRemarks('Started working on this complaint');
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Start Working
                  </Button>
                )}

                {(complaint.status === 'In Progress' || complaint.status === 'Assigned') && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                    onClick={() => {
                      setNewStatus('Completed');
                      setRemarks('Work completed, awaiting review');
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
