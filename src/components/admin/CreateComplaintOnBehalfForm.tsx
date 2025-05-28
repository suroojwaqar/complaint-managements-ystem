'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { toast } from '@/lib/toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import FileUpload from '@/components/ui/FileUpload';
import { User, Building2, AlertCircle } from 'lucide-react';

interface ComplaintOnBehalfFormData {
  clientId: string;
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
  department?: string;
  natureType: string;
  remark?: string;
}

interface Client {
  _id: string;
  name: string;
  email: string;
}

interface Department {
  _id: string;
  name: string;
  description: string;
}

interface NatureType {
  _id: string;
  name: string;
  description: string;
}

interface CreateComplaintOnBehalfFormProps {
  onSubmit: (data: ComplaintOnBehalfFormData & { attachments: any[] }) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function CreateComplaintOnBehalfForm({ 
  onSubmit, 
  isLoading = false, 
  onCancel 
}: CreateComplaintOnBehalfFormProps) {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [natureTypes, setNatureTypes] = useState<NatureType[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const isAdmin = session?.user?.role === 'admin';
  const isManager = session?.user?.role === 'manager';

  const form = useForm<ComplaintOnBehalfFormData>({
    defaultValues: {
      clientId: '',
      title: '',
      description: '',
      errorType: '',
      errorScreen: '',
      department: '',
      natureType: '',
      remark: '',
    },
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      
      const requests = [
        fetch('/api/users?role=client'),
        fetch('/api/departments'),
        fetch('/api/nature-types'),
      ];

      const [clientsResponse, departmentsResponse, natureTypesResponse] = await Promise.all(requests);

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        const clientsArray = clientsData.users || clientsData.data || clientsData || [];
        setClients(Array.isArray(clientsArray) ? clientsArray : []);
      } else {
        console.error('Failed to fetch clients:', clientsResponse.status);
        toast.error('Failed to load clients');
      }

      if (departmentsResponse.ok) {
        const departmentsData = await departmentsResponse.json();
        const departmentsArray = departmentsData.departments || departmentsData.data || departmentsData || [];
        setDepartments(Array.isArray(departmentsArray) ? departmentsArray : []);
      } else {
        console.error('Failed to fetch departments:', departmentsResponse.status);
        toast.error('Failed to load departments');
      }

      if (natureTypesResponse.ok) {
        const natureTypesData = await natureTypesResponse.json();
        const natureTypesArray = natureTypesData.natureTypes || natureTypesData.data || natureTypesData || [];
        setNatureTypes(Array.isArray(natureTypesArray) ? natureTypesArray : []);
      } else {
        console.error('Failed to fetch nature types:', natureTypesResponse.status);
        toast.error('Failed to load nature types');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c._id === clientId);
    setSelectedClient(client || null);
    form.setValue('clientId', clientId);
  };

  const handleSubmit = async (data: ComplaintOnBehalfFormData) => {
    try {
      // Validation
      if (!data.clientId) {
        toast.error('Please select a client');
        return;
      }
      if (!data.title || data.title.length < 5) {
        toast.error('Title must be at least 5 characters');
        return;
      }
      if (!data.description || data.description.length < 20) {
        toast.error('Description must be at least 20 characters');
        return;
      }
      if (!data.errorType) {
        toast.error('Error type is required');
        return;
      }
      if (!data.errorScreen) {
        toast.error('Error screen is required');
        return;
      }
      if (!data.natureType) {
        toast.error('Nature type is required');
        return;
      }

      await onSubmit({ ...data, attachments });
      form.reset();
      setAttachments([]);
      setSelectedClient(null);
      toast.success('Complaint created successfully on behalf of the client!');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to create complaint');
    }
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Create Complaint on Behalf of Client</CardTitle>
            <CardDescription>
              As {isAdmin ? 'an admin' : 'a manager'}, you can create complaints for clients who need assistance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Client Selection */}
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Creating on Behalf of Client
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This complaint will be created on behalf of the selected client. The client will receive notifications and can track the progress.
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="clientId"
              rules={{ required: 'Client selection is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Client</FormLabel>
                  <Select onValueChange={handleClientChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose a client to create complaint for">
                          {selectedClient && (
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {selectedClient.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{selectedClient.name}</span>
                                <span className="text-xs text-muted-foreground">{selectedClient.email}</span>
                              </div>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No clients found
                        </div>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            <div className="flex items-center gap-3 py-1">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {client.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{client.name}</span>
                                <span className="text-xs text-muted-foreground">{client.email}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the client for whom you are creating this complaint
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                rules={{ 
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaint Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief summary of the client's issue" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short, descriptive title for the complaint
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="natureType"
                rules={{ required: 'Nature type is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select nature type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {natureTypes.map((natureType) => (
                          <SelectItem key={natureType._id} value={natureType._id}>
                            <div className="flex flex-col">
                              <span>{natureType.name}</span>
                              {natureType.description && (
                                <span className="text-xs text-muted-foreground">
                                  {natureType.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Category that best describes the complaint
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Department Selection (Admin only) */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Department (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value || '')} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-assign (Leave empty for automatic assignment)">
                            {field.value && departments.find(d => d._id === field.value) && (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>{departments.find(d => d._id === field.value)?.name}</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department._id} value={department._id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{department.name}</span>
                                {department.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {department.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Leave empty for automatic assignment based on nature type, or manually select a specific department
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              rules={{ 
                required: 'Description is required',
                minLength: { value: 20, message: 'Description must be at least 20 characters' }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the client's issue in detail, including what happened, when it occurred, and any steps taken..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide comprehensive details about the client's issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="errorType"
                rules={{ required: 'Error type is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Error Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., System Error, UI Issue, Performance" {...field} />
                    </FormControl>
                    <FormDescription>
                      Type of error or issue the client experienced
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="errorScreen"
                rules={{ required: 'Error screen is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Error Screen/Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Login Page, Dashboard, Settings" {...field} />
                    </FormControl>
                    <FormDescription>
                      Page or screen where the error occurred
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Remarks */}
            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional context, client communication details, or notes..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional information or context about the complaint
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div>
              <FormLabel>Attachments (Optional)</FormLabel>
              <div className="mt-2">
                <FileUpload
                  onFilesUpload={setAttachments}
                  maxFiles={10}
                  maxFileSize={25}
                  existingFiles={attachments}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Upload screenshots, documents, or other files related to the client's issue
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <Button type="submit" disabled={isLoading} className="min-w-[140px]">
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                      Creating...
                    </>
                  ) : (
                    'Create Complaint'
                  )}
                </Button>
                
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {selectedClient && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    For: {selectedClient.name}
                  </Badge>
                )}
                
                {attachments.length > 0 && (
                  <Badge variant="secondary">
                    {attachments.length} file(s) attached
                  </Badge>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}