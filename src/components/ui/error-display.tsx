import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'destructive' | 'default';
  className?: string;
}

export function ErrorDisplay({ 
  title = 'Error', 
  message, 
  onRetry,
  variant = 'destructive',
  className 
}: ErrorDisplayProps) {
  const getIcon = () => {
    switch (variant) {
      case 'default': return Info;
      default: return AlertTriangle;
    }
  };

  const Icon = getIcon();

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          {Icon && (
            <div className="rounded-full bg-muted p-3">
              <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-muted-foreground max-w-md">{description}</p>
          </div>
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Network error component
interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
}

export function NetworkError({ 
  onRetry, 
  message = 'Network error. Please check your connection and try again.' 
}: NetworkErrorProps) {
  return (
    <ErrorDisplay
      title="Connection Error"
      message={message}
      onRetry={onRetry}
      variant="default"
    />
  );
}

// Not found component
interface NotFoundProps {
  title?: string;
  description?: string;
  onGoBack?: () => void;
}

export function NotFound({ 
  title = 'Not Found',
  description = 'The page or resource you\'re looking for doesn\'t exist.',
  onGoBack
}: NotFoundProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={description}
      action={onGoBack ? {
        label: 'Go Back',
        onClick: onGoBack
      } : undefined}
    />
  );
}
