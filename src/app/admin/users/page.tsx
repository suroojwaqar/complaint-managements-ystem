'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus,
  Pencil,
  Trash,
  Trash2,
  User,
  Search,
  Filter,
  Download,
  Upload,
  Loader2,
  UserCheck,
  UserX,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      // Fetch all users including inactive ones for admin management
      const response = await fetch('/api/users?includeInactive=true');
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        // Handle both wrapped ({ users: [...] }) and direct array responses
        const usersArray = data.users || data;
        console.log('Users array:', usersArray);
        // Ensure data is an array
        setUsers(Array.isArray(usersArray) ? usersArray : []);
      } else {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        toast.error('Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Error loading users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
    // Clear selections when filters change
    setSelectedUsers(new Set());
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableUsers = filteredUsers
        .filter(user => user._id !== session?.user?.id)
        .map(user => user._id);
      setSelectedUsers(new Set(selectableUsers));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSingleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const loadingToast = toast.loading('Deleting user permanently...');
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      toast.dismiss();

      if (response.ok) {
        const data = await response.json();
        await fetchUsers();
        toast.success(data.message || 'User deleted successfully');
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Network error - please try again');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          userIds: Array.from(selectedUsers)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        
        // Refresh the list and clear selections
        await fetchUsers();
        setSelectedUsers(new Set());
        setBulkDeleteDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete users');
      }
    } catch (error) {
      toast.error('Error performing bulk delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate',
          userIds: Array.from(selectedUsers)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        
        // Refresh the list and clear selections
        await fetchUsers();
        setSelectedUsers(new Set());
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to activate users');
      }
    } catch (error) {
      toast.error('Error performing bulk activate');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedUsers.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export',
          userIds: Array.from(selectedUsers)
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Users exported successfully');
        setSelectedUsers(new Set());
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to export users');
      }
    } catch (error) {
      toast.error('Error exporting users');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      case 'employee':
        return 'secondary';
      case 'client':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const selectableUsers = Array.isArray(filteredUsers) ? filteredUsers.filter(user => user._id !== session?.user?.id) : [];
  const allSelectableSelected = selectableUsers.length > 0 && 
    selectableUsers.every(user => selectedUsers.has(user._id));
  const someSelected = selectedUsers.size > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {someSelected && (
            <div className="flex items-center gap-2">
              {/* Bulk Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isDeleting}>
                    <MoreHorizontal className="h-4 w-4" />
                    Bulk Actions ({selectedUsers.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleBulkActivate} disabled={isDeleting}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkExport} disabled={isDeleting}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                        disabled={isDeleting}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Delete Selected Permanently
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Users Permanently</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete {selectedUsers.size} selected user(s)? 
                          This action cannot be undone and will completely remove all selected users from the database.
                          <br /><br />
                          <strong>All associated data will be lost forever.</strong>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleBulkDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Permanently'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <Button asChild>
            <Link href="/admin/users/create">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter users by search term, role, or status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-sm">
                Total: {Array.isArray(filteredUsers) ? filteredUsers.length : 0} users
              </Badge>
              {someSelected && (
                <Badge variant="secondary" className="text-sm">
                  Selected: {selectedUsers.size}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {!Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || (roleFilter !== 'all') || (statusFilter !== 'all')
                ? 'No users match your current filters.' 
                : 'Get started by creating your first user.'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
              <Button asChild>
                <Link href="/admin/users/create">Create User</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              A list of all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelectableSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={selectableUsers.length === 0}
                      aria-label="Select all users"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isCurrentUser = user._id === session?.user?.id;
                  const isSelected = selectedUsers.has(user._id);
                  
                  return (
                    <TableRow key={user._id} className={isSelected ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectUser(user._id, checked as boolean)}
                          disabled={isCurrentUser}
                          aria-label={`Select ${user.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.name}
                              {isCurrentUser && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.department?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'completed' : 'closed'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/users/${user._id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {!isCurrentUser && (
                            <AlertDialog open={deleteDialogOpen && userToDelete === user._id} onOpenChange={(open) => {
                              setDeleteDialogOpen(open);
                              if (!open) setUserToDelete(null);
                            }}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setUserToDelete(user._id)}
                                  disabled={isDeleting}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User Permanently</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete <strong>{user.name}</strong>? 
                                    This action cannot be undone and will completely remove the user from the database.
                                    <br /><br />
                                    <strong>All associated data will be lost forever.</strong>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleSingleDelete(user._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {isDeleting ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      'Delete Permanently'
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
