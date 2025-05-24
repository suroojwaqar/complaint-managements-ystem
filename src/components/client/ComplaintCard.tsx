import { Calendar, User } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ComplaintCardProps {
  complaint: {
    _id: string;
    title: string;
    description: string;
    errorType: string;
    errorScreen: string;
    status: string;
    department: {
      _id: string;
      name: string;
    };
    currentAssigneeId: {
      _id: string;
      name: string;
      email: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export default function ComplaintCard({ complaint }: ComplaintCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase().replace(' ', '-')) {
      case 'new':
        return 'new' as const;
      case 'assigned':
        return 'assigned' as const;
      case 'in-progress':
        return 'in-progress' as const;
      case 'completed':
        return 'completed' as const;
      case 'done':
        return 'done' as const;
      case 'closed':
        return 'closed' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate">{complaint.title}</CardTitle>
          <Badge variant={getStatusVariant(complaint.status)}>
            {complaint.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {complaint.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <User className="h-4 w-4 mr-2" />
            <span>Assigned to: {complaint.currentAssigneeId.name}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Created: {formatDate(complaint.createdAt)}</span>
          </div>
          <div className="text-muted-foreground">
            <span className="font-medium">Department:</span> {complaint.department.name}
          </div>
          <div className="text-muted-foreground">
            <span className="font-medium">Error Type:</span> {complaint.errorType}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button variant="link" asChild className="h-auto p-0">
          <Link href={`/client/complaints/${complaint._id}`}>
            View Details →
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Updated {formatDate(complaint.updatedAt)}
        </span>
      </CardFooter>
    </Card>
  );
}
