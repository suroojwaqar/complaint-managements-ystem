'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Plus, 
  Pencil, 
  Trash,
  Search,
  Tag,
  AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { toast } from '@/lib/toast';

interface NatureType {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NatureTypeForm {
  name: string;
  description: string;
  isActive: boolean;
}

export default function NatureTypesPage() {
  const { data: session } = useSession();
  const [natureTypes, setNatureTypes] = useState<NatureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<NatureType | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const form = useForm<NatureTypeForm>({
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    fetchNatureTypes();
  }, []);

  const fetchNatureTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/nature-types');
      if (response.ok) {
        const data = await response.json();
        // For admin, fetch all nature types including inactive ones
        if (session?.user?.role === 'admin') {
          const adminResponse = await fetch('/api/nature-types?includeInactive=true');
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            setNatureTypes(adminData.natureTypes || []);
          } else {
            setNatureTypes(data.natureTypes || []);
          }
        } else {
          setNatureTypes(data.natureTypes || []);
        }
      } else {
        toast.error('Failed to fetch nature types');
      }
    } catch (error) {
      console.error('Error fetching nature types:', error);
      toast.error('Error loading nature types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: NatureTypeForm) => {
    setFormLoading(true);

    try {
      const url = editingType 
        ? `/api/nature-types/${editingType._id}`
        : '/api/nature-types';
      
      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        setEditingType(null);
        form.reset();
        fetchNatureTypes();
        toast.success(editingType ? 'Nature type updated successfully' : 'Nature type created successfully');
      } else {
        toast.error(responseData.error || 'An error occurred');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (natureType: NatureType) => {
    setEditingType(natureType);
    form.reset({
      name: natureType.name,
      description: natureType.description,
      isActive: natureType.isActive,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/nature-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNatureTypes();
        toast.success('Nature type deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete nature type');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingType(null);
    form.reset({
      name: '',
      description: '',
      isActive: true,
    });
  };

  const filteredNatureTypes = natureTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Nature Types Management</h1>
          <p className="text-muted-foreground">
            Manage complaint nature types and categories
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Nature Type
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-muted-foreground" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Nature Types</p>
                <p className="text-2xl font-bold">{natureTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Badge variant="completed" className="h-8 w-8 rounded-full flex items-center justify-center">
                ✓
              </Badge>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Types</p>
                <p className="text-2xl font-bold">{natureTypes.filter(t => t.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Badge variant="closed" className="h-8 w-8 rounded-full flex items-center justify-center">
                ✕
              </Badge>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Inactive Types</p>
                <p className="text-2xl font-bold">{natureTypes.filter(t => !t.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find nature types by name or description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search nature types..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Nature Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Nature Types</CardTitle>
          <CardDescription>
            A list of all complaint nature types in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNatureTypes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No nature types found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No nature types found matching your search.' : 'Get started by creating your first nature type.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  Add Nature Type
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNatureTypes.map((type) => (
                  <TableRow key={type._id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-muted-foreground">
                        {type.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? 'completed' : 'closed'}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {type.createdBy.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(type.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the nature type "{type.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(type._id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Nature Type' : 'Create New Nature Type'}
            </DialogTitle>
            <DialogDescription>
              {editingType 
                ? 'Update the nature type details below.' 
                : 'Add a new nature type for categorizing complaints.'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ 
                  required: 'Name is required',
                  maxLength: { value: 100, message: 'Name must be less than 100 characters' }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., System Error, UI Issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                rules={{ 
                  required: 'Description is required',
                  maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe when this nature type should be used..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editingType && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Active
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editingType ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
