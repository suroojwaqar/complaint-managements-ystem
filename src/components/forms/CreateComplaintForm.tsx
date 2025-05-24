'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/lib/toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import FileUpload from '@/components/ui/FileUpload';

interface ComplaintFormData {
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
  department: string;
  natureType: string;
  remark?: string;
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

interface CreateComplaintFormProps {
  onSubmit: (data: ComplaintFormData & { attachments: any[] }) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateComplaintForm({ onSubmit, isLoading = false }: CreateComplaintFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [natureTypes, setNatureTypes] = useState<NatureType[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<ComplaintFormData>({
    defaultValues: {
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
      const [departmentsResponse, natureTypesResponse] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/nature-types'),
      ]);

      if (departmentsResponse.ok) {
        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData.departments || departmentsData.data || departmentsData);
      }

      if (natureTypesResponse.ok) {
        const natureTypesData = await natureTypesResponse.json();
        setNatureTypes(natureTypesData.natureTypes || natureTypesData.data || natureTypesData);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (data: ComplaintFormData) => {
    try {
      // Basic validation
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

      // Submit complaint without department - server will auto-assign
      await onSubmit({ ...data, attachments });
      form.reset();
      setAttachments([]);
      toast.success('Complaint submitted successfully! It will be assigned to the appropriate department.');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint');
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
    <Card>
      <CardHeader>
        <CardTitle>Create New Complaint</CardTitle>
        <CardDescription>
          Please provide detailed information about your issue to help us resolve it quickly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
            <Input placeholder="Brief summary of the issue" {...field} />
            </FormControl>
            <FormDescription>
            A short, descriptive title for your complaint
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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            Select the category that best describes your complaint
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                      placeholder="Please describe the issue in detail, including what happened, when it occurred, and any steps you took..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide as much detail as possible to help us understand and resolve your issue
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
                      What type of error or issue are you experiencing?
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
                      Which page or screen did the error occur on?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nature Type */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 text-sm">ℹ</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Automatic Department Assignment
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Your complaint will be automatically assigned to the appropriate department based on the nature type you selected. 
                    Our admin team will ensure it reaches the right team for quick resolution.
                  </p>
                </div>
              </div>
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
                      placeholder="Any additional information or context..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional information that might help resolve your issue
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
                  maxFiles={5}
                  maxFileSize={10}
                  existingFiles={attachments}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Upload screenshots, documents, or other files that might help us understand your issue
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center space-x-4">
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                    Submitting...
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  form.reset();
                  setAttachments([]);
                }}
                disabled={isLoading}
              >
                Reset Form
              </Button>

              {attachments.length > 0 && (
                <Badge variant="secondary">
                  {attachments.length} file(s) attached
                </Badge>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
