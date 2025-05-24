'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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

export default function ComplaintDetailPage() {
  const params = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchComplaint();
    }
  }, [params.id, retryCount]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching complaint:', params.id);
      
      const response = await fetch(`/api/complaints/${params.id}`);
      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('Parsed data:', data);
        
        setComplaint(data.complaint);
        setHistory(data.history || []);
        setError('');
      } else {
        let errorMessage = 'Failed to load complaint';
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
          
          // Show more specific error messages
          if (response.status === 404) {
            errorMessage = 'Complaint not found';
          } else if (response.status === 403) {
            errorMessage = 'You do not have permission to view this complaint';
          } else if (response.status === 401) {
            errorMessage = 'Please log in to view this complaint';
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        setError(errorMessage);
      }
    } catch (networkError) {
      console.error('Network error:', networkError);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'New': 'badge-new',
      'Assigned': 'badge-assigned',
      'In Progress': 'badge-in-progress',
      'Completed': 'badge-completed',
      'Done': 'badge-done',
      'Closed': 'badge-closed'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge-new';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading complaint details...</p>
          <p className="mt-2 text-sm text-gray-500">Complaint ID: {params.id}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Complaint</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-6">Complaint ID: {params.id}</p>
            <div className="flex justify-center space-x-4">
              <button onClick={handleRetry} className="btn-primary">
                Try Again
              </button>
              <Link href="/client/complaints" className="btn-secondary">
                Back to Complaints
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Complaint Not Found</h3>
            <p className="text-gray-600 mb-4">The complaint you're looking for could not be found.</p>
            <Link href="/client/complaints" className="btn-primary">
              Back to Complaints
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav className="text-sm">
              <Link href="/client/complaints" className="text-gray-500 hover:text-gray-700">
                My Complaints
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">Complaint Details</span>
            </nav>
            <div className="flex items-center mt-4">
              <Link
                href="/client/complaints"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{complaint.title}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={getStatusBadge(complaint.status)}>
                    {complaint.status}
                  </span>
                  <span className="text-gray-500">#{complaint._id.slice(-6)}</span>
                  {complaint.natureType && (
                    <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {complaint.natureType.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Complaint Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Description</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Error Type</label>
                    <p className="text-gray-700">{complaint.errorType}</p>
                  </div>
                  <div>
                    <label className="form-label">Error Screen/Location</label>
                    <p className="text-gray-700">{complaint.errorScreen}</p>
                  </div>
                </div>

                {complaint.natureType && (
                  <div>
                    <label className="form-label">Nature Type</label>
                    <p className="text-gray-700">{complaint.natureType.name}</p>
                    {complaint.natureType.description && (
                      <p className="text-sm text-gray-500 mt-1">{complaint.natureType.description}</p>
                    )}
                  </div>
                )}

                {complaint.remark && (
                  <div>
                    <label className="form-label">Additional Remarks</label>
                    <p className="text-gray-700 whitespace-pre-wrap">{complaint.remark}</p>
                  </div>
                )}
                
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div>
                    <label className="form-label">Attachments</label>
                    <div className="space-y-2">
                      {complaint.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(1)} KB • {attachment.mimeType}
                            </p>
                          </div>
                          {attachment.url && (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 text-sm"
                            >
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Complaint History</h2>
              {history.length === 0 ? (
                <p className="text-gray-500">No history available.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry._id} className="border-l-2 border-gray-200 pl-4 relative">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full"></div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={getStatusBadge(entry.status)}>
                          {entry.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-gray-700 text-sm">{entry.notes}</p>
                      )}
                      {entry.assignedTo && entry.assignedFrom && (
                        <p className="text-gray-500 text-sm">
                          Assigned from {entry.assignedFrom.name} to {entry.assignedTo.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{complaint.department.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="font-medium">{complaint.currentAssigneeId.name}</p>
                    <p className="text-xs text-gray-500">{complaint.currentAssigneeId.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(complaint.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(complaint.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Guide */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status Guide</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="badge-new">New</span>
                  <span className="text-gray-500">Just submitted</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="badge-assigned">Assigned</span>
                  <span className="text-gray-500">Being reviewed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="badge-in-progress">In Progress</span>
                  <span className="text-gray-500">Being worked on</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="badge-completed">Completed</span>
                  <span className="text-gray-500">Solution found</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="badge-done">Done</span>
                  <span className="text-gray-500">Approved by manager</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="badge-closed">Closed</span>
                  <span className="text-gray-500">Fully resolved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
