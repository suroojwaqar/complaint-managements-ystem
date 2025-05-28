'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

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

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'New', label: 'New' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Done', label: 'Done' },
  { value: 'Closed', label: 'Closed' },
];

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

export default function ManagerComplaintsPage() {
  const { data: session } = useSession();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    fetchComplaints();
    fetchTeamMembers();
  }, [statusFilter]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/users/team');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      } else {
        console.error('Failed to fetch team members');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/complaints?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Error loading complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchComplaints(); // Refresh the list
        setSelectedComplaint(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating complaint status');
    }
  };

  const handleAssignComplaint = async (complaintId: string, assigneeId: string) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigneeId }),
      });

      if (response.ok) {
        fetchComplaints(); // Refresh the list
        setSelectedComplaint(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to assign complaint');
      }
    } catch (error) {
      console.error('Error assigning complaint:', error);
      alert('Error assigning complaint');
    }
  };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.clientId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.errorType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Assigned': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
      'Done': 'bg-green-200 text-green-900',
      'Closed': 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Department Complaints</h1>
              <p className="text-gray-600">
                Manage complaints for your department | {session?.user?.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/manager/complaints/create-on-behalf'}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create on Behalf
              </button>
              <button
                onClick={() => window.location.href = '/manager/dashboard'}
                className="px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchComplaints}
              className="mt-2 text-red-800 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{complaints.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {complaints.filter(c => c.status === 'New').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AdjustmentsHorizontalIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {complaints.filter(c => c.status === 'In Progress').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {complaints.filter(c => c.status === 'Completed' || c.status === 'Done' || c.status === 'Closed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No complaints found.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {complaint.errorType} - {complaint.errorScreen}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{complaint.clientId.name}</div>
                      <div className="text-sm text-gray-500">{complaint.clientId.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{complaint.currentAssigneeId.name}</div>
                      <div className="text-sm text-gray-500">{complaint.currentAssigneeId.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(complaint.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/manager/complaints/${complaint._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Quick Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complaint Management Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Complaint: {selectedComplaint.title}
                </h3>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-600">{selectedComplaint.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.slice(1).map(status => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusUpdate(selectedComplaint._id, status.value)}
                        disabled={selectedComplaint.status === status.value}
                        className={`px-3 py-2 text-sm rounded-md border ${
                          selectedComplaint.status === status.value
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Team Member
                  </label>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Current assignee: <span className="font-medium">{selectedComplaint.currentAssigneeId.name}</span>
                    </p>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== selectedComplaint.currentAssigneeId._id) {
                          handleAssignComplaint(selectedComplaint._id, e.target.value);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Select team member to reassign...</option>
                      
                      {/* Group by department */}
                      {/* Own team members */}
                      {teamMembers
                        .filter(member => 
                          member._id !== selectedComplaint.currentAssigneeId._id &&
                          member.role === 'employee' &&
                          member.department._id === session?.user?.department
                        )
                        .length > 0 && (
                        <>
                          <option disabled className="font-medium">--- My Team ---</option>
                          {teamMembers
                            .filter(member => 
                              member._id !== selectedComplaint.currentAssigneeId._id &&
                              member.role === 'employee' &&
                              member.department._id === session?.user?.department
                            )
                            .map(member => (
                              <option key={member._id} value={member._id}>
                                {member.name} - {member.email}
                              </option>
                            ))
                          }
                        </>
                      )}
                      
                      {/* Other department managers */}
                      {teamMembers
                        .filter(member => 
                          member._id !== selectedComplaint.currentAssigneeId._id &&
                          member.role === 'manager' &&
                          member.department._id !== session?.user?.department
                        )
                        .length > 0 && (
                        <>
                          <option disabled className="font-medium">--- Other Department Managers ---</option>
                          {teamMembers
                            .filter(member => 
                              member._id !== selectedComplaint.currentAssigneeId._id &&
                              member.role === 'manager' &&
                              member.department._id !== session?.user?.department
                            )
                            .map(member => (
                              <option key={member._id} value={member._id}>
                                {member.name} ({member.department.name}) - {member.email}
                              </option>
                            ))
                          }
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}