/**
 * StatCard - Reusable Statistics Card Component
 *
 * A unified card component for displaying statistical information.
 * Used across pricing pages to ensure consistency.
 *
 * Features:
 * - ✅ Configurable variants (info, success, warning, destructive, accent)
 * - ✅ Icon support
 * - ✅ Optional subtitle
 * - ✅ Hover effects
 * - ✅ RTL support
 *
 * @module StatCard
 */

import React from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { cn } from '@/presentation/components/ui/utils'

type StatCardVariant = 'info' | 'success' | 'warning' | 'destructive' | 'accent'

interface StatCardProps {
  /** The title/label of the statistic */
  title: string

  /** The main value to display (formatted string or number) */
  value: string | number

  /** Optional subtitle or additional info */
  subtitle?: string

  /** Icon component to display */
  icon: React.ReactNode

  /** Visual variant/theme of the card */
  variant: StatCardVariant

  /** Optional additional CSS classes */
  className?: string

  /** Whether to show hover effect */
  hoverable?: boolean

  /** Layout direction - horizontal or vertical */
  layout?: 'horizontal' | 'vertical'
}

const variantClasses: Record<StatCardVariant, string> = {
  info: 'border-info/30 text-info',
  success: 'border-success/30 text-success',
  warning: 'border-warning/30 text-warning',
  destructive: 'border-destructive/30 text-destructive',
  accent: 'border-accent/30 text-accent',
}

const iconClasses: Record<StatCardVariant, string> = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  accent: 'text-accent',
}

/**
 * StatCard Component
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="القيمة الإجمالية"
 *   value={formatCurrency(1250000)}
 *   subtitle="شامل ضريبة القيمة المضافة"
 *   icon={<DollarSign className="h-5 w-5" />}
 *   variant="success"
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant,
  className,
  hoverable = true,
  layout = 'horizontal',
}) => {
  return (
    <Card
      className={cn(
        variantClasses[variant],
        hoverable && 'hover:shadow-sm transition-shadow',
        'h-full',
        className,
      )}
    >
      <CardContent
        className={cn(
          'p-3',
          layout === 'horizontal'
            ? 'flex items-center justify-between'
            : 'flex flex-col items-center text-center space-y-2',
        )}
      >
        {layout === 'horizontal' ? (
          <>
            <div className="flex items-center gap-2">
              <div className={iconClasses[variant]}>{icon}</div>
              <span className="text-sm font-medium">{title}</span>
            </div>
            <div className="text-right">
              <div className={cn('text-lg font-bold', iconClasses[variant])}>{value}</div>
              {subtitle && (
                <div className="text-xs leading-tight text-muted-foreground">{subtitle}</div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={iconClasses[variant]}>{icon}</div>
            <div className="w-full">
              <div className="text-sm font-medium text-foreground mb-1">{title}</div>
              <div className="text-xl font-bold text-foreground">{value}</div>
              {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * StatCardGroup - Container for multiple StatCards
 *
 * @example
 * ```tsx
 * <StatCardGroup columns={3}>
 *   <StatCard {...props1} />
 *   <StatCard {...props2} />
 *   <StatCard {...props3} />
 * </StatCardGroup>
 * ```
 */
export const StatCardGroup: React.FC<{
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}> = ({ children, columns = 3, className }) => {
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-4',
  }[columns]

  return <div className={cn('grid gap-3', gridColsClass, className)}>{children}</div>
}
