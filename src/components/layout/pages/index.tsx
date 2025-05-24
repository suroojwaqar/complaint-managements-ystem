// Page Layout Design System
// Standardized components for consistent page design across the application

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Simple utility function
function classNames(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ============ PAGE CONTAINER ============
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={classNames('space-y-6', className)}>
      {children}
    </div>
  );
}

// ============ PAGE HEADER ============
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
  className?: string;
}

export function PageHeader({ title, description, actions, badge, className }: PageHeaderProps) {
  return (
    <div className={classNames('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {badge && (
            <Badge variant={badge.variant || 'secondary'}>
              {badge.text}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {actions}
        </div>
      )}
    </div>
  );
}

// ============ STATS GRID ============
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

function StatCard({ title, value, icon, description, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/50',
    green: 'border-l-green-500 bg-green-50/50 dark:bg-green-950/50',
    yellow: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/50',
    red: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/50',
    purple: 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/50',
    gray: 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-950/50',
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400',
  };

  return (
    <Card className={classNames('border-l-4', colorClasses[color])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={classNames('rounded-lg p-3', iconColorClasses[color])}>
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold">{value}</p>
                {trend && (
                  <span className={classNames(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={classNames('grid gap-4', gridClasses[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

// ============ CONTENT CARD ============
interface ContentCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ContentCard({ 
  title, 
  description, 
  children, 
  headerActions, 
  footer,
  className 
}: ContentCardProps) {
  return (
    <Card className={className}>
      {(title || description || headerActions) && (
        <CardHeader className={classNames(
          'flex flex-row items-center justify-between space-y-0 pb-6',
          !headerActions && 'pb-6'
        )}>
          <div className="space-y-1">
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-2">
              {headerActions}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={classNames(!(title || description || headerActions) && 'pt-6')}>
        {children}
      </CardContent>
      {footer && (
        <div className="border-t px-6 py-4">
          {footer}
        </div>
      )}
    </Card>
  );
}

// ============ FILTER BAR ============
interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ EMPTY STATE ============
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={classNames('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============ ERROR STATE ============
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  onRetry, 
  className 
}: ErrorStateProps) {
  return (
    <Card className={classNames('border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50', className)}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{title}</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{message}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ LOADING SKELETONS ============
export function StatsGridSkeleton({ columns = 4 }: { columns?: 2 | 3 | 4 }) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={classNames('grid gap-4', gridClasses[columns])}>
      {Array.from({ length: columns }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <PageContainer>
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <StatsGridSkeleton />

      {/* Content Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
            </div>
            <TableSkeleton />
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}