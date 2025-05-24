import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  CircleCheck,
  XCircle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  'New': {
    variant: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
    icon: Bell,
  },
  'Assigned': {
    variant: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700',
    icon: AlertCircle,
  },
  'In Progress': {
    variant: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
    icon: Clock,
  },
  'Completed': {
    variant: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
    icon: CheckCircle2,
  },
  'Done': {
    variant: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700',
    icon: CircleCheck,
  },
  'Closed': {
    variant: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
    icon: XCircle,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function StatusBadge({ 
  status, 
  className, 
  showIcon = true, 
  size = 'md' 
}: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Closed;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium transition-colors',
        config.variant,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{status}</span>
    </Badge>
  );
}

// Utility function to get status color for non-badge usage
export function getStatusColor(status: string) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Closed;
  return {
    className: config.variant,
    icon: config.icon,
  };
}

// Predefined status constants to avoid typos
export const COMPLAINT_STATUSES = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DONE: 'Done',
  CLOSED: 'Closed',
} as const;

export type ComplaintStatus = typeof COMPLAINT_STATUSES[keyof typeof COMPLAINT_STATUSES];
