'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateComplaintOnBehalfForm from '@/components/admin/CreateComplaintOnBehalfForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ManagerCreateComplaintOnBehalfPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/manager/complaints/${result._id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create complaint');
      }
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/manager/complaints');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/manager/complaints')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Complaints
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Complaint on Behalf of Client</h1>
              <p className="text-muted-foreground mt-1">
                Create a new complaint for a client who needs assistance
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <CreateComplaintOnBehalfForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
}
