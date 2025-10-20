/**
 * Chart Loading Skeleton
 * 
 * Lightweight skeleton component for chart loading states.
 * Used with React.lazy() and Suspense for charts lazy loading.
 * 
 * Phase 1.5: Performance Optimization - Charts Lazy Loading
 * 
 * @author Desktop Management System Team
 * @version 1.0.0
 */

import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface ChartSkeletonProps {
  /** Chart title to show while loading */
  title?: string;
  /** Number of bars/lines to show in skeleton */
  items?: number;
  /** Chart height */
  height?: number;
}

/**
 * Skeleton component for chart loading states
 */
export function ChartSkeleton({ title, items = 5, height = 300 }: ChartSkeletonProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
      )}
      <CardContent>
        <div className="flex items-end justify-between gap-2" style={{ height: `${height}px` }}>
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <Skeleton 
                className="w-full" 
                style={{ height: `${Math.random() * 60 + 40}%` }} 
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact skeleton for small charts
 */
export function CompactChartSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton for pie/donut charts
 */
export function PieChartSkeleton({ title }: { title?: string }) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
      )}
      <CardContent className="flex items-center justify-center">
        <Skeleton className="h-64 w-64 rounded-full" />
      </CardContent>
      <CardContent className="flex gap-2 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ChartSkeleton;

