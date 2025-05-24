'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Building2,
  ArrowRightLeft,
  Check,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/lib/toast';

interface Department {
  _id: string;
  name: string;
  managerId: {
    name: string;
    email: string;
  };
  defaultAssigneeId: {
    name: string;
    email: string;
  };
}

interface AssignDepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  currentDepartment: string;
  currentAssignee: string;
  onSuccess: () => void;
}

interface AssignFormData {
  department: string;
  notes: string;
}

export default function AssignDepartmentDialog({ 
  isOpen,
  onClose,
  complaintId, 
  currentDepartment, 
  currentAssignee,
  onSuccess 
}: AssignDepartmentDialogProps) {
  const { data: session } = useSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const form = useForm<AssignFormData>({
    defaultValues: {
      department: currentDepartment,
      notes: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        const departmentsArray = data.departments || data.data || data;
        if (Array.isArray(departmentsArray)) {
          setDepartments(departmentsArray.filter(dept => dept.isActive));
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (data: AssignFormData) => {
    if (data.department === currentDepartment) {
      toast.error('Please select a different department');
      return;
    }

    try {
      setAssigning(true);
      const loadingToast = toast.loading('Reassigning complaint to department...');

      const response = await fetch(`/api/complaints/${complaintId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department: data.department,
          notes: data.notes || `Complaint reassigned by admin`
        }),
      });

      toast.dismiss();

      if (response.ok) {
        const result = await response.json();
        toast.success('Complaint successfully reassigned to new department');
        form.reset();
        onClose();
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to reassign complaint');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error reassigning complaint:', error);
      toast.error('Network error occurred');
    } finally {
      setAssigning(false);
    }
  };

  // Only show for admins
  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Reassign Department
          </DialogTitle>
          <DialogDescription>
            Change the department responsible for handling this complaint
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAssign)} className="space-y-4">
                {/* Current Department */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Currently Assigned To:
                    </span>
                  </div>
                  <Badge variant="default" className="bg-blue-600">
                    {departments.find(d => d._id === currentDepartment)?.name || 'Loading...'}
                  </Badge>
                </div>

                {/* New Department Selection */}
                <FormField
                  control={form.control}
                  name="department"
                  rules={{ required: 'Please select a department' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reassign To Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select new department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem 
                              key={department._id} 
                              value={department._id}
                              disabled={department._id === currentDepartment}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{department.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Manager: {department.managerId.name}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the department that should handle this complaint
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assignment Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a note about why this complaint is being reassigned..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This note will be added to the complaint history
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={assigning}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={assigning}>
                    {assigning ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                        Reassigning...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Reassign Complaint
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}